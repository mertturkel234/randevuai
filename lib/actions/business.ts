"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { WorkingHours } from "@/types";

const businessSchema = z.object({
  name: z.string().min(2, "İşletme adı en az 2 karakter olmalı"),
  phone: z.string().optional(),
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
