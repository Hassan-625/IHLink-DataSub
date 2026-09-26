import { useEffect, useMemo, useState } from "react";
import { CreditCard, ReceiptText } from "lucide-react";

import { ModulePage } from "@/components/ModulePage";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useAccountSections } from "./accountShared";

type FundingRequest = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_reference: string | null;
};

export function BillingPage() {
  const { user, profile } = useAuth();
  const sections = useAccountSections();

  const [payments, setPayments] =
    useState<FundingRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase || !user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("datasub_wallet_funding_requests")
        .select(
          "id,amount,status,created_at,payment_reference",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (mounted) {
        setPayments((data || []) as FundingRequest[]);
        setNotice(error?.message || "");
        setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [user]);

  const completedValue = useMemo(
    () =>
      payments
        .filter((payment) =>
          ["paid", "completed", "approved"].includes(
            payment.status.toLowerCase(),
          ),
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount || 0),
          0,
        ),
    [payments],
  );

  const name =
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ") ||
    profile?.email ||
    "DataSub Customer";

  const role =
    profile?.role === "super_admin" ||
    profile?.role === "platform_admin"
      ? "DataSub Administrator"
      : "Smart Earner";

  return (
    <ModulePage
      product="datasub"
      sections={sections}
      title="Billing & Wallet Funding"
      description="Review DataSub wallet funding activity associated with your account."
      userName={name}
      userRole={role}
      primaryAction="Billing"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CreditCard className="h-5 w-5 text-royal-600" />

          <p className="mt-3 text-sm text-muted">
            Funding requests
          </p>

          <p className="mt-1 text-2xl font-black">
            {loading ? "..." : payments.length}
          </p>
        </Card>

        <Card>
          <ReceiptText className="h-5 w-5 text-emerald-600" />

          <p className="mt-3 text-sm text-muted">
            Completed value
          </p>

          <p className="mt-1 text-2xl font-black">
            ₦{completedValue.toLocaleString("en-NG")}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-muted">
            Billing source
          </p>

          <p className="mt-2 font-bold">
            IHLink DataSub
          </p>
        </Card>
      </div>

      <Card padding="none">
        <div className="border-b p-5">
          <h3 className="font-bold">
            Wallet funding history
          </h3>

          <p className="mt-1 text-xs text-muted">
            Only funding records belonging to your signed-in
            DataSub account are shown.
          </p>
        </div>

        {notice && (
          <p className="p-4 text-sm text-rose-600">
            {notice}
          </p>
        )}

        <div className="divide-y">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="grid gap-2 p-5 text-sm md:grid-cols-5"
            >
              <span className="font-bold">
                Wallet Funding
              </span>

              <span className="font-semibold">
                ₦{Number(payment.amount).toLocaleString("en-NG")}
              </span>

              <span className="capitalize">
                {payment.status}
              </span>

              <span className="text-muted">
                {payment.payment_reference || "—"}
              </span>

              <span className="text-muted">
                {new Date(
                  payment.created_at,
                ).toLocaleDateString("en-NG")}
              </span>
            </div>
          ))}

          {!loading && payments.length === 0 && (
            <p className="p-10 text-center text-sm text-muted">
              No DataSub wallet funding records are associated
              with this account yet.
            </p>
          )}
        </div>
      </Card>
    </ModulePage>
  );
}