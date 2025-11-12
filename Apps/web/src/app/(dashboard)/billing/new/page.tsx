"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

type MedicalRecord = {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  visit_date: string;
  diagnosis_icd10: string;
  patient: {
    full_name: string;
    medical_record_number: string;
    bpjs_number: string | null;
  } | null;
  prescriptions: Array<{
    id: string;
    prescription_items: Array<{
      medication_id: string;
      quantity: number;
      price: number;
      medication: {
        name: string;
        unit: string;
      } | null;
    }>;
  }>;
};

type BillingItem = {
  item_type: 'consultation' | 'procedure' | 'medication' | 'lab_test';
  item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  bpjs_price?: number;
};

export default function NewBillingPage() {
  const supabase = useMemo(() => createClient(), []);
  const sp = useSearchParams();
  const router = useRouter();

  const [medicalRecordId, setMedicalRecordId] = useState<string>(sp.get('mrId') || "");
  const [useBPJS, setUseBPJS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");

  const searchMedicalRecord = useCallback(async () => {
    if (!medicalRecordId.trim()) {
      setMedicalRecord(null);
      setBillingItems([]);
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        id,
        patient_id,
        appointment_id,
        visit_date,
        diagnosis_icd10,
        patient:patients(full_name, medical_record_number, bpjs_number),
        prescriptions(
          id,
          prescription_items(
            medication_id,
            quantity,
            price,
            medication:medications(name, unit)
          )
        )
      `)
      .eq('id', medicalRecordId)
      .single();

    if (error) {
      console.error("Error fetching medical record:", error.message || error);
      alert(`Gagal memuat rekam medis: ${error.message || 'Rekam medis tidak ditemukan'}`);
      setMedicalRecord(null);
    } else {
      setMedicalRecord(data as unknown as MedicalRecord);
      // Auto-detect BPJS usage - patient is an object, not array
      const patientData = Array.isArray(data.patient) ? data.patient[0] : data.patient;
      setUseBPJS(!!patientData?.bpjs_number);
      await generateBillingItems(data as unknown as MedicalRecord);
    }
    setSearching(false);
  }, [medicalRecordId, supabase]);

  const generateBillingItems = async (mr: MedicalRecord) => {
    const items: BillingItem[] = [];

    // Add consultation service
    const { data: consultService } = await supabase
      .from('services')
      .select('id, name, price, bpjs_price')
      .eq('code', 'CONS_THT')
      .single();

    if (consultService) {
      const unitPrice = useBPJS && consultService.bpjs_price ? 
        Number(consultService.bpjs_price) : Number(consultService.price);
      
      items.push({
        item_type: 'consultation',
        item_id: consultService.id,
        description: consultService.name,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice,
        bpjs_price: consultService.bpjs_price ? Number(consultService.bpjs_price) : undefined
      });
    }

    // Add prescription medications
    if (mr.prescriptions.length > 0) {
      for (const prescription of mr.prescriptions) {
        for (const item of prescription.prescription_items) {
          const medication = item.medication;
          if (medication) {
            const totalPrice = Number(item.price || 0) * Number(item.quantity || 0);
            items.push({
              item_type: 'medication',
              item_id: item.medication_id,
              description: `${medication.name} (${item.quantity} ${medication.unit})`,
              quantity: item.quantity,
              unit_price: Number(item.price || 0),
              total_price: totalPrice
            });
          }
        }
      }
    }

    setBillingItems(items);
  };

  useEffect(() => {
    if (medicalRecord) {
      void generateBillingItems(medicalRecord);
    }
  }, [useBPJS, medicalRecord]);

  const calculateTotals = () => {
    const subtotal = billingItems.reduce((sum, item) => sum + item.total_price, 0);
    const tax = 0; // 0% for healthcare in Indonesia
    const totalAmount = subtotal - discount + tax;
    return { subtotal, tax, totalAmount };
  };

  const { subtotal, tax, totalAmount } = calculateTotals();

  async function saveBill() {
    if (!medicalRecord || billingItems.length === 0) return;

    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const createdBy = userRes?.user?.id;

    // Get doctor_id from medical record
    const { data: mrData } = await supabase
      .from('medical_records')
      .select('doctor_id')
      .eq('id', medicalRecord.id)
      .single();

    const { data: bill, error } = await supabase
      .from('billings')
      .insert({
        patient_id: medicalRecord.patient_id,
        appointment_id: medicalRecord.appointment_id,
        medical_record_id: medicalRecord.id,
        doctor_id: mrData?.doctor_id || createdBy, // Use medical record's doctor or fallback to current user
        subtotal,
        discount,
        tax,
        total_amount: totalAmount,
        payment_status: 'pending',
        bpjs_claim_number: useBPJS ? `AUTO-${Date.now()}` : null,
        notes: notes || null,
        created_by: createdBy,
      })
      .select('id')
      .single();

    if (!error && bill?.id) {
      const payload = billingItems.map(item => ({
        ...item,
        billing_id: bill.id
      }));
      await supabase.from('billing_items').insert(payload);
      router.push(`/billing?success=true`);
    } else {
      console.error("Error creating bill:", error);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Buat Tagihan Baru</h1>

      {/* Medical Record Search */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold text-lg mb-3">Cari Rekam Medis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID Rekam Medis</label>
            <input 
              className="input" 
              value={medicalRecordId} 
              onChange={(e) => setMedicalRecordId(e.target.value)} 
              placeholder="Masukkan ID rekam medis" 
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={searchMedicalRecord}
              disabled={searching || !medicalRecordId.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? 'Mencari...' : 'Cari'}
            </button>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      {medicalRecord && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Informasi Pasien</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nama Pasien</p>
              <p className="font-medium">{medicalRecord.patient?.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">No. RM</p>
              <p className="font-medium">{medicalRecord.patient?.medical_record_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">No. BPJS</p>
              <p className="font-medium">{medicalRecord.patient?.bpjs_number || 'Non-BPJS'}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={useBPJS} 
                onChange={(e) => setUseBPJS(e.target.checked)}
                disabled={!medicalRecord.patient?.bpjs_number}
              />
              <span>Gunakan Tarif BPJS</span>
            </label>
            {!medicalRecord.patient?.bpjs_number && (
              <p className="text-xs text-amber-600 mt-1">
                Pasien tidak memiliki nomor BPJS
              </p>
            )}
          </div>
        </div>
      )}

      {/* Billing Items */}
      {billingItems.length > 0 && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Rincian Tagihan</h2>
          <div className="space-y-2">
            {billingItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} × Rp {item.unit_price.toLocaleString("id-ID")}
                    {item.bpjs_price && useBPJS && (
                      <span className="text-blue-600 ml-2">
                        (BPJS: Rp {item.bpjs_price.toLocaleString("id-ID")})
                      </span>
                    )}
                  </p>
                </div>
                <p className="font-medium">
                  Rp {item.total_price.toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discount and Notes */}
      {billingItems.length > 0 && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Diskon & Catatan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Diskon (Rp)</label>
              <input 
                type="number"
                className="input" 
                value={discount} 
                onChange={(e) => setDiscount(Number(e.target.value))}
                min={0}
                max={subtotal}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catatan</label>
              <input 
                className="input" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Total */}
      {billingItems.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon:</span>
                <span>-Rp {discount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Pajak (0%):</span>
              <span>Rp {tax.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button 
          onClick={saveBill} 
          disabled={loading || billingItems.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Menyimpan...' : 'Simpan Tagihan'}
        </button>
        <button 
          onClick={() => router.back()} 
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md"
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
