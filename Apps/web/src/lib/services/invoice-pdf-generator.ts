/**
 * Invoice PDF Generator Service
 * Generates PDF invoices from billing records with FHIR compliance
 *
 * Compliance:
 * - Indonesian healthcare billing format
 * - 10-year retention requirement
 * - FHIR resource reference compatibility
 * - Accessibility standards
 */

import { jsPDF, jsPDFOptions } from 'jspdf';
import { FhirInvoice } from '@/lib/api/satusehat/client';

/**
 * Invoice data for PDF generation
 */
export interface InvoicePdfData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;

  // Clinic information
  clinicName: string;
  clinicCode: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;

  // Patient information
  patientName: string;
  patientNik: string;
  patientMrn: string;
  patientAddress?: string;

  // Line items
  lineItems: LineItemData[];

  // Financial summary
  subtotal: number;
  discount: number;
  tax: number; // Usually 0 for healthcare in Indonesia
  total: number;
  currency: string; // e.g., 'IDR'

  // Payment information
  paymentStatus: 'pending' | 'partial' | 'paid' | 'cancelled';
  paymentMethod?: string;

  // Notes
  notes?: string;

  // Submitter information
  submitterName: string;
  submitterEmail: string;
}

export interface LineItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Invoice PDF Generator class
 */
export class InvoicePdfGenerator {
  private docWidth: number = 210; // A4 width in mm
  private docHeight: number = 297; // A4 height in mm
  private marginLeft: number = 15;
  private marginRight: number = 15;
  private marginTop: number = 15;
  private marginBottom: number = 15;
  private contentWidth: number;

  constructor() {
    this.contentWidth = this.docWidth - this.marginLeft - this.marginRight;
  }

  /**
   * Generate PDF from invoice data
   */
  async generatePdf(invoiceData: InvoicePdfData): Promise<Buffer> {
    const options: jsPDFOptions = {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };

    const pdf = new jsPDF(options);

    let currentY = this.marginTop;

    // Header
    currentY = this.addHeader(pdf, invoiceData, currentY);

    // Clinic and Patient Info
    currentY = this.addClinicPatientInfo(pdf, invoiceData, currentY);
    currentY += 3; // Add spacing

    // Invoice Details
    currentY = this.addInvoiceDetails(pdf, invoiceData, currentY);
    currentY += 3; // Add spacing

    // Line Items Table
    currentY = this.addLineItemsTable(pdf, invoiceData, currentY);
    currentY += 3; // Add spacing

    // Financial Summary
    currentY = this.addFinancialSummary(pdf, invoiceData, currentY);
    currentY += 5; // Add spacing

    // Payment Information
    currentY = this.addPaymentInfo(pdf, invoiceData, currentY);
    currentY += 5; // Add spacing

    // Notes
    if (invoiceData.notes) {
      currentY = this.addNotes(pdf, invoiceData.notes, currentY);
    }

    // Footer
    this.addFooter(pdf, invoiceData);

    // Convert to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    return pdfBuffer;
  }

  /**
   * Add header with invoice title and number
   */
  private addHeader(pdf: jsPDF, data: InvoicePdfData, startY: number): number {
    let y = startY;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE', this.docWidth / 2, y, { align: 'center' });
    y += 10;

    // Invoice number
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice #: ${data.invoiceNumber}`, this.docWidth / 2, y, { align: 'center' });
    y += 5;

    // Divider line
    pdf.setDrawColor(200);
    pdf.line(this.marginLeft, y, this.docWidth - this.marginRight, y);
    y += 3;

    return y;
  }

  /**
   * Add clinic and patient information
   */
  private addClinicPatientInfo(pdf: jsPDF, data: InvoicePdfData, startY: number): number {
    let y = startY;

    // Two column layout
    const colWidth = (this.contentWidth - 10) / 2;

    // Clinic Info (Left)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('From:', this.marginLeft, y);
    y += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(data.clinicName, this.marginLeft, y);
    y += 4;

    if (data.clinicCode) {
      pdf.text(`Code: ${data.clinicCode}`, this.marginLeft, y);
      y += 4;
    }

    if (data.clinicAddress) {
      const clinicAddressLines = pdf.splitTextToSize(data.clinicAddress, colWidth);
      pdf.text(clinicAddressLines, this.marginLeft, y);
      y += clinicAddressLines.length * 3;
    }

    if (data.clinicPhone) {
      pdf.text(`Phone: ${data.clinicPhone}`, this.marginLeft, y);
      y += 3;
    }

    if (data.clinicEmail) {
      pdf.text(`Email: ${data.clinicEmail}`, this.marginLeft, y);
      y += 3;
    }

    // Patient Info (Right)
    const patientX = this.marginLeft + colWidth + 10;
    y = startY;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Patient:', patientX, y);
    y += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(data.patientName, patientX, y);
    y += 4;

    pdf.text(`NIK: ${data.patientNik}`, patientX, y);
    y += 4;

    pdf.text(`MRN: ${data.patientMrn}`, patientX, y);
    y += 4;

    if (data.patientAddress) {
      const patientAddressLines = pdf.splitTextToSize(data.patientAddress, colWidth);
      pdf.text(patientAddressLines, patientX, y);
      y += patientAddressLines.length * 3;
    }

    return y + 3;
  }

  /**
   * Add invoice details (dates, currency)
   */
  private addInvoiceDetails(pdf: jsPDF, data: InvoicePdfData, startY: number): number {
    let y = startY;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    // Create a small table for details
    const details = [
      { label: 'Invoice Date:', value: new Date(data.invoiceDate).toLocaleDateString('id-ID') },
      { label: 'Due Date:', value: data.dueDate ? new Date(data.dueDate).toLocaleDateString('id-ID') : 'Upon Receipt' },
      { label: 'Currency:', value: data.currency },
    ];

    const labelWidth = 40;
    const valueX = this.marginLeft + labelWidth + 5;

    details.forEach((detail) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${detail.label}`, this.marginLeft, y);

      pdf.setFont('helvetica', 'normal');
      pdf.text(detail.value, valueX, y);

      y += 5;
    });

    return y;
  }

  /**
   * Add line items table
   */
  private addLineItemsTable(pdf: jsPDF, data: InvoicePdfData, startY: number): number {
    let y = startY;

    // Table header
    pdf.setFillColor(220, 220, 220);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');

    const colDescWidth = 80;
    const colQtyWidth = 20;
    const colPriceWidth = 25;
    const colTotalWidth = 30;

    const headerY = y;
    pdf.rect(this.marginLeft, headerY, this.contentWidth, 7, 'F');

    pdf.text('Description', this.marginLeft + 2, y + 5);
    pdf.text('Qty', this.marginLeft + colDescWidth + 2, y + 5, { align: 'right' });
    pdf.text('Unit Price', this.marginLeft + colDescWidth + colQtyWidth + 2, y + 5, { align: 'right' });
    pdf.text('Total', this.marginLeft + colDescWidth + colQtyWidth + colPriceWidth + 2, y + 5, { align: 'right' });

    y += 8;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    let rowY = y;
    data.lineItems.forEach((item) => {
      // Check if we need a new page
      if (rowY > this.docHeight - this.marginBottom - 40) {
        pdf.addPage();
        rowY = this.marginTop;
      }

      const descLines = pdf.splitTextToSize(item.description, colDescWidth);
      const rowHeight = Math.max(5, descLines.length * 3.5);

      // Draw row background (alternating)
      if (data.lineItems.indexOf(item) % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(this.marginLeft, rowY, this.contentWidth, rowHeight, 'F');
      }

      // Draw row content
      pdf.setTextColor(0);
      pdf.text(descLines, this.marginLeft + 2, rowY + 2);

      const qtyText = item.quantity.toString();
      pdf.text(qtyText, this.marginLeft + colDescWidth + 2, rowY + 2, { align: 'right' });

      const priceText = this.formatCurrency(item.unitPrice, data.currency);
      pdf.text(priceText, this.marginLeft + colDescWidth + colQtyWidth + 2, rowY + 2, { align: 'right' });

      const totalText = this.formatCurrency(item.totalPrice, data.currency);
      pdf.text(totalText, this.marginLeft + colDescWidth + colQtyWidth + colPriceWidth + 2, rowY + 2, { align: 'right' });

      rowY += rowHeight;
    });

    // Border for table
    pdf.setDrawColor(150);
    pdf.rect(this.marginLeft, headerY, this.contentWidth, rowY - headerY);

    return rowY + 2;
  }

  /**
   * Add financial summary
   */
  private addFinancialSummary(pdf: jsPDF, data: InvoicePdfData, startY: number): number {
    let y = startY;

    // Align to right
    const summaryWidth = 60;
    const summaryX = this.docWidth - this.marginRight - summaryWidth;

    pdf.setFontSize(9);

    const summaryItems = [
      { label: 'Subtotal:', value: data.subtotal },
      { label: 'Discount:', value: -data.discount },
      { label: 'Tax (0%):', value: data.tax },
      { label: 'Total:', value: data.total, isBold: true },
    ];

    summaryItems.forEach((item) => {
      if (item.isBold) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
      }

      const valueText = this.formatCurrency(item.value, data.currency);
      pdf.text(item.label, summaryX, y);
      pdf.text(valueText, this.docWidth - this.marginRight - 2, y, { align: 'right' });

      y += 5;
    });

    return y;
  }

  /**
   * Add payment information
   */
  private addPaymentInfo(pdf: jsPDF, data: InvoicePdfData, startY: number): number {
    let y = startY;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Information:', this.marginLeft, y);
    y += 5;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    const statusColor = {
      pending: [255, 193, 7], // Amber
      partial: [33, 150, 243], // Blue
      paid: [76, 175, 80], // Green
      cancelled: [244, 67, 54], // Red
    };

    const color = statusColor[data.paymentStatus] || [0, 0, 0];
    pdf.setTextColor(color[0], color[1], color[2]);

    const statusText = `Status: ${data.paymentStatus.toUpperCase()}`;
    pdf.text(statusText, this.marginLeft, y);

    pdf.setTextColor(0);
    y += 5;

    if (data.paymentMethod) {
      pdf.text(`Method: ${data.paymentMethod}`, this.marginLeft, y);
      y += 5;
    }

    return y;
  }

  /**
   * Add notes section
   */
  private addNotes(pdf: jsPDF, notes: string, startY: number): number {
    let y = startY;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notes:', this.marginLeft, y);
    y += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    const noteLines = pdf.splitTextToSize(notes, this.contentWidth);
    pdf.text(noteLines, this.marginLeft, y);
    y += noteLines.length * 4;

    return y;
  }

  /**
   * Add footer with compliance information
   */
  private addFooter(pdf: jsPDF, data: InvoicePdfData): void {
    const footerY = this.docHeight - this.marginBottom;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);

    const footerText = `Generated by: ${data.submitterName} | Date: ${new Date().toLocaleDateString('id-ID')} | Compliant with Indonesian Healthcare Standards (Law No. 8/1997) | 10-Year Retention Required`;
    const footerLines = pdf.splitTextToSize(footerText, this.contentWidth);

    let footerLineY = footerY;
    footerLines.forEach((line: string) => {
      pdf.text(line, this.marginLeft, footerLineY, { align: 'left', maxWidth: this.contentWidth });
      footerLineY -= 3;
    });

    // Page numbers
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setTextColor(128, 128, 128);
      pdf.setFontSize(8);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        this.docWidth / 2,
        this.docHeight - 5,
        { align: 'center' }
      );
    }
  }

  /**
   * Format currency value
   */
  private formatCurrency(value: number, currency: string): string {
    const formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency === 'IDR' ? 'IDR' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(value);
  }

  /**
   * Create PDF from FHIR Invoice for compliance
   */
  static async createPdfFromFhirInvoice(
    fhirInvoice: FhirInvoice,
    clinicInfo: {
      name: string;
      code: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    patientInfo: {
      name: string;
      nik: string;
      mrn: string;
      address?: string;
    },
    submitterInfo: {
      name: string;
      email: string;
    }
  ): Promise<Buffer> {
    // Extract line items from FHIR Invoice
    const lineItems: LineItemData[] = fhirInvoice.lineItem?.map((item) => ({
      description: item.chargeItemCodeableConcept?.text || item.chargeItemReference?.display || 'Healthcare Service',
      quantity: item.priceComponent?.[0]?.factor || 1,
      unitPrice: item.priceComponent?.[0]?.amount?.value || 0,
      totalPrice: (item.priceComponent?.[0]?.amount?.value || 0) * (item.priceComponent?.[0]?.factor || 1),
    })) || [];

    // Extract totals
    const discountComponent = fhirInvoice.totalPriceComponent?.find((c) => c.type === 'discount');
    const taxComponent = fhirInvoice.totalPriceComponent?.find((c) => c.type === 'tax');

    const invoiceData: InvoicePdfData = {
      invoiceNumber: fhirInvoice.identifier?.[0]?.value || 'INV-UNKNOWN',
      invoiceDate: fhirInvoice.date || new Date().toISOString(),
      dueDate: fhirInvoice.paymentTerms, // Using paymentTerms as dueDate string for now
      clinicName: clinicInfo.name,
      clinicCode: clinicInfo.code,
      clinicAddress: clinicInfo.address || '',
      clinicPhone: clinicInfo.phone || '',
      clinicEmail: clinicInfo.email || '',
      patientName: patientInfo.name,
      patientNik: patientInfo.nik,
      patientMrn: patientInfo.mrn,
      patientAddress: patientInfo.address || '',
      lineItems,
      subtotal: fhirInvoice.totalNet?.value || 0,
      discount: discountComponent?.amount?.value || 0,
      tax: taxComponent?.amount?.value || 0,
      total: fhirInvoice.totalGross?.value || 0,
      currency: fhirInvoice.totalGross?.currency || 'IDR',
      paymentStatus: (fhirInvoice.status as any) || 'pending',
      submitterName: submitterInfo.name,
      submitterEmail: submitterInfo.email,
    };

    const generator = new InvoicePdfGenerator();
    return generator.generatePdf(invoiceData);
  }
}
