/* Interactive leaky integrate-and-fire neuron for the "Spiking neurons" post. No dependencies. */
(function () {
  var root = document.getElementById('lif-demo');
  if (!root) return;
  var cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  var rI = root.querySelector('[data-i]'), rB = root.querySelector('[data-b]'), rT = root.querySelector('[data-t]'), rN = root.querySelector('[data-noise]');
  var oI = root.querySelector('[data-oi]'), oB = root.querySelector('[data-ob]'), oT = root.querySelector('[data-ot]'), oN = root.querySelector('[data-on]');
  var stat = root.querySelector('[data-stat]'), playBtn = root.querySelector('[data-play]'), resetBtn = root.querySelector('[data-reset]');
  var STEPS = 120, YMAX = 2.4, v = 0, hist = [], playing = true, last = 0, acc = 0, visible = true, w = 0, h = 0, dpr = 1;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var probe = document.createElement('span'); probe.style.display = 'none'; root.appendChild(probe);
  function col(name) { probe.style.color = 'var(' + name + ')'; return getComputedStyle(probe).color; }
  function params() { return { I: +rI.value, b: +rB.value, th: +rT.value, nz: +rN.value }; }
  function labels() {
    var p = params();
    oI.textContent = p.I.toFixed(2); oB.textContent = p.b.toFixed(2); oT.textContent = p.th.toFixed(2); oN.textContent = p.nz.toFixed(2);
  }
  function step() {
    var p = params(), s = false, shown;
    v = p.b * v + p.I + (Math.random() - 0.5) * 2 * p.nz;
    if (v < 0) v = 0;
    shown = v;
    if (v >= p.th) { s = true; v = 0; shown = Math.min(shown, YMAX * 0.98); }
    hist.push({ v: shown, s: s });
    if (hist.length > STEPS) hist.shift();
  }
  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function draw() {
    var p = params(), text = col('--text'), muted = col('--muted'), honey = col('--honey');
    var L = 44, R = w - 12, T = 14, B = h - 56, pw = R - L, ph = B - T;
    function X(i) { return L + (i / (STEPS - 1)) * pw; }
    function Y(val) { return B - (val / YMAX) * ph; }
    ctx.clearRect(0, 0, w, h);
    ctx.font = '12px sans-serif'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = muted; ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.setLineDash([2, 5]);
    [0, 1, 2].forEach(function (g) { ctx.beginPath(); ctx.moveTo(L, Y(g)); ctx.lineTo(R, Y(g)); ctx.stroke(); });
    ctx.globalAlpha = 1; ctx.setLineDash([]);
    ctx.fillStyle = muted; ctx.textAlign = 'right';
    [0, 1, 2].forEach(function (g) { ctx.fillText(String(g), L - 8, Y(g)); });
    ctx.textAlign = 'left'; ctx.fillText('V', 8, T + 4);
    ctx.strokeStyle = honey; ctx.lineWidth = 1.8; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(L, Y(p.th)); ctx.lineTo(R, Y(p.th)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = honey; ctx.textAlign = 'right'; ctx.fillText('threshold θ', R - 4, Y(p.th) - 9);
    var off = STEPS - hist.length;
    ctx.strokeStyle = text; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath();
    hist.forEach(function (d, i) {
      var x = X(i + off), y = Y(d.v);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      if (d.s) { ctx.lineTo(x, Y(0)); }
    });
    ctx.stroke();
    ctx.strokeStyle = muted; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(L, B + 18); ctx.lineTo(R, B + 18); ctx.stroke(); ctx.globalAlpha = 1;
    var n = 0;
    ctx.strokeStyle = honey; ctx.lineWidth = 3; ctx.lineCap = 'round';
    hist.forEach(function (d, i) {
      if (!d.s) return; n++;
      var x = X(i + off); ctx.beginPath(); ctx.moveTo(x, B + 28); ctx.lineTo(x, B + 46); ctx.stroke();
      ctx.beginPath(); ctx.setLineDash([2, 4]); ctx.globalAlpha = 0.45; ctx.lineWidth = 1; ctx.moveTo(x, T); ctx.lineTo(x, B); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.lineWidth = 3;
    });
    ctx.fillStyle = muted; ctx.textAlign = 'left'; ctx.fillText('spikes', 8, B + 37);
    var minI = p.th * (1 - p.b);
    var verdict = p.I < minI - 1e-9 && p.nz < 0.05 ? 'Below that, the neuron never fires.' : 'Above that, it fires.';
    stat.innerHTML = 'Spikes in the last ' + STEPS + ' steps: <b>' + n + '</b> · smallest steady input that can ever make it fire: <b>θ(1 − β) = ' + minI.toFixed(2) + '</b>. ' + verdict;
  }
  function loop(ts) {
    if (playing && visible) {
      acc += Math.min(ts - last, 100); 
      while (acc >= 55) { step(); acc -= 55; }
      draw();
    }
    last = ts; requestAnimationFrame(loop);
  }
  function warm() { hist = []; v = 0; for (var i = 0; i < STEPS; i++) step(); }
  [rI, rB, rT, rN].forEach(function (r) { r.addEventListener('input', function () { labels(); if (!playing) draw(); }); });
  playBtn.addEventListener('click', function () { playing = !playing; playBtn.textContent = playing ? 'Pause' : 'Play'; playBtn.setAttribute('aria-pressed', String(!playing)); });
  resetBtn.addEventListener('click', function () { warm(); draw(); });
  root.querySelectorAll('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      var q = b.getAttribute('data-preset').split(',');
      rI.value = q[0]; rB.value = q[1]; rT.value = q[2]; rN.value = q[3]; labels(); warm(); draw();
    });
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.05 }).observe(root);
  if (reduce) { playing = false; playBtn.textContent = 'Play'; playBtn.setAttribute('aria-pressed', 'true'); }
  window.addEventListener('resize', resize);
  labels(); warm(); resize(); requestAnimationFrame(loop);
})();
