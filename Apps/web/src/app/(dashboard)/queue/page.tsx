import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function QueuePage() {
  const supabase = await createServerClient();
  
  // Get current user to filter by doctor
  const { data: { user } } = await supabase.auth.getUser();
  
  const today = new Date().toISOString().split('T')[0];
  
  // Get all queue entries for today (unified queue)
  const { data: queueEntries, error } = await supabase
    .from("queue_entries")
    .select(`
      id,
      queue_number,
      entry_type,
      status,
      check_in_time,
      chief_complaint,
      notes,
      patient:patients(
        id,
        medical_record_number,
        full_name,
        date_of_birth,
        phone
      ),
      doctor:users!queue_entries_doctor_id_fkey(
        full_name
      ),
      appointment:appointments(
        id,
        appointment_time,
        booking_code
      )
    `)
    .eq("queue_date", today)
    .in("status", ["waiting", "in_progress"])
    .order("queue_number", { ascending: true });

  // Debug info
  if (error) {
    console.error('Queue page error:', error);
  }

  function calculateAge(dob: string) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Antrian Pasien</h1>
          <p className="text-gray-600">
            Daftar pasien yang sudah check-in dan menunggu pemeriksaan
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Tanggal: {new Date(today).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/walk-in"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Check-in Walk-in
          </Link>
          <Link
            href="/queue"
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            🔄 Refresh
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading queue:</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {!queueEntries || queueEntries.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Tidak ada pasien dalam antrian
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Pasien yang sudah check-in akan muncul di sini
          </p>
          <div className="mt-6">
            <Link
              href="/appointments"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Lihat Jadwal Appointment
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {queueEntries.map((entry: any) => (
            <div
              key={entry.id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Queue Number Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xs font-medium">Antrian</div>
                        <div className="text-2xl font-bold">
                          {entry.queue_number}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {entry.patient?.full_name}
                      </h3>
                      {/* Entry Type Badge */}
                      {entry.entry_type === 'appointment' ? (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          📅 Janji Temu - {entry.appointment?.appointment_time?.slice(0, 5)}
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          🚶 Walk-in
                        </span>
                      )}
                      {/* Status Badge */}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        entry.status === 'waiting' ? 'bg-green-100 text-green-800' :
                        entry.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.status === 'waiting' ? '✅ Menunggu' :
                         entry.status === 'in_progress' ? '🔵 Sedang Diperiksa' :
                         'Selesai'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">No. RM:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {entry.patient?.medical_record_number}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Umur:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {calculateAge(entry.patient?.date_of_birth)} tahun
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Check-in:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(entry.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Dokter:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {entry.doctor?.full_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Telepon:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {entry.patient?.phone}
                        </span>
                      </div>
                    </div>

                    {/* Chief Complaint */}
                    {entry.chief_complaint && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                        <span className="font-medium text-blue-900">Keluhan: </span>
                        <span className="text-blue-800">{entry.chief_complaint}</span>
                      </div>
                    )}

                    {/* Notes */}
                    {entry.notes && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <span className="font-medium text-yellow-900">Catatan: </span>
                        <span className="text-yellow-800">{entry.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0 ml-4">
                  {entry.status === 'waiting' ? (
                    <Link
                      href={`/medical-records/new?queue=${entry.id}`}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                    >
                      Mulai Pemeriksaan
                    </Link>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-md font-medium">
                      Sedang Diperiksa
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {queueEntries && queueEntries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-blue-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-800">
                <strong>Total antrian aktif:</strong> {queueEntries.length} pasien
              </p>
              <div className="mt-1 flex gap-4 text-xs text-blue-700">
                <span>📅 Janji Temu: {queueEntries.filter((e: any) => e.entry_type === 'appointment').length}</span>
                <span>🚶 Walk-in: {queueEntries.filter((e: any) => e.entry_type === 'walk-in').length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
