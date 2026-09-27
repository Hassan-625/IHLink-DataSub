import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { Dropdown, DropdownLabel } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { productThemes, type ProductKey } from '@/lib/designTokens';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
}

const nav: NavItem[] = [
  { label: 'Home', href: '/datasub' },
  { label: 'Dashboard', href: '/account' },
  { label: 'Airtime', href: '/datasub/airtime' },
  { label: 'Data Plans', href: '/datasub/data-plans' },
  { label: 'Electricity', href: '/datasub/electricity' },
  { label: 'Cable TV', href: '/datasub/cable' },
  { label: 'Reseller', href: '/datasub/reseller' },
  { label: 'API', href: '/datasub/api' },
  { label: 'Pricing', href: '/datasub/pricing' },
  { label: 'More', href: '/datasub/services', children: [
    { label: 'Education PINs', href: '/datasub/education', description: 'Education and examination services' },
    { label: 'Airtime to Cash', href: '/datasub/airtime-to-cash', description: 'Convert supported airtime' },
    { label: 'Print Cards', href: '/datasub/print-cards', description: 'Printable voucher card batches' },
    { label: 'Wallet & Payments', href: '/datasub/wallet', description: 'Funding, payment and wallet activity' },
    { label: 'Transactions', href: '/datasub/transactions', description: 'Transaction history and receipts' },
    { label: 'Get in Touch', href: '/datasub/support', description: 'Support, enquiries and service assistance' },
  ]},
];

interface HeaderProps {
  product?: ProductKey;
  showAnnouncement?: boolean;
  announcementText?: string;
}

export function Header({ showAnnouncement = true, announcementText }: HeaderProps) {
  const theme = productThemes.datasub;
  const location = useLocation();
  const { user, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return <>
    {showAnnouncement && <div className={`${theme.announcementBg} ${theme.announcementText} text-xs font-medium px-4 py-2 text-center`}>
      {announcementText || 'IHLink DataSub — Smart digital services, connected'}
    </div>}
    <header className="sticky top-0 z-40 glass border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          <Logo product="datasub" size="md" />
          <nav className="hidden xl:flex items-center gap-0.5 whitespace-nowrap">
            {nav.map(item => item.children ? (
              <Dropdown key={item.label} align="right" width={280} trigger={<button className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg ${isActive(item.href) ? theme.textClass : 'text-ink hover:bg-gray-50'}`}>{item.label}<ChevronDown className="w-3.5 h-3.5"/></button>}>
                {(close) => <><DropdownLabel>DataSub Services</DropdownLabel>{item.children!.map(child => <Link key={child.href} to={child.href} onClick={close} className="block px-3.5 py-2 hover:bg-gray-50"><span className="font-semibold block text-sm">{child.label}</span><span className="text-xs text-muted">{child.description}</span></Link>)}</>}
              </Dropdown>
            ) : <Link key={item.href} to={item.href} className={`px-3 py-2 text-sm font-semibold rounded-lg ${isActive(item.href) ? theme.textClass : 'text-ink hover:bg-gray-50'}`}>{item.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            {user ? <><Link to="/account" className="hidden xl:block"><Button variant="ghost">My Dashboard</Button></Link>{profile?.role === 'super_admin' && <Link to="/admin" className="hidden xl:block"><Button themeClass={theme.btnClass}>DataSub Admin</Button></Link>}</> : <><Link to="/signin" className="hidden xl:block"><Button variant="ghost">Sign In</Button></Link><Link to="/register" className="hidden xl:block"><Button themeClass={theme.btnClass}>Get Started</Button></Link></>}
            <button className="xl:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(v => !v)}>{mobileOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}</button>
          </div>
        </div>
      </div>
      {mobileOpen && <div className="xl:hidden border-t border-border bg-white p-4 space-y-1">{nav.map(item => <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-semibold rounded-lg hover:bg-gray-50">{item.label}</Link>)}<div className="pt-3 border-t border-border flex gap-2">{user ? <Link to="/account" className="flex-1"><Button fullWidth>My Dashboard</Button></Link> : <><Link to="/signin" className="flex-1"><Button variant="secondary" fullWidth>Sign In</Button></Link><Link to="/register" className="flex-1"><Button fullWidth themeClass={theme.btnClass}>Get Started</Button></Link></>}</div></div>}
    </header>
  </>;
}
