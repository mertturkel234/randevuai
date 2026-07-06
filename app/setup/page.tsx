import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SetupPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Kurulum Gerekli</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          {user ? (
            <p>
              Hesabınız oluştu ancak veritabanı tabloları henüz hazır değil.
              Supabase SQL Editor&apos;da migration dosyasını çalıştırmanız
              gerekiyor.
            </p>
          ) : (
            <p>Devam etmek için önce giriş yapın.</p>
          )}
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <a
                href="https://supabase.com/dashboard/project/zcetlgxjjztlgcwmcyyt/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                Supabase SQL Editor
              </a>
              &apos;ı açın
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1">
                supabase/migrations/001_initial_schema.sql
              </code>{" "}
              ve ardından{" "}
              <code className="rounded bg-slate-100 px-1">
                002_google_business_profile.sql
              </code>{" "}
              dosyalarını sırayla çalıştırın
            </li>
            <li>Run butonuna basın</li>
            <li>Bu sayfayı yenileyin</li>
          </ol>
          <div className="flex gap-2 pt-2">
            {user ? (
              <Button asChild>
                <Link href="/onboarding">Tekrar Dene</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/auth/login">Giriş Yap</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
