import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServiceClient } from "@/lib/supabase/server";

function appUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;
}

async function ensureProfile(admin: Awaited<ReturnType<typeof createServiceClient>>, userId: string) {
  const { data: profile } = await admin
    .from("profiles")
    .select("business_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile) return profile;

  const { data: newBusiness } = await admin
    .from("businesses")
    .insert({ name: "Yeni İşletme" })
    .select("id")
    .single();

  if (!newBusiness) return null;

  const { error } = await admin.from("profiles").insert({
    id: userId,
    business_id: newBusiness.id,
    role: "owner",
  });

  if (error) return null;
  return { business_id: newBusiness.id };
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const userId = request.nextUrl.searchParams.get("state");
  const base = appUrl(request);

  if (!code || !userId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=google_auth", base)
    );
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=google_not_configured", base)
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${base}/api/auth/google/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar =
      calendarList.data.items?.find((c) => c.primary) ??
      calendarList.data.items?.[0];

    const supabase = await createServiceClient();
    const profile = await ensureProfile(supabase, userId);

    if (!profile) {
      return NextResponse.redirect(
        new URL("/setup", base)
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
      new URL("/dashboard/settings?google=connected", base)
    );
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=google_auth", base)
    );
  }
}
