"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createService,
  updateService,
  deleteService,
} from "@/lib/actions/business";
import { formatPrice } from "@/lib/utils";
import type { Service } from "@/types";

function ServiceForm({
  service,
  onSuccess,
}: {
  service?: Service;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = service
      ? await updateService(service.id, formData)
      : await createService(formData);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success(service ? "Hizmet güncellendi" : "Hizmet eklendi");
      setOpen(false);
      onSuccess();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {service ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            Yeni Hizmet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {service ? "Hizmeti Düzenle" : "Yeni Hizmet Ekle"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Hizmet Adı</Label>
            <Input
              id="name"
              name="name"
              defaultValue={service?.name}
              placeholder="Saç Kesimi"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Süre (dk)</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                defaultValue={service?.duration_minutes ?? 30}
                min={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Fiyat (TL)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                defaultValue={service?.price ?? ""}
                placeholder="500"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ServicesManager({ services }: { services: Service[] }) {
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  async function handleDelete(id: string) {
    const result = await deleteService(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Hizmet silindi");
      refresh();
      window.location.reload();
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Hizmetler</CardTitle>
        <ServiceForm onSuccess={() => window.location.reload()} />
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <p className="text-sm text-slate-500">
            Henüz hizmet eklenmemiş. AI asistanın randevu alabilmesi için en az
            bir hizmet ekleyin.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-3 font-medium">Hizmet</th>
                  <th className="pb-3 font-medium">Süre</th>
                  <th className="pb-3 font-medium">Fiyat</th>
                  <th className="pb-3 font-medium">Durum</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-slate-50">
                    <td className="py-3 font-medium">{service.name}</td>
                    <td className="py-3">{service.duration_minutes} dk</td>
                    <td className="py-3">{formatPrice(service.price)}</td>
                    <td className="py-3">
                      <Badge variant={service.is_active ? "success" : "secondary"}>
                        {service.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <ServiceForm service={service} onSuccess={() => window.location.reload()} />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
