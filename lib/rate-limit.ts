import { createServiceClient } from "@/lib/supabase/server";
import type { Business } from "@/types";

const TRIAL_DAILY_LIMIT = 50;

export async function checkAndIncrementMessageLimit(
  business: Business
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const resetDate = business.daily_message_reset_at?.slice(0, 10);

  let count = business.daily_message_count;

  if (resetDate !== today) {
    count = 0;
    await supabase
      .from("businesses")
      .update({
        daily_message_count: 0,
        daily_message_reset_at: new Date().toISOString(),
      })
      .eq("id", business.id);
  }

  const limit =
    business.subscription_status === "trial" ? TRIAL_DAILY_LIMIT : 1000;

  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await supabase
    .from("businesses")
    .update({ daily_message_count: count + 1 })
    .eq("id", business.id);

  return { allowed: true, remaining: limit - count - 1 };
}

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 30, windowMs = 60000) {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}
