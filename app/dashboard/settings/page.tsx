import { SettingsForm } from "@/components/dashboard/settings-form";
import { getCurrentBusiness } from "@/lib/auth";

const MESSAGES: Record<string, { type: "error" | "success"; text: string }> = {
  google_connected: {
    type: "success",
    text: "Google Takvim başarıyla bağlandı!",
  },
  google_auth: {
    type: "error",
    text: "Google bağlantısı başarısız. Lütfen tekrar deneyin.",
  },
  google_not_configured: {
    type: "error",
    text: "Google OAuth henüz yapılandırılmamış. Vercel ortam değişkenlerine GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET ekleyin.",
  },
  no_profile: {
    type: "error",
    text: "Profil bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın.",
  },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const params = await searchParams;
  const googleParam =
    typeof params.google === "string" ? params.google : undefined;
  const errorParam =
    typeof params.error === "string" ? params.error : undefined;

  const messageKey =
    googleParam === "connected" ? "google_connected" : errorParam;
  const banner = messageKey ? MESSAGES[messageKey] : null;

  const googleConfigured =
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-500">İşletme ve entegrasyon ayarlarınız</p>
      </div>
      {banner && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {banner.text}
        </div>
      )}
      <SettingsForm
        business={business}
        googleConfigured={googleConfigured}
      />
    </div>
  );
}
