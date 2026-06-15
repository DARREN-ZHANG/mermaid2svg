import MERMAID_EXAMPLES from "./const/mermaidExamples.js";
import DEFAULT_LABELS from "./const/mermaidLabels.js";
import THEMES, { DEFAULT_THEME, THEME_KEY, themeVars } from "./const/themes.js";
import {
  renderMermaidToSvg,
  OK as RENDER_OK,
  ERR_EMPTY,
  ERR_PARSE,
  ERR_RENDER,
  ERR_TIMEOUT,
} from "./render/mermaid-to-svg.js";
import { normalizeSvg, OK as NORM_OK } from "./render/normalize-svg.js";
import { SIZE_DATA } from "./const/sizeData.js";
import { renderSizeChart } from "./webc/js/sizeChart.js";
import "./webc/Scroll.js";
import "./webc/I18n.js";
import { onLang } from "./webc/js/i18n.js";
import CODE from "./webc/I18n/CODE.js";

const translateMermaid = (src) => {
    const labels = { ...DEFAULT_LABELS, ...i18n.labels };
    return src.replace(/{{(\w+)}}/g, (_, key) => labels[key] || key);
  },
  translateWithLabels = (src, labels) => src.replace(/{{(\w+)}}/g, (_, key) => labels[key] || key);

// 动态加载所有 locale 模块，语言切换时按 code 取对应翻译
const I18N_MOD = import.meta.glob("./i18n/*.js", { eager: true }),
  getI18n = (langId) => {
    const code = CODE[langId] || "en",
      mod = I18N_MOD["./i18n/" + code + ".js"];
    return mod ? mod.default() : I18N_MOD["./i18n/en.js"].default();
  },
  applyI18n = (t) => {
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set("ui-title", t.title);
    set("ui-subtitle", t.subtitle);
    set("ui-usage-title", t.usage_title);
    set("ui-benchmark-title", t.benchmark_title);
    set("ui-benchmark-tip", t.benchmark_tip);
    set("ui-editor-title", t.editor_title);
    set("ui-editor-tip", t.editor_tip);
    set("ui-examples-title", t.examples_title);
    if (input) input.placeholder = t.editor_placeholder;
    // 主题标签
    const triggerEl = document.querySelector(".theme-trigger");
    if (triggerEl) triggerEl.title = t.theme_label;
    // SVG 操作按钮
    if (copy_btn) copy_btn.textContent = t.copy_svg;
    if (download_btn) download_btn.textContent = t.download_svg;
  };

let i18n = getI18n(0),
  current_svg = "",
  svg_actions,
  copy_btn,
  download_btn,
  copy_timer,
  dropdown_open = false,
  // renderInput 调用序号：用于丢弃过期异步结果，避免旧输入覆盖新输入
  render_seq = 0;

// 组合渲染 + 归一化，返回 [0, svg, type] | [errCode, msg]
const renderToSvg = async (mermaidText) => {
    const [code, raw, diagramType] = await renderMermaidToSvg(mermaidText);
    if (code !== RENDER_OK) return [code, raw];
    const [nCode, normalized] = normalizeSvg(raw);
    if (nCode !== NORM_OK) return [nCode, normalized];
    return [RENDER_OK, normalized, diagramType];
  },
  // 错误码 → i18n 提示
  errMsg = (code, msg) => {
    if (code === ERR_PARSE) return i18n.err_parse + ": " + msg;
    if (code === ERR_RENDER) return i18n.err_render + ": " + msg;
    if (code === ERR_TIMEOUT) return i18n.err_timeout;
    return i18n.err_output + ": " + msg;
  },
  input = document.getElementById("mermaid-input"),
  preview = document.getElementById("svg-preview"),
  status = document.getElementById("render-status"),
  grid = document.getElementById("examples-grid"),
  theme_switcher = document.getElementById("theme-switcher"),
  root = document.documentElement,
  // 主题切换: 在 <html> 设置 data-theme + 内联派生色变量，触发纯 CSS 覆盖层，无需重新渲染
  // 切换到非默认主题时 setProperty 覆盖同名变量；切回默认时移除 data-theme，覆盖层规则失效，
  // 残留的内联变量无人引用，无需逐个清理。
  applyTheme = (id) => {
    const active = THEMES.find(([tid]) => tid === id) ? id : DEFAULT_THEME,
      vars = themeVars(active);
    if (vars) {
      root.setAttribute("data-theme", active);
      for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    } else {
      root.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(THEME_KEY, active);
    } catch {}

    const triggerText = theme_switcher.querySelector(".theme-trigger-text"),
      triggerSwatch = theme_switcher.querySelector(".theme-trigger-swatch"),
      activeTheme = THEMES.find(([tid]) => tid === active);

    if (triggerText && activeTheme) {
      triggerText.textContent = activeTheme[1];
      const palette = activeTheme[2];
      if (palette) {
        triggerSwatch.style.display = "inline-block";
        triggerSwatch.style.background = palette.bg;
        triggerSwatch.style.borderColor = palette.line || palette.fg;
      } else {
        triggerSwatch.style.display = "none";
      }
    }

    theme_switcher.querySelectorAll(".theme-dropdown-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === active);
    });

    closeDropdown();
  },
  closeDropdown = () => {
    const dropdown = theme_switcher.querySelector(".theme-dropdown");
    if (dropdown) dropdown.classList.remove("is-open");
    dropdown_open = false;
  },
  toggleDropdown = (e) => {
    e.stopPropagation();
    const dropdown = theme_switcher.querySelector(".theme-dropdown");
    if (dropdown) {
      dropdown.classList.toggle("is-open");
      dropdown_open = dropdown.classList.contains("is-open");
    }
  },
  buildThemeButtons = () => {
    theme_switcher.innerHTML = "";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "theme-trigger";

    const swatch = document.createElement("span");
    swatch.className = "theme-swatch theme-trigger-swatch";

    const text = document.createElement("span");
    text.className = "theme-trigger-text";
    text.textContent = i18n.theme_label;

    const arrow = document.createElement("span");
    arrow.className = "theme-trigger-arrow";

    trigger.append(swatch, text, arrow);
    trigger.onclick = toggleDropdown;

    const dropdown = document.createElement("div");
    dropdown.className = "theme-dropdown";

    for (const [id, name, palette] of THEMES) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "theme-dropdown-item";
      item.dataset.theme = id;
      item.textContent = name;

      const itemSwatch = document.createElement("span");
      itemSwatch.className = "theme-swatch";
      if (palette) {
        itemSwatch.style.background = palette.bg;
        itemSwatch.style.borderColor = palette.line || palette.fg;
        itemSwatch.style.color = palette.fg;
      } else {
        itemSwatch.classList.add("is-default");
      }
      item.prepend(itemSwatch);

      item.onclick = (e) => {
        e.stopPropagation();
        applyTheme(id);
      };
      dropdown.append(item);
    }

    theme_switcher.append(trigger, dropdown);

    document.addEventListener("click", () => {
      if (dropdown_open) closeDropdown();
    });
  },
  adjustHeight = () => {
    const { style, scrollHeight } = input;
    style.height = "auto";
    style.height = scrollHeight + "px";
  },
  copySvg = async () => {
    if (!current_svg) return;
    let ok = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(current_svg);
        ok = true;
      } catch {}
    }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = current_svg;
      ta.style.cssText = "position:fixed;opacity:0;";
      document.body.append(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {}
      ta.remove();
    }
    status.textContent = ok ? i18n.copy_ok : i18n.copy_fail;
    status.classList.toggle("error", !ok);
    clearTimeout(copy_timer);
    copy_timer = setTimeout(() => {
      if (status.textContent === i18n.copy_ok || status.textContent === i18n.copy_fail) {
        status.textContent = "";
        status.classList.remove("error");
      }
    }, 1500);
  },
  downloadSvg = () => {
    if (!current_svg) return;
    const blob = new Blob([current_svg], { type: "image/svg+xml" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "mermaid.svg";
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  buildSvgActions = () => {
    svg_actions = document.querySelector(".svg-actions");
    copy_btn = document.createElement("button");
    copy_btn.type = "button";
    copy_btn.className = "Btn";
    copy_btn.onclick = copySvg;
    download_btn = document.createElement("button");
    download_btn.type = "button";
    download_btn.className = "Btn";
    download_btn.onclick = downloadSvg;
    svg_actions.append(copy_btn, download_btn);
    svg_actions.classList.add("is-hidden");
  },
  renderInput = async () => {
    const my_seq = ++render_seq;
    const [code, svg] = await renderToSvg(input.value);
    // 序号不匹配说明用户又输入了新内容，丢弃这次过期结果
    if (my_seq !== render_seq) return;
    if (code === RENDER_OK) {
      preview.innerHTML = svg;
      current_svg = svg;
      svg_actions.classList.remove("is-hidden");
      status.textContent = "";
      status.classList.remove("error");
    } else if (code === ERR_EMPTY) {
      preview.innerHTML = "";
      current_svg = "";
      svg_actions.classList.add("is-hidden");
      status.textContent = i18n.empty_hint;
      status.classList.remove("error");
    } else {
      preview.innerHTML = "";
      current_svg = "";
      svg_actions.classList.add("is-hidden");
      status.textContent = errMsg(code, svg);
      status.classList.add("error");
    }
  },
  selectExample = (src) => {
    input.value = translateMermaid(src);
    renderInput();
    adjustHeight();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  },
  renderExampleSvg = async (svg_box, src) => {
    const [code, svg] = await renderToSvg(translateMermaid(src));
    if (code === RENDER_OK) svg_box.innerHTML = svg;
  },
  buildCard = (entry, idx) => {
    const [, fallbackName, src] = entry,
      name = (i18n.names && i18n.names[idx]) || fallbackName,
      card = document.createElement("div"),
      h3 = document.createElement("h3"),
      code_div = document.createElement("div"),
      svg_box = document.createElement("div");

    card.className = "example-card Lg";
    card.dataset.src = src;
    card.onclick = () => selectExample(src);

    h3.textContent = name;

    code_div.className = "mermaid-code";
    code_div.textContent = translateMermaid(src);

    svg_box.className = "rendered-svg";

    card.append(h3, code_div, svg_box);
    return [card, svg_box];
  },
  usage_code =
    "// Render Mermaid source to SVG in the browser\n" +
    "import { renderMermaidToSvg } from './demo/render/mermaid-to-svg.js'\n" +
    "import { normalizeSvg } from './demo/render/normalize-svg.js'\n" +
    "\n" +
    "const [code, raw, type] = await renderMermaidToSvg('graph TD\\n  A --> B')\n" +
    "const [ok, svg] = normalizeSvg(raw)",
  init = async () => {
    // 构建 SVG 操作按钮（在应用翻译之前，确保按钮文本能被正确设置）
    buildSvgActions();

    // 语言切换回调 —— 更新 i18n 数据、应用翻译、重新渲染预览
    onLang((langId) => {
      const prevLabels = { ...DEFAULT_LABELS, ...i18n.labels };
      i18n = getI18n(langId);
      applyI18n(i18n);

      const currentVal = input.value.trim();
      if (currentVal) {
        const found = MERMAID_EXAMPLES.find(([, , rawSrc]) => {
          const rawTrim = rawSrc.trim();
          return (
            rawTrim === currentVal || translateWithLabels(rawSrc, prevLabels).trim() === currentVal
          );
        });
        if (found) {
          input.value = translateMermaid(found[2]);
          adjustHeight();
        }
      }

      renderInput();

      // 更新示例卡片标题、代码文本和 SVG 预览
      grid.querySelectorAll(".example-card").forEach((card, idx) => {
        const entry = MERMAID_EXAMPLES[idx];
        if (!entry) return;

        const h3 = card.querySelector("h3");
        if (h3 && i18n.names && i18n.names[idx]) h3.textContent = i18n.names[idx];

        const codeDiv = card.querySelector(".mermaid-code");
        if (codeDiv) codeDiv.textContent = translateMermaid(entry[2]);

        const svgBox = card.querySelector(".rendered-svg");
        if (svgBox) renderExampleSvg(svgBox, entry[2]);
      });

      // 重建体积对比图（图例标签跟随语言）
      const chartBox = document.getElementById("size-chart");
      if (chartBox) {
        chartBox.innerHTML = "";
        const cl = { raw: i18n.chart_raw, gzip: i18n.chart_gzip, smaller: i18n.chart_smaller };
        chartBox.append(renderSizeChart(SIZE_DATA, cl));
      }
    });

    // 初始应用英文翻译
    applyI18n(i18n);

    // 主题切换器构建 + 恢复上次主题 (默认 Mermaid 原生外观)
    buildThemeButtons();
    let saved_theme = DEFAULT_THEME;
    try {
      saved_theme = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
    } catch {}
    applyTheme(saved_theme);

    // 用法代码
    document.getElementById("ui-usage-code").textContent = usage_code;

    // 体积对比 SVG 柱状图
    const chartBox = document.getElementById("size-chart");
    if (chartBox) {
      chartBox.innerHTML = "";
      const chartLabels = {
        raw: i18n.chart_raw,
        gzip: i18n.chart_gzip,
        smaller: i18n.chart_smaller,
      };
      chartBox.append(renderSizeChart(SIZE_DATA, chartLabels));
    }

    // 默认输入第一个示例 —— 先渲染主预览，不被示例图库阻塞
    input.value = translateMermaid(MERMAID_EXAMPLES[0][2]);
    await renderInput();
    adjustHeight();

    // 示例图库：构建卡片后并发渲染缩略图
    grid.innerHTML = "";
    const cards = MERMAID_EXAMPLES.map((entry, idx) => {
      const [card, svg_box] = buildCard(entry, idx);
      grid.append(card);
      return { svg_box, src: entry[2] };
    });
    const jobs = cards.map(({ svg_box, src }) => renderExampleSvg(svg_box, src));
    await Promise.all(jobs);

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
  };

init();
