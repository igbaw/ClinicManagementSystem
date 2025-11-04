# Feature Roadmap - Clinic Management System

**Last Updated**: November 3, 2025  
**Status**: Planning Complete, Ready for Implementation

---

## Overview

This document provides a complete roadmap for implementing the unified queue system with walk-in support, booking codes, QR check-in, and reminder features.

---

## Phase 1: Core Queue System (3-4 days)

### Goal
Eliminate technical debt by implementing proper queue management that natively supports both appointments and walk-ins.

### Features

#### 1.1 Unified Queue System ✅
- **Database**: New `queue_entries` table
- **Purpose**: Single source of truth for all queue operations
- **Supports**: Appointments and walk-ins in same queue
- **Key Fields**: `entry_type`, `queue_number`, `status`, `chief_complaint`

#### 1.2 Walk-in Check-in Page ✅
- **URL**: `/walk-in`
- **Features**: 
  - Patient search with autocomplete
  - Doctor selection
  - Chief complaint capture
  - Immediate queue number assignment
- **Benefit**: No more "fake appointments" workaround

#### 1.3 Booking Code System ✅
- **Format**: `BK-YYYYMMDD-XXX` (e.g., `BK-20251103-A4K`)
- **Purpose**: Quick patient identification
- **Features**:
  - Auto-generated for every appointment
  - Used for quick check-in at front desk
  - Displayed in appointment confirmations
  - Case-insensitive matching
- **API**: `POST /api/checkin/booking`

#### 1.4 Updated Queue Display ✅
- **Changes**:
  - Shows both appointments and walk-ins
  - Clear badges: `[Janji Temu - 08:00]` vs `[Walk-in]`
  - Displays chief complaint
  - Single unified list for doctors

### Deliverables
- [ ] Database migrations (queue_entries, booking_code)
- [ ] 4 API endpoints (walk-in, check-in, booking, queue list)
- [ ] Walk-in check-in UI page
- [ ] Updated queue display page
- [ ] Updated appointments check-in flow
- [ ] Updated medical records integration
- [ ] Complete documentation

### Success Metrics
- Walk-in check-in time < 30 seconds
- Zero data loss during migration
- Queue retrieval < 200ms
- Front desk satisfaction improved

---

## Phase 2: QR Code System (1 week)

### Goal
Enable instant check-in using QR codes for faster patient flow.

### Features

#### 2.1 QR Code Generation
- **Generates QR for**: Every appointment booking
- **Content**: URL with booking code (`/checkin?code=BK-20251103-A4K`)
- **Distribution**: 
  - Email confirmation
  - WhatsApp message
  - Patient portal/app
  - Printable PDF

#### 2.2 QR Scanner Component
- **Platforms**: 
  - Web (front desk desktop)
  - Mobile (front desk tablet)
  - Self-service kiosk (future)
- **Features**:
  - Camera-based scanning
  - Auto check-in on successful scan
  - Error handling with fallback to manual entry

#### 2.3 Self-Service Check-in
- **Location**: Public kiosk or patient app
- **Flow**:
  1. Patient scans QR or enters booking code
  2. System validates and checks in
  3. Queue number displayed
  4. Optional: Print queue ticket

### APIs
- `GET /api/appointments/:id/qr` - Generate QR code
- `POST /api/checkin/qr` - Check-in via QR scan

### Deliverables
- [ ] QR generation service
- [ ] QR scanner web component
- [ ] QR scanner mobile component
- [ ] Self-service kiosk UI
- [ ] QR in email/WhatsApp templates
- [ ] Testing & documentation

### Success Metrics
- 50%+ patients use QR check-in
- QR scan success rate > 95%
- Check-in time < 10 seconds with QR

---

## Phase 3: Reminder System - SMS (2 weeks)

### Goal
Reduce no-shows by sending automated reminders to patients.

### Features

#### 3.1 Automatic Reminder Generation
- **Trigger**: 2 hours before appointment time
- **Condition**: Appointment not yet checked in
- **Frequency**: Once per appointment
- **Channels**: SMS (Phase 3), WhatsApp (Phase 4), Push (Phase 5)

#### 3.2 SMS Integration
- **Provider**: Twilio (or similar)
- **Message**: 
  ```
  Halo [Nama],
  Pengingat: Anda memiliki janji temu hari ini pukul [Jam] 
  dengan [Dokter].
  Booking: [BOOKING_CODE]
  Silakan datang 15 menit lebih awal.
  ```
- **Tracking**: Delivery status, sent time, failed attempts

#### 3.3 Admin Configuration
- **Settings**:
  - Enable/disable reminders
  - Lead time (default 2 hours)
  - Message template customization
  - Opt-out management
- **Monitoring**:
  - Reminder logs
  - Delivery success rate
  - Impact on no-show rate

### Database
- New table: `appointment_reminders`
- Fields: appointment_id, type, status, sent_at, delivered_at

### Cron Jobs
- **Generate reminders**: Every hour
- **Send reminders**: Every 5 minutes

### APIs
- Background jobs (no user-facing APIs)
- Admin UI for viewing logs

### Deliverables
- [ ] appointment_reminders table
- [ ] Reminder generation cron job
- [ ] SMS sending cron job
- [ ] Twilio integration
- [ ] Admin settings UI
- [ ] Monitoring dashboard
- [ ] Opt-out mechanism
- [ ] Testing & documentation

### Success Metrics
- Reminders sent successfully > 95%
- No-show rate reduced by 30%
- Patient satisfaction > 4/5

---

## Phase 4: WhatsApp Integration (1-2 weeks)

### Goal
Provide richer reminder experience via WhatsApp with interactive features.

### Features

#### 4.1 WhatsApp Business API
- **Provider**: Twilio WhatsApp / Meta Business API
- **Message Types**:
  - Text reminders (richer formatting)
  - Media messages (QR code image)
  - Interactive messages (buttons)

#### 4.2 Enhanced Reminder Message
```
🏥 *Pengingat Janji Temu*

Halo *[Nama]*,
Anda memiliki janji temu hari ini:
📅 Tanggal: [Tanggal]
🕒 Waktu: [Jam]
👨‍⚕️ Dokter: [Nama Dokter]

📋 Kode Booking: *[BOOKING_CODE]*

*Quick Check-in:*
[QR CODE IMAGE]
🔗 [Link untuk check-in]

💬 Balas dengan "CHECKIN" untuk konfirmasi

Terima kasih! 🙏
```

#### 4.3 Interactive Check-in
- **Reply "CHECKIN"**: Auto check-in patient
- **Webhook**: Receive WhatsApp replies
- **Response**: Confirmation with queue number

### Deliverables
- [ ] WhatsApp Business API setup
- [ ] Message templates (Meta approval)
- [ ] QR image embedding in WhatsApp
- [ ] Webhook handler for replies
- [ ] Interactive check-in logic
- [ ] Testing & documentation

### Success Metrics
- WhatsApp delivery rate > 90%
- Interactive check-in usage > 20%
- Patient preference for WhatsApp > SMS

---

## Phase 5: Mobile App Push Notifications (2-3 weeks)

### Goal
Provide native mobile app notifications for the best patient experience.

### Features

#### 5.1 Push Notification Infrastructure
- **Platforms**: iOS (APNs), Android (FCM)
- **Triggers**: Same as SMS (2 hours before)
- **Priority**: High priority notification

#### 5.2 Notification Content
```
Title: Janji Temu Hari Ini
Body: Pukul [Jam] dengan [Dokter]
Actions: 
  - [Check-in Now] → Deep link to check-in
  - [View Details] → Open appointment details
  - [Cancel] → Cancel appointment
```

#### 5.3 Deep Linking
- **Check-in action**: Opens app and auto check-ins
- **View details**: Shows appointment full details
- **In-app QR**: Display QR code for scanning

#### 5.4 Notification Preferences
- **Patient Control**:
  - Enable/disable reminders
  - Choose channels (SMS/WhatsApp/Push)
  - Set lead time preference
  - Quiet hours

### Deliverables
- [ ] Push notification service setup
- [ ] Device token management
- [ ] Deep linking implementation
- [ ] One-tap check-in from notification
- [ ] Notification preferences UI
- [ ] Multi-platform testing
- [ ] Documentation

### Success Metrics
- Push delivery rate > 98%
- One-tap check-in usage > 40%
- App engagement increased

---

## Phase 6: Self-Service Kiosk (2 weeks)

### Goal
Allow patients to self-check-in at clinic kiosk without front desk assistance.

### Features

#### 6.1 Kiosk Hardware
- **Components**:
  - Touchscreen display (21-27")
  - QR code scanner (built-in camera or dedicated)
  - Thermal printer (for queue tickets)
  - RFID reader (optional, for ID cards)

#### 6.2 Kiosk Software
- **UI**: Large touch-friendly buttons
- **Features**:
  - QR code scanning
  - Booking code entry
  - Patient search (name/NIK)
  - Language selection (ID/EN)
  - Queue ticket printing

#### 6.3 Kiosk Security
- **Restrictions**:
  - Limited access (can't view other patients)
  - No payment processing
  - No medical record access
  - Auto-logout after 30 seconds idle
- **Monitoring**:
  - Usage logs
  - Error tracking
  - Remote management

#### 6.4 Queue Ticket Printing
```
═══════════════════════════
    KLINIK THT SEJAHTERA
═══════════════════════════
  
  NOMOR ANTRIAN

        【 5 】

  Nama: Ahmad Rizki
  Dokter: Dr. Sarah Wijaya
  Waktu: 10:00
  
  Tanggal: 3 Nov 2025
  Check-in: 09:45
  
  Silakan tunggu di ruang tunggu.
  Anda akan dipanggil sesuai
  nomor antrian.
  
═══════════════════════════
```

### Deliverables
- [ ] Kiosk UI application
- [ ] QR scanner integration
- [ ] Printer driver integration
- [ ] Security hardening
- [ ] Kiosk mode configuration
- [ ] Remote monitoring dashboard
- [ ] Testing & documentation

### Success Metrics
- 60%+ patients use kiosk
- Kiosk uptime > 99%
- Front desk workload reduced by 40%

---

## Timeline Summary

```
Week 1-2:  Phase 1 - Core Queue System ████████░░░░░░░░░░
Week 3:    Phase 2 - QR Code System    ░░░░░░░░████░░░░░░
Week 4-5:  Phase 3 - SMS Reminders     ░░░░░░░░░░░░████░░
Week 6:    Phase 4 - WhatsApp          ░░░░░░░░░░░░░░░░██
Week 7-8:  Phase 5 - Push Notif        ░░░░░░░░░░░░░░░░░░████
Week 9-10: Phase 6 - Kiosk             ░░░░░░░░░░░░░░░░░░░░░░██
```

**Total Timeline**: ~10 weeks (2.5 months)

---

## Resource Requirements

### Phase 1-2 (Core + QR)
- **Team**: 1-2 developers
- **Skills**: Next.js, TypeScript, PostgreSQL, Supabase
- **Infrastructure**: Existing (no new services)

### Phase 3-4 (Reminders)
- **Team**: 1 developer + 1 DevOps
- **Skills**: Cron jobs, Twilio API, WhatsApp Business API
- **Infrastructure**: 
  - SMS gateway account (Twilio)
  - WhatsApp Business API account
  - Cron scheduling (existing server or cloud scheduler)

### Phase 5 (Push Notifications)
- **Team**: 2 mobile developers + 1 backend
- **Skills**: React Native, APNs, FCM, deep linking
- **Infrastructure**:
  - Apple Developer account
  - Google Firebase project
  - Push notification service

### Phase 6 (Kiosk)
- **Team**: 1 developer + 1 hardware integrator
- **Skills**: Kiosk mode, printer drivers, QR hardware
- **Infrastructure**:
  - Kiosk hardware (1-3 units)
  - Thermal printers
  - Network setup

---

## Cost Estimates

### Development Costs
- **Phase 1**: Included (core system)
- **Phase 2**: $500-1,000 (QR libraries)
- **Phase 3**: $2,000-3,000 (SMS integration + testing)
- **Phase 4**: $1,500-2,500 (WhatsApp API setup)
- **Phase 5**: $3,000-5,000 (mobile app features)
- **Phase 6**: $2,000-3,000 (kiosk software)

**Total Dev**: ~$9,000-14,500

### Infrastructure Costs (Monthly)
- **SMS (Twilio)**: $0.05/message × ~500 messages = $25/month
- **WhatsApp**: $0.02/message × ~500 messages = $10/month
- **Push Notifications**: Free (Firebase)
- **Kiosk Hardware**: $2,000-4,000 (one-time, per unit)

**Total Recurring**: ~$35/month

---

## Risk Assessment

### Phase 1 Risks
- **Migration complexity**: MEDIUM
  - Mitigation: Comprehensive testing, rollback plan
- **User adoption**: LOW
  - Mitigation: Training, clear documentation

### Phase 2-4 Risks
- **SMS/WhatsApp delivery**: MEDIUM
  - Mitigation: Delivery tracking, fallback to email
- **Provider reliability**: LOW
  - Mitigation: Choose established provider (Twilio)

### Phase 5 Risks
- **Platform approval delays**: HIGH (iOS App Store)
  - Mitigation: Start approval process early
- **Push token management**: MEDIUM
  - Mitigation: Proper token refresh logic

### Phase 6 Risks
- **Hardware reliability**: MEDIUM
  - Mitigation: Choose commercial kiosk hardware
- **Physical tampering**: LOW
  - Mitigation: Kiosk mode, physical locks

---

## Success Criteria (Overall)

### Operational Metrics
- [ ] No-show rate reduced by 30%+
- [ ] Check-in time reduced by 50%+
- [ ] Front desk workload reduced by 40%+
- [ ] Queue management errors reduced to near-zero

### Patient Experience
- [ ] Patient satisfaction score > 4.5/5
- [ ] Wait time transparency improved
- [ ] 70%+ patients prefer new system over old

### Technical Metrics
- [ ] System uptime > 99.5%
- [ ] Response time < 200ms for all endpoints
- [ ] Zero critical bugs in production
- [ ] Code coverage > 80%

---

## Decision Framework

### Which Phase to Prioritize?

**If goal is**:
- **Reduce technical debt** → Start Phase 1 immediately ✅
- **Reduce no-shows** → Phase 3 (SMS reminders) after Phase 1
- **Improve patient experience** → Phase 2 (QR codes) + Phase 3
- **Reduce front desk workload** → Phase 6 (Kiosk) + Phase 1
- **Build for future (mobile app)** → Phase 5 (Push) + Phase 2

**Recommended Order**: 1 → 2 → 3 → 4 → 5 → 6 (as documented)

---

## Related Documents

| Document | Description | Link |
|----------|-------------|------|
| **Implementation Plan** | Phase 1 technical details | `queue_system_implementation_plan.md` |
| **Reminder Features** | Phases 3-6 technical details | `reminder_and_quick_checkin_features.md` |
| **Front Desk Workflow** | Operational procedures | `front_desk_workflow.md` |
| **Walk-in Requirements** | Business requirements | `walk_in_patients_requirements.md` |
| **Quick Summary** | Executive overview | `IMPLEMENTATION_SUMMARY.md` |
| **This Document** | Complete roadmap | `FEATURE_ROADMAP.md` |

---

## Next Steps

1. ✅ Review and approve Phase 1 plan
2. ✅ Allocate resources (developers, time)
3. ✅ Set up project tracking (use TODO list)
4. ⏳ Begin Phase 1 implementation
5. ⏳ Monitor progress daily
6. ⏳ Test thoroughly at each milestone
7. ⏳ Plan Phase 2 kickoff

---

**Document Status**: ✅ Complete and ready for execution  
**Owner**: Development Team  
**Review Date**: Weekly during Phase 1, Monthly thereafter  
**Version**: 1.0

---

**Questions or clarifications?** Refer to the detailed implementation documents or discuss with the project team.
