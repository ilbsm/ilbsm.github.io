/* Animated Three.js trefoil used in the home-page hero. */
(function (global) {
  'use strict';

  function HeroKnot(canvas) {
    if (!canvas || typeof THREE === 'undefined') return;

    this.canvas = canvas;
    this.scene  = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.z = 5.8;

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure  = 1.15;
    if (THREE.SRGBColorSpace) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    this._build();
    this._lights();
    this._resize();

    var self = this;
    window.addEventListener('resize', function () { self._resize(); });

    this._tick = 0;
    this._loop();
  }

  HeroKnot.prototype._build = function () {
    var pts = [];
    var N = 450;
    for (var i = 0; i <= N; i++) {
      var t = (i / N) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.sin(t) + 2 * Math.sin(2 * t),
        Math.cos(t) - 2 * Math.cos(2 * t),
        -Math.sin(3 * t)
      ));
    }

    var curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    var geo   = new THREE.TubeGeometry(curve, 640, 0.115, 24, true);

    var mat = new THREE.MeshPhysicalMaterial({
      color:               new THREE.Color(0xafd0ee),
      metalness:           0.78,
      roughness:           0.06,
      clearcoat:           1.0,
      clearcoatRoughness:  0.04,
      reflectivity:        0.85,
    });

    this.knot = new THREE.Mesh(geo, mat);

    var box   = new THREE.Box3().setFromObject(this.knot);
    var size  = box.getSize(new THREE.Vector3());
    this.knot.scale.setScalar(3.2 / Math.max(size.x, size.y, size.z));
    this.knot.rotation.x = 0.28;

    this.scene.add(this.knot);
  };

  HeroKnot.prototype._lights = function () {
    this.scene.add(new THREE.AmbientLight(0xb8d0e8, 0.65));

    var key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(5, 8, 6);
    this.scene.add(key);

    var key2 = new THREE.DirectionalLight(0xddeeff, 1.6);
    key2.position.set(-6, 4, 3);
    this.scene.add(key2);

    var fill = new THREE.DirectionalLight(0x01c0c8, 1.1);
    fill.position.set(-3, -2, 4);
    this.scene.add(fill);

    var rim = new THREE.DirectionalLight(0xe0f0ff, 0.9);
    rim.position.set(1, -6, -7);
    this.scene.add(rim);

    var top = new THREE.DirectionalLight(0xffffff, 0.7);
    top.position.set(0, 12, 2);
    this.scene.add(top);
  };

  HeroKnot.prototype._resize = function () {
    var c = this.canvas;
    var w = c.clientWidth  || c.offsetWidth  || 480;
    var h = c.clientHeight || c.offsetHeight || 480;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  HeroKnot.prototype._loop = function () {
    var self = this;
    (function tick() {
      requestAnimationFrame(tick);
      self._tick += 1;
      var t = self._tick;
      self.knot.rotation.y = t * 0.004;
      self.knot.rotation.x = 0.28 + Math.sin(t * 0.006) * 0.055;
      self.renderer.render(self.scene, self.camera);
    }());
  };

  global.HeroKnot = HeroKnot;

}(window));
