import {useDataSubPermissions,type DataSubPermission} from '@/hooks/useDataSubPermissions';
import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Settings, Bell, Search, LayoutDashboard, Wallet, ReceiptText, Grid3X3, Wrench, Smartphone, Wifi, Zap, Tv, GraduationCap, ArrowRightLeft, Printer } from 'lucide-react';
import { Logo } from './Logo';
import { Avatar } from '@/components/ui/Stepper';
import { productThemes, type ProductKey } from '@/lib/designTokens';
import { useAuth } from '@/context/AuthContext';

const dataSubItems: {label:string;path:string;permission:DataSubPermission}[]=[{"label": "Dashboard", "path": "dashboard", "permission": "dashboard"}, {"label": "Wallet", "path": "wallet", "permission": "wallet"}, {"label": "Transactions", "path": "transactions", "permission": "transactions"}, {"label": "All services", "path": "services", "permission": "services"}, {"label": "Customer tools", "path": "customer-tools", "permission": "customer_tools"}, {"label": "Buy airtime", "path": "buy-airtime", "permission": "purchase"}, {"label": "Buy data", "path": "buy-data", "permission": "purchase"}, {"label": "Electricity", "path": "pay-electricity", "permission": "purchase"}, {"label": "Cable TV", "path": "pay-cable", "permission": "purchase"}, {"label": "Education PINs", "path": "buy-education", "permission": "purchase"}, {"label": "Airtime to cash", "path": "airtime-to-cash", "permission": "purchase"}, {"label": "Print cards", "path": "print-cards", "permission": "purchase"}, {"label": "Reseller workspace", "path": "reseller-dashboard", "permission": "reseller"}, {"label": "Developer API", "path": "api-dashboard", "permission": "api"}, {"label": "Upgrade plan", "path": "upgrade", "permission": "upgrade"}, {"label": "Notifications", "path": "notifications", "permission": "notifications"}, {"label": "Support", "path": "support-centre", "permission": "support"}, {"label": "Profile", "path": "profile", "permission": "profile"}, {"label": "Security", "path": "security", "permission": "profile"}];

export interface SidebarItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string | number;
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface DashboardLayoutProps {
  product: ProductKey;
  sections: SidebarSection[];
  children: ReactNode;
  userName: string;
  userRole: string;
  pageTitle: string;
  pageBreadcrumb?: { label: string; href?: string }[];
  rightActions?: ReactNode;
}

export function DashboardLayout({
  product,
  sections: providedSections,
  children,
  userName,
  userRole,
  pageTitle,
  pageBreadcrumb,
  rightActions,
}: DashboardLayoutProps) {
  const location = useLocation();
  const dataSubPermissions=useDataSubPermissions();
  const sections:SidebarSection[]=product==='datasub'&&!location.pathname.startsWith('/admin')?[{title:'DataSub workspace',items:dataSubItems.filter(item=>dataSubPermissions.can(item.permission)).map(item=>({label:item.label,href:'/datasub/'+item.path,icon:<Settings className="w-4 h-4"/>}))}]:providedSections;
  const theme = productThemes[product];

  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const roleKey = String(profile?.role || '');
  const visibleSections=sections;
  const canSeeAdministration = ['super_admin', 'platform_admin', 'content_admin'].includes(roleKey);
  const searchableItems = visibleSections.flatMap((section) => section.items).filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  const handleSignOut = async () => { await signOut(); navigate('/signin'); };

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} shrink-0 bg-white border-r border-border flex flex-col transition-all duration-200 sticky top-0 h-screen`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Logo product={product} size="sm" variant={collapsed ? 'icon' : 'full'} />
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="text-muted hover:text-ink p-1">
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="mx-auto mt-2 p-1 text-muted hover:text-ink">
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {visibleSections.map((section, si) => (
            <div key={si} className="mb-4">
              {section.title && !collapsed && (
                <p className="text-2xs font-bold text-muted uppercase tracking-wide px-3 mb-1.5">{section.title}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? `${theme.badgeBg} ${theme.textClass}`
                        : 'text-ink hover:bg-gray-50'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className={`px-1.5 py-0.5 text-2xs font-bold rounded-full ${theme.badgeBg} ${theme.textClass}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <Link to={product==='datasub'?'/datasub/profile':'/account/profile'} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors ${collapsed ? 'justify-center' : ''}`}>
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <button onClick={handleSignOut} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors ${collapsed ? 'justify-center' : ''}`}>
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Link to={`/${false ? '' : product}`} className="hover:underline">{theme.name}</Link>
                {pageBreadcrumb?.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span>/</span>
                    {crumb.href ? <Link to={crumb.href} className="hover:underline">{crumb.label}</Link> : <span>{crumb.label}</span>}
                  </span>
                ))}
              </div>
              <h1 className="text-lg font-bold text-ink">{pageTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {rightActions}
            <div className="relative">
              <button aria-label="Search dashboard" onClick={() => { setSearchOpen((v) => !v); setProfileOpen(false); }} className="p-2 rounded-lg text-muted hover:bg-gray-100 transition-colors">
                <Search className="w-4 h-4" />
              </button>
              {searchOpen && <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-border bg-white p-3 shadow-xl">
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dashboard…" className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-royal-200" />
                <div className="mt-2 max-h-64 overflow-y-auto">
                  {searchableItems.slice(0, 8).map((item) => <Link key={item.href} to={item.href} onClick={() => setSearchOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">{item.icon}<span>{item.label}</span></Link>)}
                  {searchableItems.length === 0 && <p className="px-3 py-2 text-sm text-muted">No matching dashboard page.</p>}
                </div>
              </div>}
            </div>
            <Link aria-label="Notifications" to={product==='datasub'?'/datasub/notifications':'/account/notifications'} className="p-2 rounded-lg text-muted hover:bg-gray-100 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </Link>
            <div className="relative">
              <button aria-label="Open profile menu" onClick={() => { setProfileOpen((v) => !v); setSearchOpen(false); }} className="flex items-center gap-2.5 pl-3 border-l border-border">
                <Avatar name={userName} size="sm" />
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-bold text-ink leading-none">{userName}</p>
                  <p className="text-xs text-muted mt-0.5">{userRole}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted" />
              </button>
              {profileOpen && <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-border bg-white p-2 shadow-xl">
                <Link to={product==='datasub'?'/datasub/profile':'/account/profile'} onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-50">My profile</Link>
                {canSeeAdministration && <Link to={product==='datasub'?'/datasub/security':'/account/security'} onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-50">Administration settings</Link>}
                <button onClick={handleSignOut} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50">Sign out</button>
              </div>}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
