import { useEffect, useState, type ReactNode } from 'react';
import { deployedPlatform, type PlatformKey } from '@/lib/platformUrls';

type BrandIdentity = {
  name: string;
  qualifier?: string;
  tagline: string;
  logo: string;
  documentTitle: string;
};

const identities: Record<PlatformKey, BrandIdentity> = {
  corporate: { name: 'IHLink', qualifier: 'CO. LTD.', tagline: 'Connecting your digital world', logo: '/logos/ihlink-master.svg', documentTitle: 'IHLink Co. Ltd.' },
  datasub: { name: 'IHLink DataSub', tagline: 'Smart digital services, connected', logo: '/logos/datasub.webp', documentTitle: 'IHLink DataSub' },
  schoolpro: { name: 'IHLink SchoolPro', tagline: 'Smarter school management', logo: '/logos/schoolpro.webp', documentTitle: 'IHLink SchoolPro' },
  consult: { name: 'IHLink Consult', tagline: 'Technology expertise for your next move', logo: '/logos/consult.webp', documentTitle: 'IHLink Consult' },
  engineering: { name: 'IHLink Engineering', tagline: 'Engineering intelligent systems', logo: '/logos/engineering.webp', documentTitle: 'IHLink Engineering' },
  host: { name: 'IHLink Hosting & Domains', tagline: 'Your digital presence starts here', logo: '/logos/hosting-domains.webp', documentTitle: 'IHLink Hosting & Domains' },
  admin: { name: 'IHLink Administration', tagline: 'Ecosystem control centre', logo: '/logos/ihlink-master.svg', documentTitle: 'IHLink Administration' },
  business_centre: { name: 'IHLink Business & Innovation Centre', tagline: 'Ideas, services and enterprise', logo: '/logos/business-innovation-centre.webp', documentTitle: 'IHLink Business & Innovation Centre' },
  print: { name: 'IHLink Print & Branding', tagline: 'Print, identity and brand execution', logo: '/logos/print-branding.webp', documentTitle: 'IHLink Print & Branding' },
  fabrication: { name: 'IHLink 3D Fabrication Lab', tagline: 'Design, prototype and fabricate', logo: '/logos/3d-fabrication.webp', documentTitle: 'IHLink 3D Fabrication Lab' },
  compute: { name: 'IHLink AI & Compute', tagline: 'Intelligent computing for modern business', logo: '/logos/ai-compute.webp', documentTitle: 'IHLink AI & Compute' },
  academy: { name: 'IHLink Academy', tagline: 'Learn practical technology skills', logo: '/logos/academy.webp', documentTitle: 'IHLink Academy' },
  digital_business: { name: 'IHLink Digital Services', tagline: 'Digital tools for business growth', logo: '/logos/digital-service.webp', documentTitle: 'IHLink Digital Services' },
};

function introKey(platform: PlatformKey) {
  return `ihlink-intro-seen:${platform}`;
}

function introWasSeen(platform: PlatformKey) {
  try {
    return window.sessionStorage.getItem(introKey(platform)) === 'yes';
  } catch {
    return false;
  }
}

function rememberIntro(platform: PlatformKey) {
  try {
    window.sessionStorage.setItem(introKey(platform), 'yes');
  } catch {
    // Storage can be unavailable in privacy-restricted browsers; the intro must
    // never prevent the application from rendering.
  }
}

export function BrandIntro({ children }: { children: ReactNode }) {
  const platform = deployedPlatform;
  const identity = identities[platform] ?? identities.corporate;
  const [visible, setVisible] = useState(() => !introWasSeen(platform));
  const [progress, setProgress] = useState(0);

  const close = () => {
    rememberIntro(platform);
    setVisible(false);
  };

  useEffect(() => {
    document.title = identity.documentTitle;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = identity.tagline;
  }, [identity]);

  useEffect(() => {
    if (!visible) return;
    const started = Date.now();
    const tick = window.setInterval(() => setProgress(Math.min(100, ((Date.now() - started) / 1000) * 100)), 25);
    const finish = window.setTimeout(close, 1000);
    return () => { window.clearInterval(tick); window.clearTimeout(finish); };
  }, [visible]);

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
