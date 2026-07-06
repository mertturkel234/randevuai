import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Business, Profile } from "@/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function getCurrentBusiness(): Promise<Business | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", profile.business_id)
    .single();

  return data;
}

/**
 * Kayıt sonrası profil/işletme yoksa otomatik oluşturur.
 * Redirect döngüsünü önler.
 */
export async function getOrCreateBusinessForUser(): Promise<Business | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const existing = await getCurrentBusiness();
  if (existing) return existing;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!serviceKey || !supabaseUrl) return null;

  const admin = await createServiceClient();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile?.business_id) {
    const { data: linkedBusiness } = await admin
      .from("businesses")
      .select("*")
      .eq("id", existingProfile.business_id)
      .single();
    if (linkedBusiness) return linkedBusiness;
  }

  const businessName =
    (user.user_metadata?.business_name as string | undefined) ||
    "Yeni İşletme";

  const { data: newBusiness, error: businessError } = await admin
    .from("businesses")
    .insert({ name: businessName })
    .select("*")
    .single();

  if (businessError || !newBusiness) {
    console.error("Business create failed:", businessError?.message);
    return null;
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: user.id,
    business_id: newBusiness.id,
    role: "owner",
  });

  if (profileError) {
    console.error("Profile create failed:", profileError.message);
    return null;
  }

  return newBusiness;
}

export async function requireBusiness(): Promise<Business> {
  const business = await getOrCreateBusinessForUser();
  if (!business) {
    throw new Error("İşletme bulunamadı");
  }
  return business;
}
