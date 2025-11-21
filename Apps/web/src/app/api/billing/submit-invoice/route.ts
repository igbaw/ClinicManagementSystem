/**
 * API Route: Submit Invoice to SatuSehat
 * POST /api/billing/submit-invoice
 *
 * Purpose:
 * - Convert local billing record to FHIR Invoice format
 * - Submit to SatuSehat API
 * - Create database records and queue entries for async processing
 *
 * Request Body:
 * {
 *   billingId: UUID
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   invoiceResourceId?: string (if successful)
 *   submissionId: UUID
 *   queueId: UUID
 *   message: string
 *   errors?: string[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SatuSehatClient, FhirInvoice } from '@/lib/api/satusehat/client';
import { InvoiceBuilder } from '@/lib/services/invoice-builder';

interface SubmitInvoiceRequest {
  billingId: string;
}

interface SubmitInvoiceResponse {
  success: boolean;
  invoiceResourceId?: string;
  submissionId: string;
  queueId: string;
  message: string;
  errors?: string[];
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SubmitInvoiceResponse>> {
  try {
    // 1. Authenticate user
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          submissionId: '',
          queueId: '',
          message: 'Unauthorized',
          errors: ['User not authenticated'],
        },
        { status: 401 }
      );
    }

    // 2. Parse request
    const { billingId } = (await request.json()) as SubmitInvoiceRequest;

    if (!billingId) {
      return NextResponse.json(
        {
          success: false,
          submissionId: '',
          queueId: '',
          message: 'Invalid request',
          errors: ['billingId is required'],
        },
        { status: 400 }
      );
    }

    // 3. Fetch billing data and related records
    const { data: billingData, error: billingError } = await supabase
      .from('billings')
      .select('*')
      .eq('id', billingId)
      .single();

    if (billingError || !billingData) {
      return NextResponse.json(
        {
          success: false,
          submissionId: '',
          queueId: '',
          message: 'Billing not found',
          errors: [billingError?.message || 'Billing record not found'],
        },
        { status: 404 }
      );
    }

    // 4. Fetch billing items
    const { data: billingItems, error: itemsError } = await supabase
      .from('billing_items')
      .select('*')
      .eq('billing_id', billingId);

    if (itemsError) {
      return NextResponse.json(
        {
          success: false,
          submissionId: '',
          queueId: '',
          message: 'Failed to fetch billing items',
          errors: [itemsError.message],
        },
        { status: 500 }
      );
    }

    if (!billingItems || billingItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          submissionId: '',
          queueId: '',
          message: 'No billing items found',
          errors: ['Billing must have at least one item'],
        },
        { status: 400 }
      );
    }

    // 5. Fetch patient data
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', billingData.patient_id)
      .single();

    if (patientError || !patientData) {
      return NextResponse.json(
        {
          success: false,
          submissionId: '',
          queueId: '',
          message: 'Patient not found',
          errors: [patientError?.message || 'Patient not found'],
        },
        { status: 404 }
      );
    }

    // 6. Fetch clinic data (from SatuSehat organization table)
    const { data: clinicData } = await supabase
      .from('satusehat_organization')
      .select('*')
      .limit(1)
      .single();

    const clinicInfo = clinicData || {
      clinic_name: 'Default Clinic',
      clinic_code: 'DEFAULT-CLINIC',
    };

    // 7. Fetch submitter data
    const { data: submitterData } = await supabase
      .from('users')
      .select('id, email, raw_user_meta_data')
      .eq('id', user.id)
      .single();

    // 8. Build FHIR Invoice using InvoiceBuilder
    const invoiceBuilder = new InvoiceBuilder(
      {
        name: clinicInfo.clinic_name || 'Default Clinic',
        code: clinicInfo.clinic_code || 'DEFAULT-CLINIC',
        satusehat_organization_id: clinicData?.organization_resource_id,
      },
      {
        id: user.id,
        email: user.email || '',
        full_name:
          submitterData?.raw_user_meta_data?.full_name || 'System User',
      }
    );

    const invoice = invoiceBuilder.buildInvoice(
      {
        id: billingData.id,
        billing_id: billingData.id,
        patient_id: billingData.patient_id,
        billing_date: billingData.billing_date,
        subtotal: billingData.subtotal,
        discount: billingData.discount || 0,
        tax: billingData.tax || 0,
        total_amount: billingData.total_amount,
        payment_status: billingData.payment_status,
        payment_method: billingData.payment_method,
        notes: billingData.notes,
        created_by: billingData.created_by,
      },
      {
        id: patientData.id,
        full_name: patientData.full_name,
        nik: patientData.nik,
        medical_record_number: patientData.medical_record_number,
        ihs_number: patientData.ihs_number,
      },
      billingItems.map((item) => ({
        id: item.id,
        billing_id: item.billing_id,
        item_type: item.item_type,
        item_id: item.item_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        created_at: item.created_at,
      }))
    );

    // 9. Validate invoice
    const validation = invoiceBuilder.validateInvoice(invoice);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          submissionId: '',
          queueId: '',
          message: 'Invoice validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // 10. Create satusehat_submissions record
    const { data: submissionData, error: submissionError } = await supabase
      .from('satusehat_submissions')
      .insert({
        resource_type: 'Invoice',
        local_id: billingData.id,
        resource_id: null, // Will be populated after successful submission
        submission_status: 'pending',
        request_payload: invoice,
        response_payload: null,
        error_message: null,
        http_status_code: null,
        submitted_at: null,
        submitted_by: user.id,
        retry_count: 0,
        last_retry_at: null,
      })
      .select('id')
      .single();

    if (submissionError || !submissionData) {
      return NextResponse.json(
        {
          success: false,
          submissionId: '',
          queueId: '',
          message: 'Failed to create submission record',
          errors: [submissionError?.message || 'Database error'],
        },
        { status: 500 }
      );
    }

    // 11. Create satusehat_queue entry (automatically triggers via trigger)
    // The trigger in the migration automatically creates a queue entry
    // But we can fetch it to return to client
    const { data: queueData } = await supabase
      .from('satusehat_queue')
      .select('id')
      .eq('submission_id', submissionData.id)
      .single();

    const queueId = queueData?.id || '';

    // 12. Create satusehat_invoices record to link billing to invoice resource
    const invoiceResourceId = `Invoice/${Date.now()}-${billingData.id.substring(0, 8)}`;

    const { error: invoiceRecordError } = await supabase
      .from('satusehat_invoices')
      .insert({
        billing_id: billingData.id,
        invoice_resource_id: invoiceResourceId,
        patient_id: billingData.patient_id,
        organization_id: clinicData?.id,
        invoice_status: 'draft',
        total_net: billingData.subtotal,
        total_tax: billingData.tax || 0,
        total_gross: billingData.total_amount,
        currency: 'IDR',
        invoice_date: billingData.billing_date,
        submission_id: submissionData.id,
        submitted_at: null,
        submitted_by: user.id,
      });

    if (invoiceRecordError) {
      // Non-critical error - submission is already created
      console.error('Failed to create invoice record:', invoiceRecordError);
    }

    // 13. Log sync event for audit trail
    await supabase.from('satusehat_sync_events').insert({
      event_type: 'invoice_submission_queued',
      resource_type: 'Invoice',
      resource_id: invoiceResourceId,
      details: {
        billing_id: billingData.id,
        patient_id: billingData.patient_id,
        total_amount: billingData.total_amount,
        submission_id: submissionData.id,
        queue_id: queueId,
      },
      user_id: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        invoiceResourceId,
        submissionId: submissionData.id,
        queueId,
        message:
          'Invoice submitted successfully and queued for processing with SatuSehat',
      },
      { status: 202 } // 202 Accepted - async processing
    );
  } catch (error) {
    console.error('Error submitting invoice:', error);
    return NextResponse.json(
      {
        success: false,
        submissionId: '',
        queueId: '',
        message: 'Internal server error',
        errors: [
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/submit-invoice/:submissionId
 * Check submission status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get submission ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        {
          success: false,
          message: 'submissionId query parameter is required',
        },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Check user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch submission status
    const { data: submission, error } = await supabase
      .from('satusehat_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (error || !submission) {
      return NextResponse.json(
        {
          success: false,
          message: 'Submission not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        resource_type: submission.resource_type,
        resource_id: submission.resource_id,
        submission_status: submission.submission_status,
        error_message: submission.error_message,
        http_status_code: submission.http_status_code,
        submitted_at: submission.submitted_at,
        retry_count: submission.retry_count,
        created_at: submission.created_at,
        updated_at: submission.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching submission status:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
