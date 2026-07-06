"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBusinessSettings, updateWorkingHours } from "@/lib/actions/business";
import type { Business, WorkingHours } from "@/types";
import { DAY_LABELS, SECTOR_OPTIONS } from "@/types";
import Link from "next/link";

export function SettingsForm({
  business,
  googleConfigured = true,
}: {
  business: Business;
  googleConfigured?: boolean;
}) {
  const [workingHours, setWorkingHours] = useState<WorkingHours>(
    business.working_hours
  );
  const [loading, setLoading] = useState(false);

  async function handleBusinessSubmit(formData: FormData) {
    setLoading(true);
    const result = await updateBusinessSettings(formData);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Ayarlar kaydedildi");
  }

  async function handleHoursSave() {
    setLoading(true);
    const result = await updateWorkingHours(workingHours);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Çalışma saatleri kaydedildi");
  }

  const googleConnected = !!business.google_refresh_token;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>İşletme Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleBusinessSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">İşletme Adı</Label>
              <Input id="name" name="name" defaultValue={business.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sektör</Label>
              <select
                id="sector"
                name="sector"
                defaultValue={business.sector}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                {SECTOR_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={business.phone ?? ""}
                placeholder="05XX XXX XX XX"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Numarası</Label>
                <Input
                  id="whatsapp_number"
                  name="whatsapp_number"
                  defaultValue={business.whatsapp_number ?? ""}
                  placeholder="905XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_phone_number_id">Phone Number ID</Label>
                <Input
                  id="whatsapp_phone_number_id"
                  name="whatsapp_phone_number_id"
                  defaultValue={business.whatsapp_phone_number_id ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_whatsapp">Admin Bildirim Numarası</Label>
              <Input
                id="admin_whatsapp"
                name="admin_whatsapp"
                defaultValue={business.admin_whatsapp ?? ""}
                placeholder="Randevu bildirimleri için"
              />
            </div>
            <Button type="submit" disabled={loading}>
              Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Çalışma Saatleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(DAY_LABELS) as (keyof WorkingHours)[]).map((day) => (
            <div
              key={day}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 p-3"
            >
              <span className="w-24 text-sm font-medium">{DAY_LABELS[day]}</span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!workingHours[day].closed}
                  onCheckedChange={(checked) =>
                    setWorkingHours((prev) => ({
                      ...prev,
                      [day]: { ...prev[day], closed: !checked },
                    }))
                  }
                />
                <span className="text-xs text-slate-500">
                  {workingHours[day].closed ? "Kapalı" : "Açık"}
                </span>
              </div>
              {!workingHours[day].closed && (
                <>
                  <Input
                    type="time"
                    className="w-32"
                    value={workingHours[day].open}
                    onChange={(e) =>
                      setWorkingHours((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], open: e.target.value },
                      }))
                    }
                  />
                  <span className="text-slate-400">—</span>
                  <Input
                    type="time"
                    className="w-32"
                    value={workingHours[day].close}
                    onChange={(e) =>
                      setWorkingHours((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], close: e.target.value },
                      }))
                    }
                  />
                </>
              )}
            </div>
          ))}
          <Button onClick={handleHoursSave} disabled={loading}>
            Saatleri Kaydet
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Takvim</CardTitle>
        </CardHeader>
        <CardContent>
          {googleConnected ? (
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 font-medium">Bağlı ✓</span>
              <p className="text-sm text-slate-500">
                Randevular otomatik takvime ekleniyor.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Google Takvim bağlayarak randevuları otomatik senkronize edin.
              </p>
              {googleConfigured ? (
                <Button asChild>
                  <Link href="/api/auth/google">Google Takvim Bağla</Link>
                </Button>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Google OAuth yapılandırması eksik. Vercel&apos;de{" "}
                  <code className="text-xs">GOOGLE_CLIENT_ID</code> ve{" "}
                  <code className="text-xs">GOOGLE_CLIENT_SECRET</code>{" "}
                  tanımlayın, ardından Google Cloud Console&apos;da redirect URI
                  olarak{" "}
                  <code className="text-xs break-all">
                    https://randevuai.vercel.app/api/auth/google/callback
                  </code>{" "}
                  ekleyin.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
