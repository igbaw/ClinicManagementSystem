import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Ensure user row exists (bootstrap)
  const userId = session.user.id;
  const email = session.user.email ?? "user@local";
  await supabase
    .from('users')
    .upsert({ id: userId, full_name: email, role: 'admin', is_active: true })
    .select('id')
    .single();

  return (
    <div className="h-screen w-full grid grid-cols-[16rem_1fr] bg-gradient-to-br from-gray-50 via-primary-50/30 to-secondary-50/20">
      <Sidebar />
      <div className="flex flex-col h-full">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
