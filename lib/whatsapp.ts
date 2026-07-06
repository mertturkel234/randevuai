import crypto from "crypto";
import { logger } from "@/lib/logger";

const WHATSAPP_API = "https://graph.facebook.com/v21.0";

export interface ParsedMessage {
  from: string;
  text: string;
  timestamp: string;
  messageId: string;
  phoneNumberId: string;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signature) return !appSecret;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export function parseIncomingMessage(body: unknown): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  const payload = body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          metadata?: { phone_number_id?: string };
          messages?: Array<{
            from: string;
            id: string;
            timestamp: string;
            type: string;
            text?: { body: string };
          }>;
        };
      }>;
    }>;
  };

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const phoneNumberId = change.value?.metadata?.phone_number_id ?? "";
      for (const message of change.value?.messages ?? []) {
        if (message.type === "text" && message.text?.body) {
          messages.push({
            from: message.from,
            text: message.text.body.trim(),
            timestamp: message.timestamp,
            messageId: message.id,
            phoneNumberId,
          });
        }
      }
    }
  }

  return messages;
}

export async function sendTextMessage(to: string, text: string) {
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID ??
    process.env.WHATSAPP_PHONE_NUMBER_ID_DEFAULT;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    logger.warn("WhatsApp credentials missing");
    return null;
  }

  const response = await fetch(
    `${WHATSAPP_API}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    logger.error("WhatsApp send failed", { to, error });
    throw new Error("WhatsApp mesajı gönderilemedi");
  }

  return response.json();
}

export async function sendTextMessageForBusiness(
  phoneNumberId: string,
  to: string,
  text: string
) {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) return null;

  const response = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error("WhatsApp business send failed", { phoneNumberId, to, error });
    throw new Error("WhatsApp mesajı gönderilemedi");
  }

  return response.json();
}

export async function sendButtonMessage(
  to: string,
  body: string,
  buttons: { id: string; title: string }[]
) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) return null;

  const response = await fetch(
    `${WHATSAPP_API}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: body },
          action: {
            buttons: buttons.slice(0, 3).map((b) => ({
              type: "reply",
              reply: { id: b.id, title: b.title.slice(0, 20) },
            })),
          },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("WhatsApp buton mesajı gönderilemedi");
  }

  return response.json();
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}
