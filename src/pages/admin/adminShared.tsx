import {
  Activity,
  CreditCard,
  Gauge,
  Headphones,
  KeyRound,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShieldCheck,
  Smartphone,
  Users,
  WalletCards,
} from "lucide-react";

import type { SidebarSection } from "@/components/Sidebar";

export const adminSections: SidebarSection[] = [
  {
    items: [
      {
        label: "DataSub Operations",
        href: "/admin/datasub",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        label: "Provider & Pricing",
        href: "/admin/datasub/provider-pricing",
        icon: <CreditCard className="h-4 w-4" />,
      },
      {
        label: "Customer Dashboard",
        href: "/datasub/dashboard",
        icon: <Smartphone className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "DataSub Management",
    items: [
      {
        label: "Wallet & Funding",
        href: "/admin/datasub",
        icon: <WalletCards className="h-4 w-4" />,
      },
      {
        label: "Transactions",
        href: "/admin/datasub",
        icon: <ReceiptText className="h-4 w-4" />,
      },
      {
        label: "Customers",
        href: "/admin/datasub",
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: "Resellers & Upgrades",
        href: "/admin/datasub",
        icon: <ShieldCheck className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Provider Control",
    items: [
      {
        label: "Provider Health",
        href: "/admin/datasub/provider-pricing",
        icon: <Activity className="h-4 w-4" />,
      },
      {
        label: "Market Pricing",
        href: "/admin/datasub/provider-pricing",
        icon: <Gauge className="h-4 w-4" />,
      },
      {
        label: "API & Credentials",
        href: "/datasub/api-dashboard",
        icon: <KeyRound className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Support",
        href: "/account/support",
        icon: <Headphones className="h-4 w-4" />,
      },
      {
        label: "Security",
        href: "/account/security",
        icon: <ShieldCheck className="h-4 w-4" />,
      },
      {
        label: "Settings",
        href: "/account/profile",
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

export function badge(
  label: string,
  tone: "green" | "amber" | "red" | "blue" = "green",
) {
  const classes = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${classes[tone]}`}
    >
      {label}
    </span>
  );
}