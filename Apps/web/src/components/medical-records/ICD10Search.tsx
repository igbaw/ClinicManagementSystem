"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

export type ICD10Code = {
  code: string;
  name_id: string;
  name_en: string;
};

export default function ICD10Search({ onSelect, selectedCodes }: {
  onSelect: (code: ICD10Code) => void;
  selectedCodes: string[];
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ICD10Code[]>([]);
  const debounced = useDebounce(q, 300);

  useEffect(() => {
    if (debounced.trim().length < 2) { 
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]); 
      return; 
    }
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('icd10_codes')
        .select('code,name_id,name_en')
        .or(`code.ilike.%${debounced}%,name_id.ilike.%${debounced}%,name_en.ilike.%${debounced}%`)
        .eq('is_active', true)
        .limit(10);
      setResults(data || []);
    })();
  }, [debounced]);

  return (
    <div className="relative">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kode/nama ICD-10" className="w-full px-3 py-2 border rounded-md" />
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
          {results.map((c) => {
            const disabled = selectedCodes.includes(c.code);
            return (
              <button key={c.code} disabled={disabled} onClick={() => onSelect(c)} className={`w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="font-medium text-sm">{c.code} - {c.name_id}</div>
                <div className="text-xs text-gray-500">{c.name_en}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
