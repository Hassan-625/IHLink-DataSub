type CataloguePlan = { plan_category: string | null; validity_label: string | null };
export function dataPlanType(plan: CataloguePlan): string {
  const key = (plan.plan_category || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return ({sme2:'sme_2',corporategifting:'corporate_gifting',corporate:'corporate_gifting'} as Record<string,string>)[key] || key;
}
export function dataPlanTypeLabel(key: string): string {
  return ({all:'All types',sme:'SME',sme_2:'SME 2',corporate_gifting:'Corporate Gifting',gifting:'Gifting',awoof:'Awoof'} as Record<string,string>)[key] || key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'Other data';
}
export function dataNetworkKey(value: string): string {
  const key = value.trim().toUpperCase();
  return key === '9MOBILE' ? 'T2' : key;
}
const durationFilters = new Set(['daily', 'weekly', 'monthly', 'multi_month']);
export function matchesPlanCategory(plan: CataloguePlan, filter: string): boolean {
  if (filter === 'all') return true;
  const category = dataPlanType(plan);
  if (!durationFilters.has(filter)) return category === filter;
  const label = (plan.validity_label || '').trim().toLowerCase();
  const match = label.match(/^(\d+(?:\.\d+)?)\s*(hours?|days?|weeks?|months?|years?)\b/);
  if (!match) return category === filter;
  const amount = Number(match[1]);
  const unit = match[2];
  const days = amount * (unit.startsWith('hour') ? 1 / 24 : unit.startsWith('week') ? 7 : unit.startsWith('month') ? 30 : unit.startsWith('year') ? 365 : 1);
  if (days <= 0) return false;
  const duration = days < 7 ? 'daily' : days < 28 ? 'weekly' : days < 60 ? 'monthly' : 'multi_month';
  return duration === filter;
}
