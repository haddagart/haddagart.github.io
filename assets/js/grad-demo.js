/* Interactive gradient explorer for "Why is training spiking networks harder?". No dependencies. */
(function () {
  var root = document.getElementById('grad-demo');
  if (!root) return;
  var p1 = root.querySelector('[data-p1]'), p2 = root.querySelector('[data-p2]');
  var rB = root.querySelector('[data-b]'), rL = root.querySelector('[data-lag]'), rK = root.querySelector('[data-k]'), rX = root.querySelector('[data-x]');
  var oB = root.querySelector('[data-ob]'), oL = root.querySelector('[data-ol]'), oK = root.querySelector('[data-ok]'), oX = root.querySelector('[data-ox]');
  var s1 = root.querySelector('[data-s1]'), s2 = root.querySelector('[data-s2]');
  var W = 400, H = 250, L = 46, R = 388, T = 16, B = 206;
  function pct(v) { return v >= 0.1 ? (v * 100).toFixed(0) + '%' : v >= 0.001 ? (v * 100).toFixed(1) + '%' : (v * 100).toFixed(3) + '%'; }
  function frame(xl, xr, xt) {
    var s = '<path class="thin" d="M' + L + ',' + T + ' L' + L + ',' + B + ' L' + R + ',' + B + '"/>';
    [0, 0.5, 1].forEach(function (v) { var y = B - v * (B - T); s += '<path class="thin dash" d="M' + L + ',' + y + ' L' + R + ',' + y + '"/><text class="m" x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + (v * 100) + '%</text>'; });
    xt.forEach(function (t) { var x = L + (t - xl) / (xr - xl) * (R - L); s += '<text class="m" x="' + x + '" y="' + (B + 18) + '" text-anchor="middle">' + t + '</text>'; });
    return s;
  }
  function draw() {
    var b = +rB.value, lag = +rL.value, k = +rK.value, x = +rX.value;
    oB.textContent = b.toFixed(3); oL.textContent = lag; oK.textContent = k; oX.textContent = x.toFixed(2);
    var X1 = function (v) { return L + v / 100 * (R - L); }, Y = function (v) { return B - v * (B - T); };
    var pts = [], i;
    for (i = 0; i <= 100; i++) pts.push(X1(i).toFixed(1) + ',' + Y(Math.pow(b, i)).toFixed(1));
    var g = Math.pow(b, lag);
    p1.innerHTML = frame(0, 100, [0, 25, 50, 75, 100]) + '<polyline class="hn" points="' + pts.join(' ') + '"/>' +
      '<path class="hline dash" d="M' + X1(lag) + ',' + Y(g) + ' L' + X1(lag) + ',' + B + '"/><circle class="hfs" cx="' + X1(lag) + '" cy="' + Y(g) + '" r="5.5"/>' +
      '<text class="m" x="' + R + '" y="' + (B + 38) + '" text-anchor="end">steps back in time</text>';
    s1.innerHTML = 'After <b>' + lag + '</b> steps, <b>' + pct(g) + '</b> of the gradient is left.';
    var X2 = function (v) { return L + (v + 2) / 4 * (R - L); }, sg = function (v) { return 1 / Math.pow(1 + k * Math.abs(v), 2); };
    var q = [];
    for (i = -200; i <= 200; i += 2) q.push(X2(i / 100).toFixed(1) + ',' + Y(sg(i / 100)).toFixed(1));
    var gv = sg(x);
    p2.innerHTML = frame(-2, 2, [-2, -1, 0, 1, 2]) + '<polyline class="hn" points="' + q.join(' ') + '"/>' +
      '<path class="thin dash" d="M' + X2(0) + ',' + T + ' L' + X2(0) + ',' + B + '"/>' +
      '<path class="hline dash" d="M' + X2(x) + ',' + Y(gv) + ' L' + X2(x) + ',' + B + '"/><circle class="hfs" cx="' + X2(x) + '" cy="' + Y(gv) + '" r="5.5"/>' +
      '<text class="m" x="' + R + '" y="' + (B + 38) + '" text-anchor="end">V − θ (distance from the threshold)</text>';
    s2.innerHTML = 'A neuron sitting <b>' + Math.abs(x).toFixed(2) + '</b> ' + (x < 0 ? 'below' : x > 0 ? 'above' : 'exactly at') + (x === 0 ? '' : ' the threshold') + ' receives <b>' + pct(gv) + '</b> of the learning signal.';
  }
  [rB, rL, rK, rX].forEach(function (r) { r.addEventListener('input', draw); });
  root.querySelectorAll('[data-preset]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var v = btn.getAttribute('data-preset').split(',');
      rB.value = v[0]; rL.value = v[1]; rK.value = v[2]; rX.value = v[3]; draw();
    });
  });
  draw();
})();
