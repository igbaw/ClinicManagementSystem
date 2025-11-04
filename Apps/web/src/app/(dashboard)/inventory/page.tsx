export default function InventoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inventori</h1>
      <ul className="list-disc pl-5 text-blue-700">
        <li><a href="/inventory/medications">Master Obat</a></li>
        <li><a href="/inventory/adjustments">Penyesuaian Stok</a></li>
      </ul>
    </div>
  );
}
