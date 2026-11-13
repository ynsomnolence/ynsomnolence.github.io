(function (global) {
  'use strict';

  var TAU = Math.PI * 2;

  var PERM = new Uint8Array(512);
  var VAL = new Float32Array(256);
  (function () {
    var i, j, t, s = 1337;
    function rnd() {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    }
    var p = new Uint8Array(256);
    for (i = 0; i < 256; i++) { p[i] = i; VAL[i] = rnd() * 2 - 1; }
    for (i = 255; i > 0; i--) {
      j = Math.floor(rnd() * (i + 1));
      t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (i = 0; i < 512; i++) PERM[i] = p[i & 255];
  })();

  function noise3(x, y, z) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var xf = x - xi, yf = y - yi, zf = z - zi;

    var u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    var v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    var w = zf * zf * zf * (zf * (zf * 6 - 15) + 10);
    xi &= 255; yi &= 255; zi &= 255;
    var a = PERM[xi] + yi, b = PERM[xi + 1] + yi;
    var aa = PERM[a] + zi, ab = PERM[a + 1] + zi;
    var ba = PERM[b] + zi, bb = PERM[b + 1] + zi;
    var x00 = VAL[PERM[aa]] + (VAL[PERM[ba]] - VAL[PERM[aa]]) * u;
    var x10 = VAL[PERM[ab]] + (VAL[PERM[bb]] - VAL[PERM[ab]]) * u;
    var x01 = VAL[PERM[aa + 1]] + (VAL[PERM[ba + 1]] - VAL[PERM[aa + 1]]) * u;
    var x11 = VAL[PERM[ab + 1]] + (VAL[PERM[bb + 1]] - VAL[PERM[ab + 1]]) * u;
    var y0 = x00 + (x10 - x00) * v;
    var y1 = x01 + (x11 - x01) * v;
    return y0 + (y1 - y0) * w;
  }

  function smooth(a, b, x) {
    var t = (x - a) / (b - a);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  }

  function makeSprite(r, g, b) {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var x = c.getContext('2d');
    var gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    var rgb = 'rgba(' + r + ',' + g + ',' + b + ',';
    gr.addColorStop(0, rgb + '1)');
    gr.addColorStop(0.2, rgb + '0.72)');
    gr.addColorStop(0.45, rgb + '0.32)');
    gr.addColorStop(0.72, rgb + '0.08)');
    gr.addColorStop(1, rgb + '0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
    return c;
  }

  function init(canvas, opts) {
    opts = opts || {};
    if (!canvas || !canvas.getContext) return noopApi();
    var ctx = canvas.getContext('2d');
    if (!ctx) return noopApi();

    var mq = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduced = typeof opts.reducedMotion === 'boolean' ? opts.reducedMotion : !!(mq && mq.matches);
    var intensity = opts.intensity != null ? Math.max(0, Math.min(1.5, +opts.intensity)) : 1;
    var background = opts.background || null;
    var warm = opts.prewarm != null ? Math.max(0, Math.min(30, +opts.prewarm)) : 7;

    var spriteInk = makeSprite(243, 241, 234);
    var spriteMid = makeSprite(138, 138, 133);

    var w = 0, h = 0, dpr = 1, small = false;
    var U = 1;
    var fx = 0.5, fy = 0.92;
    if (opts.origin && opts.origin.length === 2) { fx = +opts.origin[0]; fy = +opts.origin[1]; }
    var ox = 0, oy = 0;
    var time = 0, last = 0, raf = 0;
    var visible = true, destroyed = false;

    var maxPuffs = 110, threadPts = 36, THREADS = 3;
    var puffs = [];
    var threads = [];
    var puffAcc = 0;
    var puffLife = 8, threadLife = 7, threadEvery = 0.195, puffRate = 13.5;

    var ptr = { x: -9999, y: -9999, vx: 0, vy: 0, on: false, t: 0 };
    var V = [0, 0];

    function flow(x, y, off) {
      var rise = (oy - y) / h;
      if (rise < 0) rise = 0;
      var turb = smooth(0.03, 0.42, rise);
      var s = 1 / (150 * U);
      var nx = x * s, ny = y * s + time * 0.2, nz = time * 0.1 + off;
      var e = 0.08;

      var n0 = noise3(nx, ny, nz) + 0.4 * noise3(nx * 2.3 + 7.1, ny * 2.3, nz * 1.6);
      var dndx = (noise3(nx + e, ny, nz) + 0.4 * noise3((nx + e) * 2.3 + 7.1, ny * 2.3, nz * 1.6) - n0) / e;
      var dndy = (noise3(nx, ny + e, nz) + 0.4 * noise3(nx * 2.3 + 7.1, (ny + e) * 2.3, nz * 1.6) - n0) / e;
      var amp = (7 + 46 * turb) * U;

      var up = (122 - 58 * smooth(0, 0.7, rise)) * U;

      var breeze = noise3(time * 0.07, 3.7, 0.5) * 16 * U * smooth(0, 0.5, rise);
      V[0] = dndy * amp + breeze;

      var cy = -dndx * amp;
      if (cy > up * 0.5) cy = up * 0.5;
      V[1] = cy - up;
    }

    function pointerForce(p, dt) {
      if (!ptr.on) return;
      var dx = p.x - ptr.x, dy = p.y - ptr.y;
      var R = 130 * U + 40;
      var d2 = dx * dx + dy * dy;
      if (d2 > R * R) return;
      var d = Math.sqrt(d2) + 0.001;
      var fall = 1 - d / R; fall *= fall;
      var push = 520 * U * fall * dt;
      var ux = dx / d, uy = dy / d;

      p.vx += ux * push - uy * push * 0.55 + ptr.vx * fall * 1.6 * dt;
      p.vy += uy * push + ux * push * 0.55 + ptr.vy * fall * 1.6 * dt;
    }

    function emitPuff() {
      if (puffs.length >= maxPuffs) return;
      var r = Math.random();
      puffs.push({
        x: ox + (Math.random() - 0.5) * 5 * U,
        y: oy - Math.random() * 4 * U,
        vx: (Math.random() - 0.5) * 8 * U,
        vy: 0,
        age: 0,
        life: puffLife * (0.75 + Math.random() * 0.5),
        size: (4 + Math.random() * 6) * U,
        grow: (14 + Math.random() * 16) * U,
        tone: r < 0.62 ? 0 : 1,
        k: 0.6 + Math.random() * 0.8,
        off: Math.random() * 0.7 - 0.1
      });
    }
    function emitThreadPoint(th) {
      if (th.pts.length >= threadPts) th.pts.shift();
      th.pts.push({ x: ox + th.dx * U, y: oy, vx: 0, vy: 0, age: 0 });
    }

    function step(dt) {
      time += dt;
      var damp = Math.exp(-dt * 1.6);
      var i, j, p, th;

      puffAcc += dt * puffRate * intensity;
      while (puffAcc >= 1) { puffAcc -= 1; emitPuff(); }
      for (i = puffs.length - 1; i >= 0; i--) {
        p = puffs[i];
        p.age += dt;
        if (p.age >= p.life) {
          puffs[i] = puffs[puffs.length - 1]; puffs.pop();
          continue;
        }
        flow(p.x, p.y, p.off);
        pointerForce(p, dt);
        p.vx *= damp; p.vy *= damp;
        p.x += (V[0] + p.vx) * dt;
        p.y += (V[1] * 0.92 + p.vy) * dt;
      }

      for (j = 0; j < threads.length; j++) {
        th = threads[j];
        th.acc += dt;
        while (th.acc >= threadEvery) { th.acc -= threadEvery; emitThreadPoint(th); }
        for (i = th.pts.length - 1; i >= 0; i--) {
          p = th.pts[i];
          p.age += dt;
          flow(p.x, p.y, th.off);
          pointerForce(p, dt);
          p.vx *= damp; p.vy *= damp;
          p.x += (V[0] + p.vx) * dt;
          p.y += (V[1] + p.vy) * dt;
        }

        while (th.pts.length && th.pts[0].age >= threadLife) th.pts.shift();
      }

      ptr.vx *= Math.exp(-dt * 6); ptr.vy *= Math.exp(-dt * 6);
      if (ptr.on && time - ptr.t > 2.5) ptr.on = false;
    }

    function draw() {
      if (!w || !h) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, w, h); }
      else ctx.clearRect(0, 0, w, h);

      var i, j, p, t, a, r;

      for (i = 0; i < puffs.length; i++) {
        p = puffs[i];
        t = p.age / p.life;

        a = smooth(0.03, 0.32, t) * (1 - smooth(0.36, 1, t));
        a *= (p.tone ? 0.075 : 0.052) * p.k * intensity;
        if (a < 0.003) continue;
        r = p.size + p.grow * p.age;
        ctx.globalAlpha = a > 1 ? 1 : a;
        ctx.drawImage(p.tone ? spriteMid : spriteInk, p.x - r, p.y - r, r * 2, r * 2);
      }

      ctx.lineCap = 'butt';
      ctx.lineJoin = 'round';
      for (j = 0; j < threads.length; j++) {
        var pts = threads[j].pts, n = pts.length;
        if (n < 3) continue;
        ctx.strokeStyle = j === 1 ? '#8a8a85' : '#f3f1ea';
        var base = (j === 0 ? 0.66 : j === 1 ? 0.55 : 0.34) * Math.min(1, intensity);
        for (i = 1; i < n - 1; i++) {
          var p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
          t = p1.age / threadLife;

          var dx = p2.x - p0.x, dy = p2.y - p0.y;
          var stretch = Math.sqrt(dx * dx + dy * dy) / (threadEvery * 230 * U);
          a = base * (1 - smooth(0.3, 1, t)) * (1 - smooth(1.6, 4.5, stretch));
          if (a < 0.01) continue;
          ctx.globalAlpha = a;
          ctx.lineWidth = (1.1 + 2.6 * t) * (small ? 0.9 : 1);
          ctx.beginPath();
          ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
          ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
          ctx.stroke();
        }

        var q = pts[n - 1], q0 = pts[n - 2];
        ctx.globalAlpha = base;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo((q0.x + q.x) / 2, (q0.y + q.y) / 2);
        ctx.lineTo(q.x, q.y);
        ctx.lineTo(ox + threads[j].dx * U, oy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      raf = 0;
      if (destroyed) return;
      var dt = last ? Math.min(1 / 30, (now - last) / 1000) : 1 / 60;
      last = now;
      step(dt);
      draw();
      schedule();
    }
    function schedule() {
      if (raf || destroyed || reduced || !visible || document.hidden) return;
      raf = global.requestAnimationFrame(frame);
    }
    function pause() {
      if (raf) { global.cancelAnimationFrame(raf); raf = 0; }
      last = 0;
    }

    function prewarm(seconds) {
      var n = Math.round(seconds * 30), i;
      for (i = 0; i < n; i++) step(1 / 30);
    }
    function reset() {
      puffs.length = 0;
      threads.length = 0;
      for (var j = 0; j < THREADS; j++) {
        threads.push({ pts: [], acc: j * threadEvery / THREADS, off: j * 0.27, dx: (j - (THREADS - 1) / 2) * 2.2 });
      }
      puffAcc = 0;
    }

    function resize() {
      if (destroyed) return;
      var r = canvas.getBoundingClientRect();
      var nw = Math.round(r.width || canvas.clientWidth || canvas.width);
      var nh = Math.round(r.height || canvas.clientHeight || canvas.height);
      if (!nw || !nh) return;
      var first = !w;
      var sx = w ? nw / w : 1, sy = h ? nh / h : 1;
      dpr = Math.min(global.devicePixelRatio || 1, 2);
      w = nw; h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      small = w < 700;
      U = Math.max(0.55, Math.min(1.5, h / 900));
      if (small) {
        maxPuffs = 36; threadPts = 18; threadEvery = 0.34; threadLife = 6; puffRate = 4.4;
      } else {
        maxPuffs = 110; threadPts = 36; threadEvery = 0.195; threadLife = 7; puffRate = 13.5;
      }
      ox = fx * w; oy = fy * h;
      if (first) {
        reset();
        prewarm(reduced ? 9 : warm);
      } else {

        var i, j;
        for (i = 0; i < puffs.length; i++) { puffs[i].x *= sx; puffs[i].y *= sy; }
        for (j = 0; j < threads.length; j++) {
          var pts = threads[j].pts;
          while (pts.length > threadPts) pts.shift();
          for (i = 0; i < pts.length; i++) { pts[i].x *= sx; pts[i].y *= sy; }
        }
        if (puffs.length > maxPuffs) puffs.length = maxPuffs;
      }
      draw();
    }

    function onPointer(e) {
      if (!w) return;
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < -60 || y < -60 || x > r.width + 60 || y > r.height + 60) { ptr.on = false; return; }
      if (ptr.on) {

        ptr.vx += ((x - ptr.x) * 60 - ptr.vx) * 0.35;
        ptr.vy += ((y - ptr.y) * 60 - ptr.vy) * 0.35;
        var m = 900 * U;
        ptr.vx = Math.max(-m, Math.min(m, ptr.vx));
        ptr.vy = Math.max(-m, Math.min(m, ptr.vy));
      }
      ptr.x = x; ptr.y = y; ptr.on = true; ptr.t = time;
    }
    function onLeave() { ptr.on = false; }
    function onVisibility() { if (document.hidden) pause(); else schedule(); }
    function onResize() { resize(); }
    function onMotionChange() {
      if (typeof opts.reducedMotion === 'boolean') return;
      reduced = !!mq.matches;
      if (reduced) { pause(); draw(); } else schedule();
    }

    global.addEventListener('pointermove', onPointer, { passive: true });
    global.addEventListener('pointerdown', onPointer, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    global.addEventListener('blur', onLeave);
    global.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    if (mq) {
      if (mq.addEventListener) mq.addEventListener('change', onMotionChange);
      else if (mq.addListener) mq.addListener(onMotionChange);
    }

    var io = null, ro = null;
    if ('IntersectionObserver' in global) {
      io = new global.IntersectionObserver(function (entries) {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) schedule(); else pause();
      }, { threshold: 0 });
      io.observe(canvas);
    }
    if ('ResizeObserver' in global) {
      ro = new global.ResizeObserver(function () {
        var r = canvas.getBoundingClientRect();
        if (Math.round(r.width) !== w || Math.round(r.height) !== h) resize();
      });
      ro.observe(canvas);
    }

    resize();
    schedule();

    return {
      resize: resize,

      setOrigin: function (nfx, nfy) {
        nfx = +nfx; nfy = +nfy;
        if (nfx !== nfx || nfy !== nfy) return;
        fx = nfx; fy = nfy;
        ox = fx * w; oy = fy * h;
        if (reduced && w) {
          reset(); prewarm(9); draw();
        }
      },
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        pause();
        global.removeEventListener('pointermove', onPointer);
        global.removeEventListener('pointerdown', onPointer);
        document.removeEventListener('pointerleave', onLeave);
        global.removeEventListener('blur', onLeave);
        global.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibility);
        if (mq) {
          if (mq.removeEventListener) mq.removeEventListener('change', onMotionChange);
          else if (mq.removeListener) mq.removeListener(onMotionChange);
        }
        if (io) io.disconnect();
        if (ro) ro.disconnect();
        puffs.length = 0; threads.length = 0;
      }
    };
  }

  function noopApi() {
    return { resize: function () {}, destroy: function () {}, setOrigin: function () {} };
  }

  global.Fumaca = { init: init };
})(window);
