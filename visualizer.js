// visualizer.js — browser-only version for embedding on websites.
// No system audio capture (browser security) — uses mic, file upload, or demo.

(function () {
  const wrap = document.getElementById('viz-wrap');
  const c2d = document.getElementById('viz-2d');
  const c3d = document.getElementById('viz-3d');
  const ctx = c2d.getContext('2d');
  const fpsTag = document.getElementById('fps-tag');
  const beatPulse = document.getElementById('beat-pulse');
  const vjTag = document.getElementById('vj-tag');
  const intro = document.getElementById('intro');

  // Slider readouts
  ['vj-speed','opacity2d','sens','speed','smooth','beat','distort','glow','trail'].forEach(n => {
    const el = document.getElementById(n);
    const out = document.getElementById(n + '-val');
    el.addEventListener('input', () => out.textContent = el.value);
  });

  const layerSel = document.getElementById('layer-mode');
  const shape3dSel = document.getElementById('shape3d');
  const mode2dSel = document.getElementById('mode2d');
  const symSel = document.getElementById('symmetry');
  const qualitySel = document.getElementById('quality');
  const presetSel = document.getElementById('preset');
  const col1 = document.getElementById('col1');
  const col2 = document.getElementById('col2');
  const col3 = document.getElementById('col3');
  const bgCol = document.getElementById('bg-col');
  const vjSpeedEl = document.getElementById('vj-speed');
  const opacity2dEl = document.getElementById('opacity2d');
  const sensEl = document.getElementById('sens');
  const speedEl = document.getElementById('speed');
  const smoothEl = document.getElementById('smooth');
  const beatEl = document.getElementById('beat');
  const distortEl = document.getElementById('distort');
  const glowEl = document.getElementById('glow');
  const trailEl = document.getElementById('trail');

  // Panel toggle
  const panel = document.getElementById('panel');
  document.getElementById('btn-panel').addEventListener('click', () => panel.classList.toggle('open'));

  // Manual override locks
  const manualOverrideUntil = {};
  function markManual(id) { manualOverrideUntil[id] = performance.now() + 4000; }
  function isLockedByUser(id) { const t = manualOverrideUntil[id]; return t && performance.now() < t; }
  ['speed','distort','glow','trail','opacity2d','col1','col2','col3','bg-col','shape3d','mode2d','symmetry','layer-mode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener('input', () => markManual(id)); el.addEventListener('change', () => markManual(id)); }
  });

  qualitySel.addEventListener('change', () => { logicW = 0; logicH = 0; fit(); });

  const presets = {
    'silver':   ['#f5f5f5','#a0a0a0','#404040','#000000'],
    'aurora':   ['#00d4ff','#a855f7','#ff006e','#05060a'],
    'deep-sea': ['#00ffe1','#0066ff','#001a4d','#000814'],
    'nebula':   ['#ff5ce6','#7c3aed','#1e1b4b','#020014'],
    'lava':     ['#ffeb3b','#ff6f00','#b71c1c','#1a0000'],
    'ice':      ['#e0f7ff','#7dd3fc','#3b82f6','#0a1628'],
    'sunset':   ['#fef08a','#fb923c','#dc2626','#1a0a1f'],
    'midnight': ['#c084fc','#6366f1','#1e293b','#020617'],
    'forest':   ['#86efac','#10b981','#064e3b','#022c1a']
  };
  const presetKeys = Object.keys(presets);
  presetSel.addEventListener('change', () => {
    if (presets[presetSel.value]) {
      const [a,b,c,bg] = presets[presetSel.value];
      col1.value = a; col2.value = b; col3.value = c; bgCol.value = bg;
    }
  });
  [col1, col2, col3, bgCol].forEach(el => el.addEventListener('input', () => presetSel.value = 'custom'));

  // ===== AUDIO =====
  let audioCtx = null, analyser = null, source = null, mediaStream = null, audioEl = null, oscNodes = null;
  const FFT = 2048;
  const timeData = new Uint8Array(FFT);
  const freqData = new Uint8Array(FFT / 2);
  let running = false;

  function ensureCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = FFT;
      analyser.smoothingTimeConstant = 0.85;
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function stopAll() {
    if (source) { try { source.disconnect(); } catch (e) {} source = null; }
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
    if (audioEl) { try { audioEl.pause(); } catch (e) {} audioEl = null; }
    if (oscNodes) { oscNodes.forEach(n => { try { n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} }); oscNodes = null; }
  }
  function dismissIntro() { intro.classList.add('hidden'); }

  async function startMic() {
    try {
      ensureCtx(); stopAll();
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      running = true; dismissIntro();
    } catch (e) {
      console.error('Mic failed:', e);
    }
  }
  function startFile(file) {
    ensureCtx(); stopAll();
    audioEl = new Audio();
    audioEl.src = URL.createObjectURL(file);
    audioEl.crossOrigin = 'anonymous'; audioEl.loop = true;
    source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser); analyser.connect(audioCtx.destination);
    audioEl.play();
    running = true; dismissIntro();
  }
  function startDemo() {
    ensureCtx(); stopAll();
    const freqs = [110, 164.81, 220, 329.63, 440];
    oscNodes = [];
    freqs.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f;
      const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.08 + i * 0.03;
      const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 4 + i;
      lfo.connect(lfoGain).connect(o.frequency);
      const g = audioCtx.createGain(); g.gain.value = 0.25 / freqs.length;
      o.connect(g).connect(analyser);
      o.start(); lfo.start();
      oscNodes.push(o, lfo);
    });
    running = true; dismissIntro();
  }
  function startBeatDemo() {
    ensureCtx(); stopAll();
    oscNodes = [];
    [220, 277.18, 329.63].forEach(f => {
      const o = audioCtx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      const g = audioCtx.createGain(); g.gain.value = 0.08;
      o.connect(g).connect(analyser); o.start();
      oscNodes.push(o);
    });
    function kick() {
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g).connect(analyser);
      o.start(t); o.stop(t + 0.25);
    }
    const kickInt = setInterval(kick, 500);
    oscNodes.push({ stop: () => clearInterval(kickInt), disconnect: () => {} });
    kick();
    running = true; dismissIntro();
  }

  document.getElementById('btn-mic').addEventListener('click', startMic);
  document.getElementById('btn-demo').addEventListener('click', startDemo);
  document.getElementById('btn-beat').addEventListener('click', startBeatDemo);
  document.getElementById('btn-file').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('file-input').addEventListener('change', e => { if (e.target.files[0]) startFile(e.target.files[0]); });

  // Drag and drop
  window.addEventListener('dragover', e => { e.preventDefault(); });
  window.addEventListener('drop', e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('audio/')) startFile(f);
  });

  // ===== AUTO-VJ =====
  let vjActive = false;
  const vjState = {
    col1: [0,212,255], col2: [168,85,247], col3: [255,0,110], bg: [5,6,10],
    tCol1: [0,212,255], tCol2: [168,85,247], tCol3: [255,0,110], tBg: [5,6,10],
    distort: 1.0, tDistort: 1.0, speed: 1.0, tSpeed: 1.0,
    opacity2d: 0.8, tOpacity2d: 0.8, glow: 28, tGlow: 28, trail: 0.86, tTrail: 0.86,
    shape3d: 'sphere', mode2d: 'ribbon', symmetry: 1, layer: 'auto',
    beatsSinceShapeChange: 0, beatsSinceModeChange: 0, beatsSinceSymChange: 0,
    beatsSinceLayerChange: 0, beatsSincePalette: 0, timeSinceTarget: 0
  };
  function hexToRgb(h) { const m = h.replace('#',''); return [parseInt(m.substr(0,2),16),parseInt(m.substr(2,2),16),parseInt(m.substr(4,2),16)]; }
  function rgbToHex(c) { return '#' + [c[0],c[1],c[2]].map(v => { const x = Math.max(0, Math.min(255, Math.round(v))).toString(16); return x.length < 2 ? '0' + x : x; }).join(''); }
  function lerp(a,b,t) { return a + (b - a) * t; }
  function lerpRgb(a,b,t) { return [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)]; }
  function rand(a,b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickNewPalette() {
    if (Math.random() < 0.7) {
      const key = pick(presetKeys);
      const [a,b,c,bg] = presets[key];
      vjState.tCol1 = hexToRgb(a); vjState.tCol2 = hexToRgb(b);
      vjState.tCol3 = hexToRgb(c); vjState.tBg = hexToRgb(bg);
    } else {
      const baseHue = Math.random();
      function hslToRgb(h,s,l) {
        function f(n) { const k = (n + h * 12) % 12; const a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(Math.min(k - 3, 9 - k), 1)); }
        return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
      }
      vjState.tCol1 = hslToRgb(baseHue, 0.85, 0.55);
      vjState.tCol2 = hslToRgb((baseHue + 0.33) % 1, 0.8, 0.5);
      vjState.tCol3 = hslToRgb((baseHue + 0.67) % 1, 0.85, 0.55);
      vjState.tBg = hslToRgb(baseHue, 0.6, 0.05);
    }
  }
  function pickNewParams() {
    vjState.tDistort = rand(0.5, 1.8); vjState.tSpeed = rand(0.6, 1.8);
    vjState.tOpacity2d = rand(0.4, 0.95); vjState.tGlow = rand(15, 50); vjState.tTrail = rand(0.75, 0.95);
  }
  const shapeOptions = ['sphere','icosa','torus','wire','frog'];
  const mode2dOptions = ['ribbon','wave','orb','nebula','particles','mountains','tunnel'];
  const symOptions = [1,1,1,2,3,4,6,8];
  const layerOptions = ['auto','auto','both','2d-only'];

  function setVj(on) {
    vjActive = on;
    const btn = document.getElementById('btn-vj');
    btn.textContent = on ? '✨ Stop VJ' : '✨ Auto-VJ';
    btn.classList.toggle('on', on);
    vjTag.style.display = on ? 'block' : 'none';
    if (on) {
      vjState.col1 = hexToRgb(col1.value); vjState.col2 = hexToRgb(col2.value);
      vjState.col3 = hexToRgb(col3.value); vjState.bg = hexToRgb(bgCol.value);
      vjState.distort = +distortEl.value / 100; vjState.speed = +speedEl.value / 100;
      vjState.opacity2d = +opacity2dEl.value / 100;
      vjState.glow = +glowEl.value; vjState.trail = +trailEl.value / 100;
      vjState.shape3d = shape3dSel.value; vjState.mode2d = mode2dSel.value;
      vjState.symmetry = +symSel.value; vjState.layer = layerSel.value;
      pickNewPalette(); pickNewParams();
      vjState.timeSinceTarget = 0;
      Object.keys(manualOverrideUntil).forEach(k => delete manualOverrideUntil[k]);
    }
  }
  document.getElementById('btn-vj').addEventListener('click', () => setVj(!vjActive));
  function setIfNotLocked(id, value) {
    if (isLockedByUser(id)) return false;
    const el = document.getElementById(id); if (!el) return false;
    el.value = value;
    const out = document.getElementById(id + '-val'); if (out) out.textContent = value;
    return true;
  }
  function updateVj(dt, beatTriggered) {
    if (!vjActive) return;
    const vjRate = +vjSpeedEl.value / 100;
    const k = Math.min(1, dt * 0.4 * vjRate);
    vjState.col1 = lerpRgb(vjState.col1, vjState.tCol1, k);
    vjState.col2 = lerpRgb(vjState.col2, vjState.tCol2, k);
    vjState.col3 = lerpRgb(vjState.col3, vjState.tCol3, k);
    vjState.bg = lerpRgb(vjState.bg, vjState.tBg, k * 0.5);
    vjState.distort = lerp(vjState.distort, vjState.tDistort, k);
    vjState.speed = lerp(vjState.speed, vjState.tSpeed, k);
    vjState.opacity2d = lerp(vjState.opacity2d, vjState.tOpacity2d, k);
    vjState.glow = lerp(vjState.glow, vjState.tGlow, k);
    vjState.trail = lerp(vjState.trail, vjState.tTrail, k);
    vjState.timeSinceTarget += dt;
    if (vjState.timeSinceTarget > 8 / Math.max(0.3, vjRate)) {
      pickNewPalette(); pickNewParams(); vjState.timeSinceTarget = 0;
    }
    if (beatTriggered) {
      vjState.beatsSinceShapeChange++; vjState.beatsSinceModeChange++;
      vjState.beatsSinceSymChange++; vjState.beatsSinceLayerChange++;
      vjState.beatsSincePalette++;
      const shapeEvery = Math.max(8, Math.floor(20 / vjRate));
      const modeEvery = Math.max(6, Math.floor(14 / vjRate));
      const symEvery = Math.max(8, Math.floor(18 / vjRate));
      const layerEvery = Math.max(12, Math.floor(28 / vjRate));
      const paletteEvery = Math.max(10, Math.floor(24 / vjRate));
      if (vjState.beatsSinceShapeChange >= shapeEvery) { vjState.shape3d = pick(shapeOptions.filter(s => s !== vjState.shape3d)); vjState.beatsSinceShapeChange = 0; }
      if (vjState.beatsSinceModeChange >= modeEvery) { vjState.mode2d = pick(mode2dOptions.filter(m => m !== vjState.mode2d)); vjState.beatsSinceModeChange = 0; }
      if (vjState.beatsSinceSymChange >= symEvery) { vjState.symmetry = pick(symOptions); vjState.beatsSinceSymChange = 0; }
      if (vjState.beatsSinceLayerChange >= layerEvery) { vjState.layer = pick(layerOptions); vjState.beatsSinceLayerChange = 0; }
      if (vjState.beatsSincePalette >= paletteEvery) { pickNewPalette(); vjState.beatsSincePalette = 0; }
    }
    if (!isLockedByUser('col1')) col1.value = rgbToHex(vjState.col1);
    if (!isLockedByUser('col2')) col2.value = rgbToHex(vjState.col2);
    if (!isLockedByUser('col3')) col3.value = rgbToHex(vjState.col3);
    if (!isLockedByUser('bg-col')) bgCol.value = rgbToHex(vjState.bg);
    setIfNotLocked('distort', Math.round(vjState.distort * 100));
    setIfNotLocked('speed', Math.round(vjState.speed * 100));
    setIfNotLocked('opacity2d', Math.round(vjState.opacity2d * 100));
    setIfNotLocked('glow', Math.round(vjState.glow));
    setIfNotLocked('trail', Math.round(vjState.trail * 100));
    if (!isLockedByUser('shape3d')) shape3dSel.value = vjState.shape3d;
    if (!isLockedByUser('mode2d')) mode2dSel.value = vjState.mode2d;
    if (!isLockedByUser('symmetry')) symSel.value = String(vjState.symmetry);
    if (!isLockedByUser('layer-mode')) layerSel.value = vjState.layer;
    presetSel.value = 'custom';
  }

  // ===== THREE =====
  let renderer = null, scene = null, camera = null, solidMesh = null, wireMesh = null;
  let currentShape = null, geomData = {}, threeReady = false;
  const persistRot = { x: 0, y: 0 };

  function makeFrogGeom() {
    function part(rx, ry, rz, tx, ty, tz, detail) {
      const g = new THREE.IcosahedronGeometry(1, detail);
      g.scale(rx, ry, rz);
      g.translate(tx, ty, tz);
      const f = g.toNonIndexed(); g.dispose();
      f.computeVertexNormals();
      return f;
    }
    const parts = [
      part(1.15, 0.70, 1.05,  0.00, -0.10,  0.00, 4),
      part(0.62, 0.52, 0.62,  0.00,  0.28,  0.70, 4),
      part(0.30, 0.34, 0.30, -0.34,  0.62,  0.55, 3),
      part(0.30, 0.34, 0.30,  0.34,  0.62,  0.55, 3),
      part(0.16, 0.18, 0.16, -0.34,  0.74,  0.62, 2),
      part(0.16, 0.18, 0.16,  0.34,  0.74,  0.62, 2),
      part(0.32, 0.22, 0.55, -0.78, -0.20, -0.10, 3),
      part(0.32, 0.22, 0.55,  0.78, -0.20, -0.10, 3),
      part(0.28, 0.20, 0.45, -0.55, -0.35,  0.55, 3),
      part(0.28, 0.20, 0.45,  0.55, -0.35,  0.55, 3)
    ];
    let total = 0;
    for (const p of parts) total += p.attributes.position.count;
    const positions = new Float32Array(total * 3);
    const normals = new Float32Array(total * 3);
    let off = 0;
    for (const p of parts) {
      positions.set(p.attributes.position.array, off * 3);
      normals.set(p.attributes.normal.array, off * 3);
      off += p.attributes.position.count;
      p.dispose();
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    return merged;
  }

  function makeGeom(key) {
    if (key === 'frog') {
      const flat = makeFrogGeom();
      return { geom: flat, basePos: new Float32Array(flat.attributes.position.array), baseNorm: new Float32Array(flat.attributes.normal.array) };
    }
    let g;
    if (key === 'sphere') g = new THREE.IcosahedronGeometry(1, 32);
    else if (key === 'icosa') g = new THREE.IcosahedronGeometry(1.1, 3);
    else if (key === 'torus') g = new THREE.TorusKnotGeometry(0.8, 0.28, 256, 40);
    else g = new THREE.IcosahedronGeometry(1.1, 5);
    const flat = g.toNonIndexed(); g.dispose();
    flat.computeVertexNormals();
    return { geom: flat, basePos: new Float32Array(flat.attributes.position.array), baseNorm: new Float32Array(flat.attributes.normal.array) };
  }

  function initThree() {
    renderer = new THREE.WebGLRenderer({
      canvas: c3d, antialias: true, alpha: false,
      premultipliedAlpha: false, powerPreference: 'high-performance'
    });
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const k = new THREE.DirectionalLight(0xffffff, 1.0); k.position.set(2, 3, 4); scene.add(k);
    const f = new THREE.DirectionalLight(0xaaccff, 0.5); f.position.set(-2, -1, 2); scene.add(f);
    const r = new THREE.DirectionalLight(0xffaaff, 0.8); r.position.set(0, 0, -3); scene.add(r);
    ['sphere','icosa','torus','wire','frog'].forEach(k => { geomData[k] = makeGeom(k); });
    threeReady = true;
  }

  function setShape(key) {
    if (currentShape === key) return;
    if (solidMesh) {
      persistRot.x = solidMesh.rotation.x; persistRot.y = solidMesh.rotation.y;
      scene.remove(solidMesh); solidMesh = null;
    }
    if (wireMesh) { scene.remove(wireMesh); wireMesh = null; }
    const d = geomData[key]; if (!d) return;
    if (key === 'wire') {
      solidMesh = new THREE.Mesh(d.geom, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
    } else {
      solidMesh = new THREE.Mesh(d.geom, new THREE.MeshStandardMaterial({ color: 0x00d4ff, roughness: 0.4, metalness: 0.25 }));
    }
    solidMesh.rotation.x = persistRot.x; solidMesh.rotation.y = persistRot.y;
    scene.add(solidMesh);
    if (key !== 'wire') {
      wireMesh = new THREE.Mesh(d.geom, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.25 }));
      wireMesh.scale.setScalar(1.005);
      wireMesh.rotation.copy(solidMesh.rotation);
      scene.add(wireMesh);
    }
    currentShape = key;
  }
  function hash3(x,y,z) { let h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
  function noise3(x,y,z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const c000 = hash3(xi, yi, zi), c100 = hash3(xi + 1, yi, zi);
    const c010 = hash3(xi, yi + 1, zi), c110 = hash3(xi + 1, yi + 1, zi);
    const c001 = hash3(xi, yi, zi + 1), c101 = hash3(xi + 1, yi, zi + 1);
    const c011 = hash3(xi, yi + 1, zi + 1), c111 = hash3(xi + 1, yi + 1, zi + 1);
    const x00 = c000 + (c100 - c000) * u, x10 = c010 + (c110 - c010) * u;
    const x01 = c001 + (c101 - c001) * u, x11 = c011 + (c111 - c011) * u;
    const y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
    return (y0 + (y1 - y0) * w) * 2 - 1;
  }
  function displace(key, noiseT, bass, mid, beat, distort) {
    const d = geomData[key];
    const pos = d.geom.attributes.position.array;
    const base = d.basePos, norm = d.baseNorm;
    const t = noiseT * 0.6;
    const inflate = (bass * 0.5 + beat * 0.35) * distort;
    const mod = (0.25 + mid * 0.6 + beat * 0.6) * distort;
    for (let i = 0; i < base.length; i += 3) {
      const bx = base[i], by = base[i+1], bz = base[i+2];
      const n1 = noise3(bx * 1.4 + t, by * 1.4 + t * 0.7, bz * 1.4 - t * 0.5);
      const n2 = noise3(bx * 3.0 - t * 0.5, by * 3.0 + t * 0.4, bz * 3.0 + t * 0.9) * 0.5;
      const n3 = noise3(bx * 6.0 + t * 1.3, by * 6.0 - t * 0.6, bz * 6.0 + t * 0.2) * 0.25;
      const disp = (n1 + n2 + n3) * mod + inflate;
      pos[i  ] = bx + norm[i  ] * disp;
      pos[i+1] = by + norm[i+1] * disp;
      pos[i+2] = bz + norm[i+2] * disp;
    }
    d.geom.attributes.position.needsUpdate = true;
    d.geom.computeVertexNormals();
  }
  function pickColor3(t, c1hex, c2hex, c3hex) {
    t = Math.max(0, Math.min(1, t));
    const a = new THREE.Color(c1hex), b = new THREE.Color(c2hex), c = new THREE.Color(c3hex);
    if (t < 0.5) return a.lerp(b, t * 2);
    return b.lerp(c, (t - 0.5) * 2);
  }

  let logicW = 0, logicH = 0;
  function fit() {
    const r = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.floor(r.width)), h = Math.max(1, Math.floor(r.height));
    if (w === logicW && h === logicH) return;
    logicW = w; logicH = h;
    const dpr = window.devicePixelRatio || 1;
    c2d.width = w * dpr; c2d.height = h * dpr;
    c2d.style.width = w + 'px'; c2d.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (renderer) {
      const q = +qualitySel.value;
      renderer.setPixelRatio(dpr * q);
      renderer.setSize(w, h, true);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
  }
  new ResizeObserver(fit).observe(wrap);

  let smoothBuf = null;
  let bassEnv = 0, midEnv = 0, highEnv = 0;
  let bassHistory = [], beatFlash = 0, phase = 0;
  let lastT = performance.now(), fpsSmooth = 60, frame = 0;
  let particles = [], mountainOffset = 0;
  let noiseTime = 0, smoothedSpeed = 1.0;

  function rgba(c, a) { return `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`; }
  function triColor(t, c1, c2, c3) { t = Math.max(0, Math.min(1, t)); if (t < 0.5) return lerpRgb(c1, c2, t * 2); return lerpRgb(c2, c3, (t - 0.5) * 2); }
  function ensureParticles(n) {
    while (particles.length < n) particles.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0008, vy: (Math.random() - 0.5) * 0.0008, life: Math.random(), hue: Math.random(), size: 1 + Math.random() * 2.5 });
    if (particles.length > n) particles.length = n;
  }
  function layerStates() {
    const mode = layerSel.value;
    if (mode === 'both') return { do3D: true, do2D: true };
    if (mode === '2d-only') return { do3D: false, do2D: true };
    return { do3D: true, do2D: false };
  }

  initThree();
  setShape('sphere');
  fit();
  requestAnimationFrame(loop);

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(50, now - lastT) / 1000; lastT = now;
    fpsSmooth = fpsSmooth * 0.95 + (1 / Math.max(0.001, dt)) * 0.05;
    frame++; if (frame % 30 === 0) fpsTag.textContent = `${Math.round(fpsSmooth)} fps`;

    const w = logicW, h = logicH;
    if (!w || !h) { fit(); return; }

    const { do3D, do2D } = layerStates();
    const bgHex = bgCol.value;
    const bgRgb = hexToRgb(bgHex);
    c2d.style.opacity = do2D ? (+opacity2dEl.value / 100).toString() : '0';
    c3d.style.visibility = do3D ? 'visible' : 'hidden';

    if (threeReady && do3D) {
      renderer.setClearColor(new THREE.Color(bgHex), 1);
      setShape(shape3dSel.value);
    }

    let bass = 0, mid = 0, high = 0;
    if (running && analyser) {
      analyser.smoothingTimeConstant = 0.5 + (+smoothEl.value / 100) * 0.45;
      analyser.getByteTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);
      const N = freqData.length;
      const bassEnd = Math.floor(N * 0.06), midEnd = Math.floor(N * 0.3);
      for (let i = 0; i < bassEnd; i++) bass += freqData[i];
      for (let i = bassEnd; i < midEnd; i++) mid += freqData[i];
      for (let i = midEnd; i < N; i++) high += freqData[i];
      bass /= (bassEnd * 255); mid /= ((midEnd - bassEnd) * 255); high /= ((N - midEnd) * 255);
    }
    const sm = 0.85;
    bassEnv = bassEnv * sm + bass * (1 - sm);
    midEnv = midEnv * sm + mid * (1 - sm);
    highEnv = highEnv * sm + high * (1 - sm);

    let beatTriggered = false;
    bassHistory.push(bass);
    if (bassHistory.length > 43) bassHistory.shift();
    const avg = bassHistory.reduce((a, b) => a + b, 0) / bassHistory.length;
    const variance = bassHistory.reduce((a, b) => a + (b - avg) * (b - avg), 0) / bassHistory.length;
    const threshold = avg + Math.sqrt(variance) * 1.4 + 0.05;
    const beatBoost = +beatEl.value / 100;
    if (bass > threshold && beatFlash < 0.2) { beatFlash = 1.0 * beatBoost; beatTriggered = true; }
    beatFlash *= 0.92;
    if (beatFlash > 0.3) {
      beatPulse.style.background = 'rgba(255,255,255,0.9)';
      beatPulse.style.transform = `scale(${1 + beatFlash * 0.8})`;
    } else {
      beatPulse.style.background = 'rgba(255,255,255,0.15)';
      beatPulse.style.transform = 'scale(1)';
    }

    updateVj(dt, beatTriggered);

    const sens = +sensEl.value / 100, smooth = +smoothEl.value / 100;
    const targetSpeed = +speedEl.value / 100;
    smoothedSpeed = lerp(smoothedSpeed, targetSpeed, Math.min(1, dt * 3.0));
    const speed = smoothedSpeed;
    const distort = +distortEl.value / 100;
    noiseTime += dt * speed;

    const SAMPLES = 256;
    if (!smoothBuf || smoothBuf.length !== SAMPLES) smoothBuf = new Float32Array(SAMPLES);
    const sf = smooth * 0.92;
    for (let i = 0; i < SAMPLES; i++) {
      const idx = Math.floor(i / SAMPLES * timeData.length);
      const v = running ? (timeData[idx] - 128) / 128 * sens : 0;
      smoothBuf[i] = smoothBuf[i] * sf + v * (1 - sf);
    }
    phase += (0.006 + bassEnv * 0.04) * speed;

    if (do3D && threeReady) {
      displace(currentShape, noiseTime,
               Math.min(1, bassEnv * sens), Math.min(1, midEnv * sens),
               Math.min(1.5, beatFlash), distort);
      if (solidMesh && solidMesh.material.color) {
        const tCol = Math.min(1, bassEnv * 0.6 + beatFlash * 0.5);
        const c = pickColor3(tCol, col1.value, col2.value, col3.value);
        solidMesh.material.color.copy(c);
        if (solidMesh.material.emissive) {
          solidMesh.material.emissive.copy(c).multiplyScalar(0.15 + beatFlash * 0.4);
        }
      }
      if (wireMesh && wireMesh.material.color) {
        wireMesh.material.color.copy(new THREE.Color(col3.value));
        wireMesh.material.opacity = 0.2 + beatFlash * 0.4;
      }
      if (solidMesh) {
        solidMesh.rotation.y += dt * 0.5 * speed * (1 + bassEnv * 0.6);
        solidMesh.rotation.x += dt * 0.2 * speed;
        persistRot.x = solidMesh.rotation.x; persistRot.y = solidMesh.rotation.y;
        const s = 1 + beatFlash * 0.08;
        solidMesh.scale.setScalar(s);
      }
      if (wireMesh && solidMesh) {
        wireMesh.rotation.copy(solidMesh.rotation);
        wireMesh.scale.setScalar((1 + beatFlash * 0.08) * 1.005);
      }
      renderer.render(scene, camera);
    }

    if (do2D) {
      const trail = +trailEl.value / 100;
      if (do3D) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = `rgba(0,0,0,${(1 - trail) * 0.8})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.fillStyle = rgba(bgRgb, 1 - trail);
        ctx.fillRect(0, 0, w, h);
      }
      const c1 = hexToRgb(col1.value), c2 = hexToRgb(col2.value), c3 = hexToRgb(col3.value);
      const glow = +glowEl.value, sym = +symSel.value;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const cx = w / 2, cy = h / 2;
      const m2d = mode2dSel.value;
      if (sym > 1) {
        for (let k = 0; k < sym; k++) {
          ctx.save();
          ctx.translate(cx, cy); ctx.rotate((k / sym) * Math.PI * 2);
          if (k % 2 === 1) ctx.scale(-1, 1);
          ctx.translate(-cx, -cy);
          ctx.globalAlpha = 1 / Math.sqrt(sym);
          drawScene(m2d, w, h, c1, c2, c3, glow);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      } else drawScene(m2d, w, h, c1, c2, c3, glow);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }

  function drawScene(mode, w, h, c1, c2, c3, glow) {
    if (mode === 'wave') drawWave(w, h, c1, c2, c3, glow);
    else if (mode === 'ribbon') drawRibbon(w, h, c1, c2, c3, glow);
    else if (mode === 'orb') drawOrb(w, h, c1, c2, c3, glow);
    else if (mode === 'nebula') drawNebula(w, h, c1, c2, c3, glow);
    else if (mode === 'particles') drawParticles(w, h, c1, c2, c3, glow);
    else if (mode === 'mountains') drawMountains(w, h, c1, c2, c3, glow);
    else if (mode === 'tunnel') drawTunnel(w, h, c1, c2, c3, glow);
  }
  function drawWave(w,h,c1,c2,c3,glow) {
    const mid = h / 2, S = smoothBuf.length;
    for (let layer = 0; layer < 3; layer++) {
      const t = layer / 2, col = triColor(t, c1, c2, c3);
      ctx.beginPath();
      for (let i = 0; i < S; i++) {
        const x = i / (S - 1) * w;
        const wave = smoothBuf[i] * h * 0.28;
        const drift = Math.sin(i * 0.08 + phase * 2 + layer * 0.6) * 6 * (1 + bassEnv * 2 + beatFlash);
        const y = mid + wave + drift + (layer - 1) * 8;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(col, 0.85 - layer * 0.2);
      ctx.lineWidth = 2.5 - layer * 0.5 + beatFlash * 2;
      ctx.shadowColor = rgba(col, 0.9); ctx.shadowBlur = glow + beatFlash * 15;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
  function drawRibbon(w,h,c1,c2,c3,glow) {
    const S = smoothBuf.length, mid = h / 2, pts = [];
    for (let i = 0; i < S; i++) {
      const x = i / (S - 1) * w, v = smoothBuf[i];
      const breathe = Math.sin(i * 0.05 + phase * 1.5) * 18 * (1 + midEnv);
      const yc = mid + v * h * 0.22 + breathe;
      const thickness = 18 + Math.abs(v) * 60 + bassEnv * 40 + beatFlash * 30 + Math.sin(i * 0.1 + phase) * 6;
      pts.push({ x, yc, t: thickness });
    }
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, rgba(c1, 0.7)); grad.addColorStop(0.5, rgba(c2, 0.7)); grad.addColorStop(1, rgba(c3, 0.7));
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) { const p = pts[i], y = p.yc - p.t / 2; if (i === 0) ctx.moveTo(p.x, y); else ctx.lineTo(p.x, y); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; ctx.lineTo(p.x, p.yc + p.t / 2); }
    ctx.closePath();
    ctx.fillStyle = grad; ctx.shadowColor = rgba(c2, 0.7); ctx.shadowBlur = glow + beatFlash * 20;
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) { const p = pts[i]; if (i === 0) ctx.moveTo(p.x, p.yc); else ctx.lineTo(p.x, p.yc); }
    ctx.strokeStyle = rgba([255,255,255], 0.35 + highEnv * 0.4 + beatFlash * 0.3);
    ctx.lineWidth = 1.2; ctx.shadowBlur = glow * 0.5;
    ctx.stroke(); ctx.shadowBlur = 0;
  }
  function drawOrb(w,h,c1,c2,c3,glow) {
    const cx = w / 2, cy = h / 2;
    const baseR = Math.min(w, h) * 0.22 * (1 + beatFlash * 0.15);
    const S = smoothBuf.length;
    for (let ring = 0; ring < 3; ring++) {
      const t = ring / 2, col = triColor(t, c1, c2, c3);
      ctx.beginPath();
      const rot = phase * (0.4 + ring * 0.2) * (ring % 2 ? 1 : -1);
      const r0 = baseR + ring * 22 + bassEnv * 60 + beatFlash * 30;
      for (let i = 0; i <= S; i++) {
        const a = (i / S) * Math.PI * 2 + rot;
        const v = smoothBuf[i % S];
        const r = r0 + v * 60 + Math.sin(a * 4 + phase * 2) * 10 * (1 + midEnv);
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = rgba(col, 0.8 - ring * 0.18);
      ctx.lineWidth = 2 - ring * 0.4 + beatFlash;
      ctx.shadowColor = rgba(col, 0.9); ctx.shadowBlur = glow + beatFlash * 20;
      ctx.stroke();
    }
    const coreR = baseR * 0.5 + bassEnv * 40 + beatFlash * 25;
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    rg.addColorStop(0, rgba(c1, 0.5 + bassEnv * 0.4 + beatFlash * 0.3));
    rg.addColorStop(1, rgba(c1, 0));
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  function drawNebula(w,h,c1,c2,c3,glow) {
    const cx = w / 2, cy = h / 2; const blobs = 24;
    for (let i = 0; i < blobs; i++) {
      const t = i / blobs;
      const a = t * Math.PI * 2 + phase * (0.6 + (i % 3) * 0.2);
      const orbit = Math.min(w, h) * 0.18 + i * 4 + bassEnv * 60 + beatFlash * 40;
      const wob = Math.sin(phase * 2 + i) * 15;
      const x = cx + Math.cos(a) * (orbit + wob), y = cy + Math.sin(a) * (orbit * 0.7 + wob);
      const col = triColor((Math.sin(t * Math.PI * 2 + phase) * 0.5 + 0.5), c1, c2, c3);
      const r = 30 + midEnv * 60 + Math.sin(phase * 3 + i) * 10 + highEnv * 30 + beatFlash * 20;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, rgba(col, 0.45 + beatFlash * 0.2));
      rg.addColorStop(0.5, rgba(col, 0.15));
      rg.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    const S = smoothBuf.length;
    ctx.beginPath();
    for (let i = 0; i < S; i++) {
      const x = i / (S - 1) * w, v = smoothBuf[i];
      const y = cy + v * h * 0.18 + Math.sin(i * 0.06 + phase * 2) * 10;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rgba(c2, 0.75); ctx.lineWidth = 1.5;
    ctx.shadowColor = rgba(c2, 0.9); ctx.shadowBlur = glow * 0.7;
    ctx.stroke(); ctx.shadowBlur = 0;
  }
  function drawParticles(w,h,c1,c2,c3,glow) {
    ensureParticles(160);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = 0.5 - p.x, dy = 0.5 - p.y; const d = Math.hypot(dx, dy) + 0.01;
      p.vx += dx / d * (bassEnv + beatFlash * 0.5) * 0.0008 * 0.4;
      p.vy += dy / d * (bassEnv + beatFlash * 0.5) * 0.0008 * 0.4;
      p.vx += -dy / d * 0.0012 * (1 + midEnv); p.vy += dx / d * 0.0012 * (1 + midEnv);
      p.vx += (Math.random() - 0.5) * 0.0006 * highEnv;
      p.vy += (Math.random() - 0.5) * 0.0006 * highEnv;
      p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy; p.life -= 0.003;
      if (p.life <= 0 || p.x < -0.1 || p.x > 1.1 || p.y < -0.1 || p.y > 1.1) {
        const a = Math.random() * Math.PI * 2;
        p.x = 0.5 + Math.cos(a) * 0.55; p.y = 0.5 + Math.sin(a) * 0.55;
        p.vx = -Math.cos(a) * 0.003; p.vy = -Math.sin(a) * 0.003;
        p.life = 1; p.hue = Math.random();
      }
      const col = triColor(p.hue, c1, c2, c3);
      const a = Math.max(0, Math.min(1, p.life)) * (0.6 + beatFlash * 0.4);
      const sz = p.size * (1 + beatFlash * 1.5);
      ctx.fillStyle = rgba(col, a); ctx.shadowColor = rgba(col, a); ctx.shadowBlur = glow * 0.6;
      ctx.beginPath(); ctx.arc(p.x * w, p.y * h, sz, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  function drawMountains(w,h,c1,c2,c3,glow) {
    mountainOffset += (0.5 + bassEnv * 2) * (+speedEl.value / 100);
    const layers = 4, N = freqData.length;
    for (let L = 0; L < layers; L++) {
      const t = L / (layers - 1), col = triColor(t, c1, c2, c3);
      const yBase = h * (0.5 + L * 0.13);
      const amp = (60 + bassEnv * 120 + beatFlash * 40) * (1 - t * 0.4);
      const speedL = (0.3 + L * 0.4);
      ctx.beginPath(); ctx.moveTo(0, h);
      const COLS = 80;
      for (let i = 0; i <= COLS; i++) {
        const x = i / COLS * w;
        const fi = Math.floor(((i + mountainOffset * speedL) % COLS) / COLS * N * 0.5);
        const fv = freqData[fi] / 255;
        const noise = Math.sin(i * 0.3 + phase * 2 + L) * 0.15 + Math.sin(i * 0.7 - phase + L * 2) * 0.08;
        ctx.lineTo(x, yBase - (fv + noise) * amp);
      }
      ctx.lineTo(w, h); ctx.closePath();
      const grad = ctx.createLinearGradient(0, yBase - amp, 0, h);
      grad.addColorStop(0, rgba(col, 0.85 - t * 0.3)); grad.addColorStop(1, rgba(col, 0.05));
      ctx.fillStyle = grad; ctx.shadowColor = rgba(col, 0.6); ctx.shadowBlur = glow * 0.5;
      ctx.fill();
      ctx.beginPath();
      for (let i = 0; i <= COLS; i++) {
        const x = i / COLS * w;
        const fi = Math.floor(((i + mountainOffset * speedL) % COLS) / COLS * N * 0.5);
        const fv = freqData[fi] / 255;
        const noise = Math.sin(i * 0.3 + phase * 2 + L) * 0.15 + Math.sin(i * 0.7 - phase + L * 2) * 0.08;
        const y = yBase - (fv + noise) * amp;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 1.2; ctx.shadowBlur = glow * 0.4;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
  function drawTunnel(w,h,c1,c2,c3,glow) {
    const cx = w / 2, cy = h / 2; const rings = 14, N = freqData.length;
    for (let r = rings; r >= 0; r--) {
      const t = r / rings, col = triColor(1 - t, c1, c2, c3);
      const baseR = (1 - t) * Math.min(w, h) * 0.55 + 8;
      const sides = 6;
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const a = i / sides * Math.PI * 2 + phase * (0.3 + t * 0.6);
        const fi = Math.floor(((i + r) % sides) / sides * N * 0.4);
        const fv = freqData[fi] / 255;
        const rad = baseR * (1 + fv * 0.4 + beatFlash * 0.3 * t);
        const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = rgba(col, 0.5 + t * 0.4);
      ctx.lineWidth = 1 + t * 2 + beatFlash;
      ctx.shadowColor = rgba(col, 0.8); ctx.shadowBlur = glow * (0.4 + t * 0.6);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
})();
