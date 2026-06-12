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

  const opencode = await createOpencode({
    timeout: Number(process.env.OPENCODE_SERVER_TIMEOUT_MS ?? 300000),
    config: {
      share: "disabled",
      autoupdate: "notify"
    }
  });

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

    const sessionId = session.data.id;

    const result = await opencode.client.session.prompt({
      path: { id: sessionId },
      body: body as never
    });

    await writeFile(
      path.join(input.logDir, `${input.phaseId}.opencode-result.json`),
      JSON.stringify(result, null, 2),
      "utf8"
    );

    const messages = await opencode.client.session.messages({
      path: { id: sessionId }
    });
    await writeFile(
      path.join(input.logDir, `${input.phaseId}.messages.json`),
      JSON.stringify(messages, null, 2),
      "utf8"
    );
  } finally {
    opencode.server.close();
  }
}

function buildModelOverride(): { providerID: string; modelID: string } | null {
  const providerID = process.env.OPENCODE_MODEL_PROVIDER;
  const modelID = process.env.OPENCODE_MODEL_ID;
  if (!providerID || !modelID) return null;
  return { providerID, modelID };
}
