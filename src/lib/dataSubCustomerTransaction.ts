export type DataSubTransaction = {
  id: string; ref: string; type: string; service: string; plan?: string;
  recipient: string; amount: number;
  status: 'pending' | 'success' | 'failed' | 'reversed'; date: string;
};
const labels: Record<string,string> = { airtime: 'Airtime', data: 'Data', electricity: 'Electricity', cable_tv: 'Cable TV', education: 'Education' };
const brands: Record<string,string> = {
  MTN:'MTN', AIRTEL:'Airtel', GLO:'GLO', T2:'T2', '9MOBILE':'T2', '9 MOBILE':'T2', SMILE:'Smile',
  GOTV:'GOtv', DSTV:'DStv', STARTIME:'StarTimes', STARTIMES:'StarTimes',
  WAEC:'WAEC', NECO:'NECO', NABTEB:'NABTEB', JAMB:'JAMB',
  IKEDC:'Ikeja Electric', EKEDC:'Eko Electric', AEDC:'Abuja Electric', KEDCO:'Kano Electric', EEDC:'Enugu Electric',
  PHEDC:'Port Harcourt Electric', IBEDC:'Ibadan Electric', KAEDCO:'Kaduna Electric', JEDC:'Jos Electric', BEDC:'Benin Electric', YEDC:'Yola Electric',
};
const internal = /cashsub|cashfusion|datastation|legitdataway|primary_vtu|backup_vtu|upstream|routing|edge.?function/i;
export function customerService(value: unknown, fallback = 'Service'): string {
  const text = String(value ?? '').trim();
  const upper = text.toUpperCase();
  if (brands[upper]) return brands[upper];
  const electricity = Object.values(brands).find(name => name.endsWith('Electric') && name.toUpperCase() === upper);
  return electricity || fallback;
}
export function customerTransaction(row: any): DataSubTransaction {
  const type = labels[row.service_type] || 'Service';
  const catalogue = Array.isArray(row.catalog) ? row.catalog[0] : row.catalog;
  const network = catalogue?.network || row.network || row.metadata?.input?.network;
  const service = customerService(network, type);
  const name = String(catalogue?.name ?? '').trim();
  const plan = name && !internal.test(name) ? name : undefined;
  return { id: row.id, ref: row.reference, type, service, plan, recipient: row.recipient,
    amount: Number(row.amount), status: row.status, date: row.created_at };
}
