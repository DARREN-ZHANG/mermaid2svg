import { createOpencode } from "@opencode-ai/sdk";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type OpenCodePhaseInput = {
  phaseId: string;
  promptFile: string;
  logDir: string;
};

export async function runOpenCodePhase(input: OpenCodePhaseInput): Promise<void> {
  const prompt = await readFile(input.promptFile, "utf8");
  await mkdir(input.logDir, { recursive: true });

  // 读取 opencode.jsonc 完整配置，SDK 会将其设为 OPENCODE_CONFIG_CONTENT
  // 如果只传部分配置，会覆盖 opencode.jsonc 中的 provider/model 等，导致 AI 调用失败
  const configPath = path.resolve("opencode.jsonc");
  const rawConfig = await readFile(configPath, "utf8");
  const fullConfig = JSON.parse(stripJsonComments(rawConfig));

  const opencode = await createOpencode({
    timeout: Number(process.env.OPENCODE_SERVER_TIMEOUT_MS ?? 300000),
    config: {
      ...fullConfig,
      share: "disabled",
      autoupdate: "notify"
    }
  });

  let sessionId: string | null = null;

  try {
    const session = await opencode.client.session.create({
      body: {
        title: `Init Loop / ${input.phaseId}`
      }
    });

    const model = buildModelOverride();
    const body: Record<string, unknown> = {
      parts: [
        {
          type: "text",
          text: prompt
        }
      ]
    };
    if (model) body.model = model;

    sessionId = session.data.id;
    await writeJson(path.join(input.logDir, `${input.phaseId}.session.json`), {
      phaseId: input.phaseId,
      promptFile: input.promptFile,
      sessionId,
      startedAt: new Date().toISOString()
    });

    // 使用 promptAsync 立即返回，避免同步等待导致的 HeadersTimeoutError
    await opencode.client.session.promptAsync({
      path: { id: sessionId },
      body: body as never
    });

    // 轮询 session 状态直到 idle（AI 处理完成）
    const pollIntervalMs = 10_000; // 10 秒
    const phaseTimeoutMs = Number(process.env.OPENCODE_PHASE_TIMEOUT_MS ?? 7_200_000); // 默认 2 小时
    const deadline = Date.now() + phaseTimeoutMs;
    let lastStatus = "unknown";
    let missingStatusPolls = 0;

    while (Date.now() < deadline) {
      const statusResult = await opencode.client.session.status();
      const statusMap = statusResult.data as Record<string, { type: string }>;
      const sessionStatus = statusMap?.[sessionId];
      await writeRuntimeDiagnostics(opencode, input, sessionId, lastStatus, statusMap);

      if (sessionStatus) {
        missingStatusPolls = 0;
        lastStatus = sessionStatus.type;
        if (sessionStatus.type === "idle") {
          console.log(`  Session ${sessionId} completed (status: idle)`);
          break;
        }
      } else {
        missingStatusPolls++;
        if (await sessionFinishedWithStop(opencode, sessionId)) {
          lastStatus = "idle";
          console.log(`  Session ${sessionId} completed (finish: stop)`);
          break;
        }
        if (missingStatusPolls >= 3) {
          throw new Error(`Phase ${input.phaseId} session ${sessionId} disappeared from status`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    if (lastStatus !== "idle") {
      throw new Error(
        `Phase ${input.phaseId} timed out after ${phaseTimeoutMs / 1000}s (last status: ${lastStatus})`
      );
    }

    // 写入结果摘要
    await writeFile(
      path.join(input.logDir, `${input.phaseId}.opencode-result.json`),
      JSON.stringify({ status: "completed", sessionId }, null, 2),
      "utf8"
    );

    // 获取 session 消息
    const messages = await opencode.client.session.messages({
      path: { id: sessionId }
    });
    await writeFile(
      path.join(input.logDir, `${input.phaseId}.messages.json`),
      JSON.stringify(messages, null, 2),
      "utf8"
    );
  } catch (error) {
    let messagesError: unknown = null;
    if (sessionId) {
      try {
        const messages = await opencode.client.session.messages({
          path: { id: sessionId }
        });
        await writeJson(path.join(input.logDir, `${input.phaseId}.messages.json`), messages);
      } catch (messagesFetchError) {
        messagesError = messagesFetchError;
      }
    }

    await writeJson(path.join(input.logDir, `${input.phaseId}.failure.json`), {
      phaseId: input.phaseId,
      promptFile: input.promptFile,
      sessionId,
      failedAt: new Date().toISOString(),
      error: serializeError(error),
      messagesError: messagesError ? serializeError(messagesError) : null
    });
    throw error;
  } finally {
    opencode.server.close();
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

async function sessionFinishedWithStop(
  opencode: Awaited<ReturnType<typeof createOpencode>>,
  sessionId: string
): Promise<boolean> {
  const messages = await opencode.client.session.messages({
    path: { id: sessionId }
  });
  return messagesFinishedWithStop(messages);
}

function messagesFinishedWithStop(messages: unknown): boolean {
  const data = (messages as { data?: unknown }).data;
  if (!Array.isArray(data)) return false;

  for (let index = data.length - 1; index >= 0; index--) {
    const message = data[index] as { info?: { role?: string; finish?: string } };
    if (message.info?.role !== "assistant") continue;
    return message.info.finish === "stop";
  }

  return false;
}

async function writeRuntimeDiagnostics(
  opencode: Awaited<ReturnType<typeof createOpencode>>,
  input: OpenCodePhaseInput,
  sessionId: string,
  lastStatus: string,
  statusMap: Record<string, { type: string }>
): Promise<void> {
  try {
    const childrenResult = await opencode.client.session.children({
      path: { id: sessionId }
    });
    const children = Array.isArray(childrenResult.data) ? childrenResult.data : [];

    await writeJson(path.join(input.logDir, `${input.phaseId}.status.json`), {
      phaseId: input.phaseId,
      sessionId,
      lastStatus,
      updatedAt: new Date().toISOString(),
      statusMap,
      children: children.map((child) => ({
        id: child.id,
        title: child.title,
        agent: child.agent,
        updated: child.time?.updated,
        tokens: child.tokens
      }))
    });

    for (const child of children) {
      try {
        const messages = await opencode.client.session.messages({
          path: { id: child.id }
        });
        await writeJson(path.join(input.logDir, `${input.phaseId}.child.${child.id}.messages.json`), messages);
      } catch (error) {
        await writeJson(path.join(input.logDir, `${input.phaseId}.child.${child.id}.messages-error.json`), {
          childId: child.id,
          error: serializeError(error),
          failedAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    await writeJson(path.join(input.logDir, `${input.phaseId}.status-error.json`), {
      phaseId: input.phaseId,
      sessionId,
      error: serializeError(error),
      failedAt: new Date().toISOString()
    });
  }
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return {
    name: "NonError",
    message: String(error)
  };
}

function buildModelOverride(): { providerID: string; modelID: string } | null {
  const providerID = process.env.OPENCODE_MODEL_PROVIDER;
  const modelID = process.env.OPENCODE_MODEL_ID;
  if (!providerID || !modelID) return null;
  return { providerID, modelID };
}

/** 去除 JSONC 中的单行和多行注释，保留字符串内部内容 */
function stripJsonComments(text: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  while (i < text.length) {
    if (inString) {
      result += text[i];
      if (text[i] === "\\" && i + 1 < text.length) {
        result += text[i + 1];
        i += 2;
        continue;
      }
      if (text[i] === '"') inString = false;
      i++;
    } else if (text[i] === '"') {
      inString = true;
      result += text[i];
      i++;
    } else if (text[i] === "/" && text[i + 1] === "/") {
      i += 2;
      while (i < text.length && text[i] !== "\n") i++;
    } else if (text[i] === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length - 1 && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
    } else {
      result += text[i];
      i++;
    }
  }
  return result;
}
