/**
 * Pre-submission validation checks for SatuSehat
 * Ensures data is valid before attempting submission
 */

import {
  isValidNIK,
  isValidICD10Code,
  isValidISODate,
  formatToISODate,
} from './utils';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface PatientCheckOptions {
  nik?: string;
  name?: string;
  dateOfBirth?: string | Date;
  gender?: string;
  ihsNumber?: string;
}

export interface MedicalRecordCheckOptions {
  patientIhsNumber?: string;
  doctorId?: string;
  visitDate?: string | Date;
  diagnoses?: Array<{ icd10_code?: string; diagnosis_text?: string }>;
  vitalSigns?: Record<string, any>;
}

/**
 * Validate patient data before sync
 */
export function validatePatientForSync(
  options: PatientCheckOptions
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check NIK
  if (!options.nik) {
    errors.push('Patient NIK (ID number) is required');
  } else if (!isValidNIK(options.nik)) {
    errors.push(
      'Patient NIK must be 16 digits. Current: ' + options.nik.length
    );
  }

  // Check name
  if (!options.name || options.name.trim().length < 2) {
    errors.push('Patient name must be at least 2 characters');
  }

  // Check date of birth
  if (!options.dateOfBirth) {
    errors.push('Date of birth is required');
  } else {
    const dobStr =
      typeof options.dateOfBirth === 'string'
        ? options.dateOfBirth
        : formatToISODate(options.dateOfBirth);

    if (!isValidISODate(dobStr)) {
      errors.push('Date of birth must be in YYYY-MM-DD format');
    } else {
      // Check if age is reasonable (0-150 years)
      const dob = new Date(dobStr);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();

      if (age < 0 || age > 150) {
        errors.push('Patient age is invalid. Check date of birth.');
      }

      // Warn if future date
      if (dob > now) {
        warnings.push('Date of birth is in the future');
      }
    }
  }

  // Check gender
  if (!options.gender) {
    errors.push('Gender is required');
  } else {
    const validGenders = [
      'male',
      'female',
      'other',
      'unknown',
      'laki-laki',
      'perempuan',
    ];
    if (!validGenders.includes(options.gender.toLowerCase())) {
      errors.push('Invalid gender value');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate medical record data before clinical data submission
 */
export function validateMedicalRecordForSubmission(
  options: MedicalRecordCheckOptions
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check prerequisites
  if (!options.patientIhsNumber) {
    errors.push(
      'Patient has not been synced to SatuSehat yet. Please sync the patient first.'
    );
  }

  if (!options.doctorId) {
    errors.push('Doctor information is missing');
  }

  // Check visit date
  if (!options.visitDate) {
    errors.push('Visit date is required');
  } else {
    const visitStr =
      typeof options.visitDate === 'string'
        ? options.visitDate
        : formatToISODate(options.visitDate);

    if (!isValidISODate(visitStr)) {
      errors.push('Visit date must be in YYYY-MM-DD format');
    } else {
      const visitDate = new Date(visitStr);
      const now = new Date();

      // Warn if future date
      if (visitDate > now) {
        warnings.push('Visit date is in the future');
      }

      // Warn if too old (>2 years)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      if (visitDate < twoYearsAgo) {
        warnings.push('Visit date is older than 2 years');
      }
    }
  }

  // Check diagnoses if present
  if (options.diagnoses && options.diagnoses.length > 0) {
    const invalidDiagnoses: string[] = [];

    options.diagnoses.forEach((diagnosis, index) => {
      if (!diagnosis.icd10_code && !diagnosis.diagnosis_text) {
        invalidDiagnoses.push(`Diagnosis ${index + 1}: No ICD-10 code or text`);
      } else if (
        diagnosis.icd10_code &&
        !isValidICD10Code(diagnosis.icd10_code)
      ) {
        invalidDiagnoses.push(
          `Diagnosis ${index + 1}: Invalid ICD-10 code "${diagnosis.icd10_code}"`
        );
      }
    });

    if (invalidDiagnoses.length > 0) {
      errors.push(...invalidDiagnoses);
    }
  }

  // Check vital signs if present
  if (options.vitalSigns && Object.keys(options.vitalSigns).length > 0) {
    const vitalWarnings = validateVitalSigns(options.vitalSigns);
    if (vitalWarnings.length > 0) {
      warnings.push(...vitalWarnings);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate vital signs data
 */
function validateVitalSigns(vitalSigns: Record<string, any>): string[] {
  const warnings: string[] = [];

  // Blood pressure
  if (vitalSigns.blood_pressure) {
    const bp = vitalSigns.blood_pressure;
    if (typeof bp === 'string') {
      const [systolic, diastolic] = bp.split('/').map(Number);
      if (
        systolic > 200 ||
        diastolic > 120 ||
        systolic < 70 ||
        diastolic < 40
      ) {
        warnings.push(
          `Blood pressure ${bp} is outside normal range (70-200/40-120)`
        );
      }
    }
  }

  // Heart rate
  if (vitalSigns.heart_rate) {
    const hr = Number(vitalSigns.heart_rate);
    if (hr < 40 || hr > 180) {
      warnings.push(`Heart rate ${hr} is outside normal range (40-180 bpm)`);
    }
  }

  // Temperature
  if (vitalSigns.temperature) {
    const temp = Number(vitalSigns.temperature);
    if (temp < 35 || temp > 42) {
      warnings.push(`Temperature ${temp}°C is outside normal range (35-42°C)`);
    }
  }

  // Respiratory rate
  if (vitalSigns.respiratory_rate) {
    const rr = Number(vitalSigns.respiratory_rate);
    if (rr < 8 || rr > 40) {
      warnings.push(`Respiratory rate ${rr} is outside normal range (8-40/min)`);
    }
  }

  // Weight
  if (vitalSigns.weight) {
    const weight = Number(vitalSigns.weight);
    if (weight < 2 || weight > 500) {
      warnings.push(`Weight ${weight}kg is outside normal range (2-500kg)`);
    }
  }

  // Height
  if (vitalSigns.height) {
    const height = Number(vitalSigns.height);
    if (height < 50 || height > 300) {
      warnings.push(`Height ${height}cm is outside normal range (50-300cm)`);
    }
  }

  return warnings;
}

/**
 * Check prerequisites for submission
 */
export interface PrerequisiteCheckResult {
  canSubmit: boolean;
  missing: string[];
}

export function checkPrerequisites(options: {
  patientIhsNumber?: string;
  doctorId?: string;
  organizationId?: string;
}): PrerequisiteCheckResult {
  const missing: string[] = [];

  if (!options.patientIhsNumber) {
    missing.push('Patient must be synced to SatuSehat first');
  }

  if (!options.doctorId) {
    missing.push('Doctor information is required');
  }

  if (!options.organizationId) {
    missing.push('Clinic must be registered with SatuSehat');
  }

  return {
    canSubmit: missing.length === 0,
    missing,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): {
  errorSummary: string;
  errorDetails: string[];
  warningDetails?: string[];
} {
  const errorCount = result.errors.length;
  const warningCount = result.warnings?.length || 0;

  let errorSummary = '';

  if (errorCount === 0 && warningCount === 0) {
    errorSummary = 'All validation checks passed';
  } else if (errorCount > 0 && warningCount > 0) {
    errorSummary = `Found ${errorCount} error(s) and ${warningCount} warning(s)`;
  } else if (errorCount > 0) {
    errorSummary =
      errorCount === 1
        ? 'Found 1 error'
        : `Found ${errorCount} errors`;
  } else {
    errorSummary =
      warningCount === 1
        ? 'Found 1 warning'
        : `Found ${warningCount} warnings`;
  }

  return {
    errorSummary,
    errorDetails: result.errors,
    warningDetails: result.warnings,
  };
}
