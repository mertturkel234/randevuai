import Link from "next/link";
import {
  Calendar,
  MessageCircle,
  Clock,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Clock,
    title: "7/24 Otomatik Yanıt",
    description:
      "Müşterileriniz gece gündüz mesaj atsın, AI anında cevap versin.",
  },
  {
    icon: Calendar,
    title: "Otomatik Randevu",
    description:
      "Hizmet seçimi, tarih/saat ve onay — hepsi WhatsApp üzerinden.",
  },
  {
    icon: MessageCircle,
    title: "Google Takvim",
    description: "Randevular otomatik takviminize eklenir, çakışma olmaz.",
  },
];

const plans = [
  {
    name: "Deneme",
    price: "Ücretsiz",
    period: "14 gün",
    features: ["1 WhatsApp hattı", "50 mesaj/gün", "Temel panel"],
  },
  {
    name: "Başlangıç",
    price: "499 TL",
    period: "/ay",
    popular: true,
    features: [
      "1 WhatsApp hattı",
      "Sınırsız mesaj",
      "Google Takvim",
      "Hatırlatma mesajları",
    ],
  },
  {
    name: "Pro",
    price: "999 TL",
    period: "/ay",
    features: [
      "Tüm Başlangıç özellikleri",
      "Detaylı raporlar",
      "Öncelikli destek",
      "Çoklu personel",
    ],
  },
];

const faqs = [
  {
    q: "Kurulum ne kadar sürer?",
    a: "Kayıt olduktan sonra 10 dakikada sistemi kurabilirsiniz.",
  },
  {
    q: "WhatsApp Business hesabı gerekli mi?",
    a: "Evet, Meta Developer üzerinden WhatsApp Business API bağlantısı yapmanız gerekir.",
  },
  {
    q: "Hangi sektörler için uygun?",
    a: "Kuaför, klinik, avukat, emlak ve randevu ile çalışan tüm KOBİ'ler.",
  },
  {
    q: "AI Türkçe konuşuyor mu?",
    a: "Evet, tamamen Türkçe ve doğal bir dille müşterilerinizle iletişim kurar.",
  },
  {
    q: "İptal edebilir miyim?",
    a: "Evet, istediğiniz zaman aboneliğinizi iptal edebilirsiniz.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold text-emerald-600">RandevuAI</span>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Giriş</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Ücretsiz Deneyin</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          WhatsApp&apos;tan Gelen Her Mesaja
          <br />
          <span className="text-emerald-600">AI Resepsiyonistiniz</span> Cevap Versin
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
          Kuaför, klinik, avukat ve emlak ofisleri için Türkçe AI randevu
          asistanı. Müşterileriniz WhatsApp&apos;tan yazsın, siz işinize odaklanın.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/auth/register">
              14 Gün Ücretsiz Dene
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/login">Giriş Yap</Link>
          </Button>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title}>
                  <CardHeader>
                    <Icon className="h-8 w-8 text-emerald-600" />
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500">{f.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold">Nasıl Çalışır?</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Kayıt Ol", desc: "Ücretsiz hesap oluşturun" },
              { step: "2", title: "Ayarla", desc: "Hizmet ve saatlerinizi girin" },
              { step: "3", title: "Bağla", desc: "WhatsApp ve takvimi bağlayın" },
            ].map((s) => (
              <div key={s.step} className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
                  {s.step}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Fiyatlandırma</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? "border-emerald-500 ring-2 ring-emerald-500" : ""}
              >
                <CardHeader>
                  {plan.popular && (
                    <span className="text-xs font-semibold text-emerald-600">
                      EN POPÜLER
                    </span>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-sm font-normal text-slate-500">
                      {plan.period}
                    </span>
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-6 w-full">
                    <Link href="/auth/register">Başla</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-3xl font-bold">Sık Sorulan Sorular</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.q}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-emerald-600 py-16 text-center text-white">
        <h2 className="text-3xl font-bold">Hemen Başlayın</h2>
        <p className="mt-3 text-emerald-100">
          14 gün ücretsiz deneyin, kredi kartı gerekmez.
        </p>
        <Button asChild size="lg" variant="secondary" className="mt-6">
          <Link href="/auth/register">Ücretsiz Deneyin</Link>
        </Button>
      </section>

      <footer className="border-t py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} RandevuAI. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
