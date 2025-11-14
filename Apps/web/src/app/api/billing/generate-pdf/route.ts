/**
 * Invoice PDF Generation Endpoint
 * POST /api/billing/generate-pdf
 *
 * Generates PDF invoices and optionally stores them in Supabase Storage
 * Compliance: 10-year retention, Indonesian healthcare standards
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { InvoicePdfGenerator } from '@/lib/services/invoice-pdf-generator';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { billingId, storePdf = true } = await request.json();

    if (!billingId) {
      return NextResponse.json(
        { error: 'Missing required field: billingId' },
        { status: 400 }
      );
    }

    // Fetch billing record with items and patient info
    const { data: billing, error: billingError } = await supabase
      .from('billings')
      .select(
        `
        id,
        billing_date,
        subtotal,
        discount,
        tax,
        total_amount,
        payment_status,
        payment_method,
        notes,
        patient_id,
        created_by,
        patients (
          id,
          full_name,
          nik,
          medical_record_number,
          address
        )
      `
      )
      .eq('id', billingId)
      .single();

    if (billingError || !billing) {
      return NextResponse.json(
        { error: 'Billing record not found' },
        { status: 404 }
      );
    }

    // Fetch billing items
    const { data: billingItems, error: itemsError } = await supabase
      .from('billing_items')
      .select('*')
      .eq('billing_id', billingId);

    if (itemsError || !billingItems) {
      return NextResponse.json(
        { error: 'Failed to fetch billing items' },
        { status: 500 }
      );
    }

    // Fetch clinic configuration
    const clinicConfig = {
      name: 'Clinic Name', // From environment or database
      code: process.env.NEXT_PUBLIC_CLINIC_CODE || 'CLINIC001',
      address: 'Clinic Address',
      phone: 'Clinic Phone',
      email: 'clinic@example.com',
    };

    // Fetch user (submitter) info
    const { data: userRecord } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', user.id)
      .single();

    // Prepare data for PDF generation
    const invoiceData = {
      invoiceNumber: `INV-${new Date(billing.billing_date).toISOString().split('T')[0].replace(/-/g, '')}-${billing.id.slice(0, 8).toUpperCase()}`,
      invoiceDate: billing.billing_date,
      clinicName: clinicConfig.name,
      clinicCode: clinicConfig.code,
      clinicAddress: clinicConfig.address,
      clinicPhone: clinicConfig.phone,
      clinicEmail: clinicConfig.email,
      patientName: billing.patients.full_name,
      patientNik: billing.patients.nik,
      patientMrn: billing.patients.medical_record_number,
      patientAddress: billing.patients.address,
      lineItems: billingItems.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
      })),
      subtotal: billing.subtotal,
      discount: billing.discount,
      tax: billing.tax || 0, // Should be 0 for healthcare in Indonesia
      total: billing.total_amount,
      currency: 'IDR',
      paymentStatus: billing.payment_status,
      paymentMethod: billing.payment_method,
      notes: billing.notes,
      submitterName: userRecord?.full_name || user.email || 'Unknown',
      submitterEmail: userRecord?.email || user.email,
    };

    // Generate PDF
    const generator = new InvoicePdfGenerator();
    const pdfBuffer = await generator.generatePdf(invoiceData);

    // Store PDF if requested
    let pdfDocumentId = null;
    if (storePdf) {
      const fileName = `invoice-${invoiceData.invoiceNumber}.pdf`;
      const filePath = `invoices/${new Date().getFullYear()}/${billing.patient_id}/${fileName}`;

      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('invoice_documents')
        .upload(filePath, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false,
        });

      if (storageError) {
        // Log error but don't fail - PDF was generated successfully
        console.error('Storage upload error:', storageError);
      } else {
        // Create invoice_documents record for tracking
        const { data: docRecord, error: docError } = await supabase
          .from('invoice_documents')
          .insert({
            billing_id: billingId,
            patient_id: billing.patient_id,
            document_type: 'invoice',
            file_name: fileName,
            file_path: filePath,
            file_size: pdfBuffer.length,
            content_type: 'application/pdf',
            storage_path: filePath,
            access_count: 0,
            last_accessed_at: null,
            retention_until: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString(),
            uploaded_by: user.id,
            metadata: {
              invoice_number: invoiceData.invoiceNumber,
              patient_name: invoiceData.patientName,
              clinic_name: invoiceData.clinicName,
            },
          })
          .select()
          .single();

        if (!docError && docRecord) {
          pdfDocumentId = docRecord.id;

          // Create or update satusehat_invoice link if exists
          const { data: satuseatInvoice } = await supabase
            .from('satusehat_invoices')
            .select('id')
            .eq('billing_id', billingId)
            .single();

          if (satuseatInvoice) {
            await supabase
              .from('satusehat_invoices')
              .update({
                document_id: pdfDocumentId,
              })
              .eq('id', satuseatInvoice.id);
          }
        }
      }
    }

    // Return PDF as response
    const response = new NextResponse(pdfBuffer);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`);
    response.headers.set('Content-Length', pdfBuffer.length.toString());

    // Add metadata headers
    if (pdfDocumentId) {
      response.headers.set('X-Document-Id', pdfDocumentId);
    }

    return response;
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/generate-pdf?billingId=uuid&action=download|preview
 *
 * Download or preview a generated PDF invoice
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const billingId = searchParams.get('billingId');
    const documentId = searchParams.get('documentId');
    const action = searchParams.get('action') || 'download';

    if (!billingId && !documentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: billingId or documentId' },
        { status: 400 }
      );
    }

    // Fetch invoice document metadata
    let docRecord;

    if (documentId) {
      const { data } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      docRecord = data;
    } else {
      const { data } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('billing_id', billingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      docRecord = data;
    }

    if (!docRecord) {
      return NextResponse.json(
        { error: 'Invoice document not found' },
        { status: 404 }
      );
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('invoice_documents')
      .download(docRecord.file_path);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: 'Failed to retrieve invoice document' },
        { status: 404 }
      );
    }

    // Update access count and last accessed time
    await supabase
      .from('invoice_documents')
      .update({
        access_count: (docRecord.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', docRecord.id);

    // Log access for audit trail
    await supabase
      .from('billing_access_logs')
      .insert({
        user_id: user.id,
        document_id: docRecord.id,
        billing_id: docRecord.billing_id,
        patient_id: docRecord.patient_id,
        action: action,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        access_purpose: 'document_retrieval',
        timestamp: new Date().toISOString(),
      });

    // Return file
    const response = new NextResponse(fileData);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set(
      'Content-Disposition',
      action === 'preview' ? 'inline' : `attachment; filename="${docRecord.file_name}"`
    );
    response.headers.set('Content-Length', fileData.size.toString());

    return response;
  } catch (error) {
    console.error('PDF retrieval error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
