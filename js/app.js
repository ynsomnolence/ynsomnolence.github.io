(function () {
  'use strict';

  var EMAIL = 'kawawebworks@gmail.com';

  var doc = document.documentElement;
  var params = new URLSearchParams(location.search);

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function now() { return performance.now() / 1000; }
  function mailto(subject, body) {
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + (body ? '&body=' + encodeURIComponent(body) : '');
  }

  var PHONE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  function gmail(subject, body) {
    return 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(EMAIL) +
      '&su=' + encodeURIComponent(subject || '') + (body ? '&body=' + encodeURIComponent(body) : '');
  }
  function setContact(a, subject, body) {
    if (PHONE) { a.href = mailto(subject, body); a.removeAttribute('target'); return; }
    a.href = gmail(subject, body); a.target = '_blank'; a.rel = 'noopener noreferrer';
  }
  function upgradeMailLinks() {
    $$('a[data-mail]').forEach(function (a) {
      var k = a.getAttribute('data-mail');
      setContact(a, t('mail.' + k + '.s'), t('mail.' + k + '.b'));
    });
  }

  var I18N = window.KAWA_I18N || { els: [], str: {}, tipos: {} };
  var LANG_KEY = 'kawa-lang';
  var LANG = params.get('lang');
  if (LANG !== 'pt' && LANG !== 'en') {
    try { LANG = localStorage.getItem(LANG_KEY); } catch (e) { LANG = null; }
    if (LANG !== 'pt' && LANG !== 'en') LANG = 'pt';
  }
  var langHooks = [];
  var ptOriginal = [];
  function t(key) { var s = I18N.str[key]; return s ? (s[LANG] || s.pt) : key; }
  function setRich(el, text) {
    var parts = String(text).split(/(<\/?b>|<\/?small>|<br\s*\/?>)/), stack = [el];
    el.textContent = '';
    parts.forEach(function (part) {
      if (!part) return;
      var top0 = stack[stack.length - 1];
      if (/^<br/.test(part)) top0.appendChild(document.createElement('br'));
      else if (part === '<b>' || part === '<small>') { var node = document.createElement(part.slice(1, -1)); top0.appendChild(node); stack.push(node); }
      else if (part === '</b>' || part === '</small>') { if (stack.length > 1) stack.pop(); }
      else top0.appendChild(document.createTextNode(part));
    });
  }
  function applyLang() {
    doc.lang = LANG === 'en' ? 'en' : 'pt-BR';
    if (LANG === 'en' && !ptOriginal.length) {
      I18N.els.forEach(function (row) {
        var nodes = $$(row[0]), many = Array.isArray(row[1]);
        nodes.forEach(function (el, i) {
          var en = many ? row[1][i] : row[1];
          if (en == null) return;
          ptOriginal.push([el, row[2] || null, row[2] ? el.getAttribute(row[2]) : Array.prototype.map.call(el.childNodes, function (n) { return n.cloneNode(true); }), en]);
        });
      });
    }
    ptOriginal.forEach(function (r) {
      if (r[1]) { r[0].setAttribute(r[1], LANG === 'en' ? r[3] : r[2]); return; }
      if (LANG === 'en') setRich(r[0], r[3]);
      else { r[0].textContent = ''; r[2].forEach(function (n) { r[0].appendChild(n.cloneNode(true)); }); }
    });
    $$('.type').forEach(function (el) { if (el.dataset.typed) el.textContent = el.getAttribute('data-text') || ''; });
    $$('.idioma [data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === LANG ? 'true' : 'false'); });
    upgradeMailLinks();
    langHooks.forEach(function (fn) { try { fn(); } catch (e) {} });
    if (window.ScrollTrigger && window.__kawaReady) { try { window.ScrollTrigger.refresh(); } catch (e) {} }
  }
  $$('.idioma [data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-lang');
      if (v === LANG) return;
      LANG = v;
      try { localStorage.setItem(LANG_KEY, v); } catch (e) {}
      applyLang();
    });
  });
  try { applyLang(); } catch (e) { try { upgradeMailLinks(); } catch (e2) {} }

  var SYS_REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var MOTION_KEY = 'kawa-motion';
  function readPref() {
    try { var v = localStorage.getItem(MOTION_KEY); return v === 'on' || v === 'off' ? v : null; } catch (e) { return null; }
  }
  function savePref(v) { try { localStorage.setItem(MOTION_KEY, v); } catch (e) {} }
  var pref = params.get('motion');
  if (pref !== 'on' && pref !== 'off') pref = readPref();

  function run(reduced) {
    try { boot(reduced); }
    catch (err) {
      if (window.__kawaFallback) window.__kawaFallback(String(err && err.message || err));
    }
  }

  function ask() {
    var loader = $('#loader'), box = $('#loaderAsk'), inner = $('#loaderInner');
    if (!loader || !box) return run(true);
    window.__kawaAsking = true;
    loader.removeAttribute('aria-hidden');
    inner.hidden = true; box.hidden = false;
    var answered = false;
    function answer(v) {
      if (answered) return;
      answered = true;
      savePref(v);
      document.removeEventListener('keydown', onKey);
      box.hidden = true; inner.hidden = false;
      loader.setAttribute('aria-hidden', 'true');
      window.__kawaAsking = false;
      run(v === 'off');
    }
    function onKey(e) {
      var k = (e.key || '').toLowerCase();
      if (k === 's' || k === 'y') answer('on'); else if (k === 'n') answer('off');
    }
    $$('[data-motion]', box).forEach(function (b) {
      b.addEventListener('click', function () { answer(b.getAttribute('data-motion')); });
    });
    document.addEventListener('keydown', onKey);
    var first = $('[data-motion]', box);
    if (first && first.focus) first.focus();
  }

  if (SYS_REDUCED && !pref) ask();
  else run(pref ? pref === 'off' : SYS_REDUCED);

  function boot(REDUCED) {
    window.__kawaBooted = true;
    doc.classList.add('js');
    doc.classList.toggle('motion-off', REDUCED);
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var PAPER = '#f3f1ea';
    var INTERACTIVE = 'a,button,input,textarea,select,label,summary,[role="button"],.carrossel__palco';

    function typeText(el, speed) {
      if (!el || el.dataset.done) return;
      el.dataset.done = '1';
      if (REDUCED) { el.textContent = el.getAttribute('data-text') || ''; el.dataset.typed = '1'; return; }
      var i = 0;
      el.textContent = '';
      (function step() {
        var text = el.getAttribute('data-text') || '';
        i++;
        el.textContent = text.slice(0, i);
        if (i < text.length) setTimeout(step, speed || 38); else el.dataset.typed = '1';
      })();
    }

    var loader = $('#loader');
    var pctEl = $('#loaderPct');

    var figura = (function () {
      var canvas = $('#loaderCanvas'), data = window.GAROTA || window.BOBO;
      var nada = { set: function () {}, stop: function () {}, pronta: function () { return true; } };
      if (!canvas || !canvas.getContext || !data) return nada;
      var ctx = canvas.getContext('2d');

      var leve = Math.min(window.innerWidth, window.innerHeight) < 600;
      var idx = [];
      for (var k = 0; k < data.p.length / 3; k++) if (data.p[k * 3 + 2] || !leve || Math.random() < 0.5) idx.push(k);
      var NF = idx.length;

      var BC = leve ? 44 : 64, BL = 3, N = NF + BC * BL;
      var hx = new Float32Array(N), hy = new Float32Array(N), px = new Float32Array(N), py = new Float32Array(N),
          vx = new Float32Array(N), vy = new Float32Array(N), th = new Float32Array(N), born = new Float32Array(N),
          kind = new Uint8Array(N), seed = new Float32Array(N);
      var W = 0, H = 0, dot = 2, prog = 0, raf = 0, ativo = true, mobile = false, mouse = { x: -9999, y: -9999 }, ultimo = 0, tPrev = 0;
      for (var i = 0; i < N; i++) {
        seed[i] = Math.random(); born[i] = -1;
        if (i < NF) {
          var q = idx[i];
          kind[i] = data.p[q * 3 + 2];
          var yn = data.p[q * 3 + 1] / data.h;

          th[i] = kind[i] ? 0.02 + yn * 0.6 + seed[i] * 0.08 : 0.25 + seed[i] * 0.72;
        } else {
          var col = (i - NF) % BC;
          kind[i] = 2;
          th[i] = (col + 0.5) / BC * 0.995;
        }
      }
      function layout() {
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        mobile = W < 860;
        var aw = W * (mobile ? 0.9 : 0.56), ah = H - (mobile ? 190 : 220), ay = mobile ? 36 : 44;
        var s = Math.min(aw / data.w, ah / data.h);
        var fw = data.w * s, fh = data.h * s;
        var ox = (W - fw) / 2, oy = ay + (ah - fh) / 2;
        dot = Math.max(1.3, s * (mobile ? 0.8 : 0.62));
        for (var i = 0; i < NF; i++) {
          var q = idx[i];
          hx[i] = ox + data.p[q * 3] * s; hy[i] = oy + data.p[q * 3 + 1] * s;
        }

        var gap = Math.max(dot * 2.2, 4), bw = gap * (BC - 1), bx0 = (W - bw) / 2, by0 = oy + fh + (mobile ? 30 : 40);
        for (var j = NF; j < N; j++) {
          var c = (j - NF) % BC, l = Math.floor((j - NF) / BC);
          hx[j] = bx0 + c * gap; hy[j] = by0 + l * gap;
        }
        if (REDUCED) for (var r = 0; r < N; r++) { px[r] = hx[r]; py[r] = hy[r]; }
        var hud = $('.loader__hud');
        if (hud) hud.style.top = Math.round(by0 + gap * BL + 14) + 'px';
      }
      function nasce(i, t) {
        born[i] = t; ultimo = t;
        if (REDUCED || kind[i] === 1) { px[i] = hx[i]; py[i] = hy[i]; return; }
        var a = seed[i] * Math.PI * 2, d = (kind[i] === 2 ? 90 : 160) + Math.random() * (kind[i] === 2 ? 220 : 420);
        px[i] = hx[i] + Math.cos(a) * d; py[i] = hy[i] + Math.sin(a) * d;
      }
      function frame() {
        raf = 0;
        if (!ativo) return;
        var t = now();

        var passos = tPrev ? Math.max(1, Math.min(4, Math.round((t - tPrev) * 60))) : 1;
        tPrev = t;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = PAPER;
        var R = mobile ? 70 : 110, R2 = R * R, mx = mouse.x, my = mouse.y;
        for (var i = 0; i < N; i++) {
          if (born[i] < 0) {
            if (prog >= th[i]) nasce(i, t);
            else {
              if (kind[i] === 2) { ctx.globalAlpha = 0.14; ctx.fillRect(hx[i] - dot / 2, hy[i] - dot / 2, dot, dot); }
              continue;
            }
          }
          if (!REDUCED) {
            var bx = hx[i] + Math.sin(t * 0.9 + seed[i] * 40) * 0.6, by = hy[i] + Math.cos(t * 0.7 + seed[i] * 30) * 0.6;
            for (var st = 0; st < passos; st++) {
              vx[i] += (bx - px[i]) * 0.055; vy[i] += (by - py[i]) * 0.055;
              var dx = px[i] - mx, dy = py[i] - my, d2 = dx * dx + dy * dy;
              if (d2 < R2 && d2 > 0.01) { var d = Math.sqrt(d2), f = (1 - d / R) * 4.2; vx[i] += dx / d * f; vy[i] += dy / d * f; }
              vx[i] *= 0.84; vy[i] *= 0.84;
              px[i] += vx[i]; py[i] += vy[i];
            }
          }
          ctx.globalAlpha = (REDUCED ? 1 : Math.min(1, (t - born[i]) / 0.45)) * (kind[i] === 0 ? 0.85 : 1);
          var s = kind[i] === 0 ? dot * 0.85 : dot * 1.05;
          ctx.fillRect(px[i] - s / 2, py[i] - s / 2, s, s);
        }
        ctx.globalAlpha = 1;
        if (!REDUCED) raf = requestAnimationFrame(frame);
      }
      function shock(x, y) {
        var R = mobile ? 150 : 250, R2 = R * R;
        for (var i = 0; i < N; i++) {
          if (born[i] < 0) continue;
          var dx = px[i] - x, dy = py[i] - y, d2 = dx * dx + dy * dy;
          if (d2 > R2) continue;
          var d = Math.sqrt(d2) || 1, f = 1 - d / R;
          f = f * f * 30 + f * 6;
          var j = 0.75 + seed[i] * 0.5;
          vx[i] += dx / d * f * j; vy[i] += dy / d * f * j;
        }
      }
      canvas.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
      canvas.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
      canvas.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') mouse.x = mouse.y = -9999; });
      canvas.addEventListener('pointerdown', function (e) { if (!REDUCED) shock(e.clientX, e.clientY); });
      window.addEventListener('resize', function () { if (ativo) { layout(); if (REDUCED) frame(); } });
      layout();
      if (!REDUCED) raf = requestAnimationFrame(frame);
      return {
        set: function (p) { prog = p; if (REDUCED) frame(); },
        stop: function () { ativo = false; if (raf) cancelAnimationFrame(raf); },

        pronta: function () { return REDUCED || !ultimo || now() - ultimo > 0.75; }
      };
    })();

    function setLoad(p) {
      figura.set(p);
      pctEl.textContent = String(Math.round(p * 100)).padStart(3, '0');
    }

    var waits = [];
    if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
    $$('img').forEach(function (img) {
      if (img.loading === 'lazy') return;

      if (img.complete) return;
      waits.push(new Promise(function (r) { img.addEventListener('load', r); img.addEventListener('error', r); }));
    });
    var done = 0, total = waits.length + 1;
    waits.forEach(function (w) { w.then(function () { done++; }, function () { done++; }); });

    var loadStart = now();
    var MIN_LOAD = REDUCED ? 0.3 : 2.6;
    var MAX_LOAD = 6;
    var shown = 0, lastTick = loadStart;

    function loadTick() {
      var t = now(), dt = Math.min(1, t - lastTick), elapsed = t - loadStart;
      lastTick = t;
      var real = elapsed > MAX_LOAD ? 1 : (done + 1) / total;
      var timed = clamp(elapsed / MIN_LOAD, 0, 1);
      var target = Math.min(real, timed);
      shown += (target - shown) * (1 - Math.exp(-dt * 11));
      if (target >= 1 && (shown > 0.985 || elapsed > MIN_LOAD + 0.6)) shown = 1;
      setLoad(shown);
      if (shown >= 1) return finishLoad();
      setTimeout(loadTick, 30);
    }

    function finishLoad() {
      var fim = now();
      (function espera() {
        if (figura.pronta() || now() - fim > 1.2) return sair();
        setTimeout(espera, 60);
      })();
    }

    function sair() {
      var started = false;
      var start = function () {
        if (started) return;
        started = true;
        window.__kawaReady = true;
        doc.classList.remove('is-loading');
        loader.style.display = 'none';
        figura.stop();
        hero.start();
        typeText($('.hero__tag .type'), 42);
        initReveals();
      };
      if (REDUCED || !window.gsap) return start();
      gsap.to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'power4.inOut', delay: 0.15, onComplete: start });
      setTimeout(function () { hero.start(); }, 450);
      setTimeout(start, 1600);
    }

    var nav = $('#nav');
    $('#navToggle').addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('#navLinks a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); $('#navToggle').setAttribute('aria-expanded', 'false'); });
    });
    var navPct = $('#navPct');
    var sectionLinks = {};
    $$('#navLinks a[href^="#"]').forEach(function (a) { sectionLinks[a.getAttribute('href').slice(1)] = a; });

    sectionLinks.veja = sectionLinks.servicos; sectionLinks.faq = sectionLinks.servicos;
    if ('IntersectionObserver' in window) {
      var navIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var link = sectionLinks[e.target.id];
          if (link && e.isIntersecting) {
            $$('#navLinks a').forEach(function (x) { x.classList.remove('active'); });
            link.classList.add('active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(sectionLinks).forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
    }

    function visibleLoop(el, frame) {
      var running = false, visible = false, raf = 0;
      function loop() { if (!running) return; frame(); raf = requestAnimationFrame(loop); }
      function sync() {
        var should = visible && !document.hidden;
        if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
        else if (!should && running) { running = false; cancelAnimationFrame(raf); }
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { visible = e[0].isIntersecting; sync(); }, { rootMargin: '100px' }).observe(el);
      } else { visible = true; }
      document.addEventListener('visibilitychange', sync);
      return { kick: sync };
    }

    var hero = (function () {
      var canvas = $('#heroCanvas');
      var section = $('#hero');
      var ctx = canvas.getContext('2d');
      var grid = document.createElement('canvas');
      var gctx = grid.getContext('2d');
      var data = window.BOBO;
      var N = data ? data.p.length / 3 : 0;
      var hx = new Float32Array(N), hy = new Float32Array(N), px = new Float32Array(N), py = new Float32Array(N),
          vx = new Float32Array(N), vy = new Float32Array(N), t0 = new Float32Array(N), sx = new Float32Array(N), sy = new Float32Array(N),
          kind = new Uint8Array(N), seed = new Float32Array(N);
      var W = 0, H = 0, dot = 2, startT = 0, started = false, mouse = { x: -9999, y: -9999, active: false }, tilt = null;
      var mobile = false;

      for (var i = 0; i < N; i++) { kind[i] = data.p[i * 3 + 2]; seed[i] = Math.random(); }

      function layout() {
        var r = section.getBoundingClientRect();
        W = r.width; H = r.height;
        canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        mobile = W < 860;

        var aw, ah, ax, ay;
        if (mobile) { aw = W * 0.8; ah = H * 0.34; ax = (W - aw) / 2; ay = 64; }
        else { aw = W * 0.46; ah = H * 0.8; ax = W * 0.5; ay = H * 0.12; }
        var s = Math.min(aw / data.w, ah / data.h);
        var ox = ax + (aw - data.w * s) / 2, oy = ay + (ah - data.h * s) / 2;
        dot = Math.max(1.4, s * (mobile ? 0.85 : 0.62));
        for (var i = 0; i < N; i++) {
          hx[i] = ox + data.p[i * 3] * s; hy[i] = oy + data.p[i * 3 + 1] * s;
          if (!started) {
            var a = seed[i] * Math.PI * 2, d = 200 + Math.random() * 500;
            sx[i] = hx[i] + Math.cos(a) * d; sy[i] = hy[i] + Math.sin(a) * d;
            px[i] = kind[i] ? hx[i] : sx[i]; py[i] = kind[i] ? hy[i] : sy[i];
          }

          var yn = data.p[i * 3 + 1] / data.h;
          t0[i] = kind[i] ? yn * 0.9 + seed[i] * 0.15 : 0.85 + seed[i] * 1.1;
        }
        drawGrid();
      }

      function drawGrid() {
        grid.width = canvas.width; grid.height = canvas.height;
        gctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        gctx.strokeStyle = 'rgba(243,241,234,0.075)';
        gctx.lineWidth = 1;
        var cx = W * 0.62, cy = H * 0.5, R = Math.max(W, H) * 0.62, k = 0.22, step = mobile ? 34 : 46;
        function warp(x, y) {
          var nx = (x - cx) / R, ny = (y - cy) / R, r2 = nx * nx + ny * ny, f = 1 + k * r2;
          return [cx + nx * f * R, cy + ny * f * R];
        }
        var x, y, p;
        for (y = -step * 2; y <= H + step * 2; y += step) {
          gctx.beginPath();
          for (x = -step * 2; x <= W + step * 2; x += 12) { p = warp(x, y); x === -step * 2 ? gctx.moveTo(p[0], p[1]) : gctx.lineTo(p[0], p[1]); }
          gctx.stroke();
        }
        for (x = -step * 2; x <= W + step * 2; x += step) {
          gctx.beginPath();
          for (y = -step * 2; y <= H + step * 2; y += 12) { p = warp(x, y); y === -step * 2 ? gctx.moveTo(p[0], p[1]) : gctx.lineTo(p[0], p[1]); }
          gctx.stroke();
        }
      }

      function frame() {
        var t = started ? now() - startT : 0;
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(grid, 0, 0, W, H);

        var band = ((t * 0.12) % 1.3 - 0.15) * H;
        var g = ctx.createLinearGradient(0, band - 60, 0, band + 60);
        g.addColorStop(0, 'rgba(243,241,234,0)'); g.addColorStop(0.5, 'rgba(243,241,234,0.035)'); g.addColorStop(1, 'rgba(243,241,234,0)');
        ctx.fillStyle = g; ctx.fillRect(0, band - 60, W, 120);

        var mx = mouse.x, my = mouse.y;
        if (!mouse.active && tilt) { mx = W * (0.5 + tilt.x * 0.4); my = H * (0.45 + tilt.y * 0.35); }
        var R = mobile ? 70 : 110, R2 = R * R, base = mobile ? 0.8 : 1;
        ctx.fillStyle = PAPER;
        for (var i = 0; i < N; i++) {
          if (t < t0[i]) continue;
          var age = t - t0[i];

          var bx = hx[i] + Math.sin(t * 0.9 + seed[i] * 40) * 0.6, by = hy[i] + Math.cos(t * 0.7 + seed[i] * 30) * 0.6;
          vx[i] += (bx - px[i]) * 0.055; vy[i] += (by - py[i]) * 0.055;
          var dx = px[i] - mx, dy = py[i] - my, d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            var d = Math.sqrt(d2), f = (1 - d / R) * 4.2;
            vx[i] += dx / d * f; vy[i] += dy / d * f;
          }
          vx[i] *= 0.84; vy[i] *= 0.84;
          px[i] += vx[i]; py[i] += vy[i];
          var a = Math.min(1, age / 0.45) * (kind[i] ? 1 : 0.88) * base;
          ctx.globalAlpha = a;
          var s = kind[i] ? dot * 1.05 : dot * 0.85;
          ctx.fillRect(px[i] - s / 2, py[i] - s / 2, s, s);
        }
        ctx.globalAlpha = 1;
      }

      function staticFrame() {
        for (var i = 0; i < N; i++) { px[i] = hx[i]; py[i] = hy[i]; t0[i] = 0; }
        startT = now() - 10; started = true; frame();
      }

      function shock(x, y) {
        var R = mobile ? 150 : 250, R2 = R * R;
        for (var i = 0; i < N; i++) {
          var dx = px[i] - x, dy = py[i] - y, d2 = dx * dx + dy * dy;
          if (d2 > R2) continue;
          var d = Math.sqrt(d2) || 1, f = (1 - d / R);
          f = f * f * 30 + f * 6;
          var j = 0.75 + seed[i] * 0.5;
          vx[i] += dx / d * f * j; vy[i] += dy / d * f * j;
        }
      }

      var loop = visibleLoop(section, frame);

      section.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
      });
      section.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; mouse.active = false; });
      section.addEventListener('click', function (e) {
        if (REDUCED || !started || (e.target.closest && e.target.closest(INTERACTIVE))) return;
        var r = canvas.getBoundingClientRect();
        shock(e.clientX - r.left, e.clientY - r.top);
      });

      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
        window.addEventListener('deviceorientation', function (e) {
          if (e.gamma == null) return;
          tilt = { x: clamp(e.gamma / 35, -1, 1), y: clamp((e.beta - 45) / 35, -1, 1) };
        });
      }
      window.addEventListener('resize', function () { if (!N) return; layout(); if (REDUCED) staticFrame(); });

      if (N) layout();
      return {
        start: function () {
          if (!N || started) return;
          if (REDUCED) { staticFrame(); return; }
          startT = now(); started = true;
          loop.kick();
        }
      };
    })();

    (function wired() {
      var section = $('#kagutsuchi');
      if (!section) return;
      var panels = $$('.panel', section), steps = $$('.wired__steps li', section), station = $('#wiredStation');
      var scene = null;
      var cv = $('#corredorCanvas');
      if (window.Corredor && cv && cv.getContext) {
        try { scene = window.Corredor.init(cv, { grain: false, reducedMotion: REDUCED }); } catch (err) { scene = null; }
      }
      var current = -1, lastStation = '', queued = false;
      function update() {
        queued = false;
        var vh = window.innerHeight;
        var r = section.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;

        var p = clamp((vh * 0.6 - r.top) / ((r.height - vh * 0.6) || 1), 0, 1);
        if (scene && scene.setProgress) scene.setProgress(p);
        var st = 'A' + Math.min(6, Math.floor(p * 7));
        if (station && st !== lastStation) { lastStation = st; station.textContent = st; }

        var best = 0, bestD = Infinity;
        for (var i = 0; i < panels.length; i++) {
          var b = panels[i].getBoundingClientRect();
          var d = Math.abs(b.top + b.height / 2 - vh / 2);
          if (d < bestD) { bestD = d; best = i; }
          if (!REDUCED) {
            var f = clamp(1 - (d - vh * 0.16) / (vh * 0.4), 0, 1);
            f = f * f * (3 - 2 * f);
            panels[i].style.setProperty('--f', f.toFixed(3));
          }
        }
        if (best !== current) {
          current = best;
          steps.forEach(function (el, k) { el.classList.toggle('active', k === best); });
        }
      }
      function request() { if (!queued) { queued = true; requestAnimationFrame(update); } }
      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request);
      update();
    })();

    function anel3d(o) {
      var box = $(o.box), palco = $(o.palco), anel = $(o.anel);
      if (!box || !palco || !anel) return;
      var items = $$(o.item, anel), N = items.length;
      if (N < 2) return;
      var vivo = $(o.vivo);
      box.classList.add('is-3d');
      palco.tabIndex = 0;

      var pos = 0, alvo = 0, vel = 0, ativa = -1, falou = false;
      var tiltX = 0, tiltY = 0, tX = 0, tY = 0;
      var drag = null, raf = 0, G;
      function mod(a, n) { return ((a % n) + n) % n; }
      function geo() { G = o.geo(palco.clientWidth); }
      geo();

      function render() {
        for (var i = 0; i < N; i++) {
          var off = mod(i - pos + N / 2, N) - N / 2;
          var th = off * (2 * Math.PI / N);
          var c = Math.cos(th), near = (c + 1) / 2;
          var x = Math.sin(th) * G.R, z = (c - 1) * G.R * 0.95, y = -Math.pow(1 - c, 1.7) * G.up;
          var s = items[i].style;
          s.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + (Math.sin(th) * G.giro).toFixed(2) + 'deg)';
          s.opacity = (0.28 + 0.72 * Math.pow(near, 2.4)).toFixed(3);
          s.filter = near > 0.985 ? 'none' : 'grayscale(1) brightness(' + (0.55 + 0.45 * near).toFixed(2) + ') blur(' + ((1 - near) * 1.4).toFixed(2) + 'px)';
        }
        anel.style.transform = 'rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + tiltY.toFixed(2) + 'deg)';
        var a = mod(Math.round(pos), N);
        if (a !== ativa) {
          ativa = a;
          items.forEach(function (el, k) { el.classList.toggle('ativa', k === a); });
          if (vivo && falou) vivo.textContent = o.nome(items[a]);
        }
      }
      function tick() {
        raf = 0;
        if (!drag) {
          if (REDUCED) { pos = alvo; vel = 0; }
          else { vel = (vel + (alvo - pos) * 0.075) * 0.78; pos += vel; }
        }
        tiltX += (tX - tiltX) * 0.08; tiltY += (tY - tiltY) * 0.08;
        var parado = !drag && Math.abs(alvo - pos) < 0.0006 && Math.abs(vel) < 0.0006 && Math.abs(tX - tiltX) < 0.02 && Math.abs(tY - tiltY) < 0.02;
        if (parado) { pos = alvo; vel = 0; tiltX = tX; tiltY = tY; }
        render();
        if (!parado) raf = requestAnimationFrame(tick);
      }
      function kick() { if (!raf) raf = requestAnimationFrame(tick); }
      function passo(d) { falou = true; alvo = Math.round(alvo) + d; kick(); }
      function ir(i) { falou = true; var cur = Math.round(alvo); alvo = cur + (mod(i - cur + N / 2, N) - N / 2); kick(); }

      palco.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        drag = { x: e.clientX, p0: pos, v: 0, moved: false, id: e.pointerId };
        vel = 0;
      });
      palco.addEventListener('pointermove', function (e) {
        if (drag) {
          var dx = e.clientX - drag.x;
          if (!drag.moved && Math.abs(dx) > 6) {
            drag.moved = true; falou = true;
            palco.classList.add('arrastando');
            try { palco.setPointerCapture(drag.id); } catch (err) {}
          }
          if (drag.moved) { var np = drag.p0 - dx / (G.R * 1.25); drag.v = np - pos; pos = np; kick(); }
        }
        if (!REDUCED && e.pointerType === 'mouse') {
          var r = palco.getBoundingClientRect();
          tY = ((e.clientX - r.left) / r.width - 0.5) * 14;
          tX = -((e.clientY - r.top) / r.height - 0.5) * 10;
          kick();
        }
      });
      function soltar(e) {
        if (!drag) return;
        var d = drag; drag = null;
        palco.classList.remove('arrastando');
        if (d.moved) { alvo = Math.round(pos + d.v * 7); vel = d.v; kick(); return; }
        if (e.type !== 'pointerup') return;
        var card = e.target.closest ? e.target.closest(o.item) : null;
        var idx = card ? items.indexOf(card) : -1;
        if (idx >= 0 && idx !== ativa) return ir(idx);
        if (idx < 0) {
          var r = palco.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width;
          if (fx < 0.33) passo(-1); else if (fx > 0.67) passo(1);
        }
      }
      palco.addEventListener('pointerup', soltar);
      palco.addEventListener('pointercancel', soltar);
      palco.addEventListener('pointerleave', function () { tX = tY = 0; kick(); });
      palco.addEventListener('dragstart', function (e) { e.preventDefault(); });
      palco.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); passo(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); passo(1); }
      });
      window.addEventListener('resize', function () { geo(); render(); });
      render();
    }
    anel3d({ box: '#langCarrossel', palco: '#langPalco', anel: '#langAnel', item: '.lang', vivo: '#langAtual',
      geo: function (w) { return { R: clamp(w * 0.3, 130, 360), up: w < 600 ? 40 : 64, giro: 38 }; },
      nome: function (el) { return el.querySelector('b').textContent; } });
    anel3d({ box: '#appCarrossel', palco: '#appPalco', anel: '#appAnel', item: '.app', vivo: '#appAtual',
      geo: function (w) { return { R: clamp(w * 0.26, 120, 300), up: w < 600 ? 14 : 22, giro: 30 }; },
      nome: function (el) { return el.getAttribute('data-nome'); } });

    function initReveals() {
      var items = $$('.reveal');
      if (REDUCED || !window.gsap || !window.ScrollTrigger) {
        items.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
      } else {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.batch(items, {
          start: 'top 88%',
          onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }); }
        });
        gsap.to('.wired__title', { letterSpacing: '0.07em', ease: 'none', scrollTrigger: { trigger: '#kagutsuchi', start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.fromTo('.contato__title', { y: 60, opacity: 0 }, { y: 0, opacity: 1, ease: 'power3.out', scrollTrigger: { trigger: '#contato', start: 'top 70%', end: 'top 25%', scrub: true } });
      }

      var q = $('.type--quote');
      if (q && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (e, io) { if (e[0].isIntersecting) { typeText(q, 34); io.disconnect(); } }, { threshold: 0.6 }).observe(q);
      } else typeText(q);
    }

    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      navPct.textContent = String(Math.round(clamp(window.scrollY / (max || 1), 0, 1) * 100)).padStart(3, '0');
    }, { passive: true });

    (function contato() {
      var canvas = $('#fumacaCanvas'), bobo = $('.contato__bobo');
      if (!window.Fumaca || !canvas || !canvas.getContext || !bobo) return;
      var scene;

      var TIP = [0.2, 0.34];
      function origin() {
        var c = canvas.getBoundingClientRect(), b = bobo.getBoundingClientRect();
        if (!b.width || !c.width) return [0.75, 0.75];
        return [clamp((b.left + b.width * TIP[0] - c.left) / c.width, 0, 1), clamp((b.top + b.height * TIP[1] - c.top) / c.height, 0, 1)];
      }
      function init() {
        try { scene = window.Fumaca.init(canvas, { origin: origin(), intensity: 0.8, reducedMotion: REDUCED }); } catch (err) { scene = null; }
      }
      if (bobo.complete) init(); else bobo.addEventListener('load', init);
      window.addEventListener('resize', function () { if (scene && scene.setOrigin) { var o = origin(); scene.setOrigin(o[0], o[1]); } });
    })();

    $$('[data-copy]').forEach(function (btn) {
      var label = $('[data-copy-label]', btn) || btn, original = label.textContent, timer = 0;
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var ok = function () {
          label.textContent = t('copiado');
          clearTimeout(timer);
          timer = setTimeout(function () { label.textContent = original; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, ok); else ok();
      });
    });

    (function () {
      var btn = $('#motionToggle');
      if (!btn) return;
      btn.hidden = false;
      var label = function () { btn.textContent = t(REDUCED ? 'mov.off' : 'mov.on'); };
      langHooks.push(label);
      label();
      btn.addEventListener('click', function () {
        savePref(REDUCED ? 'on' : 'off');
        var p = new URLSearchParams(location.search);
        p.delete('motion');
        var qs = p.toString();
        location.replace(location.pathname + (qs ? '?' + qs : ''));
      });
    })();

    (function cliques() {
      var canvas = $('#fxCanvas'), data = window.BOBO;
      if (REDUCED || !canvas || !canvas.getContext || !data) return;
      var ctx = canvas.getContext('2d');
      var NP = data.p.length / 3;
      var W = 0, H = 0, parts = [], rings = [], raf = 0;
      var mouse = { x: -9999, y: -9999 };
      var MAX = 1500;

      function size() {
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }

      function burst(cx, cy) {
        var mobile = W < 860;
        var Rpx = mobile ? 80 : 120, s = mobile ? 4.4 : 5.4, rd = Rpx / s, rd2 = rd * rd;

        var i0 = (Math.random() * NP) | 0;
        var ox = clamp(data.p[i0 * 3], rd * 0.7, data.w - rd * 0.7), oy = clamp(data.p[i0 * 3 + 1], rd * 0.7, data.h - rd * 0.7);
        var flip = Math.random() < 0.5 ? -1 : 1;
        var sy = window.scrollY, t = now();
        for (var i = 0; i < NP; i++) {
          var dx = data.p[i * 3] - ox, dy = data.p[i * 3 + 1] - oy, d2 = dx * dx + dy * dy;
          if (d2 > rd2) continue;
          var edge = 1 - Math.sqrt(d2) / rd;
          if (edge < 0.3 && Math.random() > edge / 0.3) continue;
          var a = Math.random() * 6.2832, v = 5 + Math.random() * 20;
          parts.push({
            hx: cx + dx * s * flip, hy: cy + sy + dy * s, x: cx, y: cy + sy,
            vx: Math.cos(a) * v, vy: Math.sin(a) * v,
            cx: cx, cy: cy + sy, born: t, life: 1.5 + Math.random() * 0.8,
            k: data.p[i * 3 + 2], sz: s * (data.p[i * 3 + 2] ? 0.62 : 0.5)
          });
        }
        if (parts.length > MAX) parts.splice(0, parts.length - MAX);
        rings.push({ x: cx, y: cy + sy, born: t, r: Rpx * 1.25 });
        if (!raf) raf = requestAnimationFrame(frame);
      }

      function frame() {
        raf = 0;
        var t = now(), sy = window.scrollY;
        ctx.clearRect(0, 0, W, H);
        var mx = mouse.x, my = mouse.y + sy, R = 90, R2 = R * R;
        var i, p, age;

        ctx.lineWidth = 1; ctx.strokeStyle = PAPER;
        for (i = rings.length - 1; i >= 0; i--) {
          var g = rings[i]; age = (t - g.born) / 0.55;
          if (age >= 1) { rings.splice(i, 1); continue; }
          var e = 1 - Math.pow(1 - age, 3);
          ctx.globalAlpha = (1 - age) * 0.35;
          ctx.beginPath(); ctx.arc(g.x, g.y - sy, g.r * e, 0, 6.2832); ctx.stroke();
        }
        ctx.fillStyle = PAPER;
        for (i = parts.length - 1; i >= 0; i--) {
          p = parts[i]; age = t - p.born;
          if (age >= p.life) { parts.splice(i, 1); continue; }
          var left = p.life - age;
          if (left > 0.6) {
            p.vx += (p.hx - p.x) * 0.055; p.vy += (p.hy - p.y) * 0.055;
          } else {
            var ex = p.x - p.cx, ey = p.y - p.cy, ed = Math.sqrt(ex * ex + ey * ey) || 1;
            p.vx += ex / ed * 0.5; p.vy += ey / ed * 0.5 - 0.12;
          }
          var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) { var d = Math.sqrt(d2), f = (1 - d / R) * 4.2; p.vx += dx / d * f; p.vy += dy / d * f; }
          p.vx *= 0.84; p.vy *= 0.84;
          p.x += p.vx; p.y += p.vy;
          ctx.globalAlpha = Math.min(1, age / 0.12) * clamp(left / 0.6, 0, 1) * (p.k ? 1 : 0.85);
          ctx.fillRect(p.x - p.sz / 2, p.y - sy - p.sz / 2, p.sz, p.sz);
        }
        ctx.globalAlpha = 1;
        if (parts.length || rings.length) raf = requestAnimationFrame(frame);
        else ctx.clearRect(0, 0, W, H);
      }

      size();
      window.addEventListener('resize', size);
      window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
      document.addEventListener('click', function (e) {
        if (e.button || doc.classList.contains('is-loading')) return;
        var el = e.target;
        if (!el || !el.closest || el.closest(INTERACTIVE)) return;
        var sel = window.getSelection && String(window.getSelection());
        if (sel) return;
        burst(e.clientX, e.clientY);
      });
    })();

    setTimeout(loadTick, 30);
  }
})();
