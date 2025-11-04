import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Fetch prescription with all related data
  const { data: prescription, error } = await supabase
    .from("prescriptions")
    .select(`
      id,
      created_at,
      status,
      notes,
      patient:patients(
        full_name,
        medical_record_number,
        date_of_birth,
        phone,
        address
      ),
      doctor:users!prescriptions_doctor_id_fkey(
        full_name
      ),
      prescription_items(
        id,
        dosage,
        frequency,
        timing,
        duration,
        quantity,
        instructions,
        medication:medications(
          name,
          generic_name,
          unit
        )
      ),
      medical_record:medical_records(
        visit_date,
        diagnosis_icd10
      )
    `)
    .eq("id", id)
    .single();

  if (error || !prescription) {
    return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
  }

  // Generate HTML for PDF
  const html = generatePrescriptionHTML(prescription);

  // Return HTML that can be printed
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function generatePrescriptionHTML(prescription: any): string {
  const patient = prescription.patient;
  const doctor = prescription.doctor;
  const items = prescription.prescription_items;
  const medicalRecord = prescription.medical_record;

  const today = new Date(prescription.created_at).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const patientAge = patient?.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : "-";

  // Extract diagnoses
  const diagnoses = medicalRecord?.diagnosis_icd10 || [];
  const diagnosisText = diagnoses
    .map((d: any) => `${d.code} - ${d.name_id}`)
    .join(", ");

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resep - ${patient?.full_name || "Pasien"}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none;
      }
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      margin: 0;
      color: #2563eb;
      font-size: 24px;
      font-weight: bold;
    }
    
    .header p {
      margin: 5px 0;
      font-size: 14px;
      color: #666;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 8px;
      margin-bottom: 20px;
    }
    
    .info-label {
      font-weight: 600;
      color: #666;
    }
    
    .info-value {
      color: #333;
    }
    
    .prescription-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .medication-name {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .medication-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .detail-row {
      display: flex;
      gap: 8px;
    }
    
    .detail-label {
      font-weight: 600;
      color: #666;
      min-width: 80px;
    }
    
    .detail-value {
      color: #333;
    }
    
    .instructions {
      background: white;
      border-left: 3px solid #2563eb;
      padding: 10px;
      margin-top: 10px;
      font-size: 14px;
      font-style: italic;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    
    .signature-box {
      float: right;
      text-align: center;
      width: 250px;
    }
    
    .signature-line {
      margin-top: 60px;
      border-top: 1px solid #333;
      padding-top: 5px;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .print-button:hover {
      background: #1d4ed8;
    }
    
    .notes-box {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Cetak Resep</button>
  
  <div class="header">
    <h1>KLINIK ENT</h1>
    <p>Jl. Contoh No. 123, Jakarta</p>
    <p>Telp: (021) 1234-5678 | Email: klinik@example.com</p>
  </div>
  
  <div class="section">
    <div class="section-title">RESEP OBAT</div>
    <div class="info-grid">
      <div class="info-label">Tanggal:</div>
      <div class="info-value">${today}</div>
      
      <div class="info-label">Nama Pasien:</div>
      <div class="info-value">${patient?.full_name || "-"}</div>
      
      <div class="info-label">No. Rekam Medis:</div>
      <div class="info-value">${patient?.medical_record_number || "-"}</div>
      
      <div class="info-label">Umur:</div>
      <div class="info-value">${patientAge} tahun</div>
      
      <div class="info-label">Alamat:</div>
      <div class="info-value">${patient?.address || "-"}</div>
      
      ${
        diagnosisText
          ? `
      <div class="info-label">Diagnosis:</div>
      <div class="info-value">${diagnosisText}</div>
      `
          : ""
      }
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">R/ (OBAT YANG DIRESEPKAN)</div>
    ${items
      .map(
        (item: any, index: number) => `
      <div class="prescription-item">
        <div class="medication-name">
          ${index + 1}. ${item.medication?.name || "-"} 
          ${item.medication?.generic_name ? `<span style="color: #666; font-size: 14px;">(${item.medication.generic_name})</span>` : ""}
        </div>
        
        <div class="medication-details">
          <div class="detail-row">
            <span class="detail-label">Dosis:</span>
            <span class="detail-value">${item.dosage || "-"}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Frekuensi:</span>
            <span class="detail-value">${item.frequency || "-"}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Waktu:</span>
            <span class="detail-value">${item.timing || "-"}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Durasi:</span>
            <span class="detail-value">${item.duration || "-"}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Jumlah:</span>
            <span class="detail-value">${item.quantity} ${item.medication?.unit || "unit"}</span>
          </div>
        </div>
        
        ${
          item.instructions
            ? `
        <div class="instructions">
          📝 ${item.instructions}
        </div>
        `
            : ""
        }
      </div>
    `
      )
      .join("")}
  </div>
  
  ${
    prescription.notes
      ? `
  <div class="notes-box">
    <strong>Catatan Dokter:</strong><br>
    ${prescription.notes}
  </div>
  `
      : ""
  }
  
  <div class="footer">
    <div class="signature-box">
      <p>${today}</p>
      <p style="margin-top: 10px; font-weight: 600;">Dokter Pemeriksa</p>
      <div class="signature-line">
        ${doctor?.full_name || "-"}
      </div>
    </div>
  </div>
  
  <script>
    // Auto-open print dialog on page load (optional)
    // window.onload = () => window.print();
  </script>
</body>
</html>
  `;
}
