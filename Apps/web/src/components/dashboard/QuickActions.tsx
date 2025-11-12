'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Calendar, Clock } from 'lucide-react';

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aksi Cepat</CardTitle>
        <CardDescription>Pilih tindakan yang ingin dilakukan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="primary" className="w-full justify-start" asChild>
          <Link href="/walk-in">
            <Activity className="mr-2 h-4 w-4" />
            Check-in Pasien Walk-in
          </Link>
        </Button>
        <Button variant="secondary" className="w-full justify-start" asChild>
          <Link href="/patients/new">
            <Users className="mr-2 h-4 w-4" />
            Registrasi Pasien Baru
          </Link>
        </Button>
        <Button variant="secondary" className="w-full justify-start" asChild>
          <Link href="/appointments/new">
            <Calendar className="mr-2 h-4 w-4" />
            Buat Janji Temu
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/queue">
            <Clock className="mr-2 h-4 w-4" />
            Lihat Antrian
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
