"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { WorkingHours, GoogleBusinessProfile } from "@/types";
import {
  getGooglePlaceDetails,
  parseGoogleMapsUrl,
} from "@/lib/google-places";

const businessSchema = z.object({
  name: z.string().min(2, "İşletme adı en az 2 karakter olmalı"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  whatsapp_number: z.string().optional(),
  whatsapp_phone_number_id: z.string().optional(),
  admin_whatsapp: z.string().optional(),
  sector: z.enum(["kuaför", "klinik", "avukat", "emlak", "diğer"]),
});

export async function updateBusinessSettings(formData: FormData) {
  const business = await requireBusiness();
  const supabase = await createClient();

  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    whatsapp_number: formData.get("whatsapp_number") || undefined,
    whatsapp_phone_number_id:
      formData.get("whatsapp_phone_number_id") || undefined,
    admin_whatsapp: formData.get("admin_whatsapp") || undefined,
    sector: formData.get("sector"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  const { error } = await supabase
    .from("businesses")
    .update(parsed.data)
    .eq("id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateWorkingHours(workingHours: WorkingHours) {
  const business = await requireBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("businesses")
    .update({ working_hours: workingHours })
    .eq("id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function completeOnboarding() {
  const business = await requireBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("businesses")
    .update({ onboarding_completed: true })
    .eq("id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

const serviceSchema = z.object({
  name: z.string().min(2),
  duration_minutes: z.coerce.number().min(5).max(480),
  price: z.coerce.number().optional(),
});

export async function createService(formData: FormData) {
  const business = await requireBusiness();
  const supabase = await createClient();

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    duration_minutes: formData.get("duration_minutes"),
    price: formData.get("price") || undefined,
  });

  if (!parsed.success) {
    return { error: "Geçersiz hizmet bilgisi" };
  }

  const { error } = await supabase.from("services").insert({
    business_id: business.id,
    name: parsed.data.name,
    duration_minutes: parsed.data.duration_minutes,
    price: parsed.data.price ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function updateService(id: string, formData: FormData) {
  const business = await requireBusiness();
  const supabase = await createClient();

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    duration_minutes: formData.get("duration_minutes"),
    price: formData.get("price") || undefined,
  });

  if (!parsed.success) return { error: "Geçersiz hizmet bilgisi" };

  const { error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      duration_minutes: parsed.data.duration_minutes,
      price: parsed.data.price ?? null,
    })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function deleteService(id: string) {
  const business = await requireBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({ is_active: false })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function cancelAppointment(id: string) {
  const business = await requireBusiness();
  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (!appointment) return { error: "Randevu bulunamadı" };

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) return { error: error.message };

  if (appointment.google_event_id) {
    const { cancelCalendarEvent } = await import("@/lib/google-calendar");
    try {
      await cancelCalendarEvent(business.id, appointment.google_event_id);
    } catch {
      // ignore calendar errors
    }
  }

  if (appointment.customer_phone && business.whatsapp_phone_number_id) {
    const { sendTextMessageForBusiness } = await import("@/lib/whatsapp");
    try {
      await sendTextMessageForBusiness(
        business.whatsapp_phone_number_id,
        appointment.customer_phone,
        `Randevunuz iptal edildi. Yeni randevu için bize yazabilirsiniz.`
      );
    } catch {
      // ignore whatsapp errors
    }
  }

  revalidatePath("/dashboard/appointments");
  return { success: true };
}

export async function saveGoogleBusinessProfile(profile: GoogleBusinessProfile) {
  const business = await requireBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("businesses")
    .update({
      google_place_id: profile.place_id,
      google_business_url: profile.maps_url,
      google_business_data: profile,
      address: profile.address ?? business.address,
      phone: profile.phone ?? business.phone,
    })
    .eq("id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/google-business");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function saveGoogleBusinessUrl(url: string) {
  const business = await requireBusiness();
  const supabase = await createClient();

  const parsed = parseGoogleMapsUrl(url);
  let profile: GoogleBusinessProfile | null = null;

  if (parsed.placeId) {
    profile = await getGooglePlaceDetails(parsed.placeId);
  }

  const fallbackProfile: GoogleBusinessProfile = profile ?? {
    place_id: parsed.placeId ?? "",
    name: business.name,
    address: business.address,
    rating: null,
    review_count: null,
    phone: business.phone,
    website: null,
    maps_url: url,
    photo_url: null,
    category: null,
  };

  const { error } = await supabase
    .from("businesses")
    .update({
      google_place_id: fallbackProfile.place_id || null,
      google_business_url: url,
      google_business_data: fallbackProfile,
    })
    .eq("id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/google-business");
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
