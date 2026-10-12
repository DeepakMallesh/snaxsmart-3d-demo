// @ts-nocheck
import * as THREE from './vendor/three.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const F = 0.425; // front face z
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function rr(w, h, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function holeRect(x0, y0, x1, y1) {
  const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0); return p;
}
function roundRectPath(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

const DESIGNS = [
  { n: 'Yogabar', s: 'PROTEIN BAR', a: '#e8541e', b: '#b93a10', t: '#fff', k: '#F8D800', kind: 'bag' },
  { n: 'Too Yumm!', s: 'MULTIGRAIN', a: '#F8D800', b: '#e0b800', t: '#b3261e', k: '#b3261e', kind: 'bag' },
  { n: 'Slurrp Farm', s: 'MILLET BITES', a: '#2aa198', b: '#17776f', t: '#fff', k: '#ffd54a', kind: 'bag' },
  { n: 'Paper Boat', s: 'AAM PANNA', a: '#2a6ad1', b: '#17408f', t: '#fff', k: '#ffe08a', kind: 'carton' },
  { n: 'Raw Pressery', s: 'COLD PRESSED', a: '#f08a1c', b: '#c96a08', t: '#fff', k: '#fff', kind: 'bottle' },
  { n: 'Roasted Nuts', s: 'HEALTHY MIX', a: '#8a5a2b', b: '#5e3a17', t: '#fff', k: '#F8D800', kind: 'bag' },
];
const texCache = {};
function packTex(d) {
  if (texCache[d.n]) return texCache[d.n];
  const t = canvasTex(256, 384, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, d.a); g.addColorStop(1, d.b);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.14)'; x.beginPath(); x.arc(w * .85, h * .22, 90, 0, 7); x.fill();
    x.fillStyle = d.k; x.fillRect(0, h * .60, w, 12);
    x.fillStyle = d.t; x.textAlign = 'center'; x.font = 'bold 44px Arial'; x.fillText(d.n, w / 2, h * .42, w - 30);
    x.font = 'bold 22px Arial'; x.fillStyle = d.k; x.fillText(d.s, w / 2, h * .52);
    x.fillStyle = 'rgba(255,255,255,.9)'; x.font = 'bold 20px Arial'; x.fillText('FSSAI', w / 2, h * .82);
    x.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 14; i++) x.fillRect(0, i * 6, w, 2);
    x.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 14; i++) x.fillRect(0, h - 84 + i * 6, w, 2);
  });
  texCache[d.n] = t; return t;
}
function makePack(d) {
  const g = new THREE.Group();
  const front = new THREE.MeshStandardMaterial({ map: packTex(d), roughness: .45, metalness: .1 });
  const side = new THREE.MeshStandardMaterial({ color: d.b, roughness: .5, metalness: .1 });
  let m;
  if (d.kind === 'bottle') {
    m = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .15, 24), new THREE.MeshPhysicalMaterial({ color: d.a, roughness: .15, transmission: 0, clearcoat: 1 }));
    const label = new THREE.Mesh(new THREE.CylinderGeometry(.0305, .0305, .075, 24, 1, true), new THREE.MeshStandardMaterial({ map: packTex(d), roughness: .5 }));
    label.rotation.y = -Math.PI / 2; label.position.y = -.01;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.016, .018, .026, 16), new THREE.MeshStandardMaterial({ color: '#1F3A0D', roughness: .4 }));
    cap.position.y = .088; g.add(m, label, cap); g.userData.h = .17;
  } else if (d.kind === 'carton') {
    m = new THREE.Mesh(new THREE.BoxGeometry(.05, .13, .05), [side, side, side, side, front, front]);
    g.add(m); g.userData.h = .13;
  } else {
    m = new THREE.Mesh(new THREE.BoxGeometry(.085, .125, .022, 1, 1, 1), [side, side, side, side, front, side]);
    m.castShadow = false; g.add(m);
    const top = new THREE.Mesh(new THREE.BoxGeometry(.088, .012, .026), new THREE.MeshStandardMaterial({ color: d.b, roughness: .5 }));
    top.position.y = .067; g.add(top); g.userData.h = .135;
  }
  return g;
}

export function createMachine(host, opts) {
  opts = opts || {};
  const logoUrl = opts.logo;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab';

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(28, 1, .1, 50);

  // lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8aa070, .55));
  const key = new THREE.DirectionalLight(0xfff4e0, 2.2); key.position.set(1.6, 4.6, 2.4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 1; key.shadow.camera.far = 12;
  key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4; key.shadow.bias = -0.0004; key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfe8a8, .9); rim.position.set(-3, 2, -2); scene.add(rim);

  const root = new THREE.Group(); scene.add(root);
  const mach = new THREE.Group(); root.add(mach);

  // ground shadow
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: .09 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.0; ground.receiveShadow = true; root.add(ground);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.2), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(10,25,0,.55)'); g.addColorStop(.55, 'rgba(10,25,0,.22)'); g.addColorStop(1, 'rgba(10,25,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = -1.012; root.add(blob);

  // body (rounded, with window + tray holes)
  const WIN = { x0: -.44, x1: .14, y0: -.45, y1: .72 }, TRAY = { x0: -.44, x1: .14, y0: -.93, y1: -.67 };
  const shape = rr(.96, 1.96, .05);
  shape.holes.push(holeRect(WIN.x0, WIN.y0, WIN.x1, WIN.y1), holeRect(TRAY.x0, TRAY.y0, TRAY.x1, TRAY.y1));
  const depth = .81;
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 5, curveSegments: 10 });
  bodyGeo.translate(0, 0, -depth / 2);
  const paint = new THREE.MeshPhysicalMaterial({ color: 0x3b7208, roughness: .38, metalness: .15, clearcoat: .8, clearcoatRoughness: .25, envMapIntensity: .9 });
  const body = new THREE.Mesh(bodyGeo, paint); body.castShadow = true; body.receiveShadow = true; mach.add(body);

  // back plate + cavity back walls
  const backPlate = new THREE.Mesh(new THREE.BoxGeometry(.98, 1.98, .02), paint); backPlate.position.z = -F + .01; mach.add(backPlate);
  const cavBackMat = new THREE.MeshStandardMaterial({ color: 0xf1f5ea, emissive: 0xdfe8d0, emissiveIntensity: .45, roughness: .9 });
  const cavBack = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), cavBackMat); cavBack.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, -.05); mach.add(cavBack);
  const trayBack = new THREE.Mesh(new THREE.PlaneGeometry(TRAY.x1 - TRAY.x0, TRAY.y1 - TRAY.y0), new THREE.MeshStandardMaterial({ color: 0x151a12, roughness: .9 })); trayBack.position.set((TRAY.x0 + TRAY.x1) / 2, (TRAY.y0 + TRAY.y1) / 2, .12); mach.add(trayBack);
  // cavity liners (side walls light)
  const linerMat = new THREE.MeshStandardMaterial({ color: 0xe8eee0, emissive: 0xcfdcc0, emissiveIntensity: .22, roughness: .9, side: THREE.DoubleSide });
  const wcx = (WIN.x0 + WIN.x1) / 2, wcy = (WIN.y0 + WIN.y1) / 2, ww = WIN.x1 - WIN.x0, wh = WIN.y1 - WIN.y0, cd = F + .05;
  [[WIN.x0 + .001, wcy, 0, 'x'], [WIN.x1 - .001, wcy, 0, 'x']].forEach(p => { const m = new THREE.Mesh(new THREE.PlaneGeometry(cd, wh), linerMat); m.rotation.y = Math.PI / 2; m.position.set(p[0], p[1], (F - .05) / 2); mach.add(m); });
  [[wcx, WIN.y1 - .001], [wcx, WIN.y0 + .001]].forEach(p => { const m = new THREE.Mesh(new THREE.PlaneGeometry(ww, cd), linerMat); m.rotation.x = Math.PI / 2; m.position.set(p[0], p[1], (F - .05) / 2); mach.add(m); });
  // tray liners
  const tcx = (TRAY.x0 + TRAY.x1) / 2, tcy = (TRAY.y0 + TRAY.y1) / 2;
  const trayFloor = new THREE.Mesh(new THREE.BoxGeometry(TRAY.x1 - TRAY.x0, .02, .32), new THREE.MeshStandardMaterial({ color: 0x2a2f25, roughness: .35, metalness: .5 })); trayFloor.position.set(tcx, TRAY.y0 + .01, F - .1); mach.add(trayFloor);
  const trayLight = new THREE.PointLight(0xfff0c0, 0, 1.2); trayLight.position.set(tcx, tcy + .05, F + .05); mach.add(trayLight);

  // shelves + products
  const shelfY = [-.38, -.10, .18, .46];
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0xd9dfd0, roughness: .3, metalness: .8, envMapIntensity: 1.2 });
  const layout = [[0, 1, 2, 4, 5], [4, 0, 3, 1, 2], [0, 3, 2, 1, 5], [1, 4, 2, 0, 3]];
  const slots = []; let hotSlot = null;
  shelfY.forEach((sy, r) => {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(ww - .02, .014, .36), shelfMat); sh.position.set(wcx, sy, F - .17); sh.castShadow = true; mach.add(sh);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(ww - .02, .03, .008), new THREE.MeshStandardMaterial({ color: 0xc7cfbd, roughness: .3, metalness: .7 })); lip.position.set(wcx, sy + .01, F - .0); mach.add(lip);
    // price/label strip
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(ww - .04, .02), new THREE.MeshBasicMaterial({ map: canvasTex(512, 24, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#1F3A0D'; x.font = 'bold 18px Arial'; x.textAlign = 'center'; for (let i = 0; i < 5; i++) x.fillText('ABCDE'[r] === undefined ? '' : 'ABCD'[r] + (i + 1), 52 + i * 102, 18); }) })); lab.position.set(wcx, sy - .006, F + .002); mach.add(lab);
    for (let i = 0; i < 5; i++) {
      const d = DESIGNS[layout[r][i]]; const p = makePack(d);
      const x = wcx - ww / 2 + .065 + i * ((ww - .13) / 4);
      p.scale.setScalar(1.15); const h = p.userData.h * 1.15; p.position.set(x, sy + .007 + h / 2, F - .13 + (d.kind === 'bag' ? 0 : .02));
      if (d.kind === 'bag') p.rotation.x = -.07;
      mach.add(p); slots.push({ r, i, p, d });
      if (r === 2 && i === 0) hotSlot = { p, x, y: sy + .007 + h / 2, z: p.position.z, d };
    }
  });
  // spare "drop" pack (same as hot slot design)
  const dropPack = makePack(hotSlot.d); dropPack.scale.setScalar(1.15); dropPack.visible = false; mach.add(dropPack);

  // top LED strip + glow
  const led = new THREE.Mesh(new THREE.PlaneGeometry(ww - .04, .02), new THREE.MeshBasicMaterial({ color: 0xffffff })); led.position.set(wcx, WIN.y1 - .02, F - .1); led.rotation.x = Math.PI / 2; mach.add(led);
  const inner = new THREE.PointLight(0xf6ffe8, 1.2, 2.2); inner.position.set(wcx, .5, .1); mach.add(inner);
  const inner2 = new THREE.PointLight(0xf6ffe8, .8, 2); inner2.position.set(wcx, -.2, .15); mach.add(inner2);

  // window frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xb9c2ae, roughness: .25, metalness: .85, envMapIntensity: 1.3 });
  [[wcx, WIN.y1 + .012, ww + .04, .024], [wcx, WIN.y0 - .012, ww + .04, .024]].forEach(a => { const m = new THREE.Mesh(new THREE.BoxGeometry(a[2], a[3], .03), frameMat); m.position.set(a[0], a[1], F + .008); mach.add(m); });
  [[WIN.x0 - .012], [WIN.x1 + .012]].forEach(a => { const m = new THREE.Mesh(new THREE.BoxGeometry(.024, wh + .048, .03), frameMat); m.position.set(a[0], wcy, F + .008); mach.add(m); });
  // glass
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .04, metalness: 0, transparent: true, opacity: .11, envMapIntensity: 2, clearcoat: 1, depthWrite: false });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), glassMat); glass.position.set(wcx, wcy, F + .012); glass.renderOrder = 5; mach.add(glass);
  const streak = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .55, map: canvasTex(128, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(.33, 'rgba(255,255,255,0)'); g.addColorStop(.55, 'rgba(255,255,255,.28)'); g.addColorStop(.62, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
  streak.position.set(wcx, wcy, F + .014); streak.renderOrder = 6; mach.add(streak);

  // hot rack highlight (row C = index 2)
  const hotY = shelfY[2] + .075;
  const hotMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9, map: canvasTex(512, 96, (x, w, h) => { x.strokeStyle = '#d9ff7a'; x.lineWidth = 6; x.shadowColor = '#b6f04a'; x.shadowBlur = 16; roundRectPath(x, 10, 10, w - 20, h - 20, 14); x.stroke(); x.stroke(); }) });
  const hot = new THREE.Mesh(new THREE.PlaneGeometry(ww - .01, .2), hotMat); hot.position.set(wcx, hotY, F + .018); hot.renderOrder = 7; mach.add(hot);
  const pinTex = canvasTex(64, 64, (x, w, h) => { x.fillStyle = '#F8D800'; x.shadowColor = '#F8D800'; x.shadowBlur = 14; x.beginPath(); x.arc(32, 32, 12, 0, 7); x.fill(); x.fillStyle = '#1F3A0D'; x.font = 'bold 14px Arial'; x.textAlign = 'center'; x.shadowBlur = 0; x.fillText('+', 32, 37); });
  const pin = new THREE.Mesh(new THREE.PlaneGeometry(.07, .07), new THREE.MeshBasicMaterial({ map: pinTex, transparent: true, depthWrite: false })); pin.position.set(WIN.x1 - .06, hotY, F + .02); pin.renderOrder = 8; mach.add(pin);
  const hitMesh = new THREE.Mesh(new THREE.PlaneGeometry(ww, .24), new THREE.MeshBasicMaterial({ visible: false })); hitMesh.position.set(wcx, hotY, F + .02); mach.add(hitMesh);

  // decals: header, script text
  const decal = (w, h, x, y, tex, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })); m.position.set(x, y, z || F + .004); mach.add(m); return m; };
  const logoImg = new Image(); logoImg.crossOrigin = 'anonymous';
  const headerTex = canvasTex(1024, 220, (x, w, h) => { x.clearRect(0, 0, w, h); }); const sideLogoTex = canvasTex(512, 1024, () => { });
  function drawHeader() {
    const c = headerTex.image, x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height);
    const g = x.createLinearGradient(0, 0, c.width, 0); g.addColorStop(0, '#2a5a06'); g.addColorStop(1, '#4a8a10'); x.fillStyle = g; roundRectPath(x, 6, 6, c.width - 12, c.height - 12, 28); x.fill();
    x.fillStyle = '#fff'; x.font = 'bold 74px Arial'; x.textAlign = 'left'; x.fillText('snaxsmart', 330, 112);
    x.fillStyle = '#F8D800'; x.font = 'italic 36px Georgia'; x.fillText('guilt-free snacking', 332, 164);
    if (logoImg.complete && logoImg.naturalWidth) x.drawImage(logoImg, 60, 20, 240, 180);
    headerTex.needsUpdate = true;
    const s = sideLogoTex.image, y = s.getContext('2d'); const sg = y.createLinearGradient(0, 0, s.width, s.height); sg.addColorStop(0, '#3f7a0a'); sg.addColorStop(1, '#1F3A0D'); y.fillStyle = sg; y.fillRect(0, 0, s.width, s.height);
    y.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 40; i++) y.fillRect(0, i * 26, s.width, 2);
    if (logoImg.complete && logoImg.naturalWidth) y.drawImage(logoImg, 90, 40, 330, 250);
    y.save(); y.translate(300, 960); y.rotate(-Math.PI / 2); y.fillStyle = '#F8D800'; y.font = 'italic 96px Georgia'; y.textAlign = 'left'; y.fillText('guilt-free snacking', 0, 0); y.restore();
    sideLogoTex.needsUpdate = true;
  }
  logoImg.onload = drawHeader; if (logoUrl) logoImg.src = logoUrl; drawHeader();
  decal(.92, .19, 0, .865, headerTex, F + .004);
  decal(.58, .12, wcx, -.545, canvasTex(512, 106, (x, w, h) => { x.fillStyle = '#F8D800'; x.font = 'italic bold 62px Georgia'; x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 6; x.fillText('guilt-free snacking', w / 2, 72); }));
  // side panels
  [[1, Math.PI / 2], [-1, -Math.PI / 2]].forEach(s => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.74, 1.7), new THREE.MeshStandardMaterial({ map: sideLogoTex, roughness: .5, metalness: .1 })); m.position.set(s[0] * .5005, 0, 0); m.rotation.y = s[1]; mach.add(m); });
  // back vents
  const backDecal = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.5), new THREE.MeshStandardMaterial({ roughness: .8, map: canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#16300a'; x.fillRect(0, 0, w, h); x.fillStyle = '#0b1a05'; for (let i = 0; i < 22; i++) x.fillRect(30, 20 + i * 22, w - 60, 8); x.fillStyle = '#F8D800'; x.font = 'bold 22px Arial'; x.textAlign = 'center'; x.fillText('+91 98807 98807', w / 2, h - 30); }) }));
  backDecal.position.z = -F - .001; backDecal.rotation.y = Math.PI; mach.add(backDecal);

  // control panel (right)
  const PX = .33;
  const panelBase = new THREE.Mesh(new THREE.BoxGeometry(.27, 1.4, .02), new THREE.MeshStandardMaterial({ color: 0x143005, roughness: .5, metalness: .3 })); panelBase.position.set(PX, .07, F + .008); mach.add(panelBase);
  const scrCanvas = document.createElement('canvas'); scrCanvas.width = 256; scrCanvas.height = 160;
  const scrTex = new THREE.CanvasTexture(scrCanvas); scrTex.colorSpace = THREE.SRGBColorSpace;
  function setScreen(l1, l2, l3, ok) {
    const x = scrCanvas.getContext('2d'); x.fillStyle = '#071403'; x.fillRect(0, 0, 256, 160);
    x.fillStyle = ok ? '#b6f04a' : '#8fd13a'; x.textAlign = 'center'; x.font = 'bold 40px Courier New'; x.fillText(l1, 128, 62, 240);
    x.font = 'bold 22px Courier New'; x.fillStyle = '#d9ff9e'; x.fillText(l2, 128, 100, 240); x.font = '18px Courier New'; x.fillStyle = '#7fb12f'; x.fillText(l3 || '', 128, 134, 240); scrTex.needsUpdate = true;
  }
  setScreen('SNAX', 'Pick a snack', 'Rack A1 - D5');
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.21, .13), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false })); scr.position.set(PX, .58, F + .026); mach.add(scr);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(.23, .15, .012), new THREE.MeshStandardMaterial({ color: 0x050805, roughness: .3, metalness: .6 })); bezel.position.set(PX, .58, F + .016); mach.add(bezel);
  // keypad
  const keyMat = new THREE.MeshStandardMaterial({ color: 0xe9ede2, roughness: .35, metalness: .4 });
  const labels = '123456789*0#';
  for (let k = 0; k < 12; k++) {
    const cx = PX + (k % 3 - 1) * .062, cy = .39 - Math.floor(k / 3) * .062;
    const key = new THREE.Mesh(new THREE.CylinderGeometry(.021, .021, .012, 24), keyMat);
    key.rotation.x = Math.PI / 2; key.position.set(cx, cy, F + .02); mach.add(key);
    const kl = new THREE.Mesh(new THREE.PlaneGeometry(.036, .036), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#1F3A0D'; x.font = 'bold 40px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(labels[k], 32, k === 9 ? 40 : 34); }) }));
    kl.position.set(cx, cy, F + .0265); mach.add(kl);
  }
  // UPI QR plate
  const qrTex = canvasTex(256, 330, (x, w, h) => {
    x.fillStyle = '#fff'; roundRectPath(x, 0, 0, w, h, 18); x.fill(); x.fillStyle = '#1F3A0D'; x.font = 'bold 30px Arial'; x.textAlign = 'center'; x.fillText('Pay with UPI', w / 2, 40);
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    x.fillStyle = '#201818'; const n = 21, cs = 9, ox = (w - n * cs) / 2, oy = 56;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const inFinder = (i < 7 && j < 7) || (i > 13 && j < 7) || (i < 7 && j > 13); if (!inFinder && rnd() > .5) x.fillRect(ox + i * cs, oy + j * cs, cs, cs); }
    [[0, 0], [14, 0], [0, 14]].forEach(p => { x.fillRect(ox + p[0] * cs, oy + p[1] * cs, 7 * cs, 7 * cs); x.fillStyle = '#fff'; x.fillRect(ox + (p[0] + 1) * cs, oy + (p[1] + 1) * cs, 5 * cs, 5 * cs); x.fillStyle = '#201818'; x.fillRect(ox + (p[0] + 2) * cs, oy + (p[1] + 2) * cs, 3 * cs, 3 * cs); });
    x.fillStyle = '#407808'; x.font = 'bold 22px Arial'; x.fillText('GPay  PhonePe  Paytm', w / 2, h - 18);
  });
  const qr = new THREE.Mesh(new THREE.PlaneGeometry(.2, .258), new THREE.MeshStandardMaterial({ map: qrTex, roughness: .3, metalness: 0 })); qr.position.set(PX, -.02 - .08, F + .02); mach.add(qr);
  const payLed = new THREE.Mesh(new THREE.BoxGeometry(.2, .016, .012), new THREE.MeshBasicMaterial({ color: 0x2a4a12, toneMapped: false })); payLed.position.set(PX, -.02 - .22, F + .02); mach.add(payLed);
  // tap pay plate
  const tap = new THREE.Mesh(new THREE.PlaneGeometry(.17, .15), new THREE.MeshStandardMaterial({ roughness: .4, map: canvasTex(256, 220, (x, w, h) => { x.fillStyle = '#F8D800'; roundRectPath(x, 0, 0, w, h, 24); x.fill(); x.fillStyle = '#201818'; x.font = 'bold 38px Arial'; x.textAlign = 'center'; x.fillText('TAP', w / 2, 88); x.fillText('& PAY', w / 2, 134); x.lineWidth = 8; x.strokeStyle = '#201818'; for (let i = 1; i < 4; i++) { x.beginPath(); x.arc(w / 2, 175, i * 12, Math.PI * 1.2, Math.PI * 1.8); x.stroke(); } }) })); tap.position.set(PX, -.55, F + .02); mach.add(tap);
  // feet / plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(.94, .05, .78), new THREE.MeshStandardMaterial({ color: 0x0f1a09, roughness: .6, metalness: .4 })); plinth.position.y = -1.0; mach.add(plinth);
  mach.position.y = 0;

  // state
  const state = { rot: -0.55, tgt: -0.55, vel: 0, drag: false, lx: 0, moved: 0, idle: !!opts.idle, visible: true, dropT: 0, glow: true };
  mach.rotation.y = state.rot;
  const dom = renderer.domElement;
  dom.addEventListener('pointerdown', e => { state.drag = true; state.lx = e.clientX; state.vel = 0; state.moved = 0; try { dom.setPointerCapture(e.pointerId); } catch (_) { } dom.style.cursor = 'grabbing'; });
  dom.addEventListener('pointermove', e => { if (!state.drag) return; const d = e.clientX - state.lx; state.lx = e.clientX; state.moved += Math.abs(d); state.tgt += d * .012; state.vel = d * .012; });
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  const hitAt = e => { const r = dom.getBoundingClientRect(); v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, cam); return ray.intersectObject(hitMesh).length > 0; };
  state.hover = false;
  const setHover = v => { if (v === state.hover) return; state.hover = v; dom.style.cursor = v ? 'pointer' : 'grab'; if (opts.onHover) opts.onHover(v); };
  dom.addEventListener('pointermove', e => { if (state.drag || e.pointerType === 'touch' || !opts.onHover) return; setHover(hitAt(e)); });
  dom.addEventListener('pointerleave', () => { if (!state.drag) setHover(false); });
  const up = e => {
    if (!state.drag) return; state.drag = false; dom.style.cursor = state.hover ? 'pointer' : 'grab';
    if (state.moved < 5 && e.pointerType === 'touch' && opts.onHover) { setHover(hitAt(e) ? !state.hover : false); }
  };
  dom.addEventListener('pointerup', up); dom.addEventListener('pointercancel', up);

  function size() {
    const w = host.clientWidth || 400, h = host.clientHeight || 500; renderer.setSize(w, h, false); cam.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)); const dist = Math.max(1.3 / t, 1.05 / (t * cam.aspect)) * 1.04;
    baseDist = dist; updateCam(); cam.updateProjectionMatrix();
  }
  let baseDist = 4; const cv = { x: 0, y: -.02, z: 0, k: 1 }, cvT = { x: 0, y: -.02, z: 0, k: 1 }; const tmpV = new THREE.Vector3(), baseLook = new THREE.Vector3(0, -.02, 0), dirV = new THREE.Vector3(0, .18 + .02, 1).normalize();
  function updateCam() {
    mach.updateMatrixWorld(true); tmpV.set(cv.x, cv.y, cv.z); mach.localToWorld(tmpV);
    const look = tmpV.clone(); const d = baseDist / cv.k;
    cam.position.copy(look).addScaledVector(dirV, d); cam.lookAt(look);
  }
  size(); if (window.ResizeObserver) new ResizeObserver(size).observe(host); else addEventListener('resize', size);

  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches; const t0 = performance.now();
  const ease = x => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
  const tray = { y: TRAY.y0 + .02 + (hotSlot.p.userData.h * 1.15) / 2, x: tcx + .02, z: F - .05 };
  function applyDrop() {
    const t = state.dropT;
    if (t <= 0) { hotSlot.p.visible = true; dropPack.visible = false; trayLight.intensity = 0; return; }
    hotSlot.p.visible = false; dropPack.visible = true;
    const f = ease((t - .08) / .62), y0 = hotSlot.y, y1 = tray.y;
    let y = y0 + (y1 - y0) * (f * f);
    if (t > .7) { const b = Math.max(0, Math.sin((t - .7) * 22)) * (1 - t) * .09; y = y1 + b; }
    dropPack.position.set(hotSlot.x + (tray.x - hotSlot.x) * f, y, hotSlot.z + (tray.z - hotSlot.z) * f);
    dropPack.rotation.set(-.07 * (1 - f) - f * .25, 0, (f * 6 * Math.sin(f * 5)) * .06 + f * .22);
    trayLight.intensity = t > .65 ? Math.min(1.6, (t - .65) * 12) : 0;
  }
  function frame(now) {
    if (state.dead) return; requestAnimationFrame(frame);
    if (document.hidden || window.__snaxPaused) return;
    if (!state.drag) {
      if (Math.abs(state.vel) > .0004) { state.tgt += state.vel; state.vel *= .93; }
      else if (opts.spin && !reduce && !state.hover) state.tgt -= .0032;
      else if (state.idle && !reduce) state.tgt += (-0.55 + Math.sin((now - t0) / 1700) * .38 - state.tgt) * .012;
      else if (opts.rest !== undefined) state.tgt += (opts.rest - state.tgt) * .02;
    }
    state.rot += (state.tgt - state.rot) * .14; mach.rotation.y = state.rot;
    const s = (Math.sin((now - t0) / 420) + 1) / 2; hotMat.opacity = state.glow ? .45 + s * .5 : 0; pin.visible = state.glow; pin.scale.setScalar(1 + s * .18);
    applyDrop();
    if (Math.abs(cv.x - cvT.x) + Math.abs(cv.y - cvT.y) + Math.abs(cv.z - cvT.z) + Math.abs(cv.k - cvT.k) > .0005 || cvT.k !== 1 || state.camDirty) { const e = 1 - Math.exp(-Math.min(.25, (now - (state.lastT || now)) / 1000) * 4.5); cv.x += (cvT.x - cv.x) * e; cv.y += (cvT.y - cv.y) * e; cv.z += (cvT.z - cv.z) * e; cv.k += (cvT.k - cv.k) * e; state.camDirty = false; }
    state.lastT = now; updateCam(); renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);
  return {
    setDrop(t) { state.dropT = t; },
    setGlow(v) { state.glow = v; },
    setScreen,
    setPaid(v) { payLed.material.color.set(v ? 0x7dff3a : 0x2a4a12); },
    setRest(a) { opts.rest = a; },
    setView(name, rotY) {
      const v = { full: [0, -.02, 0, 1], products: [wcx, .12, F, 2.35], qr: [.4, -.05, F, 3.2], tray: [tcx - .05, -.78, F, 2.6] }[name] || [0, -.02, 0, 1];
      cvT.x = v[0]; cvT.y = v[1]; cvT.z = v[2]; cvT.k = v[3]; state.camDirty = true;
      if (rotY !== undefined) { opts.spin = false; state.idle = false; opts.rest = rotY; state.tgt = rotY; state.vel = 0; }
    },
    snapshot(w, h, rotY, drawFn) {
      const pr = renderer.getPixelRatio(); renderer.setPixelRatio(1); renderer.setSize(w, h, false); cam.aspect = w / h;
      const t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)); const dist = Math.max(1.3 / t, 1.05 / (t * cam.aspect)) * 1.0;
      baseDist = dist; cv.x=0;cv.y=-.02;cv.z=0;cv.k=1; updateCam(); cam.updateProjectionMatrix();
      state.rot = state.tgt = rotY; mach.rotation.y = rotY; if (drawFn) drawFn();
      hotMat.opacity = 0; pin.visible = false; applyDrop(); mach.updateMatrixWorld(true); cam.updateMatrixWorld(true);
      renderer.render(scene, cam); const url = dom.toDataURL('image/png');
      const P = (x, y) => { const v = new THREE.Vector3(x, y, F).applyMatrix4(mach.matrixWorld).project(cam); return [(v.x + 1) / 2, (1 - v.y) / 2]; };
      const pts = { products: P(wcx, .15), qr: P(.33, -.1), tray: P(tcx, -.78), full: [.5, .5] };
      renderer.setPixelRatio(pr); size(); return { url, pts };
    },
    destroy() { state.dead = true; try { renderer.dispose(); renderer.forceContextLoss(); } catch (_) { } dom.remove(); },
    el: dom,
  };
}
