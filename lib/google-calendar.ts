import { google } from "googleapis";
import {
  addMinutes,
  format,
  isBefore,
  isAfter,
  parseISO,
  startOfDay,
  endOfDay,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { createServiceClient } from "@/lib/supabase/server";
import type { Appointment, Business, WorkingHours } from "@/types";
import { logger } from "@/lib/logger";

const TIMEZONE = "Europe/Istanbul";
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function getOAuthClient(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

async function getBusiness(businessId: string): Promise<Business | null> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();
  return data;
}

function getDayKey(date: Date): keyof WorkingHours {
  return DAY_KEYS[date.getDay()] as keyof WorkingHours;
}

function parseTimeOnDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const zoned = toZonedTime(date, TIMEZONE);
  zoned.setHours(hours, minutes, 0, 0);
  return fromZonedTime(zoned, TIMEZONE);
}

export async function getAvailableSlots(
  businessId: string,
  dateStr: string,
  serviceDuration: number
): Promise<string[]> {
  const business = await getBusiness(businessId);
  if (!business) return [];

  const date = parseISO(`${dateStr}T12:00:00`);
  const dayKey = getDayKey(toZonedTime(date, TIMEZONE));
  const dayHours = business.working_hours[dayKey];

  if (dayHours.closed) return [];

  const dayStart = parseTimeOnDate(date, dayHours.open);
  const dayEnd = parseTimeOnDate(date, dayHours.close);

  const supabase = await createServiceClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("business_id", businessId)
    .in("status", ["pending", "confirmed"])
    .gte("start_time", startOfDay(date).toISOString())
    .lte("start_time", endOfDay(date).toISOString());

  const busySlots: { start: Date; end: Date }[] =
    appointments?.map((a) => ({
      start: new Date(a.start_time),
      end: new Date(a.end_time),
    })) ?? [];

  if (business.google_refresh_token) {
    try {
      const events = await listEvents(
        businessId,
        startOfDay(date),
        endOfDay(date)
      );
      for (const event of events) {
        if (event.start?.dateTime && event.end?.dateTime) {
          busySlots.push({
            start: new Date(event.start.dateTime),
            end: new Date(event.end.dateTime),
          });
        }
      }
    } catch (error) {
      logger.warn("Google Calendar slot fetch failed", { businessId, error });
    }
  }

  const slots: string[] = [];
  let cursor = dayStart;

  while (isBefore(addMinutes(cursor, serviceDuration), dayEnd) || 
         addMinutes(cursor, serviceDuration).getTime() === dayEnd.getTime()) {
    const slotEnd = addMinutes(cursor, serviceDuration);
    const hasConflict = busySlots.some(
      (busy) =>
        isBefore(cursor, busy.end) && isAfter(slotEnd, busy.start)
    );

    if (!hasConflict && isAfter(cursor, new Date())) {
      slots.push(format(toZonedTime(cursor, TIMEZONE), "HH:mm"));
    }

    cursor = addMinutes(cursor, 30);
  }

  return slots;
}

export async function createCalendarEvent(
  businessId: string,
  appointment: {
    customer_name: string;
    customer_phone: string;
    service_name: string;
    start_time: string;
    end_time: string;
    notes?: string | null;
  }
): Promise<string | null> {
  const business = await getBusiness(businessId);
  if (!business?.google_refresh_token) return null;

  const auth = getOAuthClient(business.google_refresh_token);
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = business.google_calendar_id || "primary";

  const event = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `${appointment.service_name} — ${appointment.customer_name}`,
      description: `Telefon: ${appointment.customer_phone}\n${appointment.notes ?? ""}`,
      start: {
        dateTime: appointment.start_time,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: appointment.end_time,
        timeZone: TIMEZONE,
      },
    },
  });

  return event.data.id ?? null;
}

export async function cancelCalendarEvent(
  businessId: string,
  googleEventId: string
): Promise<void> {
  const business = await getBusiness(businessId);
  if (!business?.google_refresh_token) return;

  const auth = getOAuthClient(business.google_refresh_token);
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = business.google_calendar_id || "primary";

  await calendar.events.delete({
    calendarId,
    eventId: googleEventId,
  });
}

export async function listEvents(
  businessId: string,
  startDate: Date,
  endDate: Date
) {
  const business = await getBusiness(businessId);
  if (!business?.google_refresh_token) return [];

  const auth = getOAuthClient(business.google_refresh_token);
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = business.google_calendar_id || "primary";

  const response = await calendar.events.list({
    calendarId,
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items ?? [];
}

export async function createAppointmentWithCalendar(
  businessId: string,
  data: {
    customer_name: string;
    customer_phone: string;
    service_id: string;
    start_time: string;
    notes?: string;
  }
): Promise<Appointment> {
  const supabase = await createServiceClient();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", data.service_id)
    .eq("business_id", businessId)
    .single();

  if (!service) {
    throw new Error("Hizmet bulunamadı");
  }

  const startTime = new Date(data.start_time);
  const endTime = addMinutes(startTime, service.duration_minutes);

  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
    .eq("business_id", businessId)
    .in("status", ["pending", "confirmed"])
    .lt("start_time", endTime.toISOString())
    .gt("end_time", startTime.toISOString());

  if (conflicts && conflicts.length > 0) {
    throw new Error("Bu saat dolu");
  }

  let googleEventId: string | null = null;
  try {
    googleEventId = await createCalendarEvent(businessId, {
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      service_name: service.name,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      notes: data.notes,
    });
  } catch (error) {
    logger.error("Google Calendar event creation failed", { businessId, error });
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      business_id: businessId,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      service_id: data.service_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "confirmed",
      google_event_id: googleEventId,
      notes: data.notes ?? null,
    })
    .select("*, services(*)")
    .single();

  if (error || !appointment) {
    throw new Error(error?.message ?? "Randevu oluşturulamadı");
  }

  return appointment;
}
