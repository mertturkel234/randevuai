import { createClient } from "@/lib/supabase/server";
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

export async function requireBusiness(): Promise<Business> {
  const business = await getCurrentBusiness();
  if (!business) {
    throw new Error("İşletme bulunamadı");
  }
  return business;
}
