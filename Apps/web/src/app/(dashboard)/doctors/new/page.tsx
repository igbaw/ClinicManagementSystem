import Link from "next/link";

export default function NewDoctorPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/doctors" className="text-blue-600 hover:underline text-sm">
          ← Kembali ke Daftar Dokter
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Tambah Dokter Baru</h1>
        <p className="text-gray-600">Ikuti langkah-langkah berikut untuk menambahkan dokter</p>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              1
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Buka Supabase Dashboard
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Akses Supabase Dashboard project Anda
              </p>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Buka Supabase Dashboard →
              </a>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              2
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Buat User Authentication
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Navigasi ke: <code className="bg-gray-100 px-2 py-1 rounded text-xs">Authentication → Users</code>
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
                <li>Klik tombol "Add User"</li>
                <li>Masukkan email dokter (contoh: dr.sarah@klinik.com)</li>
                <li>Buat password yang aman</li>
                <li>Centang "Email Confirm" (jika tersedia)</li>
                <li>Klik "Create User"</li>
              </ol>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <strong>⚠️ Penting:</strong> Simpan user ID yang ditampilkan setelah user dibuat. Anda akan membutuhkannya di langkah berikutnya.
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              3
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Update User Profile di Database
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Navigasi ke: <code className="bg-gray-100 px-2 py-1 rounded text-xs">SQL Editor</code>
              </p>
              <p className="text-sm text-gray-700 mb-3">
                Jalankan SQL berikut, ganti nilai yang sesuai:
              </p>
              <div className="bg-gray-900 text-gray-100 rounded-md p-4 text-sm font-mono overflow-x-auto">
                <pre>{`-- Ganti nilai berikut dengan data dokter yang sebenarnya
UPDATE public.users
SET 
  role = 'doctor',
  full_name = 'Dr. Nama Lengkap',  -- Ganti dengan nama dokter
  phone = '08123456789',            -- Ganti dengan nomor telepon
  email = 'doctor@email.com',       -- Ganti dengan email yang sama di step 2
  is_active = true,
  updated_at = NOW()
WHERE id = 'USER-ID-DARI-STEP-2';   -- Ganti dengan User ID dari step 2

-- Jika record belum ada di tabel users, gunakan INSERT:
-- INSERT INTO public.users (
--   id, email, full_name, role, phone, is_active, created_at, updated_at
-- ) VALUES (
--   'USER-ID-DARI-STEP-2',
--   'doctor@email.com',
--   'Dr. Nama Lengkap',
--   'doctor',
--   '08123456789',
--   true,
--   NOW(),
--   NOW()
-- );`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
              ✓
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Verifikasi
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Setelah menjalankan SQL di atas:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                <li>Kembali ke halaman "Daftar Dokter" dan refresh halaman</li>
                <li>Dokter baru seharusnya muncul dalam daftar</li>
                <li>Dokter dapat login menggunakan email dan password yang dibuat di step 2</li>
                <li>Dokter akan muncul di dropdown saat membuat appointment</li>
              </ul>
              <div className="mt-4">
                <Link
                  href="/doctors"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Lihat Daftar Dokter
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="bg-gray-50 border rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            📋 Quick Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Field yang Diperlukan:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>role:</strong> 'doctor'</li>
                <li>• <strong>full_name:</strong> Nama lengkap dokter</li>
                <li>• <strong>email:</strong> Email login</li>
                <li>• <strong>phone:</strong> Nomor telepon</li>
                <li>• <strong>is_active:</strong> true</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Untuk Masa Depan (Opsional):</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Spesialisasi dokter</li>
                <li>• Nomor SIP (Surat Izin Praktik)</li>
                <li>• Jadwal praktik</li>
                <li>• Biaya konsultasi</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tips:</strong> Simpan template SQL di atas untuk digunakan kembali saat menambahkan dokter lain di masa depan. 
            Cukup ganti nilai-nilai yang relevan setiap kali ada dokter baru.
          </p>
        </div>
      </div>
    </div>
  );
}
