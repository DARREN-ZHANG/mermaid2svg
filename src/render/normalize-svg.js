// SVG 输出规范化模块
// 将 renderMermaidToSvg 返回的原始 SVG 归一化为稳定、可嵌入、确定性 (deterministic) 的输出
// 返回 [OK, normalizedSvg] | [errCode, message]
// 错误码从 100 起，与渲染层 (0-4) 错误码区分，便于组合调用时定位失败层级

export const OK = 0,
  ERR_NO_SVG = 100, // 输入不含 svg 根节点
  ERR_VIEWBOX = 101, // 无法确定可用坐标空间
  ERR_PARSE = 102; // SVG 标记解析或序列化失败

const SVG_NS = "http://www.w3.org/2000/svg",
  CANONICAL_ID = "mermaid-svg",
  SVG_MIME = "image/svg+xml";

// 从尺寸属性中提取数字（去除 px 等单位），无法解析返回 NaN
const numFromAttr = (val) => {
  if (val == null) return NaN;
  const m = /^([0-9]+(?:\.[0-9]+)?)/.exec(String(val).trim());
  return m ? parseFloat(m[1]) : NaN;
};

// 根据 width/height 推导 viewBox，无法推导返回 false
const ensureViewBox = (svg) => {
  const w = numFromAttr(svg.getAttribute("width")),
    h = numFromAttr(svg.getAttribute("height"));
  if (!(w > 0) || !(h > 0)) return false;
  svg.setAttribute("viewBox", "0 0 " + w + " " + h);
  return true;
};

// 收集根节点及其所有后代元素
const allElements = (root) => {
  const out = [root],
    desc = root.querySelectorAll("*");
  for (let i = 0; i < desc.length; ++i) out.push(desc[i]);
  return out;
};

// 移除所有 <script> 元素 —— 运行时 JS 隐患
const stripScripts = (root) => {
  const list = root.querySelectorAll("script");
  for (let i = 0; i < list.length; ++i) list[i].remove();
};

// 移除 on* 事件处理属性与 javascript: 链接
const stripUnsafeAttrs = (root) => {
  for (const el of allElements(root)) {
    const names = [];
    for (let i = 0; i < el.attributes.length; ++i) names.push(el.attributes[i].name);
    for (const name of names) {
      const lower = name.toLowerCase();
      if (lower.startsWith("on")) {
        el.removeAttribute(name);
        continue;
      }
      if (lower === "href" || lower === "xlink:href") {
        if (/^\s*javascript:/i.test(el.getAttribute(name) || "")) el.removeAttribute(name);
      }
    }
  }
};

// 归一化原始 SVG：返回 [OK, svg] | [errCode, msg]
export const normalizeSvg = (rawSvg) => {
  if (typeof rawSvg !== "string" || !/<svg[\s>]/i.test(rawSvg)) return [ERR_NO_SVG, "no svg root"];

  let doc;
  try {
    doc = new DOMParser().parseFromString(rawSvg, SVG_MIME);
  } catch (e) {
    return [ERR_PARSE, (e && e.message) || String(e)];
  }

  // DOMParser 不抛异常，解析错误以 parsererror 元素体现
  if (doc.querySelector("parsererror")) return [ERR_PARSE, "svg markup parse error"];

  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== "svg") return [ERR_NO_SVG, "no svg root"];

  // 确保命名空间存在
  if (!svg.getAttribute("xmlns")) svg.setAttribute("xmlns", SVG_NS);

  // viewBox：已有则保留，否则尝试从 width/height 推导
  if (!svg.hasAttribute("viewBox") && !ensureViewBox(svg))
    return [ERR_VIEWBOX, "cannot derive viewBox"];

  // 移除运行时 JS 隐患
  stripScripts(svg);
  stripUnsafeAttrs(svg);

  // 序列化
  let out;
  try {
    out = new XMLSerializer().serializeToString(svg);
  } catch (e) {
    return [ERR_PARSE, (e && e.message) || String(e)];
  }

  // 确定性输出：检测根 id 中的渲染标记，全局替换为规范 id
  // 覆盖根 id、#id 选择器、marker/clip id 与 url(#…) 引用
  const root_id = svg.getAttribute("id");
  if (root_id) out = out.split(root_id).join(CANONICAL_ID);

  return [OK, out];
};
