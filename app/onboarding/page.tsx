import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { getCurrentBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/auth/login");
  if (business.onboarding_completed) redirect("/dashboard");

  const supabase = await createClient();
  const { count } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("is_active", true);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <OnboardingWizard business={business} serviceCount={count ?? 0} />
    </div>
  );
}
