"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewPrescriptionPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const sp = useSearchParams();
  const medicalRecordId = sp.get('mrId') || "";
  const patientId = sp.get('patientId') || "";

  const [medQuery, setMedQuery] = useState("");
  type Medication = { id: string; name: string; unit: string; selling_price: number; stock_quantity: number; minimum_stock: number };
  type RxItem = { 
  medication_id: string; 
  medication_name: string; 
  dosage: string; 
  frequency: string; 
  timing: string; 
  duration: string; 
  quantity: number; 
  price: number; 
  stock_quantity: number; 
  unit: string; 
  instructions: string;
  isAutoCalculated?: boolean;
};
  const [medResults, setMedResults] = useState<Medication[]>([]);
  const [items, setItems] = useState<RxItem[]>([]);
  const [notes, setNotes] = useState("");

  const searchMeds = useCallback(async () => {
    if (medQuery.trim().length < 2) { setMedResults([]); return; }
    const { data } = await supabase
      .from('medications')
      .select('id,name,unit,selling_price,stock_quantity,minimum_stock')
      .eq('is_active', true)
      .or(`name.ilike.%${medQuery}%,generic_name.ilike.%${medQuery}%`)
      .limit(10);
    setMedResults((data as Medication[]) || []);
  }, [medQuery, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void searchMeds();
  }, [searchMeds]);

  function addItem(med: Medication) {
    const defaultFrequency = '3x sehari';
    const defaultDuration = '7 hari';
    const autoQuantity = calculateQuantity(defaultFrequency, defaultDuration);
    
    setItems((prev) => [...prev, { 
      medication_id: med.id, 
      medication_name: med.name, 
      dosage: '', 
      frequency: defaultFrequency, 
      timing: 'Sesudah makan', 
      duration: defaultDuration, 
      quantity: autoQuantity, 
      price: med.selling_price, 
      stock_quantity: med.stock_quantity,
      unit: med.unit,
      instructions: '',
      isAutoCalculated: true // Flag to track auto-calculated quantities
    }]);
    setMedQuery("");
    setMedResults([]);
  }

  const frequencyOptions = ['1x sehari', '2x sehari', '3x sehari', '4x sehari', 'Bila perlu'];
  const timingOptions = ['Sebelum makan', 'Sesudah makan', 'Bersama makan', 'Malam sebelum tidur', 'Pagi hari', 'Tidak tergantung makan'];
  const durationOptions = ['3 hari', '5 hari', '7 hari', '14 hari', '30 hari'];

  // Auto-calculate quantity based on frequency and duration
  function calculateQuantity(frequency: string, duration: string): number {
    if (frequency === 'Bila perlu') return 1; // Default for as-needed medications
    
    const freqNumber = parseInt(frequency.match(/\d+/)?.[0] || "1");
    const durationDays = parseInt(duration.match(/\d+/)?.[0] || "1");
    return freqNumber * durationDays;
  }

  // Update item quantity when frequency or duration changes
  function updateItemQuantity(idx: number, field: 'frequency' | 'duration', value: string) {
    setItems(items.map((item, i) => {
      if (i === idx) {
        const updatedItem = { ...item, [field]: value };
        // Auto-calculate quantity if it was previously auto-calculated
        if (item.isAutoCalculated && (field === 'frequency' || field === 'duration')) {
          updatedItem.quantity = calculateQuantity(
            field === 'frequency' ? value : item.frequency,
            field === 'duration' ? value : item.duration
          );
        }
        return updatedItem;
      }
      return item;
    }));
  }

  // Handle manual quantity edit
  function handleManualQuantityChange(idx: number, value: number) {
    setItems(items.map((item, i) => {
      if (i === idx) {
        return { ...item, quantity: value, isAutoCalculated: false };
      }
      return item;
    }));
  }

  async function savePrescription() {
    const { data: userRes } = await supabase.auth.getUser();
    const doctorId = userRes?.user?.id;
    
    // Create prescription
    const { data: pres, error } = await supabase
      .from('prescriptions')
      .insert({ medical_record_id: medicalRecordId, patient_id: patientId, doctor_id: doctorId, status: 'pending', notes })
      .select('id')
      .single();
    if (error) return;

    // Insert prescription items
    const payload = items.map((it) => ({
      prescription_id: pres.id,
      medication_id: it.medication_id,
      dosage: it.dosage || '-',
      frequency: it.frequency,
      timing: it.timing,
      duration: it.duration,
      quantity: it.quantity,
      instructions: it.instructions || '',
      price: it.price || 0,
    }));
    await supabase.from('prescription_items').insert(payload);

    // Update appointment status to completed
    if (medicalRecordId) {
      const { data: medicalRecord } = await supabase
        .from('medical_records')
        .select('appointment_id')
        .eq('id', medicalRecordId)
        .single();
      
      if (medicalRecord?.appointment_id) {
        await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('id', medicalRecord.appointment_id);
      }
    }

    router.push(`/prescriptions?success=true`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Resep Baru</h1>

      <div>
        <label className="block text-sm font-medium mb-1">Cari Obat</label>
        <input 
          value={medQuery} 
          onChange={(e) => setMedQuery(e.target.value)} 
          placeholder="Ketik nama obat..." 
          className="input" 
        />
        {medResults.length > 0 && (
          <div className="mt-2 border rounded shadow-lg">
            {medResults.map((m) => (
              <button 
                key={m.id} 
                onClick={() => addItem(m)} 
                className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-500">Stok: {m.stock_quantity} {m.unit}</div>
                </div>
                {m.stock_quantity === 0 ? (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Habis</span>
                ) : m.stock_quantity <= m.minimum_stock ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Stok Rendah</span>
                ) : (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Tersedia</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Obat yang Diresepkan</h2>
          {items.map((it, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{it.medication_name}</h3>
                  <div className="flex gap-2 mt-1">
                    {it.stock_quantity === 0 ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">⚠️ Stok Habis</span>
                    ) : it.stock_quantity < it.quantity ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">⚠️ Stok tidak cukup (tersedia: {it.stock_quantity} {it.unit})</span>
                    ) : it.stock_quantity <= 10 ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">⚠️ Stok Rendah</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">✅ Stok: {it.stock_quantity} {it.unit}</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setItems(items.filter((_, i) => i !== idx))} 
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Hapus
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Dosis</label>
                  <input 
                    className="input" 
                    placeholder="500mg" 
                    value={it.dosage} 
                    onChange={(e) => setItems(items.map((x,i)=> i===idx?{...x,dosage:e.target.value}:x))} 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-1">Frekuensi</label>
                  <select 
                    className="input" 
                    value={it.frequency} 
                    onChange={(e) => updateItemQuantity(idx, 'frequency', e.target.value)}
                  >
                    {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Waktu</label>
                  <select 
                    className="input" 
                    value={it.timing} 
                    onChange={(e) => setItems(items.map((x,i)=> i===idx?{...x,timing:e.target.value}:x))}
                  >
                    {timingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Durasi</label>
                  <select 
                    className="input" 
                    value={it.duration} 
                    onChange={(e) => updateItemQuantity(idx, 'duration', e.target.value)}
                  >
                    {durationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Jumlah ({it.unit})
                    {it.isAutoCalculated && (
                      <span className="ml-1 text-xs text-blue-600" title="Dihitung otomatis dari frekuensi × durasi">
                        🔄 Auto
                      </span>
                    )}
                  </label>
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="21" 
                    value={it.quantity} 
                    onChange={(e) => handleManualQuantityChange(idx, Number(e.target.value))} 
                  />
                  {it.isAutoCalculated && (
                    <p className="text-xs text-gray-500 mt-1">
                      {it.frequency} × {it.duration} = {it.quantity} {it.unit}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Instruksi Tambahan (opsional)</label>
                  <input 
                    className="input" 
                    placeholder="Teteskan 3-4 tetes ke telinga" 
                    value={it.instructions} 
                    onChange={(e) => setItems(items.map((x,i)=> i===idx?{...x,instructions:e.target.value}:x))} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Catatan Resep (opsional)</label>
          <textarea 
            className="input" 
            rows={3} 
            placeholder="Catatan tambahan untuk resep ini..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button 
          onClick={savePrescription} 
          disabled={items.length === 0}
          className="rounded-md bg-blue-600 text-white px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Simpan Resep
        </button>
        <button 
          onClick={() => router.back()} 
          className="rounded-md bg-gray-200 text-gray-700 px-6 py-2"
        >
          Batal
        </button>
      </div>

      <style jsx global>{`
        .input { @apply w-full px-3 py-2 border rounded-md; }
      `}</style>
    </div>
  );
}
