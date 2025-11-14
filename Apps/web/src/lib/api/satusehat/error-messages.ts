/**
 * User-friendly error messages for SatuSehat integration
 * Maps error codes and scenarios to actionable messages
 */

export interface ErrorMessageMap {
  code: string;
  userMessage: string;
  technicalMessage?: string;
  actionable?: boolean;
  suggestedAction?: string;
}

export const ERROR_MESSAGES: Record<string, ErrorMessageMap> = {
  // Validation Errors
  INVALID_NIK: {
    code: 'INVALID_NIK',
    userMessage: 'Patient NIK (ID number) is invalid. Please check the format (16 digits).',
    actionable: true,
    suggestedAction: 'Update patient information',
  },

  INVALID_ICD10: {
    code: 'INVALID_ICD10',
    userMessage: 'One or more diagnosis codes are invalid. Please select valid ICD-10 codes.',
    actionable: true,
    suggestedAction: 'Review and update diagnoses',
  },

  INVALID_DATE: {
    code: 'INVALID_DATE',
    userMessage: 'Date format is invalid. Please use YYYY-MM-DD format.',
    actionable: true,
    suggestedAction: 'Correct the date and try again',
  },

  MISSING_REQUIRED_FIELD: {
    code: 'MISSING_REQUIRED_FIELD',
    userMessage: 'Some required fields are missing. Please complete all fields.',
    actionable: true,
    suggestedAction: 'Complete the form and try again',
  },

  // Prerequisite Errors
  PATIENT_NOT_SYNCED: {
    code: 'PATIENT_NOT_SYNCED',
    userMessage: 'Patient has not been registered with SatuSehat yet. You must sync the patient first.',
    actionable: true,
    suggestedAction: 'Click the "Sync to SatuSehat" button',
  },

  PRACTITIONER_NOT_SYNCED: {
    code: 'PRACTITIONER_NOT_SYNCED',
    userMessage: 'Doctor is not registered with SatuSehat yet. Please contact your administrator.',
    actionable: false,
    suggestedAction: 'Contact administrator for SatuSehat registration',
  },

  ORGANIZATION_NOT_SETUP: {
    code: 'ORGANIZATION_NOT_SETUP',
    userMessage: 'Clinic is not registered with SatuSehat. Contact your administrator.',
    actionable: false,
    suggestedAction: 'Contact administrator',
  },

  // Duplicate/Conflict Errors
  DUPLICATE_PATIENT: {
    code: 'DUPLICATE_PATIENT',
    userMessage: 'This patient is already registered in SatuSehat.',
    actionable: false,
    suggestedAction: 'Use existing patient record',
  },

  DUPLICATE_SUBMISSION: {
    code: 'DUPLICATE_SUBMISSION',
    userMessage: 'This data has already been submitted to SatuSehat.',
    actionable: false,
    suggestedAction: 'View submission status in dashboard',
  },

  // Network/API Errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    userMessage: 'Network connection error. Your submission will be retried automatically.',
    actionable: false,
    suggestedAction: 'Check your internet connection',
  },

  CONNECTION_TIMEOUT: {
    code: 'CONNECTION_TIMEOUT',
    userMessage: 'Connection timeout. Your submission will be retried automatically.',
    actionable: false,
    suggestedAction: 'Wait or refresh the page',
  },

  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    userMessage: 'Too many requests. The system will retry your submission automatically.',
    actionable: false,
    suggestedAction: 'Wait a few minutes and try again',
  },

  // API Errors
  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    userMessage: 'Request is malformed. Please check your data.',
    actionable: true,
    suggestedAction: 'Review and correct the data',
  },

  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    userMessage: 'Authentication failed. Please check your credentials.',
    actionable: false,
    suggestedAction: 'Contact your administrator',
  },

  FORBIDDEN: {
    code: 'FORBIDDEN',
    userMessage: 'You do not have permission to perform this action.',
    actionable: false,
    suggestedAction: 'Contact your administrator',
  },

  NOT_FOUND: {
    code: 'NOT_FOUND',
    userMessage: 'The requested resource was not found.',
    actionable: false,
    suggestedAction: 'Refresh the page and try again',
  },

  CONFLICT: {
    code: 'CONFLICT',
    userMessage: 'This data conflicts with existing records. Please resolve conflicts.',
    actionable: true,
    suggestedAction: 'Check for duplicate entries',
  },

  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    userMessage: 'Server error. Your submission will be retried automatically.',
    actionable: false,
    suggestedAction: 'Try again later or contact support',
  },

  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    userMessage: 'SatuSehat service is temporarily unavailable. Your submission will be retried.',
    actionable: false,
    suggestedAction: 'Wait and try again',
  },

  // Max Retries Exceeded
  MAX_RETRIES_EXCEEDED: {
    code: 'MAX_RETRIES_EXCEEDED',
    userMessage: 'Submission failed after multiple retry attempts. Please contact support.',
    actionable: false,
    suggestedAction: 'Contact technical support with submission ID',
  },

  // Unknown
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    userMessage: 'An unexpected error occurred. Please try again.',
    actionable: false,
    suggestedAction: 'Refresh the page and try again',
  },
};

/**
 * Get user-friendly error message from error code or string
 */
export function getErrorMessage(error: string | Error | null): ErrorMessageMap {
  if (!error) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  const errorStr = error instanceof Error ? error.message : String(error);

  // Check if it matches a known error code
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (key === errorStr.toUpperCase()) {
      return value;
    }

    // Also check if error message contains the key
    if (
      errorStr.includes(key.replace(/_/g, ' ')) ||
      errorStr.includes(value.code)
    ) {
      return value;
    }
  }

  // Try to extract error code from message
  if (errorStr.includes('NIK')) return ERROR_MESSAGES.INVALID_NIK;
  if (errorStr.includes('ICD-10') || errorStr.includes('ICD10'))
    return ERROR_MESSAGES.INVALID_ICD10;
  if (errorStr.includes('date') || errorStr.includes('Date'))
    return ERROR_MESSAGES.INVALID_DATE;
  if (errorStr.includes('required') || errorStr.includes('missing'))
    return ERROR_MESSAGES.MISSING_REQUIRED_FIELD;
  if (errorStr.includes('not synced') || errorStr.includes('not registered'))
    return ERROR_MESSAGES.PATIENT_NOT_SYNCED;
  if (errorStr.includes('timeout') || errorStr.includes('TIMEOUT'))
    return ERROR_MESSAGES.CONNECTION_TIMEOUT;
  if (errorStr.includes('429') || errorStr.includes('rate limit'))
    return ERROR_MESSAGES.RATE_LIMITED;
  if (errorStr.includes('400')) return ERROR_MESSAGES.BAD_REQUEST;
  if (errorStr.includes('401')) return ERROR_MESSAGES.UNAUTHORIZED;
  if (errorStr.includes('403')) return ERROR_MESSAGES.FORBIDDEN;
  if (errorStr.includes('404')) return ERROR_MESSAGES.NOT_FOUND;
  if (errorStr.includes('409')) return ERROR_MESSAGES.CONFLICT;
  if (errorStr.includes('500') || errorStr.includes('internal server'))
    return ERROR_MESSAGES.SERVER_ERROR;
  if (errorStr.includes('503') || errorStr.includes('unavailable'))
    return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
  if (errorStr.includes('network') || errorStr.includes('Network'))
    return ERROR_MESSAGES.NETWORK_ERROR;

  // Default to unknown
  return {
    ...ERROR_MESSAGES.UNKNOWN_ERROR,
    technicalMessage: errorStr,
  };
}

/**
 * Get success message for different submission types
 */
export function getSuccessMessage(
  resourceType: string,
  count?: number
): string {
  const messages: Record<string, string> = {
    Patient: `Patient successfully synced to SatuSehat`,
    Encounter: `Encounter successfully submitted to SatuSehat`,
    Condition:
      count && count > 1
        ? `${count} diagnoses submitted to SatuSehat`
        : `Diagnosis submitted to SatuSehat`,
    Observation:
      count && count > 1
        ? `${count} vital signs submitted to SatuSehat`
        : `Vital signs submitted to SatuSehat`,
    MedicationRequest:
      count && count > 1
        ? `${count} prescriptions submitted to SatuSehat`
        : `Prescription submitted to SatuSehat`,
  };

  return messages[resourceType] || 'Data submitted to SatuSehat';
}
