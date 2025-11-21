// FHIR Resource Types
export interface FhirBundle {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  entry?: Array<{
    resource: Record<string, unknown>;
  }>;
}

export interface FhirPatient {
  resourceType: 'Patient';
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    use?: string;
    text?: string;
    family?: string;
    given?: string[];
  }>;
  birthDate?: string;
  gender?: string;
  address?: Array<{
    use?: string;
    type?: string;
    line?: string[];
    city?: string;
    postalCode?: string;
    country?: string;
  }>;
  telecom?: Array<{
    system: string;
    value: string;
    use?: string;
  }>;
  contact?: Array<{
    relationship?: Array<{ coding: Array<{ system?: string; code: string; display?: string }> }>;
    name?: { text: string };
    telecom?: Array<{ system: string; value: string }>;
  }>;
  communication?: Array<{
    language: { coding: Array<{ system?: string; code: string; display?: string }> };
    preferred?: boolean;
  }>;
}

export interface FhirOrganization {
  resourceType: 'Organization';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name: string;
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  telecom?: Array<{
    system: string;
    value: string;
  }>;
  address?: Array<{
    line?: string[];
    city?: string;
    postalCode?: string;
    country?: string;
  }>;
  partOf?: {
    reference: string;
  };
}

export interface FhirLocation {
  resourceType: 'Location';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  status?: string;
  name: string;
  description?: string;
  telecom?: Array<{
    system: string;
    value: string;
  }>;
  address?: {
    line?: string[];
    city?: string;
    postalCode?: string;
    country?: string;
  };
  managingOrganization?: {
    reference: string;
  };
}

export interface FhirPractitioner {
  resourceType: 'Practitioner';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    use?: string;
    family?: string;
    given?: string[];
  }>;
  gender?: string;
  birthDate?: string;
  telecom?: Array<{
    system: string;
    value: string;
  }>;
  qualification?: Array<{
    identifier?: Array<{
      system: string;
      value: string;
    }>;
    code?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    issuer?: {
      reference: string;
    };
  }>;
}

export interface FhirEncounter {
  resourceType: 'Encounter';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  status: string;
  class: {
    system: string;
    code: string;
    display?: string;
  };
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  subject: {
    reference: string;
    display?: string;
  };
  participant?: Array<{
    individual: {
      reference: string;
      display?: string;
    };
    type?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    }>;
  }>;
  period: {
    start: string;
    end?: string;
  };
  reason?: Array<{
    use?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    }>;
    value?: Array<{
      reference: {
        reference: string;
        display?: string;
      };
    }>;
  }>;
  diagnosis?: Array<{
    condition: {
      reference: string;
      display?: string;
    };
    use?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    };
    rank?: number;
  }>;
  hospitalization?: {
    dischargeDisposition?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    };
  };
  location?: Array<{
    location: {
      reference: string;
      display?: string;
    };
    status?: string;
  }>;
  serviceProvider?: {
    reference: string;
    display?: string;
  };
}

export interface FhirCondition {
  resourceType: 'Condition';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  clinicalStatus?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  };
  verificationStatus?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  };
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  severity?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  };
  code: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
    display?: string;
  };
  encounter?: {
    reference: string;
    display?: string;
  };
  onsetDateTime?: string;
  recorder?: {
    reference: string;
    display?: string;
  };
  asserter?: {
    reference: string;
    display?: string;
  };
}

export interface FhirObservation {
  resourceType: 'Observation';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  basedOn?: Array<{
    reference: string;
  }>;
  status: string;
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
    display?: string;
  };
  encounter?: {
    reference: string;
    display?: string;
  };
  effectiveDateTime?: string;
  issued?: string;
  performer?: Array<{
    reference: string;
    display?: string;
  }>;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  valueCodeableConcept?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  valueString?: string;
  valueBoolean?: boolean;
  referenceRange?: Array<{
    low?: { value: number; unit: string };
    high?: { value: number; unit: string };
    text?: string;
  }>;
  interpretation?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  note?: Array<{
    text: string;
  }>;
}

export interface FhirMedicationRequest {
  resourceType: 'MedicationRequest';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  status: string;
  statusReason?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  };
  intent: string;
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  priority?: string;
  doNotPerform?: boolean;
  medication: {
    reference: string;
    display?: string;
  };
  subject: {
    reference: string;
    display?: string;
  };
  encounter?: {
    reference: string;
    display?: string;
  };
  authoredOn: string;
  requester: {
    reference: string;
    display?: string;
  };
  recorder?: {
    reference: string;
    display?: string;
  };
  reason?: Array<{
    reference?: {
      reference: string;
      display?: string;
    };
    concept?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
  }>;
  dosageInstruction?: Array<{
    sequence?: number;
    text: string;
    timing?: {
      repeat?: {
        frequency?: number;
        period?: number;
        periodUnit?: string;
        dayOfWeek?: string[];
        timeOfDay?: string[];
      };
    };
    asNeeded?: boolean | { coding: Array<{ system: string; code: string }> };
    route?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    method?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    };
    doseAndRate?: Array<{
      type?: {
        coding: Array<{
          system: string;
          code: string;
          display?: string;
        }>;
      };
      doseQuantity?: {
        value: number;
        unit: string;
        system?: string;
        code?: string;
      };
      rateQuantity?: {
        value: number;
        unit: string;
        system?: string;
        code?: string;
      };
    }>;
    maxDosePerPeriod?: {
      numerator?: { value: number; unit: string };
      denominator?: { value: number; unit: string; system?: string; code?: string };
    };
  }>;
  dispenseRequest?: {
    initialFill?: {
      quantity?: { value: number; unit: string };
      duration?: { value: number; unit: string; system?: string; code?: string };
    };
    dispenseInterval?: {
      value: number;
      unit: string;
      system?: string;
      code?: string;
    };
    validityPeriod?: {
      start?: string;
      end?: string;
    };
    numberOfRepeatsAllowed?: number;
    quantity?: {
      value: number;
      unit: string;
      system?: string;
      code?: string;
    };
    expectedSupplyDuration?: {
      value: number;
      unit: string;
      system?: string;
      code?: string;
    };
    performer?: {
      reference: string;
    };
  };
  substitution?: {
    allowed: boolean;
    reason?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    };
  };
  priorPrescription?: {
    reference: string;
  };
}

export interface FhirServiceRequest {
  resourceType: 'ServiceRequest';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  basedOn?: Array<{
    reference: string;
  }>;
  status: string;
  intent: string;
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  priority?: string;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  orderDetail?: Array<{
    parameterFocus?: { text: string };
    parameterValue?: { valueQuantity?: { value: number; unit: string } };
  }>;
  quantity?: Array<{
    value: number;
    unit: string;
  }>;
  subject: {
    reference: string;
    display?: string;
  };
  encounter?: {
    reference: string;
    display?: string;
  };
  occurrenceDateTime?: string;
  occurrencePeriod?: {
    start?: string;
    end?: string;
  };
  asNeeded?: boolean;
  authoredOn: string;
  requester: {
    reference: string;
    display?: string;
  };
  performerType?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  };
  performer?: Array<{
    reference: string;
    display?: string;
  }>;
  locationCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  locationReference?: Array<{
    reference: string;
    display?: string;
  }>;
  reason?: Array<{
    concept?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    reference?: {
      reference: string;
      display?: string;
    };
  }>;
  supportingInfo?: Array<{
    reference: string;
  }>;
  specimen?: Array<{
    reference: string;
  }>;
  bodySite?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  }>;
  note?: Array<{
    text: string;
  }>;
}

// Billing & Financial Resources

export interface FhirInvoice {
  resourceType: 'Invoice';
  identifier?: Array<{
    system?: string;
    value: string;
  }>;
  status: 'draft' | 'issued' | 'balanced' | 'cancelled' | 'entered-in-error';
  type?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string; // Patient/xxx
    display?: string;
  };
  recipient?: {
    reference: string; // Patient or Organization
    display?: string;
  };
  date?: string; // Invoice date (YYYY-MM-DD)
  participant?: Array<{
    role?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    actor: {
      reference: string; // Practitioner/xxx or Organization/xxx
      display?: string;
    };
  }>;
  issuer?: {
    reference: string; // Organization/xxx
    display?: string;
  };
  lineItem?: Array<{
    sequence?: number;
    chargeItemReference?: {
      reference: string; // ChargeItem/xxx
      display?: string;
    };
    chargeItemCodeableConcept?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    priceComponent?: Array<{
      type: 'base' | 'surcharge' | 'deduction' | 'discount' | 'tax' | 'informational';
      code?: {
        coding?: Array<{
          system?: string;
          code?: string;
          display?: string;
        }>;
        text?: string;
      };
      factor?: number;
      amount?: {
        value: number;
        currency?: string;
      };
    }>;
  }>;
  totalPriceComponent?: Array<{
    type: 'base' | 'surcharge' | 'deduction' | 'discount' | 'tax' | 'informational';
    code?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    amount?: {
      value: number;
      currency?: string;
    };
  }>;
  totalNet?: {
    value: number;
    currency?: string;
  };
  totalGross?: {
    value: number;
    currency?: string;
  };
  paymentTerms?: string;
  note?: Array<{
    text: string;
  }>;
}

export interface FhirChargeItem {
  resourceType: 'ChargeItem';
  identifier?: Array<{
    system?: string;
    value: string;
  }>;
  status: 'planned' | 'billable' | 'not-billable' | 'aborted' | 'billed' | 'entered-in-error' | 'unknown';
  code: {
    coding?: Array<{
      system?: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string; // Patient/xxx
    display?: string;
  };
  context?: {
    reference: string; // Encounter/xxx
    display?: string;
  };
  occurrenceDateTime?: string;
  occurrencePeriod?: {
    start?: string;
    end?: string;
  };
  performer?: Array<{
    function?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    actor: {
      reference: string; // Practitioner/xxx or Organization/xxx
      display?: string;
    };
  }>;
  performingOrganization?: {
    reference: string; // Organization/xxx
    display?: string;
  };
  quantity?: {
    value: number;
    comparator?: string;
    unit?: string;
    system?: string;
    code?: string;
  };
  priceOverride?: {
    value: number;
    currency?: string;
  };
  factorOverride?: number;
  note?: Array<{
    text: string;
  }>;
}

export interface FhirClaim {
  resourceType: 'Claim';
  identifier?: Array<{
    system?: string;
    value: string;
  }>;
  status: 'active' | 'cancelled' | 'draft' | 'entered-in-error';
  type: {
    coding?: Array<{
      system?: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  use: 'claim' | 'preauthorization' | 'predetermination';
  patient: {
    reference: string; // Patient/xxx
    display?: string;
  };
  billablePeriod?: {
    start?: string;
    end?: string;
  };
  created: string; // DateTime
  insurer: {
    reference: string; // Organization/xxx (BPJS)
    display?: string;
  };
  provider: {
    reference: string; // Organization/xxx (Your clinic)
    display?: string;
  };
  priority: {
    coding?: Array<{
      system?: string;
      code: 'normal' | 'urgent';
      display?: string;
    }>;
  };
  supportingInfo?: Array<{
    sequence: number;
    category: {
      coding?: Array<{
        system?: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    code?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    timing?: {
      date?: string;
      period?: {
        start?: string;
        end?: string;
      };
    };
    valueBoolean?: boolean;
    valueString?: string;
    valueQuantity?: {
      value: number;
      unit?: string;
    };
    valueAttachment?: {
      contentType?: string;
      url?: string;
      title?: string;
    };
    valueReference?: {
      reference: string;
      display?: string;
    };
    valueIdentifier?: {
      system?: string;
      value: string;
    };
  }>;
  diagnosis?: Array<{
    sequence: number;
    diagnosisCodeableConcept?: {
      coding?: Array<{
        system?: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    diagnosisReference?: {
      reference: string;
      display?: string;
    };
    type?: Array<{
      coding?: Array<{
        system?: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    }>;
    onAdmission?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
  }>;
  insurance: Array<{
    sequence: number;
    focal: boolean;
    coverage: {
      reference: string; // Coverage/xxx
      display?: string;
    };
    businessArrangement?: string;
    preAuthRef?: string[];
  }>;
  item?: Array<{
    sequence: number;
    careTeamSequence?: number[];
    diagnosisSequence?: number[];
    procedureSequence?: number[];
    informationSequence?: number[];
    category?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    productOrService: {
      coding?: Array<{
        system?: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    modifier?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    programCode?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    servicedDate?: string;
    servicedPeriod?: {
      start?: string;
      end?: string;
    };
    locationCodeableConcept?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    quantity?: {
      value: number;
      comparator?: string;
      unit?: string;
      system?: string;
      code?: string;
    };
    unitPrice?: {
      value: number;
      currency?: string;
    };
    factor?: number;
    net?: {
      value: number;
      currency?: string;
    };
    udi?: Array<{
      reference: string;
    }>;
    bodySite?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    subSite?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    encounter?: Array<{
      reference: string;
    }>;
    detail?: Array<{
      sequence: number;
      category?: {
        coding?: Array<{
          system?: string;
          code?: string;
          display?: string;
        }>;
        text?: string;
      };
      productOrService: {
        coding?: Array<{
          system?: string;
          code: string;
          display?: string;
        }>;
        text?: string;
      };
      modifier?: Array<{
        coding?: Array<{
          system?: string;
          code?: string;
          display?: string;
        }>;
        text?: string;
      }>;
      quantity?: {
        value: number;
      };
      unitPrice?: {
        value: number;
        currency?: string;
      };
      factor?: number;
      net?: {
        value: number;
        currency?: string;
      };
      udi?: Array<{
        reference: string;
      }>;
      subDetail?: Array<{
        sequence: number;
        category?: {
          coding?: Array<{
            system?: string;
            code?: string;
            display?: string;
          }>;
          text?: string;
        };
        productOrService: {
          coding?: Array<{
            system?: string;
            code: string;
            display?: string;
          }>;
          text?: string;
        };
        modifier?: Array<{
          coding?: Array<{
            system?: string;
            code?: string;
            display?: string;
          }>;
          text?: string;
        }>;
        quantity?: {
          value: number;
        };
        unitPrice?: {
          value: number;
          currency?: string;
        };
        factor?: number;
        net?: {
          value: number;
          currency?: string;
        };
        udi?: Array<{
          reference: string;
        }>;
      }>;
    }>;
  }>;
  total?: Array<{
    category: {
      coding?: Array<{
        system?: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    amount: {
      value: number;
      currency?: string;
    };
  }>;
}

export interface FhirClaimResponse {
  resourceType: 'ClaimResponse';
  identifier?: Array<{
    system?: string;
    value: string;
  }>;
  status: 'active' | 'cancelled' | 'draft' | 'entered-in-error';
  type: {
    coding?: Array<{
      system?: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  use: 'claim' | 'preauthorization' | 'predetermination';
  patient: {
    reference: string;
    display?: string;
  };
  created: string; // DateTime
  insurer: {
    reference: string;
    display?: string;
  };
  requestor?: {
    reference: string;
    display?: string;
  };
  request: {
    reference: string; // Claim/xxx
    display?: string;
  };
  outcome: 'queued' | 'complete' | 'error' | 'partial';
  disposition?: string;
  preAuthRef?: string[];
  processNote?: Array<{
    type?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    text?: string;
  }>;
  item?: Array<{
    itemSequence: number;
    noteNumber?: number[];
    adjudication: Array<{
      category: {
        coding?: Array<{
          system?: string;
          code: string;
          display?: string;
        }>;
        text?: string;
      };
      reason?: {
        coding?: Array<{
          system?: string;
          code?: string;
          display?: string;
        }>;
        text?: string;
      };
      amount?: {
        value: number;
        currency?: string;
      };
    }>;
    detail?: Array<{
      detailSequence: number;
      noteNumber?: number[];
      adjudication: Array<{
        category: {
          coding?: Array<{
            system?: string;
            code: string;
            display?: string;
          }>;
          text?: string;
        };
        amount?: {
          value: number;
          currency?: string;
        };
      }>;
      subDetail?: Array<{
        subDetailSequence: number;
        noteNumber?: number[];
        adjudication: Array<{
          category: {
            coding?: Array<{
              system?: string;
              code: string;
              display?: string;
            }>;
            text?: string;
          };
          amount?: {
            value: number;
            currency?: string;
          };
        }>;
      }>;
    }>;
  }>;
  addItem?: Array<{
    itemSequence?: number[];
    detailSequence?: number[];
    subdetailSequence?: number[];
    productOrService: {
      coding?: Array<{
        system?: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    modifier?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    programCode?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    servicedDate?: string;
    servicedPeriod?: {
      start?: string;
      end?: string;
    };
    locationCodeableConcept?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    quantity?: {
      value: number;
    };
    unitPrice?: {
      value: number;
      currency?: string;
    };
    factor?: number;
    net?: {
      value: number;
      currency?: string;
    };
    bodySite?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    subSite?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    noteNumber?: number[];
    adjudication: Array<{
      category: {
        coding?: Array<{
          system?: string;
          code: string;
          display?: string;
        }>;
        text?: string;
      };
      amount?: {
        value: number;
        currency?: string;
      };
    }>;
  }>;
  total?: Array<{
    category: {
      coding?: Array<{
        system?: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    amount: {
      value: number;
      currency?: string;
    };
  }>;
  payment?: {
    type: {
      coding?: Array<{
        system?: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    adjustment?: {
      value: number;
      currency?: string;
    };
    adjustmentReason?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    date?: string;
    amount: {
      value: number;
      currency?: string;
    };
  };
  fundsReserve?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  formCode?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  form?: {
    contentType?: string;
    language?: string;
    data?: string;
    url?: string;
  };
  communicationRequest?: Array<{
    reference: string;
    display?: string;
  }>;
}

export class SatuSehatClient {
  private clientId: string;
  private clientSecret: string;
  private baseURL: string;
  private organizationId: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor() {
    this.clientId = process.env.SATUSEHAT_CLIENT_ID || '';
    this.clientSecret = process.env.SATUSEHAT_CLIENT_SECRET || '';
    this.baseURL = process.env.SATUSEHAT_BASE_URL || '';
    this.organizationId = process.env.SATUSEHAT_ORGANIZATION_ID || '';
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 1-minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    const res = await fetch(`${this.baseURL}/oauth2/v1/accesstoken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret
      }),
    });

    if (!res.ok) {
      throw new Error(`SatuSehat token error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    return this.accessToken!;
  }

  private async makeRequest<T = unknown>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.getAccessToken();
    const url = `${this.baseURL}/fhir-r4/v1${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);

    if (!res.ok) {
      let errorMessage = `SatuSehat API error: ${res.status} ${res.statusText}`;

      try {
        const errorBody = await res.text();

        // Try to parse as JSON to check for OperationOutcome
        try {
          const errorJson = JSON.parse(errorBody);

          // Check if it's an OperationOutcome
          if (errorJson.resourceType === 'OperationOutcome' && errorJson.issue?.length > 0) {
            // Extract the first issue's diagnostics or details
            const issue = errorJson.issue[0];
            const details = issue.diagnostics || issue.details?.text || issue.code;
            errorMessage = `SatuSehat Error: ${details} (${res.status})`;
          } else if (errorJson.message) {
            // Handle standard JSON error message
            errorMessage = `SatuSehat Error: ${errorJson.message} (${res.status})`;
          } else {
            // Fallback to raw body if JSON but not structured as expected
            errorMessage = `SatuSehat API error: ${res.status} ${res.statusText} - ${errorBody.substring(0, 200)}`;
          }
        } catch (e) {
          // Not JSON, append raw text (truncated if too long)
          errorMessage = `SatuSehat API error: ${res.status} ${res.statusText} - ${errorBody.substring(0, 200)}`;
        }
      } catch (e) {
        // Failed to read body
        console.error('Failed to read error body', e);
      }

      throw new Error(errorMessage);
    }

    return res.json() as Promise<T>;
  }

  // Organization Management
  async createOrganization(
    organization: FhirOrganization
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/Organization', organization);
  }

  async getOrganization(organizationId: string): Promise<Record<string, unknown>> {
    return this.makeRequest('GET', `/Organization/${organizationId}`);
  }

  // Location Management
  async createLocation(location: FhirLocation): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/Location', location);
  }

  async getLocation(locationId: string): Promise<Record<string, unknown>> {
    return this.makeRequest('GET', `/Location/${locationId}`);
  }

  // Practitioner Management
  async createPractitioner(
    practitioner: FhirPractitioner
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/Practitioner', practitioner);
  }

  async searchPractitioner(params: Record<string, string>): Promise<FhirBundle> {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest('GET', `/Practitioner?${queryString}`) as Promise<FhirBundle>;
  }

  // Patient Management
  async searchPatientByNIK(nik: string): Promise<FhirBundle> {
    const queryString = new URLSearchParams({
      'identifier': `https://fhir.kemkes.go.id/id/nik|${nik}`,
    }).toString();
    return this.makeRequest('GET', `/Patient?${queryString}`) as Promise<FhirBundle>;
  }

  async createPatient(patient: FhirPatient): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/Patient', patient);
  }

  async updatePatient(
    patientId: string,
    patient: FhirPatient
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('PUT', `/Patient/${patientId}`, patient);
  }

  async getPatient(patientId: string): Promise<Record<string, unknown>> {
    return this.makeRequest('GET', `/Patient/${patientId}`);
  }

  // Encounter Management
  async createEncounter(encounter: FhirEncounter): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/Encounter', encounter);
  }

  async updateEncounter(
    encounterId: string,
    encounter: FhirEncounter
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('PUT', `/Encounter/${encounterId}`, encounter);
  }

  // Condition Management
  async createCondition(condition: FhirCondition): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/Condition', condition);
  }

  async updateCondition(
    conditionId: string,
    condition: FhirCondition
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('PUT', `/Condition/${conditionId}`, condition);
  }

  // Observation Management
  async createObservation(observation: FhirObservation): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/Observation', observation);
  }

  async updateObservation(
    observationId: string,
    observation: FhirObservation
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('PUT', `/Observation/${observationId}`, observation);
  }

  // Medication Request Management
  async createMedicationRequest(
    medicationRequest: FhirMedicationRequest
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/MedicationRequest', medicationRequest);
  }

  async updateMedicationRequest(
    medicationRequestId: string,
    medicationRequest: FhirMedicationRequest
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('PUT', `/MedicationRequest/${medicationRequestId}`, medicationRequest);
  }

  // Service Request Management
  async createServiceRequest(
    serviceRequest: FhirServiceRequest
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/ServiceRequest', serviceRequest);
  }

  async updateServiceRequest(
    serviceRequestId: string,
    serviceRequest: FhirServiceRequest
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('PUT', `/ServiceRequest/${serviceRequestId}`, serviceRequest);
  }

  // Invoice Management (Billing)
  async createInvoice(invoice: FhirInvoice): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/Invoice', invoice);
  }

  async updateInvoice(
    invoiceId: string,
    invoice: FhirInvoice
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('PUT', `/Invoice/${invoiceId}`, invoice);
  }

  async getInvoice(invoiceId: string): Promise<Record<string, unknown>> {
    return this.makeRequest('GET', `/Invoice/${invoiceId}`);
  }

  // ChargeItem Management (Cost Items)
  async createChargeItem(chargeItem: FhirChargeItem): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/ChargeItem', chargeItem);
  }

  async updateChargeItem(
    chargeItemId: string,
    chargeItem: FhirChargeItem
  ): Promise<Record<string, unknown>> {
    return this.makeRequest('PUT', `/ChargeItem/${chargeItemId}`, chargeItem);
  }

  // Claim Management (BPJS Claims - Foundation for future use)
  async createClaim(claim: FhirClaim): Promise<Record<string, unknown>> {
    return this.makeRequest('POST', '/Claim', claim);
  }

  async getClaim(claimId: string): Promise<Record<string, unknown>> {
    return this.makeRequest('GET', `/Claim/${claimId}`);
  }

  async getClaimResponse(claimResponseId: string): Promise<Record<string, unknown>> {
    return this.makeRequest('GET', `/ClaimResponse/${claimResponseId}`);
  }
}
