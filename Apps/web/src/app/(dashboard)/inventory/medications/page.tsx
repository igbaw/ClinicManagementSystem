"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Medication = {
  id: string;
  name: string;
  generic_name: string;
  dosage_form: string | null;
  unit: string;
  selling_price: number;
  stock_quantity: number;
};

export default function MedicationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('medications').select('*').order('name');
    setItems((data as Medication[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Master Obat</h1>
        <Link href="/inventory/medications/new" className="rounded-md bg-blue-600 text-white px-4 py-2">Tambah Obat</Link>
      </div>
      {loading ? (
        <div>Memuat...</div>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border">Nama</th>
              <th className="text-left p-2 border">Sediaan</th>
              <th className="text-left p-2 border">Harga</th>
              <th className="text-left p-2 border">Stok</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2 border">{m.name}</td>
                <td className="p-2 border">{m.dosage_form}</td>
                <td className="p-2 border">Rp {Number(m.selling_price || 0).toLocaleString('id-ID')}</td>
                <td className="p-2 border">{m.stock_quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
