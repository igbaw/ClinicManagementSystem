"use client";

import { useState } from "react";
import ICD10Search, { ICD10Code } from "@/components/medical-records/ICD10Search";

type MRSubmit = {
  chiefComplaint: string;
  anamnesis: string;
  physicalExamination: { text: string };
  diagnosisICD10: Array<{ code: string; nameIndonesian: string; nameEnglish: string; isPrimary: boolean }>;
  treatmentPlan: string;
  patientId: string;
  appointmentId?: string;
};

export default function MedicalRecordForm({ onSubmit, defaultValues }: {
  onSubmit: (data: MRSubmit) => Promise<void>;
  defaultValues: { patientId: string; appointmentId?: string };
}) {
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [physical, setPhysical] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [diagnoses, setDiagnoses] = useState<ICD10Code[]>([]);

  function addDx(code: ICD10Code) {
    if (diagnoses.find((d) => d.code === code.code)) return;
    setDiagnoses((prev) => [...prev, code]);
  }
  function removeDx(code: string) {
    setDiagnoses((prev) => prev.filter((d) => d.code !== code));
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({
          chiefComplaint,
          anamnesis,
          physicalExamination: { text: physical },
          diagnosisICD10: diagnoses.map((d, idx) => ({
            code: d.code,
            nameIndonesian: d.name_id,
            nameEnglish: d.name_en,
            isPrimary: idx === 0,
          })),
          treatmentPlan,
          patientId: defaultValues.patientId,
          appointmentId: defaultValues.appointmentId,
        });
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Keluhan Utama *</label>
          <input className="input" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Anamnesis *</label>
          <textarea className="input" rows={4} value={anamnesis} onChange={(e) => setAnamnesis(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Pemeriksaan Fisik *</label>
        <textarea className="input" rows={6} value={physical} onChange={(e) => setPhysical(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium">Diagnosis (ICD-10) *</label>
        <ICD10Search onSelect={addDx} selectedCodes={diagnoses.map((d) => d.code)} />
        {diagnoses.length > 0 && (
          <div className="mt-3 space-y-2">
            {diagnoses.map((d, idx) => (
              <div key={d.code} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <div>
                  <span className="font-medium">{d.code}</span> - {d.name_id}
                  {idx === 0 && <span className="ml-2 text-xs bg-blue-200 px-2 py-0.5 rounded">Primer</span>}
                </div>
                <button type="button" className="text-sm" onClick={() => removeDx(d.code)}>Hapus</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Rencana Tindakan *</label>
        <textarea className="input" rows={4} value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} />
      </div>

      <div className="flex justify-end gap-4">
        <button type="submit" className="rounded-md bg-blue-600 text-white px-4 py-2">Simpan</button>
      </div>

      <style jsx global>{`
        .input { @apply w-full px-3 py-2 border rounded-md; }
      `}</style>
    </form>
  );
}
