/**
 * Unit Tests for Pre-submission Validation Functions
 * Tests NIK, medical record, vital signs, and prerequisite validation
 */

import {
  validatePatientForSync,
  validateMedicalRecordForSubmission,
  validateVitalSigns,
  checkPrerequisites
} from '../pre-submission-checks';

describe('Pre-submission Validation Functions', () => {
  describe('validatePatientForSync', () => {
    test('should accept valid patient data', () => {
      const result = validatePatientForSync({
        nik: '1234567890123456',
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Laki-laki'
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject NIK with less than 16 digits', () => {
      const result = validatePatientForSync({
        nik: '123456789012345', // 15 digits
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Laki-laki'
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('NIK'))).toBe(true);
    });

    test('should reject NIK with more than 16 digits', () => {
      const result = validatePatientForSync({
        nik: '12345678901234567', // 17 digits
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Laki-laki'
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('NIK'))).toBe(true);
    });

    test('should reject NIK with non-numeric characters', () => {
      const result = validatePatientForSync({
        nik: '123456789012345A', // Contains 'A'
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Laki-laki'
      });

      expect(result.valid).toBe(false);
    });

    test('should reject name with less than 2 characters', () => {
      const result = validatePatientForSync({
        nik: '1234567890123456',
        name: 'A',
        dateOfBirth: '1990-01-01',
        gender: 'Laki-laki'
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name') || e.includes('Nama'))).toBe(true);
    });

    test('should reject very old date of birth', () => {
      const result = validatePatientForSync({
        nik: '1234567890123456',
        name: 'John Doe',
        dateOfBirth: '1800-01-01', // 225+ years ago
        gender: 'Laki-laki'
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('age') || e.includes('usia'))).toBe(true);
    });

    test('should reject future date of birth', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      const result = validatePatientForSync({
        nik: '1234567890123456',
        name: 'John Doe',
        dateOfBirth: futureDate,
        gender: 'Laki-laki'
      });

      expect(result.valid).toBe(false);
    });

    test('should accept reasonable ages (0-150)', () => {
      const today = new Date();
      const ages = [
        new Date(today.getFullYear() - 0, today.getMonth(), today.getDate()), // Newborn
        new Date(today.getFullYear() - 30, today.getMonth(), today.getDate()), // 30 years
        new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()), // 100 years
      ];

      ages.forEach(dob => {
        const result = validatePatientForSync({
          nik: '1234567890123456',
          name: 'John Doe',
          dateOfBirth: dob.toISOString().split('T')[0],
          gender: 'Laki-laki'
        });

        expect(result.valid).toBe(true);
      });
    });

    test('should accept both gender options', () => {
      const maleResult = validatePatientForSync({
        nik: '1234567890123456',
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Laki-laki'
      });

      const femaleResult = validatePatientForSync({
        nik: '1234567890123456',
        name: 'Jane Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Perempuan'
      });

      expect(maleResult.valid).toBe(true);
      expect(femaleResult.valid).toBe(true);
    });

    test('should allow optional NIK field', () => {
      const result = validatePatientForSync({
        nik: undefined,
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Laki-laki'
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('validateVitalSigns', () => {
    test('should accept valid vital signs', () => {
      const result = validateVitalSigns({
        bloodPressure: '120/80',
        pulse: 80,
        temperature: 37,
        weight: 70,
        height: 170
      });

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    test('should warn on extremely high blood pressure', () => {
      const result = validateVitalSigns({
        bloodPressure: '220/140',
        pulse: 80,
        temperature: 37,
        weight: 70,
        height: 170
      });

      expect(result.warnings.some(w => w.includes('pressure') || w.includes('tekanan'))).toBe(true);
    });

    test('should reject extremely low blood pressure', () => {
      const result = validateVitalSigns({
        bloodPressure: '40/20',
        pulse: 80,
        temperature: 37,
        weight: 70,
        height: 170
      });

      expect(result.valid).toBe(false);
    });

    test('should warn on tachycardia (high heart rate)', () => {
      const result = validateVitalSigns({
        bloodPressure: '120/80',
        pulse: 150,
        temperature: 37,
        weight: 70,
        height: 170
      });

      expect(result.warnings.some(w => w.includes('pulse') || w.includes('nadi'))).toBe(true);
    });

    test('should warn on bradycardia (low heart rate)', () => {
      const result = validateVitalSigns({
        bloodPressure: '120/80',
        pulse: 30,
        temperature: 37,
        weight: 70,
        height: 170
      });

      expect(result.warnings.some(w => w.includes('pulse') || w.includes('nadi'))).toBe(true);
    });

    test('should warn on high temperature (fever)', () => {
      const result = validateVitalSigns({
        bloodPressure: '120/80',
        pulse: 80,
        temperature: 39.5,
        weight: 70,
        height: 170
      });

      expect(result.warnings.some(w => w.includes('temperature') || w.includes('suhu'))).toBe(true);
    });

    test('should warn on low temperature (hypothermia)', () => {
      const result = validateVitalSigns({
        bloodPressure: '120/80',
        pulse: 80,
        temperature: 35,
        weight: 70,
        height: 170
      });

      expect(result.warnings.some(w => w.includes('temperature') || w.includes('suhu'))).toBe(true);
    });

    test('should handle missing optional fields', () => {
      const result = validateVitalSigns({
        bloodPressure: '120/80',
        pulse: 80,
        temperature: 37
        // weight and height missing
      });

      expect(result.valid).toBe(true);
    });

    test('should validate temperature format (decimal)', () => {
      const result = validateVitalSigns({
        bloodPressure: '120/80',
        pulse: 80,
        temperature: 37.2,
        weight: 70,
        height: 170
      });

      expect(result.valid).toBe(true);
    });

    test('should reject invalid blood pressure format', () => {
      const result = validateVitalSigns({
        bloodPressure: '120-80', // Should be /
        pulse: 80,
        temperature: 37,
        weight: 70,
        height: 170
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('validateMedicalRecordForSubmission', () => {
    test('should accept valid medical record data', () => {
      const result = validateMedicalRecordForSubmission({
        patientIhsNumber: 'IHS-123456',
        doctorId: 'doc-123',
        visitDate: '2025-11-14',
        diagnoses: [{ code: 'A00', nameIndonesian: 'Kolera' }],
        vitalSigns: { bp: '120/80', hr: 80, temp: 37 }
      });

      expect(result.valid).toBe(true);
    });

    test('should require IHS number', () => {
      const result = validateMedicalRecordForSubmission({
        patientIhsNumber: undefined,
        doctorId: 'doc-123',
        visitDate: '2025-11-14',
        diagnoses: [{ code: 'A00', nameIndonesian: 'Kolera' }],
        vitalSigns: { bp: '120/80', hr: 80, temp: 37 }
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('IHS'))).toBe(true);
    });

    test('should require doctor ID', () => {
      const result = validateMedicalRecordForSubmission({
        patientIhsNumber: 'IHS-123456',
        doctorId: undefined,
        visitDate: '2025-11-14',
        diagnoses: [{ code: 'A00', nameIndonesian: 'Kolera' }],
        vitalSigns: { bp: '120/80', hr: 80, temp: 37 }
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('doctor') || e.includes('dokter'))).toBe(true);
    });

    test('should validate visit date format', () => {
      const result = validateMedicalRecordForSubmission({
        patientIhsNumber: 'IHS-123456',
        doctorId: 'doc-123',
        visitDate: 'invalid-date',
        diagnoses: [{ code: 'A00', nameIndonesian: 'Kolera' }],
        vitalSigns: { bp: '120/80', hr: 80, temp: 37 }
      });

      expect(result.valid).toBe(false);
    });

    test('should require at least one diagnosis', () => {
      const result = validateMedicalRecordForSubmission({
        patientIhsNumber: 'IHS-123456',
        doctorId: 'doc-123',
        visitDate: '2025-11-14',
        diagnoses: [],
        vitalSigns: { bp: '120/80', hr: 80, temp: 37 }
      });

      expect(result.valid).toBe(false);
    });

    test('should handle multiple diagnoses', () => {
      const result = validateMedicalRecordForSubmission({
        patientIhsNumber: 'IHS-123456',
        doctorId: 'doc-123',
        visitDate: '2025-11-14',
        diagnoses: [
          { code: 'A00', nameIndonesian: 'Kolera' },
          { code: 'B00', nameIndonesian: 'Herpes' }
        ],
        vitalSigns: { bp: '120/80', hr: 80, temp: 37 }
      });

      expect(result.valid).toBe(true);
    });

    test('should validate vital signs', () => {
      const result = validateMedicalRecordForSubmission({
        patientIhsNumber: 'IHS-123456',
        doctorId: 'doc-123',
        visitDate: '2025-11-14',
        diagnoses: [{ code: 'A00', nameIndonesian: 'Kolera' }],
        vitalSigns: { bp: '300/200', hr: 200, temp: 45 }
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('checkPrerequisites', () => {
    test('should return canSubmit=true with all prerequisites met', () => {
      const { canSubmit, missing } = checkPrerequisites({
        patientIhsNumber: 'IHS-123456',
        doctorId: 'doc-123',
        organizationId: 'org-123'
      });

      expect(canSubmit).toBe(true);
      expect(missing).toHaveLength(0);
    });

    test('should report missing IHS number', () => {
      const { canSubmit, missing } = checkPrerequisites({
        patientIhsNumber: undefined,
        doctorId: 'doc-123',
        organizationId: 'org-123'
      });

      expect(canSubmit).toBe(false);
      expect(missing.some(m => m.includes('IHS'))).toBe(true);
    });

    test('should report missing doctor ID', () => {
      const { canSubmit, missing } = checkPrerequisites({
        patientIhsNumber: 'IHS-123456',
        doctorId: undefined,
        organizationId: 'org-123'
      });

      expect(canSubmit).toBe(false);
      expect(missing.some(m => m.includes('doctor') || m.includes('dokter'))).toBe(true);
    });

    test('should report missing organization ID', () => {
      const { canSubmit, missing } = checkPrerequisites({
        patientIhsNumber: 'IHS-123456',
        doctorId: 'doc-123',
        organizationId: undefined
      });

      expect(canSubmit).toBe(false);
      expect(missing.some(m => m.includes('organization') || m.includes('organisasi'))).toBe(true);
    });

    test('should report multiple missing prerequisites', () => {
      const { canSubmit, missing } = checkPrerequisites({
        patientIhsNumber: undefined,
        doctorId: undefined,
        organizationId: undefined
      });

      expect(canSubmit).toBe(false);
      expect(missing.length).toBeGreaterThanOrEqual(3);
    });

    test('should handle empty strings as missing', () => {
      const { canSubmit, missing } = checkPrerequisites({
        patientIhsNumber: '',
        doctorId: '',
        organizationId: ''
      });

      expect(canSubmit).toBe(false);
      expect(missing.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Error messages', () => {
    test('should return user-friendly error messages', () => {
      const result = validatePatientForSync({
        nik: 'invalid',
        name: 'A',
        dateOfBirth: 'invalid',
        gender: 'invalid'
      });

      expect(result.valid).toBe(false);
      result.errors.forEach(error => {
        expect(typeof error).toBe('string');
        expect(error.length).toBeGreaterThan(0);
      });
    });

    test('should return actionable error messages', () => {
      const result = validatePatientForSync({
        nik: '12345', // Too short
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Laki-laki'
      });

      expect(result.errors[0]).toContain('16 digit');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty strings', () => {
      const result = validatePatientForSync({
        nik: '',
        name: '',
        dateOfBirth: '',
        gender: ''
      });

      expect(result.valid).toBe(false);
    });

    test('should handle null values', () => {
      const result = validatePatientForSync({
        nik: null as any,
        name: null as any,
        dateOfBirth: null as any,
        gender: null as any
      });

      expect(result.valid).toBe(false);
    });

    test('should handle whitespace-only strings', () => {
      const result = validatePatientForSync({
        nik: '   ',
        name: '   ',
        dateOfBirth: '1990-01-01',
        gender: 'Laki-laki'
      });

      expect(result.valid).toBe(false);
    });

    test('should handle very long names', () => {
      const longName = 'A'.repeat(500);
      const result = validatePatientForSync({
        nik: '1234567890123456',
        name: longName,
        dateOfBirth: '1990-01-01',
        gender: 'Laki-laki'
      });

      // Should either accept or have specific error
      expect(result).toHaveProperty('valid');
    });

    test('should handle special characters in name', () => {
      const result = validatePatientForSync({
        nik: '1234567890123456',
        name: "O'Brien-Smith",
        dateOfBirth: '1990-01-01',
        gender: 'Laki-laki'
      });

      expect(result.valid).toBe(true);
    });
  });
});
