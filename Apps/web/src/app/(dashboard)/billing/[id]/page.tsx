"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  created_at: string;
  patient: {
    full_name: string;
    medical_record_number: string;
    bpjs_number: string | null;
    phone: string;
    address: string;
  } | null;
  doctor: { full_name: string } | null;
  medical_record: {
    visit_date: string;
    diagnosis_icd10: string;
  } | null;
  billing_items: Array<{
    id: string;
    item_type: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  payments: Array<{
    id: string;
    payment_method: string;
    amount: number;
    reference_number: string | null;
    notes: string | null;
    payment_date: string;
    status: string;
  }>;
};

export default function BillingDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const billingId = params.id as string;

  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("payment_success") === "true") {
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 5000);
    }
  }, [searchParams]);

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
        created_at,
        patient:patients(
          full_name,
          medical_record_number,
          bpjs_number,
          phone,
          address
        ),
        doctor:users(
          full_name
        ),
        medical_record:medical_records(
          visit_date,
          diagnosis_icd10
        ),
        billing_items(
          id,
          item_type,
          description,
          quantity,
          unit_price,
          total_price
        ),
        payments(
          id,
          payment_method,
          amount,
          reference_number,
          notes,
          payment_date,
          status
        )
      `)
      .eq("id", billingId)
      .single();

    if (error) {
      console.error("Error fetching billing:", error);
      router.push("/billing");
      return;
    }

    setBilling(data as unknown as Billing);
    setLoading(false);
  }, [supabase, billingId, router]);

  useEffect(() => {
    void fetchBilling();
  }, [fetchBilling]);

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
            ⏳ Pending
          </span>
        );
      case "partial":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            🔵 Sebagian
          </span>
        );
      case "paid":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
            ✅ Lunas
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
            ❌ Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
            {status}
          </span>
        );
    }
  }

  function getPaymentMethodBadge(method: string | null) {
    if (!method) return <span className="text-sm text-gray-500">-</span>;
    
    const methodMap: { [key: string]: { text: string; color: string } } = {
      cash: { text: "Tunai", color: "bg-gray-100 text-gray-800" },
      qris: { text: "QRIS", color: "bg-blue-100 text-blue-800" },
      transfer: { text: "Transfer", color: "bg-green-100 text-green-800" },
      debit_card: { text: "Kartu Debit", color: "bg-purple-100 text-purple-800" },
      credit_card: { text: "Kartu Kredit", color: "bg-purple-100 text-purple-800" },
      e_wallet: { text: "E-Wallet", color: "bg-orange-100 text-orange-800" },
      bpjs: { text: "BPJS", color: "bg-indigo-100 text-indigo-800" },
    };

    const methodInfo = methodMap[method] || { text: method, color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${methodInfo.color}`}>
        {methodInfo.text}
      </span>
    );
  }

  const getTotalPaid = () => {
    if (!billing) return 0;
    return billing.payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getRemainingBalance = () => {
    if (!billing) return 0;
    return Math.max(0, billing.total_amount - getTotalPaid());
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

  const totalPaid = getTotalPaid();
  const remainingBalance = getRemainingBalance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/billing"
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
          >
            ← Kembali ke Daftar Tagihan
          </Link>
          <h1 className="text-2xl font-semibold">Detail Tagihan</h1>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(billing.payment_status)}
          <Link
            href={`/api/billings/${billing.id}/invoice`}
            target="_blank"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            📄 Cetak Invoice
          </Link>
        </div>
      </div>

      {showPaymentSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Pembayaran berhasil diproses!
        </div>
      )}

      {/* Patient and Billing Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Informasi Pasien</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Nama:</span>{" "}
              {billing.patient?.full_name || "-"}
            </p>
            <p className="text-sm">
              <span className="font-medium">No. RM:</span>{" "}
              {billing.patient?.medical_record_number || "-"}
            </p>
            {billing.patient?.bpjs_number && (
              <p className="text-sm">
                <span className="font-medium">No. BPJS:</span>{" "}
                {billing.patient.bpjs_number}
              </p>
            )}
            <p className="text-sm">
              <span className="font-medium">Telepon:</span>{" "}
              {billing.patient?.phone || "-"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Alamat:</span>{" "}
              {billing.patient?.address || "-"}
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Informasi Tagihan</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">No. Tagihan:</span> {billing.id}
            </p>
            <p className="text-sm">
              <span className="font-medium">Tanggal Tagihan:</span>{" "}
              {new Date(billing.billing_date).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-sm">
              <span className="font-medium">Tanggal Kunjungan:</span>{" "}
              {billing.medical_record?.visit_date
                ? new Date(billing.medical_record.visit_date).toLocaleDateString(
                    "id-ID",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )
                : "-"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Diagnosis:</span>{" "}
              {billing.medical_record?.diagnosis_icd10 || "-"}
            </p>
            {billing.bpjs_claim_number && (
              <p className="text-sm">
                <span className="font-medium">No. Klaim BPJS:</span>{" "}
                {billing.bpjs_claim_number}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Billing Items */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold text-lg mb-3">Rincian Tagihan</h2>
        <div className="space-y-3">
          {billing.billing_items.map((item, idx) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-gray-600">
                  {item.quantity} × Rp {item.unit_price.toLocaleString("id-ID")}
                </p>
              </div>
              <p className="font-medium">
                Rp {item.total_price.toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t pt-3 mt-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {billing.subtotal.toLocaleString("id-ID")}</span>
            </div>
            {billing.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon:</span>
                <span>-Rp {billing.discount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Pajak (0%):</span>
              <span>Rp {billing.tax.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total Tagihan:</span>
              <span>Rp {billing.total_amount.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {billing.payments.length > 0 && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Riwayat Pembayaran</h2>
          <div className="space-y-3">
            {billing.payments.map((payment) => (
              <div key={payment.id} className="border-b pb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getPaymentMethodBadge(payment.payment_method)}
                      <span className="text-sm text-gray-600">
                        {new Date(payment.payment_date).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="font-medium">
                      Rp {payment.amount.toLocaleString("id-ID")}
                    </p>
                    {payment.reference_number && (
                      <p className="text-sm text-gray-600">
                        Ref: {payment.reference_number}
                      </p>
                    )}
                    {payment.notes && (
                      <p className="text-sm text-gray-600">{payment.notes}</p>
                    )}
                  </div>
                  {payment.status === "completed" && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Selesai
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Payment Summary */}
          <div className="border-t pt-3 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Dibayar:</span>
                <span className="font-medium">
                  Rp {totalPaid.toLocaleString("id-ID")}
                </span>
              </div>
              {remainingBalance > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Sisa Pembayaran:</span>
                  <span className="font-medium">
                    Rp {remainingBalance.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {billing.notes && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Catatan</h2>
          <p className="text-sm text-gray-700">{billing.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {billing.payment_status === "pending" && (
          <Link
            href={`/billing/${billing.id}/payment`}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
          >
            Proses Pembayaran
          </Link>
        )}
        {billing.payment_status === "partial" && remainingBalance > 0 && (
          <Link
            href={`/billing/${billing.id}/payment`}
            className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700"
          >
            Lanjut Pembayaran
          </Link>
        )}
        <Link
          href="/billing"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
        >
          Kembali
        </Link>
      </div>
    </div>
  );
}
