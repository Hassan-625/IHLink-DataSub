export type CustomerTier = 'smart_earner' | 'reseller' | 'api_user' | 'top_seller';
export type PricingPolicy = Record<string, unknown>;

const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);
const nonNegative = (value: unknown, label: string) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} is unavailable`);
  return number;
};

// Amount means value delivered to the recipient. Fees are charged separately.
export function quotePurchase(service: string, tier: CustomerTier, product: Record<string, any>, amount: unknown) {
  const dynamic = ['AIRTIME', 'ELECTRICITY'].includes(service.toUpperCase());
  if (!dynamic) {
    const field = { smart_earner: 'smart_earner_price', reseller: 'reseller_price', api_user: 'api_price', top_seller: 'top_seller_price' }[tier];
    const charge = nonNegative(product[field], 'Product price');
    if (charge <= 0) throw new Error('Product price unavailable');
    return { serviceAmount: charge, fee: 0, charge: cents(charge) / 100, dynamic };
  }
  const face = Number(amount);
  if (!Number.isFinite(face) || face < 50 || face > 500000 || Math.abs(face * 100 - cents(face)) > 0.000001) {
    throw new Error('Amount must be between ₦50 and ₦500,000 with at most two decimal places');
  }
  const policy: PricingPolicy = product.markup_policy || {};
  const prefix = tier === 'api_user' ? 'api' : tier;
  const rawPercent = policy[`${prefix}_percent`];
  if (rawPercent == null && policy.pricing_mode !== 'customer_amount') throw new Error('Amount-based pricing is not configured');
  const percent = nonNegative(rawPercent ?? 0, 'Service fee');
  const flat = nonNegative(policy[`${prefix}_fee_ngn`] ?? 0, 'Service fee');
  const feeCents = Math.ceil(face * percent + flat * 100 - 0.00000001);
  return { serviceAmount: cents(face) / 100, fee: feeCents / 100, charge: (cents(face) + feeCents) / 100, dynamic };
}

// A zero catalogue placeholder is never a dynamic transaction cost. Without a
// verified discount, use the full face value as the conservative cost floor.
export function routeCost(serviceAmount: number, dynamic: boolean, route: Record<string, any>) {
  if (!dynamic) return nonNegative(route.provider_cost, 'Provider cost');
  const billing = route.raw_metadata?.billing || {};
  const percent = nonNegative(billing.cost_percent_of_face_value ?? 100, 'Provider cost rate');
  const flat = nonNegative(billing.fee_ngn ?? 0, 'Provider fee');
  return Math.ceil(serviceAmount * percent + flat * 100 - 0.00000001) / 100;
}

export function transactionService(service: string) {
  return ({ DATA: 'data', CABLE: 'cable_tv', ELECTRICITY: 'electricity', EXAM: 'education', AIRTIME: 'airtime' } as Record<string, string>)[service.toUpperCase()] || service.toLowerCase();
}
