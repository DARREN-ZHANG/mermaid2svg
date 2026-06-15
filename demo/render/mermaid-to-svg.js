import mermaid from "mermaid";

export const OK = 0,
  ERR_EMPTY = 1,
  ERR_PARSE = 2,
  ERR_RENDER = 3,
  ERR_TIMEOUT = 4;

const RENDER_TIMEOUT_MS = 10000;

let initialized = false,
  counter = 0;

// 渲染超时构造的标记错误，供 catch 中识别
const timeoutErr = () => {
  const err = new Error("render timeout after " + RENDER_TIMEOUT_MS + "ms");
  err.isTimeout = true;
  return err;
};

// 区分语法解析错误与渲染/布局错误
const classifyError = (err) => {
  const name = (err && err.name) || "",
    msg = (err && err.message) || String(err);
  if (/unknown.*diagram/i.test(name) || /parse|syntax|expecting/i.test(name + " " + msg)) {
    return [ERR_PARSE, msg];
  }
  return [ERR_RENDER, msg];
};

export const renderMermaidToSvg = async (mermaidText) => {
  if (!mermaidText || String(mermaidText).trim() === "") {
    return [ERR_EMPTY, "empty input"];
  }
  // 仅初始化一次
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      themeVariables: {
        fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
      },
    });
    initialized = true;
  }
  const render_id = "m2s-" + ++counter;
  let timer;
  const timeout_promise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(timeoutErr()), RENDER_TIMEOUT_MS);
  });
  try {
    const result = await Promise.race([mermaid.render(render_id, mermaidText), timeout_promise]);
    clearTimeout(timer);
    return [OK, result.svg, result.diagramType];
  } catch (err) {
    clearTimeout(timer);
    if (err && err.isTimeout) {
      return [ERR_TIMEOUT, err.message];
    }
    return classifyError(err);
  }
};
