import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export type DataSubTier="smart_earner"|"reseller"|"api_user"|"top_seller";
export type TierPricedProduct={retail_price:number;reseller_price?:number|null;api_price?:number|null;top_seller_price?:number|null};

export function useDataSubTier(){
  const {user}=useAuth();
  const [state,setState]=useState<{userId:string;tier:DataSubTier}>({userId:"",tier:"smart_earner"});
  const tier=state.userId===user?.id?state.tier:"smart_earner";
  const setTier=(value:DataSubTier)=>setState({userId:user?.id||"",tier:value});
  useEffect(()=>{let alive=true;setTier("smart_earner");(async()=>{
    if(!supabase||!user){if(alive)setTier("smart_earner");return;}
    const {data}=await supabase.from("datasub_reseller_accounts").select("status,tier_code,api_access_approved").eq("user_id",user.id).maybeSingle();
    if(!alive)return;
    if(data?.status!=="active")setTier("smart_earner");
    else if(data?.tier_code==="top_seller")setTier("top_seller");
    else if(data?.api_access_approved===true)setTier("api_user");
    else setTier("reseller");
  })();return()=>{alive=false};},[user]);
  const priceFor=useCallback((p:TierPricedProduct)=>{
    if(tier==="api_user")return Number(p.api_price??p.retail_price);
    if(tier==="top_seller")return Number(p.top_seller_price??p.reseller_price??p.retail_price);
    if(tier==="reseller")return Number(p.reseller_price??p.retail_price);
    return Number(p.retail_price);
  },[tier]);
  return {tier,priceFor};
}
