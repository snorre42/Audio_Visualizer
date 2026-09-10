// visualizer.js — browser-only version for embedding on websites.
// Audio sources: mic, file upload, demo, or system/tab audio (via getDisplayMedia
// on Chrome/Edge — the user must tick "share audio" in the picker dialog).

(function () {
  const wrap = document.getElementById('viz-wrap');
  const c2d = document.getElementById('viz-2d');
  const c3d = document.getElementById('viz-3d');
  const cBloom = document.getElementById('viz-bloom');
  const cFx = document.getElementById('viz-fx');
  const ctx = c2d.getContext('2d');
  const bctx = cBloom.getContext('2d');
  const fxctx = cFx.getContext('2d');
  const fpsTag = document.getElementById('fps-tag');
  const beatPulse = document.getElementById('beat-pulse');
  const vjTag = document.getElementById('vj-tag');
  const intro = document.getElementById('intro');

  // Slider readouts
  ['vj-speed','opacity2d','sens','speed','smooth','beat','distort','glow','trail','volume','zoom','zoom2d','bloom','hue-speed','ab','fb','shake','fog','anim','echo','strobe','symdist','glitch'].forEach(n => {
    const el = document.getElementById(n);
    const out = document.getElementById(n + '-val');
    el.addEventListener('input', () => out.textContent = el.value);
  });

  const layerSel = document.getElementById('layer-mode');
  const shape3dSel = document.getElementById('shape3d');
  const mode2dSel = document.getElementById('mode2d');
  const symSel = document.getElementById('symmetry');
  const sym3dSel = document.getElementById('symmetry3d');
  const animEl = document.getElementById('anim');
  const symDistEl = document.getElementById('symdist');
  const echoOnEl = document.getElementById('echo-on');
  const echoEl = document.getElementById('echo');
  const strobeEl = document.getElementById('strobe');
  const strobePlate = document.getElementById('strobe-plate');
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
  const volumeEl = document.getElementById('volume');
  const zoomEl = document.getElementById('zoom');
  const zoom2dEl = document.getElementById('zoom2d');
  const bloomOnEl = document.getElementById('bloom-on');
  const bloomEl = document.getElementById('bloom');
  const hueOnEl = document.getElementById('hue-on');
  const hueSpeedEl = document.getElementById('hue-speed');
  const camMotionEl = document.getElementById('cam-motion');
  const abOnEl = document.getElementById('ab-on');
  const abEl = document.getElementById('ab');
  const fbOnEl = document.getElementById('fb-on');
  const fbEl = document.getElementById('fb');
  const shakeEl = document.getElementById('shake');
  const morphOnEl = document.getElementById('morph-on');
  const fogOnEl = document.getElementById('fog-on');
  const fogEl = document.getElementById('fog');
  const glitchOnEl = document.getElementById('glitch-on');
  const glitchEl = document.getElementById('glitch');
  // Embedded on itch.io (and anywhere else that iframes the page), the parent
  // decides which powerful features this document may use. getUserMedia and
  // getDisplayMedia are withheld by default, and nothing inside the frame can
  // grant them back — the only fix is to leave the frame.
  const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  const vjSyncEl = document.getElementById('vj-sync');
  const bpmTag = document.getElementById('bpm-tag');
  const tempoVal = document.getElementById('tempo-val');
  const routeEls = {
    pulse: document.getElementById('route-pulse'),
    texture: document.getElementById('route-texture'),
    sparkle: document.getElementById('route-sparkle')
  };

  // ===== LANGUAGE =====
  // Norks førsty så; English is the fallback layer. Nothing is tagged in
  // the markup — every string is reached through the id the control already
  // has, so the HTML stays readable and the copy lives in exactly one place.
  const LANG_KEY = 'viz.lang';
  const LANGS = ['no', 'en'];
  let lang = 'no';

  const STR = {
    en: {
      // section headers, in panel order
      sect: ['Appearance','Playback','Mode','Colors','Auto-VJ','Reactivity','Band routing','2D Effects','Motion & FX'],
      // row labels, keyed by the first control in the row
      lbl: {
        lang:'Language', theme:'Skin', volume:'Volume', zoom:'3D zoom', zoom2d:'2D zoom',
        'layer-mode':'Layers', shape3d:'3D shape', mode2d:'2D mode', symmetry:'2D symmetry',
        quality:'Quality', symmetry3d:'3D symmetry', symdist:'Sym distance', anim:'Anim speed', preset:'Preset', col1:'Wave', 'bg-col':'BG', 'vj-speed':'VJ speed',
        'vj-sync':'Bar sync', 'btn-tap':'Tempo',
        'route-pulse':'Pulse', 'route-texture':'Texture', 'route-sparkle':'Sparkle',
        sens:'Sensitivity', beat:'Beat', distort:'Distort', speed:'Spin', smooth:'Smooth',
        opacity2d:'Opacity', glow:'Glow', trail:'Trails', 'bloom-on':'Bloom',
        'hue-on':'Hue cycle', 'cam-motion':'Camera', 'ab-on':'RGB split', 'fb-on':'Feedback',
        shake:'Shake', 'morph-on':'Morph', 'fog-on':'Fog', 'echo-on':'Echo', strobe:'Strobe',
        'glitch-on':'Glitch', 'btn-midi':'MIDI',
        'btn-model':'Own model', 'btn-roll':'Random FX'
      },
      opt: {
        'layer-mode': { auto:'3D only', both:'Both layered', '2d-only':'2D only' },
        shape3d: { sphere:'Sphere (blob)', cube:'Cube', icosa:'Icosahedron', torus:'Torus knot',
          wire:'Wireframe globe', diamond:'Diamond', susan:'Susan', discoman:'Discoman',
          danceman:'Danceman', blocks:'Blocks' },
        mode2d: { ribbon:'Ribbon', wave:'Wave', orb:'Orb', nebula:'Nebula', particles:'Particles',
          mountains:'Mountains', tunnel:'Tunnel', spectrum:'Spectrum bars', eq:'EQ (classic)',
          radial:'Radial spectrum', scope:'Oscilloscope', waterfall:'Waterfall', grid:'LED grid',
          rings:'Pulse rings', ripples:'Ripples', corona:'Coronal ejection', plasma:'Plasma',
          fireworks:'Fireworks', drain:'Down the drain', emdr:'EMDR light', stars:'Starfield', cosmos:'Cosmos' },
        symmetry: { '1':'None', '2':'Mirror', '3':'3-fold', '4':'4-fold', '6':'6-fold', '8':'8-fold' },
        symmetry3d: { '1':'None', '2':'Mirror', '3':'3-fold', '4':'4-fold', '6':'6-fold', '8':'8-fold' },
        quality: { '0.6':'Low', '1':'Standard', '1.5':'High', '2':'Ultra' },
        preset: { silver:'Silver', aurora:'Aurora', 'deep-sea':'Deep sea', nebula:'Nebula',
          lava:'Lava lamp', ice:'Ice', sunset:'Sunset', midnight:'Midnight', forest:'Forest', custom:'Custom' },
        'route-pulse': { bass:'Bass', mid:'Mid', high:'Treble', beat:'Beat', mix:'Full mix' },
        'route-texture': { bass:'Bass', mid:'Mid', high:'Treble', beat:'Beat', mix:'Full mix' },
        'route-sparkle': { bass:'Bass', mid:'Mid', high:'Treble', beat:'Beat', mix:'Full mix' },
        'cam-motion': { none:'Fixed', orbit:'Auto-orbit', dolly:'Dolly', sway:'Sway' },
        theme: { spectra:'Retro · rack tuner', aero:'Aero · Vista glass' }
      },
      grp: { Abstract:'Abstract', Models:'Models', Mine:'Mine' },
      btn: { 'btn-mic':'Mic', 'btn-sys':'🔊 System', 'btn-file':'📁 File', 'btn-demo':'▶ Demo',
        'btn-hide':'👁 Hide', 'btn-reset':'↺ Reset to defaults',
        'btn-model':'Upload', 'btn-model-del':'Delete', 'btn-tap':'Tap', 'btn-roll':'Roll',
        'btn-pop':'⧉ New window' },
      tip: { 'btn-mic':'Microphone', 'btn-sys':'System / tab audio — tick "share audio" in the dialog',
        'btn-file':'Upload audio file', 'btn-demo':'Demo tone', 'btn-beat':'Beat demo — press again to stop',
        'btn-pause':'Pause animation and music (Space)', 'btn-vj':'Toggle Auto-VJ (V)',
        'btn-fs':'Fullscreen (F)', 'btn-hide':'Hide all UI (H)', 'btn-keys':'Keyboard shortcuts (?)',
        'btn-panel':'Settings (P)', 'btn-reset':'Restore all settings to defaults',
        'btn-model':'Load your own .obj, .stl or .glb model',
        'btn-model-del':'Remove this model permanently',
        'btn-tap':'Tap the beat to set the tempo (B). One tap after a pause returns to automatic.',
        'btn-pop':'Open in its own window — needed for microphone and system audio when embedded',
        'btn-roll':'Roll a new combination of effects (X)' },
      keys: { title:'Keyboard shortcuts', hint:'Press ? or Esc to close',
        rows:['Play / pause','Hide all UI','Fullscreen','Randomize look','Random effects','Toggle Auto-VJ','Tap tempo',
              'Settings panel','Switch skin','Prev / next 3D shape','Prev / next 2D mode'] },
      introTitle: 'Audio Visualizer',
      introDesc: 'Click a source below to start. Try Auto-VJ with your own track.<br><b>H</b> hides the UI · <b>?</b> shows all shortcuts.',
      by: 'by',
      pause:'⏸ Pause', play:'▶ Play', vjOn:'Stop VJ', vjOff:'Auto-VJ',
      beatOn:'⏹ Stop', beatOff:'⏱ Beat',
      fsOn:'⛶ Exit', fsOff:'⛶ Full', midiOn:'On', midiOff:'Enable',
      t: {
        hueOff:'Hue cycle off', uiHidden:'UI hidden — press H to show', randomized:'🎲 Randomized', fxRolled:'🎲 Random effects',
        paused:'⏸ Paused', playing:'▶ Playing', reset:'↺ Reset to defaults',
        skin:'Skin', shape:'Shape', mode2d:'2D mode', lang:'Language',
        sysNo:'System audio not supported in this browser',
        sysNoAudio:'No audio shared — tick "Share tab/system audio" in the dialog',
        sysOn:'🔊 System audio connected', sysOff:'System audio stopped',
        sysFail:'System audio unavailable',
        midiNo:'Web MIDI not supported', midiDenied:'MIDI access denied',
        midiDev:'dev', midiNoDev:'no dev', midiErr:'err', midiNa:'n/a',
        tris:'triangles', thinned:'(thinned to fit)', modelBad:'Could not read that model',
        modelGone:'Model removed', modelCompressed:'Compressed glTF needs a decoder this page does not ship',
        modelExternal:'That .gltf points at separate files — export as .glb instead',
        framesWord:'frames', modelFrames:'Frames must all have the same vertex count',
        tempoAuto:'Tempo: following the music', tempoTap:'Tempo', bpm:'BPM',
        sysFramed:'Embedded pages cannot capture system audio — open in its own window',
        micFramed:'Embedded pages cannot use the microphone — open in its own window',
        popBlocked:'This embed blocks new windows — open the page directly instead'
      }
    },
    no: {
      sect: ['Utseende','Avspilling','Modus','Farger','Auto-VJ','Reaktivitet','Båndruting','2D-effekter','Bevegelse og FX'],
      lbl: {
        lang:'Språk', theme:'Tema', volume:'Volum', zoom:'3D-zoom', zoom2d:'2D-zoom',
        'layer-mode':'Lag', shape3d:'3D-form', mode2d:'2D-modus', symmetry:'2D-symmetri',
        quality:'Kvalitet', symmetry3d:'3D-symmetri', symdist:'Sym-avstand', anim:'Anim-fart', preset:'Forhåndsvalg', col1:'Bølge', 'bg-col':'BG', 'vj-speed':'VJ-fart',
        'vj-sync':'Taktsynk', 'btn-tap':'Tempo',
        'route-pulse':'Puls', 'route-texture':'Tekstur', 'route-sparkle':'Glitter',
        sens:'Følsomhet', beat:'Takt', distort:'Forvreng', speed:'Rotasjon', smooth:'Utjevning',
        opacity2d:'Dekkevne', glow:'Glød', trail:'Spor', 'bloom-on':'Bloom',
        'hue-on':'Fargesyklus', 'cam-motion':'Kamera', 'ab-on':'RGB-splitt', 'fb-on':'Tilbakekobling',
        shake:'Risting', 'morph-on':'Morf', 'fog-on':'Tåke', 'echo-on':'Ekko', strobe:'Strobe',
        'glitch-on':'Glitch', 'btn-midi':'MIDI',
        'btn-model':'Egen modell', 'btn-roll':'Tilfeldig FX'
      },
      opt: {
        'layer-mode': { auto:'Kun 3D', both:'Begge lagvis', '2d-only':'Kun 2D' },
        shape3d: { sphere:'Kule (blob)', cube:'Kube', icosa:'Ikosaeder', torus:'Torusknute',
          wire:'Trådklode', diamond:'Diamant', susan:'Susan', discoman:'Discoman',
          danceman:'Danceman', blocks:'Blokker' },
        mode2d: { ribbon:'Bånd', wave:'Bølge', orb:'Kule', nebula:'Nebula', particles:'Partikler',
          mountains:'Fjell', tunnel:'Tunnel', spectrum:'Spekterstolper', eq:'EQ (klassisk)',
          radial:'Radialt spekter', scope:'Oscilloskop', waterfall:'Fossefall', grid:'LED-rutenett',
          rings:'Pulsringer', ripples:'Krusninger', corona:'Koronautbrudd', plasma:'Plasma',
          fireworks:'Fyrverkeri', drain:'Ned i sluket', emdr:'EMDR-lys', stars:'Stjernefelt', cosmos:'Kosmos' },
        symmetry: { '1':'Ingen', '2':'Speil', '3':'3-delt', '4':'4-delt', '6':'6-delt', '8':'8-delt' },
        symmetry3d: { '1':'Ingen', '2':'Speil', '3':'3-delt', '4':'4-delt', '6':'6-delt', '8':'8-delt' },
        quality: { '0.6':'Lav', '1':'Standard', '1.5':'Høy', '2':'Ultra' },
        preset: { silver:'Sølv', aurora:'Nordlys', 'deep-sea':'Dyphav', nebula:'Nebula',
          lava:'Lavalampe', ice:'Is', sunset:'Solnedgang', midnight:'Midnatt', forest:'Skog', custom:'Egendefinert' },
        'route-pulse': { bass:'Bass', mid:'Mellomtone', high:'Diskant', beat:'Takt', mix:'Hele miksen' },
        'route-texture': { bass:'Bass', mid:'Mellomtone', high:'Diskant', beat:'Takt', mix:'Hele miksen' },
        'route-sparkle': { bass:'Bass', mid:'Mellomtone', high:'Diskant', beat:'Takt', mix:'Hele miksen' },
        'cam-motion': { none:'Fast', orbit:'Auto-bane', dolly:'Dolly', sway:'Svai' },
        theme: { spectra:'Retro · rack-tuner', aero:'Aero · Vista-glass' }
      },
      grp: { Abstract:'Abstrakt', Models:'Modeller', Mine:'Egne' },
      btn: { 'btn-mic':'Mik', 'btn-sys':'🔊 System', 'btn-file':'📁 Fil', 'btn-demo':'▶ Demo',
        'btn-hide':'👁 Skjul', 'btn-reset':'↺ Tilbakestill',
        'btn-model':'Last opp', 'btn-model-del':'Slett', 'btn-tap':'Tapp', 'btn-roll':'Trill',
        'btn-pop':'⧉ Eget vindu' },
      tip: { 'btn-mic':'Mikrofon', 'btn-sys':'System-/fanelyd — huk av «del lyd» i dialogen',
        'btn-file':'Last opp lydfil', 'btn-demo':'Demotone', 'btn-beat':'Taktdemo — trykk igjen for å stoppe',
        'btn-pause':'Pause animasjon og musikk (mellomrom)', 'btn-vj':'Slå Auto-VJ av/på (V)',
        'btn-fs':'Fullskjerm (F)', 'btn-hide':'Skjul hele grensesnittet (H)',
        'btn-keys':'Tastatursnarveier (?)', 'btn-panel':'Innstillinger (P)',
        'btn-reset':'Tilbakestill alle innstillinger',
        'btn-model':'Last inn din egen .obj-, .stl- eller .glb-modell',
        'btn-model-del':'Fjern denne modellen permanent',
        'btn-tap':'Tapp takten for å sette tempoet (B). Ett tapp etter en pause går tilbake til automatikk.',
        'btn-pop':'Åpne i eget vindu — kreves for mikrofon og systemlyd når siden er innebygd',
        'btn-roll':'Trill en ny kombinasjon av effekter (X)' },
      keys: { title:'Tastatursnarveier', hint:'Trykk ? eller Esc for å lukke',
        rows:['Spill / pause','Skjul grensesnittet','Fullskjerm','Tilfeldig utseende','Tilfeldige effekter','Slå Auto-VJ av/på','Tapp tempo',
              'Innstillinger','Bytt tema','Forrige / neste 3D-form','Forrige / neste 2D-modus'] },
      introTitle: 'Musikkvisualisering',
      introDesc: 'Veldig kul visualizer med ymse effekter og modeller. Gå til Bevegelse og FX nederst for effekter. Trykk system og del lyd.<br><b>H</b> Skjul UI · <b>?</b> Shortcuts.',
      by: 'av',
      pause:'⏸ Pause', play:'▶ Spill', vjOn:'Stopp VJ', vjOff:'Auto-VJ',
      beatOn:'⏹ Stopp', beatOff:'⏱ Takt',
      fsOn:'⛶ Avslutt', fsOff:'⛶ Full', midiOn:'På', midiOff:'Slå på',
      t: {
        hueOff:'Fargesyklus av', uiHidden:'Grensesnitt skjult — trykk H for å vise',
        randomized:'🎲 Tilfeldig', fxRolled:'🎲 Tilfeldige effekter', paused:'⏸ Pauset', playing:'▶ Spiller', reset:'↺ Tilbakestilt',
        skin:'Tema', shape:'Form', mode2d:'2D-modus', lang:'Språk',
        sysNo:'Systemlyd støttes ikke i denne nettleseren',
        sysNoAudio:'Ingen lyd delt — huk av «del fane-/systemlyd» i dialogen',
        sysOn:'🔊 Systemlyd tilkoblet', sysOff:'Systemlyd stoppet',
        sysFail:'Systemlyd utilgjengelig',
        midiNo:'Web MIDI støttes ikke', midiDenied:'MIDI-tilgang avslått',
        midiDev:'enh.', midiNoDev:'ingen', midiErr:'feil', midiNa:'—',
        tris:'trekanter', thinned:'(tynnet ut)', modelBad:'Klarte ikke lese modellen',
        modelGone:'Modell fjernet', modelCompressed:'Komprimert glTF krever en dekoder denne siden ikke har',
        modelExternal:'Denne .gltf-filen peker på egne filer — eksporter som .glb i stedet',
        framesWord:'bilder', modelFrames:'Alle bildene må ha like mange hjørner',
        tempoAuto:'Tempo: følger musikken', tempoTap:'Tempo', bpm:'BPM',
        sysFramed:'Innebygde sider får ikke ta opp systemlyd — åpne i eget vindu',
        micFramed:'Innebygde sider får ikke bruke mikrofonen — åpne i eget vindu',
        popBlocked:'Denne rammen blokkerer nye vinduer — åpne siden direkte i stedet'
      }
    }
  };

  function L() { return STR[lang] || STR.en; }
  function t(key) { return (L().t[key] !== undefined) ? L().t[key] : STR.en.t[key]; }

  const langSel = document.getElementById('lang');
  function applyLang(next, announce) {
    if (LANGS.indexOf(next) === -1) next = 'no';
    lang = next;
    const D = L();
    document.documentElement.setAttribute('lang', lang);
    langSel.value = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}

    // section headers, in document order
    const heads = document.querySelectorAll('#panel h3');
    heads.forEach((h, i) => {
      if (!D.sect[i]) return;
      // the collapse caret is a ::before, so textContent is the label alone
      h.childNodes.forEach(n => { if (n.nodeType === 3) n.nodeValue = ''; });
      h.appendChild(document.createTextNode(D.sect[i]));
      h.dataset.sect = D.sect[i];
    });

    // row labels, keyed by the first identified control in the row
    document.querySelectorAll('#panel .row').forEach(row => {
      const label = row.querySelector('label');
      const ctrl = row.querySelector('input[id], select[id], button[id]');
      if (label && ctrl && D.lbl[ctrl.id]) label.textContent = D.lbl[ctrl.id];
    });

    // select options and optgroups
    Object.keys(D.opt).forEach(selId => {
      const sel = document.getElementById(selId); if (!sel) return;
      [...sel.options].forEach(o => { if (D.opt[selId][o.value]) o.textContent = D.opt[selId][o.value]; });
    });
    document.querySelectorAll('#panel optgroup').forEach(g => {
      const key = g.dataset.key || g.label;
      g.dataset.key = key;
      if (D.grp[key]) g.label = D.grp[key];
    });

    // static buttons and every tooltip
    Object.keys(D.btn).forEach(id => {
      const b = document.getElementById(id); if (b) b.textContent = D.btn[id];
    });
    Object.keys(D.tip).forEach(id => {
      const b = document.getElementById(id); if (b) b.title = D.tip[id];
    });

    // shortcut card
    const kc = document.getElementById('keys');
    kc.querySelector('h4').textContent = D.keys.title;
    kc.querySelector('.hint').textContent = D.keys.hint;
    kc.querySelectorAll('.k span').forEach((s, i) => { if (D.keys.rows[i]) s.textContent = D.keys.rows[i]; });

    // intro plate + byline
    document.querySelector('#intro .title').textContent = D.introTitle;
    document.querySelector('#intro .desc').innerHTML = D.introDesc;
    document.querySelector('#credit .by').textContent = D.by;

    // Labels that encode state have to be re-derived, not translated in place.
    syncStatefulLabels();
    if (announce && typeof toast === 'function') toast(t('lang') + ': ' + (lang === 'no' ? 'Norsk' : 'English'));
  }

  // Pause / fullscreen / Auto-VJ / MIDI all show one of two words depending on
  // what they're doing right now, so a language switch re-reads that state.
  function syncStatefulLabels() {
    const D = L();
    // State is read off the DOM, not off the module's `let` bindings: this runs
    // during boot, before those are initialised, and `typeof` throws on a
    // let/const still in its temporal dead zone.
    const set = (id, onText, offText) => {
      const el = document.getElementById(id);
      if (el) el.textContent = el.classList.contains('on') ? onText : offText;
    };
    set('btn-pause', D.play, D.pause);
    set('btn-vj', D.vjOn, D.vjOff);
    set('btn-beat', D.beatOn, D.beatOff);
    set('btn-midi', D.midiOn, D.midiOff);
    const fb = document.getElementById('btn-fs');
    if (fb) fb.textContent = (document.fullscreenElement || document.webkitFullscreenElement) ? D.fsOn : D.fsOff;
  }

  try {
    const savedLang = localStorage.getItem(LANG_KEY);
    if (savedLang && LANGS.indexOf(savedLang) !== -1) lang = savedLang;
  } catch (e) {}
  langSel.addEventListener('change', () => applyLang(langSel.value, true));
  applyLang(lang, false);   // Norwegian unless this browser saved otherwise

  // ===== SKIN =====
  // Two finished worlds, not a light/dark pair. Persisted per browser.
  const THEME_KEY = 'viz.theme';
  const THEMES = ['spectra', 'aero'];
  const themeSel = document.getElementById('theme');
  function applyTheme(name, announce) {
    if (THEMES.indexOf(name) === -1) name = 'spectra';
    document.documentElement.setAttribute('data-theme', name);
    themeSel.value = name;
    try { localStorage.setItem(THEME_KEY, name); } catch (e) {}
    if (announce && typeof toast === 'function') {
      toast(t('skin') + ': ' + (name === 'aero' ? 'Aero' : 'Retro'));
    }
  }
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) applyTheme(saved, false);
  } catch (e) {}
  themeSel.addEventListener('change', () => applyTheme(themeSel.value, true));

  // Panel toggle
  const panel = document.getElementById('panel');
  document.getElementById('btn-panel').addEventListener('click', () => panel.classList.toggle('open'));

  // Collapsible panel sections: wrap each h3's following rows in a .sect block
  const COLLAPSE_KEY = 'viz.collapsed';
  let collapsedSet = new Set();
  try { collapsedSet = new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '[]')); } catch (e) {}
  panel.querySelectorAll('h3').forEach(head => {
    const name = head.textContent.trim();
    const sect = document.createElement('div');
    sect.className = 'sect';
    let node = head.nextSibling;
    while (node && !(node.nodeType === 1 && (node.tagName === 'H3' || node.id === 'btn-reset'))) {
      const next = node.nextSibling;
      sect.appendChild(node);
      node = next;
    }
    head.insertAdjacentElement('afterend', sect);
    if (collapsedSet.has(name)) { head.classList.add('collapsed'); sect.classList.add('hidden'); }
    head.addEventListener('click', () => {
      const nowCollapsed = sect.classList.toggle('hidden');
      head.classList.toggle('collapsed', nowCollapsed);
      if (nowCollapsed) collapsedSet.add(name); else collapsedSet.delete(name);
      try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...collapsedSet])); } catch (e) {}
    });
  });

  // Manual override locks
  const manualOverrideUntil = {};
  function markManual(id) { manualOverrideUntil[id] = performance.now() + 4000; }
  function isLockedByUser(id) { const t = manualOverrideUntil[id]; return t && performance.now() < t; }
  ['speed','distort','glow','trail','opacity2d','col1','col2','col3','bg-col','shape3d','mode2d','symmetry','symmetry3d','layer-mode'].forEach(id => {
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
  function stopHueCycle() {
    if (hueOnEl && hueOnEl.checked) { hueOnEl.checked = false; if (typeof toast === 'function') toast(t('hueOff')); }
  }
  presetSel.addEventListener('change', () => {
    if (presets[presetSel.value]) {
      const [a,b,c,bg] = presets[presetSel.value];
      col1.value = a; col2.value = b; col3.value = c; bgCol.value = bg;
      stopHueCycle();
    }
  });
  [col1, col2, col3, bgCol].forEach(el => el.addEventListener('input', () => { presetSel.value = 'custom'; stopHueCycle(); }));

  // ===== AUDIO =====
  let audioCtx = null, analyser = null, gainNode = null, source = null, mediaStream = null, audioEl = null, oscNodes = null;
  const FFT = 2048;
  const timeData = new Uint8Array(FFT);
  const freqData = new Uint8Array(FFT / 2);
  let running = false;
  let paused = false;
  let outputEnabled = false;

  function ensureCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = FFT;
      analyser.smoothingTimeConstant = 0.85;
      gainNode = audioCtx.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(audioCtx.destination);
      analyser.connect(gainNode);
    }
    if (audioCtx.state === 'suspended' && !paused) audioCtx.resume();
  }
  function applyVolume() {
    if (gainNode) gainNode.gain.value = outputEnabled ? (+volumeEl.value / 100) : 0;
  }
  // The demo sources have no natural end, so Beat is a toggle: the button that
  // started it stops it. Every other source clears it on the way in, through
  // stopAll, so the lamp can never lie about what is playing.
  let srcKind = null;
  function setSource(kind) {
    srcKind = kind;
    const b = document.getElementById('btn-beat');
    b.classList.toggle('on', kind === 'beat');
    b.textContent = (kind === 'beat') ? L().beatOn : L().beatOff;
  }

  function stopAll() {
    if (source) { try { source.disconnect(); } catch (e) {} source = null; }
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
    if (audioEl) { try { audioEl.pause(); audioEl.src = ''; } catch (e) {} audioEl = null; }
    if (oscNodes) { oscNodes.forEach(n => { try { n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} }); oscNodes = null; }
    outputEnabled = false;
    applyVolume();
    setSource(null);
  }
  function dismissIntro() { intro.classList.add('hidden'); requestWakeLock(); }

  // A blocked permission and a cancelled picker both arrive as NotAllowedError,
  // so the error alone cannot tell them apart. The block comes back immediately
  // though, while a person needs time to reach the Cancel button — inside a
  // frame, an instant rejection is the embed refusing, not the user declining.
  function deniedByFrame(t0) { return framed && performance.now() - t0 < 250; }

  // Leaving the frame is the whole fix: the same URL as a top-level document
  // gets the permissions the embed withheld.
  const popBtn = document.getElementById('btn-pop');
  if (framed) popBtn.hidden = false;
  popBtn.addEventListener('click', () => {
    const w = window.open(location.href, '_blank');
    if (w) w.opener = null; else toast(t('popBlocked'));   // sandboxed frames refuse popups
  });

  async function startMic() {
    const t0 = performance.now();
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
      if (deniedByFrame(t0)) toast(t('micFramed'));
    }
  }
  async function startSystem() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      toast(t('sysNo'));
      return;
    }
    const t0 = performance.now();
    try {
      ensureCtx(); stopAll();
      // getDisplayMedia requires a video request; system/tab audio rides along.
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach(t => t.stop());
        toast(t('sysNoAudio'));
        return;
      }
      stream.getVideoTracks().forEach(t => t.stop()); // we only need the audio
      mediaStream = stream;
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser); // no output: it's already playing through the system
      audioTracks[0].addEventListener('ended', () => { running = false; toast(t('sysOff')); });
      running = true; dismissIntro();
      toast(t('sysOn'));
    } catch (e) {
      console.error('System audio failed:', e);
      if (deniedByFrame(t0)) toast(t('sysFramed'));
      else if (e && e.name !== 'NotAllowedError') toast(t('sysFail'));
    }
  }
  function startFile(file) {
    ensureCtx(); stopAll();
    audioEl = new Audio();
    audioEl.src = URL.createObjectURL(file);
    audioEl.crossOrigin = 'anonymous'; audioEl.loop = true;
    source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser);
    outputEnabled = true; applyVolume();
    audioEl.play().catch(e => console.error('File play failed:', e));
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
    setSource('beat');
  }

  document.getElementById('btn-mic').addEventListener('click', startMic);
  document.getElementById('btn-sys').addEventListener('click', startSystem);
  document.getElementById('btn-demo').addEventListener('click', startDemo);
  document.getElementById('btn-beat').addEventListener('click', () => {
    if (srcKind === 'beat') { stopAll(); running = false; }
    else startBeatDemo();
  });
  document.getElementById('btn-file').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('file-input').addEventListener('change', e => {
    if (e.target.files[0]) startFile(e.target.files[0]);
    e.target.value = '';
  });

  volumeEl.addEventListener('input', applyVolume);

  const pauseBtn = document.getElementById('btn-pause');
  function setPaused(p) {
    paused = p;
    pauseBtn.textContent = p ? L().play : L().pause;
    pauseBtn.classList.toggle('on', p);
    if (p) {
      if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
      if (audioEl) { try { audioEl.pause(); } catch (e) {} }
    } else {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (audioEl) { try { audioEl.play(); } catch (e) {} }
    }
  }
  pauseBtn.addEventListener('click', () => setPaused(!paused));

  // ===== DISPLAY / SHORTCUTS =====
  let toastTimer = null;
  const toastEl = document.getElementById('toast');
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1400);
  }

  // Fullscreen
  const fsBtn = document.getElementById('btn-fs');
  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    }
  }
  function updateFsBtn() {
    const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    fsBtn.textContent = on ? L().fsOn : L().fsOff;
    fsBtn.classList.toggle('on', on);
  }
  fsBtn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFsBtn);
  document.addEventListener('webkitfullscreenchange', updateFsBtn);

  // Hide-UI / clean mode
  let uiHidden = false;
  function setUiHidden(h) {
    uiHidden = h;
    document.body.classList.toggle('ui-hidden', h);
    if (h) { toggleKeys(false); toast(t('uiHidden')); }
  }

  // Screen wake lock
  let wakeLock = null;
  async function requestWakeLock() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && running) requestWakeLock();
  });

  // Randomize + cycle helpers (defined here, use options/presets declared below at call time)
  function setSliderVal(id, v) {
    const el = document.getElementById(id); if (!el) return;
    el.value = v;
    const out = document.getElementById(id + '-val'); if (out) out.textContent = v;
    markManual(id);
  }
  function randomizeAll() {
    shape3dSel.value = pick(shapeOptions); markManual('shape3d');
    mode2dSel.value = pick(mode2dOptions); markManual('mode2d');
    symSel.value = String(pick(symOptions)); markManual('symmetry');
    const pk = pick(presetKeys);
    presetSel.value = pk;
    const [a, b, c, bg] = presets[pk];
    col1.value = a; col2.value = b; col3.value = c; bgCol.value = bg;
    ['col1', 'col2', 'col3', 'bg-col'].forEach(markManual);
    setSliderVal('distort', Math.round(rand(60, 170)));
    setSliderVal('glow', Math.round(rand(15, 50)));
    setSliderVal('trail', Math.round(rand(78, 94)));
    setSliderVal('speed', Math.round(rand(60, 180)));
    toast(t('randomized'));
  }
  // Random FX: a deliberately sparse roll. Everything on at once is mush and a
  // framerate hit, so it lights two to four and silences the rest.
  //
  // Two controls are held out on purpose. Strobe, because a full-frame flash on
  // every kick is a photosensitivity risk and that belongs to the person at the
  // keyboard, not to a dice roll. Morph, because it is a preference about how
  // shapes change rather than a look, so a roll has no business moving it.
  const fxPool = [
    { on: 'bloom-on',  val: 'bloom',     lo: 25, hi: 85 },
    { on: 'hue-on',    val: 'hue-speed', lo: 15, hi: 70 },
    { on: 'ab-on',     val: 'ab',        lo: 20, hi: 80 },
    { on: 'fb-on',     val: 'fb',        lo: 25, hi: 70 },
    { on: 'fog-on',    val: 'fog',       lo: 25, hi: 80 },
    { on: 'echo-on',   val: 'echo',      lo: 25, hi: 75 },
    { on: 'glitch-on', val: 'glitch',    lo: 30, hi: 100 }
  ];
  function randomFx() {
    fxPool.forEach(f => { document.getElementById(f.on).checked = false; });
    const draw = fxPool.slice();
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n && draw.length; i++) {
      const f = draw.splice(Math.floor(Math.random() * draw.length), 1)[0];
      document.getElementById(f.on).checked = true;
      setSliderVal(f.val, Math.round(rand(f.lo, f.hi)));
    }
    // Camera and shake are dials rather than switches, so they get a value every
    // roll instead of a place in the draw.
    camMotionEl.value = pick(['none', 'none', 'orbit', 'dolly', 'sway']);
    setSliderVal('shake', Math.random() < 0.45 ? Math.round(rand(10, 55)) : 0);
    sizeFx();   // glitch may have just flipped, and it owns the FX resolution
    toast(t('fxRolled'));
  }
  document.getElementById('btn-roll').addEventListener('click', randomFx);

  function cycleSelect(sel, options, dir, id, label) {
    const i = options.indexOf(sel.value);
    sel.value = options[(i + dir + options.length) % options.length];
    markManual(id);
    toast(label + ': ' + sel.options[sel.selectedIndex].text);
  }

  // Shortcut cheatsheet overlay
  const keysEl = document.getElementById('keys');
  function toggleKeys(force) {
    const show = (force === undefined) ? !keysEl.classList.contains('show') : force;
    keysEl.classList.toggle('show', show);
  }

  document.getElementById('btn-keys').addEventListener('click', () => toggleKeys());
  document.getElementById('btn-hide').addEventListener('click', () => setUiHidden(true));
  keysEl.addEventListener('click', () => toggleKeys(false));

  // Keyboard shortcuts (ignored while typing in a control)
  window.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    switch (e.key) {
      case ' ': e.preventDefault(); setPaused(!paused); toast(paused ? t('paused') : t('playing')); break;
      case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
      case 'h': case 'H': e.preventDefault(); setUiHidden(!uiHidden); break;
      case 'r': case 'R': e.preventDefault(); randomizeAll(); break;
      case 'x': case 'X': e.preventDefault(); randomFx(); break;
      case 'v': case 'V': e.preventDefault(); setVj(!vjActive); break;
      case 'b': case 'B': e.preventDefault(); tapTempo(); break;
      case 'p': case 'P': e.preventDefault(); panel.classList.toggle('open'); break;
      case 't': case 'T': {
        e.preventDefault();
        const cur = document.documentElement.getAttribute('data-theme');
        applyTheme(THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length], true);
        break;
      }
      case '?': e.preventDefault(); toggleKeys(); break;
      case 'Escape': toggleKeys(false); break;
      case 'ArrowRight': e.preventDefault(); cycleSelect(shape3dSel, shapeOptions, 1, 'shape3d', t('shape')); break;
      case 'ArrowLeft':  e.preventDefault(); cycleSelect(shape3dSel, shapeOptions, -1, 'shape3d', t('shape')); break;
      case 'ArrowUp':    e.preventDefault(); cycleSelect(mode2dSel, mode2dOptions, 1, 'mode2d', t('mode2d')); break;
      case 'ArrowDown':  e.preventDefault(); cycleSelect(mode2dSel, mode2dOptions, -1, 'mode2d', t('mode2d')); break;
    }
  });

  // Pointer: drag to rotate the 3D shape, tap to spawn a particle burst
  function spawnBurst(clientX, clientY) {
    const rb = wrap.getBoundingClientRect();
    const x = clientX - rb.left, y = clientY - rb.top;
    const cols = [hexToRgb(col1.value), hexToRgb(col2.value), hexToRgb(col3.value)];
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
      const sp = 1.5 + Math.random() * 4;
      bursts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, size: 1.5 + Math.random() * 3, col: cols[Math.floor(Math.random() * cols.length)] });
    }
    if (bursts.length > 600) bursts.splice(0, bursts.length - 600);
  }
  wrap.addEventListener('pointerdown', e => {
    if (e.target.closest('#panel, #bottom-bar, #intro, #credit')) return;
    dragState.active = true; dragState.lastX = e.clientX; dragState.lastY = e.clientY; dragState.moved = 0;
    try { wrap.setPointerCapture(e.pointerId); } catch (e2) {}
  });
  wrap.addEventListener('pointermove', e => {
    if (!dragState.active) return;
    const dx = e.clientX - dragState.lastX, dy = e.clientY - dragState.lastY;
    dragState.lastX = e.clientX; dragState.lastY = e.clientY;
    dragState.moved += Math.abs(dx) + Math.abs(dy);
    if (solidMesh && layerSel.value !== '2d-only') {
      solidMesh.rotation.y += dx * 0.006;
      solidMesh.rotation.x += dy * 0.006;
      persistRot.x = solidMesh.rotation.x; persistRot.y = solidMesh.rotation.y;
      userSpin.vy += dx * 0.0004; userSpin.vx += dy * 0.0004;
    }
  });
  wrap.addEventListener('pointerup', e => {
    if (!dragState.active) return;
    dragState.active = false;
    if (dragState.moved < 6) spawnBurst(e.clientX, e.clientY);
  });

  // Web MIDI: knobs auto-bind to sliders on first wiggle (plug-and-play)
  const midiBtn = document.getElementById('btn-midi');
  const midiStatus = document.getElementById('midi-status');
  let midiOn = false;
  const midiMap = new Map();
  const midiTargets = ['sens','beat','distort','speed','smooth','glow','trail','opacity2d','volume','zoom','zoom2d','vj-speed','hue-speed','bloom','glitch'];
  function setControl(id, value) {
    const el = document.getElementById(id); if (!el) return;
    el.value = value;
    el.dispatchEvent(new Event('input'));
  }
  function handleMidi(msg) {
    const d = msg.data; if (!d || d.length < 3) return;
    if ((d[0] & 0xf0) !== 0xb0) return; // control-change only
    const cc = d[1], val = d[2];
    let id = midiMap.get(cc);
    if (!id) {
      const used = new Set(midiMap.values());
      id = midiTargets.find(t => !used.has(t)) || midiTargets[midiMap.size % midiTargets.length];
      midiMap.set(cc, id);
      toast('MIDI CC ' + cc + ' → ' + id);
    }
    const el = document.getElementById(id); if (!el) return;
    const min = +el.min || 0, max = +el.max || 100;
    setControl(id, Math.round(min + (val / 127) * (max - min)));
  }
  async function enableMidi() {
    if (midiOn) return;
    if (!navigator.requestMIDIAccess) { midiStatus.textContent = t('midiNa'); toast(t('midiNo')); return; }
    try {
      const access = await navigator.requestMIDIAccess();
      midiOn = true;
      midiBtn.textContent = L().midiOn; midiBtn.classList.add('on');
      const bind = () => {
        let count = 0;
        access.inputs.forEach(inp => { inp.onmidimessage = handleMidi; count++; });
        midiStatus.textContent = count ? count + ' ' + t('midiDev') : t('midiNoDev');
      };
      bind();
      access.onstatechange = bind;
    } catch (e) { midiStatus.textContent = t('midiErr'); toast(t('midiDenied')); }
  }
  midiBtn.addEventListener('click', enableMidi);

  // Reset to defaults — capture every panel control's initial value now, before any change
  const controlDefaults = {};
  document.querySelectorAll('#panel input, #panel select').forEach(el => {
    if (!el.id) return;
    controlDefaults[el.id] = (el.type === 'checkbox') ? el.checked : el.value;
  });
  function resetDefaults() {
    Object.keys(controlDefaults).forEach(id => {
      const el = document.getElementById(id); if (!el) return;
      if (el.type === 'checkbox') el.checked = controlDefaults[id];
      else el.value = controlDefaults[id];
      const out = document.getElementById(id + '-val'); if (out) out.textContent = controlDefaults[id];
    });
    Object.keys(manualOverrideUntil).forEach(k => delete manualOverrideUntil[k]);
    applyVolume(); applyZoom();
    logicW = 0; logicH = 0; fit();
    toast(t('reset'));
  }
  document.getElementById('btn-reset').addEventListener('click', resetDefaults);

  // Drag and drop
  window.addEventListener('dragover', e => { e.preventDefault(); });
  window.addEventListener('drop', e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (/\.(obj|stl|glb|gltf)$/i.test(f.name)) loadModelFile(f);
    else if (f.type.startsWith('audio/')) startFile(f);
  });

  // ===== TEMPO =====
  // The kick detector fires on individual hits, which is enough to flash a lamp
  // but not enough to be musical: changes land wherever the last kick happened
  // to fall. Reading a period out of the gaps between hits gives a free-running
  // clock that carries the pulse through breakdowns and dropped kicks, and — more
  // usefully — gives us bars, so a change can land on a downbeat.
  const BEATS_PER_BAR = 4, BARS_PER_PHRASE = 4;
  const tempo = {
    hits: [],      // recent detected-beat timestamps, seconds
    bpm: 0,        // 0 while unlocked
    conf: 0,       // share of gaps that agree with the estimate
    period: 0,
    nextAt: 0,     // when the clock's next beat is due
    beat: 0,       // beats since the clock last anchored
    tick: false,   // a clock beat happened this frame
    bar: false,    // ... and it opened a bar
    phrase: false, // ... and it opened a four-bar phrase
    taps: [],
    tapped: 0      // tapped BPM; overrides the estimate while non-zero
  };
  const TEMPO_LOCK = 0.35;   // below this the clock stays out of the way

  function estimateTempo() {
    // Gaps outside 30–240 BPM are not a pulse anyone is dancing to.
    const gaps = [];
    for (let i = 1; i < tempo.hits.length; i++) {
      const g = tempo.hits[i] - tempo.hits[i - 1];
      if (g >= 0.25 && g <= 2.0) gaps.push(g);
    }
    if (gaps.length < 4) return;
    const sorted = gaps.slice().sort((a, b) => a - b);
    let period = sorted[sorted.length >> 1];
    // A missed kick doubles a gap and a ghost hit halves it, so fold the median
    // into one octave (70–176 BPM) before trusting it.
    while (period < 0.34) period *= 2;
    while (period > 0.86) period /= 2;
    // Then let every gap that is a near-whole multiple of that period vote, so
    // half-time hits and dropped kicks refine the estimate instead of wrecking
    // it. A gap four beats long is much weaker evidence than a gap of one — with
    // flat weights, random hits clear the bar about two thirds of the time,
    // because near-multiples of *something* cover most of the legal gap range.
    // Weighting by 1/mult, and tightening the window, keeps noise unlocked.
    let sum = 0, votes = 0, weight = 0;
    for (const g of gaps) {
      const mult = Math.round(g / period);
      if (mult < 1 || mult > 4) continue;
      if (Math.abs(g / mult - period) / period > 0.09) continue;
      sum += g / mult; votes++; weight += 1 / mult;
    }
    if (votes < 3) { tempo.conf *= 0.9; return; }
    tempo.period = sum / votes;
    tempo.conf = weight / gaps.length;
    tempo.bpm = Math.round(60 / tempo.period);
  }

  function updateTempo(now, dt, hit) {
    if (hit) {
      tempo.hits.push(now);
      if (tempo.hits.length > 24) tempo.hits.shift();
      while (tempo.hits.length && now - tempo.hits[0] > 12) tempo.hits.shift();
      estimateTempo();
    } else if (tempo.hits.length && now - tempo.hits[tempo.hits.length - 1] > 4) {
      // Four seconds of nothing: let the lock decay rather than keep asserting a
      // tempo that stopped being true.
      tempo.conf *= Math.pow(0.5, dt);
      if (tempo.conf < 0.15) { tempo.bpm = 0; tempo.period = 0; tempo.hits.length = 0; }
    }
    if (tempo.tapped > 0) {
      tempo.bpm = tempo.tapped; tempo.period = 60 / tempo.tapped; tempo.conf = 1;
    }

    tempo.tick = tempo.bar = tempo.phrase = false;
    if (!tempo.period || tempo.conf < TEMPO_LOCK) { tempo.nextAt = 0; return; }
    if (!tempo.nextAt) { tempo.nextAt = now + tempo.period; tempo.beat = 0; }

    // Phase-lock softly, so the clock follows a drifting set without lurching on
    // one false positive. Only a hit far off the grid is allowed to re-anchor.
    if (hit && !tempo.tapped) {
      let err = now - (tempo.nextAt - tempo.period);   // how late this hit landed
      if (err > tempo.period / 2) err -= tempo.period; // ... or how early
      if (Math.abs(err) > tempo.period * 0.35) { tempo.nextAt = now + tempo.period; tempo.beat = 0; }
      else tempo.nextAt += err * 0.12;
    }

    if (now >= tempo.nextAt) {
      tempo.nextAt += tempo.period;
      if (now >= tempo.nextAt) tempo.nextAt = now + tempo.period;   // after a stall
      tempo.beat++;
      tempo.tick = true;
      tempo.bar = (tempo.beat % BEATS_PER_BAR) === 0;
      tempo.phrase = (tempo.beat % (BEATS_PER_BAR * BARS_PER_PHRASE)) === 0;
    }
  }

  // One tap can't imply a tempo, so the first tap after a pause is spent
  // releasing back to automatic — which also makes the manual lock escapable.
  function tapTempo() {
    const now = performance.now() / 1000;
    if (tempo.taps.length && now - tempo.taps[tempo.taps.length - 1] > 2.2) tempo.taps.length = 0;
    if (!tempo.taps.length && tempo.tapped) {
      tempo.tapped = 0; tempo.conf = 0; tempo.bpm = 0; tempo.period = 0; tempo.nextAt = 0;
      toast(t('tempoAuto'));
      return;
    }
    tempo.taps.push(now);
    if (tempo.taps.length > 8) tempo.taps.shift();
    if (tempo.taps.length < 2) return;
    const span = tempo.taps[tempo.taps.length - 1] - tempo.taps[0];
    const bpm = Math.round(60 / (span / (tempo.taps.length - 1)));
    if (bpm < 40 || bpm > 260) return;
    tempo.tapped = bpm;
    tempo.period = 60 / bpm; tempo.bpm = bpm; tempo.conf = 1;
    tempo.nextAt = now + tempo.period; tempo.beat = 0;   // this tap is the downbeat
    toast(t('tempoTap') + ': ' + bpm + ' ' + t('bpm'));
  }
  document.getElementById('btn-tap').addEventListener('click', tapTempo);

  // Two readouts of one number: the panel row, and a stage tag that survives
  // the panel being shut — the only place tempo is visible mid-performance.
  let bpmShown = -1, bpmClass = '';
  function paintTempo() {
    const locked = tempo.bpm > 0 && tempo.conf >= TEMPO_LOCK;
    const cls = !locked ? 'idle' : (tempo.tapped ? 'tapped' : '');
    if (tempo.bpm !== bpmShown || cls !== bpmClass) {
      bpmShown = tempo.bpm; bpmClass = cls;
      const text = locked ? tempo.bpm + ' ' + t('bpm') : '— ' + t('bpm');
      bpmTag.textContent = text;
      bpmTag.className = cls;
      tempoVal.textContent = locked ? String(tempo.bpm) : '—';
    }
  }

  // ===== AUTO-VJ =====
  let vjActive = false;
  const vjState = {
    col1: [0,212,255], col2: [168,85,247], col3: [255,0,110], bg: [5,6,10],
    tCol1: [0,212,255], tCol2: [168,85,247], tCol3: [255,0,110], tBg: [5,6,10],
    distort: 1.0, tDistort: 1.0, speed: 1.0, tSpeed: 1.0,
    opacity2d: 0.8, tOpacity2d: 0.8, glow: 28, tGlow: 28, trail: 0.86, tTrail: 0.86,
    shape3d: 'sphere', mode2d: 'ribbon', symmetry: 1, layer: 'auto',
    beatsSinceShapeChange: 0, beatsSinceModeChange: 0, beatsSinceSymChange: 0,
    beatsSinceLayerChange: 0, beatsSincePalette: 0, timeSinceTarget: 0,
    // A change that is due but waiting for a musical boundary to land on.
    wantShape: false, wantMode: false, wantSym: false, wantLayer: false,
    wantPalette: false, wantTarget: false
  };
  function hexToRgb(h) { const m = h.replace('#',''); return [parseInt(m.substr(0,2),16),parseInt(m.substr(2,2),16),parseInt(m.substr(4,2),16)]; }
  function rgbToHex(c) { return '#' + [c[0],c[1],c[2]].map(v => { const x = Math.max(0, Math.min(255, Math.round(v))).toString(16); return x.length < 2 ? '0' + x : x; }).join(''); }
  function hsl2rgb(h, s, l) {
    function f(n) { const k = (n + h * 12) % 12; const a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(Math.min(k - 3, 9 - k), 1)); }
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
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
  const shapeOptions = ['sphere','cube','icosa','torus','wire','diamond','susan','discoman','danceman','blocks'];
  const mode2dOptions = ['ribbon','wave','orb','nebula','particles','mountains','tunnel','spectrum','eq','radial','scope','waterfall','grid','rings','stars','cosmos','ripples','corona','plasma','fireworks','drain','emdr'];
  // 6- and 8-fold read as busy at projection distance, so nothing that picks
  // for you — Auto-VJ or the randomize key — reaches for them. Both are still
  // in the dropdowns when you want them.
  const symOptions = [1,1,1,2,3,4];
  const layerOptions = ['auto','auto','both','2d-only'];

  function setVj(on) {
    vjActive = on;
    const btn = document.getElementById('btn-vj');
    btn.textContent = on ? L().vjOn : L().vjOff;
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
      vjState.timeSinceShape = 0; vjState.timeSinceMode = 0;
      vjState.timeSinceSym = 0; vjState.timeSinceLayer = 0; vjState.timeSincePaletteCh = 0;
      vjState.beatsSinceShapeChange = 0; vjState.beatsSinceModeChange = 0;
      vjState.beatsSinceSymChange = 0; vjState.beatsSinceLayerChange = 0;
      vjState.beatsSincePalette = 0;
      vjState.wantShape = vjState.wantMode = vjState.wantSym = false;
      vjState.wantLayer = vjState.wantPalette = vjState.wantTarget = false;
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
    // With a tempo lock, a change that comes due waits for the next downbeat —
    // and the biggest change, the layer flip, waits for a whole phrase. That is
    // the difference between a set that switches on the music and one that
    // switches near it. Unlocked, or with bar sync off, both gates are open and
    // this behaves exactly as it did before.
    const synced = vjSyncEl.checked && tempo.period > 0 && tempo.conf >= TEMPO_LOCK;
    const onBar = !synced || tempo.bar;
    const onPhrase = !synced || tempo.phrase;

    vjState.timeSinceTarget += dt;
    if (vjState.timeSinceTarget > 8 / Math.max(0.3, vjRate)) vjState.wantTarget = true;
    if (vjState.wantTarget && onBar) {
      pickNewPalette(); pickNewParams();
      vjState.wantTarget = false; vjState.timeSinceTarget = 0;
    }
    if (beatTriggered) {
      vjState.beatsSinceShapeChange++; vjState.beatsSinceModeChange++;
      vjState.beatsSinceSymChange++; vjState.beatsSinceLayerChange++;
      vjState.beatsSincePalette++;
    }
    vjState.timeSinceShape = (vjState.timeSinceShape || 0) + dt;
    vjState.timeSinceMode = (vjState.timeSinceMode || 0) + dt;
    vjState.timeSinceSym = (vjState.timeSinceSym || 0) + dt;
    vjState.timeSinceLayer = (vjState.timeSinceLayer || 0) + dt;
    vjState.timeSincePaletteCh = (vjState.timeSincePaletteCh || 0) + dt;
    const shapeEvery = Math.max(8, Math.floor(20 / vjRate));
    const modeEvery = Math.max(6, Math.floor(14 / vjRate));
    const symEvery = Math.max(8, Math.floor(18 / vjRate));
    const layerEvery = Math.max(12, Math.floor(28 / vjRate));
    const paletteEvery = Math.max(10, Math.floor(24 / vjRate));
    const shapeT = 14 / Math.max(0.3, vjRate);
    const modeT = 10 / Math.max(0.3, vjRate);
    const symT = 12 / Math.max(0.3, vjRate);
    const layerT = 18 / Math.max(0.3, vjRate);
    const paletteT = 16 / Math.max(0.3, vjRate);
    if (vjState.beatsSinceShapeChange >= shapeEvery || vjState.timeSinceShape >= shapeT) vjState.wantShape = true;
    if (vjState.wantShape && onBar) {
      vjState.shape3d = pick(shapeOptions.filter(s => s !== vjState.shape3d));
      vjState.wantShape = false;
      vjState.beatsSinceShapeChange = 0; vjState.timeSinceShape = 0;
    }
    if (vjState.beatsSinceModeChange >= modeEvery || vjState.timeSinceMode >= modeT) vjState.wantMode = true;
    if (vjState.wantMode && onBar) {
      vjState.mode2d = pick(mode2dOptions.filter(m => m !== vjState.mode2d));
      vjState.wantMode = false;
      vjState.beatsSinceModeChange = 0; vjState.timeSinceMode = 0;
    }
    if (vjState.beatsSinceSymChange >= symEvery || vjState.timeSinceSym >= symT) vjState.wantSym = true;
    if (vjState.wantSym && onBar) {
      vjState.symmetry = pick(symOptions);
      vjState.wantSym = false;
      vjState.beatsSinceSymChange = 0; vjState.timeSinceSym = 0;
    }
    if (vjState.beatsSinceLayerChange >= layerEvery || vjState.timeSinceLayer >= layerT) vjState.wantLayer = true;
    if (vjState.wantLayer && onPhrase) {
      vjState.layer = pick(layerOptions);
      vjState.wantLayer = false;
      vjState.beatsSinceLayerChange = 0; vjState.timeSinceLayer = 0;
    }
    if (vjState.beatsSincePalette >= paletteEvery || vjState.timeSincePaletteCh >= paletteT) vjState.wantPalette = true;
    if (vjState.wantPalette && onBar) {
      pickNewPalette();
      vjState.wantPalette = false;
      vjState.beatsSincePalette = 0; vjState.timeSincePaletteCh = 0;
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
    if (!isLockedByUser('symmetry3d')) sym3dSel.value = String(vjState.symmetry);
    if (!isLockedByUser('layer-mode')) layerSel.value = vjState.layer;
    presetSel.value = 'custom';
  }

  // ===== THREE =====
  let renderer = null, scene = null, camera = null, solidMesh = null, wireMesh = null;
  let currentShape = null, geomData = {}, threeReady = false;
  const persistRot = { x: 0, y: 0 };

  // Wrap any THREE geometry into a displaceable part (optional rotation, then scale + translate)
  function primPart(geom, sx, sy, sz, tx, ty, tz, rx, ry, rz) {
    if (rx) geom.rotateX(rx);
    if (ry) geom.rotateY(ry);
    if (rz) geom.rotateZ(rz);
    geom.scale(sx, sy, sz);
    geom.translate(tx, ty, tz);
    const f = geom.toNonIndexed(); geom.dispose();
    f.computeVertexNormals();
    return f;
  }
  function mergeParts(parts) {
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

  function makeDiamondGeom() {
    return mergeParts([ primPart(new THREE.OctahedronGeometry(1.15, 2), 1, 1.35, 1, 0, 0, 0) ]);
  }

  // Bundled models arrive pre-triangulated and pre-normalised as quantised
  // int16, so there is nothing to parse at startup — just widen back to float.
  function decodeBundled(m) {
    const bin = atob(m.data), n = bin.length / 2;
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let v = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
      if (v > 32767) v -= 65536;
      out[i] = v / 32767 * m.span;
    }
    return out;
  }

  function makeGeom(key) {
    const bundled = window.BUNDLED_MODELS && window.BUNDLED_MODELS[key];
    if (bundled) return geomFromFrames([decodeBundled(bundled)]);
    const compound = { diamond: makeDiamondGeom };
    if (compound[key]) {
      const flat = compound[key]();
      return { geom: flat, basePos: new Float32Array(flat.attributes.position.array), baseNorm: new Float32Array(flat.attributes.normal.array) };
    }
    let g;
    if (key === 'sphere') g = new THREE.IcosahedronGeometry(1, 12);
    else if (key === 'icosa') g = new THREE.IcosahedronGeometry(1.1, 3);
    else if (key === 'torus') g = new THREE.TorusKnotGeometry(0.8, 0.28, 128, 20);
    // segmented so the noise displacement has vertices to actually push around;
    // a 6-quad cube would just wobble as a rigid box
    else if (key === 'cube') g = new THREE.BoxGeometry(1.55, 1.55, 1.55, 8, 8, 8);
    else g = new THREE.IcosahedronGeometry(1.1, 5);
    const flat = g.toNonIndexed(); g.dispose();
    flat.computeVertexNormals();
    return { geom: flat, basePos: new Float32Array(flat.attributes.position.array), baseNorm: new Float32Array(flat.attributes.normal.array) };
  }

  // ===== USER MODELS =====
  // No loader library ships with this page, so OBJ and STL are parsed here.
  // Only positions are read — normals get recomputed every frame by displace()
  // anyway, and materials/UVs are unused.
  //
  // The ceiling is CPU, not GPU: displace() runs three 3D-noise lookups per
  // vertex per frame, so a 500k-triangle download would stall the loop long
  // before the renderer noticed. Anything heavier gets thinned on the way in.
  const MAX_TRIS = 40000;

  function parseOBJ(text) {
    const verts = [], tris = [];
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (line.startsWith('v ')) {
        const p = line.split(/\s+/);
        verts.push([+p[1], +p[2], +p[3]]);
      } else if (line.startsWith('f ')) {
        const idx = line.split(/\s+/).slice(1).map(tok => {
          const i = parseInt(tok.split('/')[0], 10);
          return i < 0 ? verts.length + i : i - 1;   // OBJ allows negative refs
        });
        // fan-triangulate quads and n-gons
        for (let k = 1; k + 1 < idx.length; k++) {
          const a = verts[idx[0]], b = verts[idx[k]], c = verts[idx[k + 1]];
          if (a && b && c) tris.push(a, b, c);
        }
      }
    }
    return tris;
  }

  function parseSTL(buf) {
    const dv = new DataView(buf);
    // Binary STL declares its triangle count at byte 80; if that count exactly
    // predicts the file length it is binary, whatever the header claims.
    if (buf.byteLength > 84) {
      const n = dv.getUint32(80, true);
      if (84 + n * 50 === buf.byteLength) {
        const tris = [];
        let o = 84;
        for (let i = 0; i < n; i++) {
          o += 12;                                   // skip the stored normal
          for (let v = 0; v < 3; v++) {
            tris.push([dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)]);
            o += 12;
          }
          o += 2;                                    // attribute byte count
        }
        return tris;
      }
    }
    const text = new TextDecoder().decode(buf);
    const tris = [];
    const re = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
    let m;
    while ((m = re.exec(text))) tris.push([+m[1], +m[2], +m[3]]);
    return tris;
  }

  // glTF 2.0. three r150 dropped the non-module GLTFLoader, so rather than
  // couple this page to a specific loader build we read the container directly:
  // .glb, and .gltf whose buffers are embedded as data URIs. Only POSITION and
  // indices are touched, with node transforms baked in so multi-part models
  // arrive assembled rather than piled at the origin.
  function b64ToBuf(uri) {
    const bin = atob(uri.slice(uri.indexOf(',') + 1));
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8.buffer;
  }
  function parseGLTF(buf) {
    let json = null, bin = null;
    const dv = new DataView(buf);
    if (buf.byteLength > 12 && dv.getUint32(0, true) === 0x46546C67) {   // 'glTF'
      let o = 12;
      while (o + 8 <= buf.byteLength) {
        const len = dv.getUint32(o, true), type = dv.getUint32(o + 4, true);
        const data = buf.slice(o + 8, o + 8 + len);
        if (type === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(data));
        else if (type === 0x004E4942) bin = data;
        o += 8 + len + ((4 - (len % 4)) % 4);          // chunks are 4-byte aligned
      }
    } else {
      json = JSON.parse(new TextDecoder().decode(buf));
    }
    if (!json) throw new Error('no glTF JSON chunk');
    // Compressed geometry needs a decoder this page deliberately does not ship.
    const req = json.extensionsRequired || [];
    if (req.length) { const e = new Error('ext'); e.exts = req.join(', '); throw e; }

    const buffers = (json.buffers || []).map(b => {
      if (!b.uri) return bin;
      if (/^data:/.test(b.uri)) return b64ToBuf(b.uri);
      const e = new Error('external'); e.uri = b.uri; throw e;
    });
    const CSIZE = { 5120:1, 5121:1, 5122:2, 5123:2, 5125:4, 5126:4 };
    const NCOMP = { SCALAR:1, VEC2:2, VEC3:3, VEC4:4, MAT4:16 };
    function readAccessor(ai) {
      const acc = json.accessors[ai];
      const bv = json.bufferViews[acc.bufferView];
      const src = buffers[bv.buffer || 0];
      if (!src) throw new Error('missing buffer');
      const cs = CSIZE[acc.componentType], nc = NCOMP[acc.type];
      const base = (bv.byteOffset || 0) + (acc.byteOffset || 0);
      const stride = bv.byteStride || cs * nc;
      const d = new DataView(src);
      const out = new Float32Array(acc.count * nc);
      for (let i = 0; i < acc.count; i++) {
        for (let c = 0; c < nc; c++) {
          const off = base + i * stride + c * cs;
          let v;
          switch (acc.componentType) {
            case 5126: v = d.getFloat32(off, true); break;
            case 5125: v = d.getUint32(off, true); break;
            case 5123: v = d.getUint16(off, true); break;
            case 5121: v = d.getUint8(off); break;
            case 5122: v = d.getInt16(off, true); break;
            default:   v = d.getInt8(off);
          }
          out[i * nc + c] = v;
        }
      }
      return out;
    }
    const tris = [];
    const tmp = new THREE.Vector3();
    function visit(ni, parent) {
      const n = json.nodes[ni];
      if (!n) return;
      const local = new THREE.Matrix4();
      if (n.matrix) local.fromArray(n.matrix);
      else local.compose(
        new THREE.Vector3().fromArray(n.translation || [0, 0, 0]),
        new THREE.Quaternion().fromArray(n.rotation || [0, 0, 0, 1]),
        new THREE.Vector3().fromArray(n.scale || [1, 1, 1]));
      const world = new THREE.Matrix4().multiplyMatrices(parent, local);
      if (n.mesh !== undefined && json.meshes[n.mesh]) {
        for (const prim of json.meshes[n.mesh].primitives || []) {
          if (prim.mode !== undefined && prim.mode !== 4) continue;   // triangles only
          if (!prim.attributes || prim.attributes.POSITION === undefined) continue;
          const pos = readAccessor(prim.attributes.POSITION);
          const idx = prim.indices !== undefined ? readAccessor(prim.indices) : null;
          const count = idx ? idx.length : pos.length / 3;
          for (let i = 0; i < count; i++) {
            const p = idx ? idx[i] : i;
            tmp.set(pos[p * 3], pos[p * 3 + 1], pos[p * 3 + 2]).applyMatrix4(world);
            tris.push([tmp.x, tmp.y, tmp.z]);
          }
        }
      }
      (n.children || []).forEach(c => visit(c, world));
    }
    const scene = json.scenes && json.scenes[json.scene || 0];
    const roots = (scene && scene.nodes) || (json.nodes || []).map((_, i) => i);
    const I = new THREE.Matrix4();
    roots.forEach(r => visit(r, I));
    return tris;
  }

  // Centre on the origin and scale to the same bounding size as the built-in
  // shapes, so an uploaded model drops into the existing camera and morph.
  //
  // Takes a LIST of frames. A one-frame list is a static model; more than one
  // is a baked vertex animation. Every frame must share one thinning stride and
  // one centre/scale transform — computed across the whole sequence — or the
  // model would jump and rescale on every frame as its bounding box breathed.
  function buildFrames(frameTris) {
    const n0 = frameTris[0].length;
    for (const f of frameTris) {
      if (f.length !== n0) { const e = new Error('framecount'); e.frames = true; throw e; }
    }
    let count = n0 / 3, thinned = false, stride = 1;
    if (count > MAX_TRIS) { stride = Math.ceil(count / MAX_TRIS); thinned = true; }
    if (stride > 1) {
      frameTris = frameTris.map(tris => {
        const kept = [];
        for (let i = 0; i < tris.length / 3; i += stride) kept.push(tris[i*3], tris[i*3+1], tris[i*3+2]);
        return kept;
      });
      count = frameTris[0].length / 3;
    }
    let miX=Infinity, miY=Infinity, miZ=Infinity, maX=-Infinity, maY=-Infinity, maZ=-Infinity;
    for (const tris of frameTris) for (const v of tris) {
      if (v[0]<miX) miX=v[0]; if (v[0]>maX) maX=v[0];
      if (v[1]<miY) miY=v[1]; if (v[1]>maY) maY=v[1];
      if (v[2]<miZ) miZ=v[2]; if (v[2]>maZ) maZ=v[2];
    }
    const cx=(miX+maX)/2, cy=(miY+maY)/2, cz=(miZ+maZ)/2;
    const span = Math.max(maX-miX, maY-miY, maZ-miZ) || 1;
    const sc = 2.1 / span;
    const frames = frameTris.map(tris => {
      const pos = new Float32Array(tris.length * 3);
      for (let i = 0; i < tris.length; i++) {
        pos[i*3]   = (tris[i][0] - cx) * sc;
        pos[i*3+1] = (tris[i][1] - cy) * sc;
        pos[i*3+2] = (tris[i][2] - cz) * sc;
      }
      return pos;
    });
    return { frames, tris: count, thinned };
  }

  // Non-indexed geometry shares no vertices between triangles, so the face
  // normal IS the vertex normal — no averaging pass needed.
  function faceNormalsInto(pos, out) {
    for (let i = 0; i < pos.length; i += 9) {
      const ax=pos[i],   ay=pos[i+1], az=pos[i+2];
      const ux=pos[i+3]-ax, uy=pos[i+4]-ay, uz=pos[i+5]-az;
      const vx=pos[i+6]-ax, vy=pos[i+7]-ay, vz=pos[i+8]-az;
      let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
      const l = Math.sqrt(nx*nx+ny*ny+nz*nz) || 1;
      nx/=l; ny/=l; nz/=l;
      for (let k = 0; k < 3; k++) { out[i+k*3]=nx; out[i+k*3+1]=ny; out[i+k*3+2]=nz; }
    }
  }

  // Walk the sequence and write the interpolated pose into basePos, which is
  // what displace() then pushes around. Normals are only rebuilt when the
  // integer frame changes: at 24fps against a 60fps loop that is ~2.5x less
  // work than doing it every render frame, and the difference is invisible.
  function advanceAnim(gd, dt) {
    const n = gd.frames.length;
    if (n < 2) return;
    gd.t = (gd.t || 0) + dt * gd.fps * (+animEl.value / 100);
    if (!isFinite(gd.t)) gd.t = 0;
    const base = Math.floor(gd.t), f = gd.t - base;
    const a = gd.frames[((base % n) + n) % n];
    const b = gd.frames[((base + 1) % n + n) % n];
    const out = gd.basePos;
    for (let i = 0; i < out.length; i++) out[i] = a[i] + (b[i] - a[i]) * f;
    const fi = ((base % n) + n) % n;
    if (gd.lastFi !== fi) { faceNormalsInto(out, gd.baseNorm); gd.lastFi = fi; }
  }

  // Uploaded models outlive the tab. What gets stored is the *normalised*
  // position buffer, not the source file: it is smaller, and restoring costs
  // nothing because the parse, thin, centre and scale already happened.
  const MODEL_DB = 'vizModels', MODEL_STORE = 'models';
  function withStore(mode, fn) {
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('no idb'));
      const rq = indexedDB.open(MODEL_DB, 1);
      rq.onupgradeneeded = () => {
        const db = rq.result;
        if (!db.objectStoreNames.contains(MODEL_STORE)) db.createObjectStore(MODEL_STORE, { keyPath: 'id' });
      };
      rq.onerror = () => rej(rq.error);
      rq.onsuccess = () => {
        const db = rq.result;
        const tx = db.transaction(MODEL_STORE, mode);
        const req = fn(tx.objectStore(MODEL_STORE));
        tx.oncomplete = () => res(req && 'result' in req ? req.result : undefined);
        tx.onerror = () => rej(tx.error);
      };
    });
  }

  function geomFromFrames(frames, fps) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(frames[0]), 3));
    g.computeVertexNormals();
    const gd = {
      geom: g,
      basePos: new Float32Array(frames[0]),
      baseNorm: new Float32Array(g.attributes.normal.array),
      tris: frames[0].length / 9
    };
    if (frames.length > 1) { gd.frames = frames; gd.fps = fps || 24; gd.t = 0; gd.lastFi = -1; }
    return gd;
  }

  function registerModel(id, name, frames, fps) {
    geomData[id] = geomFromFrames(frames, fps);
    if (shapeOptions.indexOf(id) === -1) shapeOptions.push(id);   // joins Auto-VJ + arrow cycling
    let grp = document.getElementById('shape-mine');
    if (!grp) {
      grp = document.createElement('optgroup');
      grp.id = 'shape-mine';
      grp.dataset.key = 'Mine';
      grp.label = (L().grp && L().grp.Mine) || 'Mine';
      shape3dSel.appendChild(grp);
    }
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = frames.length > 1 ? name + ' \u25b8 ' + frames.length : name;
    grp.appendChild(opt);
    return geomData[id];
  }

  function addUserModel(name, frameTris, fps) {
    if (!frameTris.length || !frameTris[0].length || frameTris[0].length % 3 !== 0) { toast(t('modelBad')); return; }
    let built;
    try { built = buildFrames(frameTris); }
    catch (err) { toast(err.frames ? t('modelFrames') : t('modelBad')); return; }
    const id = 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    registerModel(id, name, built.frames, fps);
    shape3dSel.value = id;
    markManual('shape3d');
    updateModelButtons();
    toast(name + ' \u00b7 ' + built.tris.toLocaleString() + ' ' + t('tris') +
          (built.frames.length > 1 ? ' \u00b7 ' + built.frames.length + ' ' + t('framesWord') : '') +
          (built.thinned ? ' ' + t('thinned') : ''));
    withStore('readwrite', st => st.put({ id, name, frames: built.frames, fps: fps || 24 }))
      .catch(err => console.warn('Model not persisted:', err));
  }

  function deleteCurrentModel() {
    const id = shape3dSel.value;
    if (!/^user_/.test(id)) return;
    const opt = shape3dSel.querySelector('option[value="' + id + '"]');
    const name = opt ? opt.textContent : id;
    if (opt) opt.remove();
    const grp = document.getElementById('shape-mine');
    if (grp && !grp.children.length) grp.remove();
    delete geomData[id];
    const i = shapeOptions.indexOf(id);
    if (i !== -1) shapeOptions.splice(i, 1);
    shape3dSel.value = 'sphere';
    markManual('shape3d');
    updateModelButtons();
    toast(t('modelGone') + ': ' + name);
    withStore('readwrite', st => st.delete(id)).catch(() => {});
  }

  function updateModelButtons() {
    const del = document.getElementById('btn-model-del');
    if (del) del.style.display = /^user_/.test(shape3dSel.value) ? '' : 'none';
  }

  function parseModelBuffer(name, buf) {
    const ext = (name.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase();
    if (ext === 'stl') return parseSTL(buf);
    if (ext === 'glb' || ext === 'gltf') return parseGLTF(buf);
    return parseOBJ(new TextDecoder().decode(buf));
  }
  function readFile(f) {
    return new Promise((res, rej) => {
      const rd = new FileReader();
      rd.onload = () => res(rd.result);
      rd.onerror = () => rej(rd.error);
      rd.readAsArrayBuffer(f);
    });
  }

  // A baked animation arrives as many files that differ only by a trailing
  // frame number (Blender writes dance_000001.obj, dance_000002.obj ...), so
  // files are grouped by their name with those digits stripped. One file per
  // group is an ordinary static model; several become a loop.
  function groupSequences(files) {
    const groups = new Map();
    for (const f of files) {
      const base = f.name.replace(/\.[^.]+$/, '');
      const stem = base.replace(/[._-]?\d+$/, '') || base;
      if (!groups.has(stem)) groups.set(stem, []);
      groups.get(stem).push(f);
    }
    for (const [, list] of groups) {
      list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }
    return groups;
  }

  const MAX_FRAMES = 240;
  async function loadModelFiles(files) {
    for (const [stem, list] of groupSequences(files)) {
      try {
        let use = list;
        if (use.length > MAX_FRAMES) {
          const step = Math.ceil(use.length / MAX_FRAMES);
          use = use.filter((_, i) => i % step === 0);
        }
        const frames = [];
        for (const f of use) frames.push(parseModelBuffer(f.name, await readFile(f)));
        addUserModel(stem, frames, 24);
      } catch (err) {
        console.error('Model load failed:', err);
        if (err.exts) toast(t('modelCompressed') + ': ' + err.exts);
        else if (err.uri) toast(t('modelExternal'));
        else if (err.frames) toast(t('modelFrames'));
        else toast(t('modelBad'));
      }
    }
  }
  function loadModelFile(f) { loadModelFiles([f]); }

  document.getElementById('btn-model').addEventListener('click',
    () => document.getElementById('model-input').click());
  document.getElementById('btn-model-del').addEventListener('click', deleteCurrentModel);
  document.getElementById('model-input').addEventListener('change', e => {
    loadModelFiles([...e.target.files]);
    e.target.value = '';
  });
  shape3dSel.addEventListener('change', updateModelButtons);

  // Bring back whatever this browser saved last time.
  withStore('readonly', st => st.getAll()).then(rows => {
    (rows || []).forEach(r => {
      const frames = r.frames ? r.frames.map(f => new Float32Array(f)) : [new Float32Array(r.pos)];
      registerModel(r.id, r.name, frames, r.fps);
    });
    updateModelButtons();
  }).catch(() => updateModelButtons());

  function initThree() {
    renderer = new THREE.WebGLRenderer({
      canvas: c3d, antialias: true, alpha: false,
      premultipliedAlpha: false, powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const k = new THREE.DirectionalLight(0xffffff, 1.0); k.position.set(2, 3, 4); scene.add(k);
    const f = new THREE.DirectionalLight(0xaaccff, 0.5); f.position.set(-2, -1, 2); scene.add(f);
    const r = new THREE.DirectionalLight(0xffaaff, 0.8); r.position.set(0, 0, -3); scene.add(r);
    ['sphere','cube','icosa','torus','wire','diamond','susan','discoman','danceman','blocks'].forEach(k => { geomData[k] = makeGeom(k); });
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
    symDirty = true;                 // clones share this geometry, so rebuild them
    echoDirty = true;
  }

  // ── 3D kaleidoscope ────────────────────────────────────────────
  // The same Symmetry setting that folds the 2D layer folds this one: N-1 extra
  // copies of the mesh, each turned a further 1/N of a revolution about Y and
  // every other one mirrored. Geometry and materials are shared with the
  // original, so displace() still runs exactly once per frame no matter how
  // many copies are on screen — the cost is draw calls, not noise lookups.
  let symClones = [], symDirty = false, symCount = 1;

  function buildSymChildren() {
    symClones.forEach(g => {
      while (g.children.length) g.remove(g.children[0]);
      if (!solidMesh) return;
      g.add(new THREE.Mesh(solidMesh.geometry, solidMesh.material));
      if (wireMesh) g.add(new THREE.Mesh(wireMesh.geometry, wireMesh.material));
    });
    symDirty = false;
  }

  function updateSym3D(n) {
    const want = Math.max(0, n - 1);
    if (want !== symClones.length) {
      while (symClones.length > want) scene.remove(symClones.pop());
      while (symClones.length < want) { const g = new THREE.Group(); scene.add(g); symClones.push(g); }
      symDirty = true;
    }
    if (symDirty) buildSymChildren();
    if (!symClones.length) return;

    // A negative scale flips winding order, so mirrored copies would light from
    // the inside out unless both sides are drawn.
    const side = THREE.DoubleSide;
    if (solidMesh && solidMesh.material.side !== side) { solidMesh.material.side = side; solidMesh.material.needsUpdate = true; }
    if (wireMesh && wireMesh.material.side !== side) { wireMesh.material.side = side; wireMesh.material.needsUpdate = true; }

    // Distance pushes every copy out along its own spoke, turning the
    // interpenetrating mandala into a ring. The mirror flip lives on the child
    // rather than the group: a group-level scale.x of -1 would negate the
    // offset too and fold alternate copies back across the centre.
    const dist = (+symDistEl.value / 100) * 1.7;
    const step = (Math.PI * 2) / n;
    for (let i = 0; i < symClones.length; i++) {
      const g = symClones[i], k = i + 1;
      g.rotation.y = step * k;
      g.scale.set(1, 1, 1);
      for (let c = 0; c < g.children.length; c++) {
        const src = c === 0 ? solidMesh : wireMesh;
        if (!src) continue;
        const ch = g.children[c];
        ch.rotation.copy(src.rotation);
        ch.scale.copy(src.scale);
        if (k % 2) ch.scale.x = -ch.scale.x;
        ch.position.set(dist, 0, 0);
      }
    }
    // The original joins its own ring, or the arrangement sits lopsided.
    if (solidMesh) solidMesh.position.set(dist, 0, 0);
    if (wireMesh) wireMesh.position.set(dist, 0, 0);
  }

  // ── Echo ───────────────────────────────────────────────────────
  // The 2D layer has Trails; the 3D layer had nothing. These are ghost copies
  // of the mesh wearing its pose from N frames ago, so the shape smears through
  // its own rotation. They share the live geometry, which means each ghost
  // shows the CURRENT deformation at a PAST orientation — cheap, and it reads
  // as motion rather than as a stack of stale snapshots.
  const ECHO_N = 4;
  let echoMeshes = [], echoHist = [], echoDirty = false;

  function updateEcho(amt) {
    if (echoMeshes.length !== ECHO_N || echoDirty) {
      echoMeshes.forEach(m => { scene.remove(m); m.material.dispose(); });
      echoMeshes = [];
      if (solidMesh) {
        for (let i = 0; i < ECHO_N; i++) {
          const m = new THREE.Mesh(solidMesh.geometry, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.2,
            depthWrite: false, side: THREE.DoubleSide
          }));
          scene.add(m); echoMeshes.push(m);
        }
      }
      echoDirty = false;
    }
    if (!echoMeshes.length || !solidMesh) return;
    echoHist.unshift({ x: solidMesh.rotation.x, y: solidMesh.rotation.y, s: solidMesh.scale.x });
    const lag = Math.round(2 + amt * 7);
    const need = ECHO_N * lag + 1;
    if (echoHist.length > need) echoHist.length = need;
    for (let i = 0; i < ECHO_N; i++) {
      const h = echoHist[Math.min(echoHist.length - 1, (i + 1) * lag)];
      const m = echoMeshes[i];
      m.rotation.set(h.x, h.y, 0);
      m.position.copy(solidMesh.position);
      m.scale.setScalar(h.s * (1 + (i + 1) * 0.035));
      m.material.opacity = amt * 0.42 * (1 - i / ECHO_N);
      if (solidMesh.material.color) m.material.color.copy(solidMesh.material.color);
    }
  }
  function clearEcho() {
    if (!echoMeshes.length) return;
    echoMeshes.forEach(m => { scene.remove(m); m.material.dispose(); });
    echoMeshes = []; echoHist.length = 0;
  }

  function clearSym3D() {
    if (symClones.length) { symClones.forEach(g => scene.remove(g)); symClones = []; }
    if (solidMesh) solidMesh.position.set(0, 0, 0);
    if (wireMesh) wireMesh.position.set(0, 0, 0);
    if (solidMesh && solidMesh.material.side !== THREE.FrontSide) { solidMesh.material.side = THREE.FrontSide; solidMesh.material.needsUpdate = true; }
    if (wireMesh && wireMesh.material.side !== THREE.FrontSide) { wireMesh.material.side = THREE.FrontSide; wireMesh.material.needsUpdate = true; }
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
    const inflate = (bass * 0.9 + beat * 0.55) * distort;
    const mod = (0.25 + mid * 1.0 + beat * 0.9) * distort;
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
  let autoQuality = 1.0, qualityCheckT = 0;
  function applyPixelRatio() {
    if (!renderer) return;
    const dpr = window.devicePixelRatio || 1;
    const q = +qualitySel.value;
    renderer.setPixelRatio(dpr * q * autoQuality);
  }
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
    cBloom.width = Math.max(1, Math.floor(w / 2));
    cBloom.height = Math.max(1, Math.floor(h / 2));
    sizeFx();
    if (renderer) {
      applyPixelRatio();
      renderer.setSize(w, h, true);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
  }
  new ResizeObserver(fit).observe(wrap);

  // Bloom and aberration are blurs, so half resolution is free quality. Glitch
  // replaces the frame outright, and a half-res copy stretched back over the
  // stage would soften every wireframe on screen — so it gets the full size,
  // and only while it is switched on.
  function sizeFx() {
    const div = glitchOnEl.checked ? 1 : 2;
    const fw = Math.max(1, Math.floor(logicW / div));
    const fh = Math.max(1, Math.floor(logicH / div));
    if (cFx.width !== fw || cFx.height !== fh) { cFx.width = fw; cFx.height = fh; }
  }
  glitchOnEl.addEventListener('change', sizeFx);

  let smoothBuf = null;
  // Raw, unrouted band envelopes. Everything downstream reads bassEnv/midEnv/
  // highEnv instead, which are these three passed through the routing below.
  let envBass = 0, envMid = 0, envHigh = 0;
  let bassEnv = 0, midEnv = 0, highEnv = 0;

  // ===== BAND ROUTING =====
  // Three semantic slots drive the whole instrument: pulse (size, inflation,
  // travel), texture (detail and wobble) and sparkle (fine, fast motion). Each
  // one is normally fed by its own band. Letting any slot be fed by any part of
  // the spectrum re-voices all 22 2D modes and the 3D layer at once — hi-hats
  // can pump the size while the bass ripples the surface — without adding a
  // mode per idea.
  //
  // Typical energy differs a lot between bands, so a slot's output is scaled by
  // what it expects over what the chosen source delivers. Default routing gives
  // a ratio of exactly 1, so nothing changes until you change it; picking treble
  // for pulse lifts a quiet band to bass-sized excursion instead of going dead.
  const BAND_LEVEL = { bass: 0.40, mid: 0.26, high: 0.13, beat: 0.35, mix: 0.263 };
  const SLOT_LEVEL = { pulse: 0.40, texture: 0.26, sparkle: 0.13 };
  function routed(slot, beatNow) {
    const src = routeEls[slot].value;
    const v = (src === 'bass') ? envBass
            : (src === 'mid') ? envMid
            : (src === 'high') ? envHigh
            : (src === 'beat') ? beatNow
            : (envBass + envMid + envHigh) / 3;
    return v * (SLOT_LEVEL[slot] / BAND_LEVEL[src]);
  }
  let bassHistory = [], beatFlash = 0, phase = 0;
  let lastT = performance.now(), fpsSmooth = 60, frame = 0;
  let particles = [], mountainOffset = 0;
  let pulseRings = [], starfield = [], eqPeaks = [];
  let emdrT = 0;
  let wfCanvas = null, wfCtx = null;
  let ripples = [], fireworks = [], fwSparks = [];
  let plasmaCanvas = null, plasmaCtx = null, plasmaImg = null;
  let cosmos = { stars: [], dust: [], planets: [], comets: [] };
  let beatTriggered = false;
  let hueBase = 0, camT = 0;
  let bursts = [];
  let userSpin = { vx: 0, vy: 0 };
  const dragState = { active: false, lastX: 0, lastY: 0, moved: 0 };
  let shakeAmt = 0, wrapShaken = false;
  let strobeLevel = 0, strobeShown = false;
  let morphTo = null, morphT = 1;
  let fxTmp = null, fxTmpCtx = null;
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

  const BASE_CAMERA_Z = 4.2;
  function camRadius() { return BASE_CAMERA_Z * 100 / Math.max(1, +zoomEl.value); }
  function applyZoom() {
    if (!camera) return;
    if (camMotionEl.value === 'none') {
      camera.position.set(0, 0, camRadius());
      camera.lookAt(0, 0, 0);
    }
  }
  zoomEl.addEventListener('input', applyZoom);
  camMotionEl.addEventListener('change', () => { if (camMotionEl.value === 'none') applyZoom(); });
  applyZoom();

  requestAnimationFrame(loop);

  function loop(now) {
    requestAnimationFrame(loop);
    if (paused) { lastT = now; return; }
    const dt = Math.min(50, now - lastT) / 1000; lastT = now;
    fpsSmooth = fpsSmooth * 0.95 + (1 / Math.max(0.001, dt)) * 0.05;
    frame++;
    if (frame % 30 === 0) {
      let ft = `${Math.round(fpsSmooth)} fps`;
      if (autoQuality < 0.999) ft += ` · ${Math.round(autoQuality * 100)}%`;
      fpsTag.textContent = ft;
    }
    qualityCheckT += dt;
    if (qualityCheckT > 1.5) {
      qualityCheckT = 0;
      if (fpsSmooth < 40 && autoQuality > 0.5) { autoQuality = Math.max(0.5, autoQuality - 0.15); applyPixelRatio(); }
      else if (fpsSmooth > 56 && autoQuality < 1.0) { autoQuality = Math.min(1.0, autoQuality + 0.1); applyPixelRatio(); }
    }

    const w = logicW, h = logicH;
    if (!w || !h) { fit(); return; }

    const { do3D, do2D } = layerStates();
    const bgHex = bgCol.value;
    const bgRgb = hexToRgb(bgHex);
    c2d.style.opacity = do2D ? (+opacity2dEl.value / 100).toString() : '0';
    c3d.style.visibility = do3D ? 'visible' : 'hidden';

    if (threeReady && do3D) {
      renderer.setClearColor(new THREE.Color(bgHex), 1);
      const want = shape3dSel.value;
      if (morphOnEl.checked) {
        if (want !== morphTo && want !== currentShape) { morphTo = want; morphT = 0; }
        if (morphT < 1) {
          morphT = Math.min(1, morphT + dt * 3.2);
          if (morphT >= 0.5 && currentShape !== morphTo) setShape(morphTo);
          if (morphT >= 1) morphTo = null;
        } else { setShape(want); }
      } else {
        setShape(want); morphT = 1; morphTo = null;
      }
    }

    let bass = 0, mid = 0, high = 0, kick = 0;
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
      const kickLo = 2, kickHi = 10;
      for (let i = kickLo; i < kickHi; i++) kick += freqData[i];
      kick /= ((kickHi - kickLo) * 255);
    }
    const sm = 0.70;
    envBass = envBass * sm + bass * (1 - sm);
    envMid = envMid * sm + mid * (1 - sm);
    envHigh = envHigh * sm + high * (1 - sm);

    beatTriggered = false;
    bassHistory.push(kick);
    if (bassHistory.length > 43) bassHistory.shift();
    const avg = bassHistory.reduce((a, b) => a + b, 0) / bassHistory.length;
    const variance = bassHistory.reduce((a, b) => a + (b - avg) * (b - avg), 0) / bassHistory.length;
    const beatBoost = +beatEl.value / 100;
    const sensMul = 1.4 / Math.max(0.3, beatBoost);
    const threshold = avg + Math.sqrt(variance) * sensMul + 0.03;
    if (kick > threshold && beatFlash < 0.2) { beatFlash = 1.0 * beatBoost; beatTriggered = true; }
    beatFlash *= 0.92;
    if (beatFlash > 0.3) {
      beatPulse.style.background = '#ffc46b';
      beatPulse.style.boxShadow = `0 0 ${8 + beatFlash * 14}px #ffa724`;
      beatPulse.style.transform = `scale(${1 + beatFlash * 0.8})`;
    } else {
      beatPulse.style.background = 'rgba(255,167,36,0.16)';
      beatPulse.style.boxShadow = 'none';
      beatPulse.style.transform = 'scale(1)';
    }

    // Routing runs after the beat envelope exists, so "Beat" is a usable source.
    const beatNow = Math.min(1, beatFlash);
    bassEnv = routed('pulse', beatNow);
    midEnv = routed('texture', beatNow);
    highEnv = routed('sparkle', beatNow);

    updateTempo(now / 1000, dt, beatTriggered);
    paintTempo();
    updateVj(dt, beatTriggered);

    if (glitchOnEl.checked && +glitchEl.value > 0) {
      if (beatTriggered) { glitchLevel = 1; diceGlitch(); }
      else if (Math.random() < 0.05) diceGlitch();
      glitchLevel = Math.max(0.10 + midEnv * 0.25, glitchLevel * 0.80);
    } else glitchLevel = 0;

    if (hueOnEl.checked) {
      hueBase = (hueBase + dt * (+hueSpeedEl.value / 100) * 0.05) % 1;
      col1.value = rgbToHex(hsl2rgb(hueBase, 0.85, 0.60));
      col2.value = rgbToHex(hsl2rgb((hueBase + 0.10) % 1, 0.80, 0.52));
      col3.value = rgbToHex(hsl2rgb((hueBase + 0.22) % 1, 0.85, 0.42));
      presetSel.value = 'custom';
    }

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
    emdrT += dt * 0.3 * speed;   // ~1.7s per pass at Spin 100

    if (do3D && threeReady) {
      const gdCur = geomData[currentShape];
      if (gdCur && gdCur.frames) advanceAnim(gdCur, dt);
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
      let morphScale = 1;
      if (morphOnEl.checked && morphT < 1) {
        morphScale = 0.12 + 0.88 * Math.abs(morphT - 0.5) * 2;
      }
      if (solidMesh) {
        const spinKick = (morphT < 1) ? dt * 5 * (1 - Math.abs(morphT - 0.5) * 2) : 0;
        solidMesh.rotation.y += dt * 0.5 * speed * (1 + bassEnv * 1.2) + userSpin.vy + spinKick;
        solidMesh.rotation.x += dt * 0.2 * speed * (1 + midEnv * 0.6) + userSpin.vx;
        userSpin.vy *= 0.93; userSpin.vx *= 0.93;
        persistRot.x = solidMesh.rotation.x; persistRot.y = solidMesh.rotation.y;
        const s = (1 + beatFlash * 0.18 + bassEnv * 0.06) * morphScale;
        solidMesh.scale.setScalar(s);
      }
      if (wireMesh && solidMesh) {
        wireMesh.rotation.copy(solidMesh.rotation);
        wireMesh.scale.setScalar((1 + beatFlash * 0.18 + bassEnv * 0.06) * morphScale * 1.005);
      }

      // 3D folding is its own control now — independent of the 2D layer.
      const sym3d = +sym3dSel.value || 1;
      if (sym3d > 1) updateSym3D(sym3d); else clearSym3D();

      const echoAmt = echoOnEl.checked ? (+echoEl.value / 100) : 0;
      if (echoAmt > 0.001) updateEcho(echoAmt); else clearEcho();

      if (fogOnEl.checked) {
        const rad = camRadius(), haze = +fogEl.value / 100;
        if (!scene.fog) scene.fog = new THREE.Fog(0x000000, 1, 10);
        scene.fog.color.set(bgHex);
        scene.fog.near = rad * (0.6 - haze * 0.4);
        scene.fog.far = Math.max(scene.fog.near + 0.5, rad * (1.8 - haze * 0.9) - bassEnv * 1.0);
      } else if (scene.fog) {
        scene.fog = null;
      }

      camT += dt;
      const camMode = camMotionEl.value;
      if (camMode !== 'none') {
        const radius = camRadius();
        const cs = 0.2 + (+speedEl.value / 100) * 0.4;
        if (camMode === 'orbit') {
          const a = camT * cs;
          camera.position.set(Math.sin(a) * radius * 0.55, Math.sin(a * 0.5) * radius * 0.18, Math.cos(a) * radius * 0.95);
        } else if (camMode === 'dolly') {
          camera.position.set(0, 0, radius * (1 + Math.sin(camT * cs) * 0.22 + bassEnv * 0.18));
        } else if (camMode === 'sway') {
          camera.position.set(Math.sin(camT * cs * 1.3) * radius * 0.14, Math.cos(camT * cs) * radius * 0.11, radius);
        }
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);

      if (bloomOnEl.checked) {
        drawBloom();
        cBloom.style.opacity = String(0.35 + (+bloomEl.value / 100) * 0.65);
      } else {
        cBloom.style.opacity = '0';
      }
      if (glitchOnEl.checked) {
        drawGlitch(cFx.width, cFx.height);
        // Glitch lays down an opaque frame, so aberration adds onto it rather
        // than clearing it away.
        if (abOnEl.checked) drawAberration(false);
        cFx.style.opacity = '1';
      } else if (abOnEl.checked) {
        drawAberration(true);
        cFx.style.opacity = '1';
      } else {
        cFx.style.opacity = '0';
      }
    } else {
      cBloom.style.opacity = '0';
      cFx.style.opacity = '0';
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
      if (fbOnEl.checked) {
        const amt = +fbEl.value / 100;
        const fcx = w / 2, fcy = h / 2;
        const zoom = 1 + amt * 0.05 + bassEnv * 0.02;
        const rot = amt * 0.006 + bassEnv * 0.004;
        ctx.save();
        ctx.globalAlpha = 0.5 + amt * 0.45;
        ctx.translate(fcx, fcy); ctx.scale(zoom, zoom); ctx.rotate(rot); ctx.translate(-fcx, -fcy);
        ctx.drawImage(c2d, 0, 0, w, h);
        ctx.restore();
      }
      const c1 = hexToRgb(col1.value), c2 = hexToRgb(col2.value), c3 = hexToRgb(col3.value);
      const glow = +glowEl.value, sym = +symSel.value;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const cx = w / 2, cy = h / 2;
      const m2d = mode2dSel.value;
      const zoom2d = +zoom2dEl.value / 100;
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(zoom2d, zoom2d); ctx.translate(-cx, -cy);
      if (sym > 1) {
        for (let k = 0; k < sym; k++) {
          ctx.save();
          ctx.translate(cx, cy); ctx.rotate((k / sym) * Math.PI * 2);
          ctx.translate((+symDistEl.value / 100) * Math.min(w, h) * 0.28, 0);
          if (k % 2 === 1) ctx.scale(-1, 1);
          ctx.translate(-cx, -cy);
          ctx.globalAlpha = 1 / Math.sqrt(sym);
          drawScene(m2d, w, h, c1, c2, c3, glow);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      } else drawScene(m2d, w, h, c1, c2, c3, glow);
      ctx.restore();
    } else {
      ctx.clearRect(0, 0, w, h);
    }

    if (do2D && glitchLevel > 0.001) glitch2D(w, h);

    if (bursts.length) {
      if (!do2D) c2d.style.opacity = '1';
      drawBursts(w, h);
    }

    const strobeInt = +strobeEl.value / 100;
    if (beatTriggered && strobeInt > 0) strobeLevel = Math.max(strobeLevel, strobeInt);
    strobeLevel *= 0.78;
    if (strobeLevel > 0.004) {
      // capped at 0.55 rather than full white: a full-frame 100% flash on every
      // kick is genuinely unpleasant, and unsafe for some viewers.
      strobePlate.style.background = col1.value;
      strobePlate.style.opacity = String(strobeLevel * 0.55);
      strobeShown = true;
    } else if (strobeShown) {
      strobePlate.style.opacity = '0'; strobeShown = false; strobeLevel = 0;
    }

    const shakeInt = +shakeEl.value / 100;
    if (beatTriggered && shakeInt > 0) shakeAmt = Math.max(shakeAmt, shakeInt);
    if (shakeAmt > 0.001) {
      shakeAmt *= 0.85;
      const m = shakeAmt * 18;
      const dx = (Math.random() * 2 - 1) * m, dy = (Math.random() * 2 - 1) * m;
      const rz = (Math.random() * 2 - 1) * shakeAmt * 1.2;
      wrap.style.transform = `translate(${dx}px,${dy}px) rotate(${rz}deg) scale(${1 + shakeAmt * 0.05})`;
      wrapShaken = true;
    } else if (wrapShaken) {
      wrap.style.transform = '';
      wrapShaken = false; shakeAmt = 0;
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
    else if (mode === 'spectrum') drawSpectrum(w, h, c1, c2, c3, glow);
    else if (mode === 'rings') drawPulseRings(w, h, c1, c2, c3, glow);
    else if (mode === 'stars') drawStarfield(w, h, c1, c2, c3, glow);
    else if (mode === 'cosmos') drawCosmos(w, h, c1, c2, c3, glow);
    else if (mode === 'eq') drawEqClassic(w, h, c1, c2, c3, glow);
    else if (mode === 'radial') drawRadial(w, h, c1, c2, c3, glow);
    else if (mode === 'scope') drawScope(w, h, c1, c2, c3, glow);
    else if (mode === 'waterfall') drawWaterfall(w, h, c1, c2, c3, glow);
    else if (mode === 'grid') drawGrid(w, h, c1, c2, c3, glow);
    else if (mode === 'ripples') drawRipples(w, h, c1, c2, c3, glow);
    else if (mode === 'corona') drawCorona(w, h, c1, c2, c3, glow);
    else if (mode === 'plasma') drawPlasma(w, h, c1, c2, c3, glow);
    else if (mode === 'fireworks') drawFireworks(w, h, c1, c2, c3, glow);
    else if (mode === 'drain') drawDrain(w, h, c1, c2, c3, glow);
    else if (mode === 'emdr') drawEmdr(w, h, c1, c2, c3, glow);
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
  function drawSpectrum(w,h,c1,c2,c3,glow) {
    const bars = 64, N = freqData.length;
    const barW = w / bars;
    const minBin = 2, maxBin = N * 0.92;
    const logSpan = Math.log(maxBin / minBin);
    for (let i = 0; i < bars; i++) {
      const lo = Math.floor(minBin * Math.exp(logSpan * i / bars));
      const hi = Math.max(lo + 1, Math.floor(minBin * Math.exp(logSpan * (i + 1) / bars)));
      let sum = 0, cnt = 0;
      if (running) {
        for (let j = lo; j < hi && j < N; j++) { sum += freqData[j]; cnt++; }
      }
      const fv = cnt ? (sum / cnt) / 255 : 0;
      const tilt = 1 + (i / (bars - 1)) * 2.5;
      const t = i / (bars - 1), col = triColor(t, c1, c2, c3);
      const barH = fv * tilt * h * 0.55 + beatFlash * 8 + 2;
      const x = i * barW + barW * 0.15, ww = barW * 0.7, y = h - barH;
      const grad = ctx.createLinearGradient(0, y, 0, h);
      grad.addColorStop(0, rgba(col, 0.95));
      grad.addColorStop(1, rgba(col, 0.25));
      ctx.fillStyle = grad;
      ctx.shadowColor = rgba(col, 0.7); ctx.shadowBlur = glow * 0.5;
      ctx.fillRect(x, y, ww, barH);
      ctx.fillStyle = rgba(col, 0.9 + beatFlash * 0.1);
      ctx.fillRect(x, y, ww, Math.min(4, barH));
    }
    ctx.shadowBlur = 0;
  }
  function drawEqClassic(w,h,c1,c2,c3,glow) {
    const bars = 28, segs = 22, N = freqData.length;
    if (eqPeaks.length !== bars) eqPeaks = new Array(bars).fill(0);
    const minBin = 2, maxBin = N * 0.9, logSpan = Math.log(maxBin / minBin);
    const marginX = w * 0.04, usableW = w - marginX * 2;
    const barGap = (usableW / bars) * 0.22, barW = usableW / bars - barGap;
    const topY = h * 0.08, botY = h * 0.94, fieldH = botY - topY;
    const segGap = Math.max(1, (fieldH / segs) * 0.16);
    const segH = (fieldH - segGap * (segs - 1)) / segs;
    for (let i = 0; i < bars; i++) {
      const lo = Math.floor(minBin * Math.exp(logSpan * i / bars));
      const hi = Math.max(lo + 1, Math.floor(minBin * Math.exp(logSpan * (i + 1) / bars)));
      let sum = 0, cnt = 0;
      if (running) { for (let j = lo; j < hi && j < N; j++) { sum += freqData[j]; cnt++; } }
      let level = cnt ? (sum / cnt) / 255 : 0;
      const tilt = 1 + (i / (bars - 1)) * 1.8;
      level = Math.min(1, level * tilt + beatFlash * 0.05);
      const lit = Math.round(level * segs);
      if (level > eqPeaks[i]) eqPeaks[i] = level;
      else eqPeaks[i] = Math.max(0, eqPeaks[i] - 0.012);
      const peakSeg = Math.round(eqPeaks[i] * segs);
      const x = marginX + i * (barW + barGap);
      for (let s = 0; s < segs; s++) {
        const segY = botY - (s + 1) * segH - s * segGap;
        const col = triColor(s / (segs - 1), c1, c2, c3);
        ctx.fillStyle = s < lit ? rgba(col, 0.95) : rgba(col, 0.07);
        ctx.fillRect(x, segY, barW, segH);
      }
      if (peakSeg > 0) {
        const s = Math.min(segs - 1, peakSeg - 1);
        const segY = botY - (s + 1) * segH - s * segGap;
        const col = triColor(s / (segs - 1), c1, c2, c3);
        ctx.fillStyle = rgba([255, 255, 255], 0.92);
        ctx.shadowColor = rgba(col, 0.9); ctx.shadowBlur = glow * 0.5;
        ctx.fillRect(x, segY, barW, segH);
        ctx.shadowBlur = 0;
      }
    }
  }
  function drawRadial(w,h,c1,c2,c3,glow) {
    const cx = w / 2, cy = h / 2, bars = 84, N = freqData.length;
    const baseR = Math.min(w, h) * 0.15 + bassEnv * 45 + beatFlash * 22;
    const rot = phase * 0.3;
    const maxLen = Math.min(w, h) * 0.3;
    ctx.lineCap = 'round';
    for (let i = 0; i < bars; i++) {
      const a = (i / bars) * Math.PI * 2 + rot;
      const fi = Math.floor(Math.pow(i / bars, 1.3) * N * 0.55);
      const fv = running ? freqData[fi] / 255 : 0;
      const len = fv * maxLen + beatFlash * 10 + 4;
      const col = triColor(i / bars, c1, c2, c3);
      const x0 = cx + Math.cos(a) * baseR, y0 = cy + Math.sin(a) * baseR;
      const x1 = cx + Math.cos(a) * (baseR + len), y1 = cy + Math.sin(a) * (baseR + len);
      ctx.strokeStyle = rgba(col, 0.9);
      ctx.lineWidth = 2.5 + beatFlash * 2;
      ctx.shadowColor = rgba(col, 0.8); ctx.shadowBlur = glow * 0.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(c1, 0.35 + beatFlash * 0.3); ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  function drawScope(w,h,c1,c2,c3,glow) {
    const cx = w / 2, cy = h / 2, S = timeData.length;
    const scale = Math.min(w, h) * 0.4 * (1 + beatFlash * 0.2);
    const off = 8;
    const col = triColor(0.5 + bassEnv * 0.4, c1, c2, c3);
    ctx.beginPath();
    for (let i = 0; i < S - off; i += 2) {
      const xv = running ? (timeData[i] - 128) / 128 : 0;
      const yv = running ? (timeData[i + off] - 128) / 128 : 0;
      const x = cx + xv * scale, y = cy + yv * scale;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rgba(col, 0.85);
    ctx.lineWidth = 1.5 + beatFlash * 2.5;
    ctx.shadowColor = rgba(col, 0.9); ctx.shadowBlur = glow + beatFlash * 15;
    ctx.stroke(); ctx.shadowBlur = 0;
  }
  function drawWaterfall(w,h,c1,c2,c3,glow) {
    if (!wfCanvas) { wfCanvas = document.createElement('canvas'); wfCtx = wfCanvas.getContext('2d'); }
    if (wfCanvas.width !== w || wfCanvas.height !== h) { wfCanvas.width = w; wfCanvas.height = h; }
    const N = freqData.length, rowH = 2;
    wfCtx.globalCompositeOperation = 'copy';
    wfCtx.drawImage(wfCanvas, 0, rowH);
    wfCtx.globalCompositeOperation = 'source-over';
    for (let x = 0; x < w; x++) {
      const fi = Math.floor(Math.pow(x / w, 1.4) * N * 0.7);
      const fv = running ? freqData[fi] / 255 : 0;
      if (fv <= 0.02) continue;
      const col = triColor(fv, c1, c2, c3);
      wfCtx.fillStyle = rgba(col, Math.min(1, fv * 1.5));
      wfCtx.fillRect(x, 0, 1, rowH);
    }
    ctx.drawImage(wfCanvas, 0, 0, w, h);
  }
  function drawGrid(w,h,c1,c2,c3,glow) {
    const cols = 26, rows = 15, N = freqData.length;
    const cellW = w / cols, cellH = h / rows;
    const r = Math.min(cellW, cellH) * 0.30;
    for (let cxi = 0; cxi < cols; cxi++) {
      const fi = Math.floor(Math.pow(cxi / cols, 1.3) * N * 0.6);
      const fv = running ? freqData[fi] / 255 : 0;
      const tilt = 1 + (cxi / (cols - 1)) * 1.6;
      const litRows = Math.round(Math.min(1, fv * tilt + beatFlash * 0.05) * rows);
      const col = triColor(cxi / (cols - 1), c1, c2, c3);
      for (let ry = 0; ry < rows; ry++) {
        const on = (rows - 1 - ry) < litRows;
        const x = cellW * (cxi + 0.5), y = cellH * (ry + 0.5);
        if (on) {
          ctx.fillStyle = rgba(col, 0.95);
          ctx.shadowColor = rgba(col, 0.8); ctx.shadowBlur = glow * 0.35;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = rgba(col, 0.07); ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.shadowBlur = 0;
  }
  function drawRipples(w,h,c1,c2,c3,glow) {
    if (beatTriggered) ripples.push({ x: rand(w * 0.18, w * 0.82), y: rand(h * 0.18, h * 0.82), age: 0, hue: Math.random() });
    else if (Math.random() < 0.015) ripples.push({ x: rand(w * 0.15, w * 0.85), y: rand(h * 0.15, h * 0.85), age: 0, hue: Math.random() });
    if (ripples.length > 14) ripples.splice(0, ripples.length - 14);
    const speed = 3.4 + bassEnv * 5;
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.age += speed;
      const fade = 1 - rp.age / (Math.min(w, h) * 0.85);
      if (fade <= 0) { ripples.splice(i, 1); continue; }
      const col = triColor(rp.hue, c1, c2, c3);
      for (let k = 0; k < 5; k++) {
        const r = rp.age - k * 17;
        if (r <= 0) continue;
        const a = fade * (1 - k / 5) * (0.55 + Math.sin(r * 0.09) * 0.3);
        if (a <= 0.01) continue;
        ctx.strokeStyle = rgba(col, a);
        ctx.lineWidth = (1 + fade * 2.4) * (1 - k / 6);
        ctx.shadowColor = rgba(col, a * 0.8); ctx.shadowBlur = glow * 0.35;
        ctx.beginPath(); ctx.arc(rp.x, rp.y, r, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
  }
  function drawCorona(w,h,c1,c2,c3,glow) {
    const cx = w / 2, cy = h / 2, N = freqData.length, tend = 44;
    const minD = Math.min(w, h);
    const coreR = minD * 0.10 * (1 + bassEnv * 0.55 + beatFlash * 0.45);
    for (let i = 0; i < tend; i++) {
      const a0 = (i / tend) * Math.PI * 2 + phase * 0.35;
      const fi = Math.floor(Math.pow(i / tend, 1.2) * N * 0.5);
      const fv = running ? freqData[fi] / 255 : 0;
      const len = coreR + fv * minD * 0.34 + beatFlash * minD * 0.06;
      const col = triColor(0.25 + fv * 0.75, c1, c2, c3);
      ctx.beginPath();
      const segs = 9;
      for (let s = 0; s <= segs; s++) {
        const f = s / segs;
        const rr = coreR + (len - coreR) * f;
        const wob = Math.sin(f * 5 + phase * 3.2 + i * 0.7) * 0.16 * f * (1 + midEnv);
        const a = a0 + wob;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(col, 0.35 + fv * 0.6);
      ctx.lineWidth = 1.5 + fv * 3 + beatFlash * 1.5;
      ctx.shadowColor = rgba(col, 0.75); ctx.shadowBlur = glow * 0.55;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.5);
    rg.addColorStop(0, rgba([255, 255, 245], 0.9));
    rg.addColorStop(0.35, rgba(c1, 0.75 + beatFlash * 0.25));
    rg.addColorStop(0.75, rgba(c2, 0.35));
    rg.addColorStop(1, rgba(c2, 0));
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(cx, cy, coreR * 1.5, 0, Math.PI * 2); ctx.fill();
  }
  function drawPlasma(w,h,c1,c2,c3,glow) {
    const pw = 110, ph = Math.max(1, Math.round(pw * h / Math.max(1, w)));
    if (!plasmaCanvas) { plasmaCanvas = document.createElement('canvas'); plasmaCtx = plasmaCanvas.getContext('2d'); }
    if (plasmaCanvas.width !== pw || plasmaCanvas.height !== ph) {
      plasmaCanvas.width = pw; plasmaCanvas.height = ph;
      plasmaImg = plasmaCtx.createImageData(pw, ph);
    }
    const t = phase * 2.2;
    const warp = 1 + bassEnv * 1.6 + beatFlash * 0.9;
    const d = plasmaImg.data;
    let p = 0;
    for (let y = 0; y < ph; y++) {
      const fy = (y / ph) * 7;
      for (let x = 0; x < pw; x++) {
        const fx = (x / pw) * 7;
        const v = Math.sin(fx * warp + t)
                + Math.sin(fy * warp - t * 0.8)
                + Math.sin((fx + fy) * 0.7 + t * 0.5)
                + Math.sin(Math.sqrt(fx * fx + fy * fy) * 1.3 - t * 1.2);
        const u = (v + 4) * 0.125; // 0..1
        let r, g, b;
        if (u < 0.5) { const k = u * 2; r = c1[0] + (c2[0] - c1[0]) * k; g = c1[1] + (c2[1] - c1[1]) * k; b = c1[2] + (c2[2] - c1[2]) * k; }
        else { const k = (u - 0.5) * 2; r = c2[0] + (c3[0] - c2[0]) * k; g = c2[1] + (c3[1] - c2[1]) * k; b = c2[2] + (c3[2] - c2[2]) * k; }
        d[p++] = r; d[p++] = g; d[p++] = b; d[p++] = 255;
      }
    }
    plasmaCtx.putImageData(plasmaImg, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(plasmaCanvas, 0, 0, w, h);
  }
  function drawFireworks(w,h,c1,c2,c3,glow) {
    if (beatTriggered && fireworks.length < 5) {
      fireworks.push({
        x: rand(w * 0.2, w * 0.8), y: h + 8,
        vx: rand(-1.1, 1.1), vy: -(7.5 + Math.random() * 3.5 + bassEnv * 3),
        hue: Math.random()
      });
    }
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const s = fireworks[i];
      s.x += s.vx; s.y += s.vy; s.vy += 0.16;
      const col = triColor(s.hue, c1, c2, c3);
      ctx.strokeStyle = rgba(col, 0.8); ctx.lineWidth = 2;
      ctx.shadowColor = rgba(col, 0.9); ctx.shadowBlur = glow * 0.5;
      ctx.beginPath(); ctx.moveTo(s.x - s.vx * 3, s.y - s.vy * 3); ctx.lineTo(s.x, s.y); ctx.stroke();
      if (s.vy >= -0.6 || s.y < h * 0.16) {
        const n = 44;
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + Math.random() * 0.2;
          const sp = 1.6 + Math.random() * 3.6;
          fwSparks.push({ x: s.x, y: s.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, hue: s.hue, size: 1 + Math.random() * 2 });
        }
        fireworks.splice(i, 1);
      }
    }
    if (fwSparks.length > 700) fwSparks.splice(0, fwSparks.length - 700);
    ctx.shadowBlur = 0;
    for (let i = fwSparks.length - 1; i >= 0; i--) {
      const p = fwSparks[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.975; p.vy = p.vy * 0.975 + 0.075;
      p.life -= 0.016;
      if (p.life <= 0) { fwSparks.splice(i, 1); continue; }
      const col = triColor(p.hue, c1, c2, c3);
      const a = p.life * (0.75 + beatFlash * 0.25);
      ctx.strokeStyle = rgba(col, a);
      ctx.lineWidth = p.size * p.life;
      ctx.beginPath(); ctx.moveTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
  }
  // Bilateral sweep. The whole point is a predictable left-right rhythm the eye
  // can lock onto, so position comes off its own steady clock and the audio is
  // only allowed to touch size, brightness and colour — never the pacing.
  function drawEmdr(w,h,c1,c2,c3,glow) {
    const cy = h / 2;
    const margin = w * 0.08, span = w - margin * 2;
    const ang = emdrT * Math.PI * 2;
    const u = Math.sin(ang);                 // -1..1, eases at each reversal
    const dir = Math.cos(ang);               // sign = travel direction
    const x = margin + span * (u * 0.5 + 0.5);
    const col = triColor(0.5 + u * 0.5, c1, c2, c3);
    const r = Math.min(w, h) * 0.035 * (1 + bassEnv * 0.9 + beatFlash * 0.5);

    ctx.strokeStyle = rgba(c3, 0.20);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(margin, cy); ctx.lineTo(w - margin, cy); ctx.stroke();

    // streak trailing the direction of travel, shortest at the turns
    const tail = span * 0.16 * Math.abs(dir);
    const tx = x - Math.sign(dir) * tail;
    const lg = ctx.createLinearGradient(x, cy, tx, cy);
    lg.addColorStop(0, rgba(col, 0.5));
    lg.addColorStop(1, rgba(col, 0));
    ctx.strokeStyle = lg;
    ctx.lineWidth = r * 1.1;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, cy); ctx.lineTo(x, cy); ctx.stroke();

    // a soft column so the light stays findable in peripheral vision
    const vg = ctx.createLinearGradient(x, 0, x, h);
    vg.addColorStop(0, rgba(col, 0));
    vg.addColorStop(0.5, rgba(col, 0.10 + bassEnv * 0.10));
    vg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = vg;
    ctx.fillRect(x - r * 0.9, 0, r * 1.8, h);

    ctx.shadowColor = rgba(col, 0.95);
    ctx.shadowBlur = glow + r * 1.6 + beatFlash * 20;
    const rg = ctx.createRadialGradient(x, cy, 0, x, cy, r);
    rg.addColorStop(0, rgba([255, 255, 255], 0.95));
    rg.addColorStop(0.35, rgba(col, 0.9));
    rg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawDrain(w,h,c1,c2,c3,glow) {
    const cx = w / 2, cy = h / 2, N = freqData.length;
    const maxR = Math.hypot(w, h) * 0.55;
    const arms = 4, steps = 150;
    const twist = 2.6 + bassEnv * 3.2;
    for (let a = 0; a < arms; a++) {
      const col = triColor(a / arms, c1, c2, c3);
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const f = s / steps;
        const fi = Math.floor(f * N * 0.5);
        const fv = running ? freqData[fi] / 255 : 0;
        const rr = maxR * (1 - f) * (1 + fv * 0.3);
        const ang = f * twist * Math.PI * 2 + phase * 1.6 + (a / arms) * Math.PI * 2;
        const x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
        if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(col, 0.8);
      ctx.lineWidth = 1.8 + beatFlash * 3;
      ctx.shadowColor = rgba(col, 0.85); ctx.shadowBlur = glow * 0.55;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    const holeR = 26 + bassEnv * 45 + beatFlash * 22;
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, holeR);
    rg.addColorStop(0, rgba([0, 0, 0], 0.92));
    rg.addColorStop(0.7, rgba([0, 0, 0], 0.55));
    rg.addColorStop(1, rgba([0, 0, 0], 0));
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(cx, cy, holeR, 0, Math.PI * 2); ctx.fill();
  }
  function drawPulseRings(w,h,c1,c2,c3,glow) {
    const cx = w / 2, cy = h / 2;
    if (beatTriggered) {
      pulseRings.push({ r: 12, life: 1.0, hue: Math.random() });
    }
    const maxR = Math.hypot(w, h);
    for (let i = pulseRings.length - 1; i >= 0; i--) {
      const ring = pulseRings[i];
      ring.r += 4 + bassEnv * 8 + midEnv * 4;
      ring.life -= 0.015;
      if (ring.life <= 0 || ring.r > maxR) { pulseRings.splice(i, 1); continue; }
      const col = triColor(ring.hue, c1, c2, c3);
      ctx.strokeStyle = rgba(col, ring.life * 0.85);
      ctx.lineWidth = 1.5 + ring.life * 4;
      ctx.shadowColor = rgba(col, ring.life);
      ctx.shadowBlur = glow * 0.8 * ring.life;
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    const coreR = 28 + bassEnv * 55 + beatFlash * 35;
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    rg.addColorStop(0, rgba(c1, 0.4 + beatFlash * 0.4));
    rg.addColorStop(1, rgba(c1, 0));
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  function drawStarfield(w,h,c1,c2,c3,glow) {
    const COUNT = 220;
    while (starfield.length < COUNT) {
      starfield.push({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: Math.random() * 1.9 + 0.1,
        hue: Math.random()
      });
    }
    if (starfield.length > COUNT) starfield.length = COUNT;
    const cx = w / 2, cy = h / 2;
    const speed = 0.008 + bassEnv * 0.06 + beatFlash * 0.04;
    for (const s of starfield) {
      const prevZ = s.z;
      s.z -= speed;
      if (s.z <= 0.05) {
        s.x = (Math.random() - 0.5) * 4;
        s.y = (Math.random() - 0.5) * 4;
        s.z = 2; s.hue = Math.random();
        continue;
      }
      const proj = 1 / s.z;
      const sx = cx + s.x * proj * cx * 0.6;
      const sy = cy + s.y * proj * cy * 0.6;
      if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;
      const t = 1 - s.z / 2;
      const sz = (1.5 - s.z * 0.7) * (1 + beatFlash * 0.6);
      const col = triColor(s.hue, c1, c2, c3);
      const a = Math.max(0, t) * (0.55 + highEnv * 0.4);
      const prevProj = 1 / prevZ;
      const psx = cx + s.x * prevProj * cx * 0.6;
      const psy = cy + s.y * prevProj * cy * 0.6;
      ctx.strokeStyle = rgba(col, a * 0.6);
      ctx.lineWidth = sz * 0.5;
      ctx.beginPath();
      ctx.moveTo(psx, psy); ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.fillStyle = rgba(col, a);
      ctx.shadowColor = rgba(col, a); ctx.shadowBlur = glow * 0.4 * t;
      ctx.beginPath(); ctx.arc(sx, sy, sz, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  function ensureCosmos() {
    if (cosmos.stars.length === 0) {
      for (let i = 0; i < 160; i++) {
        cosmos.stars.push({
          x: (Math.random() - 0.5) * 3.5,
          y: (Math.random() - 0.5) * 3.5,
          z: Math.random() * 2.8 + 0.2,
          baseSz: 0.6 + Math.pow(Math.random(), 2.2) * 2.8,
          tw: Math.random() * Math.PI * 2,
          hue: Math.random()
        });
      }
      for (let i = 0; i < 90; i++) {
        cosmos.dust.push({ x: Math.random(), y: Math.random(), ph: Math.random() * Math.PI * 2 });
      }
    }
    if (cosmos.planets.length === 0) {
      for (let i = 0; i < 5; i++) {
        cosmos.planets.push({
          x: (Math.random() - 0.5) * 2.4,
          y: (Math.random() - 0.5) * 1.6,
          z: 1.5 + i * 1.2 + Math.random() * 1.0,
          baseR: 30 + Math.random() * 70,
          hue: Math.random(),
          ring: Math.random() < 0.5,
          ringAng: Math.random() * Math.PI
        });
      }
    }
  }
  function drawCosmos(w,h,c1,c2,c3,glow) {
    ensureCosmos();
    const cx = w / 2, cy = h / 2;
    const flySpeed = 0.006 + bassEnv * 0.04 + beatFlash * 0.025;
    for (const d of cosmos.dust) {
      d.ph += 0.04 + highEnv * 0.12;
      const a = (Math.sin(d.ph) * 0.5 + 0.5) * 0.28 + highEnv * 0.15;
      ctx.fillStyle = rgba([210, 220, 255], a);
      ctx.fillRect(d.x * w, d.y * h, 1, 1);
    }
    cosmos.planets.sort((a, b) => b.z - a.z);
    for (const p of cosmos.planets) {
      p.z -= flySpeed * 0.5;
      if (p.z <= 0.18) {
        p.x = (Math.random() - 0.5) * 2.4;
        p.y = (Math.random() - 0.5) * 1.6;
        p.z = 6 + Math.random() * 2;
        p.baseR = 30 + Math.random() * 70;
        p.hue = Math.random();
        p.ring = Math.random() < 0.5;
        p.ringAng = Math.random() * Math.PI;
        continue;
      }
      const proj = 1 / p.z;
      const px = cx + p.x * proj * cx * 0.8;
      const py = cy + p.y * proj * cy * 0.8;
      const r = p.baseR * proj * 0.6 * (1 + beatFlash * 0.06);
      if (px < -r * 2 || px > w + r * 2 || py < -r * 2 || py > h + r * 2) continue;
      const fade = Math.min(1, (5 - p.z) / 2.5);
      const col = triColor(p.hue, c1, c2, c3);
      if (p.ring) {
        ctx.save();
        ctx.translate(px, py); ctx.rotate(p.ringAng); ctx.scale(1, 0.28);
        ctx.strokeStyle = rgba(col, 0.35 * fade);
        ctx.lineWidth = 3 + r * 0.05;
        ctx.beginPath(); ctx.arc(0, 0, r * 1.8, Math.PI, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      const lit = [Math.min(255, col[0] + 70), Math.min(255, col[1] + 70), Math.min(255, col[2] + 70)];
      const dark = [col[0] * 0.25, col[1] * 0.25, col[2] * 0.25];
      const rg = ctx.createRadialGradient(px - r * 0.4, py - r * 0.4, r * 0.05, px, py, r * 1.05);
      rg.addColorStop(0, rgba(lit, fade));
      rg.addColorStop(0.55, rgba(col, fade * 0.9));
      rg.addColorStop(1, rgba(dark, fade * 0.7));
      ctx.fillStyle = rg;
      ctx.shadowColor = rgba(col, fade * 0.5);
      ctx.shadowBlur = glow * 0.5;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (p.ring) {
        ctx.save();
        ctx.translate(px, py); ctx.rotate(p.ringAng); ctx.scale(1, 0.28);
        ctx.strokeStyle = rgba(col, 0.6 * fade);
        ctx.lineWidth = 3 + r * 0.05;
        ctx.beginPath(); ctx.arc(0, 0, r * 1.8, 0, Math.PI); ctx.stroke();
        ctx.restore();
      }
    }
    cosmos.stars.sort((a, b) => b.z - a.z);
    for (const s of cosmos.stars) {
      const prevZ = s.z;
      s.z -= flySpeed;
      if (s.z <= 0.05) {
        s.x = (Math.random() - 0.5) * 3.5;
        s.y = (Math.random() - 0.5) * 3.5;
        s.z = 3 + Math.random() * 0.5;
        s.hue = Math.random();
        continue;
      }
      s.tw += 0.035 + highEnv * 0.08;
      const proj = 1 / s.z;
      const sx = cx + s.x * proj * cx * 0.7;
      const sy = cy + s.y * proj * cy * 0.7;
      if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) continue;
      const t = Math.min(1, (3 - s.z) / 3 + 0.15);
      const twinkle = Math.sin(s.tw) * 0.25 + 0.75;
      const col = triColor(s.hue, c1, c2, c3);
      const sz = s.baseSz * proj * (1 + beatFlash * 0.35) * twinkle;
      const a = t * 0.85 + beatFlash * 0.1;
      const prevProj = 1 / prevZ;
      const psx = cx + s.x * prevProj * cx * 0.7;
      const psy = cy + s.y * prevProj * cy * 0.7;
      ctx.strokeStyle = rgba(col, a * 0.5);
      ctx.lineWidth = sz * 0.5;
      ctx.beginPath(); ctx.moveTo(psx, psy); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.shadowColor = rgba(col, a);
      ctx.shadowBlur = glow * 0.4 + sz * 2.2;
      ctx.fillStyle = rgba(col, a);
      ctx.beginPath(); ctx.arc(sx, sy, sz, 0, Math.PI * 2); ctx.fill();
      if (sz > 3) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = rgba(col, a * 0.55);
        ctx.lineWidth = 0.8;
        const spike = sz * 4 * twinkle;
        ctx.beginPath();
        ctx.moveTo(sx - spike, sy); ctx.lineTo(sx + spike, sy);
        ctx.moveTo(sx, sy - spike); ctx.lineTo(sx, sy + spike);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
    if (beatTriggered && Math.random() < 0.6) {
      const side = Math.floor(Math.random() * 4);
      const sp = 4 + Math.random() * 5;
      let x, y, vx, vy;
      if (side === 0)      { x = -50;    y = Math.random() * h; vx =  sp;                  vy = (Math.random() - 0.3) * 2; }
      else if (side === 1) { x = w + 50; y = Math.random() * h; vx = -sp;                  vy = (Math.random() - 0.3) * 2; }
      else if (side === 2) { x = Math.random() * w; y = -50;    vx = (Math.random() - 0.5) * 3; vy =  sp; }
      else                 { x = Math.random() * w; y = h + 50; vx = (Math.random() - 0.5) * 3; vy = -sp; }
      cosmos.comets.push({ x, y, vx, vy, life: 1.0, hue: Math.random(), sz: 3 + Math.random() * 4 });
    }
    for (let i = cosmos.comets.length - 1; i >= 0; i--) {
      const c = cosmos.comets[i];
      const boost = 1 + bassEnv * 0.35;
      c.x += c.vx * boost; c.y += c.vy * boost;
      c.life -= 0.0085;
      if (c.life <= 0 || c.x < -200 || c.x > w + 200 || c.y < -200 || c.y > h + 200) {
        cosmos.comets.splice(i, 1); continue;
      }
      const col = triColor(c.hue, c1, c2, c3);
      const tx = c.x - c.vx * 14, ty = c.y - c.vy * 14;
      const grad = ctx.createLinearGradient(c.x, c.y, tx, ty);
      grad.addColorStop(0, rgba(col, c.life * 0.95));
      grad.addColorStop(0.4, rgba(col, c.life * 0.45));
      grad.addColorStop(1, rgba(col, 0));
      ctx.strokeStyle = grad;
      ctx.lineWidth = c.sz * c.life * 0.8;
      ctx.lineCap = 'round';
      ctx.shadowColor = rgba(col, c.life * 0.7);
      ctx.shadowBlur = glow * 0.6;
      ctx.beginPath();
      ctx.moveTo(tx, ty); ctx.lineTo(c.x, c.y);
      ctx.stroke();
      ctx.fillStyle = rgba([255, 250, 235], c.life);
      ctx.shadowColor = rgba([255, 250, 235], c.life);
      ctx.shadowBlur = glow * 0.9;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.sz * c.life * 0.75, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  // Click-spawned particle bursts (drawn on the 2D overlay, any mode)
  function drawBursts(w, h) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = bursts.length - 1; i >= 0; i--) {
      const p = bursts[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.96; p.vy *= 0.96; p.vy += 0.03;
      p.life -= 0.018;
      if (p.life <= 0) { bursts.splice(i, 1); continue; }
      const a = Math.max(0, p.life);
      ctx.fillStyle = rgba(p.col, a);
      ctx.shadowColor = rgba(p.col, a); ctx.shadowBlur = 12 * a;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.6 + a * 0.6), 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  // ===== GLITCH =====
  // The frame torn into horizontal bands and shoved sideways. The kick re-dices
  // the bands and slams the level to full; between hits it decays to a low idle
  // churn, so the tear lands *with* the drum instead of shimmering constantly.
  //
  // Bands are stored as fractions of height, not pixels, because the same list
  // has to drive two canvases that are not the same size.
  let glitchLevel = 0, glitchTmp = null, glitchTmpCtx = null;
  const glitchBands = [];
  function diceGlitch() {
    glitchBands.length = 0;
    const n = 7 + Math.floor(Math.random() * 9);
    let y = 0;
    while (y < 1 && glitchBands.length < 24) {
      const bh = Math.min(1 - y, (1 / n) * (0.35 + Math.random() * 1.5));
      glitchBands.push({ y, h: bh, dx: Math.random() * 2 - 1, tear: Math.random() < 0.3 });
      y += bh;
    }
  }
  diceGlitch();
  function glitchAmt() { return glitchLevel * (+glitchEl.value / 100); }

  // A band shoved sideways would leave a gap at the edge it came from, so every
  // band is drawn twice, one stage-width apart: the frame wraps instead of tearing
  // to black. The second copy is almost entirely off-canvas and costs nothing.
  function glitchBand(c, src, sy, sh, dy, dh, dx, sw, dw) {
    c.drawImage(src, 0, sy, sw, sh, dx, dy, dw, dh);
    c.drawImage(src, 0, sy, sw, sh, dx + (dx > 0 ? -dw : dw), dy, dw, dh);
  }

  function drawGlitch(bw, bh) {
    fxctx.clearRect(0, 0, bw, bh);
    fxctx.globalCompositeOperation = 'source-over';
    fxctx.globalAlpha = 1;
    const amt = glitchAmt(), shift = bw * 0.18 * amt;
    for (const b of glitchBands) {
      const dy = Math.floor(b.y * bh), dh = Math.ceil(b.h * bh);
      if (dh < 1) continue;
      const sy = b.y * c3d.height, sh = b.h * c3d.height;
      const dx = b.dx * shift;
      glitchBand(fxctx, c3d, sy, sh, dy, dh, dx, c3d.width, bw);
      if (b.tear && Math.abs(dx) > 1) {
        // A torn band leaves a bright ghost where it pulled away from.
        fxctx.globalCompositeOperation = 'lighter';
        fxctx.globalAlpha = 0.45 * amt;
        fxctx.drawImage(c3d, 0, sy, c3d.width, sh, -dx * 0.6, dy, bw, dh);
        fxctx.globalCompositeOperation = 'source-over';
        fxctx.globalAlpha = 1;
      }
    }
  }

  // The 2D layer is torn in place: copy it out, clear it, put the bands back
  // displaced. Source coordinates stay in device pixels, destinations in the
  // logical pixels the 2D context is already scaled to.
  function glitch2D(w, h) {
    if (!glitchTmp) { glitchTmp = document.createElement('canvas'); glitchTmpCtx = glitchTmp.getContext('2d'); }
    if (glitchTmp.width !== c2d.width || glitchTmp.height !== c2d.height) {
      glitchTmp.width = c2d.width; glitchTmp.height = c2d.height;
    }
    glitchTmpCtx.globalCompositeOperation = 'copy';
    glitchTmpCtx.drawImage(c2d, 0, 0);
    glitchTmpCtx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    const shift = w * 0.18 * glitchAmt();
    for (const b of glitchBands) {
      const dy = b.y * h, dh = b.h * h;
      if (dh < 0.5) continue;
      glitchBand(ctx, glitchTmp, b.y * glitchTmp.height, b.h * glitchTmp.height,
                 dy, dh, b.dx * shift, glitchTmp.width, w);
    }
  }

  // Bloom: blurred bright-pass copy of the 3D canvas, screen-blended over it
  function drawBloom() {
    const bw = cBloom.width, bh = cBloom.height;
    const amt = +bloomEl.value / 100;
    bctx.clearRect(0, 0, bw, bh);
    bctx.globalCompositeOperation = 'source-over';
    bctx.globalAlpha = 1;
    bctx.filter = `blur(${2 + amt * 4}px) brightness(${1.2 + amt}) contrast(2.2)`;
    bctx.drawImage(c3d, 0, 0, bw, bh);
    bctx.globalCompositeOperation = 'lighter';
    bctx.globalAlpha = 0.7;
    bctx.filter = `blur(${6 + amt * 12}px) brightness(${1 + amt}) contrast(2)`;
    bctx.drawImage(c3d, 0, 0, bw, bh);
    bctx.filter = 'none';
    bctx.globalAlpha = 1;
    bctx.globalCompositeOperation = 'source-over';
  }

  // Chromatic aberration: additive red/blue channel copies, shifted opposite ways
  function drawAberration(clear) {
    const bw = cFx.width, bh = cFx.height;
    if (!fxTmp) { fxTmp = document.createElement('canvas'); fxTmpCtx = fxTmp.getContext('2d'); }
    if (fxTmp.width !== bw || fxTmp.height !== bh) { fxTmp.width = bw; fxTmp.height = bh; }
    const amt = +abEl.value / 100;
    const off = 1 + amt * 6 + beatFlash * amt * 12;
    if (clear) fxctx.clearRect(0, 0, bw, bh);
    fxctx.globalCompositeOperation = 'lighter';
    // isolate + draw red channel shifted right
    isolateChannel('#ff0000', bw, bh);
    fxctx.drawImage(fxTmp, off, 0, bw, bh);
    // isolate + draw blue channel shifted left
    isolateChannel('#0000ff', bw, bh);
    fxctx.drawImage(fxTmp, -off, 0, bw, bh);
    fxctx.globalCompositeOperation = 'source-over';
  }
  function isolateChannel(tint, bw, bh) {
    fxTmpCtx.globalCompositeOperation = 'source-over';
    fxTmpCtx.clearRect(0, 0, bw, bh);
    fxTmpCtx.drawImage(c3d, 0, 0, bw, bh);
    fxTmpCtx.globalCompositeOperation = 'multiply';
    fxTmpCtx.fillStyle = tint;
    fxTmpCtx.fillRect(0, 0, bw, bh);
    fxTmpCtx.globalCompositeOperation = 'source-over';
  }
})();
