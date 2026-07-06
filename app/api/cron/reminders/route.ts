import { NextRequest, NextResponse } from "next/server";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTextMessageForBusiness } from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const tomorrow = addDays(new Date(), 1);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, businesses(*), services(name)")
    .eq("status", "confirmed")
    .eq("reminder_sent", false)
    .gte("start_time", startOfDay(tomorrow).toISOString())
    .lte("start_time", endOfDay(tomorrow).toISOString());

  let sent = 0;

  for (const appointment of appointments ?? []) {
    const business = appointment.businesses as {
      whatsapp_phone_number_id: string | null;
    } | null;

    if (!business?.whatsapp_phone_number_id || !appointment.customer_phone) {
      continue;
    }

    try {
      await sendTextMessageForBusiness(
        business.whatsapp_phone_number_id,
        appointment.customer_phone,
        `Hatırlatma: Yarın ${formatDateTime(appointment.start_time)} randevunuz var. İptal için "iptal" yazabilirsiniz.`
      );

      await supabase
        .from("appointments")
        .update({ reminder_sent: true })
        .eq("id", appointment.id);

      sent += 1;
    } catch (error) {
      logger.error("Reminder send failed", {
        appointmentId: appointment.id,
        error,
      });
    }
  }

  return NextResponse.json({ sent });
}
