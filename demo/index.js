import MERMAID_EXAMPLES from "./const/mermaidExamples.js";
import { renderMermaidToSvg, OK as RENDER_OK, ERR_EMPTY, ERR_PARSE, ERR_RENDER, ERR_TIMEOUT } from "../src/render/mermaid-to-svg.js";
import { normalizeSvg, OK as NORM_OK } from "../src/render/normalize-svg.js";
import "./webc/Scroll.js";
import "./webc/I18n.js";
import { onLang } from "./webc/js/i18n.js";

// 组合渲染 + 归一化，返回 [0, svg, type] | [errCode, msg]
const renderToSvg = async (mermaidText) => {
    const [code, raw, diagramType] = await renderMermaidToSvg(mermaidText);
    if (code !== RENDER_OK) return [code, raw];
    const [nCode, normalized] = normalizeSvg(raw);
    if (nCode !== NORM_OK) return [nCode, normalized];
    return [RENDER_OK, normalized, diagramType];
  },
  // 错误码 → 英文提示
  errMsg = (code, msg) => {
    if (code === ERR_PARSE) return "Parse error: " + msg;
    if (code === ERR_RENDER) return "Render error: " + msg;
    if (code === ERR_TIMEOUT) return "Render timed out";
    return "Output error: " + msg;
  },
  input = document.getElementById("mermaid-input"),
  preview = document.getElementById("svg-preview"),
  status = document.getElementById("render-status"),
  grid = document.getElementById("examples-grid"),
  adjustHeight = () => {
    const { style, scrollHeight } = input;
    style.height = "auto";
    style.height = scrollHeight + "px";
  },
  // TODO(i18n-loop): extract to key
  EMPTY_HINT = "Enter Mermaid source to see SVG preview",
  renderInput = async () => {
    const [code, svg] = await renderToSvg(input.value);
    if (code === RENDER_OK) {
      preview.innerHTML = svg;
      status.textContent = "";
      status.classList.remove("error");
    } else if (code === ERR_EMPTY) {
      preview.innerHTML = "";
      status.textContent = EMPTY_HINT;
      status.classList.remove("error");
    } else {
      preview.innerHTML = "";
      status.textContent = errMsg(code, svg);
      status.classList.add("error");
    }
  },
  selectExample = (src) => {
    input.value = src;
    renderInput();
    adjustHeight();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus();
    input.setSelectionRange(src.length, src.length);
  },
  buildCard = (entry) => {
    const [, name, src] = entry,
      card = document.createElement("div"),
      h3 = document.createElement("h3"),
      code_div = document.createElement("div"),
      svg_box = document.createElement("div");

    card.className = "example-card Lg";
    card.onclick = () => selectExample(src);

    h3.textContent = name;

    code_div.className = "mermaid-code";
    code_div.textContent = src;

    svg_box.className = "rendered-svg";

    card.append(h3, code_div, svg_box);
    return [card, svg_box];
  },
  layoutWaterfall = () => {
    const { clientWidth: container_width } = grid,
      gap = 24,
      cards = grid.querySelectorAll(".example-card");

    let num_cols = 1;
    if (container_width > 968) {
      num_cols = 3;
    } else if (container_width > 600) {
      num_cols = 2;
    }

    const card_width = (container_width - (num_cols - 1) * gap) / num_cols,
      col_heights = Array.from({ length: num_cols }, () => 0);

    cards.forEach((card) => {
      let min_col = 0;
      for (let i = 1; i < num_cols; ++i) {
        if (col_heights[i] < col_heights[min_col]) {
          min_col = i;
        }
      }

      const { style } = card;
      style.width = card_width + "px";
      style.left = min_col * (card_width + gap) + "px";
      style.top = col_heights[min_col] + "px";

      col_heights[min_col] += card.offsetHeight + gap;
    });

    grid.style.height = Math.max(...col_heights) + "px";
  },
  // TODO(i18n-loop): extract to key
  usage_code =
    "// Render Mermaid source to SVG in the browser\n" +
    "import { renderMermaidToSvg } from './src/render/mermaid-to-svg.js'\n" +
    "import { normalizeSvg } from './src/render/normalize-svg.js'\n" +
    "\n" +
    "const [code, raw, type] = await renderMermaidToSvg('graph TD\\n  A --> B')\n" +
    "const [ok, svg] = normalizeSvg(raw)",
  init = async () => {
    // 语言切换回调 —— 示例图与语言无关，仅注册保持 c-i18n 功能正常
    onLang(() => {});

    // 用法代码
    document.getElementById("ui-usage-code").textContent = usage_code;

    // 示例图库：构建卡片 + 异步渲染
    grid.innerHTML = "";
    ro.disconnect();

    for (const entry of MERMAID_EXAMPLES) {
      const [card, svg_box] = buildCard(entry),
        src = entry[2];
      grid.append(card);
      ro.observe(card);
      const [code, svg] = await renderToSvg(src);
      if (code === RENDER_OK) svg_box.innerHTML = svg;
    }

    // 默认输入第一个示例
    input.value = MERMAID_EXAMPLES[0][2];
    await renderInput();
    adjustHeight();

    // 防抖渲染
    let timer;
    input.oninput = () => {
      adjustHeight();
      clearTimeout(timer);
      timer = setTimeout(renderInput, 250);
    };

    // 进入视口时聚焦
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
            input.focus();
            obs.disconnect();
          }
        });
      },
      { threshold: 1.0 },
    );
    obs.observe(input);

    // 瀑布流布局
    setTimeout(layoutWaterfall, 50);
    setTimeout(layoutWaterfall, 300);

    window.addEventListener("resize", layoutWaterfall);
  };

const ro = new ResizeObserver(() => {
  layoutWaterfall();
});

init();
