import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsPDF } from 'jspdf';
import { clinicSettings } from '@/config/clinic';

type BillingData = {
  id: string;
  invoice_number: string;
  billing_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_status: string;
  payment_method: string | null;
  bpjs_claim_number: string | null;
  notes: string | null;
  patient: {
    full_name: string;
    medical_record_number: string;
    bpjs_number: string | null;
    phone: string;
    address: string;
  };
  doctor: {
    full_name: string;
  } | null;
  billing_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  payments: Array<{
    payment_date: string;
    amount: number;
    payment_method: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();

    // Fetch billing data with all related information
    const { data: billing, error } = await supabase
      .from('billings')
      .select(`
        id,
        invoice_number,
        billing_date,
        subtotal,
        discount,
        tax,
        total_amount,
        payment_status,
        payment_method,
        bpjs_claim_number,
        notes,
        patient:patients(
          full_name,
          medical_record_number,
          bpjs_number,
          phone,
          address
        ),
        doctor:users(
          full_name
        ),
        billing_items(
          description,
          quantity,
          unit_price,
          total_price
        ),
        payments(
          payment_date,
          amount,
          payment_method
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !billing) {
      return NextResponse.json(
        { error: 'Billing not found' },
        { status: 404 }
      );
    }

    const billingData = billing as unknown as BillingData;

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Helper function to add text with wrapping
    const addText = (text: string, x: number, y: number, maxWidth?: number) => {
      if (maxWidth) {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * 6);
      }
      doc.text(text, x, y);
      return y + 6;
    };

    // ==================== HEADER ====================
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(clinicSettings.info.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(clinicSettings.info.address, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`Telp: ${clinicSettings.info.phone}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // ==================== INVOICE TITLE ====================
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // ==================== INVOICE INFO ====================
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Left column - Invoice details
    const leftCol = 20;
    const rightCol = pageWidth / 2 + 10;

    doc.setFont('helvetica', 'bold');
    doc.text('No. Invoice:', leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(billingData.invoice_number || billingData.id.substring(0, 8).toUpperCase(), leftCol + 30, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', rightCol, yPos);
    doc.setFont('helvetica', 'normal');
    const statusMap: { [key: string]: string } = {
      pending: 'Belum Lunas',
      partial: 'Dibayar Sebagian',
      paid: 'Lunas',
      cancelled: 'Dibatalkan'
    };
    doc.text(statusMap[billingData.payment_status] || billingData.payment_status, rightCol + 20, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Tanggal:', leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    const invoiceDate = new Date(billingData.billing_date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(invoiceDate, leftCol + 30, yPos);

    if (billingData.doctor) {
      doc.setFont('helvetica', 'bold');
      doc.text('Dokter:', rightCol, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(billingData.doctor.full_name, rightCol + 20, yPos);
    }
    yPos += 12;

    // ==================== PATIENT INFO ====================
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI PASIEN', leftCol, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`Nama: ${billingData.patient.full_name}`, leftCol, yPos);
    yPos += 6;
    doc.text(`No. RM: ${billingData.patient.medical_record_number}`, leftCol, yPos);
    yPos += 6;

    if (billingData.patient.bpjs_number) {
      doc.text(`No. BPJS: ${billingData.patient.bpjs_number}`, leftCol, yPos);
      yPos += 6;
    }

    doc.text(`Telepon: ${billingData.patient.phone}`, leftCol, yPos);
    yPos += 6;

    const addressLines = doc.splitTextToSize(
      `Alamat: ${billingData.patient.address}`,
      pageWidth - 40
    );
    doc.text(addressLines, leftCol, yPos);
    yPos += (addressLines.length * 6) + 8;

    // ==================== BILLING ITEMS TABLE ====================
    doc.setFont('helvetica', 'bold');
    doc.text('RINCIAN TAGIHAN', leftCol, yPos);
    yPos += 7;

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(leftCol, yPos - 5, pageWidth - 40, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('Deskripsi', leftCol + 2, yPos);
    doc.text('Qty', pageWidth - 90, yPos);
    doc.text('Harga Satuan', pageWidth - 70, yPos);
    doc.text('Total', pageWidth - 30, yPos, { align: 'right' });
    yPos += 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    billingData.billing_items.forEach((item) => {
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      const descLines = doc.splitTextToSize(item.description, 90);
      doc.text(descLines, leftCol + 2, yPos);
      doc.text(item.quantity.toString(), pageWidth - 90, yPos);
      doc.text(`Rp ${item.unit_price.toLocaleString('id-ID')}`, pageWidth - 70, yPos);
      doc.text(`Rp ${item.total_price.toLocaleString('id-ID')}`, pageWidth - 22, yPos, { align: 'right' });
      yPos += Math.max(descLines.length * 6, 6) + 2;
    });

    yPos += 5;

    // ==================== TOTALS ====================
    const totalsX = pageWidth - 80;
    doc.line(totalsX - 5, yPos, pageWidth - 20, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, yPos);
    doc.text(`Rp ${billingData.subtotal.toLocaleString('id-ID')}`, pageWidth - 22, yPos, { align: 'right' });
    yPos += 6;

    if (billingData.discount > 0) {
      doc.text('Diskon:', totalsX, yPos);
      doc.text(`-Rp ${billingData.discount.toLocaleString('id-ID')}`, pageWidth - 22, yPos, { align: 'right' });
      yPos += 6;
    }

    doc.text('Pajak (0%):', totalsX, yPos);
    doc.text(`Rp ${billingData.tax.toLocaleString('id-ID')}`, pageWidth - 22, yPos, { align: 'right' });
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.line(totalsX - 5, yPos - 2, pageWidth - 20, yPos - 2);
    doc.text('TOTAL:', totalsX, yPos);
    doc.text(`Rp ${billingData.total_amount.toLocaleString('id-ID')}`, pageWidth - 22, yPos, { align: 'right' });
    yPos += 10;

    // ==================== PAYMENTS ====================
    if (billingData.payments.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Pembayaran:', totalsX, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      billingData.payments.forEach((payment) => {
        const paymentDate = new Date(payment.payment_date).toLocaleDateString('id-ID');
        const methodMap: { [key: string]: string } = {
          cash: 'Tunai',
          qris: 'QRIS',
          transfer: 'Transfer',
          debit_card: 'Kartu Debit',
          credit_card: 'Kartu Kredit',
          e_wallet: 'E-Wallet',
          bpjs: 'BPJS'
        };
        const method = methodMap[payment.payment_method] || payment.payment_method;

        doc.text(`${paymentDate} (${method})`, totalsX, yPos);
        doc.text(`Rp ${payment.amount.toLocaleString('id-ID')}`, pageWidth - 22, yPos, { align: 'right' });
        yPos += 6;
      });
    }

    // ==================== BPJS INFO ====================
    if (billingData.bpjs_claim_number) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(`No. Klaim BPJS: ${billingData.bpjs_claim_number}`, leftCol, yPos);
      yPos += 6;
    }

    // ==================== NOTES ====================
    if (billingData.notes) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Catatan:', leftCol, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(billingData.notes, pageWidth - 40);
      doc.text(notesLines, leftCol, yPos);
      yPos += (notesLines.length * 6);
    }

    // ==================== FOOTER ====================
    yPos += 15;
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Terima kasih atas kepercayaan Anda.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text('Dokumen ini dicetak otomatis dan sah tanpa tanda tangan.', pageWidth / 2, yPos, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${billingData.invoice_number || billingData.id.substring(0, 8)}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
