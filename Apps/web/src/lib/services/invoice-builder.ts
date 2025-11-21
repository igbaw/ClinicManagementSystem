/**
 * Invoice Builder Service
 * Converts local billing records to FHIR Invoice format for SatuSehat submission
 *
 * Compliance:
 * - FHIR R4 specification for Invoice resource
 * - Indonesian healthcare billing standards
 * - SatuSehat API requirements
 * - 0% VAT/PPN for healthcare services (tax exemption)
 */

import { FhirInvoice, FhirChargeItem } from '@/lib/api/satusehat/client';

/**
 * Billing and related data from local database
 */
export interface BillingData {
  id: string;
  billing_id: string;
  patient_id: string;
  billing_date: string;
  subtotal: number;
  discount: number;
  tax: number; // Should be 0 for healthcare in Indonesia
  total_amount: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'cancelled';
  payment_method?: string;
  notes?: string;
  created_by: string;
}

/**
 * Billing item line
 */
export interface BillingItemData {
  id: string;
  billing_id: string;
  item_type: 'consultation' | 'procedure' | 'medication' | 'lab_test';
  item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

/**
 * Patient data for invoice subject reference
 */
export interface PatientData {
  id: string;
  full_name: string;
  nik: string;
  medical_record_number: string;
  ihs_number?: string; // SatuSehat IHS number if available
}

/**
 * Clinic/Organization data for invoice issuer reference
 */
export interface ClinicData {
  name: string;
  code: string; // IHS or facility code
  address?: string;
  phone?: string;
  email?: string;
  satusehat_organization_id?: string; // SatuSehat Organization resource ID
}

/**
 * User/Submitter data
 */
export interface SubmitterData {
  id: string;
  email: string;
  full_name: string;
}

/**
 * Invoice Builder class for converting billings to FHIR Invoice
 */
export class InvoiceBuilder {
  private clinicData: ClinicData;
  private submitterData: SubmitterData;

  constructor(clinicData: ClinicData, submitterData: SubmitterData) {
    this.clinicData = clinicData;
    this.submitterData = submitterData;
  }

  /**
   * Build FHIR Invoice from local billing record
   */
  buildInvoice(
    billing: BillingData,
    patient: PatientData,
    billingItems: BillingItemData[]
  ): FhirInvoice {
    const invoiceDate = new Date(billing.billing_date).toISOString();

    // Generate invoice number based on date and ID (format: INV-YYYYMMDD-UUID)
    const invoiceNumber = this.generateInvoiceNumber(billing.billing_date, billing.billing_id);

    return {
      resourceType: 'Invoice',

      // Invoice identification
      identifier: [
        {
          system: 'http://example.org/billing-system',
          value: invoiceNumber,
        },
        {
          system: 'http://example.org/billing-id',
          value: billing.billing_id,
        },
      ],

      // Invoice status (will be draft, submitted to SatuSehat as 'issued')
      status: 'draft' as const,

      // Invoice type - healthcare service billing
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/invoice-type',
            code: 'health-service-invoice',
            display: 'Health Service Invoice',
          },
        ],
        text: 'Healthcare Service Invoice',
      },

      // Subject: the patient
      subject: {
        reference: patient.ihs_number
          ? `Patient/${patient.ihs_number}`
          : `Patient/${patient.id}`,
        display: patient.full_name,
      },

      // Recipient: the patient (they receive the invoice)
      recipient: {
        reference: patient.ihs_number
          ? `Patient/${patient.ihs_number}`
          : `Patient/${patient.id}`,
        display: patient.full_name,
      },

      // Invoice date
      date: invoiceDate,

      // Participants involved
      participant: [
        {
          role: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/invoice-participantrole',
                code: 'issuer',
                display: 'Issuer',
              },
            ],
          },
          actor: {
            reference: this.clinicData.satusehat_organization_id
              ? `Organization/${this.clinicData.satusehat_organization_id}`
              : 'Organization/unknown',
            display: this.clinicData.name,
          },
        },
      ],

      // Issuer: the clinic/organization
      issuer: {
        reference: this.clinicData.satusehat_organization_id
          ? `Organization/${this.clinicData.satusehat_organization_id}`
          : 'Organization/unknown',
        display: this.clinicData.name,
      },

      // Line items: billing items converted to invoice items
      lineItem: this.buildLineItems(billingItems),

      // Total price component
      totalPriceComponent: this.buildTotalPriceComponents(billing),

      // Total amounts
      totalNet: {
        value: this.roundCurrency(billing.subtotal),
        currency: 'IDR',
      },

      totalGross: {
        value: this.roundCurrency(billing.total_amount),
        currency: 'IDR',
      },

      // Payment terms
      paymentTerms: billing.payment_method
        ? `Payment method: ${billing.payment_method}`
        : 'Due upon receipt',

      // Notes
      note: billing.notes
        ? [{ text: billing.notes }]
        : [],
    };
  }

  /**
   * Build line items from billing items
   */
  private buildLineItems(
    billingItems: BillingItemData[]
  ): FhirInvoice['lineItem'] {
    return billingItems.map((item, index) => ({
      sequence: index + 1,

      // Code for the service/item
      chargeItemCodeableConcept: {
        coding: [
          {
            system: this.getItemTypeSystem(item.item_type),
            code: this.getItemTypeCode(item.item_type),
            display: item.description,
          },
        ],
        text: item.description,
      },

      // Price components for this line item
      priceComponent: [
        {
          type: 'base' as const,
          code: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/invoice-pricecomponenttype',
                code: 'base',
                display: 'Base Price',
              },
            ],
          },
          factor: item.quantity,
          amount: {
            value: this.roundCurrency(item.unit_price),
            currency: 'IDR',
          },
        },
      ],
    }));
  }

  /**
   * Build total price components
   * In Indonesia, healthcare is exempt from VAT (0% PPN)
   */
  private buildTotalPriceComponents(
    billing: BillingData
  ): FhirInvoice['totalPriceComponent'] {
    const components: FhirInvoice['totalPriceComponent'] = [];

    // Subtotal (base)
    components.push({
      type: 'base' as const,
      code: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/invoice-pricecomponenttype',
            code: 'base',
            display: 'Subtotal',
          },
        ],
      },
      amount: {
        value: this.roundCurrency(billing.subtotal),
        currency: 'IDR',
      },
    });

    // Discount (if any)
    if (billing.discount > 0) {
      components.push({
        type: 'discount' as const,
        code: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/invoice-pricecomponenttype',
              code: 'discount',
              display: 'Discount',
            },
          ],
        },
        amount: {
          value: this.roundCurrency(-billing.discount), // Negative amount for discount
          currency: 'IDR',
        },
      });
    }

    // Tax (0% for healthcare in Indonesia)
    // Even if tax is 0, we include it for clarity
    if (billing.tax >= 0) {
      components.push({
        type: 'tax' as const,
        code: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/invoice-pricecomponenttype',
              code: 'tax',
              display: 'Tax (PPN) - Healthcare Exempt (0%)',
            },
          ],
        },
        amount: {
          value: 0, // No tax for healthcare
          currency: 'IDR',
        },
      });
    }

    return components;
  }

  /**
   * Build charge items (detailed cost tracking)
   * ChargeItem tracks individual services/items for cost analysis
   */
  buildChargeItems(
    billing: BillingData,
    patient: PatientData,
    billingItems: BillingItemData[],
    encounterReference?: string
  ): FhirChargeItem[] {
    return billingItems.map((item, index) => ({
      resourceType: 'ChargeItem' as const,

      // Status: billable (ready for billing)
      status: 'billable' as const,

      // Reference to the code for this charge item
      code: {
        coding: [
          {
            system: this.getItemTypeSystem(item.item_type),
            code: this.getItemTypeCode(item.item_type),
            display: item.description,
          },
        ],
        text: item.description,
      },

      // Subject: the patient
      subject: {
        reference: patient.ihs_number
          ? `Patient/${patient.ihs_number}`
          : `Patient/${patient.id}`,
        display: patient.full_name,
      },

      // Context: the encounter/appointment if available
      context: encounterReference
        ? {
          reference: encounterReference,
        }
        : undefined,

      // When the service occurred
      occurrenceDateTime: billing.billing_date,

      // Performer: the clinic
      performer: [
        {
          function: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/providerqualification',
                code: 'provider',
                display: 'Healthcare Provider',
              },
            ],
          },
          actor: {
            reference: this.clinicData.satusehat_organization_id
              ? `Organization/${this.clinicData.satusehat_organization_id}`
              : 'Organization/unknown',
            display: this.clinicData.name,
          },
        },
      ],

      // Pricing information
      priceComponent: [
        {
          type: 'base' as const,
          code: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/invoice-pricecomponenttype',
                code: 'base',
                display: 'Unit Price',
              },
            ],
          },
          factor: item.quantity,
          amount: {
            value: this.roundCurrency(item.total_price),
            currency: 'IDR',
          },
        },
      ],

      // Quantity
      quantity: {
        value: item.quantity,
      },

      // Unit price
      unitPriceComponent: [
        {
          type: 'base' as const,
          code: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/invoice-pricecomponenttype',
                code: 'base',
                display: 'Base Price',
              },
            ],
          },
          amount: {
            value: this.roundCurrency(item.unit_price),
            currency: 'IDR',
          },
        },
      ],

      // Note
      note: [
        {
          text: `Item ${index + 1}: ${item.description}`,
        },
      ],
    }));
  }

  /**
   * Get the coding system for item type
   */
  private getItemTypeSystem(itemType: string): string {
    switch (itemType) {
      case 'consultation':
        return 'http://terminology.hl7.org/CodeSystem/service-type';
      case 'procedure':
        return 'http://snomed.info/sct';
      case 'medication':
        return 'http://snomed.info/sct';
      case 'lab_test':
        return 'http://snomed.info/sct';
      default:
        return 'http://example.org/service-type';
    }
  }

  /**
   * Get the coding code for item type
   */
  private getItemTypeCode(itemType: string): string {
    switch (itemType) {
      case 'consultation':
        return '1';
      case 'procedure':
        return '387713003';
      case 'medication':
        return '373784005';
      case 'lab_test':
        return '108252007';
      default:
        return 'other';
    }
  }

  /**
   * Generate invoice number (format: INV-YYYYMMDD-SEQUENCE)
   */
  private generateInvoiceNumber(billingDate: string, billingId: string): string {
    const date = new Date(billingDate);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    // Use first 8 characters of UUID as sequence
    const sequence = billingId.substring(0, 8).toUpperCase();
    return `INV-${dateStr}-${sequence}`;
  }

  /**
   * Round currency to 2 decimal places
   */
  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Validate invoice before submission
   */
  validateInvoice(invoice: FhirInvoice): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!invoice.resourceType || invoice.resourceType !== 'Invoice') {
      errors.push('Invalid resource type');
    }

    if (!invoice.identifier || invoice.identifier.length === 0) {
      errors.push('Invoice must have at least one identifier');
    }

    if (!invoice.subject?.reference) {
      errors.push('Invoice must have a subject (patient) reference');
    }

    if (!invoice.issuer?.reference) {
      errors.push('Invoice must have an issuer (organization) reference');
    }

    if (!invoice.lineItem || invoice.lineItem.length === 0) {
      errors.push('Invoice must have at least one line item');
    }

    if (!invoice.totalGross || invoice.totalGross.value <= 0) {
      errors.push('Invoice total must be greater than 0');
    }

    if (
      !invoice.totalNet ||
      invoice.totalNet.value < 0
    ) {
      errors.push('Invoice subtotal cannot be negative');
    }

    // Validate line items
    if (invoice.lineItem) {
      invoice.lineItem.forEach((item, index) => {
        if (!item.chargeItemCodeableConcept && !item.chargeItemReference) {
          errors.push(`Line item ${index + 1} must have either chargeItemCodeableConcept or chargeItemReference`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Helper function to create invoice builder with default clinic data
 */
export function createInvoiceBuilder(
  clinicName: string = 'Default Clinic',
  clinicCode: string = 'DEFAULT-CLINIC',
  submitter: SubmitterData = {
    id: 'system',
    email: 'system@clinic.local',
    full_name: 'System User',
  }
): InvoiceBuilder {
  return new InvoiceBuilder(
    {
      name: clinicName,
      code: clinicCode,
    },
    submitter
  );
}
