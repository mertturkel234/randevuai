"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleBusinessResultCard } from "@/components/dashboard/google-business-result-card";
import {
  saveGoogleBusinessProfile,
  saveGoogleBusinessUrl,
} from "@/lib/actions/business";
import type { Business, GoogleBusinessProfile } from "@/types";
import { buildGoogleSearchUrl } from "@/lib/google-places";

export function GoogleBusinessSetup({
  business,
  placesConfigured,
  mapsApiKey,
  onSaved,
}: {
  business: Business;
  placesConfigured: boolean;
  mapsApiKey: boolean;
  onSaved?: () => void;
}) {
  const existing = business.google_business_data;
  const [query, setQuery] = useState(
    [business.name, business.city].filter(Boolean).join(" ")
  );
  const [results, setResults] = useState<GoogleBusinessProfile[]>([]);
  const [selected, setSelected] = useState<GoogleBusinessProfile | null>(
    existing
  );
  const [manualUrl, setManualUrl] = useState(business.google_business_url ?? "");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"search" | "manual">(
    placesConfigured ? "search" : "manual"
  );

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch("/api/google/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Arama başarısız");
        return;
      }
      setResults(data.results ?? []);
      if ((data.results ?? []).length === 0) {
        toast.message("Sonuç bulunamadı. Farklı bir arama deneyin.");
      }
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setSearching(false);
    }
  }

  async function handleSaveProfile(profile: GoogleBusinessProfile) {
    setSaving(true);
    const result = await saveGoogleBusinessProfile(profile);
    setSaving(false);
    if (result.error) toast.error(result.error);
    else {
      setSelected(profile);
      toast.success("Google işletme profili kaydedildi");
      onSaved?.();
    }
  }

  async function handleSaveManualUrl() {
    if (!manualUrl.trim()) {
      toast.error("Google Maps bağlantısı girin");
      return;
    }
    setSaving(true);
    const result = await saveGoogleBusinessUrl(manualUrl.trim());
    setSaving(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Google bağlantısı kaydedildi");
      onSaved?.();
    }
  }

  const previewProfile: GoogleBusinessProfile | null =
    selected ??
    (business.google_business_data as GoogleBusinessProfile | null);

  return (
    <div className="space-y-6">
      {previewProfile && (
        <div className="space-y-2">
          <Label>Google&apos;da Görünümünüz</Label>
          <GoogleBusinessResultCard
            profile={previewProfile}
            searchFallback={{ name: business.name, city: business.city }}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "search" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("search")}
          disabled={!placesConfigured}
        >
          <Search className="mr-2 h-4 w-4" />
          Google&apos;da Ara
        </Button>
        <Button
          type="button"
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("manual")}
        >
          <Link2 className="mr-2 h-4 w-4" />
          Bağlantı Yapıştır
        </Button>
      </div>

      {mode === "search" && (
        <div className="space-y-4 rounded-lg border border-slate-200 p-4">
          {!placesConfigured && (
            <p className="text-sm text-amber-700 rounded-lg bg-amber-50 px-3 py-2">
              Otomatik arama için Vercel&apos;de{" "}
              <code className="text-xs">GOOGLE_MAPS_API_KEY</code> tanımlayın
              (Places API etkin). Şimdilik bağlantı yapıştırabilirsiniz.
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Örn: Amınoğlu Berber İstanbul"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching || !placesConfigured}>
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ara"
              )}
            </Button>
          </div>

          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.place_id} className="space-y-2">
                <GoogleBusinessResultCard profile={result} compact />
                <Button
                  size="sm"
                  onClick={() => handleSaveProfile(result)}
                  disabled={saving}
                >
                  Bu İşletmeyi Seç
                </Button>
              </div>
            ))}
          </div>

          <Button asChild variant="ghost" className="h-auto p-0 text-sm text-blue-600">
            <a
              href={buildGoogleSearchUrl(business.name, business.city)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google&apos;da manuel ara →
            </a>
          </Button>
        </div>
      )}

      {mode === "manual" && (
        <div className="space-y-4 rounded-lg border border-slate-200 p-4">
          <div className="space-y-2">
            <Label>Google Maps / İşletme Bağlantısı</Label>
            <Input
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://maps.google.com/... veya https://g.page/..."
            />
            <p className="text-xs text-slate-500">
              Google&apos;da işletmenizi bulun, paylaş menüsünden bağlantıyı
              kopyalayıp buraya yapıştırın.
            </p>
          </div>
          <Button onClick={handleSaveManualUrl} disabled={saving}>
            Bağlantıyı Kaydet
          </Button>
        </div>
      )}
    </div>
  );
}
