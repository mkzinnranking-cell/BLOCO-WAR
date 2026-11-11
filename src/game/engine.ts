// @ts-nocheck
// ============ MOTOR PRINCIPAL: renderização, jogador, armas, IA, efeitos ============
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CHALLENGES, WMAP, ENEMY, ALLY_LOOKS, loadSave, writeSave, levelOf, OPT, UNIFORMS } from './data';
import { A } from './audio';
import { World } from './world';
import { buildSoldier, attachGun, animateSoldier, showFlash, buildGun, makeFlash, buildHeli, buildVehicle, buildProp, GEAR, PB } from './models';
import * as Modes from './modes';

const V3 = THREE.Vector3;
const TAU = Math.PI * 2;
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const angDiff = (a: number, b: number) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const yawTo = (dx: number, dz: number) => Math.atan2(-dx, -dz);
const boxG = new THREE.BoxGeometry(1, 1, 1);

// ================= sistemas de partículas =================
class Particles {
  n: number; i = 0; pos: Float32Array; vel: Float32Array; col: Float32Array; size: Float32Array; s0: Float32Array; a0: Float32Array; life: Float32Array; age: Float32Array; grow: Float32Array; drag: Float32Array; grav: Float32Array; points: any; geo: any; mat: any;
  constructor(n: number, additive: boolean) {
    this.n = n; this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.col = new Float32Array(n * 4); this.size = new Float32Array(n); this.s0 = new Float32Array(n); this.a0 = new Float32Array(n); this.life = new Float32Array(n); this.age = new Float32Array(n); this.grow = new Float32Array(n); this.drag = new Float32Array(n); this.grav = new Float32Array(n);
    this.geo = new THREE.BufferGeometry(); this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage)); this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage)); this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { uScale: { value: 600 } },
      vertexShader: 'attribute vec4 aColor; attribute float aSize; uniform float uScale; varying vec4 vC; void main(){ vC=aColor; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*uScale/max(0.1,-mv.z); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'varying vec4 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.08,d); if(a<0.01) discard; gl_FragColor=vec4(vC.rgb, vC.a*a); }' });
    this.points = new THREE.Points(this.geo, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 5;
  }
  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, size: number, grow: number, life: number, r: number, g: number, b: number, a: number, drag = 1, grav = 0) {
    const i = this.i; this.i = (this.i + 1) % this.n; const p = i * 3; this.pos[p] = x; this.pos[p + 1] = y; this.pos[p + 2] = z; this.vel[p] = vx; this.vel[p + 1] = vy; this.vel[p + 2] = vz;
    this.s0[i] = size; this.grow[i] = grow; this.life[i] = life; this.age[i] = 0; this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.a0[i] = a; this.drag[i] = drag; this.grav[i] = grav; this.size[i] = size;
  }
  update(dt: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue; this.age[i] += dt; const t = this.age[i] / this.life[i];
      if (t >= 1) { this.life[i] = 0; this.size[i] = 0; this.col[i * 4 + 3] = 0; continue; }
      const p = i * 3, dr = Math.max(0, 1 - this.drag[i] * dt); this.vel[p] *= dr; this.vel[p + 1] = this.vel[p + 1] * dr - this.grav[i] * dt; this.vel[p + 2] *= dr;
      this.pos[p] += this.vel[p] * dt; this.pos[p + 1] += this.vel[p + 1] * dt; this.pos[p + 2] += this.vel[p + 2] * dt; this.size[i] = this.s0[i] + this.grow[i] * this.age[i]; this.col[i * 4 + 3] = this.a0[i] * (1 - t) * Math.min(1, t * 12 + 0.3);
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aColor.needsUpdate = true; this.geo.attributes.aSize.needsUpdate = true;
  }
}
class Debris {
  n: number; mesh: any; d: any[] = []; i = 0; m = new THREE.Matrix4(); q = new THREE.Quaternion(); e = new THREE.Euler(); p = new THREE.Vector3(); s = new THREE.Vector3(); c = new THREE.Color();
  constructor(n: number, world: any) {
    this.n = n; this.mesh = new THREE.InstancedMesh(boxG, new THREE.MeshStandardMaterial({ roughness: 0.8 }), n); this.mesh.castShadow = false; this.mesh.frustumCulled = false;
    for (let i = 0; i < n; i++) { this.d.push({ life: 0, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0, sx: 0, sy: 0, sz: 0, s: 0 }); this.m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this.m); this.mesh.setColorAt(i, this.c.setHex(0xffffff)); } this.world = world;
  }
  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, size: number, color: number, life = 2.5) { const i = this.i; this.i = (this.i + 1) % this.n; Object.assign(this.d[i], { life, x, y, z, vx, vy, vz, rx: rnd(0, 6), ry: rnd(0, 6), rz: rnd(0, 6), sx: rnd(-8, 8), sy: rnd(-8, 8), sz: rnd(-8, 8), s: size }); this.mesh.setColorAt(i, this.c.setHex(color)); this.mesh.instanceColor.needsUpdate = true; }
  update(dt: number) {
    for (let i = 0; i < this.n; i++) {
      const o = this.d[i]; if (o.life <= 0) continue; o.life -= dt; if (o.life <= 0) { this.m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this.m); continue; }
      o.vy -= 16 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt; if (o.y < o.s * 0.5) { o.y = o.s * 0.5; o.vy *= -0.35; o.vx *= 0.6; o.vz *= 0.6; o.sx *= 0.5; o.sy *= 0.5; o.sz *= 0.5; }
      o.rx += o.sx * dt; o.ry += o.sy * dt; o.rz += o.sz * dt; this.e.set(o.rx, o.ry, o.rz); this.q.setFromEuler(this.e); const sc = o.s * Math.min(1, o.life * 2); this.p.set(o.x, o.y, o.z); this.s.set(sc, sc, sc * 1.4); this.m.compose(this.p, this.q, this.s); this.mesh.setMatrixAt(i, this.m);
    } this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ================= classe principal =================
export class Game {
  canvas: any; cb: any; renderer: any; scene: any; camera: any; vmScene: any; vmCam: any; composer: any; bloom: any; save: any; settings: any; state = 'menu'; world: any = null; clock = new THREE.Clock(); keys: any = {}; mouse = [false, false, false]; uid = 0;
  actors: any[] = []; props: any[] = []; projs: any[] = []; pickups: any[] = []; interactables: any[] = []; smokes: any[] = []; fireList: any[] = []; markers: any[] = []; flyers: any[] = []; sessionXp = 0; hud: any = {}; hudT = 0; shake = 0; pathBudget = 3; tracers: any[] = []; time = 0; mode: any = null; menu: any = null; pq = 1; lastFrame = 0; weather: any = null; lampLights: any[] = []; lampT = 0; mobileMoveX = 0; mobileMoveY = 0; mobileLookDX = 0; mobileLookDY = 0; mobileFire = false; mobileAds = false; mobileJump = false; mobileCrouch = false; mobileRun = false; mouseDX = 0; mouseDY = 0; scopeOn = false; mission: any = null; showcase: any = null;
  constructor(canvas: HTMLCanvasElement, cb: any) {
    this.canvas = canvas; this.cb = cb; this.save = loadSave(); this.settings = this.save.settings;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.autoClear = true;
    this.camera = new THREE.PerspectiveCamera(80, 1, 0.08, 1400); this.vmScene = new THREE.Scene(); this.vmCam = new THREE.PerspectiveCamera(58, 1, 0.01, 10);
    const vh = new THREE.HemisphereLight(0xffffff, 0x666655, 1.5), vd = new THREE.DirectionalLight(0xffffff, 2.2); vd.position.set(0.5, 1, 0.8); this.vmScene.add(vh, vd);
    this.scene = new THREE.Scene(); this.scene.add(this.camera);
    window.addEventListener('resize', () => this.resize()); this.bindInput();
    this.applySettings(); this.resize(); this.buildMenu(); this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
  }
  // ---------- configurações e render ----------
  applySettings() {
    const s = this.settings; A.applyVolumes({ master: s.master, music: s.music, sfx: s.sfx }); const q = s.quality;
    this.pq = { low: 0.4, medium: 0.8, high: 1.2 }[s.particles] || 0.8; this.renderer.shadowMap.enabled = s.shadows !== 'off'; this.shadowSize = s.shadows === 'high' ? 2048 : 1024;
    this.camera.far = 1400; if (this.scene.fog && this.world) this.scene.fog.far = (s.dist * 1.4 + 80) * (this.world.fogDens || 0.9);
    this.useComposer = q !== 'low'; this.resize();
    if (this.world?.env?.sun) this.setShadowRes(this.world.env.sun);
  }
  setShadowRes(sun: any) { sun.castShadow = this.settings.shadows !== 'off'; if (sun.shadow.mapSize.x !== this.shadowSize) { sun.shadow.mapSize.set(this.shadowSize, this.shadowSize); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } } }
  resize() {
    const w = window.innerWidth, h = window.innerHeight; const pr = Math.min(window.devicePixelRatio || 1, 2) * (this.settings?.scale || 1);
    this.renderer.setPixelRatio(pr); this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.vmCam.aspect = w / h; this.vmCam.updateProjectionMatrix();
    this.pscale = (h * pr * 0.5) / Math.tan(THREE.MathUtils.degToRad(40));
    if (this.composer) { this.composer.setPixelRatio(pr); this.composer.setSize(w, h); }
    if (this.parts) for (const p of this.parts) p.mat.uniforms.uScale.value = this.pscale * 0.6;
  }
  makeComposer() {
    const w = window.innerWidth, h = window.innerHeight; const pr = Math.min(window.devicePixelRatio || 1, 2) * (this.settings.scale || 1);
    this.composer = new EffectComposer(this.renderer); this.composer.setPixelRatio(pr); this.composer.setSize(w, h);
    const rp = new RenderPass(this.scene, this.camera); this.composer.addPass(rp);
    const vp = new RenderPass(this.vmScene, this.vmCam); vp.clear = false; vp.clearDepth = true; this.composer.addPass(vp); this.vmPass = vp; this.mainPass = rp;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.32, 0.55, 0.95); this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass());
  }
  // ---------- cenas ----------
  newScene() {
    if (this.scene) { this.scene.traverse((o: any) => { if (o.isInstancedMesh) o.dispose(); }); }
    this.scene = new THREE.Scene(); this.scene.add(this.camera); this.actors = []; this.props = []; this.projs = []; this.pickups = []; this.interactables = []; this.smokes = []; this.fireList = []; this.markers = []; this.flyers = []; this.tracers = []; this.lampLights = [];
    const pq = this.pq; this.pN = new Particles(Math.floor(900 * pq) + 200, false); this.pA = new Particles(Math.floor(500 * pq) + 100, true); this.parts = [this.pN, this.pA]; for (const p of this.parts) { this.scene.add(p.points); p.mat.uniforms.uScale.value = this.pscale * 0.6; }
    this.debris = null; this.decals = null;
    const dg = new THREE.PlaneGeometry(0.14, 0.14); this.decals = new THREE.InstancedMesh(dg, new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.75, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }), 160); this.decals.frustumCulled = false; this.decN = 0; const zm = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < 160; i++) this.decals.setMatrixAt(i, zm); this.scene.add(this.decals);
    this.tracerMat = new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(boxG, this.tracerMat); m.visible = false; m.userData.life = 0; this.scene.add(m); this.tracers.push(m); } this.trI = 0;
    this.mLight = new THREE.PointLight(0xffb060, 0, 18, 2); this.scene.add(this.mLight); this.xLight = new THREE.PointLight(0xff9040, 0, 60, 2); this.scene.add(this.xLight);
    this.flash = new THREE.SpotLight(0xfff2d0, 0, 45, 0.45, 0.6, 1.4); this.flash.position.set(0, 0, 0); this.camera.add(this.flash); this.flash.target.position.set(0, 0, -1); this.camera.add(this.flash.target);
    const nl = this.settings.quality === 'low' ? 0 : this.settings.quality === 'high' ? 6 : 4; for (let i = 0; i < nl; i++) { const l = new THREE.PointLight(0xffe0a0, 0, 17, 2); this.scene.add(l); this.lampLights.push(l); }
    this.debris = new Debris(Math.floor(220 * pq) + 60, null); this.scene.add(this.debris.mesh);
    if (this.useComposer) { if (!this.composer) this.makeComposer(); this.mainPass.scene = this.scene; }
  }
  setupWorld(themeId: string, o: any) {
    this.newScene(); this.world = new World(themeId, o); this.scene.add(this.world.group); const env = this.world.setupEnv(this.scene, this.renderer, this.settings.dist); this.setShadowRes(env.sun);
    this.camera.far = 1400; for (const f of this.world.fires) this.fireList.push(f);
    A.setAmbient(this.world.th.amb || (this.world.timeId === 'night' ? 'night' : ''), true, this.world.weather === 'clear' ? 0.1 : 0.22);
    this.setupWeather(); return this.world;
  }
  setupWeather() {
    const wx = this.world.weather; if (wx === 'clear' || wx === 'fog') { this.weather = null; return; } const n = this.settings.particles === 'low' ? 250 : 700; const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = rnd(-30, 30); pos[i * 3 + 1] = rnd(0, 20); pos[i * 3 + 2] = rnd(-30, 30); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const col = wx === 'rain' ? 0x9ab4d0 : wx === 'snow' ? 0xffffff : 0xd8b888;
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color: col, size: wx === 'rain' ? 0.07 : wx === 'snow' ? 0.14 : 0.1, transparent: true, opacity: wx === 'rain' ? 0.6 : 0.85, depthWrite: false })); p.frustumCulled = false; this.scene.add(p); this.weather = { p, kind: wx, n };
  }
  // ================= MENU =================
  buildMenu() {
    this.state = 'menu'; this.mode = null; this.hud = {}; const w = this.setupWorld('city', { zones: 1, seed: 77, time: 'dusk', weather: 'clear', len: 100 }); w.env.hemi.intensity = 1.1;
    this.menu = { t: 0, soldiers: [], focus: 'main', fireT: 2, boomT: 3, heliT: 8, rot: 0, rotTarget: 0 };
    const looks = ALLY_LOOKS; const pos = [[14, -3.5, 1], [14.5, 3.5, 1], [16.5, 0.5, 1], [12.5, -7, 0]];
    pos.forEach((p, i) => { const rig = buildSoldier(looks[i % looks.length]); attachGun(rig, WMAP[['ar76', 'scart', 'mp7', 'm249'][i]]); rig.root.position.set(p[0], 0, p[1]); rig.root.rotation.y = -Math.PI / 2 + rnd(-0.15, 0.15); this.scene.add(rig.root); this.menu.soldiers.push({ rig, crouch: p[2], t: rnd(0, 3), fire: 0, ally: 1 }); });
    for (let i = 0; i < 4; i++) { const rig = buildSoldier(ENEMY[['rifle', 'heavy', 'mg', 'elite'][i]].look, { scale: ENEMY[['rifle', 'heavy', 'mg', 'elite'][i]].scale }); attachGun(rig, WMAP[ENEMY[['rifle', 'heavy', 'mg', 'elite'][i]].wp]); rig.root.position.set(62 + i * 3, 0, -9 + i * 6); rig.root.rotation.y = Math.PI / 2; this.scene.add(rig.root); this.menu.soldiers.push({ rig, crouch: 0, t: rnd(0, 3), fire: 0, ally: 0 }); }
    this.menu.heli = null; this.buildShowcase(); this.camera.fov = 60; this.camera.updateProjectionMatrix(); this.cb.onMenuReady && this.cb.onMenuReady(); A.setIntensity(0.4);
  }
  buildShowcase() {
    const g = new THREE.Group(); g.position.set(400, 0, 0); const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.4, metalness: 0.6 })); ped.position.y = 0.15; g.add(ped);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.04, 8, 40), new THREE.MeshBasicMaterial({ color: 0x4aa8ff })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.32; g.add(ring);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshStandardMaterial({ color: 0x2a3444, roughness: 0.9 })); wall.position.set(0, 5, -6); g.add(wall);
    for (let i = -3; i <= 3; i++) { const b = new THREE.Mesh(boxG, new THREE.MeshBasicMaterial({ color: i % 2 ? 0x1c2a3a : 0x24364a })); b.scale.set(0.2, 6 + (i % 3), 0.1); b.position.set(i * 2, 3, -5.9); g.add(b); }
    const sp = new THREE.SpotLight(0xdde8ff, 90, 20, 0.7, 0.5, 1.5); sp.position.set(3, 6, 5); sp.target.position.set(0, 1, 0); g.add(sp, sp.target); const sp2 = new THREE.SpotLight(0x4aa8ff, 40, 20, 0.8, 0.6, 1.5); sp2.position.set(-4, 3, -3); sp2.target.position.set(0, 1, 0); g.add(sp2, sp2.target);
    const pl = new THREE.PointLight(0xffffff, 70, 22, 1.2); pl.position.set(2.5, 3.5, 4.5); g.add(pl); const pl2 = new THREE.PointLight(0x7ab8ff, 35, 18, 1.2); pl2.position.set(-3, 2, 3); g.add(pl2); const pl3 = new THREE.PointLight(0xffe0b0, 25, 14, 1.2); pl3.position.set(0, 2.5, -3); g.add(pl3);
    this.scene.add(g); this.showcase = { g, rig: null, gun: null, kind: 'custom', rot: 0 };
  }
  setShowcase(kind: string, look: any, wid?: string) {
    const s = this.showcase; if (!s) return; if (s.rig) { s.g.remove(s.rig.root); s.rig = null; } if (s.gun) { s.g.remove(s.gun); s.gun = null; } s.kind = kind;
    if (kind === 'custom') { const rig = buildSoldier(look); attachGun(rig, WMAP[wid || this.save.loadout[0]]); rig.root.position.set(0, 0.3, 0); s.g.add(rig.root); s.rig = rig; rig.root.traverse((o: any) => { if (o.isMesh) o.receiveShadow = false; }); }
    else { const gun = buildGun(WMAP[wid]); gun.scale.setScalar(2.6); gun.position.set(0, 1.5, 0); s.g.add(gun); s.gun = gun; }
  }
  setMenuFocus(f: string) { if (this.menu) this.menu.focus = f; }
  updateMenu(dt: number) {
    const m = this.menu; m.t += dt; const cam = this.camera; const s = this.showcase; if (!m.shadowInit) { m.shadowInit = true; const sun = this.world.env.sun; sun.position.set(80, 60, 40); sun.target.position.set(30, 0, 0); const sc = sun.shadow.camera; sc.left = -60; sc.right = 60; sc.top = 50; sc.bottom = -50; sc.near = 5; sc.far = 220; sc.updateProjectionMatrix(); }
    if (m.focus === 'custom' || m.focus === 'arsenal') {
      s.rot += dt * 0.5 + (m.rotTarget || 0); m.rotTarget = 0;
      if (s.rig) { s.rig.root.rotation.y = s.rot; animateSoldier(s.rig, dt, { spd: 0, crouch: 0, aim: this.showAim ? 1 : 0.0, pitch: 0 }); }
      if (s.gun) { s.gun.rotation.y = s.rot; s.gun.rotation.x = 0.1; }
      const target = m.focus === 'custom' ? new V3(400, 1.15, 3.9) : new V3(400, 1.5, 4.2); cam.position.lerp(target, 1 - Math.pow(0.001, dt)); cam.lookAt(400, m.focus === 'custom' ? 0.98 : 1.5, 0); cam.fov = m.focus === 'custom' ? 42 : 45; cam.updateProjectionMatrix();
    } else {
      const a = m.t * 0.06; const cx = 17 + Math.sin(a) * 2.5, cz = Math.cos(a * 1.3) * 4; cam.position.lerp(new V3(cx - 7, 1.7 + Math.sin(m.t * 0.2) * 0.3, cz + 6.5 + Math.sin(a * 2) * 1.5), 1 - Math.pow(0.05, dt)); cam.lookAt(24 + Math.sin(a) * 6, 2.2, 0); cam.fov = 58; cam.updateProjectionMatrix();
    }
    for (const sd of m.soldiers) { sd.t -= dt; if (sd.t <= 0) { sd.t = rnd(0.8, 3.5); sd.fire = rnd(0.5, 1.6); } const firing = sd.fire > 0; sd.fire -= dt; if (firing && Math.random() < dt * 9) { showFlash(sd.rig); const o = new V3(); sd.rig.gun.userData.muz.getWorldPosition(o); const d = sd.ally ? 1 : -1; this.tracer(o, new V3(o.x + d * 40, rnd(0.5, 2), o.z + rnd(-6, 6)), 0.06); A.shot({ k: 'rifle' }, o); this.pA.emit(o.x, o.y, o.z, 0, 0.5, 0, 0.25, 1, 0.1, 1, 0.7, 0.3, 0.8); }
      animateSoldier(sd.rig, dt, { spd: 0, crouch: sd.crouch, aim: 1, pitch: 0.03 }); }
    m.boomT -= dt; if (m.boomT <= 0) { m.boomT = rnd(4, 8); this.explode(new V3(rnd(35, 60), 0.5, rnd(-14, 14)), 6, 0, null, true); }
    m.heliT -= dt; if (m.heliT <= 0 && !m.heli) { m.heliT = rnd(25, 35); this.spawnHeli(new V3(-30, 28, rnd(-15, 15)), new V3(140, 28, rnd(-15, 15)), true, 16); }
    for (let i = 0; i < 3; i++) if (Math.random() < dt * 4) { for (const f of this.fireList.slice(0, 8)) { this.pN.emit(f.x + rnd(-0.5, 0.5), f.y, f.z + rnd(-0.5, 0.5), rnd(-0.3, 0.3), rnd(1.5, 3), rnd(-0.3, 0.3), 1, 2.6, 4, 0.12, 0.12, 0.12, 0.5, 0.2); } }
    A.listener(cam.position, 0);
  }
  // ================= ENTRADA =================
  bindInput() {
    const code2bind = () => this.settings.binds;
    window.addEventListener('keydown', (e) => {
      if (this.state === 'playing') { if (['Space', 'Tab', 'ControlLeft', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code) || e.ctrlKey) e.preventDefault(); }
      if (e.repeat) return; this.keys[e.code] = true; if (this.state !== 'playing') return; const b = code2bind();
      if (e.code === 'Digit1') this.switchTo(0); if (e.code === 'Digit2') this.switchTo(1); if (e.code === 'Digit3') this.switchTo(2); if (e.code === 'Digit4') this.switchTo(3);
      if (e.code === b.reload) this.startReload(); if (e.code === b.frag) this.throwNade('frag'); if (e.code === b.smoke) this.throwNade('smoke'); if (e.code === b.scan) this.tacticalScan(); if (e.code === b.medkit) this.useMedkit();
      if (e.code === b.light) { this.P.light = !this.P.light; A.click(); } if (e.code === b.nvg) { this.P.nvg = !this.P.nvg; A.click(); } if (e.code === b.map) { this.settings.minimap = !this.settings.minimap; }
      if (e.code === b.shop && this.mode?.openShop) this.mode.openShop(this);
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; this.mouse = [false, false, false]; });
    this.canvas.addEventListener('mousedown', (e: MouseEvent) => { this.mouse[e.button] = true; if (this.state === 'playing' && !document.pointerLockElement) this.lock(); });
    window.addEventListener('mouseup', (e) => { this.mouse[e.button] = false; });
    window.addEventListener('mousemove', (e) => { if (this.state === 'playing' && document.pointerLockElement) { if (Math.abs(e.movementX) > 250 || Math.abs(e.movementY) > 250) return; this.mouseDX += e.movementX; this.mouseDY += e.movementY; } });
    window.addEventListener('wheel', (e) => { if (this.state === 'playing' && this.P) this.switchTo((this.P.cur + (e.deltaY > 0 ? 1 : 3)) % 4); });
    document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && this.state === 'playing' && !this.noPause) { this.pause(true); } });
    this.canvas.addEventListener('contextmenu', (e: Event) => e.preventDefault());
  }
  lock() { try { const p: any = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } }
  setMobileMove(x: number, y: number) { this.mobileMoveX = clamp(x, -1, 1); this.mobileMoveY = clamp(y, -1, 1); }
  setMobileLook(dx: number, dy: number) { this.mobileLookDX += dx; this.mobileLookDY += dy; }
  setMobileButton(name: string, on: boolean) { if (name === 'fire') this.mobileFire = on; else if (name === 'ads') this.mobileAds = on; else if (name === 'jump') this.mobileJump = on; else if (name === 'crouch') this.mobileCrouch = on; else if (name === 'run') this.mobileRun = on; }
  mobileAction(name: string) { if (this.state !== 'playing' || !this.P) return; if (name === 'reload') this.startReload(); else if (name === 'light') { this.P.light = !this.P.light; A.click(); } else if (name === 'nvg') { this.P.nvg = !this.P.nvg; A.click(); } else if (name === 'frag') this.throwNade('frag'); else if (name === 'smoke') this.throwNade('smoke'); else if (name === 'medkit') this.useMedkit(); else if (name === 'scan') this.tacticalScan(); else if (name === 'map') this.settings.minimap = !this.settings.minimap; else if (name === 'next') this.switchTo((this.P.cur + 1) % 4); }
  down(a: string) { const b = this.settings.binds[a]; const kb = !!this.keys[b] || (a === 'crouch' && !!this.keys.KeyC); if (a === 'fwd') return kb || this.mobileMoveY < -0.15; if (a === 'back') return kb || this.mobileMoveY > 0.15; if (a === 'left') return kb || this.mobileMoveX < -0.15; if (a === 'right') return kb || this.mobileMoveX > 0.15; if (a === 'jump') return kb || this.mobileJump; if (a === 'crouch') return kb || this.mobileCrouch; if (a === 'run') return kb || this.mobileRun; return kb; }
  pause(on: boolean) {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    if (on) { this.state = 'paused'; this.mouse = [false, false, false]; this.cb.onPause && this.cb.onPause(true); } else { this.state = 'playing'; this.clock.getDelta(); this.cb.onPause && this.cb.onPause(false); this.lock(); }
  }
  // ================= INICIAR JOGO =================
  start(cfg: any) {
    if (Object.prototype.hasOwnProperty.call(this, 'doShot')) delete this.doShot; A.init(); this.cfg = cfg; this.sessionXp = 0; this.noPause = false;
    this.initPlayer(); this.mode = Modes.create(this, cfg); this.state = 'playing'; this.time = 0; this.lock(); this.clock.getDelta();
    this.cb.onStart && this.cb.onStart(cfg); this.hudT = 0;
  }
  quitToMenu() {
    if (document.pointerLockElement) { this.noPause = true; document.exitPointerLock(); } this.state = 'menu'; this.mode = null; this.noPause = false; this.vmClear(); this.buildMenu(); A.setIntensity(0.3);
  }
  // ================= JOGADOR =================
  initPlayer() {
    const lv = levelOf(this.save.xp); const ids = this.save.loadout.map((id: string, i: number) => (WMAP[id] && WMAP[id].lv <= lv ? id : ['ar76', 'fn9', 'mp7', 'pump12'][i]));
    this.P = { pos: new V3(), vel: new V3(), yaw: 0, pitch: 0, hp: 100, maxHp: 100, armor: 0, crouch: 0, eye: 1.7, grounded: true, team: 0, dead: false, ads: 0, guns: ids.map((id: string) => this.newGun(WMAP[id])), cur: 0, swT: 0, fireCd: 0, reload: 0, bank: 0, bloom: 0, kick: 0, bob: 0, stepD: 0, sprint: 0, nades: 2, smokes: 1, meds: 1, scanT: 0, scanCd: 0, throwT: 0, healT: 0, light: false, nvg: false, useT: 0, hurtT: 0, moving: false, speed: 0, lean: 0, land: 0, trigUp: true, burst: 0, lastShot: -9, deathT: 0, dmgMul: 1, kills: 0, headshots: 0, shots: 0, hits: 0, deaths: 0, score: 0, spawn: new V3(), reloadTot: 1, shellT: 0, bolt: 0, nvgOk: true };
    this.setupVM(); this.vmGun(); this.camera.fov = this.settings.fov;
  }
  newGun(def: any) { return { def, ammo: def.mag, res: def.res, up: { dmg: 0, mag: 0 } }; }
  spawnPlayer(x: number, z: number, yaw: number) { const P = this.P; P.pos.set(x, 0, z); P.vel.set(0, 0, 0); P.yaw = yaw; P.pitch = 0; P.hp = P.maxHp; P.dead = false; P.deathT = 0; P.crouch = 0; P.reload = 0; P.spawn.set(x, 0, z); this.camera.rotation.z = 0; }
  get gun() { return this.P.guns[this.P.cur]; }
  switchTo(i: number) { const P = this.P; if (i === P.cur || P.dead || P.throwT > 0 || P.healT > 0 || !P.guns[i]) return; P.cur = i; P.swT = 0.45; P.reload = 0; P.burst = 0; A.swap(null); this.vmGun(); }
  maxMag(w: any) { return Math.round(w.def.mag * (1 + 0.25 * w.up.mag)); }
  startReload() { const P = this.P, w = this.gun; if (P.reload > 0 || P.dead || P.swT > 0 || P.throwT > 0 || w.ammo >= this.maxMag(w) || w.res <= 0) return; P.reload = w.def.mode === 'pump' ? 0.55 : w.def.rl; P.reloadTot = P.reload; P.reloadStart = true; P.ads = 0; A.reload(w.def.mode === 'pump' ? 'pump' : 'x', null, w.def.rl); }
  spreadNow() { const P = this.P, d = this.gun.def; let s = d.sp * lerp(1, d.ads, P.ads); if (P.speed > 1) s *= 1 + Math.min(1.2, P.speed / 6); if (!P.grounded) s *= 2.5; if (P.crouch > 0.5) s *= 0.7; return s + P.bloom; }
  tryShoot(dt: number) {
    const P = this.P, w = this.gun, d = w.def; P.fireCd -= dt; P.bloom = Math.max(0, P.bloom - dt * 5);
    const want = (this.mouse[0] || this.mobileFire) && P.swT <= 0 && P.throwT <= 0 && P.healT <= 0 && P.sprint < 0.3; if (!this.mouse[0] && !this.mobileFire) P.trigUp = true
    if (P.burst > 0 && P.fireCd <= 0) { this.doShot(); P.burst--; P.fireCd = 60 / 900; if (P.burst === 0) P.fireCd = 0.2; return; }
    if (!want || P.fireCd > 0) return;
    if (P.reload > 0) { if (d.mode === 'pump' && w.ammo > 0) { P.reload = 0; } else return; }
    if (w.ammo <= 0) { if (P.trigUp) { A.empty(null); P.trigUp = false; if (w.res > 0) this.startReload(); } return; }
    if (d.mode !== 'auto' && !P.trigUp) return; P.trigUp = false;
    if (d.mode === 'burst') { this.doShot(); P.burst = Math.min(2, w.ammo); P.fireCd = 60 / 900; return; }
    this.doShot(); P.fireCd = 60 / d.rpm; if (d.mode === 'bolt' || d.mode === 'pump') { P.bolt = P.fireCd; this.boltT = 0; setTimeout(() => A.bolt && d.mode === 'bolt' ? A.bolt(null) : A.swap(null), 380); }
  }
  doShot() {
    const P = this.P, w = this.gun, d = w.def; w.ammo--; P.shots++; this.save.stats.shots++; P.lastShot = this.time;
    const cam = this.camera; const dir = new V3(); cam.getWorldDirection(dir); const org = cam.position.clone(); const sp = this.spreadNow() * Math.PI / 180;
    const right = new V3().crossVectors(dir, new V3(0, 1, 0)).normalize(), up = new V3().crossVectors(right, dir).normalize(); const n = d.pel || 1; let hitAny = false;
    for (let i = 0; i < n; i++) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * sp * (n > 1 ? 1 : 0.9); const v = dir.clone().addScaledVector(right, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r).normalize(); const res = this.fireBullet(org, v, d, P, (1 + 0.15 * w.up.dmg) * P.dmgMul, true); if (res && res.hitActor) hitAny = true; }
    if (hitAny) { P.hits++; this.save.stats.hits++; }
    const rc = d.rc * (1 - P.ads * 0.3) * (P.crouch > 0.5 ? 0.85 : 1) * rnd(0.85, 1.15) * Math.PI / 180; P.pitch += rc; P.bank += rc; P.yaw += rnd(-1, 1) * d.rh * Math.PI / 180 * (1 - P.ads * 0.4); P.bloom += d.rc * 0.12 * (n > 1 ? 0.3 : 1); P.kick = 1; this.vmFlash = 0.05;
    this.mLight.position.copy(cam.position).addScaledVector(dir, 1); this.mLight.intensity = 14; this.mLightT = 0.05; this.shake = Math.max(this.shake, d.rc * 0.01);
    A.shot(d.snd, null); this.noise(P.pos, d.noise, 0, P); const sp2 = d.model.pistol ? 0.05 : 0.08;
    this.debrisCasing(cam.position.clone().addScaledVector(right, 0.2).addScaledVector(dir, 0.3).add(new V3(0, -0.12, 0)), right);
    void sp2; if (w.ammo <= 0 && w.res > 0 && d.mode !== 'bolt') setTimeout(() => { if (this.state === 'playing' && this.gun === w && w.ammo <= 0) this.startReload(); }, 250);
  }
  debrisCasing(p: any, right: any) { this.debris.emit(p.x, p.y, p.z, right.x * rnd(1.5, 3) + rnd(-0.5, 0.5), rnd(1.5, 3), right.z * rnd(1.5, 3), 0.025, 0xc9a24a, 1.5); }
  // ---------- ataque genérico (jogador e IA) ----------
  fireBullet(org: any, dir: any, def: any, shooter: any, dmgMul: number, isPlayer: boolean) {
    const maxT = Math.max(200, def.range * 3); const wh = this.world.ray(org.x, org.y, org.z, dir.x, dir.y, dir.z, maxT); const wt = wh ? wh.t : maxT;
    const th = this.hitTargets(org, dir, wt, shooter);
    const end = new V3();
    if (th && th.t < wt && th.prop) { end.copy(org).addScaledVector(dir, th.t); this.impactFx(end, new V3(-dir.x, 0.3, -dir.z), 'metal', false); A.hit('metal', end); this.damageProp(th.prop, def.dmg, shooter); this.addTracer(org, end, isPlayer, shooter); return { hitActor: true }; }
    if (th && th.t < wt) { // acertou criatura
      end.copy(org).addScaledVector(dir, th.t); const fall = clamp(1 - Math.max(0, th.t - def.range) / def.range * 0.6, 0.35, 1);
      if (th.shield) { this.impactFx(end, new V3(-dir.x, 0.2, -dir.z), 'metal'); A.hit('metal', end); }
      else { const amt = def.dmg * dmgMul * fall * (th.head ? (def.cat && def.cat.includes('Sniper') ? 3 : 2.1) : 1); if (th.target !== this.P) this.bloodFx(end, dir, th.head); A.hit('flesh', end); this.damageTarget(th.target, amt, { head: th.head, src: shooter, pos: org, weapon: def, isPlayer }); if (isPlayer) { this.hitMark = { t: 0.25, head: th.head, kill: th.target.dead }; A.hitmark(th.head); } }
      this.addTracer(org, end, isPlayer, shooter); return { hitActor: !th.shield };
    }
    end.copy(org).addScaledVector(dir, wt);
    if (wh) { const n = new V3(wh.nx, wh.ny, wh.nz); const mat = wh.c ? wh.c.mat : this.world.surf === 'metal' ? 'metal' : 'dirt'; this.impactFx(end, n, mat, !wh.ground || true); A.hit(mat, end); if (wh.c && wh.c.ref) this.damageProp(wh.c.ref, def.dmg * dmgMul * (def.pel || 1) * 0.7, shooter); }
    // quase acerto no jogador
    if (!isPlayer && shooter.team !== 0 && !this.P.dead) { const to = new V3().subVectors(this.P.pos, org); to.y += 1.2; const tt = to.dot(dir); if (tt > 0 && tt < wt) { const cl = new V3().copy(org).addScaledVector(dir, tt); if (cl.distanceTo(new V3(this.P.pos.x, this.P.pos.y + 1.2, this.P.pos.z)) < 1.6) { A.whiz(cl); this.suppress = Math.min(1, (this.suppress || 0) + 0.12); } } }
    this.addTracer(org, end, isPlayer, shooter); return { hitActor: false };
  }
  hitTargets(org: any, dir: any, maxT: number, shooter: any) {
    let best: any = null, bt = maxT; const st = shooter.team;
    for (const a of this.actors) {
      if (a.dead || a.team === st || a.team === 2 || !a.active) continue;
      const sc = a.sc, dx = org.x - a.pos.x, dz = org.z - a.pos.z; const c = Math.cos(a.yaw), s = Math.sin(a.yaw);
      const ox = c * dx - s * dz, oz = s * dx + c * dz, oy = org.y - a.pos.y, rx = c * dir.x - s * dir.z, rz = s * dir.x + c * dir.z;
      const k = 1 - a.crouch * 0.3, hb = 1.5 * sc * k, ht = 1.85 * sc * k;
      if (a.shieldOn) { const h = rbox(ox, oy, oz, rx, dir.y, rz, -0.52, 0.2, -0.58, 0.28, 1.45, -0.44); if (h && h.t < bt) { bt = h.t; best = { t: h.t, target: a, shield: true }; } }
      let h = rbox(ox, oy, oz, rx, dir.y, rz, -0.27 * sc, 0, -0.22 * sc, 0.27 * sc, hb, 0.34 * sc); if (h && h.t < bt) { bt = h.t; best = { t: h.t, target: a, head: false }; }
      h = rbox(ox, oy, oz, rx, dir.y, rz, -0.17 * sc, hb - 0.02, -0.17 * sc, 0.17 * sc, ht, 0.17 * sc); if (h && h.t < bt) { bt = h.t; best = { t: h.t, target: a, head: true }; }
    }
    for (const p of this.props) { if (!p.hitscan || !p.up) continue; const m = p.mesh.position, sc = p.mesh.scale.x, b = p.box; const h = rbox(org.x, org.y, org.z, dir.x, dir.y, dir.z, m.x - b.hx * sc, 0, m.z - b.hz * sc, m.x + b.hx * sc, b.h * sc, m.z + b.hz * sc); if (h && h.t < bt) { bt = h.t; best = { t: h.t, prop: p, target: null }; } }
    if (st !== 0 && !this.P.dead) { const P = this.P; const h = rbox(org.x, org.y, org.z, dir.x, dir.y, dir.z, P.pos.x - 0.3, P.pos.y, P.pos.z - 0.3, P.pos.x + 0.3, P.pos.y + P.eye + 0.1, P.pos.z + 0.3); if (h && h.t < bt) { bt = h.t; best = { t: h.t, target: P, head: org.y + dir.y * h.t > P.pos.y + P.eye - 0.2 }; } }
    return best;
  }
  damageTarget(t: any, amt: number, o: any) {
    if (t === this.P) { this.hurtPlayer(amt, o.pos, o.src); return; }
    if (t.dead) return; if (t.invuln) return; t.hp -= amt; t.hurt = 1; t.wake = true;
    if (t.team === 1 || t.team === 0) { t.lastHitBy = o.src; if (o.src) this.alertAround(t, o.src); if (t.mode !== 'engage' && !t.captive && o.src && o.src.pos) { t.mode = 'engage'; t.target = o.src === this.P ? this.P : o.src; } }
    if (t.hp <= 0) this.killActor(t, o.src, o.head, o.weapon, o.grenade);
  }
  hurtPlayer(amt: number, from: any, src: any) {
    const P = this.P; if (P.dead || this.mode?.godMode || P.protect > 0) return; const diff = { easy: 0.6, normal: 1, hard: 1.5 }[this.settings.diff] || 1; amt *= 1; void diff;
    if (P.armor > 0) { const ab = Math.min(P.armor, amt * 0.5); P.armor -= ab; amt -= ab * 0.9; } P.hp -= amt; P.hurtT = 0.35; P.regenT = 5; this.shake = Math.max(this.shake, Math.min(0.35, amt * 0.012));
    if (from) { const a = Math.atan2(from.x - P.pos.x, from.z - P.pos.z); this.dmgDirs = this.dmgDirs || []; this.dmgDirs.push({ a: a, t: 1.4 }); }
    A.hurt(); this.suppress = Math.min(1, (this.suppress || 0) + 0.2);
    if (P.hp <= 0) { P.hp = 0; this.killPlayer(src); }
  }
  killPlayer(src: any) { const P = this.P; P.dead = true; P.deathT = 0; P.deaths++; this.save.stats.deaths++; this.deathFrom = src && src.pos ? src.pos.clone() : null; this.mouse = [false, false, false]; this.mode?.onPlayerDeath && this.mode.onPlayerDeath(this, src); }
  killActor(a: any, killer: any, head: boolean, weapon: any, grenade: boolean) {
    if (a.dead) return; a.dead = true; a.deathT = 0; a.deathDir = Math.random() < 0.7 ? 1 : -1; a.hp = 0; a.target = null; a.rig.flash && (a.rig.flash.visible = false);
    A.hit('flesh', a.pos); this.pickupDrop(a);
    if (killer === this.P) { const P = this.P; P.kills++; this.save.stats.kills++; if (head) { P.headshots++; this.save.stats.headshots++; } if (grenade) this.save.stats.grenadeKills++; const xp = (a.def?.xp || 10) + (head ? 5 : 0); this.addXp(xp); P.score += (a.def?.xp || 10) * 10 + (head ? 50 : 0); this.killfeed(`${a.name || 'Inimigo'} eliminado${head ? ' ☠' : ''}`, head); this.hitMark = { t: 0.35, head, kill: true }; }
    for (const o of this.actors) if (!o.dead && o.team === a.team && o !== a && !o.captive && o.mode !== 'engage' && o.pos.distanceTo(a.pos) < 25) { o.mode = 'investigate'; o.invPos = (killer && killer.pos ? killer.pos.clone() : a.pos.clone()); o.invT = 5; }
    this.mode?.onKill && this.mode.onKill(this, a, killer);
  }
  pickupDrop(a: any) { if (a.team !== 1 || Math.random() > 0.2 || !this.mode?.drops) return; this.addPickup(a.pos.x, a.pos.z, Math.random() < 0.6 ? 'ammo' : 'medbox'); }
  addPickup(x: number, z: number, kind: string) { const m = buildProp(kind); m.position.set(x, 0, z); this.scene.add(m); this.pickups.push({ kind, mesh: m, x, z, t: 40 }); }
  addXp(n: number) { this.sessionXp += n; }
  killfeed(t: string, head?: boolean) { this.kf = this.kf || []; this.kf.unshift({ t, head, life: 4 }); this.kf.length = Math.min(this.kf.length, 4); }
  notify(txt: string, color = '#fff') { this.notes = this.notes || []; this.notes.push({ txt, color, life: 3.5 }); if (this.notes.length > 4) this.notes.shift(); }
  say(who: string, txt: string, speak = true) { this.sub = { who, txt, life: 4.5 + txt.length * 0.04 }; A.radio(null); if (speak && who !== 'SISTEMA') setTimeout(() => A.speak(txt, who), 400); }
  // ---------- ruídos e alertas ----------
  noise(pos: any, radius: number, team: number, src: any) {
    for (const a of this.actors) { if (a.dead || a.team === team || a.team === 2 || a.captive || !a.active) continue; const d = a.pos.distanceTo(pos); if (d > radius) continue; if (a.mode === 'engage') continue; if (d < radius * 0.5 || Math.random() < 0.5) { a.mode = 'investigate'; a.invPos = pos.clone(); a.invT = 5; a.alert = Math.max(a.alert || 0, 0.5); a.hearTarget = src; } }
  }
  alertAround(victim: any, src: any) { for (const o of this.actors) { if (o.dead || o === victim || o.team !== victim.team || o.captive || o.mode === 'engage') continue; if (o.pos.distanceTo(victim.pos) < 28) { o.mode = 'investigate'; o.invPos = src.pos.clone(); o.invT = 6; } } }
  // ---------- projéteis / explosões ----------
  throwNade(kind: string) {
    const P = this.P; if (P.dead || P.throwT > 0 || P.healT > 0 || P.swT > 0.2) return; if (kind === 'frag' && P.nades <= 0) return; if (kind === 'smoke' && P.smokes <= 0) return;
    P.throwT = 0.7; P.throwKind = kind; P.throwDone = false; P.reload = 0; A.pin(null); if (kind === 'frag') P.nades--; else P.smokes--;
  }
  launchProj(kind: string, pos: any, vel: any, owner: any, fuse = 2.4) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.11, 8), new THREE.MeshStandardMaterial({ color: kind === 'smoke' ? 0x8a9aa0 : 0x4a5236, roughness: 0.6 })); m.castShadow = true; m.position.copy(pos); this.scene.add(m); this.projs.push({ kind, mesh: m, pos: pos.clone(), vel: vel.clone(), t: fuse, owner, spin: rnd(5, 12) });
  }
  updateProjs(dt: number) {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i]; p.t -= dt; p.vel.y -= 18 * dt; const np = p.pos.clone().addScaledVector(p.vel, dt); const d = np.clone().sub(p.pos); const L = d.length();
      if (L > 0) { d.divideScalar(L); const h = this.world.ray(p.pos.x, p.pos.y, p.pos.z, d.x, d.y, d.z, L + 0.08); if (h && h.t < L + 0.08) { const n = new V3(h.nx, h.ny, h.nz); p.vel.reflect(n).multiplyScalar(0.45); np.copy(p.pos).addScaledVector(d, Math.max(0, h.t - 0.06)); if (Math.abs(p.vel.length()) > 1.5) A.bounce(np); if (h.ground) { np.y = Math.max(np.y, 0.06); p.vel.x *= 0.8; p.vel.z *= 0.8; } } }
      if (np.y < 0.06) { np.y = 0.06; p.vel.y = Math.abs(p.vel.y) * 0.35; p.vel.x *= 0.7; p.vel.z *= 0.7; if (Math.abs(p.vel.y) > 1.5) A.bounce(np); }
      p.pos.copy(np); p.mesh.position.copy(np); p.mesh.rotation.x += p.spin * dt;
      if (p.kind === 'smoke' && p.t > 0 && Math.random() < 0.3) this.pN.emit(np.x, np.y, np.z, rnd(-0.3, 0.3), rnd(0.2, 0.8), rnd(-0.3, 0.3), 0.6, 1.5, 0.8, 0.7, 0.7, 0.7, 0.5);
      if (p.t <= 0) { this.scene.remove(p.mesh); this.projs.splice(i, 1); if (p.kind === 'frag') this.explode(p.pos, 7.5, 150, p.owner, false, true); else if (p.kind === 'smoke') { this.smokes.push({ pos: p.pos.clone(), r: 5.5, t: 22 }); A.smoke(p.pos); } else if (p.kind === 'c4') this.explode(p.pos, 8, 200, p.owner); }
    }
    for (let i = this.smokes.length - 1; i >= 0; i--) { const s = this.smokes[i]; s.t -= dt; if (s.t <= 0) { this.smokes.splice(i, 1); continue; } const n = Math.min(3, Math.ceil(dt * 30 * this.pq)); for (let k = 0; k < n; k++) { if (Math.random() < Math.min(1, s.t / 4)) this.pN.emit(s.pos.x + rnd(-s.r * 0.6, s.r * 0.6), rnd(0.3, 3.5), s.pos.z + rnd(-s.r * 0.6, s.r * 0.6), rnd(-0.3, 0.3), rnd(0, 0.4), rnd(-0.3, 0.3), 3.5, 1.2, 5, 0.78, 0.8, 0.82, 0.55, 0.2); } }
  }
  smokeBlocks(a: any, b: any) { for (const s of this.smokes) { const ab = new V3().subVectors(b, a), t = clamp(new V3().subVectors(s.pos, a).dot(ab) / ab.lengthSq(), 0, 1); if (new V3().copy(a).addScaledVector(ab, t).distanceTo(s.pos) < s.r * 0.7) return true; } return false; }
  explode(pos: any, radius: number, dmg: number, owner: any, fxOnly = false, grenade = false) {
    const pq = this.pq; this.xLight.position.copy(pos).add(new V3(0, 1.5, 0)); this.xLight.intensity = 80; this.xLightT = 0.25; A.explosion(pos, radius > 6 ? 1.3 : 1);
    for (let i = 0; i < 18 * pq + 4; i++) { const a = rnd(0, TAU), up = rnd(0.2, 1), s = rnd(2, 9) * (radius / 6); this.pA.emit(pos.x, pos.y + 0.5, pos.z, Math.cos(a) * s * (1 - up * 0.4), up * s * 1.2, Math.sin(a) * s * (1 - up * 0.4), rnd(1.5, 3.2) * (radius / 6), 2, rnd(0.3, 0.7), 1, rnd(0.45, 0.8), 0.15, 0.9, 1.5, -2); }
    for (let i = 0; i < 22 * pq + 6; i++) { const a = rnd(0, TAU), s = rnd(1, 5); this.pN.emit(pos.x + rnd(-1, 1), pos.y + rnd(0.3, 1.5), pos.z + rnd(-1, 1), Math.cos(a) * s, rnd(1, 5), Math.sin(a) * s, rnd(1.5, 3) * (radius / 6), 2.4, rnd(1.8, 3.6), 0.16, 0.15, 0.14, 0.7, 0.8, -0.6); }
    for (let i = 0; i < 14 * pq + 4; i++) { const a = rnd(0, TAU), s = rnd(4, 11); this.debris.emit(pos.x, pos.y + 0.4, pos.z, Math.cos(a) * s, rnd(4, 11), Math.sin(a) * s, rnd(0.1, 0.35), [0x555555, 0x7a6a50, 0x333333, 0x8a7a60][i % 4], 3); }
    const dp = pos.distanceTo(this.camera.position); this.shake = Math.max(this.shake, clamp(1.2 - dp / 50, 0, 1) * 0.9); if (fxOnly) return;
    this.addDecal(new V3(pos.x, 0.02, pos.z), new V3(0, 1, 0), 6);
    for (const a of this.actors) { if (a.dead) continue; const d = a.pos.distanceTo(pos); if (d > radius + 6) continue; if (d < radius) { const f = 1 - d / radius; if (!(a.team === owner?.team && owner !== this.P && false)) { if (owner === this.P && a.team === 0) continue; this.damageTarget(a, dmg * f * f * 1.4 + 5, { src: owner, pos, grenade }); } } else if (a.team !== 2) { a.cower = 1.5; } }
    for (const p of this.props) if (!p.dead && p.pos.distanceTo(pos) < radius + 2) this.damageProp(p, dmg * (1 - p.pos.distanceTo(pos) / (radius + 3)) * 1.2, owner);
    const P = this.P; if (!P.dead) { const d = new V3(P.pos.x, P.pos.y + 1, P.pos.z).distanceTo(pos); if (d < radius) { const f = 1 - d / radius; if (!(owner === P)) this.hurtPlayer(dmg * f * f * 0.9 + 5, pos, owner); else this.hurtPlayer(dmg * f * f * 0.45, pos, owner); } }
    this.noise(pos, 70, owner ? owner.team : 0, owner);
  }
  // ---------- props dinâmicos ----------
  addProp(kind: string, x: number, z: number, o: any = {}) {
    let m, size, hp, name;
    if (['jeep', 'truck', 'apc', 'tank', 'car'].includes(kind)) { m = buildVehicle(kind, o.color || 0x4a4c52); size = m.userData.size; hp = { jeep: 160, truck: 220, apc: 350, tank: 500, car: 120 }[kind]; name = { jeep: 'Veículo', truck: 'Caminhão', apc: 'Blindado', tank: 'Tanque', car: 'Carro' }[kind]; if (o.ry != null) m.rotation.y = o.ry; }
    else if (kind === 'plane') { const p = o.planeMesh || require_plane(); m = p; size = [14, 4.4, 9]; hp = 300; name = 'Caça'; m.rotation.y = o.ry ?? 0; }
    else { m = buildProp(kind); size = m.userData.size; hp = m.userData.hp; name = m.userData.pname; }
    m.position.set(x, 0, z); this.scene.add(m); const q = Math.abs(Math.sin(m.rotation.y)) > 0.7; const hw = (q ? size[2] : size[0]) / 2, hd = (q ? size[0] : size[2]) / 2;
    const p: any = { kind, mesh: m, pos: new V3(x, size[1] / 2, z), hp: o.hp || hp, maxHp: o.hp || hp, name, dead: false, size, target: !!o.target, onDestroy: o.onDestroy, explosive: kind === 'barrel', flashT: 0, planted: 0, radius: Math.max(size[0], size[2]) / 2 };
    if (!o.noCol) p.col = this.world.addDynCol(x - hw, 0, z - hd, x + hw, size[1], z + hd, kind === 'barrel' ? 'metal' : 'metal', p);
    this.props.push(p); if (kind === 'radar' || kind === 'aa') p.spin = true; return p;
  }
  damageProp(p: any, amt: number, src: any) {
    if (p.onHit) { p.onHit(p, src); return; } if (p.dead || p.hp > 90000) return; p.hp -= amt; p.flashT = 0.1; if (p.hp > 0) return; p.dead = true; if (p.col) p.col.live = false; p.destroyedBy = src;
    const big = p.kind === 'barrel' ? 5 : Math.max(p.size[0], p.size[2]) * 0.9; this.explode(p.pos.clone(), big + 2, p.kind === 'barrel' ? 110 : 90, src === this.P ? this.P : src);
    if (p.kind === 'barrel') { p.mesh.visible = false; } else { p.mesh.traverse((o: any) => { if (o.isMesh) o.material = BURNT; }); p.mesh.position.y -= 0.15; p.mesh.rotation.z += rnd(-0.06, 0.06); this.fireList.push({ x: p.pos.x, y: p.size[1], z: p.pos.z, big: true }); if (p.col) { p.col.live = true; p.col.y1 = Math.min(p.col.y1, 1.8); } }
    p.onDestroy && p.onDestroy(p); this.mode?.onPropDestroyed && this.mode.onPropDestroyed(this, p);
  }
  // ---------- efeitos ----------
  tracer(a: any, b: any, w = 0.04) { this.addTracer(a, b, false, null, w); }
  addTracer(a: any, b: any, isPlayer: boolean, shooter: any, w = 0.03) {
    const len = a.distanceTo(b); if (len < 3) return; const m = this.tracers[this.trI]; this.trI = (this.trI + 1) % this.tracers.length; const from = a.clone();
    if (isPlayer) from.addScaledVector(new V3().subVectors(b, a).normalize(), 1.2).add(new V3(0.15, -0.12, 0).applyQuaternion(this.camera.quaternion));
    const tl = Math.min(len, 14); const dir = new V3().subVectors(b, from).normalize(); m.position.copy(from).addScaledVector(dir, tl * 0.5 + Math.min(10, len * 0.3)); m.scale.set(w, w, tl); m.lookAt(b); m.visible = true; m.userData.life = 0.05; void shooter;
  }
  impactFx(p: any, n: any, mat: string, decal = true) {
    const pq = this.pq; const col = mat === 'wood' ? [0.5, 0.35, 0.2] : mat === 'dirt' ? [0.45, 0.38, 0.28] : [0.6, 0.6, 0.58]; const dc = mat === 'wood' ? 0x7a5a30 : mat === 'dirt' ? 0x6a5a40 : 0x8a8a88;
    for (let i = 0; i < 3 * pq + 1; i++) this.pN.emit(p.x, p.y, p.z, n.x * rnd(0.5, 2) + rnd(-0.5, 0.5), n.y * rnd(0.5, 2) + rnd(0, 1), n.z * rnd(0.5, 2) + rnd(-0.5, 0.5), 0.25, 1.4, rnd(0.4, 0.9), col[0], col[1], col[2], 0.6, 1.5);
    if (mat === 'metal' || mat === 'concrete') for (let i = 0; i < 4 * pq + 1; i++) this.pA.emit(p.x, p.y, p.z, n.x * rnd(2, 6) + rnd(-2, 2), n.y * rnd(2, 6) + rnd(0, 3), n.z * rnd(2, 6) + rnd(-2, 2), 0.07, 0, rnd(0.15, 0.4), 1, 0.75, 0.3, 1, 0.5, 14);
    for (let i = 0; i < 2 * pq; i++) this.debris.emit(p.x, p.y, p.z, n.x * rnd(1, 4) + rnd(-1, 1), n.y * rnd(1, 4) + rnd(1, 3), n.z * rnd(1, 4) + rnd(-1, 1), rnd(0.03, 0.07), dc, 1.5);
    if (decal && mat !== 'flesh') this.addDecal(p, n, 1);
  }
  addDecal(p: any, n: any, s: number) { const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 0, 1), n); const pos = p.clone().addScaledVector(n, 0.012); m.compose(pos, q.multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), rnd(0, 6))), new V3(s, s, s)); this.decals.setMatrixAt(this.decN, m); this.decN = (this.decN + 1) % 160; this.decals.instanceMatrix.needsUpdate = true; }
  bloodFx(p: any, dir: any, head: boolean) { const pq = this.pq; for (let i = 0; i < 5 * pq + 2; i++) this.debris.emit(p.x, p.y, p.z, dir.x * rnd(1, 4) + rnd(-2, 2), rnd(1, 4), dir.z * rnd(1, 4) + rnd(-2, 2), rnd(0.05, 0.11), [0xb02020, 0x801818, 0xd04030][i % 3], 1.6); for (let i = 0; i < 3 * pq; i++) this.pN.emit(p.x, p.y, p.z, dir.x * 1.5 + rnd(-1, 1), rnd(0, 1.5), dir.z * 1.5 + rnd(-1, 1), 0.3, 1.2, 0.5, 0.55, 0.08, 0.08, 0.6, 1.5, 3); void head; }
  muzzleFx(pos: any, dir: any) { this.pA.emit(pos.x, pos.y, pos.z, dir.x * 2, dir.y * 2, dir.z * 2, 0.35, 1, 0.07, 1, 0.78, 0.35, 0.9, 2); if (Math.random() < 0.5 * this.pq) this.pN.emit(pos.x, pos.y, pos.z, dir.x * 1.5, 0.6, dir.z * 1.5, 0.2, 1.3, 0.7, 0.6, 0.6, 0.6, 0.35, 1.5); }
  spawnHeli(from: any, to: any, enemy: boolean, secs: number, fire = false) {
    const h = buildHeli(enemy); h.position.copy(from); const dir = new V3().subVectors(to, from); h.rotation.y = Math.atan2(-dir.x, -dir.z) + Math.PI; this.scene.add(h); const snd = A.heli(from, secs); const f = { kind: 'heli', mesh: h, from: from.clone(), to: to.clone(), t: 0, dur: secs, snd, fire, ft: 0 }; this.flyers.push(f); if (this.menu) this.menu.heli = f; return f;
  }
  spawnConvoy(enemy = true) {
    const w = this.world; const dir = Math.random() < 0.5 ? 1 : -1; const z = this.world.th.road ? 0 : (Math.random() < 0.5 ? -4 : 4); const x0 = dir > 0 ? -10 : w.len + 10; const kinds = ['jeep', 'truck', 'apc', 'truck', 'jeep'];
    kinds.forEach((k, i) => { const v = buildVehicle(k, enemy ? 0x4a4c52 : 0x56633f); v.rotation.y = dir > 0 ? 0 : Math.PI; v.position.set(x0 - dir * i * 12, 0, z); this.scene.add(v); this.flyers.push({ kind: 'veh', mesh: v, vx: dir * 11, t: 0, dur: (w.len + 80) / 11 + i * 1.1, snd: i === 0 ? A.engine(v.position, 14) : null }); });
  }
  arty(center: any, n = 4) {
    for (let i = 0; i < n; i++) setTimeout(() => { if (this.state !== 'playing') return; const p = new V3(center.x + rnd(-45, 45), 0.5, center.z + rnd(-30, 30)); p.x = clamp(p.x, 4, this.world.len - 4); p.z = clamp(p.z, -40, 40); A.whistle(p); setTimeout(() => { if (this.state === 'playing') this.explode(p, 6, 60, null, false); }, 1500); }, i * rnd(700, 1600));
  }
  // ================= ATORES / IA =================
  spawnActor(o: any) {
    const def = o.enemy !== false && ENEMY[o.type] ? ENEMY[o.type] : null; const look = o.look || def?.look || ALLY_LOOKS[0]; const sc = o.scale || def?.scale || 1;
    const rig = buildSoldier(look, { scale: sc, shield: def?.shield, belt: def?.belt, ghillie: def?.ghillie, coat: def?.coat, epaulets: def?.epaulets }); const wdef = WMAP[o.wp || def?.wp || 'ar76']; if (!o.noGun) attachGun(rig, wdef);
    const dm = { easy: 0.55, normal: 1, hard: 1.5 }[this.settings.diff] || 1; const md = this.mission ? this.mission.diff : 1;
    const hp = (o.hp || def?.hp || 100) * (o.team === 1 ? 1 : 1.3);
    const a: any = { id: ++this.uid, team: o.team, type: o.type || 'ally', def, rig, sc, pos: new V3(o.x, 0, o.z), yaw: o.yaw ?? rnd(0, TAU), hp, maxHp: hp, wdef, ammo: wdef.mag, reloadT: 0, fireCd: rnd(0.3, 1), burst: 0, mode: o.mode || 'patrol', base: o.base || 'patrol', home: new V3(o.x, 0, o.z), name: o.name || def?.name || 'Soldado', path: null, pi: 0, repathT: 0, perceiveT: rnd(0, 0.3), alert: 0, tact: 'hold', tactT: 0, crouch: 0, crouchT: 0, hurt: 0, spd: 0, active: true, lostT: 0, lastSeen: new V3(), invPos: null, invT: 0, patrolT: rnd(0, 3), goal: null, noGun: !!o.noGun, captive: !!o.captive, dmgMul: (o.team === 1 ? 0.5 * dm * (def?.acc > 1.2 ? 1.2 : 1) : 0.7), acc: (def?.acc || 1) * (o.team === 1 ? Math.min(1.5, 0.75 + md * 0.25) : 1.1), vis: def?.vis || 55, speed: (def?.speed || 3.8) * (o.speedMul || 1), nades: def?.nades || 0, nadeCd: rnd(4, 9), scale: sc, role: o.role, zone: o.zone, shieldOn: !!def?.shield, offset: o.offset || rnd(0, TAU), stuckT: 0, lastPos: new V3(o.x, 0, o.z), deathDir: 1, boss: !!o.boss, hold: !!def?.hold, invuln: !!o.invuln, peekT: 0, exposed: true, coverPt: null, hittable: !!o.hittable, isTarget: false, id2: o.idx || 0 };
    if (o.boss) { a.hp = a.maxHp = o.hp || 900; a.name = 'General Kragen'; }
    if (o.team === 2) { a.hittable = true; }
    rig.root.position.copy(a.pos); rig.root.rotation.y = a.yaw; this.scene.add(rig.root); this.actors.push(a); return a;
  }
  hostiles(a: any) { const out = []; if (a.team === 1) { if (!this.P.dead && !this.P.invis) out.push(this.P); for (const o of this.actors) if (!o.dead && o.team === 0 && !o.captive) out.push(o); } else if (a.team === 0) { for (const o of this.actors) if (!o.dead && o.team === 1) out.push(o); } return out; }
  perceive(a: any) {
    if (a.hunt) { let nh = null, nd = 1e9; for (const h of this.hostiles(a)) { const d = h.pos.distanceTo(a.pos); if (d < nd) { nd = d; nh = h; } } if (nh) { a.lastSeen.copy(nh.pos); if (a.mode !== 'engage') { a.mode = 'engage'; a.target = nh; a.tactT = 0; } else if (!a.seeing) a.target = nh; } }
    let best = null, bd = 1e9; const night = this.world.timeId === 'night'; const eye = new V3(a.pos.x, 1.55 * a.sc, a.pos.z); const engaged = a.mode === 'engage'; const P = this.P;
    for (const h of this.hostiles(a)) {
      const hp = h.pos; const dx = hp.x - a.pos.x, dz = hp.z - a.pos.z; const d = Math.hypot(dx, dz); let range = a.vis * (night ? 0.7 : 1) * (this.world.weather === 'fog' ? 0.6 : 1); if (h === P) { range *= (P.crouch > 0.5 ? 0.75 : 1) * (this.time - P.lastShot < 2 ? 1.5 : 1) * (P.sprint > 0.5 ? 1.2 : 1) * (P.light ? 1.3 : 1); if (night && !P.light) range *= 0.7; }
      if (d > range) continue; if (!engaged && d > 6 && Math.abs(angDiff(a.yaw, yawTo(dx, dz))) > 1.15) continue; if (d >= bd) continue;
      const ty = h === P ? hp.y + P.eye * 0.75 : hp.y + 1.2; if (!this.world.los(eye.x, eye.y, eye.z, hp.x, ty, hp.z)) continue; if (this.smokes.length && this.smokeBlocks(eye, new V3(hp.x, ty, hp.z))) continue; best = h; bd = d;
    }
    if (best) {
      a.seeing = true; a.lostT = 0; a.lastSeen.copy(best.pos);
      if (!engaged) { if (best === P && this.mode?.stealth && a.team === 1 && !this.stealthBroken) { a.alert += 0.25 * (1.5 + (1 - bd / a.vis) * 2.5); a.lookAt = best.pos.clone(); if (a.alert >= 1) this.engage(a, best); } else this.engage(a, best); } else a.target = best;
    } else { a.seeing = false; if (engaged) a.lostT += 0.2; if (a.hunt) a.lostT = clamp(a.lostT, 1.2, 3); a.alert = Math.max(0, a.alert - 0.08); }
  }
  engage(a: any, t: any) {
    a.mode = 'engage'; a.target = t; a.tactT = 0; a.lostT = 0; if (a.team === 1 && t === this.P && this.mode?.stealth && !this.stealthBroken) { this.stealthBroken = true; this.mode.onStealthBroken && this.mode.onStealthBroken(this); }
    for (const o of this.actors) if (!o.dead && o !== a && o.team === a.team && !o.captive && o.mode !== 'engage' && o.pos.distanceTo(a.pos) < 30) { if (o.pos.distanceTo(a.pos) < 14) { o.mode = 'engage'; o.target = t; } else { o.mode = 'investigate'; o.invPos = t.pos.clone(); o.invT = 5; } }
  }
  moveTo(a: any, gx: number, gz: number, speed: number, dt: number) {
    const dxg = gx - a.pos.x, dzg = gz - a.pos.z; const dg = Math.hypot(dxg, dzg); if (dg < 0.6) { a.moving = false; return false; }
    a.repathT -= dt; if (!a.path || (a.repathT <= 0 && this.pathBudget > 0) || !a.pg || Math.hypot(a.pg.x - gx, a.pg.z - gz) > 3) { if (this.pathBudget > 0) { this.pathBudget--; a.path = this.world.findPath(a.pos.x, a.pos.z, gx, gz) || []; a.pi = 0; a.pg = { x: gx, z: gz }; a.repathT = 1 + Math.random() * 0.8; } }
    let tx = gx, tz = gz; if (a.path && a.pi < a.path.length) { const wp = a.path[a.pi]; tx = wp.x; tz = wp.z; if (Math.hypot(tx - a.pos.x, tz - a.pos.z) < 0.9) a.pi++; if (a.pi >= a.path.length) { tx = gx; tz = gz; } }
    let dx = tx - a.pos.x, dz = tz - a.pos.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d; const step = speed * dt * (a.crouch > 0.5 ? 0.5 : 1);
    a.pos.x += dx * step; a.pos.z += dz * step; a.mvx = dx; a.mvz = dz; a.moving = true; return true;
  }
  updateActor(a: any, dt: number) {
    const P = this.P; a.hurt = Math.max(0, a.hurt - dt * 3); a.cower = Math.max(0, (a.cower || 0) - dt);
    if (a.dead) { a.deathT += dt; if (a.deathT > 25) { a.rig.root.visible = false; } return; }
    a.fireCd -= dt; a.tactT -= dt; a.perceiveT -= dt; a.nadeCd -= dt; a.moving = false; const oldx = a.pos.x, oldz = a.pos.z; let desiredYaw = null as any; let speedMul = 1; let wantCrouch = 0;
    if (a.captive) return;
    if (a.perceiveT <= 0) { a.perceiveT = 0.2 + Math.random() * 0.1; this.perceive(a); }
    if (a.reloadT > 0) { a.reloadT -= dt; if (a.reloadT <= 0) a.ammo = a.wdef.mag; }
    if (a.cower > 0) { wantCrouch = 1; speedMul = 0; }
    else if (a.mode === 'engage') this.combat(a, dt, (y: number) => (desiredYaw = y), (m: number) => (speedMul = m), (c: number) => (wantCrouch = c));
    else if (a.mode === 'investigate') { if (a.invPos) { const arrived = !this.moveTo(a, a.invPos.x, a.invPos.z, a.speed * 0.9, dt); if (arrived) { a.invT -= dt * 1.5; desiredYaw = a.yaw + Math.sin(this.time * 2 + a.id) * 0.02 + dt * 1.2; } else a.invT -= dt * 0.4; } if (a.invT <= 0 || !a.invPos) { a.mode = a.base; a.invPos = null; } }
    else if (a.base === 'follow' || a.mode === 'follow') this.followLogic(a, dt, (y: number) => (desiredYaw = y), (m: number) => (speedMul = m));
    else this.patrolLogic(a, dt, (y: number) => (desiredYaw = y));
    // aparência/movimento
    if (a.moving && a.mvx !== undefined) { this.world.push(a.pos, 0.38, 0.05, 1.7); if (desiredYaw === null) desiredYaw = yawTo(a.mvx, a.mvz); }
    a.crouch += (wantCrouch - a.crouch) * Math.min(1, dt * 8); if (desiredYaw !== null) a.yaw += angDiff(a.yaw, desiredYaw) * Math.min(1, dt * 9);
    const sp = Math.hypot(a.pos.x - oldx, a.pos.z - oldz) / dt; a.spd += (sp - a.spd) * Math.min(1, dt * 8);
    if (a.moving && sp < 0.3 * a.speed && a.mode !== 'investigate') { a.stuckT += dt; if (a.stuckT > 1.2) { a.stuckT = 0; a.path = null; a.pos.x += rnd(-1, 1); a.pos.z += rnd(-1, 1); } } else a.stuckT = 0;
    a.stepT = (a.stepT || 0) - sp * dt; if (a.stepT <= 0 && sp > 1.5 && a.pos.distanceTo(P.pos) < 35) { a.stepT = 2.2; A.step(a.pos, this.world.surf, sp > 4); }
    a.rig.root.position.copy(a.pos); a.rig.root.rotation.y = a.yaw;
  }
  patrolLogic(a: any, dt: number, face: any) {
    if (a.lookAt && a.alert > 0.05) { face(yawTo(a.lookAt.x - a.pos.x, a.lookAt.z - a.pos.z)); return; }
    if (a.goal) { if (!this.moveTo(a, a.goal.x, a.goal.z, a.speed * (a.goal.run ? 1.15 : 0.8), dt)) { a.goalReached = true; } return; }
    if (a.hold) { a.patrolT -= dt; if (a.patrolT <= 0) { a.patrolT = rnd(2, 5); a.holdYaw = a.yaw + rnd(-1.5, 1.5); } face(a.holdYaw ?? a.yaw); return; }
    a.patrolT -= dt; if (!a.patrolPt || a.patrolT <= 0) { if (a.patrolPt && a.moving === false && Math.random() < 0.5) { a.patrolT = rnd(2, 5); a.patrolPt = null; a.idle = true; return; } for (let k = 0; k < 6; k++) { const x = a.home.x + rnd(-14, 14), z = a.home.z + rnd(-14, 14); if (this.world.free(x, z, 0.6) && !this.world.isBlocked(x, z) && this.world.reachAt(x, z)) { a.patrolPt = new V3(x, 0, z); break; } } a.patrolT = rnd(6, 12); a.idle = false; }
    if (a.patrolPt) { if (!this.moveTo(a, a.patrolPt.x, a.patrolPt.z, a.speed * 0.55, dt)) { a.patrolPt = null; a.patrolT = rnd(1.5, 4); } }
  }
  followLogic(a: any, dt: number, face: any, setSpeed: any) {
    const P = this.P; const dP = a.pos.distanceTo(P.pos); const idx = a.offset; const gx = P.pos.x + Math.sin(P.yaw + Math.PI + Math.sin(idx) * 1.4) * (4 + Math.cos(idx * 2) * 2), gz = P.pos.z + Math.cos(P.yaw + Math.PI + Math.sin(idx) * 1.4) * (4 + Math.cos(idx * 2) * 2);
    if (dP > 5.5) { setSpeed(dP > 14 ? 1.45 : 1.0); this.moveTo(a, this.world.free(gx, gz, 0.5) ? gx : P.pos.x, this.world.free(gx, gz, 0.5) ? gz : P.pos.z, a.speed * (dP > 14 ? 1.5 : 1), dt); } else { face(P.yaw + Math.sin(this.time * 0.3 + idx) * 0.6); }
    a.mode = 'follow';
  }
  combat(a: any, dt: number, face: any, setSpeed: any, setCrouch: any) {
    const P = this.P; let T = a.target; if (!T || T.dead) { a.target = null; a.mode = a.base === 'follow' ? 'follow' : a.base; return; }
    const tp = T.pos; const dx = tp.x - a.pos.x, dz = tp.z - a.pos.z, d = Math.hypot(dx, dz) || 1; const wy = yawTo(dx, dz); const def = a.def; const wd = a.wdef;
    if (a.team === 0 && a.base === 'follow' && a.pos.distanceTo(P.pos) > 32) { a.target = null; a.mode = 'follow'; return; }
    if (a.tactT <= 0) {
      a.tactT = rnd(1.5, 3.2); const pref = def?.hold ? 55 : clamp(wd.range * 0.5, 7, 40); const hpf = a.hp / a.maxHp; const r = Math.random(); a.coverPt = null;
      if (hpf < 0.3 && !a.boss && r < 0.65) a.tact = 'retreat'; else if (d > pref * 1.5) a.tact = 'advance'; else if (d < pref * 0.4 && wd.pel == null) a.tact = 'back'; else if (def?.hold) a.tact = 'hold';
      else if (r < 0.22 && a.type !== 'heavy' && a.type !== 'mg') a.tact = 'flank'; else if (r < 0.62) a.tact = 'cover'; else a.tact = 'strafe';
      if (a.tact === 'cover' || a.tact === 'retreat') { a.coverPt = this.world.coverPoint(a.pos.x, a.pos.z, tp.x, tp.z, a.tact === 'retreat' ? 18 : 12); if (!a.coverPt) a.tact = 'strafe'; else { a.peekT = 0; a.exposed = false; } }
      if (a.tact === 'flank') { const ang = Math.atan2(a.pos.z - tp.z, a.pos.x - tp.x) + (Math.random() < 0.5 ? 1 : -1) * rnd(0.9, 1.4); const rr = clamp(d * 0.85, 8, 30); a.flankPt = { x: tp.x + Math.cos(ang) * rr, z: tp.z + Math.sin(ang) * rr }; if (!this.world.free(a.flankPt.x, a.flankPt.z, 0.6)) a.tact = 'advance'; }
      a.strafeDir = Math.random() < 0.5 ? 1 : -1;
    }
    let canShoot = a.seeing; let crouch = 0;
    switch (a.tact) {
      case 'advance': { const gx = tp.x - (dx / d) * Math.max(8, wd.range * 0.35), gz = tp.z - (dz / d) * Math.max(8, wd.range * 0.35); this.moveTo(a, gx, gz, a.speed, dt); setSpeed(1); break; }
      case 'flank': if (a.flankPt && this.moveTo(a, a.flankPt.x, a.flankPt.z, a.speed * 1.05, dt)) { canShoot = a.seeing && d < wd.range; } else a.tact = 'strafe'; break;
      case 'back': { const gx = a.pos.x - (dx / d) * 6, gz = a.pos.z - (dz / d) * 6; this.moveTo(a, gx, gz, a.speed * 0.9, dt); break; }
      case 'retreat': if (a.coverPt) { const mv = this.moveTo(a, a.coverPt.x, a.coverPt.z, a.speed * 1.1, dt); if (mv) canShoot = false; else { crouch = 1; canShoot = false; } } break;
      case 'cover': if (a.coverPt) { const mv = this.moveTo(a, a.coverPt.x, a.coverPt.z, a.speed * 1.1, dt); if (!mv) { a.peekT -= dt; if (a.peekT <= 0) { a.exposed = !a.exposed; a.peekT = a.exposed ? rnd(1.3, 2.6) : rnd(0.9, 2); } crouch = a.exposed ? 0 : 1; canShoot = a.exposed && a.seeing; } else canShoot = a.seeing && d < wd.range * 0.7 && (a.type !== 'heavy'); } break;
      case 'strafe': { const sx = -dz / d * a.strafeDir, sz = dx / d * a.strafeDir; a.pos.x += sx * a.speed * 0.5 * dt; a.pos.z += sz * a.speed * 0.5 * dt; a.mvx = sx; a.mvz = sz; a.moving = true; this.world.push(a.pos, 0.38, 0.05, 1.7); a.moving = true; if (Math.random() < dt * 0.6) a.strafeDir *= -1; break; }
      case 'hold': crouch = def?.hold && Math.sin(a.id) > 0 ? 1 : 0; break;
    }
    face(wy); setCrouch(crouch); a.rig.pitchAim = Math.atan2(1.2 - 1.5 * a.sc * (crouch ? 0.7 : 1) + (T === P ? P.eye * 0 : 0), d) * 0.5;
    if (!a.seeing) { // perdeu visão
      if (a.lostT > 1.0) { const arrived = !this.moveTo(a, a.lastSeen.x, a.lastSeen.z, a.speed, dt); a.moving = !arrived; if (arrived) a.lostT += dt * 2; if (a.lostT > 7) { a.mode = a.base === 'follow' ? 'follow' : 'investigate'; a.invPos = a.lastSeen.clone(); a.invT = 2; a.target = null; } } canShoot = false;
    }
    // granadas
    if (a.nades > 0 && a.nadeCd <= 0 && d > 9 && d < 32 && a.seeing) { a.nadeCd = rnd(8, 14); a.nades--; a.throwAnim = 0.7; setTimeout(() => { if (a.dead || this.state !== 'playing') return; const from = new V3(a.pos.x, 1.7, a.pos.z); const to = new V3(tp.x, 0, tp.z); const dd = to.clone().sub(from); const L = dd.length(); const v = new V3(dd.x / L * Math.min(18, L * 0.9), 0, dd.z / L * Math.min(18, L * 0.9)); v.y = 0.5 * 18 * L / Math.max(6, Math.min(18, L * 0.9)) * 0.9 + 2; this.launchProj('frag', from, v, a, 2.6); A.throw(from); }, 350); }
    // tiro
    if (a.reloadT > 0) return; if (a.ammo <= 0) { a.reloadT = wd.rl * 1.1; a.reloadAnim = a.reloadT; A.reload('x', a.pos, wd.rl); return; }
    if (canShoot && a.fireCd <= 0 && Math.abs(angDiff(a.yaw, wy)) < 0.35) {
      if (a.burst <= 0) { a.burst = Math.round(rnd(def?.burst?.[0] || 3, (def?.burst?.[1] || 6) + 0.99)); if (wd.mode === 'bolt' || wd.mode === 'pump') a.burst = 1; }
      this.aiFire(a, T, d); a.burst--; a.fireCd = wd.mode === 'bolt' ? 60 / wd.rpm * 1.6 : 60 / wd.rpm * rnd(1, 1.35); if (a.burst <= 0) a.fireCd += rnd(def?.pause?.[0] || 0.6, def?.pause?.[1] || 1.4) * (a.team === 0 ? 0.7 : 1);
    }
  }
  aiFire(a: any, T: any, d: number) {
    const wd = a.wdef; a.ammo--; showFlash(a.rig); const org = new V3(a.pos.x, 1.45 * a.sc * (a.crouch > 0.5 ? 0.7 : 1), a.pos.z); const fwd = new V3(-Math.sin(a.yaw), 0, -Math.cos(a.yaw)); org.addScaledVector(fwd, 0.6);
    const tpos = T === this.P ? new V3(T.pos.x, T.pos.y + T.eye * (0.55 + Math.random() * 0.4), T.pos.z) : new V3(T.pos.x, 1.0 + Math.random() * 0.5, T.pos.z); const dir = tpos.sub(org).normalize();
    const spd = (0.016 + d * 0.0008) / a.acc * (a.spd > 1 ? 1.6 : 1) * (T === this.P && this.P.speed > 3 ? 1.2 : 1) * (a.team === 0 ? 0.8 : 1) * (wd.pel ? 3 : 1); const n = wd.pel || 1; const muzW = new V3(); if (a.rig.gun) a.rig.gun.userData.muz.getWorldPosition(muzW); else muzW.copy(org);
    for (let i = 0; i < n; i++) { const v = dir.clone(); v.x += rnd(-1, 1) * spd; v.y += rnd(-1, 1) * spd; v.z += rnd(-1, 1) * spd; v.normalize(); this.fireBullet(org, v, wd, a, a.dmgMul * (a.team === 1 ? 1 : 1.2), false); }
    A.shot(wd.snd, a.pos); this.muzzleFx(muzW, fwd); if (a.pos.distanceTo(this.P.pos) < 60) { this.pLight(muzW); } this.noise(a.pos, wd.noise * 0.8, a.team, a);
  }
  pLight(p: any) { if (this.lampLights.length && !this._fl) { this._fl = true; const l = this.lampLights[0]; l.position.copy(p); l.intensity = 8; l.color.set(0xffb060); setTimeout(() => { this._fl = false; l.intensity = 0; l.color.set(0xffe0a0); }, 50); } }
  separate() { const L = this.actors; for (let i = 0; i < L.length; i++) { const a = L[i]; if (a.dead || !a.active) continue; for (let j = i + 1; j < L.length; j++) { const b = L[j]; if (b.dead || !b.active) continue; const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d2 = dx * dx + dz * dz; if (d2 < 0.64 && d2 > 1e-5) { const d = Math.sqrt(d2), p = (0.8 - d) * 0.5; a.pos.x -= dx / d * p; a.pos.z -= dz / d * p; b.pos.x += dx / d * p; b.pos.z += dz / d * p; } } } }
  // ================= VIEWMODEL =================
  setupVM() {
    for (const c of [...this.vmScene.children]) if (c.userData.vm) this.vmScene.remove(c);
    const root = new THREE.Group(); root.userData.vm = true; this.vmScene.add(root); this.vmRoot = root; this.vmHolder = new THREE.Group(); root.add(this.vmHolder);
    const look = this.save.look; const uni = UNIFORMS.find((u) => u.id === look.uniform) || UNIFORMS[0]; const gl = { black: 0x1c1d20, tan: 0x9a8a64, green: 0x4a5a35, white: 0xdde2e6, skin: OPT.skin.find((s) => s.id === look.skin)?.hex || 0xe0ac8a }[look.gloves] || 0x1c1d20;
    const sleeve = new THREE.MeshStandardMaterial({ color: uni.base, roughness: 0.9 }), glove = new THREE.MeshStandardMaterial({ color: gl, roughness: 0.7 }), dark = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.8 });
    const seg = (m: any) => { const x = new THREE.Mesh(boxG, m); root.add(x); return x; };
    this.vmArm = { rU: seg(sleeve), rF: seg(sleeve), rH: seg(glove), rK: seg(dark), lU: seg(sleeve), lF: seg(sleeve), lH: seg(glove), lK: seg(dark) };
    this.vmNade = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.09, 8), new THREE.MeshStandardMaterial({ color: 0x4a5236 })); this.vmNade.visible = false; root.add(this.vmNade);
    this.vmMed = new THREE.Mesh(boxG, new THREE.MeshStandardMaterial({ color: 0xe8ecef })); this.vmMed.scale.set(0.16, 0.1, 0.1); this.vmMed.visible = false; root.add(this.vmMed);
    this.vmFlashM = makeFlash(0.3); this.vmSwing = new V3(); this.vmFlash = 0;
  }
  vmClear() { if (this.vmRoot) { this.vmScene.remove(this.vmRoot); this.vmRoot = null; } }
  vmGun() {
    if (!this.vmHolder) return; for (const c of [...this.vmHolder.children]) this.vmHolder.remove(c); const def = this.gun.def; const g = buildGun(def); this.vmHolder.add(g); this.vmGunObj = g; const f = this.vmFlashM; g.add(f); f.position.copy(g.userData.muz.position); f.scale.setScalar(def.model.pistol ? 0.9 : 1.3); this.vmFlashM = f;
    const sc = def.model.scope; this.adsY = def.model.pistol ? 0.1 : ({ reddot: 0.165, acog: 0.172, long: 0.165 }[sc] || 0.126); g.scale.setScalar(0.8); this.adsY *= 0.8; this.adsZ = sc === 'long' ? 0.28 : 0.3; this.vmSlideZ = 0; this.vmMagY = 0;
  }
  updateVM(dt: number, camQuat: any) {
    const P = this.P, d = this.gun.def, g = this.vmGunObj; if (!g) return; const t = this.time; const ads = P.ads;
    const hip = new V3(0.18, -0.2, -0.42), adsP = new V3(0, -this.adsY, -this.adsZ); const pos = hip.clone().lerp(adsP, ads); const rot = new V3(0, 0, 0);
    // balanço
    const bobA = P.moving && P.grounded ? (1 - ads * 0.8) : 0; const sp = P.sprint; pos.x += Math.sin(P.bob * 0.5) * 0.012 * bobA * (1 + sp); pos.y += Math.abs(Math.sin(P.bob * 0.5)) * 0.012 * bobA * (1 + sp) - P.land * 0.05; pos.y += Math.sin(t * 1.4) * 0.002;
    this.vmSwing.x += (-this.mouseDXs * 0.0012 - this.vmSwing.x) * Math.min(1, dt * 10); this.vmSwing.y += (this.mouseDYs * 0.0012 - this.vmSwing.y) * Math.min(1, dt * 10); pos.x += clamp(this.vmSwing.x, -0.04, 0.04); pos.y += clamp(this.vmSwing.y, -0.04, 0.04); rot.y += this.vmSwing.x * 1.5; rot.x += this.vmSwing.y * 1.5;
    // sprint
    pos.x -= sp * 0.07; pos.y -= sp * 0.06; rot.y += sp * 0.6; rot.x -= sp * 0.35; rot.z += sp * 0.1;
    // recuo
    P.kick = Math.max(0, P.kick - dt * 9); const k = P.kick; pos.z += k * (d.model.pistol ? 0.05 : 0.07) * (1 - ads * 0.4); rot.x += k * 0.1 * (1 - ads * 0.5); pos.y += k * 0.008;
    // troca de arma
    if (P.swT > 0) { const u = P.swT / 0.45; const dn = Math.sin(u * Math.PI) ; pos.y -= dn * 0.25 * (u > 0.5 ? 1 : 1) * 0 + (u > 0.5 ? (u - 0.5) * 2 : 0) * 0.35; rot.x -= (u > 0.5 ? (u - 0.5) * 2 : 0) * 0.6; }
    // recarga
    let magDown = 0, leftToMag = 0; if (P.reload > 0) { const u = 1 - P.reload / P.reloadTot; if (d.mode === 'pump') { rot.z += 0.35; rot.x += 0.15; leftToMag = Math.sin(u * Math.PI * 4) > 0 ? 1 : 0.4; pos.y -= 0.03; } else { const dip = Math.sin(clamp(u, 0, 1) * Math.PI); rot.z += dip * 0.55; rot.x -= dip * 0.2; pos.y -= dip * 0.06; pos.x += dip * 0.02; magDown = u < 0.35 ? u / 0.35 : u < 0.6 ? 1 : 1 - (u - 0.6) / 0.25; magDown = clamp(magDown, 0, 1); leftToMag = u < 0.85 ? 1 : 0; } }
    if (P.bolt > 0) { P.bolt -= dt; const u = clamp(P.bolt / Math.max(0.1, 60 / d.rpm), 0, 1); if (d.mode === 'bolt') { rot.z += Math.sin(u * Math.PI) * 0.3; } }
    // arremesso / medkit
    const throwing = P.throwT > 0, healing = P.healT > 0; let hide = 0;
    if (throwing) { const u = 1 - P.throwT / 0.7; hide = u < 0.2 ? u / 0.2 : u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1; this.vmNade.visible = u > 0.15 && u < 0.5; this.vmNade.position.set(0.22 - (u > 0.3 ? (u - 0.3) * 0.5 : 0), -0.2 + (u > 0.3 ? (u - 0.3) * 1.2 : 0), -0.4 - (u > 0.3 ? (u - 0.3) * 1.5 : 0)); this.vmNade.rotation.z = 1; if (!P.throwDone && u >= 0.45) { P.throwDone = true; this.doThrow(); } } else this.vmNade.visible = false;
    if (healing) { hide = 1; this.vmMed.visible = true; this.vmMed.position.set(0.05, -0.22 + Math.sin(t * 8) * 0.01, -0.35); } else this.vmMed.visible = false;
    pos.y -= hide * 0.4; rot.x -= hide * 0.5; this.vmHolder.position.copy(pos); this.vmHolder.rotation.set(rot.x, rot.y, rot.z);
    // peças móveis
    const ud = g.userData; const sl = ud.slide; if (sl && sl.position) { const fireK = P.kick; sl.position.z = (d.mode === 'pump' ? Math.sin(clamp(P.bolt / Math.max(0.1, 60 / d.rpm), 0, 1) * Math.PI) * -0.05 * 0 : 0) + (d.model.pump ? (P.bolt > 0 ? Math.sin(clamp(P.bolt * d.rpm / 60, 0, 1) * Math.PI) * 0.07 : 0) : fireK * 0.035); if (d.model.bolt) sl.position.z = P.bolt > 0 ? Math.sin(clamp(P.bolt * d.rpm / 60, 0, 1) * Math.PI) * 0.09 : 0; }
    if (ud.mag && ud.mag.position) { ud.mag.position.y = -magDown * 0.18; ud.mag.position.z = magDown * 0.03; }
    if (this.vmFlash > 0) { this.vmFlash -= dt; this.vmFlashM.visible = true; this.vmFlashM.rotation.z = Math.random() * 6; } else this.vmFlashM.visible = false;
    // braços
    this.vmRoot.updateMatrixWorld(true); const info = ud.info; const wp = (a: number[]) => g.localToWorld(new V3(a[0], a[1], a[2])); const rh = wp(info.grip); let lh = wp(info.fore); if (d.model.pistol) lh = wp([-0.025, -0.03, 0.025]);
    if (leftToMag) { const mp = wp([0, -0.14, info.mag[2]]); lh.lerp(mp, leftToMag); lh.y -= magDown * 0.06; } if (hide > 0.5) { lh.y -= 0.3; rh.y -= 0.3; } if (throwing) rh.copy(this.vmNade.position).add(new V3(0.0, -0.02, 0.05)); if (healing) { rh.set(0.12, -0.22, -0.3); lh.set(-0.02, -0.22, -0.32); }
    this.limb('r', new V3(0.28, -0.46, 0.1), rh, 1); this.limb('l', new V3(-0.3, -0.46, 0.1), lh, -1);
    void camQuat;
  }
  limb(side: string, s: any, h: any, sx: number) {
    const A = this.vmArm; const U = A[side + 'U'], F = A[side + 'F'], H = A[side + 'H'], K = A[side + 'K']; const mid = s.clone().add(h).multiplyScalar(0.5); const e = mid.clone().add(new V3(sx * 0.07, -0.1, 0.06));
    const place = (m: any, a: any, b: any, w: number) => { const dv = b.clone().sub(a); const L = dv.length(); m.position.copy(a).addScaledVector(dv, 0.5); m.quaternion.setFromUnitVectors(new V3(0, 0, 1), dv.normalize()); m.scale.set(w, w, L); };
    place(U, s, e, 0.095); place(F, e, h, 0.085); place(H, h.clone().addScaledVector(h.clone().sub(e).normalize(), -0.01), h.clone().addScaledVector(h.clone().sub(e).normalize(), 0.075), 0.095); H.scale.set(0.1, 0.075, 0.1); H.quaternion.setFromUnitVectors(new V3(0, 0, 1), h.clone().sub(e).normalize()); H.position.copy(h).addScaledVector(h.clone().sub(e).normalize(), 0.03);
    K.position.copy(h).addScaledVector(h.clone().sub(e).normalize(), 0.06); K.position.y += 0.03; K.scale.set(0.08, 0.025, 0.07); K.quaternion.copy(H.quaternion);
  }
  doThrow() {
    const P = this.P; const dir = new V3(); this.camera.getWorldDirection(dir); const pos = this.camera.position.clone().addScaledVector(dir, 0.5); const v = dir.clone().multiplyScalar(19).add(new V3(0, 3.2, 0)); v.addScaledVector(P.vel, 0.4); this.launchProj(P.throwKind, pos, v, P, P.throwKind === 'smoke' ? 1.5 : 2.5); A.throw(null);
  }
  tacticalScan() { const P = this.P; if (P.dead || P.scanCd > 0) return; P.scanT = 7; P.scanCd = 25; A.beep(); this.notify('PULSO TÁTICO ATIVADO', '#4af'); for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU; this.pA.emit(P.pos.x, 0.3, P.pos.z, Math.cos(a) * 30, 0, Math.sin(a) * 30, 0.5, 1, 1, 0.3, 0.7, 1, 0.8, 0); } }
  useMedkit() { const P = this.P; if (P.dead || P.healT > 0 || P.meds <= 0 || P.hp >= P.maxHp || P.throwT > 0) return; P.healT = 2.2; P.reload = 0; P.meds--; A.pickup(); }
  // ================= ATUALIZAÇÃO DO JOGADOR =================
  updatePlayer(dt: number) {
    const P = this.P, w = this.world; const b = this.settings.binds;
    // olhar
    const sens = 0.0022 * this.settings.sens * (this.camera.fov / this.settings.fov); this.mouseDXs = this.mouseDX; this.mouseDYs = this.mouseDY;
    if (!P.dead && !this.mode?.frozen) { P.yaw -= this.mouseDX * sens; P.pitch -= this.mouseDY * sens; P.pitch = clamp(P.pitch, -1.5, 1.5); }
    this.mouseDX = 0; this.mouseDY = 0;
    // recuperar recuo
    if (P.bank > 0) { const r = Math.min(P.bank, P.bank * dt * 6 + 0.02 * dt); P.pitch -= r * 0.8; P.bank -= r; }
    if (P.dead) { P.deathT += dt; P.crouch += (1 - P.crouch) * dt * 4; return; }
    if (this.mobileLookDX || this.mobileLookDY) { const sx = 0.0022; P.yaw -= this.mobileLookDX * sx; P.pitch -= this.mobileLookDY * sx; P.pitch = clamp(P.pitch, -1.45, 1.45); this.mobileLookDX *= 0.15; this.mobileLookDY *= 0.15; }
    // movimento
    P.swT = Math.max(0, P.swT - dt); P.hurtT = Math.max(0, P.hurtT - dt); P.land = Math.max(0, P.land - dt * 3); P.scanT = Math.max(0, P.scanT - dt); P.scanCd = Math.max(0, P.scanCd - dt); P.protect = Math.max(0, (P.protect || 0) - dt);
    const fwd = (this.down('fwd') ? 1 : 0) - (this.down('back') ? 1 : 0), str = (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0); let want = new V3(str, 0, -fwd); const moving = want.lengthSq() > 0; if (moving) want.normalize();
    const wantCrouch = (this.down('crouch') || (P.crouch > 0.5 && w.ceilY(P.pos.x, P.pos.z, P.pos.y + 1.0) < P.pos.y + 1.78)) ? 1 : 0; P.crouch += (wantCrouch - P.crouch) * Math.min(1, dt * 10); P.eye = lerp(1.7, 1.05, P.crouch);
    const run = this.down('run') && fwd > 0 && P.crouch < 0.5 && P.ads < 0.3 && P.reload <= 0 && !this.mouse[0] && !this.mobileFire; P.sprint += ((run && moving ? 1 : 0) - P.sprint) * Math.min(1, dt * 8);
    let speed = lerp(4.6, 2.4, P.crouch) * (this.gun.def.mv || 1) * (1 + P.sprint * 0.62) * lerp(1, 0.62, P.ads) * (P.healT > 0 ? 0.6 : 1); if (this.mode?.frozen) speed = 0;
    const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw); const wx = want.x * cy + want.z * sy, wz = -want.x * sy + want.z * cy; const acc = P.grounded ? 16 : 3.5;
    P.vel.x += (wx * speed - P.vel.x) * Math.min(1, acc * dt); P.vel.z += (wz * speed - P.vel.z) * Math.min(1, acc * dt);
    if (this.down('jump') && P.grounded && P.crouch < 0.6 && !this.mode?.frozen) { P.vel.y = 7.0; P.grounded = false; A.jump(P.pos); }
    P.vel.y -= 21 * dt; P.pos.x += P.vel.x * dt; P.pos.z += P.vel.z * dt; w.push(P.pos, 0.35, P.pos.y + 0.12, P.pos.y + P.eye + 0.1);
    const fl = w.floorY(P.pos.x, P.pos.z, P.pos.y, 0.28); const ny = P.pos.y + P.vel.y * dt; const wasAir = !P.grounded;
    if (ny <= fl + 0.001 && P.vel.y <= 0) { if (wasAir && P.vel.y < -6) { P.land = Math.min(1, -P.vel.y / 12); A.step(P.pos, w.surf, true); this.shake = Math.max(this.shake, P.land * 0.15); } P.pos.y = fl; P.vel.y = 0; P.grounded = true; } else { P.pos.y = ny; P.grounded = false; if (P.pos.y > fl + 0.05) P.grounded = false; const ce = w.ceilY(P.pos.x, P.pos.z, P.pos.y + P.eye); if (P.pos.y + P.eye + 0.15 > ce && P.vel.y > 0) P.vel.y = 0; }
    if (P.grounded && ny > fl + 0.001 && P.vel.y <= 0 && ny - fl < 0.05) { P.pos.y = fl; }
    const hs = Math.hypot(P.vel.x, P.vel.z); P.speed = hs; P.moving = hs > 0.5; if (P.moving && P.grounded) { P.bob += dt * hs * 2.3; P.stepD += hs * dt; if (P.stepD > (P.sprint > 0.5 ? 2.0 : 2.4) * (1 - P.crouch * 0.3)) { P.stepD = 0; if (P.crouch < 0.7) { A.step(P.pos, this.surfAt(P.pos), P.sprint > 0.5); this.noise(P.pos, P.sprint > 0.5 ? 18 : 8, 0, P); } } }
    // mira
    const wantAds = (this.mouse[2] || this.mobileAds) && P.reload <= 0 && P.sprint < 0.3 && P.swT <= 0 && P.throwT <= 0 && P.healT <= 0; P.ads += ((wantAds ? 1 : 0) - P.ads) * Math.min(1, dt * (this.gun.def.zoom >= 3 ? 6 : 10));
    // armas
    if (P.reload > 0) {
      P.reload -= dt; const w2 = this.gun, d = w2.def;
      if (P.reload <= 0) { if (d.mode === 'pump') { w2.ammo++; w2.res--; if (w2.ammo < this.maxMag(w2) && w2.res > 0) { P.reload = 0.55; P.reloadTot = 0.55; A.reload('pump', null, 1); } } else { const need = this.maxMag(w2) - w2.ammo; const take = Math.min(need, w2.res); w2.ammo += take; w2.res -= take; } }
    }
    if (P.throwT > 0) P.throwT = Math.max(0, P.throwT - dt); if (P.healT > 0) { P.healT -= dt; if (P.healT <= 0) { P.hp = Math.min(P.maxHp, P.hp + 60); this.notify('+60 SAÚDE', '#6f6'); } }
    this.tryShoot(dt);
    if (this.down('reload')) this.startReload();
    if (P.hp < P.maxHp && P.hp > 0 && this.mode?.regen !== false) { P.regenT = (P.regenT ?? 5) - dt; if (P.regenT <= 0) P.hp = Math.min(P.maxHp, P.hp + dt * 6); }
    // interação
    this.updateInteract(dt); this.updatePickups(dt);
  }
  surfAt(p: any) { const s = this.world.surf; if (s === 'dirt' && Math.random() < 0.3) return 'grass'; return s; }
  updateInteract(dt: number) {
    const P = this.P; let best: any = null, bd = 1e9; const dir = new V3(); this.camera.getWorldDirection(dir);
    for (const it of this.interactables) { if (it.done || (it.visible && !it.visible())) continue; const dx = it.pos.x - P.pos.x, dz = it.pos.z - P.pos.z, d = Math.hypot(dx, dz); if (d > (it.r || 2.6)) continue; const fa = (dx * dir.x + dz * dir.z) / (d || 1); if (d > 1.4 && fa < 0.2) continue; if (d < bd) { bd = d; best = it; } }
    this.useTarget = best; if (best && this.down('use') && !P.dead) { P.useT += dt; this.useProg = P.useT / (best.time || 1); if (P.useT >= (best.time || 1)) { P.useT = 0; if (!best.repeat) best.done = true; best.onDone && best.onDone(); A.plant(); } } else { P.useT = 0; this.useProg = 0; }
  }
  updatePickups(dt: number) {
    const P = this.P; for (let i = this.pickups.length - 1; i >= 0; i--) { const p = this.pickups[i]; p.t -= dt; p.mesh.rotation.y += dt; p.mesh.position.y = 0.05 + Math.sin(this.time * 3) * 0.05; if (p.t <= 0) { this.scene.remove(p.mesh); this.pickups.splice(i, 1); continue; }
      if (Math.hypot(p.x - P.pos.x, p.z - P.pos.z) < 1.4 && !P.dead) { if (p.kind === 'ammo') { for (const g of P.guns) g.res = Math.min(g.def.res * 2, g.res + Math.ceil(g.def.mag * 1.2)); if (P.nades < 4) P.nades++; this.notify('+ MUNIÇÃO', '#fc6'); } else { if (P.hp >= P.maxHp && P.meds >= 3) continue; P.hp = Math.min(P.maxHp, P.hp + 40); if (P.meds < 3) P.meds++; this.notify('+ KIT MÉDICO', '#6f6'); } A.pickup(); this.scene.remove(p.mesh); this.pickups.splice(i, 1); } }
  }
  // ================= CÂMERA =================
  updateCamera(dt: number) {
    const P = this.P, cam = this.camera; let ey = P.pos.y + P.eye; const bobA = P.moving && P.grounded ? 1 : 0; ey += Math.sin(P.bob) * 0.03 * bobA * (1 + P.sprint) - P.land * 0.12;
    let roll = 0; const str = (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0); P.lean += (str * 0.03 - P.lean) * Math.min(1, dt * 8); roll = -P.lean + Math.sin(P.bob * 0.5) * 0.004 * bobA;
    let x = P.pos.x, z = P.pos.z, pitch = P.pitch, yaw = P.yaw;
    if (P.dead) { ey = lerp(ey, 0.35, Math.min(1, P.deathT * 2)); roll = Math.min(1.2, P.deathT * 1.5); pitch = lerp(pitch, -0.3, 0.05); if (this.deathFrom) yaw += angDiff(yaw, yawTo(this.deathFrom.x - x, this.deathFrom.z - z)) * Math.min(1, dt * 1.5); }
    if (this.shake > 0.001) { x += rnd(-1, 1) * this.shake * 0.12; ey += rnd(-1, 1) * this.shake * 0.12; roll += rnd(-1, 1) * this.shake * 0.04; pitch += rnd(-1, 1) * this.shake * 0.02; this.shake *= Math.pow(0.02, dt); }
    cam.position.set(x, ey, z); cam.rotation.set(pitch, yaw, roll, 'YXZ');
    const d = this.gun.def; const zoom = lerp(1, d.zoom, P.ads); const baseFov = this.settings.fov + P.sprint * 5 + (P.hurtT > 0 ? 1 : 0); const tf = baseFov / zoom; if (Math.abs(cam.fov - tf) > 0.05) { cam.fov = tf; cam.updateProjectionMatrix(); }
    this.scopeOn = d.zoom >= 3 && P.ads > 0.88 && !P.dead; if (this.vmRoot) this.vmRoot.visible = !this.scopeOn && !P.dead;
    if (this.mLightT > 0) { this.mLightT -= dt; if (this.mLightT <= 0) this.mLight.intensity = 0; } if (this.xLightT > 0) { this.xLightT -= dt; this.xLight.intensity *= 0.85; if (this.xLightT <= 0) this.xLight.intensity = 0; }
    this.flash.intensity = P.light ? 80 : 0; const sun = this.world.env.sun; const env = this.world.env;
    sun.position.set(Math.round(P.pos.x) + this.world.tm.dir[0] * 90, this.world.tm.dir[1] * 90, Math.round(P.pos.z) + this.world.tm.dir[2] * 90); sun.target.position.set(Math.round(P.pos.x), 0, Math.round(P.pos.z)); const sc = sun.shadow.camera; if (sc.right !== 50) { sc.left = -50; sc.right = 50; sc.top = 50; sc.bottom = -50; sc.near = 10; sc.far = 260; sc.updateProjectionMatrix(); }
    const nvgBoost = P.nvg ? 5 : 1; env.hemi.intensity = this.world.tm.hi * (this.world.th.indoor ? 1.15 : 1) * nvgBoost; if (P.nvg) env.hemi.color.set(0x66ff88); else env.hemi.color.set(this.world.tm.hs);
    this.renderer.toneMappingExposure = this.world.tm.exp * (P.nvg ? 1.5 : 1);
  }
  updateLamps(dt: number) {
    if (!this.lampLights.length) return; this.lampT -= dt; if (this.lampT > 0) return; this.lampT = 0.4; const P = this.P.pos; const L = this.world.lamps; const arr = L.map((l: any) => ({ l, d: (l.x - P.x) ** 2 + (l.z - P.z) ** 2 })).filter((o: any) => o.d < 1200).sort((a: any, b: any) => a.d - b.d);
    this.lampLights.forEach((li: any, i: number) => { if (this._fl && i === 0) return; const o = arr[i]; if (o) { li.position.set(o.l.x, o.l.y, o.l.z); li.intensity = this.world.timeId === 'night' || this.world.th.indoor ? 14 : 5; li.color.set(o.l.c || 0xffe0a0); } else li.intensity = 0; });
  }
  updateWeather(dt: number) {
    const wt = this.weather; if (!wt) return; const p = wt.p.geometry.attributes.position; const c = this.camera.position; const arr = p.array;
    for (let i = 0; i < wt.n; i++) { let x = arr[i * 3], y = arr[i * 3 + 1], z = arr[i * 3 + 2]; if (wt.kind === 'rain') y -= dt * 22; else if (wt.kind === 'snow') { y -= dt * 2.2; x += Math.sin(this.time + i) * dt * 0.8; } else { x -= dt * 9; y += Math.sin(this.time + i) * dt * 0.3; } if (y < c.y - 8) y += 20; if (y > c.y + 12) y -= 20; if (x < c.x - 30) x += 60; if (x > c.x + 30) x -= 60; if (z < c.z - 30) z += 60; if (z > c.z + 30) z -= 60; arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z; if (arr[i * 3 + 1] < -1000) arr[i * 3 + 1] = 0; }
    p.needsUpdate = true; if (this.mode && wt.p.position.set) wt.p.position.set(0, 0, 0);
  }
  updateFlyers(dt: number) {
    for (let i = this.flyers.length - 1; i >= 0; i--) { const f = this.flyers[i]; f.t += dt; const m = f.mesh;
      if (f.kind === 'heli') { const u = f.t / f.dur; m.position.lerpVectors(f.from, f.to, u); m.position.y += Math.sin(f.t * 1.3) * 0.4; m.userData.rotor.rotation.y += dt * 30; m.userData.tail.rotation.x += dt * 35; m.rotation.z = Math.sin(f.t) * 0.05; f.snd && f.snd.set(m.position); if (f.fire) { f.ft -= dt; if (f.ft <= 0) { f.ft = rnd(0.08, 0.14); const tp = this.P.pos; const o = m.position.clone(); const d = new V3(tp.x + rnd(-8, 8), 0, tp.z + rnd(-8, 8)).sub(o).normalize(); this.addTracer(o, o.clone().addScaledVector(d, 60), false, null, 0.07); A.shot({ k: 'lmg', big: 1 }, o); } } if (u >= 1) { this.scene.remove(m); this.flyers.splice(i, 1); if (this.menu && this.menu.heli === f) this.menu.heli = null; } }
      else if (f.kind === 'veh') { m.position.x += f.vx * dt; f.snd && f.snd.set(m.position); if (f.t > f.dur) { this.scene.remove(m); this.flyers.splice(i, 1); } }
      else if (f.kind === 'collapse') { m.position.y -= dt * 3 * Math.min(1, f.t); m.rotation.z += dt * 0.08; if (Math.random() < dt * 20) this.pN.emit(m.position.x + rnd(-5, 5), 0.5, m.position.z + rnd(-5, 5), rnd(-1, 1), rnd(1, 3), rnd(-1, 1), 3, 3, 2.5, 0.5, 0.48, 0.44, 0.6, 0.5); if (f.t > 6) { this.scene.remove(m); this.flyers.splice(i, 1); } }
    }
  }
  collapseEvent(x: number, z: number) {
    const g = new THREE.Group(); const pb = new PB(); pb.box(12, 14, 10, 0, 7, 0, 0x8a8478); for (let i = 0; i < 6; i++) pb.box(1.4, 1.6, 0.2, -4.5 + i * 1.8, 7 + (i % 2) * 3, 5.1, 0x1b2a35); const m = new THREE.Mesh(pb.geos().gear, GEAR); m.castShadow = true; g.add(m); g.position.set(x, 0, z); this.scene.add(g); this.world.group && 0;
    this.explode(new V3(x, 3, z), 8, 40, null, false); A.explosion(new V3(x, 3, z), 1.6); this.shake = 1; this.flyers.push({ kind: 'collapse', mesh: g, t: 0 });
  }
  updateFires(dt: number) {
    if (!this.fireList.length) return; const P = this.P ? this.P.pos : this.camera.position; const pq = this.pq;
    for (const f of this.fireList) { const d2 = (f.x - P.x) ** 2 + (f.z - P.z) ** 2; if (d2 > 120 * 120) continue; if (Math.random() < dt * 6 * pq) { this.pA.emit(f.x + rnd(-0.4, 0.4), f.y, f.z + rnd(-0.4, 0.4), rnd(-0.2, 0.2), rnd(1, 2.4), rnd(-0.2, 0.2), f.big ? 1.8 : 1.1, -0.6, rnd(0.5, 0.9), 1, rnd(0.4, 0.7), 0.1, 0.8, 0.5); } if (Math.random() < dt * 4 * pq) this.pN.emit(f.x + rnd(-0.5, 0.5), f.y + 0.4, f.z + rnd(-0.5, 0.5), rnd(-0.3, 0.6), rnd(1.5, 3), rnd(-0.3, 0.3), f.big ? 2.2 : 1.4, 2.2, rnd(2.5, 4.5), 0.12, 0.12, 0.12, 0.55, 0.3); }
  }
  // ================= ATUALIZAÇÃO GERAL =================
  updateGame(dt: number) {
    this.time += dt; this.pathBudget = 3; const P = this.P;
    this.mode?.update && this.mode.update(this, dt);
    this.updatePlayer(dt);
    for (const a of this.actors) { const d2 = (a.pos.x - P.pos.x) ** 2 + (a.pos.z - P.pos.z) ** 2; const act = d2 < 130 * 130 || a.wake || this.mode?.allActive; if (act !== a.active) a.active = act; if (a.active && !a.dead) this.updateActor(a, a.team !== 2 && d2 > 70 * 70 && !this.mode?.allActive ? dt : dt); else if (a.dead) { this.updateActor(a, dt); } }
    this.separate();
    for (let i = this.actors.length - 1; i >= 0; i--) { const a = this.actors[i]; if (a.dead && a.deathT > 30) { this.scene.remove(a.rig.root); this.actors.splice(i, 1); } }
    for (const a of this.actors) { if (!a.active && !a.dead) continue; const r = a.rig; const speed = a.spd; const aim = a.mode === 'engage' || a.mode === 'investigate' ? 1 : (a.base === 'follow' ? 0.3 : 0); const reloadProg = a.reloadT > 0 ? 1 - a.reloadT / (a.reloadAnim || 2) : 0; if (a.throwAnim > 0) a.throwAnim -= dt; const th = a.throwAnim > 0 ? 1 - a.throwAnim / 0.7 : 0;
      if (a.dead) animateSoldier(r, dt, { spd: 0, crouch: 0, aim: 0, dead: Math.min(1, a.deathT * 2.2), deathDir: a.deathDir, noGun: a.noGun }); else animateSoldier(r, dt, { spd: speed, crouch: a.captive ? 0.9 : a.crouch, aim, pitch: a.rig.pitchAim || 0, reload: reloadProg, throw: th, hurt: a.hurt, noGun: a.noGun || (!a.rig.gun), tied: a.captive }); }
    this.updateProjs(dt); this.updateFlyers(dt); this.updateFires(dt);
    for (const p of this.props) { if (p.flashT > 0) p.flashT -= dt; if (p.spin && !p.dead) { p.mesh.userData.turret && (p.mesh.userData.turret.rotation.y += dt * 0.4); } if (p.kind === 'radar' && !p.dead) p.mesh.rotation.y += dt * 0.5; if (p.kind === 'tank' && p.mesh.userData.turret && !p.dead) p.mesh.userData.turret.rotation.y = Math.sin(this.time * 0.3) * 0.5; }
    this.updateCamera(dt); this.updateLamps(dt); this.updateWeather(dt); A.listener(this.camera.position, P.yaw);
    for (const t of this.tracers) { if (t.userData.life > 0) { t.userData.life -= dt; if (t.userData.life <= 0) t.visible = false; } }
    this.updateVM(dt, this.camera.quaternion);
    if (this.hitMark) { this.hitMark.t -= dt; if (this.hitMark.t <= 0) this.hitMark = null; } this.suppress = Math.max(0, (this.suppress || 0) - dt * 0.5);
    if (this.dmgDirs) { for (const d of this.dmgDirs) d.t -= dt; this.dmgDirs = this.dmgDirs.filter((d: any) => d.t > 0); }
    if (this.kf) { for (const k of this.kf) k.life -= dt; this.kf = this.kf.filter((k: any) => k.life > 0); } if (this.notes) { for (const k of this.notes) k.life -= dt; this.notes = this.notes.filter((k: any) => k.life > 0); } if (this.sub) { this.sub.life -= dt; if (this.sub.life <= 0) this.sub = null; }
    this.ambientEvents(dt);
    A.setIntensity(this.combatLevel());
  }
  combatLevel() { const P = this.P; let n = 0; for (const a of this.actors) if (!a.dead && a.team === 1 && a.mode === 'engage' && a.pos.distanceTo(P.pos) < 60) n++; this.combatSm = lerp(this.combatSm || 0, n > 0 ? 1 : (this.mode?.tension ? 0.45 : 0.2), 0.02); return this.combatSm; }
  ambientEvents(dt: number) {
    const m = this.mission; if (!m || !m.ambient || !m.ambient.length) return; this.ambT = (this.ambT ?? 15) - dt; if (this.ambT > 0) return; this.ambT = rnd(18, 40); const k = m.ambient[Math.floor(Math.random() * m.ambient.length)]; const P = this.P.pos;
    if (k === 'arty') this.arty(P, 3); else if (k === 'heli') this.spawnHeli(new V3(P.x - 150, 32, P.z + rnd(-40, 40)), new V3(P.x + 150, 32, P.z + rnd(-40, 40)), Math.random() < 0.6, 14); else if (k === 'convoy') this.spawnConvoy(Math.random() < 0.5);
  }
  // ================= HUD =================
  buildHud() {
    const P = this.P, g = this.gun, h: any = {}; h.hp = Math.ceil(P.hp); h.armor = Math.ceil(P.armor); h.ammo = g.ammo; h.reserve = g.res; h.wname = g.def.name; h.wcat = g.def.cat; h.slot = P.cur; h.slots = P.guns.map((x: any) => x.def.name); h.nades = P.nades; h.smokes = P.smokes; h.meds = P.meds; h.scanCd = Math.ceil(P.scanCd); h.reloading = P.reload > 0; h.reloadP = P.reload > 0 ? 1 - P.reload / P.reloadTot : 0;
    h.mode = this.cfg?.mode; h.kills = P.kills; h.score = P.score; h.hit = this.hitMark; h.scoped = this.scopeOn; h.ads = P.ads; h.spread = this.spreadNow(); h.light = P.light; h.nvg = P.nvg; h.dead = P.dead; h.hurt = P.hurtT > 0 ? P.hurtT : 0; h.lowhp = P.hp < 30; h.suppress = this.suppress || 0; h.dmg = (this.dmgDirs || []).map((d: any) => ({ a: d.a, t: d.t }));
    h.kf = (this.kf || []).map((k: any) => ({ t: k.t, head: k.head })); h.notes = (this.notes || []).map((k: any) => ({ txt: k.txt, color: k.color })); h.sub = this.sub ? { who: this.sub.who, txt: this.sub.txt } : null;
    h.prompt = this.useTarget ? { text: this.useTarget.text, prog: this.useProg || 0 } : null; h.minimap = this.settings.minimap; h.fps = this.fps;
    h.sprint = P.sprint > 0.5; h.scanning = P.scanT > 0; h.healing = P.healT > 0;
    // marcadores
    const cam = this.camera; const mk = []; const v = new V3(); for (const m of this.markers) { if (m.hidden && m.hidden()) continue; const p = m.pos.clone ? m.pos : new V3(m.pos.x, m.pos.y || 1.5, m.pos.z); v.copy(p); const d = v.distanceTo(cam.position); v.project(cam); const behind = v.z > 1; let x = v.x, y = v.y; if (behind) { x = -x; y = -y; } const off = behind || Math.abs(x) > 0.92 || Math.abs(y) > 0.88; if (off) { const s = Math.max(Math.abs(x), Math.abs(y)) || 1; x = (x / s) * 0.92; y = (y / s) * 0.86; } mk.push({ x: (x * 0.5 + 0.5) * 100, y: (-y * 0.5 + 0.5) * 100, label: m.label, dist: Math.round(d), off, color: m.color || '#ffd23f' }); } h.markers = mk;
    // radar
    const rad = []; const R = 50; for (const a of this.actors) { if (a.dead || a.captive && false) continue; const dx = a.pos.x - P.pos.x, dz = a.pos.z - P.pos.z; const d = Math.hypot(dx, dz); if (d > R) continue; if (a.team === 1 && !(P.scanT > 0 || a.mode === 'engage' && d < 30 || a.spotted > 0)) continue; const c = Math.cos(P.yaw), s = Math.sin(P.yaw); const rx = (dx * c - dz * s) / R, rz = (dx * s + dz * c) / R; rad.push({ x: rx, y: rz, t: a.team, c: a.captive }); } h.radar = rad; h.yaw = P.yaw;
    if (this.mode?.hud) this.mode.hud(this, h); return h;
  }
  // ================= LOOP =================
  loop(now: number) {
    requestAnimationFrame(this.loop); const lim = this.settings.fpsLimit; if (lim > 0 && now - this.lastFrame < 1000 / lim - 1.5) return; const dt = Math.min(0.05, (now - this.lastFrame) / 1000 || 0.016); this.lastFrame = now; this.fps = Math.round(this.fps ? this.fps * 0.95 + (1 / dt) * 0.05 : 60);
    if (this.state === 'menu') { this.updateMenu(dt); this.pN.update(dt); this.pA.update(dt); this.debris.update(dt); for (const t of this.tracers) { if (t.userData.life > 0) { t.userData.life -= dt; if (t.userData.life <= 0) t.visible = false; } } this.updateFlyers(dt); this.fireT = 0; this.updateWeather(dt); this.renderFrame(false); return; }
    if (this.state === 'playing') { this.updateGame(dt); this.hudT -= dt; if (this.hudT <= 0) { this.hudT = 0.05; this.cb.onHud && this.cb.onHud(this.buildHud()); } }
    else if (this.state === 'paused') { /* congelado */ }
    if (this.state !== 'paused') { this.pN.update(dt); this.pA.update(dt); this.debris.update(dt); }
    this.renderFrame(this.state !== 'menu');
  }
  renderFrame(vm: boolean) {
    if (this.useComposer && this.composer) { this.mainPass.scene = this.scene; this.mainPass.camera = this.camera; this.vmPass.enabled = vm && !!this.vmRoot && this.vmRoot.visible; this.bloom.strength = this.world?.th?.neon ? 0.55 : 0.3; this.composer.render(); }
    else { this.renderer.autoClear = true; this.renderer.render(this.scene, this.camera); if (vm && this.vmRoot && this.vmRoot.visible) { this.renderer.autoClear = false; this.renderer.clearDepth(); this.renderer.render(this.vmScene, this.vmCam); this.renderer.autoClear = true; } }
  }
  // ================= FIM DE PARTIDA =================
  finish(result: any) {
    this.state = 'ended'; if (document.pointerLockElement) { this.noPause = true; document.exitPointerLock(); setTimeout(() => (this.noPause = false), 300); }
    const before = levelOf(this.save.xp); this.save.xp += Math.round(this.sessionXp + (result.bonusXp || 0)); const after = levelOf(this.save.xp); result.xp = Math.round(this.sessionXp + (result.bonusXp || 0)); result.levelUp = after > before ? after : 0; result.level = after;
    this.checkChallenges(result); writeSave(this.save); A.jingle(!!result.win); A.setIntensity(0.1); this.cb.onResult && this.cb.onResult(result);
  }
  checkChallenges(result: any) { const st = this.save.stats; result.challenges = []; for (const c of CHALLENGES) { if (this.save.claimed[c.id]) continue; if ((st[c.stat] || 0) >= c.goal) { this.save.claimed[c.id] = 1; this.save.xp += c.xp; result.xp += c.xp; result.challenges.push(c.name + ' (+' + c.xp + ' XP)'); } } result.level = levelOf(this.save.xp); }
  persist() { writeSave(this.save); }
}
function rbox(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
  let tmin = 0, tmax = 1e9; const o = [ox, oy, oz], d = [dx, dy, dz], lo = [x0, y0, z0], hi = [x1, y1, z1];
  for (let i = 0; i < 3; i++) { if (Math.abs(d[i]) < 1e-9) { if (o[i] < lo[i] || o[i] > hi[i]) return null; } else { let t1 = (lo[i] - o[i]) / d[i], t2 = (hi[i] - o[i]) / d[i]; if (t1 > t2) { const q = t1; t1 = t2; t2 = q; } if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2; if (tmin > tmax) return null; } }
  return { t: tmin };
}
const BURNT = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });
function require_plane() { return buildPlaneLazy(); }
import { buildPlane as buildPlaneLazy } from './models';
