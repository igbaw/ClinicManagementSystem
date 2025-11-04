# Reminder & Quick Check-in Features
**Document Type**: Feature Specification  
**Date**: November 3, 2025  
**Version**: 1.0  
**Status**: Planned for Phase 2+

---

## Overview

This document specifies the reminder system and quick check-in features to enhance patient experience and reduce no-shows.

---

## 1. Appointment Reminder System

### 1.1 Business Requirements

**Purpose**: Remind patients about their upcoming appointments to reduce no-shows and improve clinic efficiency.

**Trigger Conditions**:
- Appointment scheduled for today
- 2 hours before appointment time
- Appointment status = 'scheduled' (not yet checked in)
- Patient has valid contact (phone/WhatsApp/app notification)

**Example**:
```
Appointment: 10:00 AM
Reminder sent: 08:00 AM
Condition: Patient hasn't checked in yet
```

### 1.2 Reminder Channels

#### Phase 1: SMS (MVP)
- Send via SMS gateway (e.g., Twilio, AWS SNS)
- Simple text message
- Low cost, high reliability

#### Phase 2: WhatsApp Business API
- Send via WhatsApp Business API
- Rich formatting with links
- Better engagement rates
- Can include quick check-in link

#### Phase 3: Mobile App Push Notification
- Native push notifications
- Instant delivery
- Interactive (check-in from notification)

### 1.3 Reminder Content

**SMS Version**:
```
Halo [Nama Pasien],

Pengingat: Anda memiliki janji temu hari ini pukul [Jam] dengan [Nama Dokter] di Klinik THT.

Booking: [BOOKING_CODE]

Silakan datang 15 menit lebih awal untuk check-in.

Terima kasih!
```

**WhatsApp Version**:
```
🏥 *Pengingat Janji Temu*

Halo *[Nama Pasien]*,

Anda memiliki janji temu hari ini:
📅 Tanggal: [Tanggal]
🕒 Waktu: [Jam]
👨‍⚕️ Dokter: [Nama Dokter]

📋 Kode Booking: *[BOOKING_CODE]*

Silakan datang 15 menit lebih awal untuk check-in.

*Quick Check-in:*
🔗 [Link QR Code]
💬 Balas dengan "CHECKIN" untuk konfirmasi

Terima kasih! 🙏
```

**Mobile App Notification**:
```
Title: Janji Temu Hari Ini
Body: Pukul [Jam] dengan [Dokter]
Actions: [Check-in Now] [View Details] [Cancel]
```

---

## 2. Database Schema for Reminders

### 2.1 New Table: `appointment_reminders`

```sql
CREATE TABLE appointment_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to appointment
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  
  -- Reminder configuration
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('sms', 'whatsapp', 'push', 'email')),
  scheduled_time TIMESTAMP NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
  
  -- Delivery details
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  
  -- Message content (for audit)
  message_content TEXT,
  recipient_phone TEXT, -- Phone number where sent
  recipient_whatsapp TEXT,
  
  -- External provider details
  provider_message_id TEXT, -- ID from SMS/WhatsApp provider
  provider_status TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_reminder_per_appointment 
    UNIQUE(appointment_id, reminder_type, scheduled_time)
);

-- Indexes for efficient querying
CREATE INDEX idx_reminders_scheduled 
  ON appointment_reminders(scheduled_time, status) 
  WHERE status = 'pending';

CREATE INDEX idx_reminders_appointment 
  ON appointment_reminders(appointment_id);

CREATE INDEX idx_reminders_status 
  ON appointment_reminders(status, sent_at);

-- Comments
COMMENT ON TABLE appointment_reminders IS 
  'Tracks appointment reminders sent via various channels';

COMMENT ON COLUMN appointment_reminders.scheduled_time IS 
  'When the reminder should be sent (typically 2 hours before appointment)';
```

### 2.2 Reminder Generation Logic

```sql
-- Function to generate reminders for appointments
CREATE OR REPLACE FUNCTION generate_appointment_reminders()
RETURNS void AS $$
BEGIN
  -- Generate reminders for appointments today, 2 hours before
  INSERT INTO appointment_reminders (
    appointment_id,
    reminder_type,
    scheduled_time,
    recipient_phone,
    message_content
  )
  SELECT 
    a.id,
    CASE 
      WHEN p.whatsapp_number IS NOT NULL THEN 'whatsapp'
      WHEN p.phone IS NOT NULL THEN 'sms'
      ELSE 'email'
    END as reminder_type,
    (a.appointment_date + a.appointment_time::time - INTERVAL '2 hours') as scheduled_time,
    COALESCE(p.whatsapp_number, p.phone) as recipient_phone,
    format(
      'Halo %s, Anda memiliki janji temu hari ini pukul %s dengan %s. Booking: %s',
      p.full_name,
      to_char(a.appointment_time, 'HH24:MI'),
      u.full_name,
      a.booking_code
    ) as message_content
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN users u ON u.id = a.doctor_id
  WHERE a.appointment_date = CURRENT_DATE
    AND a.status = 'scheduled'
    AND (a.appointment_date + a.appointment_time::time) > NOW() + INTERVAL '2 hours'
    AND NOT EXISTS (
      SELECT 1 FROM appointment_reminders ar
      WHERE ar.appointment_id = a.id
        AND ar.reminder_type IN ('sms', 'whatsapp')
        AND ar.scheduled_time::date = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule this function to run every hour via cron job
```

---

## 3. Booking Code System

### 3.1 Purpose

A unique, short code for each appointment that patients can use for:
- Quick check-in at front desk
- Phone check-in
- QR code scanning
- Reference when calling clinic

### 3.2 Database Changes

```sql
-- Add booking_code to appointments table
ALTER TABLE appointments
ADD COLUMN booking_code VARCHAR(12) UNIQUE;

-- Generate booking code function
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS VARCHAR(12) AS $$
DECLARE
  code VARCHAR(12);
  exists BOOLEAN := TRUE;
BEGIN
  WHILE exists LOOP
    -- Format: BK-YYYYMMDD-XXX
    -- Example: BK-20251103-A4K
    code := 'BK-' || 
            to_char(CURRENT_DATE, 'YYYYMMDD') || 
            '-' || 
            substring(md5(random()::text) from 1 for 3);
    code := upper(code);
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM appointments WHERE booking_code = code) INTO exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate booking code on insert
CREATE OR REPLACE FUNCTION set_booking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_booking_code
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_code();

-- Create index for fast booking code lookup
CREATE INDEX idx_appointments_booking_code 
  ON appointments(booking_code) WHERE booking_code IS NOT NULL;

COMMENT ON COLUMN appointments.booking_code IS 
  'Unique booking code for quick check-in. Format: BK-YYYYMMDD-XXX';
```

### 3.3 Booking Code Format

**Format**: `BK-YYYYMMDD-XXX`

**Components**:
- `BK`: Prefix for "Booking"
- `YYYYMMDD`: Date of appointment (helps with sorting)
- `XXX`: 3-character random alphanumeric (case-insensitive)

**Examples**:
- `BK-20251103-A4K`
- `BK-20251103-7M2`
- `BK-20251104-P9X`

**Properties**:
- ✅ Short and memorable (12 characters)
- ✅ Easy to read over phone
- ✅ Date-prefixed (helps staff)
- ✅ Unique per system
- ✅ Case-insensitive for user convenience

---

## 4. QR Code System

### 4.1 QR Code Content

**Data Encoded**:
```json
{
  "type": "appointment_checkin",
  "booking_code": "BK-20251103-A4K",
  "appointment_id": "uuid",
  "clinic_id": "uuid",
  "expires_at": "2025-11-03T12:00:00Z"
}
```

**URL Format** (for dynamic QR):
```
https://clinic.example.com/checkin?code=BK-20251103-A4K
```

### 4.2 QR Code Generation

```typescript
// Server-side QR generation (Node.js)
import QRCode from 'qrcode';

async function generateAppointmentQR(bookingCode: string): Promise<string> {
  const url = `${process.env.CLINIC_URL}/checkin?code=${bookingCode}`;
  
  const qrCodeDataURL = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return qrCodeDataURL; // Returns base64 image
}
```

### 4.3 QR Code Display

**In Confirmation Email/WhatsApp**:
```
📋 Booking Code: BK-20251103-A4K

Scan QR untuk Quick Check-in:
[QR CODE IMAGE]

Atau tunjukkan kode booking ke resepsionis.
```

**In Patient Portal/App**:
```
┌────────────────────────────────┐
│  Janji Temu Anda               │
├────────────────────────────────┤
│  10:00 - Dr. Sarah Wijaya      │
│  3 November 2025               │
│                                │
│  [    QR CODE IMAGE    ]       │
│                                │
│  Booking: BK-20251103-A4K      │
│                                │
│  [Download QR] [Share]         │
└────────────────────────────────┘
```

### 4.4 QR Code Storage

**Option 1: Generate on-demand** (Recommended)
- Generate QR when user requests
- No storage needed
- Always up-to-date

**Option 2: Pre-generate and store**
```sql
ALTER TABLE appointments
ADD COLUMN qr_code_data TEXT; -- Base64 encoded image

-- Or store in Supabase Storage
ADD COLUMN qr_code_url TEXT; -- URL to stored QR image
```

---

## 5. Quick Check-in Implementation

### 5.1 Check-in Methods

#### Method 1: Booking Code Entry (Front Desk)

**UI**: `/checkin` or `/appointments` page

```
┌────────────────────────────────────┐
│  Quick Check-in                    │
├────────────────────────────────────┤
│                                    │
│  Masukkan Kode Booking:            │
│  [BK-20251103-___]  [Check-in]     │
│                                    │
│  atau scan QR code pasien          │
│                                    │
└────────────────────────────────────┘
```

**Flow**:
```
1. Front desk types booking code
2. System searches appointment by booking_code
3. Validates appointment is today and not checked in
4. Creates queue_entry
5. Shows success with queue number
```

#### Method 2: QR Code Scan (Front Desk Kiosk/Mobile)

**UI**: QR Scanner interface

```
┌────────────────────────────────────┐
│  Scan QR Code Pasien               │
├────────────────────────────────────┤
│                                    │
│     [  CAMERA VIEW  ]              │
│                                    │
│  Arahkan kamera ke QR code         │
│  pada konfirmasi booking           │
│                                    │
└────────────────────────────────────┘
```

**Flow**:
```
1. Camera scans QR code
2. Extracts booking code from URL/data
3. Same validation as Method 1
4. Auto check-in
```

#### Method 3: Patient Self Check-in (Kiosk/Mobile App)

**UI**: Public kiosk or patient mobile app

```
┌────────────────────────────────────┐
│  Self Check-in                     │
├────────────────────────────────────┤
│  Halo! Silakan pilih:              │
│                                    │
│  [Scan QR Code]                    │
│  [Masukkan Kode Booking]           │
│  [Cari Nama/NIK]                   │
│                                    │
└────────────────────────────────────┘
```

**After successful scan/entry**:
```
┌────────────────────────────────────┐
│  ✓ Check-in Berhasil!              │
├────────────────────────────────────┤
│  Nama: Ahmad Rizki                 │
│  Dokter: Dr. Sarah Wijaya          │
│  Waktu: 10:00                      │
│                                    │
│  Nomor Antrian Anda:               │
│        【 5 】                      │
│                                    │
│  Silakan tunggu di ruang tunggu    │
│  Anda akan dipanggil sesuai giliran│
│                                    │
│  [Print Tiket Antrian]             │
└────────────────────────────────────┘
```

### 5.2 API Endpoints

#### POST `/api/checkin/booking`

**Purpose**: Check-in by booking code

**Request**:
```json
{
  "booking_code": "BK-20251103-A4K"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "queue_entry_id": "uuid",
    "queue_number": 5,
    "appointment": {
      "id": "uuid",
      "booking_code": "BK-20251103-A4K",
      "appointment_time": "10:00:00"
    },
    "patient": {
      "full_name": "Ahmad Rizki",
      "medical_record_number": "MR-20251101-001"
    },
    "doctor": {
      "full_name": "Dr. Sarah Wijaya"
    }
  }
}
```

**Error Responses**:
```json
// Booking code not found
{
  "success": false,
  "error": "BOOKING_NOT_FOUND",
  "message": "Kode booking tidak ditemukan"
}

// Already checked in
{
  "success": false,
  "error": "ALREADY_CHECKED_IN",
  "message": "Anda sudah check-in dengan nomor antrian 5",
  "data": {
    "queue_number": 5,
    "checked_in_at": "2025-11-03T08:15:00Z"
  }
}

// Wrong date
{
  "success": false,
  "error": "WRONG_DATE",
  "message": "Janji temu ini untuk tanggal 4 November 2025",
  "data": {
    "appointment_date": "2025-11-04"
  }
}

// Cancelled appointment
{
  "success": false,
  "error": "APPOINTMENT_CANCELLED",
  "message": "Janji temu ini telah dibatalkan"
}
```

#### POST `/api/checkin/qr`

**Purpose**: Check-in by QR code scan

**Request**:
```json
{
  "qr_data": "https://clinic.example.com/checkin?code=BK-20251103-A4K"
  // OR
  "qr_data": "{\"type\":\"appointment_checkin\",\"booking_code\":\"BK-20251103-A4K\"}"
}
```

**Response**: Same as `/api/checkin/booking`

**Logic**:
1. Parse QR data (URL or JSON)
2. Extract booking code
3. Call same logic as booking code check-in

#### GET `/api/appointments/:id/qr`

**Purpose**: Generate QR code for appointment

**Response**:
```json
{
  "success": true,
  "data": {
    "qr_code_url": "data:image/png;base64,iVBORw0KG...",
    "booking_code": "BK-20251103-A4K",
    "checkin_url": "https://clinic.example.com/checkin?code=BK-20251103-A4K"
  }
}
```

---

## 6. Integration with Queue System

### 6.1 Quick Check-in Flow

```
Patient arrives with booking code/QR
           ↓
Front desk scans QR or enters code
           ↓
System validates booking code
           ↓
POST /api/checkin/booking
           ↓
Backend creates queue_entry (type: appointment)
           ↓
Queue number assigned
           ↓
Patient notified of queue number
           ↓
Patient appears in /queue for doctor
```

### 6.2 Updated `queue_entries` Table

Already supports this - no changes needed:
```sql
-- Queue entry will have:
- entry_type = 'appointment'
- appointment_id = linked to appointment
- check_in_time = when QR/code scanned
```

---

## 7. Reminder Workflow

### 7.1 Automatic Reminder Generation

**Cron Job** (runs every hour):
```bash
# /etc/cron.d/appointment-reminders
0 * * * * /usr/bin/node /app/scripts/generate-reminders.js
```

**Script Logic**:
```typescript
async function generateReminders() {
  // Get appointments for today, 2 hours in future
  const appointments = await getUpcomingAppointments();
  
  for (const appointment of appointments) {
    // Check if reminder already sent
    const reminderExists = await checkReminderExists(appointment.id);
    if (reminderExists) continue;
    
    // Create reminder record
    await createReminder({
      appointment_id: appointment.id,
      reminder_type: appointment.patient.whatsapp_number ? 'whatsapp' : 'sms',
      scheduled_time: appointment.appointment_time - 2 hours,
      recipient_phone: appointment.patient.phone,
      message_content: generateMessage(appointment)
    });
  }
}
```

### 7.2 Reminder Sending

**Cron Job** (runs every 5 minutes):
```bash
# /etc/cron.d/send-reminders
*/5 * * * * /usr/bin/node /app/scripts/send-reminders.js
```

**Script Logic**:
```typescript
async function sendReminders() {
  // Get pending reminders scheduled for now or earlier
  const reminders = await getPendingReminders();
  
  for (const reminder of reminders) {
    try {
      // Check if appointment still not checked in
      const appointment = await getAppointment(reminder.appointment_id);
      if (appointment.status !== 'scheduled') {
        await markReminderCancelled(reminder.id);
        continue;
      }
      
      // Send reminder based on type
      if (reminder.reminder_type === 'whatsapp') {
        await sendWhatsAppMessage(reminder);
      } else if (reminder.reminder_type === 'sms') {
        await sendSMSMessage(reminder);
      }
      
      // Update reminder status
      await updateReminderStatus(reminder.id, 'sent');
      
    } catch (error) {
      await markReminderFailed(reminder.id, error.message);
    }
  }
}
```

### 7.3 SMS Integration (Example: Twilio)

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMSMessage(reminder: AppointmentReminder) {
  const message = await client.messages.create({
    body: reminder.message_content,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: reminder.recipient_phone
  });
  
  return {
    provider_message_id: message.sid,
    status: message.status
  };
}
```

### 7.4 WhatsApp Integration (Example: Twilio WhatsApp)

```typescript
async function sendWhatsAppMessage(reminder: AppointmentReminder) {
  const message = await client.messages.create({
    body: reminder.message_content,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${reminder.recipient_whatsapp}`
  });
  
  return {
    provider_message_id: message.sid,
    status: message.status
  };
}
```

---

## 8. Implementation Phases

### Phase 1: Booking Code System (MVP)
**Timeline**: Current sprint

- [x] Add `booking_code` column to appointments
- [x] Create booking code generation function
- [x] Add booking code to appointment confirmation
- [x] Build quick check-in UI at front desk
- [x] API endpoint: POST `/api/checkin/booking`

**Deliverable**: Front desk can check-in patients by typing booking code

### Phase 2: QR Code System
**Timeline**: Next sprint

- [ ] QR code generation function
- [ ] Add QR to appointment confirmation email
- [ ] QR scanner component (web + mobile)
- [ ] API endpoint: POST `/api/checkin/qr`
- [ ] API endpoint: GET `/api/appointments/:id/qr`

**Deliverable**: Patients can show QR code for instant check-in

### Phase 3: Reminder System (SMS)
**Timeline**: Sprint +2

- [ ] Create `appointment_reminders` table
- [ ] Reminder generation cron job
- [ ] SMS sending cron job
- [ ] Integrate with Twilio/SMS provider
- [ ] Admin interface to view reminder logs
- [ ] Opt-out mechanism

**Deliverable**: Patients receive SMS reminders 2 hours before

### Phase 4: WhatsApp Integration
**Timeline**: Sprint +3

- [ ] WhatsApp Business API setup
- [ ] WhatsApp message templates
- [ ] Interactive WhatsApp check-in (reply to confirm)
- [ ] Rich media support (QR in WhatsApp)

**Deliverable**: WhatsApp reminders with QR code

### Phase 5: Self-Service Kiosk
**Timeline**: Sprint +4

- [ ] Public-facing kiosk UI
- [ ] QR scanner at kiosk
- [ ] Queue ticket printer integration
- [ ] Kiosk-specific security (limited access)

**Deliverable**: Patients can self check-in at kiosk

### Phase 6: Mobile App Push Notifications
**Timeline**: Sprint +5

- [ ] Push notification infrastructure
- [ ] Mobile app deep linking
- [ ] One-tap check-in from notification
- [ ] Notification preferences per patient

**Deliverable**: App users get push reminders

---

## 9. Security Considerations

### 9.1 Booking Code Security

**Threats**:
- Brute force booking code guessing
- Check-in fraud (wrong person using code)

**Mitigations**:
- ✅ Rate limiting on check-in endpoint (5 attempts per IP per minute)
- ✅ Booking codes expire after appointment date
- ✅ Require additional verification for sensitive operations
- ✅ Log all check-in attempts with IP address
- ✅ Alert if booking code used multiple times

### 9.2 QR Code Security

**Threats**:
- QR code screenshot shared/reused
- QR code intercepted

**Mitigations**:
- ✅ Include appointment_id in QR for verification
- ✅ Check appointment hasn't been checked in already
- ✅ Time-based expiration (QR valid only on appointment date)
- ✅ Optional: Add timestamp to QR, validate within time window

### 9.3 Reminder Privacy

**Threats**:
- Sensitive info in SMS/WhatsApp

**Mitigations**:
- ✅ Don't include diagnosis/complaints in reminder
- ✅ Use generic language ("janji temu" not "konsultasi penyakit X")
- ✅ Allow patients to opt-out of reminders
- ✅ Comply with data privacy regulations

---

## 10. Monitoring & Analytics

### 10.1 Metrics to Track

**Reminder Effectiveness**:
- Reminder sent count per day
- Delivery success rate (delivered/sent)
- Response rate (check-in after reminder)
- No-show rate (before vs after reminders)

**Quick Check-in Usage**:
- QR code scans vs manual code entry
- Check-in method distribution
- Average check-in time (QR vs manual)
- Error rate by method

**Dashboard Query**:
```sql
-- Reminder effectiveness report
SELECT 
  DATE(sent_at) as date,
  reminder_type,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM queue_entries qe 
    WHERE qe.appointment_id = appointment_reminders.appointment_id
  )) as checked_in_after_reminder
FROM appointment_reminders
WHERE sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(sent_at), reminder_type
ORDER BY date DESC;
```

---

## 11. Testing Requirements

### 11.1 Booking Code Tests

- ✅ Generate unique booking codes
- ✅ No duplicate codes in system
- ✅ Check-in with valid code succeeds
- ✅ Check-in with invalid code fails
- ✅ Check-in with already-used code fails
- ✅ Check-in on wrong date fails
- ✅ Case-insensitive code matching

### 11.2 QR Code Tests

- ✅ QR generation produces valid QR
- ✅ QR scan extracts correct booking code
- ✅ QR check-in creates queue entry
- ✅ Invalid QR data returns error
- ✅ Expired QR (old appointment) rejected

### 11.3 Reminder Tests

- ✅ Reminders generated 2 hours before
- ✅ No duplicate reminders for same appointment
- ✅ Reminder cancelled if already checked in
- ✅ SMS sent successfully
- ✅ Failed SMS marked as failed
- ✅ WhatsApp fallback if SMS fails

---

## 12. Configuration

### 12.1 Environment Variables

```env
# SMS Provider (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxxx
TWILIO_PHONE_NUMBER=+6281234567890

# WhatsApp Business API
TWILIO_WHATSAPP_NUMBER=+6281234567890
WHATSAPP_BUSINESS_ID=xxxxxx

# Reminder Configuration
REMINDER_LEAD_TIME_HOURS=2
REMINDER_ENABLED=true
REMINDER_SMS_ENABLED=true
REMINDER_WHATSAPP_ENABLED=false

# QR Code Configuration
QR_CODE_BASE_URL=https://clinic.example.com
QR_CODE_SIZE=300
QR_CODE_ERROR_CORRECTION=M

# Check-in Configuration
CHECKIN_RATE_LIMIT=5  # per minute per IP
BOOKING_CODE_LENGTH=3  # random part length
```

### 12.2 Admin Settings UI

```
┌──────────────────────────────────────────┐
│ Pengaturan Reminder                      │
├──────────────────────────────────────────┤
│                                          │
│ ☑ Aktifkan reminder otomatis             │
│                                          │
│ Waktu pengiriman:                        │
│ [2] jam sebelum janji temu               │
│                                          │
│ Channel reminder:                        │
│ ☑ SMS                                    │
│ ☐ WhatsApp (belum tersedia)             │
│ ☐ Push notification (belum tersedia)    │
│                                          │
│ Template pesan:                          │
│ [____________________________]           │
│                                          │
│ [Simpan Pengaturan]                      │
└──────────────────────────────────────────┘
```

---

## 13. User Documentation

### 13.1 For Front Desk

**Quick Check-in Guide**:
1. Ask patient for booking code (12 characters)
2. Type code in check-in field
3. Verify patient name matches
4. Click "Check-in"
5. Give patient queue number

**QR Code Scanning** (Phase 2):
1. Click "Scan QR" button
2. Point camera at patient's phone/paper
3. System auto-checks in
4. Give patient queue number

### 13.2 For Patients

**Included in Booking Confirmation**:
```
Terima kasih telah membuat janji temu!

Detail Janji Temu:
📅 Tanggal: 3 November 2025
🕒 Waktu: 10:00
👨‍⚕️ Dokter: Dr. Sarah Wijaya

📋 Kode Booking: BK-20251103-A4K

PENTING:
- Datang 15 menit lebih awal
- Tunjukkan kode booking ke resepsionis
- Atau scan QR code di bawah:

[QR CODE IMAGE]

Anda akan menerima pengingat 2 jam sebelum janji temu.
```

---

## 14. Success Criteria

### Phase 1 Success Metrics
- [ ] 90%+ front desk staff can check-in by booking code without help
- [ ] Check-in time reduced by 30% vs manual search
- [ ] Zero booking code collisions

### Phase 2 Success Metrics
- [ ] 50%+ patients use QR code check-in
- [ ] QR scan success rate > 95%
- [ ] Check-in time < 10 seconds with QR

### Phase 3 Success Metrics
- [ ] Reminders sent successfully > 95%
- [ ] No-show rate reduced by 30%
- [ ] Patient satisfaction with reminders > 4/5

---

**Document Status**: ✅ Ready for phased implementation  
**Priority**: Phase 1 (Booking Code) - High | Phase 2+ (QR/Reminders) - Medium

---

**Related Documents**:
- Queue System Implementation Plan
- Front Desk Workflow
- Patient Communication Strategy
