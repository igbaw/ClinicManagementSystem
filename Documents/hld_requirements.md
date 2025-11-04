# High-Level Requirements Document (HRD)
## ENT Clinic Management System

**Version**: 1.0  
**Date**: November 2025  
**Status**: Planning Phase

---

## 1. Executive Summary

### 1.1 Project Overview
A comprehensive clinic management system designed for small to medium ENT (Ear, Nose, Throat) clinics in Indonesia, with full support for Indonesian healthcare regulations, BPJS integration, and SATUSEHAT platform compliance.

### 1.2 Business Objectives
- Streamline patient registration and appointment management
- Enable efficient medical record documentation for doctors
- Automate billing and payment processing with multiple payment methods
- Integrate with Indonesian healthcare systems (BPJS, SATUSEHAT)
- Manage medication inventory
- Generate regulatory-compliant reports
- Scale to multi-clinic SaaS platform (future)

### 1.3 Target Users
- **Front Desk Staff**: Patient registration, scheduling, billing
- **Doctors**: Medical examination, diagnosis, prescription
- **System Administrator**: System configuration, user management, reports

### 1.4 Success Criteria
- Reduce patient registration time by 50%
- Complete medical record entry within 5 minutes
- 100% BPJS claim submission accuracy
- Zero medication stock-outs
- System uptime of 99.5%

---

## 2. Stakeholder Requirements

### 2.1 Front Desk Staff
- Fast patient check-in process
- Easy appointment scheduling with visual calendar
- Quick billing with multiple payment options
- Print receipts and invoices
- View daily patient queue

### 2.2 Doctors
- Quick access to patient medical history
- Easy-to-use SOAP note entry
- ICD-10 code search in Bahasa Indonesia
- Fast prescription creation with common medications
- Mobile access to schedules (future)

### 2.3 Clinic Owner/Administrator
- Financial reports (daily, monthly, yearly)
- Inventory monitoring and alerts
- User activity tracking
- BPJS claim monitoring
- Data backup and security

### 2.4 Regulatory Compliance
- BPJS VClaim integration for insurance claims
- SATUSEHAT integration for Ministry of Health reporting
- ICD-10 coding standards
- Patient data privacy protection
- Medical record audit trail

---

## 3. Functional Requirements

### 3.1 User Management
- **FR-UM-001**: System shall support three user roles: Admin, Doctor, Front Desk
- **FR-UM-002**: System shall require email and password authentication
- **FR-UM-003**: Admin shall create, update, deactivate user accounts
- **FR-UM-004**: System shall log all user activities with timestamp
- **FR-UM-005**: System shall support password reset functionality

### 3.2 Patient Management
- **FR-PM-001**: System shall register new patients with NIK, BPJS number, demographics
- **FR-PM-002**: System shall auto-generate unique Medical Record (MR) number
- **FR-PM-003**: System shall search patients by name, MR number, NIK, BPJS number
- **FR-PM-004**: System shall store patient photos
- **FR-PM-005**: System shall track patient visit history
- **FR-PM-006**: System shall validate NIK format (16 digits)
- **FR-PM-007**: System shall validate BPJS number format (13 digits)
- **FR-PM-008**: System shall mark duplicate patient detection

### 3.3 Appointment Management
- **FR-AM-001**: System shall schedule appointments with date, time, doctor
- **FR-AM-002**: System shall display calendar view (daily/weekly)
- **FR-AM-003**: System shall manage appointment status (scheduled, checked-in, in-progress, completed, cancelled)
- **FR-AM-004**: System shall prevent double-booking for same time slot
- **FR-AM-005**: System shall show real-time queue position
- **FR-AM-006**: Front desk shall check-in patients upon arrival
- **FR-AM-007**: System shall allow appointment rescheduling
- **FR-AM-008**: System shall track appointment no-shows

### 3.4 Medical Records
- **FR-MR-001**: Doctor shall create medical records following SOAP format
- **FR-MR-002**: System shall support ICD-10 diagnosis coding with Indonesian translation
- **FR-MR-003**: System shall store chief complaint, anamnesis, physical examination
- **FR-MR-004**: System shall attach photos/documents to medical records
- **FR-MR-005**: System shall link medical records to appointments
- **FR-MR-006**: System shall display patient medical history chronologically
- **FR-MR-007**: Doctor shall add multiple diagnoses per visit
- **FR-MR-008**: System shall support common ENT examination templates
- **FR-MR-009**: System shall timestamp all medical record entries
- **FR-MR-010**: System shall prevent editing of completed records (audit trail)

### 3.5 Prescription Management
- **FR-RX-001**: Doctor shall create prescriptions linked to medical records
- **FR-RX-002**: System shall search medications from inventory
- **FR-RX-003**: System shall specify dosage, frequency, duration, instructions
- **FR-RX-004**: System shall calculate medication quantity automatically
- **FR-RX-005**: System shall generate e-prescription PDF in Bahasa Indonesia
- **FR-RX-006**: System shall check medication stock availability
- **FR-RX-007**: System shall support common dosage templates (e.g., "3x1 sehari sesudah makan")
- **FR-RX-008**: System shall track prescription dispensing status
- **FR-RX-009**: System shall warn about medication interactions (future)

### 3.6 Billing & Payments
- **FR-BP-001**: System shall auto-generate bills from medical records and prescriptions
- **FR-BP-002**: System shall support multiple payment methods (cash, QRIS, e-wallet, debit card, BPJS, insurance)
- **FR-BP-003**: System shall apply different pricing for BPJS vs non-BPJS patients
- **FR-BP-004**: System shall apply discounts and calculate totals
- **FR-BP-005**: System shall record partial payments
- **FR-BP-006**: System shall generate payment receipts (PDF, print)
- **FR-BP-007**: System shall track outstanding payments
- **FR-BP-008**: System shall store QRIS transaction references
- **FR-BP-009**: System shall separate billing items (consultation, procedures, medications, lab tests)
- **FR-BP-010**: System shall support bill splitting (multiple payments)

### 3.7 Inventory Management
- **FR-IM-001**: Admin shall add, update, deactivate medications
- **FR-IM-002**: System shall track stock quantity in real-time
- **FR-IM-003**: System shall alert when stock below minimum threshold
- **FR-IM-004**: System shall track medication expiry dates
- **FR-IM-005**: System shall alert 60 days before expiry
- **FR-IM-006**: System shall record stock adjustments with reasons
- **FR-IM-007**: System shall support batch/lot tracking
- **FR-IM-008**: System shall track supplier information
- **FR-IM-009**: System shall auto-deduct stock when prescription dispensed
- **FR-IM-010**: System shall generate purchase order suggestions

### 3.8 BPJS Integration
- **FR-BPJS-001**: System shall verify BPJS eligibility via VClaim API
- **FR-BPJS-002**: System shall generate SEP (Surat Eligibilitas Peserta)
- **FR-BPJS-003**: System shall submit claims with diagnosis and procedures
- **FR-BPJS-004**: System shall track claim status
- **FR-BPJS-005**: System shall apply BPJS pricing for services
- **FR-BPJS-006**: System shall store SEP numbers for reference
- **FR-BPJS-007**: System shall handle BPJS offline mode (manual entry)

### 3.9 SATUSEHAT Integration
- **FR-SS-001**: System shall register/update patient data to SATUSEHAT
- **FR-SS-002**: System shall verify patient NIK via SATUSEHAT
- **FR-SS-003**: System shall submit encounter data (visits)
- **FR-SS-004**: System shall submit diagnosis data with ICD-10 codes
- **FR-SS-005**: System shall submit medication administration records
- **FR-SS-006**: System shall use FHIR format for data exchange
- **FR-SS-007**: System shall queue failed submissions for retry
- **FR-SS-008**: System shall log all SATUSEHAT transactions

### 3.10 Reporting & Analytics
- **FR-RA-001**: System shall generate daily revenue report
- **FR-RA-002**: System shall generate monthly financial summary
- **FR-RA-003**: System shall show patient visit statistics
- **FR-RA-004**: System shall report top 10 diagnoses
- **FR-RA-005**: System shall generate medication usage report
- **FR-RA-006**: System shall show inventory valuation
- **FR-RA-007**: System shall track BPJS vs non-BPJS revenue
- **FR-RA-008**: System shall export reports to PDF and Excel
- **FR-RA-009**: System shall show doctor productivity metrics
- **FR-RA-010**: System shall generate payment method breakdown

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-PF-001**: Page load time shall not exceed 2 seconds
- **NFR-PF-002**: Search queries shall return results within 1 second
- **NFR-PF-003**: System shall support 50 concurrent users
- **NFR-PF-004**: Database queries shall be optimized with proper indexing

### 4.2 Security
- **NFR-SC-001**: All passwords shall be hashed using bcrypt
- **NFR-SC-002**: System shall use HTTPS for all connections
- **NFR-SC-003**: Database shall implement Row-Level Security (RLS)
- **NFR-SC-004**: System shall log all data access and modifications
- **NFR-SC-005**: Sensitive data (NIK, BPJS) shall be encrypted at rest
- **NFR-SC-006**: API keys shall be stored in environment variables
- **NFR-SC-007**: Session timeout shall be 8 hours

### 4.3 Reliability
- **NFR-RL-001**: System uptime shall be 99.5%
- **NFR-RL-002**: Database shall have automated daily backups
- **NFR-RL-003**: System shall have error logging and monitoring
- **NFR-RL-004**: Failed external API calls shall retry 3 times

### 4.4 Usability
- **NFR-US-001**: System interface shall be in Bahasa Indonesia
- **NFR-US-002**: System shall be responsive for tablet and desktop
- **NFR-US-003**: Forms shall show clear validation errors
- **NFR-US-004**: System shall provide loading indicators for async operations
- **NFR-US-005**: Critical actions shall require confirmation dialogs

### 4.5 Scalability
- **NFR-SC-001**: Architecture shall support multi-tenancy
- **NFR-SC-002**: Database schema shall support 100,000+ patients per tenant
- **NFR-SC-003**: System shall handle 1000+ appointments per day

### 4.6 Maintainability
- **NFR-MN-001**: Code shall follow TypeScript strict mode
- **NFR-MN-002**: Components shall be modular and reusable
- **NFR-MN-003**: API endpoints shall follow REST conventions
- **NFR-MN-004**: Database migrations shall be version controlled

### 4.7 Compatibility
- **NFR-CM-001**: System shall support Chrome, Firefox, Safari, Edge (latest versions)
- **NFR-CM-002**: System shall work on Windows, macOS, Linux
- **NFR-CM-003**: Mobile app shall support Android 10+ and iOS 14+

---

## 5. System Constraints

### 5.1 Technical Constraints
- Must use Next.js 16 with App Router
- Must use Supabase for backend (PostgreSQL, Auth, Storage)
- Must deploy on Vercel for frontend
- Must support stable internet connectivity (no offline-first requirement for MVP)

### 5.2 Regulatory Constraints
- Must comply with Indonesian healthcare data regulations
- Must integrate with BPJS VClaim API
- Must integrate with SATUSEHAT platform
- Must follow ICD-10 coding standards

### 5.3 Business Constraints
- Initial deployment for single clinic (3 users)
- Must be completed within 12-16 weeks
- Must support future multi-tenant SaaS transformation

---

## 6. Assumptions and Dependencies

### 6.1 Assumptions
- Clinic has stable broadband internet connection
- BPJS credentials will be available before integration testing
- SATUSEHAT API access will be granted
- Users have basic computer literacy
- Clinic operates during regular hours (no 24/7 requirement)

### 6.2 Dependencies
- BPJS VClaim API availability and documentation
- SATUSEHAT API availability and sandbox environment
- Payment gateway (Xendit/Midtrans) approval
- ICD-10 Indonesian translation database
- SSL certificate for production domain

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| BPJS API downtime | Medium | High | Implement offline mode with manual entry |
| SATUSEHAT integration delays | Medium | Medium | Build core features first, integrate later |
| Payment gateway rejection | Low | High | Have backup gateway option |
| Data loss | Low | Critical | Automated daily backups + monitoring |
| User adoption resistance | Low | Medium | Training and gradual rollout |
| Scope creep | High | Medium | Strict MVP feature freeze |

---

## 8. Success Metrics

### 8.1 Operational Metrics
- Average patient registration time: < 3 minutes
- Average medical record completion time: < 5 minutes
- Average billing time: < 2 minutes
- System response time: < 2 seconds

### 8.2 Business Metrics
- BPJS claim success rate: > 95%
- Medication stock-out incidents: 0 per month
- Payment collection rate: > 98%
- User satisfaction score: > 4/5

### 8.3 Technical Metrics
- System uptime: > 99.5%
- Error rate: < 0.1%
- API integration success rate: > 99%
- Database query time: < 100ms (p95)

---

## 9. Future Enhancements (Post-MVP)

### 9.1 Phase 2 Features
- WhatsApp notification for appointments
- Telemedicine consultation
- Online appointment booking (patient portal)
- Laboratory test integration
- Digital signature for prescriptions

### 9.2 Phase 3 Features (SaaS)
- Multi-tenant architecture
- Subscription billing
- Custom branding per clinic
- API for third-party integrations
- Advanced analytics and dashboards
- Mobile app for patients

### 9.3 Advanced Features
- AI-assisted diagnosis suggestions
- Voice-to-text for medical notes
- Automated appointment reminders
- Patient satisfaction surveys
- Referral management
- Insurance verification automation

---

## 10. Approval & Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Clinic Owner/Sponsor | | | |
| System Administrator | | | |
| Doctor (Primary User) | | | |
| Technical Lead | | | |

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Nov 2025 | System Architect | Initial draft |

**Next Steps**:
1. Review and approve requirements
2. Proceed to Detailed Feature Specifications
3. Create Technical Architecture Document
4. Begin development sprints