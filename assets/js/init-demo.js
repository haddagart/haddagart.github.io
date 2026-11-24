/* Initialisation lab for "Surrogate gradients in practice". A small LIF layer is simulated live in the browser. */
(function () {
  var root = document.getElementById('init-demo');
  if (!root) return;
  var N_IN = 200, N = 300, T = 100, RATE = 0.1, BETA = 0.9, THETA = 1;
  var svg = root.querySelector('[data-plot]');
  var sel = root.querySelector('[data-sur]'), rK = root.querySelector('[data-k]'), rG = root.querySelector('[data-g]');
  var oK = root.querySelector('[data-ok]'), oG = root.querySelector('[data-og]');
  var st = { rate: root.querySelector('[data-rate]'), silent: root.querySelector('[data-silent]'), inwin: root.querySelector('[data-inwin]'), sd: root.querySelector('[data-sd]') };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rand = rng(7), i, t, n;
  function gauss() { var u = 1 - rand(), v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  var Z = new Float32Array(N_IN * N); for (i = 0; i < Z.length; i++) Z[i] = gauss();
  var S = []; for (t = 0; t < T; t++) { var row = []; for (i = 0; i < N_IN; i++) if (rand() < RATE) row.push(i); S.push(row); }
  var sigma0 = THETA * Math.sqrt(1 - BETA * BETA) / Math.sqrt(N_IN * RATE);
  var C = new Float32Array(T * N);
  for (t = 0; t < T; t++) for (n = 0; n < N; n++) { var a = 0, r = S[t]; for (i = 0; i < r.length; i++) a += Z[r[i] * N + n]; C[t * N + n] = a * sigma0; }
  var F = {
    rect: function (x, k) { return Math.abs(x) < 1 / k ? 1 : 0; },
    tri: function (x, k) { return Math.max(0, 1 - k * Math.abs(x)); },
    fast: function (x, k) { return 1 / Math.pow(1 + k * Math.abs(x), 2); },
    atan: function (x, k) { return 1 / (1 + k * k * x * x); },
    sig: function (x, k) { var e = Math.exp(Math.min(30, k * Math.abs(x))); return 4 / Math.pow(e + 1 / e, 2); }
  };
  var XL = -3, XR = 2, W = 400, H = 250, L = 14, R = 388, TP = 14, B = 206, NB = 50;
  function X(x) { return L + (x - XL) / (XR - XL) * (R - L); }
  function run() {
    var g = +rG.value, k = +rK.value, f = F[sel.value];
    oG.textContent = g.toFixed(2); oK.textContent = k;
    var V = new Float32Array(N), fired = new Uint8Array(N), bins = new Array(NB).fill(0), spikes = 0, inwin = 0, tot = 0, sum = 0, sum2 = 0;
    for (t = 0; t < T; t++) for (n = 0; n < N; n++) {
      var v = BETA * V[n] + g * C[t * N + n], x = v - THETA;
      var b = Math.floor((x - XL) / (XR - XL) * NB); b = Math.max(0, Math.min(NB - 1, b)); bins[b]++;
      sum += v; sum2 += v * v; tot++;
      if (f(x, k) >= 0.1) inwin++;
      if (v >= THETA) { spikes++; fired[n] = 1; v = 0; }
      V[n] = v;
    }
    var silent = 0; for (n = 0; n < N; n++) if (!fired[n]) silent++;
    var mx = Math.max.apply(null, bins) || 1, s = '<path class="thin" d="M' + L + ',' + B + ' L' + R + ',' + B + '"/>', y = function (v) { return B - v * (B - TP); };
    // learning window (where the surrogate is at least 10% of its peak)
    var win = '', xs = [], inW = false, x0 = 0, step = 0.01;
    for (var xx = XL; xx <= XR + 1e-9; xx += step) { var ok = f(xx, k) >= 0.1; if (ok && !inW) { x0 = xx; inW = true; } if (!ok && inW) { win += '<rect class="win" x="' + X(x0) + '" y="' + TP + '" width="' + Math.max(1, X(xx) - X(x0)) + '" height="' + (B - TP) + '"/>'; inW = false; } }
    if (inW) win += '<rect class="win" x="' + X(x0) + '" y="' + TP + '" width="' + (X(XR) - X(x0)) + '" height="' + (B - TP) + '"/>';
    s += win;
    for (i = 0; i < NB; i++) { var bx = X(XL + i * (XR - XL) / NB), bw = (R - L) / NB - 1, bh = bins[i] / mx * (B - TP) * 0.9; s += '<rect class="bar" x="' + bx + '" y="' + (B - bh) + '" width="' + bw + '" height="' + bh + '"/>'; }
    var pts = []; for (xx = XL; xx <= XR + 1e-9; xx += 0.02) pts.push(X(xx).toFixed(1) + ',' + y(f(xx, k)).toFixed(1));
    s += '<polyline class="hn" points="' + pts.join(' ') + '"/>';
    s += '<path class="hline dash" d="M' + X(0) + ',' + TP + ' L' + X(0) + ',' + B + '"/><text class="m" x="' + X(0) + '" y="' + (TP + 11) + '" text-anchor="start"> θ</text>';
    [-3, -2, -1, 0, 1, 2].forEach(function (v) { s += '<text class="m" x="' + X(v) + '" y="' + (B + 18) + '" text-anchor="middle">' + v + '</text>'; });
    s += '<text class="m" x="' + R + '" y="' + (B + 38) + '" text-anchor="end">V − θ before the reset (grey bars: all neurons, all steps)</text>';
    svg.innerHTML = s;
    var mean = sum / tot, sd = Math.sqrt(sum2 / tot - mean * mean);
    st.rate.textContent = (spikes / tot * 100).toFixed(1) + '%';
    st.silent.textContent = (silent / N * 100).toFixed(0) + '%';
    st.inwin.textContent = (inwin / tot * 100).toFixed(1) + '%';
    st.sd.textContent = sd.toFixed(2);
  }
  [sel, rK, rG].forEach(function (e) { e.addEventListener('input', run); });
  root.querySelectorAll('[data-preset]').forEach(function (btn) {
    btn.addEventListener('click', function () { var v = btn.getAttribute('data-preset').split(','); sel.value = v[0]; rK.value = v[1]; rG.value = v[2]; run(); });
  });
  run();
})();
