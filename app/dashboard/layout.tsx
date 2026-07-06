import { redirect } from "next/navigation";
import { getCurrentUser, getOrCreateBusinessForUser } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const business = await getOrCreateBusinessForUser();
  if (!business) {
    redirect("/setup");
  }

  if (!business.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar businessName={business.name} />
      <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
