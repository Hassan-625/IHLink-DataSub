import {
  Bell,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  Smartphone,
  UserRound,
} from "lucide-react";

import type { SidebarSection } from "@/components/Sidebar";

const accountItems = [
  {
    label: "Account Overview",
    href: "/account",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "DataSub Dashboard",
    href: "/datasub/dashboard",
    icon: <Smartphone className="h-4 w-4" />,
  },
  {
    label: "Profile",
    href: "/account/profile",
    icon: <UserRound className="h-4 w-4" />,
  },
  {
    label: "Notifications",
    href: "/account/notifications",
    icon: <Bell className="h-4 w-4" />,
  },
  {
    label: "Billing & Wallet Funding",
    href: "/account/billing",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    label: "Security",
    href: "/account/security",
    icon: <LockKeyhole className="h-4 w-4" />,
  },
  {
    label: "Support",
    href: "/account/support",
    icon: <LifeBuoy className="h-4 w-4" />,
  },
];

export function useAccountSections(): SidebarSection[] {
  return [
    {
      title: "DataSub Account",
      items: accountItems,
    },
  ];
}