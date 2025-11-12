import {
  Home,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Package,
  BarChart3,
  Shield,
  Stethoscope,
  ClipboardList,
  LucideIcon
} from 'lucide-react';

export type UserRole = 'admin' | 'doctor' | 'front_desk';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['admin', 'doctor', 'front_desk']
  },
  {
    name: 'Antrian Pasien',
    href: '/queue',
    icon: ClipboardList,
    roles: ['doctor', 'admin'] // Only doctors and admins see the queue
  },
  {
    name: 'Pasien',
    href: '/patients',
    icon: Users,
    roles: ['admin', 'front_desk'] // Front desk manages patients
  },
  {
    name: 'Janji Temu',
    href: '/appointments',
    icon: Calendar,
    roles: ['admin', 'front_desk'] // Front desk manages appointments
  },
  {
    name: 'Rekam Medis',
    href: '/medical-records',
    icon: FileText,
    roles: ['doctor', 'admin'] // Only doctors and admins access medical records
  },
  {
    name: 'Resep',
    href: '/prescriptions/new',
    icon: Stethoscope,
    roles: ['doctor', 'admin'] // Only doctors and admins create prescriptions
  },
  {
    name: 'Tagihan',
    href: '/billing',
    icon: DollarSign,
    roles: ['admin', 'front_desk'] // Front desk manages billing
  },
  {
    name: 'Inventori',
    href: '/inventory',
    icon: Package,
    roles: ['admin', 'front_desk'] // Front desk manages inventory
  },
  {
    name: 'Laporan',
    href: '/reports/daily-revenue',
    icon: BarChart3,
    roles: ['admin'] // Only admin sees reports
  },
  {
    name: 'BPJS',
    href: '/bpjs/eligibility',
    icon: Shield,
    roles: ['admin', 'front_desk'] // Front desk handles BPJS
  },
];

/**
 * Filter navigation items based on user role
 */
export function filterNavigationByRole(role: UserRole): NavItem[] {
  return navigationItems.filter(item => item.roles.includes(role));
}

/**
 * Check if user has permission to access a feature
 */
export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Get role display name in Indonesian
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: 'Administrator',
    doctor: 'Dokter',
    front_desk: 'Front Desk',
  };
  return roleNames[role] || role;
}
