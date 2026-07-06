"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import type { Conversation, ConversationMessage } from "@/types";

export function ConversationsView({
  conversations,
}: {
  conversations: Conversation[];
}) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [selected, setSelected] = useState<Conversation | null>(
    conversations[0] ?? null
  );

  const filtered = conversations.filter((c) => {
    if (filter === "active") return c.state?.step !== "completed";
    if (filter === "completed") return c.state?.step === "completed";
    return true;
  });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Konuşmalar</CardTitle>
          <div className="flex gap-1">
            {(["all", "active", "completed"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "Tümü" : f === "active" ? "Aktif" : "Tamamlanan"}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500">Konuşma yok.</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left text-sm transition-colors",
                  selected?.id === c.id
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-100 hover:bg-slate-50"
                )}
              >
                <p className="font-medium">{c.customer_phone}</p>
                <p className="text-xs text-slate-400">
                  {formatDateTime(c.updated_at)}
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            {selected?.customer_phone ?? "Konuşma seçin"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selected ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {(selected.messages as ConversationMessage[]).map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    m.role === "user"
                      ? "ml-auto bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  )}
                >
                  {m.content}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Sol taraftan bir konuşma seçin.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
