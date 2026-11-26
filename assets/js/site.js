/* Motion preference: the system setting, unless the visitor chose full or calm motion (footer switch). */
window.siteReducedMotion = function () {
  var m = document.documentElement.getAttribute('data-motion');
  if (m === 'full') return false;
  if (m === 'calm') return true;
  return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
};
// Theme toggle, mobile menu, and the drifting pattern. The site works without JS.
(function () {
  var root = document.documentElement;

  /* ---------- Theme ---------- */
  var themeBtn = document.querySelector('.theme-toggle');
  function currentTheme() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function labelFor(t) { return t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'; }
  function applyTheme(t, save) {
    root.setAttribute('data-theme', t);
    if (themeBtn) { themeBtn.setAttribute('aria-label', labelFor(t)); }
    if (save) { try { localStorage.setItem('theme', t); } catch (e) {} }
  }
  if (themeBtn) {
    themeBtn.setAttribute('aria-label', labelFor(currentTheme()));
    themeBtn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });
  }
  // Follow the system setting while the visitor hasn't picked a theme.
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) {
      var saved = null;
      try { saved = localStorage.getItem('theme'); } catch (err) {}
      if (saved !== 'light' && saved !== 'dark') { applyTheme(e.matches ? 'dark' : 'light', false); }
    };
    if (mq.addEventListener) { mq.addEventListener('change', onChange); }
  }

  /* ---------- Mobile menu: side drawer ---------- */
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    var scrim = document.querySelector('[data-nav-scrim]');
    var closeBtn = nav.querySelector('.drawer__close');
    var wide = window.matchMedia('(min-width: 64rem)');
    var isOpen = false;
    var focusables = function () { return Array.prototype.slice.call(nav.querySelectorAll('a[href], button:not([disabled])')); };
    var set = function (open, restore) {
      if (open === isOpen) return;
      isOpen = open;
      btn.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('nav-open', open);
      if (open) {
        var f = focusables(); if (f.length) setTimeout(function () { (closeBtn || f[0]).focus(); }, 60);
      } else if (restore !== false) { btn.focus(); }
    };
    btn.addEventListener('click', function () { set(!isOpen); });
    if (closeBtn) closeBtn.addEventListener('click', function () { set(false); });
    if (scrim) scrim.addEventListener('click', function () { set(false); });
    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape') { set(false); return; }
      if (e.key === 'Tab') {                         /* keep focus inside the open drawer */
        var f = focusables(); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false, false); });
    var onWide = function () { if (wide.matches) set(false, false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
  }

  /* ---------- Pattern: rows that slide left and right with the mouse ---------- */
  var hosts = document.querySelectorAll('.hero, .page-hero, .band');
  function build(host) {
    var layer = host.querySelector(':scope > .pattern');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pattern';
      layer.setAttribute('aria-hidden', 'true');
      host.insertBefore(layer, host.firstChild);
    }
    layer.textContent = '';
    var probe = document.createElement('div');
    probe.className = 'pattern__row';
    layer.appendChild(probe);
    var rowH = probe.getBoundingClientRect().height || 90;
    layer.removeChild(probe);
    var count = Math.ceil(host.offsetHeight / rowH) + 1;
    for (var i = 0; i < count; i++) {
      var row = document.createElement('div');
      row.className = 'pattern__row' + (i % 2 ? ' is-odd' : '');
      row.style.setProperty('--i', i);
      row.style.setProperty('--dir', i % 2 ? 1 : -1);
      layer.appendChild(row);
    }
    requestAnimationFrame(function () { layer.classList.add('is-ready'); });
  }

  var timer;
  function buildAll() { hosts.forEach(build); }
  buildAll();
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(buildAll, 200); });

  var reduce = window.siteReducedMotion();

  // Ease toward the pointer's horizontal position (-1 left edge … +1 right edge).
  var cur = 0, target = 0, raf = null;
  function tick() {
    cur += (target - cur) * 0.07;
    root.style.setProperty('--px', cur.toFixed(4));
    raf = Math.abs(target - cur) > 0.001 ? requestAnimationFrame(tick) : null;
  }
  if (!reduce && hosts.length) window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    target = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  /* ---------- Micro-interactions ---------- */
  var reduce = window.siteReducedMotion();
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Scroll reveal
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Scroll progress, back-to-top, portrait parallax (one rAF-throttled handler)
  var bar = document.querySelector('.progress__bar');
  var toTop = document.querySelector('.to-top');
  var portrait = document.querySelector('.portrait');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var y = window.scrollY || h.scrollTop;
    if (bar) { bar.parentNode.style.setProperty('--progress', max > 0 ? Math.min(1, y / max) : 0); }
    if (toTop) {
      var show = y > 600;
      toTop.hidden = false;
      toTop.classList.toggle('is-visible', show);
      toTop.tabIndex = show ? 0 : -1;
    }
    if (portrait && !reduce && y < 900) { portrait.style.setProperty('--ty', (y * -0.05).toFixed(1) + 'px'); }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  // Shared eased follower: cursor-driven values glide toward their target instead of snapping.
  var followers = [], following = false;
  function follow(step) { followers.push(step); if (!following) { following = true; requestAnimationFrame(loop); } }
  var lastF = performance.now();
  function loop(now) {
    var dt = Math.min(0.05, (now - lastF) / 1000); lastF = now;
    var busy = false;
    for (var i = 0; i < followers.length; i++) { if (followers[i](dt)) { busy = true; } }
    if (busy) { requestAnimationFrame(loop); } else { following = false; }
  }
  function ease(dt, rate) { return 1 - Math.exp(-dt * rate); }

  // Card spotlight glides after the cursor
  document.querySelectorAll('[data-spotlight]').forEach(function (el) {
    var s = { x: 0, y: 0, tx: 0, ty: 0, init: false, run: false };
    function step(dt) {
      if (!s.run) { return false; }
      var k = ease(dt, 12);
      s.x += (s.tx - s.x) * k; s.y += (s.ty - s.y) * k;
      el.style.setProperty('--mx', s.x.toFixed(1) + 'px'); el.style.setProperty('--my', s.y.toFixed(1) + 'px');
      if (Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) < 0.3) { s.run = false; return false; }
      return true;
    }
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(); s.tx = e.clientX - r.left; s.ty = e.clientY - r.top;
      if (!s.init) { s.x = s.tx; s.y = s.ty; s.init = true; }
      if (!s.run) { s.run = true; follow(step); }
    });
    el.addEventListener('pointerleave', function () { s.init = false; });
  });

  // Magnetic CTAs (mouse only): eased pull toward the cursor, eased release
  if (fine && !reduce) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var s = { x: 0, y: 0, tx: 0, ty: 0, run: false };
      function step(dt) {
        var k = ease(dt, 9);
        s.x += (s.tx - s.x) * k; s.y += (s.ty - s.y) * k;
        el.style.transform = 'translate3d(' + s.x.toFixed(2) + 'px,' + s.y.toFixed(2) + 'px,0)';
        if (Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) < 0.05 && s.tx === 0 && s.ty === 0) { el.style.transform = ''; s.run = false; return false; }
        return true;
      }
      function kick() { if (!s.run) { s.run = true; follow(step); } }
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        s.tx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 10; s.ty = ((e.clientY - (r.top + r.height / 2)) / r.height) * 10; kick();
      });
      el.addEventListener('pointerleave', function () { s.tx = 0; s.ty = 0; kick(); });
    });
  }

  /* ---------- Global light: one light source for the whole page ---------- */
  var ptr = { x: 0, y: 0, active: false };
  var light = { x: window.innerWidth * 0.2, y: -window.innerHeight * 0.1 };
  var litEls = Array.prototype.slice.call(document.querySelectorAll('.facet, .pub, .research__cta, .btn--primary, .btn--dark, .social-grid a, .card, .offers li, .values li'));
  litEls.forEach(function (el) { el.classList.add('lit'); });
  var vis = [];
  if ('IntersectionObserver' in window) {
    var litIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var i = vis.indexOf(e.target); if (e.isIntersecting && i < 0) { vis.push(e.target); } else if (!e.isIntersecting && i >= 0) { vis.splice(i, 1); } });
      dirty = true;
    }, { rootMargin: '80px' });
    litEls.forEach(function (el) { litIO.observe(el); });
  } else { vis = litEls.slice(); }
  var dirty = true, plx = [], lastSY = -1, lastPx = 0, lastPy = 0;
  var px = { x: 0, y: 0 }; // eased pointer for parallax, -1..1
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') { return; }
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = true; dirty = true;
  }, { passive: true });
  document.addEventListener('mouseleave', function () { ptr.active = false; dirty = true; });
  window.addEventListener('scroll', function () { dirty = true; }, { passive: true });
  window.addEventListener('resize', function () { dirty = true; });
  // Elements that drift at their own speed on scroll and against the cursor (CSS `translate`, so it never fights hover transforms)
  document.querySelectorAll('[data-parallax], [data-mouse]').forEach(function (el) {
    plx.push({ el: el, sp: reduce ? 0 : (parseFloat(el.getAttribute('data-parallax')) || 0), m: reduce ? 0 : (parseFloat(el.getAttribute('data-mouse')) || 0), x: 0, y: 0 });
  });
  var lastL = performance.now();
  (function lightLoop(now) {
    var dt = Math.min(0.05, (now - lastL) / 1000); lastL = now;
    var vw = window.innerWidth, vh = window.innerHeight, t = now / 1000;
    var hx = vw * 0.2 + (reduce ? 0 : Math.sin(t * 0.25) * vw * 0.04), hy = -vh * 0.1;
    var tx = ptr.active ? hx + (ptr.x - hx) * 0.75 : hx, ty = ptr.active ? hy + (ptr.y - hy) * 0.75 : hy;
    var k = 1 - Math.exp(-dt * 4);
    var mx = light.x, my = light.y;
    light.x += (tx - light.x) * k; light.y += (ty - light.y) * k;
    var py = (window.scrollY || 0), moved = Math.abs(light.x - mx) + Math.abs(light.y - my) > 0.05;
    var pxT = ptr.active ? (ptr.x / vw - 0.5) * 2 : 0, pyT = ptr.active ? (ptr.y / vh - 0.5) * 2 : 0;
    var kp = 1 - Math.exp(-dt * 5);
    px.x += (pxT - px.x) * kp; px.y += (pyT - px.y) * kp;
    var pmoved = Math.abs(px.x - lastPx) + Math.abs(px.y - lastPy) > 0.0005;
    if (moved || dirty || py !== lastSY || pmoved) {
      lastPx = px.x; lastPy = px.y;
      var dirx = (light.x - vw / 2) / vw, diry = (light.y - vh / 2) / vh;
      var st = root.style;
      st.setProperty('--sx', (-dirx * 26).toFixed(1)); st.setProperty('--sy', Math.max(3, Math.min(26, 12 - diry * 14)).toFixed(1));
      for (var i = 0; i < vis.length; i++) {
        var el = vis[i], r = el.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = light.x - cx, dy = light.y - cy;
        var a = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (vw * 0.95)); a = a * a;
        el.style.setProperty('--lx', ((light.x - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--ly', ((light.y - r.top) / r.height * 100).toFixed(1) + '%');
        el.style.setProperty('--la', a.toFixed(3));
      }
      for (var j = 0; j < plx.length; j++) {
        var p = plx[j], rr = p.el.getBoundingClientRect(), mid = rr.top + rr.height / 2 - p.y;
        if (rr.bottom < -200 || rr.top > vh + 200) { continue; }
        var ty2 = (mid - vh / 2) * p.sp - px.y * p.m * 0.6, tx2 = -px.x * p.m;
        p.x += (tx2 - p.x) * 0.5; p.y += (ty2 - p.y) * 0.5;
        p.el.style.translate = p.x.toFixed(2) + 'px ' + p.y.toFixed(2) + 'px';
      }
      lastSY = py; dirty = false;
    }
    requestAnimationFrame(lightLoop);
  })(performance.now());

  /* ---------- Clay objects: shared state ---------- */
  var clays = Array.prototype.map.call(document.querySelectorAll('.clay'), function (el) {
    return { el: el, layer: el.parentNode, depth: parseFloat(el.getAttribute('data-depth')) || 1,
             tx: 0, ty: 0, rx: 0, ry: 0, sc: 1, on: true };
  });

  /* ---------- Clay objects, real 3D: ray-marched signed-distance shapes drawn with WebGL ---------- */
  var SHAPES = { pyramid: 0, sphere: 1, cube: 2, obelisk: 3 };
  var BASE = { pyramid: [0.80, 0.60, 0.40], sphere: [0.86, 0.67, 0.48], cube: [0.82, 0.63, 0.43], obelisk: [0.70, 0.50, 0.31] };
  var TILT = { pyramid: [-0.18, 0.5, 0], sphere: [0.3, 0, 0], cube: [0.55, 0.62, 0.1], obelisk: [-0.15, 0.4, 0.12] };
  var IDLE = { pyramid: 0.38, sphere: 0.3, cube: 0.28, obelisk: 0.26 };
  var VERT = 'attribute vec2 a; varying vec2 vUv; void main(){ vUv = a; gl_Position = vec4(a, 0.0, 1.0); }';
  var FRAG = [
    'precision highp float; varying vec2 vUv;',
    'uniform float uShape; uniform mat3 uInv; uniform vec3 uBase; uniform float uAA; uniform vec3 uLight; uniform float uLit; uniform float uSh;',
    'float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }',
    'float smx(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return max(a, b) + h*h*k*0.25; }',
    'float pyr(vec3 q, float b, float h){',
    '  float l = sqrt(h*h + b*b); vec2 n = vec2(h, b) / l; float c = b*h / l; float k = 0.16;',
    '  float d1 = q.x*n.x + q.y*n.y - c; float d2 = -q.x*n.x + q.y*n.y - c; float d3 = q.z*n.x + q.y*n.y - c; float d4 = -q.z*n.x + q.y*n.y - c;',
    '  return smx(smx(smx(d1, d2, k), smx(d3, d4, k), k), -q.y, k); }',
    'float map(vec3 p){',
    '  if (uShape < 0.5) { return pyr(p + vec3(0.0, 0.85, 0.0), 0.92, 1.7) - 0.05; }',
    '  if (uShape < 1.5) { return length(p) - 0.98; }',
    '  if (uShape < 2.5) { return sdBox(p, vec3(0.58)) - 0.22; }',
    '  if (uShape < 3.5) {',
    '    vec3 P = p * 1.5; vec3 c = P - vec3(0.0, -0.4, 0.0); float t = clamp((c.y + 0.95) / 1.9, 0.0, 1.0); float w = mix(0.42, 0.3, t);',
    '    c.xz *= 0.34 / w; float body = sdBox(c, vec3(0.34, 0.95, 0.34)) * (w / 0.34) * 0.85 - 0.04;',
    '    float cap = pyr(P - vec3(0.0, 0.55, 0.0), 0.31, 0.58) - 0.02; return min(body, cap) / 1.5; }',
    '  return length(p) - 0.98;',
    '}',
    'vec3 calcN(vec3 p){ vec2 e = vec2(0.0012, -0.0012); return normalize(e.xyy*map(p + e.xyy) + e.yyx*map(p + e.yyx) + e.yxy*map(p + e.yxy) + e.xxx*map(p + e.xxx)); }',
    'void main(){',
    '  vec3 ro = uInv * vec3(0.0, 0.0, 5.0); vec3 rd = uInv * normalize(vec3(vUv * 0.35, -1.0));',
    '  float t = 3.0, dmin = 1e5, tmin = 3.0; bool hit = false;',
    '  for (int i = 0; i < 90; i++) { vec3 p = ro + rd*t; float d = map(p); if (d < dmin) { dmin = d; tmin = t; } if (d < 0.0012) { hit = true; break; } t += d*0.75; if (t > 7.5) break; }',
    '  if (!hit && dmin < 0.006) { hit = true; t = tmin; }',
    '  float aaW = uAA * tmin; float alpha = hit ? 1.0 : (1.0 - smoothstep(0.0, aaW, dmin));',
    '  vec3 col = vec3(0.0);',
    '  if (alpha > 0.0) {',
    '    vec3 p = hit ? ro + rd*t : ro + rd*tmin; vec3 n = calcN(p);',
    '    vec3 L = uInv * normalize(uLight);',
    '    float dif = clamp(dot(n, L)*0.5 + 0.5, 0.0, 1.0); dif *= dif;',
    '    vec3 shadow = vec3(0.26, 0.14, 0.07); vec3 hi = vec3(1.0, 0.94, 0.86);',
    '    col = mix(shadow, uBase, smoothstep(0.12, 0.78, dif)); col = mix(col, hi, smoothstep(0.78, 1.0, dif)*0.32);',
    '    float bou = clamp(dot(n, uInv * vec3(0.3, -0.8, 0.4))*0.5 + 0.5, 0.0, 1.0); col += vec3(0.55, 0.32, 0.14) * bou*bou * 0.2;',
    '    float fre = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0); col += vec3(1.0, 0.82, 0.62) * fre * 0.3;',
    '    float spe = pow(clamp(dot(reflect(-L, n), -rd), 0.0, 1.0), 22.0); col += vec3(1.0, 0.95, 0.88) * spe * 0.3 * uLit;',
    '    float occ = 0.0, sca = 1.0; for (int i = 0; i < 4; i++) { float h = 0.03 + 0.1*float(i); occ += (h - map(p + n*h)) * sca; sca *= 0.7; }',
    '    col *= mix(0.55, 1.0, clamp(1.0 - 1.8*occ, 0.0, 1.0));',
    '    col *= uLit;',
    '    col *= 1.0 + 0.018*sin(p.x*31.0 + p.y*13.0)*sin(p.z*27.0 + p.x*9.0);',
    '    if (uShape > 0.5 && uShape < 1.5) { col *= 1.0 - 0.2*smoothstep(0.035, 0.0, abs(abs(p.y) - 0.42)); }',
    '    if (uShape > 1.5 && uShape < 2.5) { col *= 1.0 - 0.0; }',
    '  }',
    '  vec2 sp = (vUv - vec2(uSh, -0.8)) / vec2(0.6, 0.12); float sh = exp(-dot(sp, sp)*1.5) * 0.3;',
    '  vec3 sc = vec3(0.2, 0.11, 0.05);',
    '  gl_FragColor = vec4(col*alpha + sc*sh*(1.0 - alpha), alpha + sh*(1.0 - alpha));',
    '}'
  ].join('\n');

  function mul(a, b) { // 3x3, column-major
    var o = new Array(9), i, j;
    for (i = 0; i < 3; i++) { for (j = 0; j < 3; j++) { o[j*3 + i] = a[i]*b[j*3] + a[3 + i]*b[j*3 + 1] + a[6 + i]*b[j*3 + 2]; } }
    return o;
  }
  function rx(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, s, 0, -s, c]; }
  function ry(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 1, 0, s, 0, c]; }
  function rz(a) { var c = Math.cos(a), s = Math.sin(a); return [c, s, 0, -s, c, 0, 0, 0, 1]; }
  function tr(m) { return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]; }

  function initClayGL(items, still, calm) {
    if (!items.length || !window.WebGLRenderingContext) { return false; }
    var layers = [], seen = [];
    try {
      items.forEach(function (c) {
        var idx = seen.indexOf(c.layer);
        if (idx < 0) {
          var cv = document.createElement('canvas'); cv.className = 'clay-canvas'; c.layer.insertBefore(cv, c.layer.firstChild);
          var gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
          if (!gl) { throw new Error('no webgl'); }
          function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s)); } return s; }
          var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr);
          if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { throw new Error('link'); }
          gl.useProgram(pr);
          var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
          var loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
          gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.SCISSOR_TEST);
          layers.push({ el: c.layer, cv: cv, gl: gl, u: { shape: gl.getUniformLocation(pr, 'uShape'), inv: gl.getUniformLocation(pr, 'uInv'), base: gl.getUniformLocation(pr, 'uBase'), aa: gl.getUniformLocation(pr, 'uAA'), light: gl.getUniformLocation(pr, 'uLight'), lit: gl.getUniformLocation(pr, 'uLit'), sh: gl.getUniformLocation(pr, 'uSh') }, on: true, w: 0, h: 0, dpr: 1, items: [] });
          seen.push(c.layer); idx = layers.length - 1;
        }
        layers[idx].items.push(c);
      });
    } catch (err) {
      layers.forEach(function (l) { if (l.cv.parentNode) { l.cv.parentNode.removeChild(l.cv); } });
      return false;
    }
    root.classList.add('clay-gl');
    items.forEach(function (c) {
      var s = c.el.getAttribute('data-shape') || 'sphere';
      c.shape = SHAPES.hasOwnProperty(s) ? s : 'sphere';
      c.phase = Math.random() * 6.28; c.yaw = 0; c.pitch = 0; c.vy = 0; c.vp = 0; c.tx = 0; c.ty = 0; c.spin = Math.random() * 6.28;
    });
    var mouse = { x: 0, y: 0, sx: 0, sy: 0, active: false, fresh: true };
    var visIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { layers.forEach(function (l) { if (l.el === e.target) { l.on = e.isIntersecting; } }); });
    }, { rootMargin: '100px' }) : null;
    layers.forEach(function (l) { if (visIO) { visIO.observe(l.el); } });
    function size(l) {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = l.el.clientWidth, h = l.el.clientHeight;
      if (w !== l.w || h !== l.h || dpr !== l.dpr) { l.w = w; l.h = h; l.dpr = dpr; l.cv.width = Math.max(1, Math.round(w * dpr)); l.cv.height = Math.max(1, Math.round(h * dpr)); }
    }
    {
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') { return; }
        mouse.x = e.clientX; mouse.y = e.clientY;
        if (!mouse.active) { mouse.sx = mouse.x; mouse.sy = mouse.y; mouse.active = true; }
      }, { passive: true });
      document.addEventListener('mouseleave', function () { mouse.active = false; });
      window.addEventListener('blur', function () { mouse.active = false; });
    }
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.033, (now - last) / 1000); last = now;
      var vw = window.innerWidth, vh = window.innerHeight, time = now / 1000;
      // the pointer itself is eased, so everything driven by it moves smoothly
      var psx = mouse.sx, psy = mouse.sy, kp = 1 - Math.exp(-dt * 9);
      if (mouse.active) { mouse.sx += (mouse.x - mouse.sx) * kp; mouse.sy += (mouse.y - mouse.sy) * kp; }
      var mdx = mouse.sx - psx, mdy = mouse.sy - psy;
      var kpos = 1 - Math.exp(-dt * 5.5), kscl = 1 - Math.exp(-dt * 7);
      layers.forEach(function (l) {
        if (!l.on && !still) { return; }
        size(l);
        var gl = l.gl, lr = l.el.getBoundingClientRect();
        gl.viewport(0, 0, l.cv.width, l.cv.height); gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.SCISSOR_TEST);
        l.items.forEach(function (c) {
          var el = c.el, w = el.offsetWidth; if (!w) { return; }
          var d = c.depth, bx = el.offsetLeft + w / 2, by = el.offsetTop + el.offsetHeight / 2;
          var vx = lr.left + bx, vy = lr.top + by; // viewport position
          var mx = mouse.active ? (mouse.sx / vw - 0.5) * 2 : 0, my = mouse.active ? (mouse.sy / vh - 0.5) * 2 : 0;
          var amp = calm ? 0.6 : 1;
          var ttx = -mx * d * 46 * amp, tty = -my * d * 32 * amp + (calm ? 0 : (vh / 2 - vy) * d * 0.16);
          var aimYaw = 0, aimPitch = 0, sc = 1;
          if (mouse.active) {
            var dx = vx - mouse.sx, dy = vy - mouse.sy, dist = Math.sqrt(dx * dx + dy * dy) || 1, R = w * 0.9 + 150;
            // always lean toward the cursor
            aimYaw = Math.max(-1, Math.min(1, -dx / (vw * 0.35))) * 1.0 * amp; aimPitch = Math.max(-1, Math.min(1, -dy / (vh * 0.35))) * 0.7 * amp;
            if (dist < R) {
              var f = 1 - dist / R; f *= f;
              ttx += (dx / dist) * f * 80; tty += (dy / dist) * f * 80; sc = 1 + f * 0.12;
              // cursor movement near an object kicks it into a spin
              c.vy += mdx * 0.09 * f * d; c.vp += mdy * 0.09 * f * d;
            }
          }
          if (!still) {
            c.vy += ((aimYaw - c.yaw) * 16 - c.vy * 6.4) * dt; c.vp += ((aimPitch - c.pitch) * 16 - c.vp * 6.4) * dt;
            c.vy = Math.max(-3, Math.min(3, c.vy)); c.vp = Math.max(-3, Math.min(3, c.vp));
            c.yaw += c.vy * dt; c.pitch += c.vp * dt;
            c.yaw = 1.5 * Math.tanh(c.yaw / 1.5); c.pitch = 1.1 * Math.tanh(c.pitch / 1.1);
            c.tx += (ttx - c.tx) * kpos; c.ty += (tty - c.ty) * kpos; c.spin += calm ? 0 : dt * IDLE[c.shape];
          }
          var bob = calm ? 0 : Math.sin(time * 0.8 + c.phase) * 8;
          var tilt = TILT[c.shape];
          var R3 = mul(ry(c.yaw + c.spin + tilt[1]), mul(rx(c.pitch + tilt[0]), rz(tilt[2])));
          c.scale = c.scale || 1; c.scale += (sc - c.scale) * kscl;
          var q = w * 1.6 * c.scale;
          var cx = bx + c.tx, cy = by + c.ty + bob;
          var dpr = l.dpr, px = Math.round((cx - q / 2) * dpr), py = Math.round(l.cv.height - (cy + q / 2) * dpr), ps = Math.round(q * dpr);
          gl.viewport(px, py, ps, ps); gl.scissor(px, py, ps, ps);
          gl.uniform1f(l.u.shape, SHAPES[c.shape]); gl.uniformMatrix3fv(l.u.inv, false, new Float32Array(tr(R3)));
          var bc = BASE[c.shape]; gl.uniform3f(l.u.base, bc[0], bc[1], bc[2]); gl.uniform1f(l.u.aa, 0.72 / ps * 1.4);
          // one global light: direction + strength depend on where this object sits relative to it
          var lxp = light.x - vx, lyp = light.y - vy, ld = Math.sqrt(lxp * lxp + lyp * lyp) || 1, lz = 380;
          var ll = Math.sqrt(lxp * lxp + lyp * lyp + lz * lz);
          gl.uniform3f(l.u.light, lxp / ll, -lyp / ll, lz / ll);
          gl.uniform1f(l.u.lit, 0.82 + 0.38 * Math.max(0, 1 - ld / (vw * 1.0)));
          gl.uniform1f(l.u.sh, Math.max(-1, Math.min(1, -lxp / ll)) * 0.28);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        });
      });
      if (!still) { requestAnimationFrame(frame); }
    }
    requestAnimationFrame(frame);
    if (still) { window.addEventListener('resize', function () { requestAnimationFrame(frame); }); }
    return true;
  }
  var glOK = initClayGL(clays, false, reduce);
  root.setAttribute('data-clay', glOK ? (reduce ? 'gl-calm' : 'gl') : 'css');
  if (clays.length && !glOK) {
    var mouse = { x: 0, y: 0, active: false };
    if ('IntersectionObserver' in window) {
      var vis = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          clays.forEach(function (c) { if (c.layer === en.target) { c.on = en.isIntersecting; } });
        });
      }, { rootMargin: '120px' });
      var seen = [];
      clays.forEach(function (c) { if (seen.indexOf(c.layer) < 0) { seen.push(c.layer); vis.observe(c.layer); } });
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') { return; }
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    }, { passive: true });
    document.addEventListener('mouseleave', function () { mouse.active = false; });
    window.addEventListener('blur', function () { mouse.active = false; });

    var K = 0.085;
    (function tick() {
      var vw = window.innerWidth, vh = window.innerHeight;
      var mx = mouse.active ? (mouse.x / vw - 0.5) * 2 : 0;
      var my = mouse.active ? (mouse.y / vh - 0.5) * 2 : 0;
      clays.forEach(function (c) {
        if (!c.on) { return; }
        var el = c.el, lr = c.layer.getBoundingClientRect();
        var w = el.offsetWidth;
        var cx = lr.left + el.offsetLeft + w / 2;
        var cy = lr.top + el.offsetTop + el.offsetHeight / 2;
        var d = c.depth;
        // layered parallax: deeper (larger depth) objects travel further against the cursor
        var tx = -mx * d * 26, ty = -my * d * 18 + (vh / 2 - cy) * d * 0.07;
        var rx = -my * d * 12, ry = mx * d * 14, sc = 1;
        if (mouse.active) {
          // soft repulsion: objects drift away from the cursor, lean toward it, and swell slightly
          var dx = cx - mouse.x, dy = cy - mouse.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var R = w * 0.8 + 110;
          if (dist < R) {
            var f = 1 - dist / R; f = f * f;
            tx += (dx / dist) * f * 70; ty += (dy / dist) * f * 70;
            ry += (-dx / dist) * f * 16; rx += (dy / dist) * f * 16;
            sc = 1 + f * 0.1;
          }
        }
        c.tx += (tx - c.tx) * K; c.ty += (ty - c.ty) * K;
        c.rx += (rx - c.rx) * K; c.ry += (ry - c.ry) * K; c.sc += (sc - c.sc) * K;
        var st = el.style;
        st.setProperty('--tx', c.tx.toFixed(1) + 'px'); st.setProperty('--ty', c.ty.toFixed(1) + 'px');
        st.setProperty('--rx', c.rx.toFixed(2) + 'deg'); st.setProperty('--ry', c.ry.toFixed(2) + 'deg');
        st.setProperty('--sc', c.sc.toFixed(3));
      });
      requestAnimationFrame(tick);
    })();
  }
})();

/* Research: type filter + BibTeX copy */
(function () {
  var bar = document.querySelector('[data-filters]');
  if (bar) {
    var groups = document.querySelectorAll('[data-group]');
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]');
      if (!b) return;
      var key = b.getAttribute('data-filter');
      bar.querySelectorAll('[data-filter]').forEach(function (x) {
        var on = x === b;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      groups.forEach(function (g) { g.hidden = key !== 'all' && g.getAttribute('data-group') !== key; });
    });
  }
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = document.querySelector(btn.getAttribute('data-copy'));
      if (!src) return;
      var text = src.textContent;
      var done = function () {
        var l = btn.querySelector('[data-copy-label]');
        btn.classList.add('is-done'); if (l) l.textContent = 'Copied';
        setTimeout(function () { btn.classList.remove('is-done'); if (l) l.textContent = 'Copy'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
      else { var r = document.createRange(); r.selectNodeContents(src); var s = getSelection(); s.removeAllRanges(); s.addRange(r); try { document.execCommand('copy'); } catch (x) {} s.removeAllRanges(); done(); }
    });
  });
})();

/* Portrait solar system: each role is a planet on a tilted Kepler orbit around the photo (the sun at the focus,
   quicker near the sun). Depth drives size, blur, brightness and shadow; the sun and the global light shade each pill.
   Runs for everyone, at a calmer pace with reduced motion; spirals out on arrival, slows on hover, tilts with the cursor. */
(function () {
  var fig = document.querySelector('.portrait');
  if (!fig) return;
  var planets = Array.prototype.slice.call(fig.querySelectorAll('.planet'));
  var groups = Array.prototype.slice.call(fig.querySelectorAll('.orbits g'));
  if (!planets.length) return;
  var reduce = window.siteReducedMotion();
  /* Each orbit lies in its own 3D plane: `tilt` turns the line of nodes on screen, `k` is cos(inclination)
     (small = seen almost edge-on, large = seen more face-on). `pre`/`pp` precess the plane slowly and `kb`/`kp` let the
     inclination breathe, so the rings gently turn in space instead of sitting flat. */
  var ORB = [
    { rx: 31, e: 0.10, tilt: -16, k: 0.30, period: 20, dir: 1,  pre: 5, pp: 38, kb: 0.05, kp: 29 },
    { rx: 38, e: 0.16, tilt: 64,  k: 0.52, period: 32, dir: -1, pre: 6, pp: 51, kb: 0.07, kp: 43 },
    { rx: 45, e: 0.12, tilt: -62, k: 0.40, period: 47, dir: 1,  pre: 5, pp: 67, kb: 0.06, kp: 59 }
  ];
  fig.classList.add('is-orbit');
  var data = planets.map(function (el) {
    return { el: el, o: parseInt(el.getAttribute('data-orbit'), 10) || 0, ph: parseFloat(el.getAttribute('data-phase')) || 0 };
  });
  var base = reduce ? 0.55 : 1;
  var clock = 0, spd = 1, spdT = 1, last = performance.now(), on = true, W = 0, born = performance.now(), hot = 0;
  var p = { x: 0, y: 0, tx: 0, ty: 0 };
  function kepler(M, e) { var E = M; for (var i = 0; i < 5; i++) { E = M + e * Math.sin(E); } return E; }
  function outCubic(t) { t = Math.min(1, Math.max(0, t)); return 1 - Math.pow(1 - t, 3); }
  function render(now) {
    W = fig.clientWidth;
    var age = (now - born) / 1000, sc = W < 480 ? 0.88 : 0.92;
    var tiltOf = ORB.map(function (o, i) { return o.tilt + o.pre * Math.sin(clock * 6.2832 / o.pp + i) + p.x * (3 + i * 2.2) - p.y * 1.5; });
    var kOf = ORB.map(function (o, i) { return Math.min(0.9, Math.max(0.12, o.k + o.kb * Math.sin(clock * 6.2832 / o.kp + i * 2) + p.y * 0.04)); });
    var grow = ORB.map(function (o, i) { return outCubic((age - 0.1 - i * 0.25) / 1.6); });
    groups.forEach(function (g) {
      var i = parseInt(g.getAttribute('data-orbit'), 10) || 0, o = ORB[i], s = sc * (0.55 + 0.45 * grow[i]);
      g.setAttribute('transform', 'rotate(' + tiltOf[i].toFixed(2) + ') translate(' + (-o.e * o.rx * s).toFixed(2) + ' 0) scale(' + s.toFixed(3) + ')');
      g.style.opacity = grow[i].toFixed(2);
      var ry = (o.rx * kOf[i]).toFixed(2), paths = g.querySelectorAll('path');
      for (var q = 0; q < paths.length; q++) {
        var front = !!(g.parentNode && g.parentNode.classList.contains('orbits--front'));
        paths[q].setAttribute('d', 'M ' + (-o.rx) + ' 0 A ' + o.rx + ' ' + ry + ' 0 0 ' + (front ? 0 : 1) + ' ' + o.rx + ' 0');
      }
    });
    data.forEach(function (d, n) {
      var o = ORB[d.o], M = d.ph + o.dir * clock * (Math.PI * 2 / o.period), E = kepler(M, o.e);
      var g = sc * (0.55 + 0.45 * grow[d.o]);
      var k = kOf[d.o], lx = o.rx * (Math.cos(E) - o.e) * g, ly = o.rx * k * Math.sin(E) * g, t = tiltOf[d.o] * Math.PI / 180;
      var x = lx * Math.cos(t) - ly * Math.sin(t), y = lx * Math.sin(t) + ly * Math.cos(t);
      var z = Math.sin(E), zq = z * (0.5 + 0.5 * Math.sqrt(1 - k * k)), depth = zq * 0.5 + 0.5, el = d.el;
      var persp = 1 + 0.07 * zq; x *= persp; y *= persp;
      var b = outCubic((age - 0.4 - n * 0.14) / 1.3);
      var s = (0.8 + 0.3 * depth) * (0.6 + 0.4 * b);
      var px = (50 + x) / 100 * W, py = (50 + y) / 100 * W;
      el.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + s.toFixed(3) + ')';
      el.style.zIndex = z > 0 ? 4 : 1; // behind the photo (frame is 2) when on the far side
      el.style.opacity = ((0.55 + 0.45 * depth) * b).toFixed(2);
      // lighting: the sun (photo) is the main light, the page light (cursor) adds a second one
      var dist = Math.sqrt(x * x + y * y) || 1, sun = Math.max(0, 1 - dist / 60);
      el.style.setProperty('--d', depth.toFixed(3));
      el.style.setProperty('--px', (50 - x * 1.4).toFixed(1) + '%');
      el.style.setProperty('--py', (50 - y * 3).toFixed(1) + '%');
      el.style.setProperty('--pa', (0.25 + 0.55 * sun + 0.2 * (z > 0 ? 1 : 0)).toFixed(2));
      el.style.setProperty('--shx', (x / dist * 7 * depth).toFixed(1));
      el.style.setProperty('--shy', (y / dist * 5 * depth + 5 * depth).toFixed(1));
    });
  }
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    spd += (spdT - spd) * (1 - Math.exp(-dt * 3));
    clock += dt * spd * base;
    var k = 1 - Math.exp(-dt * 4);
    p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
    if (on) render(now);
    requestAnimationFrame(frame);
  }
  render(performance.now());
  window.addEventListener('resize', function () { render(performance.now()); });
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    p.tx = (e.clientX / window.innerWidth - 0.5) * 2; p.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  planets.forEach(function (el) {
    el.addEventListener('pointerenter', function () { hot++; el.classList.add('is-hot'); spdT = 0.08; });
    el.addEventListener('pointerleave', function () { hot = Math.max(0, hot - 1); el.classList.remove('is-hot'); if (!hot) spdT = 1; });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; }, { rootMargin: '120px' }).observe(fig);
  }
  requestAnimationFrame(frame);
})();

/* Calls: filter open calls by type */
(function () {
  var bar = document.querySelector('[data-callfilters]'), grid = document.querySelector('[data-callgrid]');
  if (!bar || !grid) return;
  var btns = Array.prototype.slice.call(bar.querySelectorAll('.filter')), cards = Array.prototype.slice.call(grid.querySelectorAll('.rcard'));
  function apply(k) {
    btns.forEach(function (x) { var on = x.getAttribute('data-filter') === k; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    cards.forEach(function (c) { c.hidden = !(k === 'all' || c.getAttribute('data-type') === k); });
  }
  var h = (location.hash || '').replace('#', '');
  if (h && btns.some(function (b) { return b.getAttribute('data-filter') === h; })) apply(h);
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-filter');
      btns.forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      cards.forEach(function (c) { c.hidden = !(k === 'all' || c.getAttribute('data-type') === k); });
    });
  });
})();

/* Research sub-navigation: sliding ink under the active tab, kept in view on small screens */
(function () {
  var row = document.querySelector('.subnav__row'); if (!row) return;
  var list = row.querySelector('.subnav__list'), ink = row.querySelector('.subnav__ink');
  var cur = list.querySelector('[aria-current="page"]'); if (!cur || cur.classList.contains('subnav__calls')) { if (ink) ink.remove(); if (cur) cur.scrollIntoView && 0; }
  function place(first) {
    if (!cur || !ink || !ink.parentNode) return;
    var r = row.getBoundingClientRect(), a = cur.getBoundingClientRect();
    ink.style.setProperty('--ix', (a.left - r.left + 12) + 'px'); ink.style.setProperty('--iw', Math.max(a.width - 24, 8) + 'px');
    ink.classList.add('is-on');
  }
  function center() { if (cur) list.scrollLeft = cur.parentNode.offsetLeft - (list.clientWidth - cur.offsetWidth) / 2; }
  center(); place();
  list.addEventListener('scroll', function () { place(); }, { passive: true });
  window.addEventListener('resize', function () { center(); place(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { center(); place(); });
})();

/* Home: tilt the 3D space with the cursor (or finger) and with scroll, so the relics shift against the avatar by depth */
(function () {
  var box = document.querySelector('[data-cosmos]'), sp = box && box.querySelector('[data-space]'); if (!sp) { return; }
  if (window.siteReducedMotion()) { return; }
  var tx = 0, ty = 0, cx = 0, cy = 0, run = false;
  function frame() {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    sp.style.setProperty('--ry', cx.toFixed(2) + 'deg'); sp.style.setProperty('--rx', cy.toFixed(2) + 'deg');
    if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.01) { requestAnimationFrame(frame); } else { run = false; }
  }
  function go() { if (!run) { run = true; requestAnimationFrame(frame); } }
  window.addEventListener('pointermove', function (e) { tx = (e.clientX / innerWidth - 0.5) * 18; ty = -(e.clientY / innerHeight - 0.5) * 10; go(); }, { passive: true });
  window.addEventListener('scroll', function () { var r = box.getBoundingClientRect(), c = (r.top + r.height / 2) / innerHeight; ty = Math.max(-9, Math.min(9, (c - 0.5) * 16)); go(); }, { passive: true });
})();

/* Modal dialogs: any [data-open-modal="id"] opens that <dialog>; the close button, backdrop click and Esc close it. */
(function () {
  document.querySelectorAll('[data-open-modal]').forEach(function (b) {
    b.addEventListener('click', function () { var d = document.getElementById(b.dataset.openModal); if (d && d.showModal) { d.showModal(); } });
  });
  document.querySelectorAll('dialog.modal').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close-modal]')) d.close(); });
  });
})();

/* Course catalog: search + a filter panel (delivery, type, level, topic), and the request form (opens the mail app; no server). */
(function () {
  var cat = document.querySelector('[data-catalog]');
  if (cat) {
    var q = cat.querySelector('[data-q]'), rows = [].slice.call(cat.querySelectorAll('[data-course]'));
    var empty = cat.querySelector('[data-empty]'), n = cat.querySelector('[data-n]');
    var panel = cat.querySelector('[data-panel]'), btn = cat.querySelector('[data-fbtn]'), badge = cat.querySelector('[data-fcount]');
    var boxes = [].slice.call(cat.querySelectorAll('[data-f]'));
    function sel(k) { return boxes.filter(function (b) { return b.dataset.f === k && b.checked; }).map(function (b) { return b.value; }); }
    function run() {
      var t = (q.value || '').toLowerCase().trim(), shown = 0, active = 0;
      var f = { modes: sel('modes'), format: sel('format'), levels: sel('levels'), topics: sel('topics') };
      active = f.modes.length + f.format.length + f.levels.length + f.topics.length;
      rows.forEach(function (r) {
        var ok = (!t || r.dataset.text.indexOf(t) > -1);
        ['modes', 'levels', 'topics'].forEach(function (k) {
          if (!ok || !f[k].length) return;
          var have = (r.dataset[k] || '').split('|');
          ok = f[k].some(function (v) { return have.indexOf(v) > -1; });
        });
        if (ok && f.format.length) ok = f.format.indexOf(r.dataset.format) > -1;
        r.hidden = !ok; if (ok) shown++;
      });
      n.textContent = shown; empty.hidden = shown > 0;
      badge.textContent = active; badge.hidden = !active;
    }
    btn.addEventListener('click', function () { var o = panel.hidden; panel.hidden = !o; btn.setAttribute('aria-expanded', o); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
    boxes.forEach(function (b) { b.addEventListener('change', run); });
    cat.querySelector('[data-clear]').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); run(); });
    q.addEventListener('input', run);
  }
  document.querySelectorAll('[data-request]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(f), name = (d.get('name') || '').trim(), mail = (d.get('email') || '').trim();
      var note = f.querySelector('.reqform__note');
      if (!name || !/^\S+@\S+\.\S+$/.test(mail)) { note.textContent = 'Please add your name and a valid email so I can reply.'; return; }
      var body = ['Course: ' + f.dataset.subject, 'Name: ' + name, 'Email: ' + mail, 'Organisation: ' + (d.get('org') || ''), 'Participants: ' + (d.get('size') || ''), 'Delivery: ' + d.get('mode'), 'Dates: ' + (d.get('dates') || ''), '', 'Goals:', d.get('goals') || ''].join('\n');
      location.href = 'mailto:' + f.dataset.user + '@' + f.dataset.domain + '?subject=' + encodeURIComponent('Course request: ' + f.dataset.subject) + '&body=' + encodeURIComponent(body);
      note.textContent = 'Your email app should open with the request ready to send. If it does not, write to ' + f.dataset.user + ' [at] ' + f.dataset.domain + '.';
    });
  });
})();

/* Blog: search + month timeline (built from the rows, so without JS the full list still shows). */
(function () {
  var MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var chev = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };
  document.querySelectorAll('[data-browser]').forEach(function (box) {
    var scope = box.parentNode, rows = [].slice.call(scope.querySelectorAll('[data-brow]'));
    var q = box.querySelector('[data-q]'), n = box.querySelector('[data-n]'), empty = scope.querySelector('[data-empty]'), tl = box.querySelector('[data-tline]');
    var ym = '';
    function run() {
      var t = (q.value || '').toLowerCase().trim(), shown = 0;
      rows.forEach(function (r) {
        var ok = (!t || r.dataset.text.indexOf(t) > -1) && (!ym || r.dataset.ym === ym);
        r.hidden = !ok; if (ok) shown++;
      });
      n.textContent = shown; if (empty) empty.hidden = shown > 0;
    }
    q.addEventListener('input', run);
    if (!tl || !rows.length) return;
    var counts = {}, order = [];
    rows.forEach(function (r) { var k = r.dataset.ym; if (!counts[k]) { counts[k] = 0; order.push(k); } counts[k]++; });
    var html = '<button type="button" class="tline__all" aria-pressed="true">All</button><button type="button" class="tline__arrow" data-dir="-1" aria-label="Earlier months">' + chev('M15 6l-6 6 6 6') + '</button><div class="tline__track"><div class="tline__inner">', year = '';
    order.forEach(function (k) {
      var y = k.slice(0, 4), m = +k.slice(5, 7);
      if (y !== year) { html += '<span class="tline__year"><span>' + y + '</span></span>'; year = y; }
      html += '<button type="button" class="tline__m" data-ym="' + k + '" aria-pressed="false" aria-label="' + MN[m - 1] + ' ' + y + ', ' + counts[k] + (counts[k] === 1 ? ' post' : ' posts') + '">' + MN[m - 1] + '<i>' + counts[k] + '</i></button>';
    });
    html += '</div></div><button type="button" class="tline__arrow" data-dir="1" aria-label="Later months">' + chev('M9 6l6 6-6 6') + '</button>';
    tl.innerHTML = html; tl.hidden = false;
    var track = tl.querySelector('.tline__track'), all = tl.querySelector('.tline__all'), ms = [].slice.call(tl.querySelectorAll('.tline__m'));
    function pick(k) {
      ym = k; all.setAttribute('aria-pressed', String(!k));
      ms.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.ym === k)); });
      run();
    }
    all.addEventListener('click', function () { pick(''); });
    ms.forEach(function (b) { b.addEventListener('click', function () { pick(ym === b.dataset.ym ? '' : b.dataset.ym); }); });
    tl.querySelectorAll('[data-dir]').forEach(function (a) { a.addEventListener('click', function () { track.scrollBy({ left: +a.dataset.dir * track.clientWidth * 0.7, behavior: 'smooth' }); }); });
  });
})();

/* Code blocks: wrap toggle (wrapped by default) and copy button. */
(function () {
  var WRAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 18h5M4 12h13a3 3 0 0 1 0 6h-4M16 15l-3 3 3 3"/></svg>';
  function setWrap(pre, btn, on) {
    pre.classList.toggle('is-nowrap', !on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var t = on ? 'Wrapped: click for single lines' : 'Single lines: click to wrap';
    btn.title = t; btn.setAttribute('aria-label', t);
  }
  document.querySelectorAll('div.highlighter-rouge').forEach(function (box) {
    var code = box.querySelector('pre'); if (!code) return;
    var tools = document.createElement('div'); tools.className = 'codetools';
    var w = document.createElement('button'); w.type = 'button'; w.className = 'iconbtn'; w.innerHTML = WRAP;
    setWrap(code, w, true);
    w.addEventListener('click', function () { setWrap(code, w, code.classList.contains('is-nowrap')); });
    var b = document.createElement('button'); b.type = 'button'; b.className = 'codecopy'; b.textContent = 'Copy'; b.setAttribute('aria-label', 'Copy code');
    b.addEventListener('click', function () {
      var t = code.innerText.replace(/\n$/, '');
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () {});
      else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) {} a.remove(); }
    });
    tools.appendChild(w); tools.appendChild(b); box.appendChild(tools);
  });
  document.querySelectorAll('[data-wrap]').forEach(function (btn) {
    var pre = document.querySelector(btn.getAttribute('data-wrap')); if (!pre) return;
    pre = pre.closest('pre') || pre;
    setWrap(pre, btn, true);
    btn.addEventListener('click', function () { setWrap(pre, btn, pre.classList.contains('is-nowrap')); });
  });
})();

/* Table of contents for long posts: built from the headings, with scroll-spy and a hide/show toggle. */
(function () {
  var box = document.querySelector('[data-toc]'), prose = document.querySelector('[data-prose]');
  if (!box || !prose) return;
  var heads = Array.prototype.slice.call(prose.querySelectorAll('h2, h3')).filter(function (h) { return h.textContent.trim(); });
  if (heads.length < 3) return;
  var used = {};
  heads.forEach(function (h) {
    if (!h.id) {
      var id = h.textContent.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60) || 'section';
      var base = id, n = 2; while (used[id] || document.getElementById(id)) id = base + '-' + n++;
      h.id = id;
    }
    used[h.id] = true;
  });
  var list = '', liOpen = false, subOpen = false;
  heads.forEach(function (h, i) {
    var isSub = h.tagName === 'H3', a = '<a href="#' + h.id + '" data-i="' + i + '">' + h.textContent.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</a>';
    if (!isSub || !liOpen) {                      // a top-level entry (a stray first h3 also starts one)
      if (subOpen) { list += '</ol>'; subOpen = false; }
      if (liOpen) list += '</li>';
      list += '<li>' + a; liOpen = true;
    } else {
      if (!subOpen) { list += '<ol class="toc__sub">'; subOpen = true; }
      list += '<li>' + a + '</li>';
    }
  });
  if (subOpen) list += '</ol>';
  if (liOpen) list += '</li>';
  var ico = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 4h12M2 8h12M2 12h8"/></svg>';
  box.innerHTML = '<div class="toc__panel"><div class="toc__head"><p class="toc__title">On this page</p><button type="button" class="toc__btn" data-toc-hide aria-expanded="true" aria-controls="toc-list">Hide</button></div><ol class="toc__list" id="toc-list">' + list + '</ol></div>' +
    '<button type="button" class="toc__btn toc__open" data-toc-show aria-expanded="false" aria-controls="toc-list">' + ico + 'Contents</button>';
  box.hidden = false;
  var panelList = box.querySelector('.toc__list'), links = box.querySelectorAll('a[data-i]');
  var wide = window.matchMedia('(min-width: 70rem)');
  var stored = null; try { stored = localStorage.getItem('toc'); } catch (e) {}
  function setOff(off, save) {
    box.classList.toggle('is-off', off);
    box.querySelector('[data-toc-hide]').setAttribute('aria-expanded', String(!off));
    box.querySelector('[data-toc-show]').setAttribute('aria-expanded', String(!off));
    if (save) try { localStorage.setItem('toc', off ? 'off' : 'on'); } catch (e) {}
  }
  // default: open on wide screens, closed on narrow ones, unless the reader chose
  function initial() { return stored ? stored === 'off' : !wide.matches; }
  setOff(initial(), false);
  box.querySelector('[data-toc-hide]').addEventListener('click', function () { setOff(true, true); });
  box.querySelector('[data-toc-show]').addEventListener('click', function () { setOff(false, true); });
  // keep the narrow-screen default in step with the window when the reader has not chosen
  if (!stored && wide.addEventListener) wide.addEventListener('change', function () { setOff(!wide.matches, false); });
  // scroll-spy: the current section is the last heading above one third of the window
  var cur = -1, ticking = false;
  function spy() {
    ticking = false;
    var line = window.innerHeight * 0.33, idx = 0;
    for (var i = 0; i < heads.length; i++) { if (heads[i].getBoundingClientRect().top - line <= 0) idx = i; else break; }
    if (idx === cur) return;
    cur = idx;
    links.forEach(function (l, i) { if (i === idx) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
    var l = links[idx];
    if (l && panelList.scrollHeight > panelList.clientHeight) {   // keep the active entry visible inside the scrollable list
      var top = l.offsetTop - panelList.offsetTop, bot = top + l.offsetHeight;
      if (top < panelList.scrollTop + 8) panelList.scrollTop = Math.max(0, top - 24);
      else if (bot > panelList.scrollTop + panelList.clientHeight - 8) panelList.scrollTop = bot - panelList.clientHeight + 24;
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  window.addEventListener('resize', spy);
  // on narrow screens close the list after jumping to a section
  box.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[data-i]'); if (a && !wide.matches) setOff(true, false); });
  spy();
})();

/* Projects: search, sidebar filters built from the items (so new projects and fields need no changes here), sorting, and a list/gallery switch. */
(function () {
  var root = document.querySelector('[data-works]');
  if (!root) return;
  var FAC = [['area', 'Area'], ['status', 'Status'], ['kind', 'Type'], ['platforms', 'Platform'], ['stack', 'Built with'], ['topics', 'Topics'], ['license', 'Licence'], ['year', 'Year']];
  var list = root.querySelector('[data-list]'), items = [].slice.call(root.querySelectorAll('[data-work]'));
  var q = root.querySelector('[data-q]'), n = root.querySelector('[data-n]'), empty = root.querySelector('[data-empty]');
  var side = root.querySelector('[data-side]'), fbtn = root.querySelector('[data-fbtn]'), badge = root.querySelector('[data-fcount]');
  var facWrap = root.querySelector('[data-facets]'), sortSel = root.querySelector('[data-sort]'), clearBtn = root.querySelector('[data-clear]');
  var cfg = root.dataset.facetsCfg; if (cfg) FAC = cfg.split(';').map(function (x) { return x.split('|'); });
  var NS = root.dataset.ns || 'projects';
  var groups = [], OPEN = {};
  try { OPEN = JSON.parse(localStorage.getItem('worksFacets') || '{}') || {}; } catch (e) { OPEN = {}; }
  function vals(it, k) { var v = it.dataset[k] || ''; return v ? v.split('|').filter(Boolean) : []; }
  var MODES = { 'in-person': 'In person', online: 'Online', hybrid: 'Hybrid' };
  function label(k, v) { if (k === 'modes') return MODES[v] || v; return k === 'status' ? v.charAt(0).toUpperCase() + v.slice(1) : v; }
  items.forEach(function (it) { it._t = (it.textContent + ' ' + Object.keys(it.dataset).map(function (k) { return it.dataset[k]; }).join(' ')).toLowerCase().replace(/\|/g, ' '); });

  FAC.forEach(function (f) {
    var k = f[0];
    if (k === 'area' && root.dataset.scope === 'discipline') return;
    var map = {};
    items.forEach(function (it) { vals(it, k).forEach(function (v) { var lk = v.toLowerCase(); if (!map[lk]) map[lk] = { label: label(k, v) }; }); });
    var keys = Object.keys(map); if (!keys.length) return;
    keys.sort(function (a, b) { return k === 'year' ? (b > a ? 1 : -1) : (a > b ? 1 : -1); });
    var fs = document.createElement('div'); fs.className = 'wfacet'; fs.setAttribute('role', 'group');
    var hd = document.createElement('button'); hd.type = 'button'; hd.className = 'wfacet__head';
    hd.innerHTML = '<span class="wfacet__name"></span><i class="wfacet__n" hidden></i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    hd.querySelector('.wfacet__name').textContent = f[1];
    var body = document.createElement('div'); body.className = 'wfacet__body'; body.id = 'wf-' + NS + '-' + k; var inner = document.createElement('div'); inner.className = 'wfacet__inner'; body.appendChild(inner); hd.setAttribute('aria-controls', body.id);
    var open = !!OPEN[NS + ':' + k]; hd.setAttribute('aria-expanded', open); fs.classList.toggle('is-open', open);
    hd.addEventListener('click', function () { var o = !fs.classList.contains('is-open'); hd.setAttribute('aria-expanded', o); fs.classList.toggle('is-open', o); OPEN[NS + ':' + k] = o; try { localStorage.setItem('worksFacets', JSON.stringify(OPEN)); } catch (e) {} });
    fs.appendChild(hd); fs.appendChild(body);
    var g = { key: k, boxes: [], badge: hd.querySelector('.wfacet__n') };
    keys.forEach(function (lk) {
      var lab = document.createElement('label'), cb = document.createElement('input'), sp = document.createElement('span'), c = document.createElement('i');
      cb.type = 'checkbox'; cb.value = lk; sp.textContent = map[lk].label;
      lab.appendChild(cb); lab.appendChild(sp); lab.appendChild(c); inner.appendChild(lab);
      cb.addEventListener('change', run); g.boxes.push({ cb: cb, c: c, lab: lab });
    });
    facWrap.appendChild(fs); groups.push(g);
  });

  function sel(g) { return g.boxes.filter(function (b) { return b.cb.checked; }).map(function (b) { return b.cb.value; }); }
  function has(it, k, set) { return vals(it, k).some(function (v) { return set.indexOf(v.toLowerCase()) > -1; }); }
  function run() {
    var t = (q.value || '').toLowerCase().trim(), shown = 0, active = 0, S = {};
    groups.forEach(function (g) { S[g.key] = sel(g); active += S[g.key].length; g.badge.textContent = S[g.key].length; g.badge.hidden = !S[g.key].length; });
    function pass(it, skip) {
      if (t && it._t.indexOf(t) < 0) return false;
      return groups.every(function (g) { return g.key === skip || !S[g.key].length || has(it, g.key, S[g.key]); });
    }
    items.forEach(function (it) { var ok = pass(it); it.hidden = !ok; if (ok) shown++; });
    groups.forEach(function (g) {
      g.boxes.forEach(function (b) {
        var c = items.filter(function (it) { return pass(it, g.key) && vals(it, g.key).some(function (v) { return v.toLowerCase() === b.cb.value; }); }).length;
        b.c.textContent = c; b.lab.classList.toggle('is-zero', c === 0 && !b.cb.checked);
      });
    });
    n.textContent = shown; empty.hidden = shown > 0;
    badge.textContent = active; badge.hidden = !active;
    clearBtn.hidden = !active;
    [].forEach.call(root.querySelectorAll('[data-fshown]'), function (e) { e.textContent = shown; });
  }
  function sortItems() {
    var m = sortSel.value;
    items.sort(function (a, b) {
      if (m === 'az') return a.dataset.title > b.dataset.title ? 1 : -1;
      if (m === 'za') return a.dataset.title < b.dataset.title ? 1 : -1;
      var d = (a.dataset.date || '') > (b.dataset.date || '') ? 1 : ((a.dataset.date || '') < (b.dataset.date || '') ? -1 : 0);
      return m === 'old' ? d : -d;
    });
    items.forEach(function (it) { list.appendChild(it); });
  }
  function setView(v) {
    root.dataset.view = v;
    [].forEach.call(root.querySelectorAll('[data-view-btn]'), function (b) { b.setAttribute('aria-pressed', b.dataset.viewBtn === v ? 'true' : 'false'); });
    try { localStorage.setItem('worksView', v); } catch (e) {}
  }
  [].forEach.call(root.querySelectorAll('[data-view-btn]'), function (b) { b.addEventListener('click', function () { setView(b.dataset.viewBtn); }); });
  var saved = null; try { saved = localStorage.getItem('worksView'); } catch (e) {}
  if (saved === 'gallery' || saved === 'list') setView(saved);
  /* Filters: a side panel on wide screens; on small screens a sheet that slides up over a dimmed page */
  var scrim = document.createElement('div'); scrim.className = 'wscrim'; scrim.setAttribute('aria-hidden', 'true'); root.appendChild(scrim);
  var wideMq = window.matchMedia('(min-width: 56rem)');
  function sheet(o, restore) {
    if (o === side.classList.contains('is-open')) return;
    side.classList.toggle('is-open', o); fbtn.setAttribute('aria-expanded', o);
    document.documentElement.classList.toggle('sheet-open', o && !wideMq.matches);
    if (o) { var d = side.querySelector('[data-fdone]'); if (d && !wideMq.matches) setTimeout(function () { d.focus(); }, 80); }
    else if (restore) fbtn.focus();
  }
  fbtn.addEventListener('click', function () { sheet(!side.classList.contains('is-open'), true); });
  scrim.addEventListener('click', function () { sheet(false, true); });
  [].forEach.call(root.querySelectorAll('[data-fdone]'), function (b) { b.addEventListener('click', function () { sheet(false, true); }); });
  document.addEventListener('keydown', function (e) {
    if (!side.classList.contains('is-open') || wideMq.matches) return;
    if (e.key === 'Escape') { sheet(false, true); return; }
    if (e.key === 'Tab') {
      var f = [].slice.call(side.querySelectorAll('button, input, a[href]')).filter(function (x) { return x.offsetParent !== null || x === document.activeElement; });
      if (!f.length) return; var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  if (wideMq.addEventListener) wideMq.addEventListener('change', function () { if (wideMq.matches) sheet(false, false); });
  clearBtn.addEventListener('click', function () { groups.forEach(function (g) { g.boxes.forEach(function (b) { b.cb.checked = false; }); }); q.value = ''; run(); });
  q.addEventListener('input', run); sortSel.addEventListener('change', sortItems);
  sortItems(); run();
  if (!groups.length) { fbtn.hidden = true; side.hidden = true; root.classList.add('works--nofilters'); }
})();

/* Research overview: show one latest work at a time, with segments that fill and then hand over to the next. */
(function () {
  var list = document.querySelector('[data-rnews]'); if (!list) return;
  var items = [].slice.call(list.querySelectorAll('.rnews__item')); if (items.length < 2) return;
  var calm = window.siteReducedMotion();
  var nav = document.createElement('div'); nav.className = 'rnews__nav'; nav.setAttribute('role', 'group'); nav.setAttribute('aria-label', 'Choose a work');
  var segs = items.map(function (it, k) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'rnews__seg'; b.setAttribute('aria-label', 'Show work ' + (k + 1) + ' of ' + items.length); b.innerHTML = '<i></i>';
    b.addEventListener('click', function () { show(k); }); nav.appendChild(b); return b;
  });
  var count = document.createElement('span'); count.className = 'rnews__count'; count.setAttribute('aria-hidden', 'true'); nav.appendChild(count);
  var foot = document.querySelector('[data-rnews-foot]'); if (foot) foot.insertBefore(nav, foot.firstChild); else list.parentNode.insertBefore(nav, list.nextSibling);
  var cur = -1, wrap = list.closest('.rlatest, .platest') || list.parentNode, timer = null, held = false;
  function show(i) {
    if (i === cur) return;
    var prev = items[cur];
    if (prev) { prev.classList.add('is-leaving'); setTimeout(function () { prev.classList.remove('is-leaving'); }, 800); }
    items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); it.setAttribute('aria-hidden', k === i ? 'false' : 'true'); it.querySelector('a').tabIndex = k === i ? 0 : -1; });
    segs.forEach(function (sg, k) { sg.classList.toggle('is-active', k === i); sg.classList.toggle('is-done', k < i); var f = sg.firstChild; f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; });
    count.textContent = (i + 1) + ' / ' + items.length; cur = i; arm();
  }
  function arm() { if (!calm) return; clearTimeout(timer); timer = setTimeout(function tick() { if (held) { timer = setTimeout(tick, 800); return; } show((cur + 1) % items.length); }, 6000); }
  list.classList.add('is-live'); wrap.classList.add('is-live'); show(0);
  segs.forEach(function (sg, k) { sg.firstChild.addEventListener('animationend', function () { show((k + 1) % items.length); }); });
  function pause(on) { held = on; wrap.classList.toggle('is-paused', on); }
  [list, nav].forEach(function (el) { el.addEventListener('mouseenter', function () { pause(true); }); el.addEventListener('mouseleave', function () { pause(false); }); });
  wrap.addEventListener('focusin', function () { pause(true); }); wrap.addEventListener('focusout', function (e) { if (!wrap.contains(e.relatedTarget)) pause(false); });
  document.addEventListener('visibilitychange', function () { pause(document.hidden); });
})();

/* Home: news ticker speed follows its length, and it can be paused. */
(function () {
  var bar = document.querySelector('[data-newsbar]'); if (!bar) return;
  var track = bar.querySelector('.newsbar__track'), btn = bar.querySelector('[data-newsbar-pause]');
  function speed() { var first = track.firstElementChild; if (first) { bar.style.setProperty('--nb-t', Math.max(30, Math.round(first.offsetWidth / 55)) + 's'); } }
  speed(); window.addEventListener('resize', speed); if (document.fonts && document.fonts.ready) document.fonts.ready.then(speed);
  if (btn) btn.addEventListener('click', function () {
    var on = !bar.classList.contains('is-paused'); bar.classList.toggle('is-paused', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var t = on ? 'Resume the news ticker' : 'Pause the news ticker'; btn.title = t; btn.setAttribute('aria-label', t);
  });
})();

/* Filter pills: keep the chosen pill in view inside its scrolling row */
(function () {
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.filters .filter');
    if (!b) return;
    var calm = window.siteReducedMotion();
    if (b.scrollIntoView) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: calm ? 'auto' : 'smooth' });
  });
})();


/* Footer switch: choose full or calm motion (remembered in this browser) */
(function () {
  var btn = document.querySelector('[data-motion-toggle]'); if (!btn) return;
  var label = btn.querySelector('[data-motion-label]');
  function paint() {
    var calm = window.siteReducedMotion();
    btn.setAttribute('aria-pressed', calm ? 'false' : 'true');
    if (label) label.textContent = calm ? 'Motion: calm' : 'Motion: full';
  }
  btn.addEventListener('click', function () {
    var next = window.siteReducedMotion() ? 'full' : 'calm';
    document.documentElement.setAttribute('data-motion', next);
    try { localStorage.setItem('motion', next); } catch (e) {}
    paint();
    setTimeout(function () { location.reload(); }, 150);     /* scripts read the preference once; a reload applies it everywhere */
  });
  paint();
})();
