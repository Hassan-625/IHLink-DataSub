import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CreditCard,
  Smartphone,
  Wallet,
} from "lucide-react";

import { ModulePage } from "@/components/ModulePage";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useAccountSections } from "./accountShared";

type ServiceAccess = {
  product: string;
  status: "active" | "pending" | "suspended";
  plan_name: string | null;
  activated_at: string | null;
};

export function AccountPage() {
  const sections = useAccountSections();
  const { profile, user } = useAuth();

  const [access, setAccess] = useState<ServiceAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase || !user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("customer_service_access")
        .select("product,status,plan_name,activated_at")
        .eq("user_id", user.id)
        .eq("product", "datasub")
        .maybeSingle();

      if (mounted) {
        setAccess((data as ServiceAccess | null) ?? null);
        setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [user]);

  const userName =
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ") ||
    profile?.email ||
    "DataSub Customer";

  const isAdmin =
    profile?.role === "super_admin" ||
    profile?.role === "platform_admin";

  const active = access?.status === "active";

  const customerRole =
    access?.plan_name ||
    (isAdmin ? "DataSub Administrator" : "Smart Earner");

  return (
    <ModulePage
      product="datasub"
      sections={sections}
      title="My DataSub Account"
      eyebrow="IHLink DataSub"
      description="Manage your DataSub access, profile, wallet and digital services."
      userName={userName}
      userRole={customerRole}
      primaryAction="Open DataSub"
      metrics={[
        {
          label: "DataSub Access",
          value: loading
            ? "Checking..."
            : active
              ? "Active"
              : access?.status || "Not active",
        },
        {
          label: "Account Type",
          value: customerRole,
        },
        {
          label: "Account Status",
          value:
            profile?.status === "active"
              ? "Active"
              : profile?.status || "Protected",
        },
      ]}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <Card hover>
          <Smartphone className="h-7 w-7 text-emerald-600" />

          <h3 className="mt-4 text-lg font-bold">
            DataSub Dashboard
          </h3>

          <p className="mt-2 text-sm text-muted">
            Access airtime, data, electricity, cable,
            education services and your transaction history.
          </p>

          <Link
            to="/datasub/dashboard"
            className="mt-5 inline-flex items-center gap-2 font-bold text-emerald-700"
          >
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>

        <Card hover>
          <Wallet className="h-7 w-7 text-royal-600" />

          <h3 className="mt-4 text-lg font-bold">
            Wallet
          </h3>

          <p className="mt-2 text-sm text-muted">
            Manage wallet funding and review your available
            DataSub wallet information.
          </p>

          <Link
            to="/datasub/wallet"
            className="mt-5 inline-flex items-center gap-2 font-bold text-royal-600"
          >
            Open wallet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>

        <Card hover>
          <CreditCard className="h-7 w-7 text-violet-600" />

          <h3 className="mt-4 text-lg font-bold">
            Billing & Funding
          </h3>

          <p className="mt-2 text-sm text-muted">
            Review DataSub wallet funding requests and
            payment references associated with your account.
          </p>

          <Link
            to="/account/billing"
            className="mt-5 inline-flex items-center gap-2 font-bold text-violet-600"
          >
            View billing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>

      {!loading && !active && !isAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <h3 className="font-bold text-amber-900">
            DataSub access is not active
          </h3>

          <p className="mt-2 text-sm text-amber-800">
            Your account exists, but active DataSub service
            access could not be confirmed.
          </p>

          <Link
            to="/account/support"
            className="mt-4 inline-flex items-center gap-2 font-bold text-amber-900"
          >
            Contact support
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      )}

      {isAdmin && (
        <Card className="border-royal-200 bg-royal-50">
          <h3 className="font-bold text-navy-900">
            DataSub administration
          </h3>

          <p className="mt-1 text-sm text-muted">
            Your administrator account can use the DataSub
            administration workspace according to its assigned
            permissions.
          </p>

          <Link
            to="/admin/datasub"
            className="mt-4 inline-flex items-center gap-2 font-bold text-royal-700"
          >
            Open DataSub Admin
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      )}
    </ModulePage>
  );
}