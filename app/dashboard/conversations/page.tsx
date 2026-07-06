import { ConversationsView } from "@/components/dashboard/conversations-view";
import { getCurrentBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ConversationsPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("business_id", business.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Konuşmalar</h1>
        <p className="text-slate-500">WhatsApp mesaj geçmişi</p>
      </div>
      <ConversationsView conversations={conversations ?? []} />
    </div>
  );
}
