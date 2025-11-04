import Link from "next/link";

export default async function PatientSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ mrNumber?: string; patientId?: string }>;
}) {
  const params = await searchParams;
  const mrNumber = params.mrNumber || "";
  const patientId = params.patientId || "";

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-white border rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registrasi Berhasil!
          </h1>
          <p className="text-gray-600">
            Pasien telah berhasil didaftarkan ke sistem
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-600 mb-2">Nomor Rekam Medis</p>
          <p className="text-4xl font-bold text-blue-600">{mrNumber}</p>
          <p className="text-sm text-gray-500 mt-2">
            Simpan nomor ini untuk referensi kunjungan selanjutnya
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/appointments/new?patient=${patientId}`}
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              📅 Jadwalkan Janji Temu
            </Link>
            <Link
              href={`/medical-records/new?patient=${patientId}&walkin=true`}
              className="block w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              🚶 Walk-in Kunjungan
            </Link>
            <Link
              href={`/patients/${patientId}`}
              className="block w-full px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
            >
              👤 Lihat Detail Pasien
            </Link>
          </div>
          
          <div className="pt-4">
            <Link
              href="/patients"
              className="text-blue-600 hover:underline"
            >
              ← Kembali ke Daftar Pasien
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
