import { AppointmentsManager } from "@/components/dashboard/appointments-manager";
import { getCurrentBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AppointmentsPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [{ data: appointments }, { data: services }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, services(name, duration_minutes)")
      .eq("business_id", business.id)
      .order("start_time", { ascending: true }),
    supabase
      .from("services")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Randevular</h1>
        <p className="text-slate-500">Tüm randevularınızı görüntüleyin ve yönetin</p>
      </div>
      <AppointmentsManager
        appointments={appointments ?? []}
        services={services ?? []}
      />
    </div>
  );
}
