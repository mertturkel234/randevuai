"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Conversation } from "@/types";
import { formatDateTime } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Kopyalandı" : "Kopyala"}
    </Button>
  );
}

export function WhatsAppSetup({
  webhookUrl,
  verifyToken,
  conversations,
}: {
  webhookUrl: string;
  verifyToken: string;
  conversations: Conversation[];
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Webhook URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-slate-100 p-3 text-xs break-all">
                {webhookUrl}
              </code>
              <CopyButton text={webhookUrl} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Verify Token</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-slate-100 p-3 text-xs">
                {verifyToken}
              </code>
              <CopyButton text={verifyToken} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meta Developer Kurulumu</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
            <li>
              <a
                href="https://developers.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                developers.facebook.com
              </a>
              {" "}adresinden uygulama oluşturun
            </li>
            <li>WhatsApp Business API ürününü ekleyin</li>
            <li>Test numarası alın veya kendi numaranızı bağlayın</li>
            <li>Webhook URL ve Verify Token&apos;ı yukarıdaki değerlerle girin</li>
            <li>
              <code className="text-xs bg-slate-100 px-1 rounded">messages</code>{" "}
              alanına abone olun
            </li>
            <li>Ayarlar sayfasından Phone Number ID&apos;nizi kaydedin</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Son Gelen Mesajlar</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz mesaj yok.</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => {
                const last = c.messages?.at(-1);
                return (
                  <div
                    key={c.id}
                    className="rounded-lg border border-slate-100 p-3 text-sm"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{c.customer_phone}</span>
                      <span className="text-xs text-slate-400">
                        {formatDateTime(c.updated_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-500 line-clamp-1">
                      {last?.content ?? "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
