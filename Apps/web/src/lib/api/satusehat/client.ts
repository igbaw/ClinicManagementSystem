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
    relationship?: Array<{ coding: Array<{ code: string }> }>;
    name?: { text: string };
    telecom?: Array<{ system: string; value: string }>;
  }>;
  communication?: Array<{
    language: { coding: Array<{ code: string }> };
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

  private async makeRequest(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<unknown> {
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
      const errorBody = await res.text();
      throw new Error(
        `SatuSehat API error: ${res.status} ${res.statusText} - ${errorBody}`
      );
    }

    return res.json();
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
}
