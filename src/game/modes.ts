// @ts-nocheck
// ============ MODOS DE JOGO: campanha, sobrevivência, confronto, dominação, destruição, treinamento ============
import * as THREE from 'three';
import { MISSIONS, WMAP, WEAPONS, ENEMY, ALLY_LOOKS, NAMES, levelOf } from './data';
import { attachGun, buildProp } from './models';
import { A } from './audio';
import { ZL, WID } from './world';

const V3 = THREE.Vector3; const TAU = Math.PI * 2;
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const pick = (a: any[]) => a[Math.floor(Math.random() * a.length)];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function create(g: any, cfg: any) {
  g.stealthBroken = false; g.kf = []; g.notes = []; g.sub = null; g.hitMark = null; g.dmgDirs = []; g.mission = null; g.useTarget = null; g.deathFrom = null; g.suppress = 0;
  switch (cfg.mode) {
    case 'campaign': return campaign(g, cfg.mission);
    case 'survival': return survival(g);
    case 'tdm': return teamMode(g, 'tdm', cfg);
    case 'dom': return teamMode(g, 'dom', cfg);
    case 'sd': return teamMode(g, 'sd', cfg);
    case 'training': return training(g);
  }
}

// ---------- utilitários ----------
function randPoint(g: any, z: any, r = 1.2, minX = 0) { return g.world.randFree(z, r, minX); }
function freeSpot(g: any, cx: number, cz: number, rmin: number, rmax: number, clr = 0.8) {
  for (let k = 0; k < 60; k++) { const a = rnd(0, TAU), d = rnd(rmin, rmax); const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (g.world.free(x, z, clr) && !g.world.isBlocked(x, z) && g.world.reachAt(x, z)) return { x, z }; }
  return null;
}
function spawnSquad(g: any, zi: number, spec: any) {
  const w = g.world, z = w.zones[zi]; if (!z) return; let anchor = null, k = 0;
  for (const type of Object.keys(spec)) for (let i = 0; i < spec[type]; i++) {
    if (k % 4 === 0) anchor = w.randFree(z, 1.5, z.x0 + (zi === 0 ? 14 : 6));
    const p = freeSpot(g, anchor.x, anchor.z, 0, 7, 0.7) || anchor; k++;
    const a = g.spawnActor({ team: 1, type, x: p.x, z: p.z, yaw: rnd(0, TAU), mode: 'patrol', zone: zi }); a.home.set(anchor.x, 0, anchor.z); z.enemies.push(a);
  }
}
function spawnHunters(g: any, list: string[], cx: number, cz: number, rmin: number, rmax: number, zone = -1) {
  const out = []; for (const type of list) { const p = freeSpot(g, cx, cz, rmin, rmax, 0.8); if (!p) continue; const a = g.spawnActor({ team: 1, type, x: p.x, z: p.z, yaw: rnd(0, TAU), mode: 'engage', zone }); a.hunt = true; a.base = 'patrol'; a.wake = true; out.push(a); } return out;
}
function setBeacon(g: any, pos: any, color = 0xffd23f) {
  if (g.beacon) { g.scene.remove(g.beacon); g.beacon = null; } if (!pos) return;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 70, 12, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide })); m.position.set(pos.x, 35, pos.z); g.scene.add(m); g.beacon = m;
  const r = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.7, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, fog: false, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(pos.x, 0.06, pos.z); m.add(r); r.position.set(0, -34.94, 0);
}
function rank(g: any, total: number, time: number, par: number) {
  const P = g.P; const acc = P.shots ? P.hits / P.shots : 0; const pts = P.kills * 10 + P.headshots * 5 + acc * 100 + (P.deaths === 0 ? 150 : 0) + Math.max(0, par - time) * 0.15 - P.deaths * 40; const pct = pts / (total * 12 + 260);
  return pct >= 1 ? 'S' : pct >= 0.78 ? 'A' : pct >= 0.55 ? 'B' : 'C';
}
function baseStats(g: any, time: number) { const P = g.P; const acc = P.shots ? Math.round(P.hits / P.shots * 100) : 0; return [['Eliminações', P.kills], ['Tiros na cabeça', P.headshots], ['Precisão', acc + '%'], ['Mortes', P.deaths], ['Tempo', fmt(time)]]; }
function refillPlayer(g: any) { const P = g.P; for (const gn of P.guns) { gn.ammo = g.maxMag(gn); gn.res = Math.max(gn.res, gn.def.res); } P.nades = Math.max(P.nades, 2); P.smokes = Math.max(P.smokes, 1); P.meds = Math.max(P.meds, 1); P.reload = 0; }

// =====================================================================
//                              CAMPANHA
// =====================================================================
function campaign(g: any, id: number) {
  const M = MISSIONS.find((m) => m.id === id) || MISSIONS[0]; g.mission = M;
  const w = g.setupWorld(M.theme, { zones: M.zones, seed: 1000 + id * 37, time: M.time, weather: M.weather }); const P = g.P;
  g.spawnPlayer(10, 0, -Math.PI / 2); P.pos.y = 0; w.zones.forEach((z: any) => { z.enemies = []; });
  const wps = ['ar76', 'mp7', 'scart', 'm249', 'pump12', 'dmr'];
  for (let i = 0; i < M.allies; i++) { const a = g.spawnActor({ team: 0, enemy: false, type: 'ally', look: ALLY_LOOKS[i % 5], wp: wps[i % wps.length], x: 8 + (i % 2) * 1.8, z: -3 + i * 1.6, yaw: -Math.PI / 2, mode: 'follow', base: 'follow', name: NAMES[i % NAMES.length], offset: i * 1.7 + 0.5 }); a.active = true; }
  M.zoneE.forEach((spec: any, zi: number) => spawnSquad(g, zi, spec));
  const totalEnemies = g.actors.filter((a: any) => a.team === 1).length;
  const st: any = { idx: -1, cur: null, t: 0, cp: { x: 10, z: 0 }, deadT: 0, fired: new Set(), rescued: [], alarmT: 0, lastReach: null, kills: 0, chatT: 25, done: false, objDone: 0 };
  const endPos = new V3(w.len - 12, 0, 0);
  const finishMission = (win: boolean, reason?: string) => {
    if (st.done) return; st.done = true; setBeacon(g, null); g.markers = []; const time = st.t; const par = M.zones * 110; const rk = rank(g, totalEnemies, time, par);
    const res: any = { win, title: win ? 'MISSÃO CUMPRIDA' : 'MISSÃO FALHOU', sub: win ? M.name : reason, stats: baseStats(g, time), rank: win ? rk : '-', mode: 'campaign', mission: M.id, bonusXp: win ? M.xp + (rk === 'S' ? 300 : rk === 'A' ? 150 : 0) : Math.round(M.xp * 0.1) };
    if (win) { g.save.done[M.id] = true; g.save.stats.missions = Object.keys(g.save.done).length; const b = g.save.best[M.id]; const score = P.score + Math.max(0, Math.round((par - time) * 2)); if (!b || score > b.score) g.save.best[M.id] = { score, rank: rk, time: Math.round(time) }; res.stats.push(['Pontuação', score]); }
    g.finish(res);
  };
  const doEvent = (ev: any) => {
    const p = P.pos;
    switch (ev.do) {
      case 'radio': g.say(ev.who, ev.txt); break;
      case 'heli': { const z0 = rnd(-30, 30); g.spawnHeli(new V3(p.x - 170, 36, p.z + z0), new V3(p.x + 170, 36, p.z - z0), true, 15, Math.random() < 0.5); g.notify('HELICÓPTERO INIMIGO!', '#fa5'); break; }
      case 'arty': g.arty(p, 4); g.notify('ARTILHARIA INIMIGA!', '#fa5'); break;
      case 'convoy': g.spawnConvoy(true); g.notify('COMBOIO INIMIGO À VISTA', '#fa5'); break;
      case 'alarm': A.alarmLoop(new V3(p.x + 25, 6, p.z), 10); g.notify('ALARME ATIVADO!', '#f55'); st.alarmT = 10; spawnHunters(g, Array(4).fill(0).map(() => pick(['rifle', 'rifle', 'spec'])), p.x, p.z, 30, 48); break;
      case 'siren': A.alarmLoop(new V3(p.x + rnd(-40, 40), 6, p.z + rnd(-40, 40)), 8); break;
      case 'ambush': { const cu = st.cur ? M.obj[st.idx]?.zone : 0; const list = Array(ev.n || 5).fill(0).map((_, i) => (i === 0 ? 'spec' : 'rifle')); const h = spawnHunters(g, list, p.x, p.z, 16, 26, typeof cu === 'number' ? cu : 0); void h; g.notify('EMBOSCADA!', '#f55'); break; }
      case 'reinf': spawnHunters(g, Array(ev.n || 4).fill(0).map(() => pick(['rifle', 'rifle', 'spec', 'elite'])), p.x, p.z, 32, 50); g.notify('REFORÇOS INIMIGOS!', '#f55'); break;
      case 'collapse': g.collapseEvent(Math.min(w.len - 20, p.x + rnd(35, 55)), (Math.random() < 0.5 ? -1 : 1) * rnd(34, 38)); break;
    }
  };
  const runEvents = (key: any) => { for (const ev of M.ev || []) { const at = ev.at; const k = at === 'start' ? 'start' : at.obj != null ? 'obj' + at.obj : 't' + at.t; if (k === key && !st.fired.has(ev)) { st.fired.add(ev); doEvent(ev); } } };
  const zoneCenter = (zn: any) => { if (zn === 'end') return endPos.clone(); const z = w.zones[zn]; const p = w.randFree(z, 2.5, z.cx - 10, z.cx + 10); return new V3(p.x, 0, p.z); };
  // ----- fábrica de objetivos -----
  const makeObjective = (o: any) => {
    const ob: any = { text: o.text, sub: () => '', check: () => false, cleanup: () => {} }; const mk: any[] = [];
    const addMarker = (pos: any, label: string, hidden?: any, color?: string) => { const m = { pos: new V3(pos.x, pos.y ?? 1.8, pos.z), label, hidden, color }; g.markers.push(m); mk.push(m); return m; };
    const its: any[] = []; const addInter = (it: any) => { g.interactables.push(it); its.push(it); };
    ob.cleanup = () => { g.markers = g.markers.filter((m: any) => !mk.includes(m)); g.interactables = g.interactables.filter((i: any) => !its.includes(i)); setBeacon(g, null); };
    const dist = (p: any, q: any) => Math.hypot(p.x - q.x, p.z - q.z);
    switch (o.t) {
      case 'reach': { const pos = zoneCenter(o.zone); const r = o.zone === 'end' ? 5.5 : 7.5; addMarker(pos, o.zone === 'end' ? 'EXTRAÇÃO' : 'PONTO', null, '#4f8'); setBeacon(g, pos, 0x44ff88); st.lastReach = pos.clone(); ob.sub = () => (o.stealth ? (g.stealthBroken ? 'FURTIVIDADE QUEBRADA' : 'Furtivo — não seja visto') : `${Math.round(dist(P.pos, pos))} m`); ob.check = () => dist(P.pos, pos) < r; break; }
      case 'kill': { const list = () => g.actors.filter((a: any) => !a.dead && a.team === 1 && (o.zone === 'all' || a.zone === o.zone)); const total = Math.max(1, list().length); const z = typeof o.zone === 'number' ? w.zones[o.zone] : null;
        if (z) addMarker({ x: z.cx, y: 2, z: 0 }, 'ZONA INIMIGA', () => Math.abs(P.pos.x - z.cx) < ZL / 2, '#f55'); ob.sub = () => `${list().length}/${total} inimigos restantes`; ob.check = () => list().length === 0; break; }
      case 'rescue': { const zs = o.zones || [o.zone]; const caps: any[] = []; const nm = id === 3 ? ['Sgt. Reis'] : id === 9 ? ['Dra. Hale'] : ['Cabo Lima', 'Soldado Duarte'];
        zs.forEach((zi: number, i: number) => { const p = w.randFree(w.zones[zi], 1.8, w.zones[zi].cx - 12, w.zones[zi].cx + 12); const a = g.spawnActor({ team: 2, enemy: false, type: 'captive', look: { ...ALLY_LOOKS[(i + 2) % 5], helmet: 'none', vest: 'none', backpack: 'none', glasses: 'none' }, x: p.x, z: p.z, captive: true, noGun: true, name: nm[i % nm.length], yaw: rnd(0, TAU), hp: 150, invuln: true }); a.active = true; caps.push(a);
          addMarker({ x: p.x, y: 2.2, z: p.z }, a.name.toUpperCase(), () => !a.captive, '#4af'); addInter({ pos: a.pos, r: 2.6, time: 3, text: `Libertar ${a.name} (segure E)`, visible: () => a.captive && !a.dead, onDone: () => { a.captive = false; a.invuln = false; a.team = 0; a.mode = 'follow'; a.base = 'follow'; a.noGun = false; a.wdef = WMAP.fn9; attachGun(a.rig, WMAP.fn9); a.ammo = 15; a.hp = a.maxHp; a.dmgMul = 0.7; a.vip = true; st.rescued.push(a); g.say(a.name, id === 9 ? 'Obrigada! Tenho os dados. Vamos sair daqui!' : 'Obrigado, soldado! Vamos sair daqui, rápido!'); g.addXp(30); } }); });
        ob.sub = () => `${caps.filter((c: any) => !c.captive).length}/${caps.length} libertados`; ob.check = () => caps.every((c: any) => !c.captive); ob.fail = () => (caps.some((c: any) => c.dead) ? 'Um prisioneiro foi morto.' : null); break; }
      case 'extract': { const pos = endPos.clone(); addMarker(pos, 'EXTRAÇÃO', null, '#4f8'); setBeacon(g, pos, 0x44ff88); ob.sub = () => `Aliados próximos: ${st.rescued.filter((a: any) => !a.dead && dist(a.pos, P.pos) < 20).length}/${st.rescued.length} • ${Math.round(dist(P.pos, pos))} m`; ob.check = () => dist(P.pos, pos) < 6 && st.rescued.every((a: any) => !a.dead && dist(a.pos, pos) < 18); ob.fail = () => (st.rescued.some((a: any) => a.dead) ? 'O aliado resgatado foi morto.' : null); break; }
      case 'destroy': { const props: any[] = []; const z = w.zones[o.zone]; const big = { plane: 9, tank: 5, apc: 5, truck: 5, fueltank: 4, radar: 3, generator: 3.5, aa: 3.5, core: 4, jeep: 3.5 }[o.kind] || 3;
        for (let i = 0; i < o.count; i++) { let p = null; for (let k = 0; k < 120 && !p; k++) { const x = rnd(z.x0 + 8, z.x1 - 8), zz = rnd(-WID / 2 + 10, WID / 2 - 10); if (w.free(x, zz, big, 0, 4.5) && !w.isBlocked(x, zz) && props.every((q) => Math.hypot(q.pos.x - x, q.pos.z - zz) > 12)) p = { x, z: zz }; } if (!p) p = w.randFree(z, 3);
          const pr = g.addProp(o.kind, p.x, p.z, { target: true, ry: ['jeep', 'tank', 'apc', 'truck'].includes(o.kind) ? pick([0, Math.PI / 2, Math.PI]) : (o.kind === 'plane' ? pick([0, Math.PI]) : 0) }); props.push(pr);
          addMarker({ x: p.x, y: pr.size[1] + 1.5, z: p.z }, pr.name.toUpperCase(), () => pr.dead, '#f84'); addInter({ pos: pr.pos, r: pr.radius + 2.4, time: 3, text: 'Plantar explosivo (segure E)', visible: () => !pr.dead && !pr.fuse, onDone: () => { pr.fuse = 4.5; g.notify('EXPLOSIVO ARMADO — AFASTE-SE!', '#fa5'); } }); }
        ob.sub = () => `${props.filter((p) => p.dead).length}/${props.length} destruídos`; ob.check = (dt: number) => { for (const p of props) if (p.fuse > 0 && !p.dead) { p.fuse -= dt; p.beepT = (p.beepT || 0) - dt; if (p.beepT <= 0) { p.beepT = 0.5; A.beep(); } if (p.fuse <= 0) g.damageProp(p, 99999, P); } return props.every((p) => p.dead); }; break; }
      case 'collect': { const docs: any[] = []; const z = w.zones[o.zone]; for (let i = 0; i < o.count; i++) { const p = w.randFree(z, 1.2, z.x0 + 8); const d = g.addProp('docs', p.x, p.z, { noCol: true, hp: 99999 }); docs.push(d);
          addMarker({ x: p.x, y: 1.4, z: p.z }, 'DOCUMENTOS', () => d.got, '#fd4'); addInter({ pos: d.pos, r: 2.4, time: 1.4, text: 'Pegar documentos (segure E)', visible: () => !d.got, onDone: () => { d.got = true; d.mesh.visible = false; g.notify('DOCUMENTOS RECUPERADOS', '#fd4'); g.addXp(25); A.pickup(); } }); }
        ob.sub = () => `${docs.filter((d) => d.got).length}/${docs.length}`; ob.check = () => docs.every((d) => d.got); break; }
      case 'hack': { const ts: any[] = []; const z = w.zones[o.zone]; for (let i = 0; i < o.count; i++) { const p = w.randFree(z, 1.6, z.x0 + 8); const t = g.addProp('terminal', p.x, p.z, { hp: 99999 }); ts.push(t);
          addMarker({ x: p.x, y: 2.3, z: p.z }, 'TERMINAL', () => t.hacked, '#4cf'); addInter({ pos: t.pos, r: 2.8, time: 4, text: 'Hackear terminal (segure E)', visible: () => !t.hacked, onDone: () => { t.hacked = true; const gm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.07), new THREE.MeshBasicMaterial({ color: 0x39ff74 })); gm.position.set(0, 1.25, -0.31); gm.rotation.x = -0.2; t.mesh.add(gm); g.notify('SISTEMA INVADIDO', '#4f8'); g.addXp(25); A.beep(); } }); }
        ob.sub = () => `${ts.filter((t) => t.hacked).length}/${ts.length} terminais`; ob.check = () => ts.every((t) => t.hacked); break; }
      case 'defend': { const pos = (st.lastReach || zoneCenter(0)).clone(); let integrity = 100, timer = o.time, waveT = 4, waveN = 0, artyT = 20; addMarker({ x: pos.x, y: 2, z: pos.z }, 'POSTO', null, '#4af'); setBeacon(g, pos, 0x44aaff); st.defend = { integrity: () => integrity };
        ob.sub = () => `Resista: ${Math.ceil(timer)}s • Integridade ${Math.ceil(integrity)}%`;
        ob.check = (dt: number) => { timer -= dt; waveT -= dt; artyT -= dt; if (artyT <= 0) { artyT = 28; g.arty(pos, 3); } if (waveT <= 0 && timer > 15) { waveN++; waveT = 21; const n = 3 + Math.floor(waveN * 1.4); const types = []; for (let i = 0; i < n; i++) { const r = Math.random(); types.push(waveN >= 6 && r < 0.12 ? 'shield' : waveN >= 5 && r < 0.2 ? 'elite' : waveN >= 4 && r < 0.3 ? 'heavy' : waveN >= 3 && r < 0.4 ? 'mg' : waveN >= 2 && r < 0.55 ? 'spec' : 'rifle'); } spawnHunters(g, types, Math.min(w.len - 10, pos.x + 55), 0, 0, 24); g.notify(`ONDA DE ATAQUE ${waveN}`, '#f84'); }
          let near = 0; for (const a of g.actors) if (!a.dead && a.team === 1 && Math.hypot(a.pos.x - pos.x, a.pos.z - pos.z) < 10) near++; integrity = Math.max(0, integrity - near * dt * 0.9); return timer <= 0; };
        ob.fail = () => (integrity <= 0 ? 'O posto foi invadido pelo inimigo.' : null); break; }
      case 'survive': { let wave = 0, wait = 6, alive: any[] = []; ob.sub = () => `Onda ${Math.max(1, wave)}/${o.waves} • ${alive.filter((a) => !a.dead).length} inimigos`;
        ob.check = (dt: number) => { alive = alive.filter((a) => !a.dead); if (alive.length === 0) { if (wave >= o.waves) return true; wait -= dt; if (wait <= 0) { wave++; wait = 7; const n = 4 + wave * 2; const types = Array(n).fill(0).map(() => { const r = Math.random(); return wave >= 4 && r < 0.2 ? 'heavy' : wave >= 3 && r < 0.35 ? 'elite' : wave >= 2 && r < 0.5 ? 'spec' : 'rifle'; }); alive = spawnHunters(g, types, P.pos.x, P.pos.z, 26, 55); g.notify(`ONDA ${wave} DE ${o.waves}`, '#f84'); } } return false; }; break; }
      case 'escape': { const pos = endPos.clone(); let timer = o.time, boomT = 3; addMarker(pos, 'EXTRAÇÃO', null, '#4f8'); setBeacon(g, pos, 0xff5522); A.alarmLoop(new V3(P.pos.x, 6, P.pos.z), 12); st.escape = true; ob.sub = () => `DETONAÇÃO EM ${Math.ceil(timer)}s • ${Math.round(dist(P.pos, pos))} m`; ob.check = (dt: number) => { timer -= dt; boomT -= dt; if (boomT <= 0) { boomT = rnd(1.5, 3.2); const s = Math.max(2, timer) * 0.3; g.explode(new V3(P.pos.x - rnd(25, 60), 0.5, rnd(-30, 30)), 6, 30, null, true); g.shake = 0.5 + 0.3 * (1 - timer / o.time); void s; } if (Math.floor(timer * 2) % 2 === 0 && Math.random() < dt * 2) A.beep(); return dist(P.pos, pos) < 6; }; ob.fail = () => (timer <= 0 ? 'A fortaleza explodiu antes da extração.' : null); break; }
    }
    return ob;
  };
  const nextObjective = () => {
    if (st.cur) { st.cur.cleanup(); st.objDone++; g.addXp(50); g.notify('OBJETIVO CONCLUÍDO  +50 XP', '#4f8'); A.ui(true); st.cp = { x: P.pos.x, z: P.pos.z }; }
    st.idx++; if (st.idx >= M.obj.length) { st.cur = null; finishMission(true); return; }
    st.cur = makeObjective(M.obj[st.idx]); g.notify('NOVO OBJETIVO: ' + st.cur.text, '#ffd23f'); runEvents('obj' + st.idx);
  };
  const mode: any = {
    stealth: !!M.stealth, drops: true, tension: true, id: 'campaign',
    update(_g: any, dt: number) {
      if (st.done) return; st.t += dt; st.alarmT = Math.max(0, st.alarmT - dt);
      for (const ev of M.ev || []) if (ev.at && ev.at.t != null && !st.fired.has(ev) && st.t >= ev.at.t) { st.fired.add(ev); doEvent(ev); }
      if (st.cur) { if (st.cur.check(dt)) nextObjective(); const f = st.cur?.fail && st.cur.fail(); if (f) finishMission(false, f); }
      if (P.dead) { st.deadT -= dt; if (st.deadT <= 0) { g.spawnPlayer(st.cp.x, st.cp.z, P.yaw); refillPlayer(g); P.protect = 3; P.hp = P.maxHp; P.armor = 0; g.notify('REAPARECEU NO CHECKPOINT', '#6cf'); const near = g.actors.filter((a: any) => !a.dead && a.team === 0 && !a.captive); near.forEach((a: any) => { a.pos.set(st.cp.x - 2 + rnd(-2, 2), 0, st.cp.z + rnd(-3, 3)); }); } }
      st.chatT -= dt; if (st.chatT <= 0) { st.chatT = rnd(30, 55); const al = g.actors.filter((a: any) => !a.dead && a.team === 0 && !a.captive); if (al.length && g.actors.some((a: any) => a.team === 1 && a.mode === 'engage' && !a.dead)) g.say(pick(al).name, pick(['Contato à frente! Mantenham a posição!', 'Cobertura! Eles estão flanqueando!', 'Estou sem munição, cubram-me!', 'Mais um no chão. Continuem avançando!', 'Atenção aos atiradores!']), true); }
      if (P.hp < 30 && !P.dead && Math.random() < dt * 0.05) { const al = g.actors.filter((a: any) => !a.dead && a.team === 0 && a.pos.distanceTo(P.pos) < 20 && !a.captive); if (al.length) g.say(pick(al).name, 'Você está ferido! Use o kit médico (H)!', true); }
      g.mission.firstZoneT = 0;
    },
    onKill(_g: any, victim: any, killer: any) { if (victim.team === 1 && killer && killer.team === 0 && killer !== P && Math.random() < 0.08) g.say(killer.name, 'Alvo abatido!', true); },
    onPlayerDeath() { st.deadT = 4.5; g.notify('VOCÊ FOI ELIMINADO', '#f55'); },
    onStealthBroken() { g.notify('FURTIVIDADE QUEBRADA!', '#f55'); g.say('Cap. Vega', 'Você foi visto! Alarme geral! Avance ou saia daí!'); doEvent({ do: 'alarm' }); },
    hud(_g: any, h: any) { h.obj = st.cur ? { text: st.cur.text, sub: st.cur.sub(), i: st.idx + 1, n: M.obj.length } : null; h.missionName = M.name; h.timer = fmt(st.t); h.alarm = st.alarmT > 0; h.respawn = P.dead ? Math.max(0, Math.ceil(st.deadT)) : 0; h.defendInt = st.defend ? Math.ceil(st.defend.integrity()) : null; },
  };
  g.mode = mode; nextObjective(); runEvents('start');
  g.say('Cap. Vega', `${M.name}. ${M.sub}. ${M.obj[0].text}.`, false); g.cb.onBanner && g.cb.onBanner(M.name, M.sub);
  A.setAmbient(w.th.amb || (M.time === 'night' ? 'night' : ''), true, M.weather === 'clear' ? 0.1 : 0.22); return mode;
}

// =====================================================================
//                              SOBREVIVÊNCIA
// =====================================================================
function survival(g: any) {
  const themes = ['city', 'village', 'industrial', 'desert', 'port']; const theme = pick(themes);
  const w = g.setupWorld(theme, { zones: 2, seed: Math.floor(rnd(1, 99999)), time: pick(['day', 'dusk']), weather: 'clear' }); const P = g.P;
  g.spawnPlayer(w.zones[0].cx + 20, 0, -Math.PI / 2); const sp = w.randFree(w.zones[0], 1.5, w.zones[0].cx + 10, w.zones[0].cx + 30); g.spawnPlayer(sp.x, sp.z, -Math.PI / 2);
  const S: any = { wave: 0, phase: 'inter', t: 8, money: 600, alive: [], queue: [], t0: 0, shop: false, over: false, spawnT: 0 };
  const mode: any = { id: 'survival', drops: true, allActive: true, tension: true, regen: false,
    update(_g: any, dt: number) {
      if (S.over) return; S.t0 += dt;
      if (S.phase === 'inter') { if (!S.shop) S.t -= dt; if (S.t <= 0) startWave(); }
      else {
        S.spawnT -= dt; S.alive = S.alive.filter((a: any) => !a.dead); if (S.queue.length && S.alive.length < 12 + Math.min(10, S.wave) && S.spawnT <= 0) { S.spawnT = 0.8; const type = S.queue.shift(); const h = spawnHunters(g, [type], P.pos.x, P.pos.z, 28, 60); if (h[0]) { S.alive.push(h[0]); if (type === 'cmd') { h[0].boss = true; h[0].hp = h[0].maxHp = 600 + S.wave * 40; h[0].name = 'Comandante'; } } else S.queue.unshift(type); }
        if (!S.queue.length && !S.alive.length) endWave();
      }
      if (P.dead) { S.deadT = (S.deadT ?? 3) - dt; if (S.deadT <= 0 && !S.over) gameOver(); }
    },
    onKill(_g: any, v: any, k: any) { if (v.team === 1 && k === P) { S.money += 100 + (v.def?.xp || 10) * 4 + (g.hitMark?.head ? 50 : 0); } },
    onPlayerDeath() { S.deadT = 3; g.notify('VOCÊ CAIU NA ONDA ' + S.wave, '#f55'); },
    openShop(_g: any) { if (S.phase !== 'inter' || S.over) return; S.shop = true; g.noPause = true; if (document.pointerLockElement) document.exitPointerLock(); g.cb.onShop && g.cb.onShop(true); },
    closeShop() { S.shop = false; g.noPause = false; g.cb.onShop && g.cb.onShop(false); g.lock(); },
    skipWait() { S.t = Math.min(S.t, 0.1); },
    shopItems() { const lv = levelOf(g.save.xp); const cur = g.gun; const items = [{ id: 'ammo', name: 'Munição Total', desc: 'Recarrega todas as armas', price: 250 }, { id: 'heal', name: 'Cura Total', desc: 'Restaura toda a vida', price: 200 }, { id: 'med', name: 'Kit Médico', desc: '+1 kit (máx. 4)', price: 300 }, { id: 'nade', name: 'Granadas', desc: '+2 frag, +1 fumaça', price: 250 }, { id: 'armor', name: 'Colete Balístico', desc: 'Armadura 100', price: 450 }, { id: 'dmg', name: `Dano+ (${cur.def.name})`, desc: `Nível ${cur.up.dmg}/3  (+15% dano)`, price: 600 * (cur.up.dmg + 1), max: cur.up.dmg >= 3 }, { id: 'mag', name: `Pente+ (${cur.def.name})`, desc: `Nível ${cur.up.mag}/3  (+25% pente)`, price: 500 * (cur.up.mag + 1), max: cur.up.mag >= 3 }];
      for (const d of WEAPONS) if (d.lv <= lv && d.id !== cur.def.id && !g.P.guns.some((x: any) => x.def.id === d.id)) items.push({ id: 'w:' + d.id, name: d.name, desc: `${d.cat} — Substitui o slot ${g.P.cur + 1}`, price: Math.max(400, d.price), weapon: true }); return items; },
    buy(_g: any, id: string) {
      const it = mode.shopItems().find((i: any) => i.id === id); if (!it || it.max) return 'Indisponível'; if (S.money < it.price) return 'Dinheiro insuficiente'; S.money -= it.price;
      if (id === 'ammo') { for (const x of P.guns) { x.ammo = g.maxMag(x); x.res = x.def.res * (1 + 0.25 * x.up.mag); } } else if (id === 'heal') P.hp = P.maxHp; else if (id === 'med') P.meds = Math.min(4, P.meds + 1); else if (id === 'nade') { P.nades += 2; P.smokes += 1; } else if (id === 'armor') P.armor = 100; else if (id === 'dmg') g.gun.up.dmg++; else if (id === 'mag') { g.gun.up.mag++; g.gun.ammo = g.maxMag(g.gun); } else if (id.startsWith('w:')) { P.guns[P.cur] = g.newGun(WMAP[id.slice(2)]); g.vmGun(); }
      A.pickup(); return 'Comprado: ' + it.name; },
    hud(_g: any, h: any) { h.wave = S.wave; h.money = S.money; h.waveInfo = S.phase === 'inter' ? (S.shop ? 'LOJA ABERTA' : `PRÓXIMA ONDA EM ${Math.ceil(S.t)}s — [B] LOJA`) : `${S.alive.length + S.queue.length} inimigos restantes`; h.timer = fmt(S.t0); h.respawn = 0; h.obj = { text: S.phase === 'inter' ? `Prepare-se para a onda ${S.wave + 1}` : `Onda ${S.wave}`, sub: `Dinheiro: $${S.money}`, i: S.wave, n: 0 }; h.phase = S.phase; },
  };
  const startWave = () => { S.wave++; S.phase = 'wave'; const n = 5 + S.wave * 2; const q = []; for (let i = 0; i < n; i++) { const r = Math.random(), wv = S.wave; q.push(wv >= 9 && r < 0.12 ? 'elite' : wv >= 7 && r < 0.2 ? 'heavy' : wv >= 6 && r < 0.28 ? 'sniper' : wv >= 5 && r < 0.36 ? 'shield' : wv >= 4 && r < 0.46 ? 'mg' : wv >= 3 && r < 0.6 ? 'spec' : 'rifle'); } if (S.wave % 5 === 0) q.push('cmd'); S.queue = q; g.notify(`ONDA ${S.wave}`, '#f84'); g.say('SISTEMA', `Onda ${S.wave}. ${n} hostis.`, false); S.spawnT = 1; if (S.wave % 3 === 0) g.arty(P.pos, 2); };
  const endWave = () => { S.phase = 'inter'; S.t = 14; const bonus = 150 + S.wave * 50; S.money += bonus; g.notify(`ONDA ${S.wave} CONCLUÍDA  +$${bonus}`, '#4f8'); g.addXp(40 + S.wave * 10); P.hp = Math.min(P.maxHp, P.hp + 25); for (const x of P.guns) x.res = Math.min(x.def.res * 2, x.res + Math.ceil(x.def.mag * 0.6)); if (P.dead) { P.dead = false; } for (let i = 0; i < 2; i++) { const p = w.randFree(null, 1); g.addPickup(p.x, p.z, i ? 'medbox' : 'ammo'); } g.save.stats.bestWave = Math.max(g.save.stats.bestWave, S.wave); };
  const gameOver = () => { S.over = true; const score = (S.wave - 1) * 1000 + P.score + S.money; const list = g.save.scores.survival; list.push({ score, wave: S.wave, kills: P.kills, d: new Date().toLocaleDateString() }); list.sort((a: any, b: any) => b.score - a.score); list.length = Math.min(list.length, 5); g.save.stats.bestWave = Math.max(g.save.stats.bestWave, S.wave); g.save.stats.bestWave = Math.max(g.save.stats.bestWave, S.wave - 1 + 0); g.finish({ win: false, title: 'FIM DE JOGO', sub: `Você chegou à onda ${S.wave}`, stats: [...baseStats(g, S.t0), ['Onda', S.wave], ['Pontuação', score]], rank: score > 8000 ? 'S' : score > 5000 ? 'A' : score > 2500 ? 'B' : 'C', mode: 'survival', ranking: list, bonusXp: S.wave * 25 }); };
  g.mode = mode; A.setAmbient('', true, 0.12); g.say('SISTEMA', 'Modo sobrevivência. Resista às ondas. Pressione B entre ondas para a loja.', false); return mode;
}

// =====================================================================
//                    MODOS DE EQUIPE (confronto / dominação / destruição)
// =====================================================================
function teamMode(g: any, kind: string, cfg: any) {
  const themeId = cfg.map || 'city'; const w = g.setupWorld(themeId, { zones: kind === 'tdm' ? 2 : 3, seed: Math.floor(rnd(1, 99999)), time: cfg.time || 'day', weather: 'clear' }); const P = g.P; const L = w.len;
  const nPer = kind === 'tdm' ? 5 : kind === 'dom' ? 6 : 5; const S: any = { score: [0, 0], round: 0, phase: 'freeze', t: 4, bots: [], respT: [], over: false, t0: 0, flags: [], bomb: null, side: 0, roundsWon: [0, 0], msg: '', sdT: 0, planter: null, overT: 0 };
  const wpool = ['ar76', 'mp7', 'scart', 'pump12', 'm249', 'ar76', 'vector'];
  const spawnPos = (team: number) => { const x = team === 0 ? 10 : L - 12; const sidePos = kind === 'sd' ? (S.side === team ? 10 : w.zones[2].cx + 6) : x; return { x: sidePos + rnd(-3, 3), z: rnd(-14, 14) }; };
  const mkBot = (team: number, i: number) => {
    const sp = spawnPos(team); const look = team === 0 ? ALLY_LOOKS[i % 5] : ENEMY[pick(['rifle', 'spec', 'elite', 'rifle'])].look; const wp = pick(wpool);
    const a = g.spawnActor({ team, enemy: team === 1, type: team === 1 ? 'rifle' : 'ally', look, wp, x: sp.x, z: sp.z, yaw: team === 0 ? -Math.PI / 2 : Math.PI / 2, mode: 'patrol', base: 'patrol', name: (team === 0 ? 'Aliado ' : 'Dominion ') + (i + 1), hp: 100 }); a.active = true; a.team = team; a.dmgMul = 0.6 * ({ easy: 0.6, normal: 1, hard: 1.4 }[g.settings.diff] || 1); a.acc = 1; a.vis = 70; a.speed = 4; a.botIdx = i; a.hold = false; a.hp = a.maxHp = 100; a.botTeam = team; return a;
  };
  const clearActors = () => { for (const a of g.actors) g.scene.remove(a.rig.root); g.actors.length = 0; };
  const setSpawn = (a: any) => { a.pos.set(a.spawnX, 0, a.spawnZ); };
  void setSpawn;
  const startRound = () => {
    clearActors(); S.round++; if (kind === 'sd') { S.atk = S.round % 2 === 1 ? 0 : 1; S.side = S.atk; } S.bots = []; S.bomb = null; S.planter = null; S.sdT = 0; S.defuser = null; g.interactables.length = 0; g.markers.length = 0; if (g.bombMesh) { g.scene.remove(g.bombMesh); g.bombMesh = null; }
    const n0 = nPer - 1, n1 = nPer; for (let i = 0; i < n0; i++) S.bots.push(mkBot(0, i)); for (let i = 0; i < n1; i++) S.bots.push(mkBot(1, i));
    const sp = spawnPos(0); g.spawnPlayer(sp.x, sp.z, kind === 'sd' && S.side !== 0 ? Math.PI / 2 : -Math.PI / 2); refillPlayer(g); P.protect = 2;
    S.phase = 'freeze'; S.t = kind === 'sd' ? 8 : kind === 'tdm' ? 4 : 3; mode.frozen = true;
    if (kind === 'sd') setupSD();
    if (kind === 'tdm') for (const a of S.bots) if (Math.random() < 0.6) a.hunt = true;
    g.notify(kind === 'sd' ? `RODADA ${S.round} — ${S.atk === 0 ? 'ATAQUE' : 'DEFESA'}` : kind === 'tdm' ? `ROUND ${S.round}` : 'DOMINAÇÃO', '#ffd23f'); A.beep();
  };
  // ---------- DOMINAÇÃO ----------
  const setupDom = () => { const names = ['A', 'B', 'C']; const zs = w.zones; const pts = [[zs[0].cx, -14], [zs[1].cx, 10], [zs[2].cx, -10]]; pts.forEach((p, i) => { const f = w.randFree({ x0: p[0] - 8, x1: p[0] + 8, cx: p[0] }, 2.2); const pos = new V3(f.x, 0, f.z); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 6), new THREE.MeshStandardMaterial({ color: 0x888888 })); pole.position.set(pos.x, 3, pos.z); const flag = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 0.05), new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0x222222 })); flag.position.set(pos.x + 0.8, 5.4, pos.z); const ring = new THREE.Mesh(new THREE.RingGeometry(6.4, 7, 40), new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(pos.x, 0.08, pos.z); g.scene.add(pole, flag, ring); S.flags.push({ n: names[i], pos, owner: -1, prog: 0, flag, ring }); g.markers.push({ pos: new V3(pos.x, 6.5, pos.z), label: names[i], get color() { const o = S.flags[i].owner; return o === 0 ? '#4af' : o === 1 ? '#f55' : '#ddd'; } }); }); };
  if (kind === 'dom') setupDom();
  // ---------- DESTRUIÇÃO ----------
  const sites: any[] = [];
  const setupSD = () => {
    sites.length = 0; const z1 = w.zones[1]; const pa = w.randFree({ x0: z1.cx - 14, x1: z1.cx - 6, cx: z1.cx - 10 }, 2.4), pb = w.randFree({ x0: z1.cx + 6, x1: z1.cx + 14, cx: z1.cx + 10 }, 2.4);
    [pa, pb].forEach((p, i) => { const s = { n: i ? 'B' : 'A', pos: new V3(p.x, 0, p.z) }; sites.push(s); g.markers.push({ pos: new V3(p.x, 3, p.z), label: 'ALVO ' + s.n, color: '#fd4', hidden: () => !!S.bomb && S.bomb.site !== s }); });
    if (!S.siteRings) S.siteRings = []; for (const r of S.siteRings) g.scene.remove(r); S.siteRings = sites.map((s) => { const r = new THREE.Mesh(new THREE.RingGeometry(3.4, 4, 32), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.55, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(s.pos.x, 0.08, s.pos.z); g.scene.add(r); return r; });
    // interações do jogador
    for (const s of sites) g.interactables.push({ pos: s.pos, r: 4, time: 3.5, text: 'Plantar bomba (segure E)', visible: () => S.atk === 0 && S.phase === 'live' && !S.bomb && !P.dead, onDone: () => plant(s), repeat: false });
    g.interactables.push({ pos: new V3(), r: 2.6, time: 5, text: 'Desarmar bomba (segure E)', get pos2() { return S.bomb; }, visible() { if (S.atk === 1 && S.phase === 'planted' && !P.dead && S.bomb) { this.pos = S.bomb.pos; return true; } return false; }, onDone: () => defuse(0), repeat: true });
    S.bots.forEach((a: any) => { if (a.team === S.atk) { a.sdSite = sites[a.botIdx % 2]; } else a.sdSite = sites[a.botIdx % 2]; });
  };
  const plant = (site: any) => { if (S.bomb) return; const m = buildProp('bomb'); m.position.set(site.pos.x, 0, site.pos.z); g.scene.add(m); g.bombMesh = m; S.bomb = { site, pos: site.pos.clone(), t: 35, mesh: m }; S.phase = 'planted'; g.notify('BOMBA PLANTADA EM ' + site.n, '#f55'); A.plant(); g.say('SISTEMA', 'A bomba foi plantada.', false); for (const it of g.interactables) if (it.text.startsWith('Plantar')) it.done = true; for (const mk of g.markers) mk.hidden = ((s) => () => S.bomb && S.bomb.site !== s)(site); };
  const defuse = (who: any) => { if (!S.bomb) return; S.bomb.mesh.visible = false; S.bomb = null; S.phase = 'end'; S.t = 5; endRound(S.atk === 0 ? 1 : 0, 'BOMBA DESARMADA'); void who; };
  const endRound = (winTeam: number, msg: string) => {
    if (S.phase === 'over') return; S.phase = 'end'; S.t = 5; S.msg = msg; if (kind === 'sd') S.roundsWon[winTeam]++; else S.roundsWon[winTeam]++; g.notify(`${msg} — ${winTeam === 0 ? 'SUA EQUIPE VENCE' : 'EQUIPE INIMIGA VENCE'}`, winTeam === 0 ? '#4f8' : '#f55'); mode.frozen = false;
    if (S.roundsWon[winTeam] >= 3) { S.t = 4; S.over = winTeam + 1; }
  };
  const finishMatch = (winTeam: number) => {
    const win = winTeam === 0; const title = win ? 'VITÓRIA' : 'DERROTA'; const modeName = kind === 'tdm' ? 'Confronto' : kind === 'dom' ? 'Dominação' : 'Destruição'; const score = P.score + P.kills * 100 + (win ? 1000 : 0);
    const list = g.save.scores[kind]; list.push({ score, kills: P.kills, win, d: new Date().toLocaleDateString() }); list.sort((a: any, b: any) => b.score - a.score); list.length = Math.min(5, list.length); if (win) g.save.stats.wins++;
    g.finish({ win, title, sub: modeName + (kind === 'dom' ? ` — ${Math.floor(S.score[0])} x ${Math.floor(S.score[1])}` : ` — ${S.roundsWon[0]} x ${S.roundsWon[1]}`), stats: [...baseStats(g, S.t0), ['Pontuação', score]], rank: win ? (P.deaths < 2 ? 'S' : 'A') : (P.kills > 5 ? 'B' : 'C'), mode: kind, ranking: list, bonusXp: win ? 200 : 60 });
  };
  const teamAlive = (t: number) => S.bots.filter((a: any) => a.team === t && !a.dead).length + (t === 0 && !P.dead ? 1 : 0);
  const mode: any = { id: kind, allActive: true, tension: true, drops: false, regen: false, frozen: true,
    update(_g: any, dt: number) {
      if (S.finished) return; S.t0 += dt;
      if (S.phase === 'freeze') { S.t -= dt; mode.frozen = true; for (const a of S.bots) a.cower = 0.5; if (S.t <= 0) { S.phase = 'live'; S.t = kind === 'sd' ? 120 : kind === 'tdm' ? 150 : 9999; mode.frozen = false; for (const a of S.bots) a.cower = 0; g.notify('COMBATE!', '#f55'); A.beep(); S.domT = 0; } return; }
      for (const a of S.bots) { if (a.dead || a.mode === 'engage') continue; a.base = 'patrol'; }
      if (kind === 'tdm') { // bots sem alvo: vão em direção ao inimigo
        for (const a of S.bots) { if (a.dead || a.hunt || a.mode === 'engage') continue; a.goalT = (a.goalT || 0) - dt; if (!a.goal || a.goalT <= 0 || a.goalReached) { a.goalT = rnd(6, 12); a.goalReached = false; const bx = a.team === 0 ? rnd(L * 0.4, L * 0.9) : rnd(L * 0.1, L * 0.6); const p = w.randFree(null, 1, bx - 12, bx + 12); a.goal = { x: p.x, z: p.z, run: true }; } }
        if (S.phase === 'live') { S.t -= dt; const a0 = teamAlive(0), a1 = teamAlive(1); if (a0 === 0) endRound(1, 'EQUIPE ELIMINADA'); else if (a1 === 0) endRound(0, 'INIMIGOS ELIMINADOS'); else if (S.t <= 0) endRound(a0 > a1 ? 0 : a1 > a0 ? 1 : (Math.random() < 0.5 ? 0 : 1), 'TEMPO ESGOTADO'); }
      }
      if (kind === 'dom') {
        S.domT += dt; for (const f of S.flags) { let c0 = P.dead ? 0 : (Math.hypot(P.pos.x - f.pos.x, P.pos.z - f.pos.z) < 7 ? 1 : 0), c1 = 0; for (const a of S.bots) if (!a.dead && Math.hypot(a.pos.x - f.pos.x, a.pos.z - f.pos.z) < 7) { if (a.team === 0) c0++; else c1++; } const net = c0 - c1; if (net !== 0) { f.prog = Math.max(-1, Math.min(1, f.prog + Math.sign(net) * Math.min(3, Math.abs(net)) * 0.14 * dt)); } else if (f.owner === -1 || Math.abs(f.prog) < 1) f.prog += 0 ; const newOwner = f.prog >= 1 ? 0 : f.prog <= -1 ? 1 : f.owner; if (newOwner !== f.owner) { f.owner = newOwner; g.notify(`PONTO ${f.n} ${newOwner === 0 ? 'CAPTURADO' : 'PERDIDO'}`, newOwner === 0 ? '#4af' : '#f55'); A.beep(); const col = newOwner === 0 ? 0x3a8aff : 0xff4040; f.flag.material.color.setHex(col); f.flag.material.emissive.setHex(col); f.ring.material.color.setHex(col); } f.flag.position.y = 5.4 - 1.2 * (1 - (f.owner === -1 ? 0.3 : 1)); if (f.owner >= 0) S.score[f.owner] += dt * (1); }
        if (S.score[0] >= 150 || S.score[1] >= 150 || S.t0 > 360) { S.finished = true; finishMatch(S.score[0] >= S.score[1] ? 0 : 1); return; }
        // bots: metas
        for (const a of S.bots) { if (a.dead || a.mode === 'engage') continue; a.goalT = (a.goalT || 0) - dt; if (!a.goal || a.goalT <= 0) { a.goalT = rnd(8, 14); const own = S.flags.filter((f: any) => f.owner === a.team); const not = S.flags.filter((f: any) => f.owner !== a.team); let f = not.length && Math.random() < 0.75 ? not.sort((p: any, q: any) => p.pos.distanceTo(a.pos) - q.pos.distanceTo(a.pos))[(a.botIdx % Math.min(2, not.length)) || 0] : (own[0] ? pick(own) : pick(S.flags)); if (!f) f = pick(S.flags); const p = w.randFree({ x0: f.pos.x - 5, x1: f.pos.x + 5, cx: f.pos.x }, 0.8, f.pos.x - 5, f.pos.x + 5); a.goal = { x: f.pos.x + (p.x - f.pos.x) * 0.6, z: f.pos.z + rnd(-4, 4), run: true }; a.goalReached = false; } }
        // respawn
        for (let i = S.respT.length - 1; i >= 0; i--) { const r = S.respT[i]; r.t -= dt; if (r.t <= 0) { S.respT.splice(i, 1); const nb = mkBot(r.team, r.idx); S.bots.push(nb); if (Math.random() < 0.3) nb.hunt = true; } }
        S.bots = S.bots.filter((a: any) => !a.dead || a.deathT < 3);
        if (P.dead) { S.pr = (S.pr ?? 5) - dt; if (S.pr <= 0) { const sp = spawnPos(0); g.spawnPlayer(sp.x, sp.z, -Math.PI / 2); refillPlayer(g); P.protect = 3; S.pr = null; } }
        return;
      }
      if (kind === 'sd') sdUpdate(dt);
      if (S.phase === 'end') { S.t -= dt; if (S.t <= 0) { if (S.over) { S.finished = true; finishMatch(S.over - 1); } else startRound(); } }
      if (kind === 'tdm' && S.phase === 'live' && P.dead) { /* espectador até o fim do round */ }
    },
    onKill(_g: any, v: any, k: any) {
      if (kind === 'dom' && v.botTeam !== undefined) { S.respT.push({ team: v.team, idx: v.botIdx, t: 6 }); if (k === P) { P.score += 50; } }
      if (k === P) { P.score += 100; }
    },
    onPlayerDeath() { g.notify(kind === 'dom' ? 'REAPARECENDO EM 5s' : 'VOCÊ FOI ELIMINADO', '#f55'); if (kind === 'dom') S.pr = 5; },
    hud(_g: any, h: any) {
      h.teamMode = kind; h.timer = kind === 'sd' && S.phase !== 'freeze' ? fmt(Math.max(0, S.sdT)) : kind === 'tdm' && S.phase === 'live' ? fmt(Math.max(0, S.t)) : fmt(S.t0); h.respawn = kind === 'dom' && P.dead ? Math.ceil(S.pr ?? 0) : 0;
      if (kind === 'dom') { h.scores = [Math.floor(S.score[0]), Math.floor(S.score[1]), 150]; h.flags = S.flags.map((f: any) => ({ n: f.n, owner: f.owner, prog: f.prog })); h.obj = { text: 'Capture e mantenha os pontos A, B e C', sub: `${Math.floor(S.score[0])} x ${Math.floor(S.score[1])} (150)`, i: 0, n: 0 }; }
      else { h.scores = [S.roundsWon[0], S.roundsWon[1], 3]; h.alive = [teamAlive(0), teamAlive(1)]; h.obj = kind === 'tdm' ? { text: 'Elimine a equipe adversária', sub: `Round ${S.round} • ${teamAlive(0)} x ${teamAlive(1)} • Placar ${S.roundsWon[0]}-${S.roundsWon[1]}`, i: 0, n: 0 } : { text: S.phase === 'freeze' ? `PREPARAÇÃO — ${S.atk === 0 ? 'Você ATACA: plante a bomba no alvo A ou B' : 'Você DEFENDE: impeça a plantação'}` : S.phase === 'planted' ? (S.atk === 0 ? 'Proteja a bomba até detonar!' : 'DESARME A BOMBA!') : S.atk === 0 ? 'Plante a bomba em A ou B (segure E)' : 'Defenda os alvos A e B', sub: `Rodada ${S.round} • ${teamAlive(0)} x ${teamAlive(1)} • Placar ${S.roundsWon[0]}-${S.roundsWon[1]}${S.bomb ? ' • BOMBA ' + Math.ceil(S.bomb.t) + 's' : ''}`, i: 0, n: 0 }; }
      h.freeze = S.phase === 'freeze' ? Math.ceil(S.t) : 0; h.bombT = S.bomb ? Math.ceil(S.bomb.t) : null;
    },
  };
  // ----- lógica de Destruição -----
  const sdUpdate = (dt: number) => {
    if (S.phase === 'live') { S.sdT = S.t - 0; S.t -= dt; S.sdT = S.t; }
    if (S.phase === 'live' || S.phase === 'planted') {
      const atk = S.atk; const aAtk = S.bots.filter((a: any) => a.team === atk && !a.dead), aDef = S.bots.filter((a: any) => a.team !== atk && !a.dead); const pOn = P.dead ? 0 : 1; const atkN = aAtk.length + (atk === 0 ? pOn : 0), defN = aDef.length + (atk === 1 ? pOn : 0);
      // bots atacantes
      for (const a of S.bots) { if (a.dead || a.mode === 'engage') continue; const s = a.sdSite || sites[0];
        if (a.team === atk) { if (!S.bomb) { a.goal = { x: s.pos.x + rnd(-1, 1), z: s.pos.z + rnd(-1, 1), run: true }; const d = Math.hypot(a.pos.x - s.pos.x, a.pos.z - s.pos.z); if (d < 3.2 && !S.planter) { S.planter = a; } if (S.planter === a && d < 3.2 && !S.bomb) { a.plantT = (a.plantT || 0) + dt; a.crouch = 1; if (a.plantT > 3.5) plant(s); } } else { const gp = a.sdGuard || (a.sdGuard = { x: S.bomb.pos.x + rnd(-6, 6), z: S.bomb.pos.z + rnd(-6, 6) }); a.goal = { x: gp.x, z: gp.z }; } }
        else { if (S.bomb) { const rushers = aDef.sort((p: any, q: any) => p.pos.distanceTo(S.bomb.pos) - q.pos.distanceTo(S.bomb.pos)).slice(0, 2); if (rushers.includes(a)) { a.goal = { x: S.bomb.pos.x + 1, z: S.bomb.pos.z, run: true }; if (a.pos.distanceTo(S.bomb.pos) < 2.6) { a.defT = (a.defT || 0) + dt; if (a.defT > 5) defuse(a); } } else a.goal = { x: S.bomb.pos.x + rnd(-8, 8), z: S.bomb.pos.z + rnd(-8, 8) }; } else { if (!a.goal || a.goalReached) { a.goal = { x: s.pos.x + rnd(-9, 9), z: s.pos.z + rnd(-9, 9) }; a.goalReached = false; a.goalT = 0; } a.goalT = (a.goalT || 0) + dt; if (a.goalT > 10) { a.goal = null; } } }
      }
      if (S.bomb) { S.bomb.t -= dt; S.bomb.bt = (S.bomb.bt || 0) - dt; if (S.bomb.bt <= 0) { S.bomb.bt = Math.max(0.15, S.bomb.t / 35); A.beep(); } if (S.bomb.t <= 0) { const bp = S.bomb.pos.clone(); S.bomb.mesh.visible = false; S.bomb = null; g.explode(bp, 20, 400, null); S.phase = 'end'; endRound(S.atk, 'A BOMBA DETONOU'); return; } }
      if (S.phase !== 'end') { if (defN === 0) { S.phase = 'end'; endRound(S.atk, 'DEFENSORES ELIMINADOS'); } else if (atkN === 0 && !S.bomb) { S.phase = 'end'; endRound(S.atk === 0 ? 1 : 0, 'ATACANTES ELIMINADOS'); } else if (S.t <= 0 && !S.bomb) { S.phase = 'end'; endRound(S.atk === 0 ? 1 : 0, 'TEMPO ESGOTADO'); } }
    }
  };
  g.mode = mode; mode.frozen = true; startRound(); A.setAmbient('', true, 0.1); return mode;
}

// =====================================================================
//                              TREINAMENTO
// =====================================================================
function training(g: any) {
  const w = g.setupWorld('base', { noZones: true, zones: 0, len: 140, time: 'day', weather: 'clear', seed: 5, build: (W: any) => {
    W.genBorder(); W.genScenery(); W.stageArea(8, 0, 1);
    W.box(15, 0, 0, 0.6, 1.0, 44, 0x8a8f84, { mat: 'concrete' }); W.box(15, 1.0, 0, 0.9, 0.12, 44, 0x6a6f64, { col: false });
    for (const d of [35, 55, 75, 95, 115]) { W.glow(d, 0, 0, 0.6, 0.05, 44, 0xd0a020); for (const zz of [-20, 20]) W.box(d, 0, zz, 0.4, 1.5, 0.4, 0xd0a020, { col: false }); }
    for (const z of [-17, -6, 6, 17]) W.glow(10, 0, z, 120, 0.03, 0.15, 0xe8e8e0);
    W.box(134, 0, 0, 8, 7, 92, 0x6a5a40, { mat: 'dirt' });
    for (let i = 0; i < 6; i++) W.sandbag(22 + i * 14, i % 2 ? -23 : 23, 6, 'x');
  } }); const P = g.P; g.spawnPlayer(11, 0, -Math.PI / 2);
  const S: any = { phase: 'ready', t: 4, time: 60, score: 0, hits: 0, targets: [], over: false, combo: 0, t0: 0 };
  const mkT = (x: number, z: number, o: any) => { const p = g.addProp('target', x, z, { noCol: true, hp: 1 }); p.mesh.rotation.y = Math.PI / 2; p.hitscan = true; p.box = { hx: 0.14, hz: 0.5, h: 2.1 }; p.ttype = o.type; p.pts = o.pts; p.hp = 1; p.up = o.type !== 'move' && o.type !== 'far' ? 0 : 1; p.upT = rnd(0.5, 2.5); p.vz = o.vz || 0; p.x0 = x; p.z0 = z; p.mesh.scale.setScalar(o.scale || 1); p.onHit = (pr: any) => { if (!pr.up || S.phase !== 'live') return; S.hits++; S.combo++; const pts = pr.pts + Math.min(30, S.combo * 2); S.score += pts; g.hitMark = { t: 0.25, head: pr.ttype === 'far', kill: true }; A.hitmark(pr.ttype === 'far'); g.notify(`+${pts}`, '#ffd23f'); pr.up = 0; pr.downT = rnd(0.6, 1.4); }; S.targets.push(p); return p; };
  const spec = [['pop', 28, 10, 8], ['pop', 34, 28, 8], ['pop', 40, 44, 8], ['pop', 28, -10, 8], ['pop', 34, -28, 8], ['pop', 40, -44, 8], ['move', 56, 0, 25], ['move', 62, 10, 25], ['move', 68, -10, 25], ['far', 100, 14, 40], ['far', 104, -14, 40], ['far', 112, 0, 40], ['far', 96, 0, 40]];
  for (const [type, x, z, pts] of spec as any) mkT(x, z, { type, pts, vz: type === 'move' ? rnd(3.5, 6.5) * (Math.random() < 0.5 ? 1 : -1) : 0, scale: type === 'far' ? 1.5 : 1 });
  mkT(80, 0, { type: 'bonus', pts: 100, vz: 11, scale: 0.9 });
  S.targets[S.targets.length - 1].mesh.traverse((o: any) => { if (o.isMesh) { o.material = new THREE.MeshStandardMaterial({ color: 0xff8a1a, emissive: 0x552200 }); } });
  const mode: any = { id: 'training', allActive: true, frozen: true, regen: true, drops: false,
    update(_g: any, dt: number) {
      if (S.over) return; S.t0 += dt;
      if (S.phase === 'ready') { S.t -= dt; if (S.t <= 0) { S.phase = 'live'; mode.frozen = false; g.notify('FOGO!', '#f55'); A.beep(); P.shots = 0; } }
      else { S.time -= dt; if (S.time <= 0) { S.over = true; finish(); } }
      for (const p of S.targets) {
        const m = p.mesh; if (p.ttype === 'pop') { p.upT -= dt; if (p.up && p.upT <= 0) { p.up = 0; p.downT = rnd(0.8, 2); } else if (!p.up && (p.downT = (p.downT ?? 1) - dt) <= 0 && S.phase === 'live') { p.up = 1; p.upT = rnd(1.6, 3.2); } }
        if (p.ttype === 'move' || p.ttype === 'bonus') { m.position.z += p.vz * dt; const lim = p.ttype === 'bonus' ? 22 : 18; if (Math.abs(m.position.z) > lim) { p.vz *= -1; m.position.z = Math.sign(m.position.z) * lim; } p.pos.z = m.position.z; if (!p.up && (p.downT = (p.downT ?? 1) - dt) <= 0) p.up = 1; }
        if (p.ttype === 'far') { if (!p.up && (p.downT = (p.downT ?? 1) - dt) <= 0) p.up = 1; }
        m.rotation.z = THREE.MathUtils.lerp(m.rotation.z, p.up ? 0 : -1.5, Math.min(1, dt * 14)); p.pos.x = m.position.x; p.pos.z = m.position.z;
      }
      void w;
    },
    onKill() {}, onPlayerDeath() {},
    hud(_g: any, h: any) { h.timer = fmt(Math.max(0, S.phase === 'ready' ? 60 : S.time)); h.freeze = S.phase === 'ready' ? Math.ceil(S.t) : 0; const acc = P.shots ? Math.round(S.hits / P.shots * 100) : 0; h.obj = { text: 'Acerte os alvos: pop-up (10), móveis (25), distantes (40), laranja (100)', sub: `Pontos ${S.score}  •  Precisão ${acc}%  •  Sequência ${S.combo}`, i: 0, n: 0 }; h.score = S.score; h.trainingLeft = Math.ceil(S.time); },
  };
  S.shotCheck = 0; const origShots = () => P.shots;
  void origShots;
  const finish = () => { const acc = P.shots ? S.hits / P.shots : 0; const total = Math.round(S.score + acc * 500); const list = g.save.scores.training; list.push({ score: total, acc: Math.round(acc * 100), d: new Date().toLocaleDateString() }); list.sort((a: any, b: any) => b.score - a.score); list.length = Math.min(5, list.length); g.addXp(Math.round(total / 25)); g.finish({ win: true, title: 'TREINAMENTO CONCLUÍDO', sub: 'Tiro ao alvo', stats: [['Acertos', S.hits], ['Tiros disparados', P.shots], ['Precisão', Math.round(acc * 100) + '%'], ['Pontuação', total]], rank: total > 1500 ? 'S' : total > 900 ? 'A' : total > 450 ? 'B' : 'C', mode: 'training', ranking: list }); };
  // contagem de combo quebra ao errar
  const origDo = g.doShot.bind(g); g.doShot = function () { const before = S.hits; origDo(); setTimeout(() => { if (S.hits === before && S.phase === 'live') S.combo = 0; }, 80); };
  g.mode = mode; A.setAmbient('', false, 0.08); g.say('SISTEMA', 'Campo de tiro. Você tem 60 segundos.', false); return mode;
}
