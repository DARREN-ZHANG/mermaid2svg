// Beautiful Mermaid 主题调色板 + 派生色计算
// 调色板值逐字转录自 references/beautiful-mermaid/src/theme.ts 的 THEMES 导出
// 固定来源: commit 2ac8bbbb060ca0a65a6a21f3200bd99b1587b488 (v1.1.3)
//
// 派生色在 JS 侧按 sRGB 通道线性插值计算，语义对齐 theme.ts 的 MIX 权重
// (color-mix(in srgb, fg X%, bg))。派生结果作为 CSS 自定义属性内联设置到 <html>，
// 使 style.styl 的覆盖层只需 var(--m-x) 即可，避免在 Stylus 中使用 color-mix (in 关键字冲突)。
// 主题切换是纯 CSS 覆盖层，不修改渲染流程 (src/**)。

// CSS 来源与版本追溯 (HG-4)，同步写入 workflow/reports/theme-css-report.json
export const THEME_SOURCE = {
    repo: "lukilabs/beautiful-mermaid",
    url: "https://github.com/lukilabs/beautiful-mermaid",
    localPath: "references/beautiful-mermaid",
    sourceFile: "src/theme.ts",
    commit: "2ac8bbbb060ca0a65a6a21f3200bd99b1587b488",
    commitDate: "2026-05-06T12:53:19+02:00",
    version: "1.1.3",
  },
  DEFAULT_THEME = "mermaid-default",
  THEME_KEY = "m2s-theme",
  // 派生权重 (对齐 references/beautiful-mermaid/src/theme.ts MIX)
  MIX = { sec: 60, muted: 40, line: 50, arrow: 85, surface: 3, border: 20 },
  // 每个主题: [id, 显示名, { bg, fg, line?, accent?, muted? } | null]
  // null 表示哨兵主题 (mermaid-default)，不参与 CSS 覆盖
  THEMES = [
    [DEFAULT_THEME, "Mermaid Default", null],
    ["zinc-light", "Zinc Light", { bg: "#FFFFFF", fg: "#27272A" }],
    ["zinc-dark", "Zinc Dark", { bg: "#18181B", fg: "#FAFAFA" }],
    [
      "tokyo-night",
      "Tokyo Night",
      { bg: "#1a1b26", fg: "#a9b1d6", line: "#3d59a1", accent: "#7aa2f7", muted: "#565f89" },
    ],
    [
      "catppuccin-mocha",
      "Catppuccin Mocha",
      { bg: "#1e1e2e", fg: "#cdd6f4", line: "#585b70", accent: "#cba6f7", muted: "#6c7086" },
    ],
    [
      "nord",
      "Nord",
      { bg: "#2e3440", fg: "#d8dee9", line: "#4c566a", accent: "#88c0d0", muted: "#616e88" },
    ],
    [
      "github-light",
      "GitHub Light",
      { bg: "#ffffff", fg: "#1f2328", line: "#d1d9e0", accent: "#0969da", muted: "#59636e" },
    ],
    [
      "github-dark",
      "GitHub Dark",
      { bg: "#0d1117", fg: "#e6edf3", line: "#3d444d", accent: "#4493f8", muted: "#9198a1" },
    ],
    [
      "dracula",
      "Dracula",
      { bg: "#282a36", fg: "#f8f8f2", line: "#6272a4", accent: "#bd93f9", muted: "#6272a4" },
    ],
  ];

// #rgb | #rrggbb → [r, g, b] (0-255)
const parseHex = (hex) => {
    const h = hex.replace("#", ""),
      full =
        h.length === 3
          ? h
              .split("")
              .map((c) => c + c)
              .join("")
          : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  },
  toHex = (rgb) =>
    "#" +
    rgb
      .map((n) =>
        Math.round(Math.max(0, Math.min(255, n)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join(""),
  // sRGB 通道插值: fg 混入 bg 的 pct% (对齐 CSS color-mix(in srgb, fg pct%, bg))
  mix = (fg, bg, pct) => {
    const f = parseHex(fg),
      b = parseHex(bg),
      k = pct / 100;
    return toHex(b.map((bv, i) => bv + (f[i] - bv) * k));
  };

// 计算主题的 CSS 自定义属性集合 (含输入变量 + 派生变量)
// 哨兵主题 (palette=null) 返回 null，表示不应用覆盖层
export const themeVars = (id) => {
  const entry = THEMES.find(([tid]) => tid === id);
  if (!entry) return null;
  const palette = entry[2];
  if (!palette) return null;
  const { bg, fg, line, accent, muted } = palette;
  return {
    "--bg": bg,
    "--fg": fg,
    "--m-text": fg,
    "--m-sec": muted || mix(fg, bg, MIX.sec),
    "--m-muted": muted || mix(fg, bg, MIX.muted),
    "--m-line": line || mix(fg, bg, MIX.line),
    "--m-arrow": accent || mix(fg, bg, MIX.arrow),
    "--m-surface": mix(fg, bg, MIX.surface),
    "--m-border": mix(fg, bg, MIX.border),
  };
};

export default THEMES;
