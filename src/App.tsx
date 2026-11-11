// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import { Game } from './game/engine';
import Hud from './ui/Hud';
import { MainMenu, CampaignScreen, ModeSetup, ArsenalScreen, CustomizeScreen, SettingsScreen, PauseMenu, ResultScreen, ShopOverlay } from './ui/Menus';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gRef = useRef<any>(null);
  const lastCfg = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [scr, setScr] = useState('main');
  const [params, setParams] = useState<any>({});
  const [hud, setHud] = useState<any>(null);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [shop, setShop] = useState(false);
  const [banner, setBanner] = useState<any>(null);
  const [sett, setSett] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [, setN] = useState(0);
  const bump = () => setN((n) => n + 1);

  useEffect(() => {
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)');
    const updateMobile = () => setMobile(mq.matches); updateMobile(); mq.addEventListener?.('change', updateMobile);
    return () => mq.removeEventListener?.('change', updateMobile);
  }, []);

  useEffect(() => {
    if (gRef.current || !canvasRef.current) return;
    const g = new Game(canvasRef.current, {
      onHud: (h: any) => setHud(h),
      onPause: (p: boolean) => { setPaused(p); if (!p) setSett(false); },
      onResult: (r: any) => { setResult(r); setScr('result'); setPaused(false); setShop(false); },
      onShop: (s: boolean) => setShop(s),
      onBanner: (name: string, sub: string) => { setBanner({ name, sub }); setTimeout(() => setBanner(null), 4800); },
    });
    gRef.current = g; (window as any).__game = g; setReady(true);
  }, []);

  const g = gRef.current;
  const go = (s: string, p: any = {}) => { setScr(s); setParams(p); };
  const start = (cfg: any) => { lastCfg.current = cfg; setResult(null); setHud(null); setPaused(false); setShop(false); setSett(false); setScr('play'); g.start(cfg); };
  const toMenu = () => { g.quitToMenu(); setScr('main'); setPaused(false); setResult(null); setShop(false); setHud(null); };
  const locked = typeof document !== 'undefined' && !!document.pointerLockElement;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden text-white" style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {ready && g && (
        <>
          {scr === 'main' && <MainMenu g={g} go={go} bump={bump} />}
          {scr === 'campaign' && <CampaignScreen g={g} go={go} start={start} />}
          {scr === 'modes' && <ModeSetup g={g} go={go} start={start} mode={params.mode} />}
          {scr === 'arsenal' && <ArsenalScreen g={g} go={go} bump={bump} />}
          {scr === 'custom' && <CustomizeScreen g={g} go={go} bump={bump} />}
          {scr === 'settings' && <SettingsScreen g={g} go={go} bump={bump} />}
          {scr === 'play' && <Hud h={hud} banner={banner} locked={locked || paused || shop || sett} game={g} mobile={mobile} />}
          {scr === 'play' && paused && !sett && <PauseMenu g={g} onResume={() => g.pause(false)} onSettings={() => setSett(true)} onQuit={toMenu} />}
          {scr === 'play' && paused && sett && <SettingsScreen g={g} go={go} bump={bump} inGame onClose={() => setSett(false)} />}
          {scr === 'play' && shop && g.mode?.shopItems && <ShopOverlay g={g} onClose={() => { g.mode.closeShop(); setShop(false); }} />}
          {scr === 'result' && result && <ResultScreen r={result} g={g} onMenu={toMenu} onRetry={() => start(lastCfg.current)} onNext={() => start({ mode: 'campaign', mission: result.mission + 1 })} />}
        </>
      )}
    </div>
  );
}
