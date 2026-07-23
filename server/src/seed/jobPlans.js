import { JobPlan } from '../models/JobPlan.js';

export const defaultPlans = [
  {
    name: 'Starter',
    slug: 'starter',
    durationDays: 7,
    price: 1,
    features: ['Standard listing', '7 days visibility'],
  },
  {
    name: 'Standard',
    slug: 'standard',
    durationDays: 30,
    price: 2,
    features: ['Standard listing', 'Highlighted listing', '30 days visibility'],
  },
  {
    name: 'Premium',
    slug: 'premium',
    durationDays: null,
    price: 3,
    features: ['Standard listing', 'Highlighted listing', 'Featured badge', 'Until filled', 'Priority search ranking', 'Analytics access'],
  },
];

/** Insert default job plans only when collection is empty (production-safe). */
export async function seedJobPlans() {
  const existing = await JobPlan.countDocuments();
  if (existing > 0) return { mode: 'insert_only', inserted: 0, skipped: existing };
  await JobPlan.insertMany(defaultPlans);
  return { mode: 'insert_only', inserted: defaultPlans.length, skipped: 0 };
}
