export default async function ReportsDailyRevenuePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Laporan Pendapatan Harian</h1>
      <form action="/reports/daily-revenue/view" method="GET" className="flex items-end gap-3">
        <div>
          <label className="block text-sm font-medium">Tanggal</label>
          <input type="date" name="date" className="input" required />
        </div>
        <button className="rounded-md bg-blue-600 text-white px-4 py-2">Lihat</button>
      </form>
    </div>
  );
}
