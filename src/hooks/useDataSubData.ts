import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export type DataSubTransaction = {
  id: string;
  ref: string;
  type: string;
  service: string;
  recipient: string;
  amount: number;
  status: "pending" | "success" | "failed" | "reversed";
  date: string;
};
export type DataSubBeneficiary = { id: string; name: string; type: string; provider: string; recipient: string };

const serviceLabel: Record<string, string> = { airtime: "Airtime", data: "Data", electricity: "Electricity", cable_tv: "Cable TV", education: "Education" };

export function useDataSubData() {
  const { user, profile } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, referralBalance: 0 });
  const [transactions, setTransactions] = useState<DataSubTransaction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<DataSubBeneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !user) { setLoading(false); return; }
    setLoading(true); setError(null);
    const [walletResult, transactionResult, beneficiaryResult] = await Promise.all([
      supabase.from("datasub_wallets").select("balance,referral_balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("datasub_transactions").select("id,reference,service_type,provider,recipient,amount,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("datasub_beneficiaries").select("id,name,service_type,provider,recipient").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    const firstError = walletResult.error || transactionResult.error || beneficiaryResult.error;
    if (firstError) setError('Your account details could not be refreshed. Please try again shortly.');
    if (walletResult.data) setWallet({ balance: Number(walletResult.data.balance), referralBalance: Number(walletResult.data.referral_balance) });
    setTransactions((transactionResult.data || []).map((row) => ({ id: row.id, ref: row.reference, type: serviceLabel[row.service_type] || row.service_type, service: row.provider, recipient: row.recipient, amount: Number(row.amount), status: row.status, date: row.created_at })));
    setBeneficiaries((beneficiaryResult.data || []).map((row) => ({ id: row.id, name: row.name, type: serviceLabel[row.service_type] || row.service_type, provider: row.provider, recipient: row.recipient })));
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);
  const userName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email : "IHLink Customer";
  return { wallet, transactions, beneficiaries, loading, error, refresh, userName };
}
