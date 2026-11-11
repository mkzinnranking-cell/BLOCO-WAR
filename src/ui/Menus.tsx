// @ts-nocheck
import { useEffect, useState } from 'react';
import { WEAPONS, WMAP, MISSIONS, OPT, UNIFORMS, CAMOS, CAT_LABEL, optList, levelOf, xpFor, CHALLENGES, EQUIP, BIND_LABEL, DEFAULT_LOOK, DEFAULT_BINDS, tr, writeSave } from '../game/data';
import { A } from '../game/audio';

export const Btn = ({ children, onClick, disabled, big, active, className = '' }: any) => (
  <button disabled={disabled} onClick={(e) => { A.init(); A.click(); onClick && onClick(e); }} className={`btn ${big ? 'btn-big' : ''} ${active ? 'btn-active' : ''} ${className}`}>{children}</button>
);
export const Panel = ({ title, children, className = '' }: any) => (
  <div className={`panel ${className}`}>{title && <div className="panel-title">{title}</div>}{children}</div>
);
const Bar = ({ label, v, max = 100, color = '#ffd23f' }: any) => (
  <div className="mb-2"><div className="flex justify-between text-[11px] tracking-widest text-white/70"><span>{label}</span><span>{Math.round(v)}</span></div><div className="h-2 bg-white/10"><div className="h-full" style={{ width: Math.min(100, (v / max) * 100) + '%', background: color }} /></div></div>
);
const Rank = ({ r, size = 80 }: any) => <div className="font-black text-center" style={{ fontSize: size, lineHeight: 1, color: { S: '#ffd23f', A: '#6fe39a', B: '#6cb8ff', C: '#c9c9c9' }[r] || '#888', textShadow: '0 4px 0 #000' }}>{r}</div>;

// ================= MENU PRINCIPAL =================
export function MainMenu({ g, go, bump }: any) {
  const lang = g.settings.lang; const lv = levelOf(g.save.xp); const cur = xpFor(lv), nxt = xpFor(lv + 1); const emb = OPT.emblem.find((e) => e.id === g.save.look.emblem);
  const items = [['campaign', 'campaign'], ['multi', 'multi'], ['survival', 'survival'], ['domination', 'dom'], ['destruction', 'sd'], ['training', 'training'], ['arsenal', 'arsenal'], ['custom', 'custom'], ['settings', 'settings']];
  const [quit, setQuit] = useState(false);
  return (
    <div className="absolute inset-0 flex">
      <div className="w-[420px] h-full flex flex-col justify-center pl-14 pr-6" style={{ background: 'linear-gradient(90deg, rgba(5,8,12,0.92), rgba(5,8,12,0.55) 70%, transparent)' }}>
        <div className="mb-2"><div className="title-block">BLOCO</div><div className="title-block title-red">WAR</div></div>
        <div className="text-[11px] tracking-[0.5em] text-white/60 mb-6">AURORA vs DOMINION • FPS TÁTICO</div>
        <div className="flex flex-col gap-1.5">
          {items.map(([k, to]) => <Btn key={k} onClick={() => { if (to === 'multi') go('modes', { mode: 'tdm' }); else if (['survival', 'dom', 'sd', 'training'].includes(to)) go('modes', { mode: to }); else go(to); }}>{tr(lang, k)}</Btn>)}
          <Btn onClick={() => setQuit(true)}>{tr(lang, 'quit')}</Btn>
        </div>
        <div className="mt-6 text-[10px] text-white/30">WASD • Mouse • Shift • Ctrl • Espaço • R • E • F • 1-4 • Esc</div>
      </div>
      <div className="flex-1" />
      <div className="w-[340px] h-full flex flex-col justify-center pr-10 gap-3">
        <Panel>
          <div className="flex items-center gap-3"><div className="w-14 h-14 flex items-center justify-center text-3xl bg-white/10 border border-white/20">{emb?.sym}</div><div><div className="text-xs tracking-widest text-white/60">OPERADOR</div><div className="text-2xl font-black">{tr(lang, 'level')} {lv}</div></div></div>
          <div className="mt-3 h-2 bg-white/10"><div className="h-full bg-amber-400" style={{ width: ((g.save.xp - cur) / (nxt - cur)) * 100 + '%' }} /></div>
          <div className="text-[11px] text-white/60 mt-1">{g.save.xp - cur} / {nxt - cur} XP • {g.save.stats.kills} elim. • {Object.keys(g.save.done).length}/13 missões</div>
        </Panel>
        <Panel title="DESAFIOS">
          <div className="flex flex-col gap-2 max-h-[300px] overflow-hidden">{CHALLENGES.filter((c) => !g.save.claimed[c.id]).slice(0, 5).map((c) => { const v = Math.min(c.goal, g.save.stats[c.stat] || 0); return <div key={c.id}><div className="flex justify-between text-xs"><span className="font-semibold">{c.name}</span><span className="text-amber-300">+{c.xp} XP</span></div><div className="text-[10px] text-white/50">{c.desc}</div><div className="h-1 bg-white/10 mt-1"><div className="h-full bg-sky-400" style={{ width: (v / c.goal) * 100 + '%' }} /></div></div>; })}</div>
        </Panel>
      </div>
      {quit && <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-4 z-50"><div className="title-block">OBRIGADO POR JOGAR</div><div className="text-white/60 tracking-widest">Progresso salvo automaticamente. Pode fechar a aba.</div><Btn onClick={() => { try { window.close(); } catch (e) { /* */ } setQuit(false); }}>FECHAR</Btn><Btn onClick={() => setQuit(false)}>VOLTAR AO JOGO</Btn></div>}
      <div className="absolute bottom-3 right-4 text-[10px] text-white/30" onClick={bump}>BLOCO WAR v1.0</div>
    </div>
  );
}

// ================= CAMPANHA =================
export function CampaignScreen({ g, go, start }: any) {
  const [sel, setSel] = useState(() => { for (let i = 0; i < MISSIONS.length; i++) if (!g.save.done[MISSIONS[i].id]) return i; return 0; });
  const m = MISSIONS[sel]; const locked = (i: number) => i > 0 && !g.save.done[MISSIONS[i - 1].id]; const best = g.save.best[m.id];
  return (
    <div className="absolute inset-0 flex p-8 gap-6" style={{ background: 'linear-gradient(90deg, rgba(5,8,12,0.92), rgba(5,8,12,0.7))' }}>
      <div className="w-[380px] flex flex-col"><div className="screen-title">CAMPANHA</div><div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-1.5">{MISSIONS.map((mm, i) => (
        <button key={mm.id} disabled={locked(i)} onClick={() => { A.click(); setSel(i); }} className={`mission ${sel === i ? 'mission-sel' : ''}`}><div className="w-9 text-2xl font-black text-white/40">{String(mm.id).padStart(2, '0')}</div><div className="flex-1 text-left"><div className="font-bold tracking-wider text-sm">{mm.name}</div><div className="text-[11px] text-white/50">{mm.sub}</div></div>{locked(i) ? <span>🔒</span> : g.save.done[mm.id] ? <span className="text-green-400 font-black">✔ {g.save.best[mm.id]?.rank}</span> : null}</button>))}</div>
        <div className="mt-3"><Btn onClick={() => go('main')}>{tr(g.settings.lang, 'back')}</Btn></div></div>
      <div className="flex-1 flex flex-col justify-end pb-6 max-w-3xl">
        <div className="text-xs tracking-[0.5em] text-amber-300">MISSÃO {m.id} / 13</div>
        <div className="text-6xl font-black tracking-widest" style={{ textShadow: '0 4px 0 #000' }}>{m.name}</div>
        <div className="text-lg tracking-widest text-white/70 mb-3">{m.sub} • {m.time === 'night' ? 'NOITE' : m.time === 'dusk' ? 'ENTARDECER' : 'DIA'} • {({ clear: 'LIMPO', fog: 'NEBLINA', rain: 'CHUVA', snow: 'NEVE', sand: 'TEMPESTADE DE AREIA' })[m.weather]}</div>
        <Panel title="BRIEFING"><p className="text-sm leading-relaxed text-white/85">{m.brief}</p>
          <div className="mt-3 text-[11px] tracking-widest text-white/50">OBJETIVOS</div><ul className="text-sm list-disc ml-5 text-white/85">{m.obj.map((o, i) => <li key={i}>{o.text}</li>)}</ul>
          <div className="mt-3 text-xs text-white/60">Recompensa: <b className="text-amber-300">{m.xp} XP</b> {best && <span>• Melhor: {best.rank} ({best.score} pts)</span>}</div></Panel>
        <div className="mt-4"><Btn big disabled={locked(sel)} onClick={() => start({ mode: 'campaign', mission: m.id })}>INICIAR OPERAÇÃO ▶</Btn></div>
      </div>
    </div>
  );
}

// ================= SETUP DE MODOS =================
const MAPS = [['city', 'Cidade em Ruínas'], ['village', 'Vila'], ['port', 'Porto'], ['desert', 'Deserto'], ['industrial', 'Complexo Industrial'], ['airport', 'Aeroporto'], ['factory', 'Fábrica'], ['nightcity', 'Distrito Neon'], ['bunker', 'Bunker'], ['forest', 'Floresta']];
const MODE_INFO: any = {
  tdm: ['CONFRONTO', 'Elimine o time adversário em partidas de rounds contra bots. Vença 3 rounds. Mapas fechados, 5 contra 5.', 'tdm'],
  dom: ['DOMINAÇÃO', 'Capture e mantenha os pontos A, B e C. Quanto mais pontos controlados, mais rápido a pontuação sobe. Primeiro a 150 vence. Reaparecimento ativo.', 'dom'],
  sd: ['DESTRUIÇÃO', 'Uma equipe planta a bomba nos alvos A ou B; a outra defende e desarma. Preparação, ataque, defesa, plantação e desarme. Vença 3 rodadas.', 'sd'],
  survival: ['SOBREVIVÊNCIA', 'Enfrente ondas cada vez mais difíceis. Ganhe dinheiro, compre armas e melhorias entre as ondas (tecla B). Entre no ranking.', 'survival'],
  training: ['TIRO AO ALVO', 'Campo de treinamento: alvos pop-up, móveis e distantes. 60 segundos. Pontuação, precisão e ranking.', 'training'],
};
export function ModeSetup({ g, go, start, mode: m0 }: any) {
  const [mode, setMode] = useState(m0 || 'tdm'); const [map, setMap] = useState('city'); const [time, setTime] = useState('day'); const info = MODE_INFO[mode]; const team = ['tdm', 'dom', 'sd'].includes(mode); const rk = g.save.scores[mode] || [];
  return (
    <div className="absolute inset-0 flex p-8 gap-6" style={{ background: 'linear-gradient(90deg, rgba(5,8,12,0.92), rgba(5,8,12,0.7))' }}>
      <div className="w-[300px] flex flex-col"><div className="screen-title">MODOS</div><div className="flex flex-col gap-1.5">{Object.keys(MODE_INFO).map((k) => <Btn key={k} active={k === mode} onClick={() => setMode(k)}>{MODE_INFO[k][0]}</Btn>)}</div><div className="mt-auto"><Btn onClick={() => go('main')}>{tr(g.settings.lang, 'back')}</Btn></div></div>
      <div className="flex-1 max-w-3xl flex flex-col justify-center gap-4">
        <div className="text-5xl font-black tracking-widest" style={{ textShadow: '0 4px 0 #000' }}>{info[0]}</div>
        <p className="text-white/80 max-w-xl">{info[1]}</p>
        {team && (<Panel title="MAPA"><div className="grid grid-cols-5 gap-2">{MAPS.map(([id, nm]) => <button key={id} onClick={() => { A.click(); setMap(id); }} className={`mission !flex-col !items-center !py-3 ${map === id ? 'mission-sel' : ''}`}><div className="text-2xl">{({ city: '🏙', village: '🏘', port: '⚓', desert: '🏜', industrial: '🏭', airport: '✈', factory: '⚙', nightcity: '🌃', bunker: '🕳', forest: '🌲' })[id]}</div><div className="text-[11px] mt-1 text-center">{nm}</div></button>)}</div>
          <div className="mt-3 flex gap-2 items-center"><span className="text-xs tracking-widest text-white/60 mr-2">HORÁRIO</span>{[['day', 'DIA'], ['dusk', 'ENTARDECER'], ['night', 'NOITE']].map(([k, n]) => <Btn key={k} active={time === k} onClick={() => setTime(k)}>{n}</Btn>)}</div></Panel>)}
        <Btn big onClick={() => start({ mode, map, time })}>INICIAR ▶</Btn>
      </div>
      <div className="w-[280px] flex flex-col justify-center"><Panel title="RANKING (TOP 5)">{rk.length === 0 ? <div className="text-sm text-white/50">Sem registros ainda.</div> : rk.map((r: any, i: number) => <div key={i} className="flex justify-between text-sm py-1 border-b border-white/10"><span className="text-amber-300 font-black">#{i + 1}</span><span>{r.score}</span><span className="text-white/50 text-xs">{r.wave ? 'Onda ' + r.wave : r.acc != null ? r.acc + '%' : r.win ? 'Vitória' : 'Derrota'}</span></div>)}</Panel></div>
    </div>
  );
}

// ================= ARSENAL =================
export function ArsenalScreen({ g, go, bump }: any) {
  const lv = levelOf(g.save.xp); const [sel, setSel] = useState(g.save.loadout[0]); const w = WMAP[sel]; const cats = [...new Set(WEAPONS.map((x) => x.cat))];
  useEffect(() => { g.setMenuFocus('arsenal'); g.setShowcase('arsenal', null, sel); }, [sel]);
  useEffect(() => () => g.setMenuFocus('main'), []);
  const equip = (slot: number) => { if (w.lv > lv) return; const l = [...g.save.loadout]; const ex = l.indexOf(w.id); if (ex >= 0) l[ex] = l[slot]; l[slot] = w.id; g.save.loadout = l; writeSave(g.save); A.ui(true); bump(); };
  const dps = Math.round(w.dmg * (w.pel || 1) * (w.mode === 'burst' ? w.rpm / 60 * 0.6 : w.rpm / 60));
  return (
    <div className="absolute inset-0 flex p-8 gap-5" style={{ background: 'linear-gradient(90deg, rgba(5,8,12,0.9), rgba(5,8,12,0.4) 55%, rgba(5,8,12,0.8))' }}>
      <div className="w-[330px] flex flex-col"><div className="screen-title">ARSENAL</div><div className="flex-1 overflow-y-auto pr-1">{cats.map((c) => <div key={c}><div className="text-[10px] tracking-[0.3em] text-white/40 mt-2 mb-1">{c.toUpperCase()}</div>{WEAPONS.filter((x) => x.cat === c).map((x) => <button key={x.id} onClick={() => { A.click(); setSel(x.id); }} className={`mission ${sel === x.id ? 'mission-sel' : ''}`}><div className="flex-1 text-left text-sm font-bold">{x.name}</div>{x.lv > lv ? <span className="text-xs text-white/50">🔒 Nv.{x.lv}</span> : g.save.loadout.includes(x.id) ? <span className="text-xs text-amber-300">SLOT {g.save.loadout.indexOf(x.id) + 1}</span> : null}</button>)}</div>)}</div>
        <div className="mt-3"><Btn onClick={() => go('main')}>{tr(g.settings.lang, 'back')}</Btn></div></div>
      <div className="flex-1" />
      <div className="w-[360px] flex flex-col justify-center gap-3">
        <Panel title={w.cat.toUpperCase()}><div className="text-2xl font-black">{w.name}</div><div className="text-xs text-white/60 mb-3">{w.desc}</div>
          <Bar label="DANO" v={w.dmg * (w.pel ? 2.2 : 1)} max={160} color="#ff6a4a" /><Bar label="CADÊNCIA" v={w.rpm} max={1200} color="#ffd23f" /><Bar label="ALCANCE" v={w.range} max={400} color="#6cb8ff" /><Bar label="PRECISÃO" v={100 - w.sp * 14} /><Bar label="CONTROLE" v={100 - w.rc * 17} color="#6fe39a" /><Bar label="MOBILIDADE" v={w.mv * 100} max={110} color="#c9a0ff" />
          <div className="text-xs text-white/60 flex justify-between"><span>Pente {w.mag} • Reserva {w.res}</span><span>DPS ~{dps} • Zoom {w.zoom}x</span></div></Panel>
        {w.lv > lv ? <div className="text-center text-amber-300 text-sm">🔒 Desbloqueia no nível {w.lv}</div> : <Panel title="EQUIPAR NO SLOT"><div className="grid grid-cols-4 gap-2">{[0, 1, 2, 3].map((i) => <Btn key={i} active={g.save.loadout[i] === w.id} onClick={() => equip(i)}>{i + 1}<div className="text-[9px] opacity-70">{WMAP[g.save.loadout[i]]?.name.split(' ')[0]}</div></Btn>)}</div></Panel>}
        <Panel title="EQUIPAMENTOS TÁTICOS"><div className="text-xs text-white/70 flex flex-col gap-1">{EQUIP.map((e) => <div key={e.id} className="flex justify-between"><span>{e.name}</span><b className="text-amber-300">[{e.key}]</b></div>)}</div></Panel>
      </div>
    </div>
  );
}

// ================= PERSONALIZAÇÃO =================
const CATS = ['uniform', 'camo', 'helmet', 'mask', 'glasses', 'vest', 'backpack', 'gloves', 'boots', 'acc', 'emblem', 'color', 'skin'];
export function CustomizeScreen({ g, go, bump }: any) {
  const [cat, setCat] = useState('uniform'); const lv = levelOf(g.save.xp); const look = g.save.look; const [drag, setDrag] = useState(false);
  useEffect(() => { g.setMenuFocus('custom'); g.setShowcase('custom', look); }, []);
  useEffect(() => () => g.setMenuFocus('main'), []);
  const set = (id: string) => { g.save.look = { ...g.save.look, [cat]: id }; writeSave(g.save); g.setShowcase('custom', g.save.look); A.ui(true); bump(); };
  const list = optList(cat);
  const random = () => { const l = { ...look }; for (const c of CATS) { const o = optList(c).filter((x: any) => x.lv <= lv); l[c] = o[Math.floor(Math.random() * o.length)].id; } g.save.look = l; writeSave(g.save); g.setShowcase('custom', l); bump(); };
  return (
    <div className="absolute inset-0 flex p-8 gap-5" style={{ background: 'linear-gradient(90deg, rgba(5,8,12,0.9), rgba(5,8,12,0.1) 45%, rgba(5,8,12,0.1) 55%, rgba(5,8,12,0.9))' }}>
      <div className="w-[300px] flex flex-col"><div className="screen-title">PERSONALIZAÇÃO</div><div className="flex flex-wrap gap-1.5">{CATS.map((c) => <button key={c} onClick={() => { A.click(); setCat(c); }} className={`chip ${cat === c ? 'chip-on' : ''}`}>{CAT_LABEL[c]}</button>)}</div>
        <div className="flex gap-2 mt-4"><Btn onClick={random}>ALEATÓRIO</Btn><Btn onClick={() => { g.save.look = { ...DEFAULT_LOOK }; writeSave(g.save); g.setShowcase('custom', g.save.look); bump(); }}>PADRÃO</Btn></div>
        <div className="text-[11px] text-white/50 mt-4">Arraste na área central para girar o personagem. Itens desbloqueiam com o nível (Nv. {lv}).</div><div className="mt-auto"><Btn onClick={() => go('main')}>{tr(g.settings.lang, 'back')}</Btn></div></div>
      <div className="flex-1 cursor-grab" onMouseDown={() => setDrag(true)} onMouseUp={() => setDrag(false)} onMouseLeave={() => setDrag(false)} onMouseMove={(e) => { if (drag && g.menu) g.menu.rotTarget += e.movementX * 0.01; }} />
      <div className="w-[320px] flex flex-col"><Panel title={CAT_LABEL[cat].toUpperCase()} className="flex-1 overflow-y-auto"><div className="grid grid-cols-2 gap-2">{list.map((o: any) => { const on = look[cat] === o.id; const lk = o.lv > lv; const hex = o.hex ?? o.base ?? o.color; return <button key={o.id} disabled={lk} onClick={() => set(o.id)} className={`opt ${on ? 'opt-on' : ''}`}>{hex != null && <span className="inline-block w-4 h-4 mr-2 border border-white/40 align-middle" style={{ background: '#' + hex.toString(16).padStart(6, '0') }} />}{o.sym && <span className="mr-1">{o.sym}</span>}<span className="text-xs">{o.name}</span>{lk && <div className="text-[10px] text-amber-300">🔒 Nv.{o.lv}</div>}</button>; })}</div></Panel></div>
    </div>
  );
}

// ================= CONFIGURAÇÕES =================
function Slider({ label, v, min = 0, max = 1, step = 0.01, on, fmtv }: any) { return <div className="mb-3"><div className="flex justify-between text-xs tracking-widest text-white/70"><span>{label}</span><span>{fmtv ? fmtv(v) : Math.round(v * 100) + '%'}</span></div><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(parseFloat(e.target.value))} className="w-full accent-amber-400" /></div>; }
function Select({ label, v, opts, on }: any) { return <div className="mb-3"><div className="text-xs tracking-widest text-white/70 mb-1">{label}</div><div className="flex gap-1.5 flex-wrap">{opts.map(([k, n]: any) => <button key={String(k)} onClick={() => { A.click(); on(k); }} className={`chip ${v === k ? 'chip-on' : ''}`}>{n}</button>)}</div></div>; }
export function SettingsScreen({ g, go, bump, inGame, onClose }: any) {
  const [tab, setTab] = useState('audio'); const s = g.settings; const [listen, setListen] = useState<string | null>(null); const lang = s.lang;
  const upd = (k: string, v: any) => { s[k] = v; g.applySettings(); writeSave(g.save); bump(); };
  useEffect(() => { if (!listen) return; const h = (e: KeyboardEvent) => { e.preventDefault(); e.stopPropagation(); if (e.code !== 'Escape') { s.binds[listen] = e.code; writeSave(g.save); } setListen(null); }; window.addEventListener('keydown', h, true); return () => window.removeEventListener('keydown', h, true); }, [listen]);
  const tabs = [['audio', tr(lang, 'audio')], ['video', tr(lang, 'video')], ['game', tr(lang, 'game')], ['controls', tr(lang, 'controls')]];
  return (
    <div className={inGame ? 'absolute inset-0 bg-black/80 flex items-center justify-center z-40' : 'absolute inset-0 flex items-center justify-center'} style={inGame ? {} : { background: 'rgba(5,8,12,0.88)' }}>
      <div className="w-[760px] max-h-[88vh] flex flex-col"><div className="screen-title">{tr(lang, 'settings')}</div>
        <div className="flex gap-2 mb-3">{tabs.map(([k, n]) => <Btn key={k} active={tab === k} onClick={() => setTab(k)}>{n}</Btn>)}</div>
        <Panel className="overflow-y-auto flex-1">
          {tab === 'audio' && <><Slider label="VOLUME GERAL" v={s.master} on={(v: number) => upd('master', v)} /><Slider label="MÚSICA" v={s.music} on={(v: number) => upd('music', v)} /><Slider label="EFEITOS" v={s.sfx} on={(v: number) => upd('sfx', v)} /></>}
          {tab === 'video' && <>
            <Select label="QUALIDADE GRÁFICA (PÓS-PROCESSAMENTO)" v={s.quality} opts={[['low', 'Baixa'], ['medium', 'Média'], ['high', 'Alta']]} on={(v: string) => upd('quality', v)} />
            <Select label="RESOLUÇÃO DE RENDERIZAÇÃO" v={s.scale} opts={[[0.5, '50%'], [0.75, '75%'], [1, '100%'], [1.5, '150%']]} on={(v: number) => upd('scale', v)} />
            <Select label="SOMBRAS" v={s.shadows} opts={[['off', 'Desligadas'], ['medium', 'Médias'], ['high', 'Altas']]} on={(v: string) => upd('shadows', v)} />
            <Select label="DISTÂNCIA DE RENDERIZAÇÃO" v={s.dist} opts={[[100, 'Curta'], [200, 'Média'], [350, 'Longa'], [500, 'Máxima']]} on={(v: number) => upd('dist', v)} />
            <Select label="PARTÍCULAS" v={s.particles} opts={[['low', 'Baixas'], ['medium', 'Médias'], ['high', 'Altas']]} on={(v: string) => upd('particles', v)} />
            <Select label="LIMITE DE FPS" v={s.fpsLimit} opts={[[0, 'Sem limite'], [30, '30'], [60, '60'], [120, '120']]} on={(v: number) => upd('fpsLimit', v)} />
            <Slider label="CAMPO DE VISÃO (FOV)" v={s.fov} min={60} max={110} step={1} on={(v: number) => upd('fov', v)} fmtv={(v: number) => v + '°'} />
            <div className="mb-2"><Btn onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); }}>ALTERNAR TELA CHEIA</Btn></div>
            <div className="text-[11px] text-white/40">Alterações de partículas/qualidade completas valem na próxima partida.</div></>}
          {tab === 'game' && <><Slider label="SENSIBILIDADE DO MOUSE" v={s.sens} min={0.2} max={3} step={0.05} on={(v: number) => upd('sens', v)} fmtv={(v: number) => v.toFixed(2)} />
            <Select label="DIFICULDADE" v={s.diff} opts={[['easy', 'Fácil'], ['normal', 'Normal'], ['hard', 'Difícil']]} on={(v: string) => upd('diff', v)} />
            <Select label="IDIOMA / LANGUAGE" v={s.lang} opts={[['pt', 'Português'], ['en', 'English']]} on={(v: string) => upd('lang', v)} />
            <Select label="MINIMAPA" v={s.minimap} opts={[[true, 'Ligado'], [false, 'Desligado']]} on={(v: boolean) => upd('minimap', v)} />
            <div className="mt-4"><Btn onClick={() => { if (confirm('Apagar todo o progresso salvo?')) { localStorage.removeItem('blocowar_save_v1'); location.reload(); } }}>APAGAR PROGRESSO</Btn></div></>}
          {tab === 'controls' && <div className="grid grid-cols-2 gap-x-6 gap-y-1">{Object.keys(DEFAULT_BINDS).map((k) => <div key={k} className="flex justify-between items-center py-1 border-b border-white/10 text-sm"><span>{BIND_LABEL[k]}</span><button onClick={() => setListen(k)} className="chip chip-on min-w-[96px]">{listen === k ? 'PRESSIONE...' : s.binds[k].replace('Key', '').replace('Digit', '')}</button></div>)}<div className="col-span-2 mt-3 text-xs text-white/50">Fixos: 1-4 trocar arma • Botão esquerdo atira • Botão direito mira • C também agacha • Esc pausa</div><div className="col-span-2 mt-2"><Btn onClick={() => { s.binds = { ...DEFAULT_BINDS }; writeSave(g.save); bump(); }}>RESTAURAR PADRÕES</Btn></div></div>}
        </Panel>
        <div className="mt-3"><Btn onClick={() => (inGame ? onClose() : go('main'))}>{tr(lang, 'back')}</Btn></div>
      </div>
    </div>
  );
}

// ================= PAUSA / RESULTADO / LOJA =================
export function PauseMenu({ g, onResume, onSettings, onQuit }: any) {
  return <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30"><div className="w-80 flex flex-col gap-2"><div className="screen-title text-center">PAUSADO</div><Btn big onClick={onResume}>{tr(g.settings.lang, 'resume')}</Btn><Btn onClick={onSettings}>{tr(g.settings.lang, 'settings')}</Btn><Btn onClick={onQuit}>{tr(g.settings.lang, 'menu')}</Btn><div className="text-[11px] text-white/40 text-center mt-2">Dica: use cobertura, recarregue atrás de paredes e use o pulso tático (V).</div></div></div>;
}
export function ResultScreen({ r, g, onMenu, onRetry, onNext }: any) {
  const lv = r.level;
  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-40 result-in">
      <div className="w-[760px] flex gap-8 items-center">
        <div className="flex-1"><div className="text-xs tracking-[0.5em]" style={{ color: r.win ? '#6fe39a' : '#ff6a6a' }}>{r.win ? 'SUCESSO' : 'FALHA'}</div><div className="text-5xl font-black tracking-widest" style={{ textShadow: '0 4px 0 #000' }}>{r.title}</div><div className="text-white/70 tracking-widest mb-4">{r.sub}</div>
          <Panel>{r.stats.map(([k, v]: any) => <div key={k} className="flex justify-between py-1 border-b border-white/10 text-sm"><span className="text-white/60">{k}</span><b>{v}</b></div>)}</Panel>
          <div className="mt-3 flex items-center gap-3"><div className="text-3xl font-black text-amber-300">+{r.xp} XP</div><div className="text-sm text-white/60">Nível {lv}</div>{r.levelUp > 0 && <div className="px-3 py-1 bg-amber-400 text-black font-black animate-pulse">NÍVEL {r.levelUp}! NOVOS ITENS</div>}</div>
          {r.challenges?.length > 0 && <div className="mt-2 text-sm text-sky-300">{r.challenges.map((c: string) => <div key={c}>🏅 Desafio: {c}</div>)}</div>}
          <div className="mt-5 flex gap-2"><Btn big onClick={onMenu}>MENU</Btn><Btn big onClick={onRetry}>{r.win ? 'JOGAR NOVAMENTE' : 'TENTAR NOVAMENTE'}</Btn>{r.win && r.mode === 'campaign' && r.mission < 13 && <Btn big onClick={onNext}>PRÓXIMA MISSÃO ▶</Btn>}</div></div>
        <div className="w-60 text-center"><div className="text-xs tracking-[0.4em] text-white/50 mb-2">DESEMPENHO</div><Rank r={r.rank} size={150} />
          {r.ranking && <Panel title="RANKING" className="mt-3 text-left">{r.ranking.map((x: any, i: number) => <div key={i} className="flex justify-between text-sm"><span className="text-amber-300">#{i + 1}</span><span>{x.score}</span></div>)}</Panel>}</div>
      </div>
    </div>
  );
}
export function ShopOverlay({ g, onClose }: any) {
  const [msg, setMsg] = useState(''); const [, force] = useState(0); const m = g.mode; const items = m.shopItems(); const money = (() => { let v = 0; const h = { }; m.hud(g, h); v = h.money; return v; })();
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40"><div className="w-[820px] max-h-[88vh] flex flex-col">
      <div className="flex justify-between items-end"><div className="screen-title">LOJA DE ARMAS</div><div className="text-3xl font-black text-green-400">$ {money}</div></div>
      <div className="text-xs text-white/60 mb-2">Arma atual (slot {g.P.cur + 1}): <b className="text-amber-300">{g.gun.def.name}</b> — comprar uma arma substitui a atual. {msg && <span className="text-sky-300 ml-3">{msg}</span>}</div>
      <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">{items.map((it: any) => <button key={it.id} disabled={it.max || money < it.price} onClick={() => { setMsg(m.buy(g, it.id)); force((x) => x + 1); }} className="mission !items-start disabled:opacity-40"><div className="flex-1 text-left"><div className="font-bold text-sm">{it.name}</div><div className="text-[11px] text-white/55">{it.max ? 'NÍVEL MÁXIMO' : it.desc}</div></div><div className="text-green-400 font-black">${it.price}</div></button>)}</div>
      <div className="mt-3 flex gap-2"><Btn big onClick={onClose}>CONTINUAR ▶</Btn><Btn onClick={() => { m.skipWait(); onClose(); }}>INICIAR PRÓXIMA ONDA</Btn></div>
    </div></div>
  );
}
