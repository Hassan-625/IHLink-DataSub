import { useCallback, useEffect, useState, type ReactNode } from 'react';


type BrandIdentity = {
  name: string;
  qualifier?: string;
  tagline: string;
  logo: string;
  documentTitle: string;
};

const platform = 'datasub' as const;
const identity: BrandIdentity = { name: 'IHLink DataSub', tagline: 'Smart digital services, connected', logo: '/logos/ihlink-master.svg', documentTitle: 'IHLink DataSub' };

function introKey(platform: 'datasub') {
  return `ihlink-intro-seen:${platform}`;
}

function introWasSeen(platform: 'datasub') {
  try {
    return window.sessionStorage.getItem(introKey(platform)) === 'yes';
  } catch {
    return false;
  }
}

function rememberIntro(platform: 'datasub') {
  try {
    window.sessionStorage.setItem(introKey(platform), 'yes');
  } catch {
    // Storage can be unavailable in privacy-restricted browsers; the intro must
    // never prevent the application from rendering.
  }
}

export function BrandIntro({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(() => !introWasSeen(platform));
  const [progress, setProgress] = useState(0);

  const close = useCallback(() => {
    rememberIntro(platform);
    setVisible(false);
  }, []);

  useEffect(() => {
    document.title = identity.documentTitle;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = identity.tagline;
  }, []);

  useEffect(() => {
    if (!visible) return;
    const started = Date.now();
    const tick = window.setInterval(() => setProgress(Math.min(100, ((Date.now() - started) / 1000) * 100)), 25);
    const finish = window.setTimeout(close, 1000);
    return () => { window.clearInterval(tick); window.clearTimeout(finish); };
  }, [visible, close]);

  return <>{visible && <div className="fixed inset-0 z-[100] bg-white grid place-items-center overflow-hidden" role="dialog" aria-label={`${identity.name} introduction`}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(21,101,216,.10),_transparent_52%)]" />
    <div className="relative text-center px-6">
      <div className="w-40 h-40 mx-auto grid place-items-center animate-pulse">
        <img src={identity.logo} alt={identity.name} className="w-full h-full object-contain" />
      </div>
      <h1 className="text-4xl font-black text-navy-900 mt-5 tracking-tight">{identity.name}</h1>
      {identity.qualifier && <p className="text-sm font-bold tracking-[.28em] text-royal-600 mt-1">{identity.qualifier}</p>}
      <p className="text-muted mt-5">{identity.tagline}</p>
      <div className="w-72 max-w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-7"><div className="h-full bg-gradient-to-r from-royal-600 to-cyan-500 transition-[width] duration-100" style={{width:`${progress}%`}} /></div>
      <button onClick={close} className="mt-6 text-sm font-semibold text-muted hover:text-royal-600">Skip intro</button>
    </div>
  </div>}{children}</>;
}
