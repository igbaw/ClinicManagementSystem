import { createServerClient } from "@/lib/supabase/server";

export default async function ReportsDailyRevenueViewPage({ searchParams }: { searchParams?: { date?: string } }) {
  const date = searchParams?.date || new Date().toISOString().slice(0,10);
  const supabase = await createServerClient();

  const { data: bills } = await supabase
    .from('billings')
    .select('id, total_amount, payment_status, billing_date')
    .gte('billing_date', `${date} 00:00:00`)
    .lte('billing_date', `${date} 23:59:59`)
    .eq('payment_status', 'paid');

  const total = (bills || []).reduce((s, b) => s + Number(b.total_amount || 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Pendapatan Harian</h1>
      <div>Tanggal: {date}</div>
      <div className="text-xl font-bold">Total: Rp {total.toLocaleString('id-ID')}</div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border">Bill ID</th>
            <th className="text-left p-2 border">Jumlah</th>
            <th className="text-left p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {(bills || []).map((b) => (
            <tr key={b.id} className="border-b">
              <td className="p-2 border">{b.id}</td>
              <td className="p-2 border">Rp {Number(b.total_amount || 0).toLocaleString('id-ID')}</td>
              <td className="p-2 border">{b.payment_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
