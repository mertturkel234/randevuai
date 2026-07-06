import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const userId = request.nextUrl.searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=google_auth", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const calendarList = await calendar.calendarList.list();
  const primaryCalendar =
    calendarList.data.items?.find((c) => c.primary) ??
    calendarList.data.items?.[0];

  const supabase = await createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", userId)
    .single();

  if (!profile) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=no_profile", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  await supabase
    .from("businesses")
    .update({
      google_refresh_token: tokens.refresh_token ?? null,
      google_calendar_id: primaryCalendar?.id ?? "primary",
    })
    .eq("id", profile.business_id);

  return NextResponse.redirect(
    new URL("/dashboard/settings?google=connected", process.env.NEXT_PUBLIC_APP_URL)
  );
}
