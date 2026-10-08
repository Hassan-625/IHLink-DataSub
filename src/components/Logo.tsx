import { Link } from 'react-router-dom';
import type { ProductKey } from '@/lib/designTokens';
import { IH_LINK_LOGO } from '@/assets/ihlinkLogo';

interface LogoProps {
  product?: ProductKey;
  variant?: 'full' | 'icon' | 'light';
  size?: 'sm' | 'md' | 'lg';
  disableLink?: boolean;
}
const sizes={sm:{box:'w-9 h-9',text:'text-base',sub:'text-2xs'},md:{box:'w-11 h-11',text:'text-lg',sub:'text-xs'},lg:{box:'w-16 h-16',text:'text-2xl',sub:'text-sm'}};
export function Logo({ variant='full',size='md',disableLink=false }:LogoProps){
 const s=sizes[size];
 const content=<><div className={`${s.box} rounded-xl border border-slate-200/90 bg-white p-0.5 shadow-sm flex items-center justify-center overflow-hidden`}><img src={IH_LINK_LOGO} alt="IHLink" className="w-full h-full object-contain"/></div>{variant!=='icon'&&<div className="flex flex-col leading-none"><span className={`${s.text} font-extrabold text-ink tracking-tight`}>IHLink DataSub</span><span className={`${s.sub} text-muted font-medium`}>by IHLink</span></div>}</>;
 return disableLink?<span className="flex items-center gap-2.5">{content}</span>:<Link to="/datasub" className="flex items-center gap-2.5">{content}</Link>;
}
