type CataloguePlan = { plan_category: string | null; validity_label: string | null };
const durationFilters = new Set(['daily', 'weekly', 'monthly', 'multi_month']);
export function matchesPlanCategory(plan: CataloguePlan, filter: string): boolean {
  if (filter === 'all') return true;
  const category = (plan.plan_category || '').toLowerCase();
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
