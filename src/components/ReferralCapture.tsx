import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {useAuth} from '@/context/AuthContext';
import {supabase} from '@/lib/supabase';
export function ReferralCapture(){const location=useLocation();const {user,profile}=useAuth();useEffect(()=>{const code=new URLSearchParams(location.search).get('ref');if(code&&/^[A-Fa-f0-9]{32}$/.test(code))localStorage.setItem('ihlink.datasub.pending-referral',code.toUpperCase());},[location.search]);useEffect(()=>{const code=localStorage.getItem('ihlink.datasub.pending-referral');if(!code||!user?.email_confirmed_at||profile?.status!=='active'||!supabase)return;void supabase.rpc('datasub_claim_referral',{p_code:code}).then(({error})=>{if(!error)localStorage.removeItem('ihlink.datasub.pending-referral');});},[user?.id,user?.email_confirmed_at,profile?.status]);return null;}
