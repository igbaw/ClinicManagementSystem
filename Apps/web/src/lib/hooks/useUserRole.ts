'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/permissions';

interface UserRoleData {
  role: UserRole | null;
  loading: boolean;
  userId: string | null;
  fullName: string | null;
}

/**
 * Hook to get current user's role
 * Usage: const { role, loading } = useUserRole();
 */
export function useUserRole(): UserRoleData {
  const [data, setData] = useState<UserRoleData>({
    role: null,
    loading: true,
    userId: null,
    fullName: null,
  });

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setData({ role: null, loading: false, userId: null, fullName: null });
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      setData({
        role: (userData?.role as UserRole) || null,
        loading: false,
        userId: user.id,
        fullName: userData?.full_name || null,
      });
    }

    fetchRole();
  }, []);

  return data;
}

/**
 * Hook to check permissions based on user role
 * Usage: const { canAccessMedicalRecords, isDoctor } = usePermission();
 */
export function usePermission() {
  const { role } = useUserRole();

  return {
    // Medical Records
    canAccessMedicalRecords: role === 'doctor' || role === 'admin',
    canCreateMedicalRecords: role === 'doctor' || role === 'admin',

    // Patients
    canViewPatients: role === 'front_desk' || role === 'admin' || role === 'doctor',
    canManagePatients: role === 'front_desk' || role === 'admin',
    canEditPatients: role === 'front_desk' || role === 'admin',

    // Appointments
    canManageAppointments: role === 'front_desk' || role === 'admin',

    // Billing
    canManageBilling: role === 'front_desk' || role === 'admin',

    // Inventory
    canManageInventory: role === 'front_desk' || role === 'admin',

    // Prescriptions
    canCreatePrescriptions: role === 'doctor' || role === 'admin',
    canViewPrescriptions: role === 'doctor' || role === 'admin' || role === 'front_desk',

    // Reports
    canViewReports: role === 'admin',

    // Queue
    canAccessQueue: role === 'doctor' || role === 'admin',

    // BPJS
    canAccessBPJS: role === 'front_desk' || role === 'admin',

    // Role checks
    isDoctor: role === 'doctor',
    isFrontDesk: role === 'front_desk',
    isAdmin: role === 'admin',

    // Current role
    role,
  };
}
