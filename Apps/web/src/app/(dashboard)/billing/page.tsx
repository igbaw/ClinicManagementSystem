"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  medical_record: {
    visit_date: string;
    diagnosis_icd10: string;
  } | null;
  billing_items: Array<{
    item_type: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
};

export default function BillingPage() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [searchParams]);

  const fetchBillings = useCallback(async () => {
    setLoading(true);
    let query = supabase
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
        medical_record:medical_records(visit_date, diagnosis_icd10),
        billing_items(item_type, description, quantity, unit_price, total_price)
      `)
      .order("billing_date", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("payment_status", statusFilter);
    }

    const { data } = await query;
    setBillings((data as unknown as Billing[]) || []);
    setLoading(false);
  }, [supabase, statusFilter]);

  useEffect(() => {
    void fetchBillings();
  }, [fetchBillings]);

  const filteredBillings = billings.filter((bill) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bill.patient?.full_name.toLowerCase().includes(query) ||
      bill.patient?.medical_record_number.toLowerCase().includes(query) ||
      bill.bpjs_claim_number?.toLowerCase().includes(query)
    );
  });

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Tagihan</h1>
        <Link
          href="/billing/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          + Buat Tagihan Baru
        </Link>
      </div>

      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Tagihan berhasil disimpan!
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari nama, MR, atau nomor klaim BPJS..."
            className="input w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Sebagian</option>
            <option value="paid">Lunas</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat...</div>
      ) : filteredBillings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada tagihan ditemukan
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBillings.map((billing) => (
            <div
              key={billing.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {billing.patient?.full_name || "Unknown Patient"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    MR: {billing.patient?.medical_record_number || "-"}
                  </p>
                  {billing.patient?.bpjs_number && (
                    <p className="text-sm text-gray-600">
                      BPJS: {billing.patient.bpjs_number}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(billing.billing_date).toLocaleDateString(
                      "id-ID",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(billing.payment_status)}
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      Rp {billing.total_amount.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getPaymentMethodBadge(billing.payment_method)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing Items Preview */}
              <div className="border-t pt-3 mt-3">
                <p className="text-sm font-medium mb-2">
                  Rincian ({billing.billing_items.length} item):
                </p>
                <div className="space-y-1">
                  {billing.billing_items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity}x {item.description}
                      </span>
                      <span className="text-gray-600">
                        Rp {item.total_price.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                  {billing.billing_items.length > 3 && (
                    <p className="text-sm text-gray-500 italic">
                      +{billing.billing_items.length - 3} item lainnya
                    </p>
                  )}
                </div>
              </div>

              {/* BPJS Claim Number */}
              {billing.bpjs_claim_number && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">No. Klaim BPJS:</span>{" "}
                    {billing.bpjs_claim_number}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/billing/${billing.id}`}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                >
                  Lihat Detail
                </Link>
                {billing.payment_status === "pending" && (
                  <Link
                    href={`/billing/${billing.id}/payment`}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    Proses Pembayaran
                  </Link>
                )}
                <Link
                  href={`/api/billings/${billing.id}/invoice`}
                  target="_blank"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  📄 Cetak Invoice
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .input {
          @apply px-3 py-2 border rounded-md;
        }
      `}</style>
    </div>
  );
}
