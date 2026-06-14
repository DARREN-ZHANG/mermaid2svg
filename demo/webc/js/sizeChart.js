const SVG_NS = "http://www.w3.org/2000/svg",
  W = 440, H = 280,
  LEFT = 50, RIGHT = 420, TOP = 30, BOTTOM = 210,
  PLOT_H = BOTTOM - TOP,
  BAR_W = 42,
  FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  C_BM = "#94a3b8",
  C_OURS = "var(--accent-color)",
  OP_GZIP = 0.38,
  // 每组柱子 x: [raw_x, gzip_x]
  POS = [[115, 161], [268, 314]],
  // 组中心 x (用于标签)
  CX = [159, 312],
  // 字节 → KB
  fmtKb = (bytes) => {
    const kb = bytes / 1024;
    return (kb >= 100 ? Math.round(kb) : kb.toFixed(1)) + "K";
  },
  // 计算 y 轴刻度 → [step_kb, max_kb]
  niceScale = (max_bytes) => {
    const max_kb = max_bytes / 1024,
      raw = max_kb / 5,
      mag = Math.pow(10, Math.floor(Math.log10(raw))),
      n = raw / mag,
      s = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
    return [s, Math.ceil(max_kb / s) * s];
  },
  // SVG 元素工厂
  el = (tag, attrs) => {
    const e = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  },
  // 设置 fill，兼容 CSS 变量
  setFill = (e, fill) => {
    if (!fill) return e;
    if (fill.startsWith("var(")) e.style.fill = fill;
    else e.setAttribute("fill", fill);
    return e;
  },
  // 文本元素
  text = (str, x, y, attrs) => {
    const { fill, ...rest } = attrs || {},
      t = el("text", { x, y, ...rest });
    t.textContent = str;
    return setFill(t, fill);
  },
  // 柱子 → [rect, top_y]
  bar = (x, val, max_val, fill, opacity) => {
    const h = (val / max_val) * PLOT_H,
      y = BOTTOM - h,
      rx = Math.min(4, h / 2);
    return [
      setFill(
        el("rect", { x, y, width: BAR_W, height: h, rx, ry: rx, opacity, filter: "url(#bs)" }),
        fill,
      ),
      y,
    ];
  };

export const renderSizeChart = (data) => {
  const { beautifulMermaid: bm, ours } = data,
    [step_kb, max_kb] = niceScale(Math.max(bm.rawBytes, ours.rawBytes)),
    max_bytes = max_kb * 1024,
    groups = [
      [bm.rawBytes, bm.gzipBytes, C_BM, POS[0]],
      [ours.rawBytes, ours.gzipBytes, C_OURS, POS[1]],
    ],
    ratio = (bm.rawBytes / ours.rawBytes).toFixed(1),
    svg = el("svg", { viewBox: "0 0 " + W + " " + H });

  svg.style.fontFamily = FONT;

  // 阴影滤镜
  const filter = el("filter", { id: "bs", x: "-20%", y: "-20%", width: "140%", height: "140%" }),
    defs = el("defs");
  filter.append(
    el("feDropShadow", { dx: "0", dy: "1", stdDeviation: "1.2", "flood-opacity": "0.12" }),
  );
  defs.append(filter);

  // 图例: raw 实心 / gzip 半透明
  const legend = el("g");
  legend.append(
    el("rect", { x: LEFT, y: 4, width: 12, height: 12, rx: 2, fill: "#64748b" }),
    text("Raw", LEFT + 18, 14, { "font-size": 12, fill: "#64748b" }),
    el("rect", {
      x: LEFT + 60, y: 4, width: 12, height: 12, rx: 2, fill: "#64748b", opacity: OP_GZIP,
    }),
    text("Gzip", LEFT + 78, 14, { "font-size": 12, fill: "#64748b" }),
  );

  svg.append(defs, legend);

  // 网格线 + y 轴标签
  const ticks = Math.round(max_kb / step_kb);
  for (let i = 0; i <= ticks; ++i) {
    const kb = i * step_kb,
      y = BOTTOM - ((kb * 1024) / max_bytes) * PLOT_H;
    svg.append(
      el("line", {
        x1: LEFT, y1: y, x2: RIGHT, y2: y,
        stroke: i === 0 ? "#cbd5e1" : "#edf2f7",
        "stroke-width": 1,
        "stroke-dasharray": i === 0 ? "" : "3 4",
      }),
    );
    if (i > 0)
      svg.append(
        text(kb + "K", LEFT - 6, y + 3, {
          "text-anchor": "end", "font-size": 10, fill: "#94a3b8",
        }),
      );
  }

  // 柱子 + 数值标签
  for (const [raw_b, gzip_b, fill, [raw_x, gzip_x]] of groups) {
    const [raw_rect, raw_y] = bar(raw_x, raw_b, max_bytes, fill, 1),
      [gzip_rect, gzip_y] = bar(gzip_x, gzip_b, max_bytes, fill, OP_GZIP);
    svg.append(
      raw_rect,
      gzip_rect,
      text(fmtKb(raw_b), raw_x + BAR_W / 2, raw_y - 6, {
        "text-anchor": "middle", "font-size": 11, "font-weight": "600", fill: "#334155",
      }),
      text(fmtKb(gzip_b), gzip_x + BAR_W / 2, gzip_y - 5, {
        "text-anchor": "middle", "font-size": 10, fill: "#94a3b8",
      }),
    );
  }

  // x 轴分组标签 (从数据 label 取值，避免硬编码)
  svg.append(
    text(bm.label, CX[0], BOTTOM + 18, {
      "text-anchor": "middle", "font-size": 11, "font-weight": "500", fill: "#475569",
    }),
    text(ours.label, CX[1], BOTTOM + 18, {
      "text-anchor": "middle", "font-size": 11, "font-weight": "600", fill: C_OURS,
    }),
    text(ratio + "\u00d7 smaller", W / 2, H - 22, {
      "text-anchor": "middle", "font-size": 14, "font-weight": "700", fill: C_OURS,
    }),
  );

  return svg;
};
