-- Seed a minimal set of ICD-10 ENT-related codes
INSERT INTO icd10_codes (code, name_en, name_id, category, is_active)
VALUES
  ('H66.9', 'Otitis media, unspecified', 'Otitis media, tidak spesifik', 'Ear', true),
  ('J30.1', 'Allergic rhinitis due to pollen', 'Rinitis alergi akibat serbuk sari', 'Nose', true),
  ('J02.9', 'Acute pharyngitis, unspecified', 'Faringitis akut, tidak spesifik', 'Throat', true)
ON CONFLICT (code) DO NOTHING;

-- Seed a consultation service
INSERT INTO services (code, name, category, price, bpjs_price, is_active)
VALUES ('CONS_THT', 'Konsultasi Spesialis THT', 'consultation', 150000, 0, true)
ON CONFLICT (code) DO NOTHING;
