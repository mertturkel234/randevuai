import { NextResponse } from "next/server";

const REQUIRED = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
] as const;

const OPTIONAL = [
  "GEMINI_MODEL",
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_APP_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "CRON_SECRET",
] as const;

export async function GET() {
  const required = REQUIRED.map((key) => ({
    key,
    set: Boolean(process.env[key]?.trim()),
  }));

  const optional = OPTIONAL.map((key) => ({
    key,
    set: Boolean(process.env[key]?.trim()),
  }));

  const ready = required.every((item) => item.set);

  return NextResponse.json({
    status: ready ? "ok" : "incomplete",
    message: ready
      ? "Zorunlu env değişkenleri tanımlı"
      : "Eksik env değişkenleri var — .env.local dosyasını kontrol edin",
    required,
    optional,
    endpoints: {
      webhook: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/webhook/whatsapp`,
      googleCallback: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/google/callback`,
      health: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/health`,
    },
  });
}
