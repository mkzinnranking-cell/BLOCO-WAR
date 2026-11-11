// @ts-nocheck
import { useEffect, useRef } from 'react';

function MobileControls({ game }: any) {
  const joyRef = useRef<any>(null);
  const joyDotRef = useRef<any>(null);
  const lookRef = useRef<any>(null);
  const joyId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const joy = useRef({ x: 0, y: 0 });
  const lookLast = useRef({ x: 0, y: 0 });
  const setJoy = (e: PointerEvent) => {
    const el = joyRef.current; if (!el) return; const r = el.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    const max = r.width * 0.36, len = Math.hypot(x, y); if (len > max) { x *= max / len; y *= max / len; }
    joy.current = { x: x / max, y: y / max }; if (joyDotRef.current) joyDotRef.current.style.transform = `translate(${joy.current.x * 34}px, ${joy.current.y * 34}px)`; game?.setMobileMove(joy.current.x, joy.current.y);
  };
  const resetJoy = () => { joy.current = { x: 0, y: 0 }; if (joyDotRef.current) joyDotRef.current.style.transform = 'translate(0,0)'; game?.setMobileMove(0, 0); };
  const press = (name: string) => (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); game?.setMobileButton(name, true); };
  const release = (name: string) => (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); game?.setMobileButton(name, false); };
  const action = (name: string) => (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); game?.mobileAction(name); };
  return <div className="mobile-controls absolute inset-0 pointer-events-none select-none touch-none">
    <div ref={joyRef} className="mobile-joystick pointer-events-auto" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); joyId.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); setJoy(e.nativeEvent); }} onPointerMove={(e) => { if (joyId.current === e.pointerId) setJoy(e.nativeEvent); }} onPointerUp={(e) => { if (joyId.current === e.pointerId) { joyId.current = null; resetJoy(); } }} onPointerCancel={(e) => { if (joyId.current === e.pointerId) { joyId.current = null; resetJoy(); } }}>
      <div className="mobile-joy-ring"><div ref={joyDotRef} className="mobile-joy-dot" /></div>
    </div>
    <div ref={lookRef} className="mobile-look-zone pointer-events-auto" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); lookId.current = e.pointerId; lookLast.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={(e) => { if (lookId.current === e.pointerId) { const dx = e.clientX - lookLast.current.x, dy = e.clientY - lookLast.current.y; lookLast.current = { x: e.clientX, y: e.clientY }; game?.setMobileLook(dx, dy); } }} onPointerUp={(e) => { if (lookId.current === e.pointerId) lookId.current = null; }} onPointerCancel={(e) => { if (lookId.current === e.pointerId) lookId.current = null; }} />
    <div className="mobile-actions">
      <button className="mobile-btn fire" onPointerDown={press('fire')} onPointerUp={release('fire')} onPointerCancel={release('fire')}><span>●</span><small>ATIRAR</small></button>
      <button className="mobile-btn ads" onPointerDown={press('ads')} onPointerUp={release('ads')} onPointerCancel={release('ads')}><span>⌾</span></button>
      <button className="mobile-btn reload" onPointerDown={action('reload')}><span>↻</span><small>REC</small></button>
      <button className="mobile-btn jump" onPointerDown={press('jump')} onPointerUp={release('jump')} onPointerCancel={release('jump')}><span>↑</span></button>
      <button className="mobile-btn crouch" onPointerDown={press('crouch')} onPointerUp={release('crouch')} onPointerCancel={release('crouch')}><span>⌄</span></button>
      <button className="mobile-btn util" onPointerDown={action('light')}><span>☼</span></button>
      <button className="mobile-btn util" onPointerDown={action('next')}><span>◈</span></button>
    </div>
    <button className="mobile-pause" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); game?.pause(true); }}>Ⅱ</button><div className="mobile-status">TOQUE E ARRASTE PARA OLHAR</div>
  </div>;
}


function Radar({ h }: any) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const x = c.getContext('2d')!; const S = c.width, R = S / 2; x.clearRect(0, 0, S, S);
    x.save(); x.beginPath(); x.arc(R, R, R - 2, 0, 7); x.clip(); x.fillStyle = 'rgba(8,14,20,0.62)'; x.fillRect(0, 0, S, S);
    x.strokeStyle = 'rgba(120,200,255,0.18)'; x.lineWidth = 1; for (const r of [0.33, 0.66, 1]) { x.beginPath(); x.arc(R, R, (R - 2) * r, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(R, 0); x.lineTo(R, S); x.moveTo(0, R); x.lineTo(S, R); x.stroke();
    for (const p of h.radar || []) { x.fillStyle = p.c ? '#ffd23f' : p.t === 0 ? '#4aa8ff' : '#ff4a4a'; const px = R + p.x * (R - 6), py = R + p.y * (R - 6); x.fillRect(px - 3, py - 3, 6, 6); }
    x.restore(); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(R, R - 7); x.lineTo(R - 5, R + 5); x.lineTo(R + 5, R + 5); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(120,200,255,0.6)'; x.lineWidth = 2; x.beginPath(); x.arc(R, R, R - 2, 0, 7); x.stroke();
  });
  return <canvas ref={ref} width={150} height={150} className="rounded-full" />;
}

export default function Hud({ h, banner, locked, game, mobile }: any) {
  if (!h || h.hp === undefined) return null;
  const gap = 5 + Math.min(40, (h.spread || 0) * 7) * (1 - (h.ads || 0) * 0.5);
  const hitCol = h.hit ? (h.hit.kill ? '#ff3b30' : h.hit.head ? '#ffd23f' : '#fff') : '';
  const hpPct = Math.max(0, Math.min(100, h.hp));
  return (
    <div className="absolute inset-0 pointer-events-none select-none text-white" style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      {/* vinhetas */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
      {h.hurt > 0 && <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 35%, rgba(200,0,0,${Math.min(0.7, h.hurt * 2)}) 100%)` }} />}
      {h.lowhp && !h.dead && <div className="absolute inset-0 lowhp" />}
      {h.suppress > 0.1 && <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${h.suppress * 0.6}) 100%)`, backdropFilter: `blur(${h.suppress * 2}px)` }} />}
      {h.nvg && <div className="absolute inset-0 nvg" />}
      {h.alarm && <div className="absolute inset-0 alarm" />}
      {h.scoped && (<div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, transparent 0, transparent 33vh, #000 33.4vh)' }}><div className="absolute left-0 right-0 top-1/2 h-px bg-black/80" /><div className="absolute top-0 bottom-0 left-1/2 w-px bg-black/80" /><div className="absolute left-1/2 top-1/2 w-1 h-1 -ml-0.5 -mt-0.5 rounded-full bg-red-500" /></div>)}
      {/* indicadores de dano */}
      {(h.dmg || []).map((d: any, i: number) => { const rot = ((h.yaw + Math.PI - d.a) * 180) / Math.PI; return <div key={i} className="absolute left-1/2 top-1/2" style={{ transform: `translate(-50%,-50%) rotate(${rot}deg)`, opacity: Math.min(1, d.t) }}><div style={{ marginTop: -180, width: 90, height: 18, background: 'linear-gradient(to bottom, rgba(255,40,40,0.9), transparent)', clipPath: 'polygon(0 0,100% 0,70% 100%,30% 100%)' }} /></div>; })}
      {/* mira */}
      {!h.scoped && !h.dead && (<div className="absolute left-1/2 top-1/2" style={{ opacity: 1 - (h.ads || 0) * 0.55 }}>
        {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([x, y], i) => (<div key={i} className="absolute bg-white" style={{ width: x ? 9 : 2, height: y ? 9 : 2, left: x < 0 ? -(gap + 9) : x > 0 ? gap : -1, top: y < 0 ? -(gap + 9) : y > 0 ? gap : -1, boxShadow: '0 0 2px #000' }} />))}
        <div className="absolute w-1 h-1 bg-white rounded-full -ml-0.5 -mt-0.5" style={{ boxShadow: '0 0 3px #000' }} />
      </div>)}
      {h.hit && (<div className="absolute left-1/2 top-1/2" style={{ color: hitCol }}>{[45, 135, 225, 315].map((a) => <div key={a} className="absolute" style={{ width: 12, height: 3, background: hitCol, transform: `rotate(${a}deg) translateX(10px)`, transformOrigin: '0 50%', boxShadow: '0 0 4px #000' }} />)}</div>)}
      {/* marcadores */}
      {(h.markers || []).map((m: any, i: number) => (<div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: m.x + '%', top: m.y + '%', color: m.color }}><div className="mx-auto w-3 h-3 rotate-45 border-2" style={{ borderColor: m.color, background: 'rgba(0,0,0,0.4)' }} /><div className="text-[11px] font-bold tracking-wider" style={{ textShadow: '0 0 4px #000, 0 0 2px #000' }}>{m.label}</div><div className="text-[10px] opacity-80" style={{ textShadow: '0 0 3px #000' }}>{m.dist}m</div></div>))}
      {/* objetivo */}
      {h.obj && (<div className="absolute left-5 top-5 max-w-md">
        {h.missionName && <div className="text-[11px] tracking-[0.3em] text-amber-300/80">{h.missionName}</div>}
        <div className="mt-1 px-3 py-2 border-l-4 border-amber-400" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.6), transparent)' }}>
          <div className="text-[10px] tracking-widest text-white/60">OBJETIVO {h.obj.n ? `${h.obj.i}/${h.obj.n}` : ''}</div>
          <div className="text-sm font-semibold leading-tight">{h.obj.text}</div>
          {h.obj.sub && <div className="text-xs text-amber-200 mt-0.5">{h.obj.sub}</div>}
        </div>
      </div>)}
      {/* topo central */}
      <div className="absolute left-1/2 top-3 -translate-x-1/2 flex flex-col items-center gap-1">
        {h.timer && <div className="px-3 py-0.5 bg-black/50 text-sm tracking-widest font-bold">{h.timer}</div>}
        {h.teamMode && h.teamMode !== 'dom' && h.scores && (<div className="flex items-center gap-3 bg-black/50 px-4 py-1"><span className="text-sky-400 font-black text-xl">{h.scores[0]}</span><span className="text-[10px] tracking-widest text-white/60">ROUNDS ({h.alive?.[0]} x {h.alive?.[1]})</span><span className="text-red-400 font-black text-xl">{h.scores[1]}</span></div>)}
        {h.teamMode === 'dom' && (<div className="flex flex-col items-center gap-1"><div className="flex items-center gap-3 bg-black/50 px-4 py-1"><span className="text-sky-400 font-black text-xl">{h.scores[0]}</span><span className="text-[10px] tracking-widest text-white/60">/ {h.scores[2]}</span><span className="text-red-400 font-black text-xl">{h.scores[1]}</span></div><div className="flex gap-2">{h.flags.map((f: any) => <div key={f.n} className="w-9 h-9 flex items-center justify-center font-black border-2" style={{ borderColor: f.owner === 0 ? '#4aa8ff' : f.owner === 1 ? '#ff4a4a' : '#888', background: 'rgba(0,0,0,0.5)', color: f.owner === 0 ? '#4aa8ff' : f.owner === 1 ? '#ff4a4a' : '#bbb' }}>{f.n}</div>)}</div></div>)}
        {h.wave !== undefined && h.mode === 'survival' && (<div className="text-center bg-black/50 px-4 py-1"><div className="text-xs tracking-[0.3em] text-orange-300">ONDA {h.wave}</div><div className="text-[11px] text-white/80">{h.waveInfo}</div><div className="text-sm font-bold text-green-400">$ {h.money}</div></div>)}
        {h.bombT != null && <div className="px-4 py-1 bg-red-700/80 font-black tracking-widest animate-pulse">BOMBA {h.bombT}s</div>}
        {h.defendInt != null && <div className="w-48 h-2 bg-black/60"><div className="h-full bg-sky-400" style={{ width: h.defendInt + '%' }} /></div>}
      </div>
      {/* minimapa */}
      {h.minimap && <div className="absolute right-5 top-5"><Radar h={h} /></div>}
      {/* killfeed + notificações */}
      <div className="absolute right-5 top-[185px] flex flex-col items-end gap-1">{(h.kf || []).map((k: any, i: number) => <div key={i} className="px-2 py-0.5 text-xs bg-black/50 border-r-2" style={{ borderColor: k.head ? '#ffd23f' : '#ff4a4a' }}>{k.t}</div>)}</div>
      <div className="absolute left-1/2 top-[22%] -translate-x-1/2 flex flex-col items-center gap-1">{(h.notes || []).map((n: any, i: number) => <div key={i} className="text-sm font-black tracking-widest" style={{ color: n.color, textShadow: '0 0 6px #000, 0 2px 2px #000' }}>{n.txt}</div>)}</div>
      {/* legenda de rádio */}
      {h.sub && <div className="absolute left-1/2 bottom-[22%] -translate-x-1/2 max-w-2xl px-4 py-2 bg-black/60 text-center border-t-2 border-sky-400"><span className="text-sky-300 font-bold">{h.sub.who}: </span><span>{h.sub.txt}</span></div>}
      {/* interação */}
      {h.prompt && !h.dead && (<div className="absolute left-1/2 top-[58%] -translate-x-1/2 text-center"><div className="px-3 py-1 bg-black/60 text-sm"><span className="inline-block px-1.5 mr-2 bg-white text-black font-black">E</span>{h.prompt.text}</div>{h.prompt.prog > 0 && <div className="mt-1 h-1.5 bg-black/60"><div className="h-full bg-amber-400" style={{ width: Math.min(100, h.prompt.prog * 100) + '%' }} /></div>}</div>)}
      {/* vida */}
      <div className="absolute left-5 bottom-5 w-72">
        <div className="flex items-end gap-2"><div className="text-5xl font-black leading-none" style={{ color: hpPct < 30 ? '#ff4a4a' : '#fff', textShadow: '0 0 8px #000' }}>{h.hp}</div><div className="text-xs tracking-widest text-white/60 pb-1">VIDA</div>{h.armor > 0 && <div className="ml-auto text-sm text-sky-300 font-bold">🛡 {h.armor}</div>}</div>
        <div className="mt-1 h-2 bg-black/60"><div className="h-full transition-all" style={{ width: hpPct + '%', background: hpPct < 30 ? '#ff3b30' : 'linear-gradient(90deg,#3ddc84,#b6f36b)' }} /></div>
        <div className="mt-2 flex gap-2 text-xs">
          {[['G', '💣', h.nades], ['Q', '☁', h.smokes], ['H', '✚', h.meds], ['V', '📡', h.scanCd > 0 ? h.scanCd + 's' : 'OK']].map(([k, ic, n]: any) => <div key={k} className="px-2 py-1 bg-black/55 border border-white/10 flex items-center gap-1"><span className="text-white/50">{k}</span><span>{ic}</span><b>{n}</b></div>)}
          {h.light && <div className="px-2 py-1 bg-amber-500/30 border border-amber-400/40">🔦</div>}
        </div>
        {h.healing && <div className="mt-1 text-xs text-green-300">Curando...</div>}
      </div>
      {/* munição */}
      <div className="absolute right-5 bottom-5 text-right">
        <div className="flex justify-end gap-1 mb-2">{(h.slots || []).map((s: string, i: number) => <div key={i} className="px-2 py-1 text-[11px] border" style={{ background: i === h.slot ? 'rgba(255,210,63,0.9)' : 'rgba(0,0,0,0.5)', color: i === h.slot ? '#000' : '#ccc', borderColor: 'rgba(255,255,255,0.15)' }}><b>{i + 1}</b> {s.split(' ')[0]}</div>)}</div>
        <div className="text-xs tracking-[0.2em] text-white/60">{h.wcat?.toUpperCase()}</div>
        <div className="text-sm font-bold">{h.wname}</div>
        <div className="flex items-end justify-end gap-2"><span className="text-6xl font-black leading-none" style={{ color: h.ammo === 0 ? '#ff4a4a' : '#fff', textShadow: '0 0 8px #000' }}>{h.ammo}</span><span className="text-2xl text-white/60 pb-1">/ {h.reserve}</span></div>
        {h.reloading && <div className="mt-1 h-1.5 bg-black/60 w-48 ml-auto"><div className="h-full bg-amber-400" style={{ width: h.reloadP * 100 + '%' }} /></div>}
        {h.ammo === 0 && h.reserve > 0 && !h.reloading && <div className="text-xs text-red-400 animate-pulse">RECARREGAR (R)</div>}
      </div>
      {/* contagens */}
      {h.freeze > 0 && <div className="absolute left-1/2 top-[30%] -translate-x-1/2 text-center"><div className="text-8xl font-black text-amber-300" style={{ textShadow: '0 0 20px #000' }}>{h.freeze}</div></div>}
      {h.respawn > 0 && <div className="absolute left-1/2 top-[40%] -translate-x-1/2 text-center bg-black/60 px-8 py-3"><div className="text-3xl font-black text-red-400 tracking-widest">ELIMINADO</div><div className="text-sm text-white/80">Reaparecendo em {h.respawn}s</div></div>}
      {h.dead && !h.respawn && h.teamMode && h.teamMode !== 'dom' && <div className="absolute left-1/2 top-[40%] -translate-x-1/2 text-center bg-black/60 px-8 py-3"><div className="text-2xl font-black text-red-400 tracking-widest">ELIMINADO</div><div className="text-sm text-white/80">Aguarde o fim do round</div></div>}
      {banner && <div className="absolute inset-x-0 top-[28%] text-center banner"><div className="text-xs tracking-[0.6em] text-amber-300">OPERAÇÃO</div><div className="text-6xl font-black tracking-widest" style={{ textShadow: '0 4px 0 #000, 0 0 30px rgba(0,0,0,0.8)' }}>{banner.name}</div><div className="text-lg tracking-[0.4em] text-white/80 mt-1">{banner.sub}</div></div>}
      {mobile && !h.dead && <MobileControls game={game} />}
      {!mobile && !locked && <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xl font-bold tracking-widest animate-pulse">CLIQUE PARA CAPTURAR O MOUSE</div>}
    </div>
  );
}
