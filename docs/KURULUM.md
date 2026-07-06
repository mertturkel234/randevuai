# RandevuAI — Adım Adım Kurulum Rehberi

Bu rehber, projeyi sıfırdan canlıya almak için gereken tüm adımları içerir.
Tahmini süre: **45–60 dakika**

---

## Adım 1: Gemini API Key (5 dk)

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. **Create API key** → kopyala
3. `.env.local` → `GEMINI_API_KEY=...`

> Key `AIzaSy...` ile başlamalı. Farklı formattaysa AI Studio'dan yeni key alın.

---

## Adım 2: Supabase (15 dk)

### 2.1 Proje oluştur
1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
2. İsim: `randevuai`, şifre belirle, region: `Frankfurt`

### 2.2 Migration çalıştır
1. **SQL Editor** → **New query**
2. `supabase/migrations/001_initial_schema.sql` içeriğini yapıştır → **Run**

### 2.3 API anahtarları
**Settings → API** → `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### 2.4 Auth
- Email provider: Enabled
- Site URL: `http://localhost:3000`

---

## Adım 3: Google Calendar OAuth (10 dk)

1. [console.cloud.google.com](https://console.cloud.google.com)
2. Calendar API → Enable
3. OAuth client (Web) → Redirect: `http://localhost:3000/api/auth/google/callback`
4. `.env.local`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

---

## Adım 4: Meta WhatsApp (20 dk)

1. [developers.facebook.com](https://developers.facebook.com) → WhatsApp ürünü
2. Token + Phone Number ID → `.env.local`
3. Webhook: `https://SIZIN-URL/api/webhook/whatsapp`, verify: `randevuai-verify`

Local test: `ngrok http 3000`

---

## Adım 5: Çalıştır

```bash
npm run check:env
npm run dev
```

Health: http://localhost:3000/api/health

---

## Adım 6: Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

Tüm env değişkenlerini Vercel dashboard'a ekle.
