import { WhatsAppSetup } from "@/components/dashboard/whatsapp-setup";
import { getCurrentBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function WhatsAppPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("business_id", business.id)
    .order("updated_at", { ascending: false })
    .limit(10);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const webhookUrl = `${appUrl}/api/webhook/whatsapp`;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? "randevuai-verify";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">WhatsApp</h1>
        <p className="text-slate-500">WhatsApp Business API kurulumu</p>
      </div>
      <WhatsAppSetup
        webhookUrl={webhookUrl}
        verifyToken={verifyToken}
        conversations={conversations ?? []}
      />
    </div>
  );
}
