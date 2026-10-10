import {useDataSubPermissions} from '@/hooks/useDataSubPermissions';
import {isNativeApp} from '@/lib/nativeAuth';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { productThemes, type ProductKey } from '@/lib/designTokens';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { IHLinkContact } from '@/lib/contact';

interface FooterProps { product?: ProductKey; }

const sections = [
  { title: 'Services', links: [
    ['Airtime','/datasub/airtime'],['Data Plans','/datasub/data-plans'],['Electricity','/datasub/electricity'],['Cable TV','/datasub/cable'],['Education','/datasub/education'],
  ]},
  { title: 'Platform', links: [
    ['Reseller','/datasub/reseller'],['Developer API','/datasub/api'],['Pricing','/datasub/pricing'],['FAQ','/datasub/faq'],['Support','/datasub/support'],
  ]},
  { title: 'Account', links: [
    ['Sign In','/signin'],['Register','/register'],['Dashboard','/account'],['Wallet','/datasub/wallet'],['Transactions','/datasub/transactions'],
  ]},
];

export function Footer({}: FooterProps) {
  const {can}=useDataSubPermissions();
  const theme = productThemes.datasub;
  if(isNativeApp())return null;
  return <footer className={`${theme.footerBg} ${theme.footerText} mt-20`}>
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-12">
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-12">
        <div className="col-span-2 lg:col-span-4">
          <Logo product="datasub" variant="icon" size="md" disableLink />
          <p className="mt-4 text-lg font-extrabold text-white">IHLink DataSub</p>
          <p className="text-sm opacity-70 max-w-xs mt-2 mb-4">Smart airtime, data, bill payment, education, reseller and API services from IHLink Co. Ltd.</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-sm opacity-70"><MapPin className="w-4 h-4"/>{IHLinkContact.address}</div>
            <a href={IHLinkContact.phoneHref} className="flex items-center gap-2.5 text-sm opacity-70"><Phone className="w-4 h-4"/>{IHLinkContact.phoneDisplay}</a>
            <a href={IHLinkContact.whatsappHref} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm opacity-70"><WhatsAppIcon className="w-4 h-4"/>WhatsApp IHLink</a>
            <a href={IHLinkContact.emailHref} className="flex items-center gap-2.5 text-sm opacity-70"><Mail className="w-4 h-4"/>{IHLinkContact.email}</a>
          </div>
        </div>
        {sections.map(section => <div key={section.title} className="col-span-1 lg:col-span-2"><h4 className="text-sm font-bold text-white mb-3">{section.title}</h4><ul className="space-y-2">{section.links.filter(([,href])=>href!=='/datasub/api'||can('api')).map(([label,href]) => <li key={href}><Link to={href} className="text-sm opacity-70 hover:opacity-100 flex items-center gap-1"><ArrowRight className="w-3 h-3"/>{label}</Link></li>)}</ul></div>)}
      </div>
      <div className="mt-10 pt-6 border-t border-white/10 text-xs opacity-60">© 2026 IHLink Co. Ltd. — IHLink DataSub.</div>
    </div>
  </footer>;
}
