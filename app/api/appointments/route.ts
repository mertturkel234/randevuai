import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createAppointmentWithCalendar } from "@/lib/google-calendar";
import { notifyBusinessOwner } from "@/lib/ai-receptionist";
import { formatDateTime } from "@/lib/utils";
import type { Business } from "@/types";

const schema = z.object({
  customer_name: z.string().min(2),
  customer_phone: z.string().min(10),
  service_id: z.string().uuid(),
  start_time: z.string().datetime(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    const appointment = await createAppointmentWithCalendar(
      profile.business_id,
      parsed.data
    );

    const serviceClient = await createServiceClient();
    const { data: business } = await serviceClient
      .from("businesses")
      .select("*")
      .eq("id", profile.business_id)
      .single();

    const service = appointment.services as { name: string } | null | undefined;

    if (business) {
      await notifyBusinessOwner(
        business as Business,
        `🔔 Yeni randevu: ${parsed.data.customer_name} — ${service?.name ?? "Hizmet"} — ${formatDateTime(parsed.data.start_time)}`
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Randevu oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
