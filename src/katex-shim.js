// Shim: redirect katex imports to the globally-loaded CDN version.
// This avoids Rolldown breaking KaTeX's internal function registry
// during production bundling (Vite 8 / Rolldown bug).
const katex = window.katex;
export default katex;
export const { render, renderToString, version, ParseError } = katex;
