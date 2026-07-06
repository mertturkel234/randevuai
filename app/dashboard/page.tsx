import Link from "next/link";
import { Calendar, MessageSquare, Users } from "lucide-react";
import { getCurrentBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SetupBanner } from "@/components/dashboard/setup-banner";
import { formatDateTime } from "@/lib/utils";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

export default async function DashboardPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const now = new Date();

  const [{ count: todayCount }, { count: weekCount }, { data: conversations }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id)
        .in("status", ["pending", "confirmed"])
        .gte("start_time", startOfDay(now).toISOString())
        .lte("start_time", endOfDay(now).toISOString()),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id)
        .in("status", ["pending", "confirmed"])
        .gte("start_time", startOfWeek(now, { weekStartsOn: 1 }).toISOString())
        .lte("start_time", endOfWeek(now, { weekStartsOn: 1 }).toISOString()),
      supabase
        .from("conversations")
        .select("*")
        .eq("business_id", business.id)
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

  const stats = [
    {
      title: "Bugünkü Randevular",
      value: todayCount ?? 0,
      icon: Calendar,
    },
    {
      title: "Bu Hafta",
      value: weekCount ?? 0,
      icon: Users,
    },
    {
      title: "Son Konuşmalar",
      value: conversations?.length ?? 0,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-8">
      <SetupBanner />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Genel Bakış</h1>
        <p className="text-slate-500">Hoş geldiniz, {business.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Son Konuşmalar</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/conversations">Tümünü Gör</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {conversations && conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.map((c) => {
                const lastMessage = (c.messages as { content: string }[])?.at(-1);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <div>
                      <p className="font-medium">{c.customer_phone}</p>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {lastMessage?.content ?? "Mesaj yok"}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(c.updated_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Henüz WhatsApp konuşması yok. WhatsApp kurulumunu tamamlayın.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
