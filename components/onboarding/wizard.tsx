"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleBusinessSetup } from "@/components/dashboard/google-business-setup";
import {
  updateBusinessSettings,
  updateWorkingHours,
  createService,
  completeOnboarding,
} from "@/lib/actions/business";
import type { Business } from "@/types";
import { DEFAULT_WORKING_HOURS } from "@/types";

const STEPS = [
  "İşletme Bilgileri",
  "Google İşletme",
  "Hizmet Ekle",
  "Çalışma Saatleri",
  "Google Takvim",
  "WhatsApp",
  "Hazırsınız!",
];

export function OnboardingWizard({
  business,
  serviceCount,
  placesConfigured,
  mapsApiKey,
}: {
  business: Business;
  serviceCount: number;
  placesConfigured: boolean;
  mapsApiKey: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const progress = ((step + 1) / STEPS.length) * 100;

  async function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("sector", (e.currentTarget.elements.namedItem("sector") as HTMLSelectElement).value);
    const result = await updateBusinessSettings(formData);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else setStep(1);
  }

  async function handleStep3(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await createService(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) toast.error(result.error);
    else setStep(3);
  }

  async function handleStep4() {
    setLoading(true);
    const result = await updateWorkingHours(
      business.working_hours ?? DEFAULT_WORKING_HOURS
    );
    setLoading(false);
    if (result.error) toast.error(result.error);
    else setStep(4);
  }

  async function handleFinish() {
    setLoading(true);
    const result = await completeOnboarding();
    setLoading(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Kurulum tamamlandı!");
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-lg w-full space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-emerald-600">RandevuAI</p>
        <h1 className="mt-2 text-2xl font-bold">Hızlı Kurulum</h1>
        <p className="text-slate-500">
          Adım {step + 1} / {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      <Progress value={progress} />

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="space-y-2">
                <Label>İşletme Adı</Label>
                <Input name="name" defaultValue={business.name} required />
              </div>
              <div className="space-y-2">
                <Label>Sektör</Label>
                <select
                  name="sector"
                  defaultValue={business.sector}
                  className="flex h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                >
                  <option value="kuaför">Kuaför / Berber</option>
                  <option value="klinik">Klinik / Sağlık</option>
                  <option value="avukat">Avukat / Hukuk</option>
                  <option value="emlak">Emlak</option>
                  <option value="diğer">Diğer</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Şehir</Label>
                  <Input
                    name="city"
                    defaultValue={business.city ?? ""}
                    placeholder="İstanbul"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input name="phone" defaultValue={business.phone ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Input
                  name="address"
                  defaultValue={business.address ?? ""}
                  placeholder="Mahalle, cadde, no"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Devam
              </Button>
            </form>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Google&apos;da işletmenizi aratın ve arama sonucundaki kartı
                panele ekleyin. Müşterilerinizin gördüğü profil burada
                görünecek.
              </p>
              <GoogleBusinessSetup
                business={business}
                placesConfigured={placesConfigured}
                mapsApiKey={mapsApiKey}
                onSaved={() => router.refresh()}
              />
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(0)}>
                  Geri
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)}>
                  {business.google_business_url ? "Devam" : "Şimdilik Atla"}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleStep3} className="space-y-4">
              <div className="space-y-2">
                <Label>Hizmet Adı</Label>
                <Input name="name" placeholder="Saç Kesimi" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Süre (dk)</Label>
                  <Input name="duration_minutes" type="number" defaultValue={30} />
                </div>
                <div className="space-y-2">
                  <Label>Fiyat (TL)</Label>
                  <Input name="price" type="number" placeholder="500" />
                </div>
              </div>
              {serviceCount > 0 && (
                <p className="text-sm text-emerald-600">
                  ✓ {serviceCount} hizmet zaten ekli
                </p>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(3)}>
                  {serviceCount > 0 ? "Atla" : "Geri"}
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  Devam
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Varsayılan çalışma saatleri kullanılacak. Daha sonra Ayarlar&apos;dan
                düzenleyebilirsiniz.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Geri
                </Button>
                <Button className="flex-1" onClick={handleStep4} disabled={loading}>
                  Devam
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Google Takvim bağlayarak randevuları otomatik senkronize edin.
              </p>
              <Button asChild className="w-full">
                <Link href="/api/auth/google">Google Takvim Bağla</Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep(5)}>
                Şimdilik Atla
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                WhatsApp kurulumu için Meta Developer hesabınızda webhook
                ayarlarını yapın. Detaylı rehber panelde.
              </p>
              <Button className="w-full" onClick={() => setStep(6)}>
                Anladım, Devam
              </Button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
              <p className="text-slate-600">
                Tebrikler! RandevuAI kullanıma hazır. WhatsApp kurulumunu
                tamamladıktan sonra müşterileriniz mesaj atmaya başlayabilir.
              </p>
              <Button className="w-full" onClick={handleFinish} disabled={loading}>
                Panele Git
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
