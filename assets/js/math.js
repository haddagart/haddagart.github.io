/* LaTeX in posts: set `math: true` in the front matter. KaTeX is self-hosted (assets/katex).
   Kramdown turns $$ ... $$ into <script type="math/tex"> tags (handled by mathtex-script-type.js);
   auto-render below also catches \( ... \), \[ ... \] and $$ ... $$ left as plain text. */
(function () {
  if (typeof renderMathInElement !== 'function') return;
  var root = document.querySelector('.prose') || document.body;
  renderMathInElement(root, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false }
    ],
    throwOnError: false
  });
})();
