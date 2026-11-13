(function (global) {
  'use strict';

  var BG = '#0a0a0a';
  var INK = '#f3f1ea';
  var MID = '#8a8a85';
  var DARK = '#2a2a28';

  var W = 1.25;
  var D = 1.0;
  var H = 2.25;
  var CE = 3.05;
  var S = 1.5;
  var EYE = 1.42;
  var NEAR = 0.12;
  var TRAY_X = 0.78;
  var TRAY_Y = 2.62;
  var GAP_EVERY = 9;

  function hash(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function mod(a, n) { return ((a % n) + n) % n; }

  function init(canvas, opts) {
    opts = opts || {};
    if (!canvas || !canvas.getContext) return noopApi();
    var ctx = canvas.getContext('2d');
    if (!ctx) return noopApi();

    var mq = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduced = typeof opts.reducedMotion === 'boolean' ? opts.reducedMotion : !!(mq && mq.matches);

    var travel = opts.length > 0 ? opts.length : 42;
    var zEnd = travel + 9;
    var swayOn = opts.sway !== false;
    var grainWanted = opts.grain !== false;

    var w = 0, h = 0, dpr = 1, small = false;
    var f = 600;
    var vx = 0, vy = 0;
    var far = 34;
    var target = clamp01(opts.progress || 0);
    var current = target;
    var speed = 0;
    var time = 0, last = 0, raf = 0;
    var visible = true, destroyed = false;
    var ptx = 0, pty = 0;
    var px = 0, py = 0;
    var cam = { x: 0, y: EYE, z: 0, cyw: 1, syw: 0, cp: 1, sp: 0 };
    var glow = null, grain = null, vignette = null, grainTick = 0, gox = 0, goy = 0;
    var packets = [];

    var A = [0, 0, 0], B = [0, 0, 0];
    var polyIn = new Float32Array(24), polyOut = new Float32Array(36);

    function tx(x, y, z, o) {
      var dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
      var x1 = dx * cam.cyw - dz * cam.syw;
      var z1 = dx * cam.syw + dz * cam.cyw;
      o[0] = x1;
      o[1] = dy * cam.cp - z1 * cam.sp;
      o[2] = dy * cam.sp + z1 * cam.cp;
    }

    function clipNear(a, b) {
      var t = (NEAR - a[2]) / (b[2] - a[2]);
      a[0] += (b[0] - a[0]) * t;
      a[1] += (b[1] - a[1]) * t;
      a[2] = NEAR;
    }

    function seg(ax, ay, az, bx, by, bz) {
      tx(ax, ay, az, A); tx(bx, by, bz, B);
      if (A[2] < NEAR && B[2] < NEAR) return;
      if (A[2] < NEAR) clipNear(A, B); else if (B[2] < NEAR) clipNear(B, A);
      ctx.moveTo(vx + A[0] * f / A[2], vy - A[1] * f / A[2]);
      ctx.lineTo(vx + B[0] * f / B[2], vy - B[1] * f / B[2]);
    }

    function quad(x0, y0, z0, x1, y1, z1, x2, y2, z2, x3, y3, z3) {
      tx(x0, y0, z0, A); polyIn[0] = A[0]; polyIn[1] = A[1]; polyIn[2] = A[2];
      tx(x1, y1, z1, A); polyIn[3] = A[0]; polyIn[4] = A[1]; polyIn[5] = A[2];
      tx(x2, y2, z2, A); polyIn[6] = A[0]; polyIn[7] = A[1]; polyIn[8] = A[2];
      tx(x3, y3, z3, A); polyIn[9] = A[0]; polyIn[10] = A[1]; polyIn[11] = A[2];
      var n = 0, i, j, az, bz, t;
      for (i = 0; i < 4; i++) {
        j = (i + 1) % 4;
        az = polyIn[i * 3 + 2]; bz = polyIn[j * 3 + 2];
        if (az >= NEAR) {
          polyOut[n * 3] = polyIn[i * 3]; polyOut[n * 3 + 1] = polyIn[i * 3 + 1]; polyOut[n * 3 + 2] = az; n++;
        }
        if ((az >= NEAR) !== (bz >= NEAR)) {
          t = (NEAR - az) / (bz - az);
          polyOut[n * 3] = polyIn[i * 3] + (polyIn[j * 3] - polyIn[i * 3]) * t;
          polyOut[n * 3 + 1] = polyIn[i * 3 + 1] + (polyIn[j * 3 + 1] - polyIn[i * 3 + 1]) * t;
          polyOut[n * 3 + 2] = NEAR; n++;
        }
      }
      if (n < 3) return;
      for (i = 0; i < n; i++) {
        var sx = vx + polyOut[i * 3] * f / polyOut[i * 3 + 2];
        var sy = vy - polyOut[i * 3 + 1] * f / polyOut[i * 3 + 2];
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
    }

    function fog(d) {
      var t = clamp01(1 - d / far);
      return t * Math.sqrt(t);
    }
    function isGap(i) { return mod(i, GAP_EVERY) === 4; }

    function buildSprites() {

      glow = document.createElement('canvas');
      glow.width = glow.height = 128;
      var g = glow.getContext('2d');
      var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(243,241,234,0.55)');
      gr.addColorStop(0.25, 'rgba(243,241,234,0.2)');
      gr.addColorStop(0.6, 'rgba(243,241,234,0.05)');
      gr.addColorStop(1, 'rgba(243,241,234,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);

      grain = document.createElement('canvas');
      grain.width = grain.height = 128;
      g = grain.getContext('2d');
      var id = g.createImageData(128, 128), d = id.data, i, v;
      for (i = 0; i < d.length; i += 4) {
        v = Math.random();

        d[i] = d[i + 1] = d[i + 2] = v > 0.5 ? 243 : 10;
        d[i + 3] = Math.abs(v - 0.5) * 2 * 34;
      }
      g.putImageData(id, 0, 0);
    }

    function buildPackets() {
      packets.length = 0;
      var n = small ? 5 : 11, i;
      for (i = 0; i < n; i++) {
        var side = i % 2 ? 1 : -1;
        var lane = (hash(i * 7.3) - 0.5) * 0.2;
        packets.push({
          x: side * (TRAY_X + lane),
          z0: hash(i * 3.1 + 1) * far,
          v: (3.5 + hash(i * 5.7 + 2) * 7) * (hash(i * 9.1) > 0.3 ? 1 : -1),
          len: 0.35 + hash(i * 2.3 + 5) * 0.7
        });
      }
    }

    function resize() {
      if (destroyed) return;
      var r = canvas.getBoundingClientRect();
      var nw = Math.round(r.width || canvas.clientWidth || canvas.width);
      var nh = Math.round(r.height || canvas.clientHeight || canvas.height);
      if (!nw || !nh) return;
      dpr = Math.min(global.devicePixelRatio || 1, 2);
      w = nw; h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      small = w < 700;
      far = small ? 24 : 34;

      f = Math.max(w * 0.46, h * 0.62);
      vx = w / 2; vy = h * 0.5;

      var R = Math.sqrt(w * w + h * h) / 2;
      vignette = ctx.createRadialGradient(w / 2, h / 2, R * 0.45, w / 2, h / 2, R);
      vignette.addColorStop(0, 'rgba(10,10,10,0)');
      vignette.addColorStop(1, 'rgba(10,10,10,0.72)');
      buildPackets();
      if (reduced || !raf) draw();
    }

    function drawAisle(i, a) {
      var z0 = i * S, z1 = z0 + S, zm = z0 + S / 2, s, k;

      ctx.globalAlpha = a;
      ctx.strokeStyle = DARK;
      ctx.beginPath();
      seg(-W, 0, z0, W, 0, z0);
      seg(-W, 0, zm, W, 0, zm);
      seg(-W / 2, 0, z0, -W / 2, 0, z1);
      seg(W / 2, 0, z0, W / 2, 0, z1);

      seg(-W, CE, z0, -W, CE, z1);
      seg(W, CE, z0, W, CE, z1);
      ctx.stroke();

      ctx.globalAlpha = a * 0.55;
      ctx.strokeStyle = MID;
      ctx.beginPath();
      seg(0, 0, z0 + 0.25, 0, 0, z0 + 0.85);

      for (s = -1; s <= 1; s += 2) {
        seg(s * (TRAY_X - 0.16), TRAY_Y, z0, s * (TRAY_X - 0.16), TRAY_Y, z1);
        seg(s * (TRAY_X + 0.16), TRAY_Y, z0, s * (TRAY_X + 0.16), TRAY_Y, z1);
        if (a > 0.25) {
          for (k = 0; k < 3; k++) {
            var zr = z0 + (k + 0.5) * S / 3;
            seg(s * (TRAY_X - 0.16), TRAY_Y, zr, s * (TRAY_X + 0.16), TRAY_Y, zr);
          }
        }
      }
      ctx.stroke();

      if (mod(i, 3) === 0) {
        ctx.globalAlpha = a * 0.8;
        ctx.strokeStyle = MID;
        ctx.beginPath();
        seg(-W, H, z0, -W, CE, z0);
        seg(-W, CE, z0, W, CE, z0);
        seg(W, CE, z0, W, H, z0);
        for (s = -1; s <= 1; s += 2) {
          seg(s * (TRAY_X - 0.16), TRAY_Y, z0, s * (TRAY_X - 0.16), CE, z0);
          seg(s * (TRAY_X + 0.16), TRAY_Y, z0, s * (TRAY_X + 0.16), CE, z0);
        }
        ctx.stroke();
      }

      if (mod(i, 2) === 0) {
        ctx.globalAlpha = Math.min(1, a * 1.15);
        ctx.fillStyle = INK;
        ctx.beginPath();
        quad(-0.05, CE, z0 + 0.3, 0.05, CE, z0 + 0.3, 0.05, CE, z1 - 0.3, -0.05, CE, z1 - 0.3);
        ctx.fill();
      }
    }

    function drawRack(i, s, a, d) {
      var x = s * W;
      var za = i * S + 0.035, zb = (i + 1) * S - 0.035;
      var y0 = 0.07, y1 = H;
      var seed = i * 2 + (s > 0 ? 1 : 0);
      var kind = hash(seed * 1.7 + 0.3);
      var lod = d < (small ? 6 : 10) ? 2 : d < (small ? 12 : 20) ? 1 : 0;
      var k, y, z, n;

      if (isGap(i - 1)) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = BG;
        ctx.beginPath();
        quad(x, y0, za, x + s * D, y0, za, x + s * D, y1, za, x, y1, za);
        ctx.fill();
        ctx.globalAlpha = a;
        ctx.strokeStyle = INK;
        ctx.stroke();
        if (lod > 0) {
          ctx.globalAlpha = a * 0.6;
          ctx.strokeStyle = MID;
          ctx.beginPath();
          for (k = 0; k < 5; k++) {
            y = y1 - 0.25 - k * 0.09;
            seg(x + s * 0.2, y, za, x + s * (D - 0.2), y, za);
          }
          seg(x + s * 0.12, y0 + 0.12, za, x + s * 0.12, y1 - 0.75, za);
          seg(x + s * (D - 0.12), y0 + 0.12, za, x + s * (D - 0.12), y1 - 0.75, za);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = BG;
      ctx.beginPath();
      quad(x, y0, za, x, y0, zb, x, y1, zb, x, y1, za);
      ctx.fill();
      ctx.globalAlpha = a;
      ctx.strokeStyle = INK;
      ctx.stroke();

      ctx.globalAlpha = a * 0.55;
      ctx.strokeStyle = MID;
      ctx.beginPath();
      seg(x, 0, za, x, 0, zb);
      if (lod > 0) {
        seg(x, y0 + 0.1, za + 0.07, x, y0 + 0.1, zb - 0.07);
        seg(x, y1 - 0.1, za + 0.07, x, y1 - 0.1, zb - 0.07);
        seg(x, y0 + 0.1, za + 0.07, x, y1 - 0.1, za + 0.07);
        seg(x, y0 + 0.1, zb - 0.07, x, y1 - 0.1, zb - 0.07);
      }
      ctx.stroke();

      var ya = y0 + 0.2, yb = y1 - 0.2, zA = za + 0.14, zB = zb - 0.14;
      if (lod > 0) {
        ctx.globalAlpha = a * (lod === 2 ? 0.7 : 0.4);
        ctx.strokeStyle = MID;
        ctx.beginPath();
        if (kind < 0.42) {

          n = lod === 2 ? 16 : 8;
          for (k = 0; k <= n; k++) {
            y = ya + (yb - ya) * k / n;
            seg(x, y, zA, x, y, zB);
          }
        } else if (kind < 0.67) {

          for (k = 0; k < 3; k++) {
            var b0 = ya + (yb - ya) * (k / 3) + 0.04, b1 = ya + (yb - ya) * ((k + 1) / 3) - 0.04;
            seg(x, b0, zA, x, b0, zB); seg(x, b1, zA, x, b1, zB);
            n = lod === 2 ? 8 : 4;
            for (var m = 0; m <= n; m++) {
              z = zA + (zB - zA) * m / n;
              seg(x, b0, z, x, b1, z);
            }
          }
        } else if (kind < 0.86) {

          n = lod === 2 ? 10 : 5;
          for (k = 0; k <= n; k++) {
            y = ya + (yb - ya) * k / n;
            seg(x, y, zA, x, y, zB);
          }
          for (k = 0; k <= 4; k++) {
            z = zA + (zB - zA) * k / 4;
            seg(x, ya, z, x, yb, z);
          }
        } else {

          n = lod === 2 ? 12 : 6;
          var hh = yb - ya, ll = zB - zA;
          for (k = 1; k < n; k++) {
            var t = k / n * (hh + ll);

            var zs = zA + Math.max(0, t - hh), ys = ya + Math.min(t, hh);
            var ze = zA + Math.min(t, ll), ye = ya + Math.max(0, t - ll);
            seg(x, ys, zs, x, ye, ze);
          }
          seg(x, ya, zA, x, ya, zB); seg(x, yb, zA, x, yb, zB);
        }
        ctx.stroke();
      }

      var nLed = (small ? 2 : 3) + Math.floor(hash(seed * 3.3) * (small ? 3 : 6));
      var la = Math.sqrt(a);
      ctx.fillStyle = INK;
      for (k = 0; k < nLed; k++) {
        var hs = seed * 13.7 + k * 5.1;
        var mode = hash(hs);
        var on;
        if (mode < 0.38) on = 1;
        else if (mode < 0.7) {
          on = Math.sin(time * (1.2 + hash(hs + 1) * 3) + hash(hs + 2) * 6.28) > -0.2 ? 1 : 0.12;
        } else {
          on = hash(Math.floor(time * (6 + hash(hs + 3) * 10)) + hs) > 0.45 ? 1 : 0.1;
        }
        var ly = ya + 0.04 + Math.floor(hash(hs + 4) * 14) * (yb - ya - 0.08) / 14;
        var lz = hash(hs + 5) < 0.75 ? zA + 0.07 + (hash(hs + 6) < 0.3 ? 0.09 : 0) : zB - 0.07;
        tx(x, ly, lz, A);
        if (A[2] < NEAR * 2) continue;
        var sz = Math.max(1.2, Math.min(6, f * 0.03 / A[2]));
        ctx.globalAlpha = la * on;
        ctx.fillRect(vx + A[0] * f / A[2] - sz * 0.35, vy - A[1] * f / A[2] - sz * 0.5, sz * 0.7, sz);
      }
    }

    function drawGap(i, s, a) {
      var z0 = i * S, z1 = z0 + S;
      var x0 = s * W, x1 = s * (W + 4.2);
      ctx.globalAlpha = a;
      ctx.strokeStyle = DARK;
      ctx.beginPath();
      seg(x0, 0, z0, x1, 0, z0);
      seg(x0, 0, z1, x1, 0, z1);
      seg(s * (W + D), 0, z0, s * (W + D), 0, z1);
      seg(x0, CE, z0, x1, CE, z0);
      ctx.stroke();

      ctx.globalAlpha = a * 0.5;
      ctx.strokeStyle = MID;
      ctx.beginPath();
      quad(x1, 0.07, z0 + 0.04, x1, 0.07, z1 - 0.04, x1, H, z1 - 0.04, x1, H, z0 + 0.04);
      seg(x1, H * 0.33, z0 + 0.15, x1, H * 0.33, z1 - 0.15);
      seg(x1, H * 0.66, z0 + 0.15, x1, H * 0.66, z1 - 0.15);
      ctx.stroke();
    }

    function drawEnd() {
      var d = zEnd - cam.z;
      if (d < NEAR * 2) return;
      var a = Math.max(0.5, fog(d));
      tx(0, 1.05, zEnd, A);
      if (A[2] < NEAR) return;
      var sx = vx + A[0] * f / A[2], sy = vy - A[1] * f / A[2];
      var r = 70 + f * 3.2 / A[2];
      ctx.globalAlpha = 0.9;
      ctx.drawImage(glow, sx - r, sy - r, r * 2, r * 2);

      ctx.globalAlpha = fog(d);
      ctx.strokeStyle = MID;
      ctx.beginPath();
      quad(-W - D, 0, zEnd, W + D, 0, zEnd, W + D, CE, zEnd, -W - D, CE, zEnd);
      ctx.stroke();

      var grd = ctx.createLinearGradient(sx, sy, sx, sy + f * 1.05 / A[2] * 6);
      grd.addColorStop(0, 'rgba(243,241,234,0.22)');
      grd.addColorStop(1, 'rgba(243,241,234,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = grd;
      ctx.beginPath();
      quad(-0.55, 0, zEnd, 0.55, 0, zEnd, 0.55, 0, zEnd - 7, -0.55, 0, zEnd - 7);
      ctx.fill();

      ctx.globalAlpha = a;
      ctx.fillStyle = INK;
      ctx.beginPath();
      quad(-0.55, 0, zEnd, 0.55, 0, zEnd, 0.55, 2.1, zEnd, -0.55, 2.1, zEnd);
      ctx.fill();
    }

    function drawPackets() {
      ctx.strokeStyle = INK;
      ctx.lineWidth = small ? 1.4 : 1.8;
      ctx.lineCap = 'round';
      for (var i = 0; i < packets.length; i++) {
        var p = packets[i];
        var zr = mod(p.z0 + p.v * time - cam.z, far);
        var z = cam.z + zr;
        if (z + p.len > zEnd || zr < 0.4) continue;
        var a = fog(zr);
        if (a < 0.03) continue;
        var dir = p.v > 0 ? 1 : -1;
        ctx.globalAlpha = Math.min(1, a * 1.5);
        ctx.beginPath();
        seg(p.x, TRAY_Y, z, p.x, TRAY_Y, z + p.len * 0.45);
        ctx.stroke();
        ctx.globalAlpha = a * 0.4;
        ctx.beginPath();
        seg(p.x, TRAY_Y, z - dir * p.len, p.x, TRAY_Y, z + (dir < 0 ? p.len * 1.45 : 0));
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.lineCap = 'butt';
    }

    function draw() {
      if (!w || !h) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      var yaw = 0, pitch = 0;
      cam.z = current * travel;
      cam.x = 0; cam.y = EYE;
      if (!reduced) {
        cam.x = px * 0.16 + Math.sin(time * 0.31) * 0.012;
        cam.y = EYE - py * 0.05 + Math.sin(cam.z * 2.1) * 0.012 + Math.sin(time * 0.53) * 0.006;
        yaw = px * 0.045;
        pitch = -py * 0.028;
      }
      cam.cyw = Math.cos(yaw); cam.syw = Math.sin(yaw);
      cam.cp = Math.cos(pitch); cam.sp = Math.sin(pitch);

      var fBase = Math.max(w * 0.46, h * 0.62);
      f = fBase * (1 - Math.min(0.07, speed * 0.004));

      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';

      drawEnd();

      var iNear = Math.floor((cam.z - S) / S);
      var iFar = Math.min(Math.floor((cam.z + far) / S), Math.floor(zEnd / S) - 1);
      for (var i = iFar; i >= iNear; i--) {
        var d = (i + 0.5) * S - cam.z;
        var a = fog(Math.max(0, d));
        if (a <= 0.004) continue;
        drawAisle(i, a);
        if (isGap(i)) {
          drawGap(i, -1, a); drawGap(i, 1, a);
        } else {
          drawRack(i, -1, a, d); drawRack(i, 1, a, d);
        }
      }

      drawPackets();

      ctx.globalAlpha = 1;
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
      if (grainWanted && !small && grain) {
        ctx.globalAlpha = 0.5;
        for (var gy = -goy; gy < h; gy += 128) {
          for (var gx = -gox; gx < w; gx += 128) ctx.drawImage(grain, gx, gy);
        }
        ctx.globalAlpha = 1;
      }
    }

    function frame(now) {
      raf = 0;
      if (destroyed) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      time += dt;

      var k = 1 - Math.exp(-dt * 5.5);
      var before = current;
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.00002) current = target;
      var inst = Math.abs(current - before) * travel / dt;
      speed += (inst - speed) * (1 - Math.exp(-dt * 6));
      var kp = 1 - Math.exp(-dt * 3.5);
      px += (ptx - px) * kp; py += (pty - py) * kp;

      grainTick += dt;
      if (grainTick > 0.07) {
        grainTick = 0;
        gox = Math.floor(Math.random() * 128); goy = Math.floor(Math.random() * 128);
      }

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

    function onPointer(e) {
      if (!swayOn || !w) return;
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      ptx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      pty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    }
    function onLeave() { ptx = 0; pty = 0; }
    function onVisibility() { if (document.hidden) pause(); else schedule(); }
    function onResize() { resize(); }
    function onMotionChange() {
      if (typeof opts.reducedMotion === 'boolean') return;
      reduced = !!mq.matches;
      if (reduced) { pause(); current = clamp01(opts.staticProgress != null ? opts.staticProgress : 0.3); draw(); }
      else { current = target; schedule(); }
    }

    global.addEventListener('pointermove', onPointer, { passive: true });
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

    buildSprites();
    if (reduced) current = clamp01(opts.staticProgress != null ? opts.staticProgress : 0.3);
    resize();
    schedule();

    return {

      setProgress: function (p) {
        p = +p;
        if (p !== p) return;
        target = clamp01(p);

      },
      resize: resize,
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        pause();
        global.removeEventListener('pointermove', onPointer);
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
      }
    };
  }

  function noopApi() {
    return { setProgress: function () {}, resize: function () {}, destroy: function () {} };
  }

  global.Corredor = { init: init };
})(window);
