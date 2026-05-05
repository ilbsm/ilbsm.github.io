/* ============================================================
   knot3d.js — Sulkowska Lab · 3D topology visualiser
   Renders glowing tubes for trefoil, lasso, Hopf link, etc.
   Uses pure Canvas 2D — no dependencies.
   ============================================================ */

(function (global) {
  'use strict';

  /* ── Parametric curve definitions ── */
  var CURVES = {
    trefoil: function (t) {
      return {
        x: Math.sin(t) + 2 * Math.sin(2 * t),
        y: Math.cos(t) - 2 * Math.cos(2 * t),
        z: -Math.sin(3 * t)
      };
    },
    torus: function (t) {        /* (2,3) torus knot */
      var R = 2, r = 0.85, p = 2, q = 3;
      return {
        x: (R + r * Math.cos(q * t)) * Math.cos(p * t),
        y: (R + r * Math.cos(q * t)) * Math.sin(p * t),
        z: r * Math.sin(q * t)
      };
    },
    lasso: function (t) {        /* loop + threading tail */
      var loop = 2 * Math.PI;
      if (t <= loop) {
        return {
          x: 1.8 * Math.cos(t),
          y: 1.8 * Math.sin(t),
          z: Math.sin(2 * t) * 0.25
        };
      }
      var s = (t - loop) / (2 * Math.PI);
      return {
        x: (s - 0.5) * 3.6,
        y: Math.sin(s * Math.PI) * 0.9 - 0.6,
        z: s * 3.6 - 1.8
      };
    },
    hopf: function (t) {         /* Hopf link — two linked circles */
      if (t < 2 * Math.PI) {
        return { x: 2 * Math.cos(t), y: 0.6, z: 2 * Math.sin(t) };
      }
      var s = t - 2 * Math.PI;
      return { x: 1.0, y: 2 * Math.cos(s), z: 2 * Math.sin(s) };
    },
    helix: function (t) {
      var turns = 2.5;
      return {
        x: 1.8 * Math.cos(turns * t),
        y: (t / Math.PI) - 1.6,
        z: 1.8 * Math.sin(turns * t)
      };
    },
    slipknot: function (t) {    /* figure-eight like slipknot */
      return {
        x: Math.sin(t) + 2 * Math.sin(2 * t),
        y: Math.cos(t) - 2 * Math.cos(2 * t),
        z: Math.sin(5 * t) * 0.6
      };
    }
  };

  /* ── Rotation helpers ── */
  function rotY(p, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
  }
  function rotX(p, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
  }
  function rotZ(p, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z };
  }

  /* ── Perspective projection ── */
  function project(p, fov) {
    var d = fov / (fov + p.z);
    return { sx: p.x * d, sy: p.y * d, depth: d };
  }

  /* ── Hex → RGB ── */
  function hexRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }

  /* ============================================================
     Knot3D — main class
     ============================================================ */
  function Knot3D(canvas, opts) {
    opts = opts || {};
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.type     = opts.type     || 'trefoil';
    this.color    = opts.color    || '#4db8e8';
    this.color2   = opts.color2   || null;       /* second color for gradient tube */
    this.speed    = opts.speed    || 0.007;
    this.tiltX    = opts.tiltX    !== undefined ? opts.tiltX : 0.38;
    this.tiltZ    = opts.tiltZ    || 0;
    this.fov      = opts.fov      || 5.5;
    this.N        = opts.N        || 480;
    this.glow     = opts.glow     !== false;
    this.glowSize = opts.glowSize || 5;
    this.angle    = opts.startAngle || 0;
    this.wobble   = opts.wobble   || 0;           /* gentle wobble on tilt */
    this._t       = 0;
    this._raf     = null;
    this._gen();
    this._start();
  }

  Knot3D.prototype._gen = function () {
    var fn  = CURVES[this.type] || CURVES.trefoil;
    var end = (this.type === 'hopf' || this.type === 'lasso') ? 4 * Math.PI : 2 * Math.PI;
    var pts = [];
    for (var i = 0; i <= this.N; i++) {
      pts.push(fn(i / this.N * end));
    }
    /* auto-scale */
    var mx = 0;
    pts.forEach(function (p) { mx = Math.max(mx, Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)); });
    this._pts   = pts;
    this._scale = 1 / (mx || 1);
  };

  Knot3D.prototype._draw = function () {
    var canvas = this.canvas, ctx = this.ctx;
    var W = canvas.width, H = canvas.height;
    var S = Math.min(W, H) * 0.42 / this._scale;
    var angle = this.angle;
    var tiltX = this.tiltX + (this.wobble ? Math.sin(this._t * 0.4) * this.wobble : 0);
    var tiltZ = this.tiltZ;
    var fov   = this.fov;
    var rgb   = hexRgb(this.color);
    var rgb2  = this.color2 ? hexRgb(this.color2) : null;

    ctx.clearRect(0, 0, W, H);

    /* Project all points */
    var proj = this._pts.map(function (p) {
      var q = rotY(p, angle);
      q = rotX(q, tiltX);
      if (tiltZ) q = rotZ(q, tiltZ);
      var d = project(q, fov);
      return { sx: W/2 + d.sx * S, sy: H/2 + d.sy * S, depth: d.depth, z: q.z };
    });

    /* Sort segments back→front */
    var segs = [];
    for (var i = 0; i < proj.length - 1; i++) {
      segs.push({ i: i, z: (proj[i].z + proj[i+1].z) / 2 });
    }
    segs.sort(function (a, b) { return a.z - b.z; });

    var glowSize = this.glow ? this.glowSize : 0;

    segs.forEach(function (seg) {
      var i  = seg.i;
      var p1 = proj[i], p2 = proj[i + 1];
      var df = Math.min(1, Math.max(0, (p1.depth + p2.depth) / 2 - 0.35) / 0.65);
      var baseW = Math.max(1.2, S * 0.028 * (p1.depth + p2.depth) / 2);

      /* pick color (blend if two given) */
      var t01 = i / (this._pts.length - 1);
      var r, g, b;
      if (rgb2) {
        r = Math.round(rgb[0] + (rgb2[0]-rgb[0]) * t01);
        g = Math.round(rgb[1] + (rgb2[1]-rgb[1]) * t01);
        b = Math.round(rgb[2] + (rgb2[2]-rgb[2]) * t01);
      } else {
        r = rgb[0]; g = rgb[1]; b = rgb[2];
      }

      /* glow halo */
      if (glowSize > 0) {
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.04 + df * 0.10) + ')';
        ctx.lineWidth   = baseW * glowSize;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }

      /* outer tube */
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.28 + df * 0.55) + ')';
      ctx.lineWidth   = baseW * 2.2;
      ctx.lineCap     = 'round';
      ctx.stroke();

      /* specular highlight */
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.08 + df * 0.38) + ')';
      ctx.lineWidth   = Math.max(0.4, baseW * 0.45);
      ctx.stroke();
    }.bind(this));
  };

  Knot3D.prototype._start = function () {
    var self = this;
    function loop() {
      self._t    += 1;
      self.angle += self.speed;
      self._draw();
      self._raf = requestAnimationFrame(loop);
    }
    self._raf = requestAnimationFrame(loop);
  };

  Knot3D.prototype.destroy = function () {
    cancelAnimationFrame(this._raf);
  };

  /* ============================================================
     ParticleField — optional starfield background for big canvas
     ============================================================ */
  function ParticleField(canvas, opts) {
    opts       = opts || {};
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.color  = opts.color || '#4db8e8';
    this.n      = opts.n     || 80;
    this.speed  = opts.speed || 0.003;
    this.angle  = 0;
    this._gen();
    this._start();
  }

  ParticleField.prototype._gen = function () {
    this._dots = [];
    for (var i = 0; i < this.n; i++) {
      this._dots.push({
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 6,
        z: (Math.random() - 0.5) * 6,
        r: Math.random() * 1.4 + 0.4
      });
    }
  };

  ParticleField.prototype._draw = function () {
    var ctx = this.ctx, canvas = this.canvas;
    var W = canvas.width, H = canvas.height;
    var S = Math.min(W, H) * 0.42;
    var angle = this.angle;
    var rgb = hexRgb(this.color);

    this._dots.forEach(function (d) {
      var q = rotY(d, angle);
      q = rotX(q, 0.3);
      var depth = 5 / (5 + q.z);
      var sx = W/2 + q.x * depth * S / 6;
      var sy = H/2 + q.y * depth * S / 6;
      var alpha = Math.min(0.55, depth * 0.4);
      ctx.beginPath();
      ctx.arc(sx, sy, d.r * depth, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
      ctx.fill();
    });
  };

  ParticleField.prototype._start = function () {
    var self = this;
    function loop() {
      self.angle += self.speed;
      self._draw();
      self._raf = requestAnimationFrame(loop);
    }
    self._raf = requestAnimationFrame(loop);
  };

  ParticleField.prototype.destroy = function () {
    cancelAnimationFrame(this._raf);
  };

  /* ── export ── */
  global.Knot3D        = Knot3D;
  global.ParticleField = ParticleField;

}(window));
