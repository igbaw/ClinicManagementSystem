/**
 * Invoice Storage Service
 * Manages PDF invoice storage in Supabase with compliance tracking
 *
 * Compliance:
 * - 10-year retention requirement (Law No. 8/1997)
 * - Access logging and audit trail
 * - Secure file storage with controlled access
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface InvoiceDocumentMetadata {
  invoice_number: string;
  patient_name: string;
  clinic_name: string;
  invoice_date?: string;
  [key: string]: any;
}

export interface StoredInvoiceDocument {
  id: string;
  billing_id: string;
  patient_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  storage_path: string;
  retention_until: string;
  created_at: string;
  metadata: InvoiceDocumentMetadata;
}

/**
 * Invoice Storage Service
 */
export class InvoiceStorageService {
  private supabase: SupabaseClient;
  private bucketName = 'invoice_documents';

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Store invoice PDF in Supabase Storage
   * Automatically handles directory structure and retention tracking
   */
  async storeInvoicePdf(
    pdfBuffer: Buffer,
    billingId: string,
    patientId: string,
    invoiceNumber: string,
    metadata: InvoiceDocumentMetadata
  ): Promise<StoredInvoiceDocument | null> {
    try {
      const fileName = `invoice-${invoiceNumber}.pdf`;
      const year = new Date().getFullYear();
      const filePath = `invoices/${year}/${patientId}/${fileName}`;

      // Upload PDF to storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Create retention date (10 years from now)
      const retentionUntil = new Date();
      retentionUntil.setFullYear(retentionUntil.getFullYear() + 10);

      // Get authenticated user
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      // Create invoice_documents record
      const { data: docRecord, error: docError } = await this.supabase
        .from('invoice_documents')
        .insert({
          billing_id: billingId,
          patient_id: patientId,
          document_type: 'invoice',
          file_name: fileName,
          file_path: filePath,
          file_size: pdfBuffer.length,
          content_type: 'application/pdf',
          storage_path: filePath,
          access_count: 0,
          last_accessed_at: null,
          retention_until: retentionUntil.toISOString(),
          uploaded_by: user?.id,
          metadata: metadata,
        })
        .select()
        .single();

      if (docError) {
        console.error('Document record creation error:', docError);
        throw docError;
      }

      return docRecord as StoredInvoiceDocument;
    } catch (error) {
      console.error('Error storing invoice PDF:', error);
      return null;
    }
  }

  /**
   * Retrieve stored invoice PDF
   */
  async retrieveInvoicePdf(documentId: string): Promise<Buffer | null> {
    try {
      // Get document metadata
      const { data: docRecord, error: fetchError } = await this.supabase
        .from('invoice_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !docRecord) {
        console.error('Document not found:', fetchError);
        return null;
      }

      // Download file from storage
      const { data: fileData, error: downloadError } = await this.supabase.storage
        .from(this.bucketName)
        .download(docRecord.file_path);

      if (downloadError) {
        console.error('Storage download error:', downloadError);
        return null;
      }

      // Update access count
      await this.updateAccessMetadata(documentId);

      // Log access
      await this.logAccess(documentId, docRecord.billing_id, docRecord.patient_id, 'download');

      return Buffer.from(await fileData.arrayBuffer());
    } catch (error) {
      console.error('Error retrieving invoice PDF:', error);
      return null;
    }
  }

  /**
   * Get document metadata (without downloading file)
   */
  async getDocumentMetadata(documentId: string): Promise<StoredInvoiceDocument | null> {
    try {
      const { data: docRecord, error } = await this.supabase
        .from('invoice_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Error fetching document metadata:', error);
        return null;
      }

      await this.logAccess(documentId, docRecord.billing_id, docRecord.patient_id, 'metadata_view');

      return docRecord as StoredInvoiceDocument;
    } catch (error) {
      console.error('Error getting document metadata:', error);
      return null;
    }
  }

  /**
   * List all documents for a patient
   */
  async listPatientDocuments(patientId: string): Promise<StoredInvoiceDocument[]> {
    try {
      const { data: documents, error } = await this.supabase
        .from('invoice_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error listing patient documents:', error);
        return [];
      }

      return (documents || []) as StoredInvoiceDocument[];
    } catch (error) {
      console.error('Error listing documents:', error);
      return [];
    }
  }

  /**
   * List documents for a billing record
   */
  async listBillingDocuments(billingId: string): Promise<StoredInvoiceDocument[]> {
    try {
      const { data: documents, error } = await this.supabase
        .from('invoice_documents')
        .select('*')
        .eq('billing_id', billingId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error listing billing documents:', error);
        return [];
      }

      return (documents || []) as StoredInvoiceDocument[];
    } catch (error) {
      console.error('Error listing documents:', error);
      return [];
    }
  }

  /**
   * Update access metadata
   */
  private async updateAccessMetadata(documentId: string): Promise<void> {
    try {
      const { data: docRecord } = await this.supabase
        .from('invoice_documents')
        .select('access_count')
        .eq('id', documentId)
        .single();

      await this.supabase
        .from('invoice_documents')
        .update({
          access_count: (docRecord?.access_count || 0) + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', documentId);
    } catch (error) {
      console.error('Error updating access metadata:', error);
    }
  }

  /**
   * Log document access for audit trail
   */
  private async logAccess(
    documentId: string,
    billingId: string,
    patientId: string,
    action: string
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      await this.supabase
        .from('billing_access_logs')
        .insert({
          user_id: user?.id,
          document_id: documentId,
          billing_id: billingId,
          patient_id: patientId,
          action: action,
          access_purpose: 'document_access',
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging access:', error);
      // Don't throw - logging should not block document access
    }
  }

  /**
   * Delete document (archive instead of hard delete for compliance)
   */
  async archiveDocument(documentId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('invoice_documents')
        .update({
          archived_at: new Date().toISOString(),
          archive_reason: reason,
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error archiving document:', error);
        return false;
      }

      // Log the archive action
      const { data: docRecord } = await this.supabase
        .from('invoice_documents')
        .select('billing_id, patient_id')
        .eq('id', documentId)
        .single();

      if (docRecord) {
        await this.logAccess(documentId, docRecord.billing_id, docRecord.patient_id, 'archive');
      }

      return true;
    } catch (error) {
      console.error('Error archiving document:', error);
      return false;
    }
  }

  /**
   * Get retention status for a document
   */
  async getRetentionStatus(documentId: string): Promise<{
    retentionUntil: string;
    daysRemaining: number;
    isExpired: boolean;
  } | null> {
    try {
      const { data: docRecord, error } = await this.supabase
        .from('invoice_documents')
        .select('retention_until')
        .eq('id', documentId)
        .single();

      if (error || !docRecord) {
        return null;
      }

      const retentionDate = new Date(docRecord.retention_until);
      const today = new Date();
      const daysRemaining = Math.ceil((retentionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        retentionUntil: docRecord.retention_until,
        daysRemaining,
        isExpired: daysRemaining < 0,
      };
    } catch (error) {
      console.error('Error getting retention status:', error);
      return null;
    }
  }

  /**
   * Generate secure download URL with expiration
   */
  async generateDownloadUrl(documentId: string, expirationHours: number = 24): Promise<string | null> {
    try {
      // Get document metadata
      const { data: docRecord, error: metaError } = await this.supabase
        .from('invoice_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (metaError || !docRecord) {
        return null;
      }

      // Generate signed URL
      const { data } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(docRecord.file_path, expirationHours * 3600);

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error generating download URL:', error);
      return null;
    }
  }

  /**
   * Get document access logs
   */
  async getAccessLogs(documentId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data: logs, error } = await this.supabase
        .from('billing_access_logs')
        .select('*')
        .eq('document_id', documentId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching access logs:', error);
        return [];
      }

      return logs || [];
    } catch (error) {
      console.error('Error getting access logs:', error);
      return [];
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(patientId?: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    averageDocumentSize: number;
  }> {
    try {
      let query = this.supabase.from('invoice_documents').select('file_size', { count: 'exact' });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching storage stats:', error);
        return { totalDocuments: 0, totalSize: 0, averageDocumentSize: 0 };
      }

      const totalSize = (data || []).reduce((sum, doc: any) => sum + (doc.file_size || 0), 0);
      const totalDocuments = count || 0;

      return {
        totalDocuments,
        totalSize,
        averageDocumentSize: totalDocuments > 0 ? totalSize / totalDocuments : 0,
      };
    } catch (error) {
      console.error('Error calculating storage stats:', error);
      return { totalDocuments: 0, totalSize: 0, averageDocumentSize: 0 };
    }
  }
}
