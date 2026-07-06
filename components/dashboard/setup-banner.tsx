import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "GEMINI_API_KEY",
] as const;

export function SetupBanner() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());

  if (missing.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">Kurulum tamamlanmadı</p>
            <p className="text-sm text-amber-700">
              `.env.local` dosyasında eksik ayarlar var. README.md adımlarını
              takip edin.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/api/health" target="_blank">
            Durumu Kontrol Et
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
