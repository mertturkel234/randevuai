import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchGooglePlaces } from "@/lib/google-places";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = (await request.json()) as { query?: string };
  const query = body.query?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Arama sorgusu en az 2 karakter olmalı" },
      { status: 400 }
    );
  }

  const result = await searchGooglePlaces(query);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ results: result.results });
}
