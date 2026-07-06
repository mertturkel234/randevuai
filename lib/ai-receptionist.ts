import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
  type Part,
} from "@google/generative-ai";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { createServiceClient } from "@/lib/supabase/server";
import {
  createAppointmentWithCalendar,
  getAvailableSlots,
} from "@/lib/google-calendar";
import { checkAndIncrementMessageLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import type {
  Business,
  Conversation,
  ConversationMessage,
  ConversationState,
  Service,
} from "@/types";
import { DEFAULT_CONVERSATION_STATE, DAY_LABELS } from "@/types";

const TIMEZONE = "Europe/Istanbul";
const DEFAULT_MODEL = "gemini-2.0-flash";

function getGeminiModel(systemInstruction: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tanımlı değil");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? DEFAULT_MODEL,
    systemInstruction,
    tools: [{ functionDeclarations: toolDeclarations }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 300,
    },
  });
}

function buildSystemPrompt(
  business: Business,
  services: Service[],
  state: ConversationState
) {
  const now = toZonedTime(new Date(), TIMEZONE);
  const serviceList =
    services.length > 0
      ? services
          .map((s, i) => `${i + 1}) ${s.name} (${s.duration_minutes} dk)`)
          .join("\n")
      : "Henüz hizmet tanımlanmamış";

  const hoursList = Object.entries(business.working_hours)
    .map(([day, h]) => {
      const label = DAY_LABELS[day as keyof typeof DAY_LABELS];
      if (h.closed) return `${label}: Kapalı`;
      return `${label}: ${h.open} - ${h.close}`;
    })
    .join("\n");

  return `Sen ${business.name} için çalışan nazik bir resepsiyonistsin.
Görevin: müşterilerle WhatsApp üzerinden randevu almak.

Kurallar:
- Her zaman Türkçe ve samimi konuş
- Kısa cevaplar ver (WhatsApp için max 2-3 cümle)
- Sırayla: selamlama → hizmet seçimi → tarih/saat → isim → onay
- Müşteri adını mutlaka sor ve onay al
- Onay almadan randevu oluşturma
- Çalışma saatleri dışında randevu verme
- Bilmediğin sorularda "işletme sahibine ileteceğim" de
- Müşteri "iptal" derse nazikçe iptal sürecine yönlendir

Mevcut hizmetler:
${serviceList}

Çalışma saatleri:
${hoursList}

Bugünün tarihi: ${format(now, "d MMMM yyyy, EEEE")}

Mevcut konuşma durumu: ${JSON.stringify(state)}

Araçları kullanarak hizmetleri listele, boş saatleri kontrol et ve onay alındığında randevu oluştur.`;
}

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "list_services",
    description: "İşletmenin aktif hizmetlerini listeler",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "get_available_slots",
    description: "Belirli bir tarih için boş randevu saatlerini döndürür",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: {
          type: SchemaType.STRING,
          description: "YYYY-MM-DD formatında tarih",
        },
        service_id: { type: SchemaType.STRING },
      },
      required: ["date", "service_id"],
    },
  },
  {
    name: "create_appointment",
    description: "Onay alındıktan sonra randevu oluşturur",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        customer_name: { type: SchemaType.STRING },
        customer_phone: { type: SchemaType.STRING },
        service_id: { type: SchemaType.STRING },
        datetime: {
          type: SchemaType.STRING,
          description: "ISO 8601 formatında randevu zamanı",
        },
      },
      required: ["customer_name", "customer_phone", "service_id", "datetime"],
    },
  },
  {
    name: "get_business_info",
    description: "İşletme bilgilerini ve çalışma saatlerini döndürür",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "cancel_appointment",
    description: "Müşterinin yaklaşan randevusunu iptal eder",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        customer_phone: { type: SchemaType.STRING },
      },
      required: ["customer_phone"],
    },
  },
];

async function executeTool(
  name: string,
  args: Record<string, string>,
  business: Business,
  services: Service[],
  customerPhone: string
): Promise<string> {
  const supabase = await createServiceClient();

  switch (name) {
    case "list_services":
      if (services.length === 0) return "Henüz tanımlı hizmet yok.";
      return services
        .map((s, i) => `${i + 1}. ${s.name} — ${s.duration_minutes} dk`)
        .join("\n");

    case "get_available_slots": {
      const service = services.find((s) => s.id === args.service_id);
      if (!service) return "Hizmet bulunamadı.";
      const slots = await getAvailableSlots(
        business.id,
        args.date,
        service.duration_minutes
      );
      if (slots.length === 0) return `${args.date} için boş saat yok.`;
      return `Boş saatler: ${slots.join(", ")}`;
    }

    case "create_appointment": {
      await createAppointmentWithCalendar(business.id, {
        customer_name: args.customer_name,
        customer_phone: args.customer_phone || customerPhone,
        service_id: args.service_id,
        start_time: args.datetime,
      });
      const service = services.find((s) => s.id === args.service_id);
      return `Randevu oluşturuldu: ${args.customer_name}, ${service?.name}, ${args.datetime}`;
    }

    case "get_business_info":
      return `${business.name}\nTelefon: ${business.phone ?? "—"}\nSektör: ${business.sector}`;

    case "cancel_appointment": {
      const phone = args.customer_phone || customerPhone;
      const { data: upcoming } = await supabase
        .from("appointments")
        .select("*")
        .eq("business_id", business.id)
        .eq("customer_phone", phone)
        .in("status", ["pending", "confirmed"])
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(1)
        .single();

      if (!upcoming) return "İptal edilecek aktif randevu bulunamadı.";

      await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", upcoming.id);

      if (upcoming.google_event_id) {
        const { cancelCalendarEvent } = await import("@/lib/google-calendar");
        try {
          await cancelCalendarEvent(business.id, upcoming.google_event_id);
        } catch (error) {
          logger.warn("Calendar cancel failed", { error });
        }
      }

      return "Randevunuz iptal edildi.";
    }

    default:
      return "Bilinmeyen işlem.";
  }
}

function toGeminiHistory(
  messages: ConversationMessage[]
): Content[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));
}

export async function processIncomingMessage(
  business: Business,
  conversation: Conversation,
  userMessage: string,
  customerPhone: string
): Promise<{ reply: string; appointmentCreated: boolean }> {
  const limit = await checkAndIncrementMessageLimit(business);
  if (!limit.allowed) {
    return {
      reply:
        "Günlük mesaj limitine ulaşıldı. Lütfen işletmeyi telefonla arayın.",
      appointmentCreated: false,
    };
  }

  const supabase = await createServiceClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true);

  const activeServices = services ?? [];
  const state = (conversation.state ??
    DEFAULT_CONVERSATION_STATE) as ConversationState;

  const systemPrompt = buildSystemPrompt(business, activeServices, state);
  let appointmentCreated = false;
  let reply = "Üzgünüm, bir sorun oluştu. Lütfen tekrar deneyin.";

  try {
    const model = getGeminiModel(systemPrompt);
    const history = toGeminiHistory(
      (conversation.messages ?? []).slice(-10) as ConversationMessage[]
    );

    const chat = model.startChat({ history });
    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    let functionCalls = response.functionCalls();
    let iterations = 0;

    while (functionCalls && functionCalls.length > 0 && iterations < 5) {
      iterations += 1;
      const functionResponseParts: Part[] = [];

      for (const call of functionCalls) {
        const args = (call.args ?? {}) as Record<string, string>;
        const toolResult = await executeTool(
          call.name,
          args,
          business,
          activeServices,
          customerPhone
        );

        if (call.name === "create_appointment") {
          appointmentCreated = true;
        }

        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: { result: toolResult },
          },
        });
      }

      result = await chat.sendMessage(functionResponseParts);
      response = result.response;
      functionCalls = response.functionCalls();
    }

    reply = response.text()?.trim() || reply;
  } catch (error) {
    logger.error("AI receptionist error", { error, businessId: business.id });
    reply =
      "Şu an yanıt veremiyorum. Lütfen biraz sonra tekrar deneyin veya işletmeyi arayın.";
  }

  const now = new Date().toISOString();
  const updatedMessages: ConversationMessage[] = [
    ...(conversation.messages ?? []),
    { role: "user", content: userMessage, timestamp: now },
    { role: "assistant", content: reply, timestamp: now },
  ];

  const newState: ConversationState = appointmentCreated
    ? { ...DEFAULT_CONVERSATION_STATE, step: "completed" }
    : state;

  await supabase
    .from("conversations")
    .update({
      messages: updatedMessages,
      state: newState,
      customer_name: newState.customer_name,
    })
    .eq("id", conversation.id);

  return { reply, appointmentCreated };
}

export async function notifyBusinessOwner(
  business: Business,
  message: string
) {
  const adminPhone = business.admin_whatsapp || business.phone;
  const phoneNumberId =
    business.whatsapp_phone_number_id ||
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!adminPhone || !phoneNumberId) return;

  const { sendTextMessageForBusiness } = await import("@/lib/whatsapp");
  await sendTextMessageForBusiness(phoneNumberId, adminPhone, message);
}
