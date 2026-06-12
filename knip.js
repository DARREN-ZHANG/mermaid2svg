export default {
  entry: [
    "dev.js",
    "minify.js",
    "sh/check.js",
    "test/compare.test.js",
    "plugin/serve.js",
    "plugin/markdown-it/src/index.js",
    "plugin/markdown-it/test.js",
    "plugin/marked/src/index.js",
    "plugin/marked/test.js",
    "plugin/remark/src/index.js",
    "plugin/remark/test.js",
    "sh/compile_i18n.js",
  ],
  ignore: ["demo/**", "lib/**", "plugin/*/lib/**", "plugin/*/src/*.d.ts", "./conf/**"],
  ignoreDependencies: ["@mathjax/mathjax-mhchem-font-extension", "oxfmt", "oxlint", "@1-/mdcheck"],
};
