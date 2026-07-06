#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function loadEnvFile(filename) {
  const path = join(process.cwd(), filename);
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

/**
 * Kurulum kontrolü — npm run check:env
 */
const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
];

const optional = [
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "CRON_SECRET",
];

console.log("\n🔍 RandevuAI — Env Kontrolü\n");

let missing = 0;

for (const key of required) {
  const ok = Boolean(process.env[key]?.trim());
  console.log(`${ok ? "✅" : "❌"} ${key}`);
  if (!ok) missing += 1;
}

console.log("\nOpsiyonel (entegrasyonlar için):\n");

for (const key of optional) {
  const ok = Boolean(process.env[key]?.trim());
  console.log(`${ok ? "✅" : "⬜"} ${key}`);
}

console.log(
  missing === 0
    ? "\n✅ Zorunlu değişkenler tamam. npm run dev ile başlayabilirsiniz.\n"
    : `\n❌ ${missing} zorunlu değişken eksik. .env.local dosyasını doldurun.\n`
);

process.exit(missing > 0 ? 1 : 0);
