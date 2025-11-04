"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewMedicationPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    generic_name: "",
    dosage_form: "",
    unit: "tablet",
    selling_price: "",
    stock_quantity: "0",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const payload = {
      name: form.name,
      generic_name: form.generic_name,
      dosage_form: form.dosage_form,
      unit: form.unit,
      selling_price: Number(form.selling_price || 0),
      purchase_price: Number(form.selling_price || 0),
      stock_quantity: Number(form.stock_quantity || 0),
      minimum_stock: 10,
      is_active: true,
    };
    const { error } = await supabase.from('medications').insert(payload);
    setSaving(false);
    if (!error) router.push('/inventory/medications');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Tambah Obat</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Nama Dagang</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Nama Generik</label>
          <input className="input" value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Bentuk Sediaan</label>
          <input className="input" value={form.dosage_form} onChange={(e) => setForm({ ...form, dosage_form: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Satuan</label>
          <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option value="tablet">Tablet</option>
            <option value="kapsul">Kapsul</option>
            <option value="botol">Botol</option>
            <option value="tube">Tube</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Harga Jual</label>
          <input className="input" type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Stok Awal</label>
          <input className="input" type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => router.back()} className="rounded-md border px-4 py-2">Batal</button>
        <button onClick={save} disabled={saving} className="rounded-md bg-blue-600 text-white px-4 py-2 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
      </div>

      <style jsx global>{`
        .input { @apply w-full px-3 py-2 border rounded-md; }
      `}</style>
    </div>
  );
}
