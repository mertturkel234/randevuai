import { ServicesManager } from "@/components/dashboard/services-manager";
import { getCurrentBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ServicesPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hizmetler</h1>
        <p className="text-slate-500">AI asistanın sunacağı hizmetleri yönetin</p>
      </div>
      <ServicesManager services={services ?? []} />
    </div>
  );
}
