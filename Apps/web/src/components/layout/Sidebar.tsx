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
    <aside className="w-64 bg-white/95 backdrop-blur-sm border-r border-gray-200/50 h-full flex flex-col shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-primary-500/5 to-secondary-500/5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          Klinik THT Aion
        </h1>
        <p className="text-xs text-gray-500 mt-1">Sistem Manajemen Klinik</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 shadow-sm border border-primary-200/50'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-primary-50/30 hover:text-gray-900'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5',
                  isActive ? 'text-primary-600' : 'text-gray-400'
                )} />
                {item.name}
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          © 2025 Klinik THT Aion
        </div>
      </div>
    </aside>
  );
}
