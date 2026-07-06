import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  parseIncomingMessage,
  sendTextMessageForBusiness,
  verifyWebhookSignature,
} from "@/lib/whatsapp";
import {
  notifyBusinessOwner,
  processIncomingMessage,
} from "@/lib/ai-receptionist";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { DEFAULT_CONVERSATION_STATE } from "@/types";
import { formatDateTime } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    if (
      process.env.WHATSAPP_APP_SECRET &&
      !verifyWebhookSignature(rawBody, signature)
    ) {
      logger.warn("Invalid WhatsApp signature");
      return NextResponse.json({ status: "ignored" });
    }

    const body = JSON.parse(rawBody);
    const messages = parseIncomingMessage(body);

    if (messages.length === 0) {
      return NextResponse.json({ status: "ok" });
    }

    const supabase = await createServiceClient();

    for (const message of messages) {
      if (!checkRateLimit(`wa:${message.from}`, 20, 60000)) {
        continue;
      }

      let { data: business } = await supabase
        .from("businesses")
        .select("*")
        .eq("whatsapp_phone_number_id", message.phoneNumberId)
        .maybeSingle();

      if (!business) {
        const { data: fallbackBusiness } = await supabase
          .from("businesses")
          .select("*")
          .limit(1)
          .maybeSingle();
        business = fallbackBusiness;
      }

      if (!business) {
        logger.warn("No business for WhatsApp message", {
          phoneNumberId: message.phoneNumberId,
        });
        continue;
      }

      let { data: conversation } = await supabase
        .from("conversations")
        .select("*")
        .eq("business_id", business.id)
        .eq("customer_phone", message.from)
        .maybeSingle();

      if (!conversation) {
        const { data: newConversation } = await supabase
          .from("conversations")
          .insert({
            business_id: business.id,
            customer_phone: message.from,
            messages: [],
            state: DEFAULT_CONVERSATION_STATE,
          })
          .select("*")
          .single();
        conversation = newConversation;
      }

      if (!conversation) continue;

      const { reply, appointmentCreated } = await processIncomingMessage(
        business,
        conversation,
        message.text,
        message.from
      );

      const phoneNumberId =
        business.whatsapp_phone_number_id || message.phoneNumberId;

      await sendTextMessageForBusiness(phoneNumberId, message.from, reply);

      if (appointmentCreated) {
        await notifyBusinessOwner(
          business,
          `🔔 Yeni randevu WhatsApp üzerinden alındı. Müşteri: ${message.from}`
        );
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    logger.error("WhatsApp webhook error", { error });
    return NextResponse.json({ status: "ok" });
  }
}
