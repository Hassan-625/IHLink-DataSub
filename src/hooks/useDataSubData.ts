import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

import { customerTransaction, customerService } from "@/lib/dataSubCustomerTransaction";
export type { DataSubTransaction } from "@/lib/dataSubCustomerTransaction";
export type DataSubBeneficiary = { id: string; name: string; type: string; provider: string; recipient: string };

const serviceLabel: Record<string, string> = { airtime: "Airtime", data: "Data", electricity: "Electricity", cable_tv: "Cable TV", education: "Education" };

export function useDataSubData() {
  const { user, profile } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, referralBalance: 0 });
  const [transactions, setTransactions] = useState<DataSubTransaction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<DataSubBeneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const request = useRef(0);
  const owner = useRef(user?.id);
  owner.current=user?.id;
  const [loadedFor,setLoadedFor]=useState<string|null>(null);
  const refresh = useCallback(async () => {
    const version=++request.current;
    const userId=user?.id;
    if (!supabase || !user) { setWallet({balance:0,referralBalance:0});setTransactions([]);setBeneficiaries([]);setLoadedFor(null);setError(null);setLoading(false); return; }
    setLoading(true); setError(null);
    const [walletResult, transactionResult, beneficiaryResult] = await Promise.all([
      supabase.from("datasub_wallets").select("balance,referral_balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("datasub_transactions").select("id,reference,service_type,recipient,amount,status,created_at,network:metadata->input->>network,catalog:datasub_catalog_offerings(network,name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("datasub_beneficiaries").select("id,name,service_type,provider,recipient").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if(version!==request.current||owner.current!==userId)return;
    setLoadedFor(user.id);
    const firstError = walletResult.error || transactionResult.error || beneficiaryResult.error;
    if (firstError) setError('Your account details could not be refreshed. Please try again shortly.');
    if (walletResult.data) setWallet({ balance: Number(walletResult.data.balance), referralBalance: Number(walletResult.data.referral_balance) });
    setTransactions((transactionResult.data || []).map(customerTransaction));
    setBeneficiaries((beneficiaryResult.data || []).map((row) => ({ id: row.id, name: row.name, type: serviceLabel[row.service_type] || row.service_type, provider: customerService(row.provider, serviceLabel[row.service_type] || "Service"), recipient: row.recipient })));
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); return()=>{request.current++;}; }, [refresh]);
  const userName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email : "IHLink Customer";
  const current=loadedFor===user?.id;
  return { wallet:current?wallet:{balance:0,referralBalance:0}, transactions:current?transactions:[], beneficiaries:current?beneficiaries:[], loading:loading||Boolean(user&&!current), error:current?error:null, refresh, userName };
}
