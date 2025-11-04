"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const pageTitle = pageTitles[pathname || ''] || 'Dashboard';

  return (
    <header className="h-16 flex items-center justify-between border-b border-gray-200/50 bg-white/95 backdrop-blur-sm px-6 shadow-sm">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-primary-900 bg-clip-text text-transparent">
          {pageTitle}
        </h2>
        <p className="text-sm text-gray-500">Selamat datang di sistem manajemen klinik</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-md hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 transition-all duration-200">
          <Bell className="h-5 w-5 text-gray-600" />
          <Badge 
            variant="error" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center animate-pulse"
          >
            3
          </Badge>
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <button className="p-2 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 hover:from-primary-200 hover:to-secondary-200 transition-all duration-200 shadow-sm">
            <User className="h-5 w-5 text-primary-700" />
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
