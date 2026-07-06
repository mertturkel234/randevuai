"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelAppointment } from "@/lib/actions/business";
import { formatDateTime } from "@/lib/utils";
import type { Appointment, Service } from "@/types";

const statusMap = {
  pending: { label: "Beklemede", variant: "warning" as const },
  confirmed: { label: "Onaylı", variant: "success" as const },
  cancelled: { label: "İptal", variant: "destructive" as const },
  completed: { label: "Tamamlandı", variant: "secondary" as const },
};

export function AppointmentsManager({
  appointments,
  services,
}: {
  appointments: Appointment[];
  services: Service[];
}) {
  const [filter, setFilter] = useState<"today" | "week" | "all">("all");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceId, setServiceId] = useState("");

  async function handleCancel(id: string) {
    const result = await cancelAppointment(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Randevu iptal edildi");
      setSelected(null);
      window.location.reload();
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const body = {
      customer_name: formData.get("customer_name"),
      customer_phone: formData.get("customer_phone"),
      service_id: serviceId,
      start_time: new Date(formData.get("start_time") as string).toISOString(),
      notes: formData.get("notes") || undefined,
    };

    if (!serviceId) {
      toast.error("Lütfen hizmet seçin");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Randevu oluşturulamadı");
      return;
    }

    toast.success("Randevu oluşturuldu");
    setAddOpen(false);
    window.location.reload();
  }

  const now = new Date();
  const filtered = appointments.filter((a) => {
    const start = new Date(a.start_time);
    if (filter === "today") {
      return start.toDateString() === now.toDateString();
    }
    if (filter === "week") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return start >= weekStart && start <= weekEnd;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["today", "week", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "today" ? "Bugün" : f === "week" ? "Bu Hafta" : "Tümü"}
            </Button>
          ))}
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Manuel Randevu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manuel Randevu Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Müşteri Adı</Label>
                <Input name="customer_name" required />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input name="customer_phone" required placeholder="905XXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>Hizmet</Label>
                <Select value={serviceId} onValueChange={setServiceId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Hizmet seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tarih ve Saat</Label>
                <Input name="start_time" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label>Notlar</Label>
                <Textarea name="notes" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Oluştur
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Randevular ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz randevu yok.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => {
                const status = statusMap[a.status];
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelected(a)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-100 p-4 text-left hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium">{a.customer_name}</p>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(a.start_time)}
                        {a.services?.name ? ` · ${a.services.name}` : ""}
                      </p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Randevu Detayı</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Müşteri</p>
                  <p className="font-medium">{selected.customer_name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Telefon</p>
                  <p className="font-medium">{selected.customer_phone}</p>
                </div>
                <div>
                  <p className="text-slate-500">Tarih</p>
                  <p className="font-medium">{formatDateTime(selected.start_time)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Hizmet</p>
                  <p className="font-medium">{selected.services?.name ?? "—"}</p>
                </div>
              </div>
              {selected.notes && (
                <p className="text-sm text-slate-600">{selected.notes}</p>
              )}
              {selected.status !== "cancelled" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleCancel(selected.id)}
                >
                  Randevuyu İptal Et
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
