import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Toaster } from "@/components/ui/toaster";
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
  // Check if user already exists first to avoid overwriting their role
  const userId = session.user.id;
  const email = session.user.email ?? "user@local";

  const { data: existingUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', userId)
    .single();

  // Only create user if they don't exist
  // Default to 'front_desk' for new users (admin should be assigned manually)
  if (!existingUser) {
    const userMetadata = session.user.user_metadata;
    const defaultRole = userMetadata?.default_role || 'front_desk';

    await supabase
      .from('users')
      .insert({
        id: userId,
        full_name: email,
        role: defaultRole,
        is_active: true
      })
      .select('id')
      .single();
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-[16rem_1fr] bg-gradient-to-br from-gray-50 via-primary-50/30 to-secondary-50/20">
      <Sidebar />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
