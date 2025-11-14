"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { getRoleDisplayName } from '@/lib/permissions';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/patients': 'Manajemen Pasien',
  '/dashboard/appointments': 'Janji Temu',
  '/dashboard/medical-records': 'Rekam Medis',
  '/dashboard/prescriptions': 'Resep',
  '/dashboard/billing': 'Tagihan',
  '/dashboard/inventory': 'Inventori',
  '/dashboard/reports': 'Laporan',
  '/dashboard/bpjs/eligibility': 'BPJS - Cek Eligibilitas',
  '/dashboard/bpjs/sep/new': 'BPJS - Buat SEP',
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { role, fullName, loading } = useUserRole();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const pageTitle = pageTitles[pathname || ''] || 'Dashboard';
  const displayName = fullName || 'Loading...';
  const displayRole = role ? getRoleDisplayName(role) : '...';

  return (
    <header className="h-16 flex items-center justify-between border-b border-slate-200/60 bg-white/95 backdrop-blur-sm px-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
          {pageTitle}
        </h2>
        <p className="text-sm text-slate-500">Selamat datang di sistem manajemen klinik</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-md hover:bg-slate-100 transition-colors duration-150">
          <Bell className="h-5 w-5 text-slate-600" />
          <Badge 
            variant="error" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center animate-pulse"
          >
            3
          </Badge>
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">
              {loading ? 'Memuat...' : displayName}
            </p>
            <p className="text-xs text-slate-500">{displayRole}</p>
          </div>
          <button className="p-2 rounded-full border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-colors duration-150">
            <User className="h-5 w-5 text-emerald-700" />
          </button>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </header>
  );
}
