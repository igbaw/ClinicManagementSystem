'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { filterNavigationByRole, type UserRole } from '@/lib/permissions';
import { useMemo } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { role, loading } = useUserRole();

  // Filter navigation based on user role
  const navigation = useMemo(() => {
    if (!role) return [];
    return filterNavigationByRole(role as UserRole);
  }, [role]);

  return (
    <aside className="w-64 bg-white h-full flex flex-col border-r border-slate-200/60">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-200/60 bg-slate-50/80">
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
          Klinik THT Aion
        </h1>
        <p className="text-xs text-slate-500 mt-1">Sistem Manajemen Klinik</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="text-xs text-gray-500 mt-2">Memuat menu...</p>
          </div>
        ) : navigation.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-500">Tidak ada menu tersedia</p>
          </div>
        ) : (
          navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 border border-transparent',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-emerald-600' : 'text-slate-400'
                  )}
                />
                {item.name}
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-white/90">
        <div className="text-xs text-slate-500 text-center">
          © 2025 Klinik THT Aion
        </div>
      </div>
    </aside>
  );
}
