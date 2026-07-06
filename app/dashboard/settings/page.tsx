import { SettingsForm } from "@/components/dashboard/settings-form";
import { getCurrentBusiness } from "@/lib/auth";

export default async function SettingsPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-500">İşletme ve entegrasyon ayarlarınız</p>
      </div>
      <SettingsForm business={business} />
    </div>
  );
}
