"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Billing = {
  id: string;
  billing_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_status: string;
  payment_method: string | null;
  bpjs_claim_number: string | null;
  notes: string | null;
  patient: {
    full_name: string;
    medical_record_number: string;
    bpjs_number: string | null;
  } | null;
  billing_items: Array<{
    item_type: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
};

export default function PaymentPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useParams();
  const billingId = params.id as string;

  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("cash");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const paymentMethods = [
    { value: "cash", label: "Tunai", icon: "💵", needsReference: false },
    { value: "qris", label: "QRIS", icon: "📱", needsReference: true },
    { value: "transfer", label: "Transfer Bank", icon: "🏦", needsReference: true },
    { value: "debit_card", label: "Kartu Debit", icon: "💳", needsReference: true },
    { value: "credit_card", label: "Kartu Kredit", icon: "💳", needsReference: true },
    { value: "e_wallet", label: "E-Wallet", icon: "📱", needsReference: true },
    { value: "bpjs", label: "BPJS", icon: "🏥", needsReference: false },
  ];

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("billings")
      .select(`
        id,
        billing_date,
        subtotal,
        discount,
        tax,
        total_amount,
        payment_status,
        payment_method,
        bpjs_claim_number,
        notes,
        patient:patients(full_name, medical_record_number, bpjs_number),
        billing_items(item_type, description, quantity, unit_price, total_price)
      `)
      .eq("id", billingId)
      .single();

    if (error) {
      console.error("Error fetching billing:", error);
      router.push("/billing");
      return;
    }

    setBilling(data as unknown as Billing);
    setPaymentAmount(data.total_amount);
    
    // Auto-select BPJS if patient has BPJS and billing has BPJS claim number
    if (data.patient?.[0]?.bpjs_number && data.bpjs_claim_number) {
      setSelectedMethod("bpjs");
    }
    
    setLoading(false);
  }, [supabase, billingId, router]);

  useEffect(() => {
    void fetchBilling();
  }, [fetchBilling]);

  const processPayment = async () => {
    if (!billing || paymentAmount <= 0) return;

    setProcessing(true);

    try {
      // Create payment record
      const { data: userRes } = await supabase.auth.getUser();
      const createdBy = userRes?.user?.id;

      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          billing_id: billing.id,
          payment_method: selectedMethod,
          amount: paymentAmount,
          reference_number: referenceNumber || null,
          notes: paymentNotes || null,
          payment_date: new Date().toISOString(),
          status: "completed",
          created_by: createdBy,
        });

      if (paymentError) {
        throw paymentError;
      }

      // Update billing payment status
      let newPaymentStatus = "paid";
      if (paymentAmount < billing.total_amount) {
        newPaymentStatus = "partial";
      }

      const { error: updateError } = await supabase
        .from("billings")
        .update({
          payment_status: newPaymentStatus,
          payment_method: selectedMethod,
        })
        .eq("id", billing.id);

      if (updateError) {
        throw updateError;
      }

      // Redirect to billing detail with success
      router.push(`/billing/${billing.id}?payment_success=true`);
    } catch (error) {
      console.error("Payment processing error:", error);
      alert("Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.");
    } finally {
      setProcessing(false);
    }
  };

  const getRemainingBalance = () => {
    if (!billing) return 0;
    return Math.max(0, billing.total_amount - paymentAmount);
  };

  const isOverPayment = () => {
    if (!billing) return false;
    return paymentAmount > billing.total_amount;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-gray-500">Memuat data tagihan...</div>
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Tagihan tidak ditemukan</p>
        <Link href="/billing" className="text-blue-600 hover:text-blue-800 underline">
          Kembali ke daftar tagihan
        </Link>
      </div>
    );
  }

  if (billing.payment_status === "paid") {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Tagihan Sudah Lunas</h2>
        <p className="text-gray-600 mb-4">
          Tagihan ini telah dibayar dengan metode {billing.payment_method}
        </p>
        <Link
          href={`/billing/${billing.id}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          Lihat Detail
        </Link>
      </div>
    );
  }

  const selectedMethodInfo = paymentMethods.find(m => m.value === selectedMethod);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link
            href={`/billing/${billing.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
          >
            ← Kembali ke Detail Tagihan
          </Link>
          <h1 className="text-2xl font-semibold">Proses Pembayaran</h1>
        </div>
      </div>

      {/* Billing Summary */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h2 className="font-semibold text-lg mb-3">Ringkasan Tagihan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Pasien</p>
            <p className="font-medium">{billing.patient?.full_name}</p>
            <p className="text-sm text-gray-600">No. RM: {billing.patient?.medical_record_number}</p>
            {billing.patient?.bpjs_number && (
              <p className="text-sm text-gray-600">BPJS: {billing.patient.bpjs_number}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Tagihan</p>
            <p className="text-2xl font-bold">
              Rp {billing.total_amount.toLocaleString("id-ID")}
            </p>
            {billing.payment_status === "partial" && (
              <p className="text-sm text-orange-600">
                Pembayaran Sebagian
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold text-lg mb-3">Metode Pembayaran</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {paymentMethods.map((method) => (
            <button
              key={method.value}
              onClick={() => setSelectedMethod(method.value)}
              className={`p-3 border rounded-lg text-left transition-colors ${
                selectedMethod === method.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{method.icon}</span>
                <div>
                  <p className="font-medium">{method.label}</p>
                  {method.value === "bpjs" && !billing.patient?.bpjs_number && (
                    <p className="text-xs text-red-600">Pasien non-BPJS</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Details */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold text-lg mb-3">Detail Pembayaran</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Jumlah Pembayaran (Rp)
            </label>
            <input
              type="number"
              className="input"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              min={0}
              max={billing.total_amount * 1.1} // Allow 10% overpayment
            />
            {isOverPayment() && (
              <p className="text-sm text-amber-600 mt-1">
                ⚠️ Jumlah pembayaran melebihi total tagihan
              </p>
            )}
            {getRemainingBalance() > 0 && paymentAmount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Sisa pembayaran: Rp {getRemainingBalance().toLocaleString("id-ID")}
              </p>
            )}
          </div>

          {selectedMethodInfo?.needsReference && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Nomor Referensi
              </label>
              <input
                type="text"
                className="input"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Masukkan nomor referensi transaksi"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Catatan Pembayaran (Opsional)
            </label>
            <textarea
              className="input"
              rows={3}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Catatan tambahan untuk pembayaran ini..."
            />
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h3 className="font-semibold mb-2">Konfirmasi Pembayaran</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Metode:</span>
            <span className="font-medium">
              {selectedMethodInfo?.icon} {selectedMethodInfo?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Jumlah:</span>
            <span className="font-medium">
              Rp {paymentAmount.toLocaleString("id-ID")}
            </span>
          </div>
          {selectedMethodInfo?.needsReference && referenceNumber && (
            <div className="flex justify-between">
              <span>Referensi:</span>
              <span className="font-medium">{referenceNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={processPayment}
          disabled={processing || paymentAmount <= 0 || isOverPayment()}
          className="px-6 py-2 bg-green-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? "Memproses..." : "Proses Pembayaran"}
        </button>
        <Link
          href={`/billing/${billing.id}`}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md"
        >
          Batal
        </Link>
      </div>

      <style jsx global>{`
        .input {
          @apply w-full px-3 py-2 border rounded-md;
        }
      `}</style>
    </div>
  );
}
