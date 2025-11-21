# SatuSehat API Credentials Setup Guide

**For Sandbox/Testing Environment**

---

## 📍 Where to Put Credentials

### Location: `.env.local` File

Create or edit the file: **`Apps/web/.env.local`**

Add the following environment variables:

```bash
# SatuSehat Integration - Sandbox Credentials
SATUSEHAT_CLIENT_ID=your_sandbox_client_id
SATUSEHAT_CLIENT_SECRET=your_sandbox_client_secret
SATUSEHAT_BASE_URL=https://api-sandbox.kemkes.go.id
SATUSEHAT_ORGANIZATION_ID=your_organization_id
```

---

## 🔑 How to Get Sandbox Credentials

### Step 1: Register on SatuSehat Developer Portal

1. Go to **SatuSehat Developer Portal**: https://developer.kemkes.go.id
2. Click **Sign Up** or **Register**
3. Fill in your clinic/organization details:
   - Organization Name
   - Email
   - Phone Number
   - Address
   - Type of Provider (Clinic/Hospital/etc)

### Step 2: Get Your Organization ID

After registration:
1. Go to your **Organization Profile**
2. Find your **Organization ID** (looks like: `org-xxxxx`)
3. Copy and save this ID

### Step 3: Create OAuth2 Application

1. In developer portal, go to **Applications** or **API Keys**
2. Click **Create New Application**
3. Fill in details:
   - **Application Name**: Your clinic system (e.g., "Aion Clinic Management")
   - **Redirect URL**: `http://localhost:3000/api/satusehat/callback` (for dev)
   - **Application Type**: Confidential Client
4. After creation, you'll get:
   - **Client ID**
   - **Client Secret**

### Step 4: Get Sandbox Base URL

SatuSehat provides different API endpoints:

**Sandbox (Testing)**:
```
https://api-sandbox.kemkes.go.id
```

**Production** (After approval):
```
https://api.kemkes.go.id
```

---

## 📋 Complete Credentials Example

### For Sandbox Testing

```bash
# .env.local file
SATUSEHAT_CLIENT_ID=abc123defgh456xyz
SATUSEHAT_CLIENT_SECRET=secret_key_abc123_very_long_string
SATUSEHAT_BASE_URL=https://api-sandbox.kemkes.go.id
SATUSEHAT_ORGANIZATION_ID=org-sandbox-clinic-001
```

### For Production (After Approval)

```bash
# .env.local file (production)
SATUSEHAT_CLIENT_ID=prod_client_id_xyz789
SATUSEHAT_CLIENT_SECRET=prod_secret_key_very_long_string
SATUSEHAT_BASE_URL=https://api.kemkes.go.id
SATUSEHAT_ORGANIZATION_ID=org-prod-clinic-001
```

---

## 🔐 How Credentials Are Used

### In the Code

**File**: `src/lib/api/satusehat/client.ts`

```typescript
export class SatuSehatClient {
  private clientId: string;
  private clientSecret: string;
  private baseURL: string;
  private organizationId: string;

  constructor() {
    // Reads from environment variables
    this.clientId = process.env.SATUSEHAT_CLIENT_ID || '';
    this.clientSecret = process.env.SATUSEHAT_CLIENT_SECRET || '';
    this.baseURL = process.env.SATUSEHAT_BASE_URL || '';
    this.organizationId = process.env.SATUSEHAT_ORGANIZATION_ID || '';
  }

  private async getAccessToken(): Promise<string> {
    // Uses clientId and clientSecret to get access token
    const res = await fetch(`${this.baseURL}/oauth2/v1/accesstoken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret
      }),
    });
    // ... rest of token fetch logic
  }
}
```

**OAuth2 Flow**:
1. Client uses `client_id` and `client_secret` to request access token
2. SatuSehat API returns `access_token` with expiration
3. Token is cached for 60 minutes (with 1-minute buffer)
4. All API requests use this token in `Authorization: Bearer {token}` header

---

## ✅ Testing Credentials Setup

### Step 1: Verify .env.local File

```bash
# Check if file exists in Apps/web/
ls -la Apps/web/.env.local
```

### Step 2: Verify Environment Variables

```bash
# In Apps/web directory
npm run build

# This will fail if env vars are missing
```

### Step 3: Test Connection

Use the admin dashboard to verify:

1. Navigate to **SatuSehat Dashboard** (if you have admin access)
2. Try registering a test patient
3. Check if sync to SatuSehat succeeds
4. Look for IHS number assignment

### Step 4: Check Logs

If credentials are wrong:

```bash
# Check browser console for errors
# Common errors:
# - "Invalid client_id or client_secret"
# - "Unauthorized"
# - "Invalid organization ID"
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Invalid client_id or client_secret"

**Cause**: Credentials don't match your registered app

**Solution**:
1. Go back to SatuSehat Developer Portal
2. Verify you copied the correct Client ID
3. Verify you copied the correct Client Secret
4. Make sure there are no extra spaces or line breaks
5. Update `.env.local` with correct values
6. Restart development server: `npm run dev`

### Issue 2: "Unauthorized" when trying to sync

**Cause**: Organization ID not registered or incorrect

**Solution**:
1. Check your organization is approved in SatuSehat
2. Verify Organization ID matches your registration
3. Contact SatuSehat support if organization not approved

### Issue 3: Patient not syncing

**Cause**: Patient data doesn't meet SatuSehat requirements

**Solution**:
1. Ensure NIK is valid 16-digit Indonesian ID
2. Ensure patient name is at least 2 characters
3. Ensure date of birth is reasonable (0-150 years old)
4. Check error message in browser console for specific validation error

### Issue 4: "Base URL not accessible"

**Cause**: Network connectivity or wrong URL

**Solution**:
1. Verify SATUSEHAT_BASE_URL is correct:
   - Sandbox: `https://api-sandbox.kemkes.go.id`
   - Production: `https://api.kemkes.go.id`
2. Check your internet connection
3. Try pinging the endpoint manually:
   ```bash
   curl https://api-sandbox.kemkes.go.id/oauth2/v1/accesstoken
   ```

---

## 📚 SatuSehat Documentation

### Official Resources

- **SatuSehat Developer Portal**: https://developer.kemkes.go.id
- **API Documentation**: https://satusehat.kemkes.go.id/platform/docs
- **FHIR R4 Specifications**: https://www.hl7.org/fhir/r4/

### Key API Endpoints (Sandbox)

```
Base URL: https://api-sandbox.kemkes.go.id

OAuth2:
- POST /oauth2/v1/accesstoken

FHIR R4:
- GET/POST /fhir-r4/v1/Patient
- GET/POST /fhir-r4/v1/Encounter
- GET/POST /fhir-r4/v1/Condition
- GET/POST /fhir-r4/v1/Observation
- GET/POST /fhir-r4/v1/MedicationRequest
```

---

## 🔄 Development Workflow

### Local Development (Sandbox)

```bash
# 1. Setup credentials
echo 'SATUSEHAT_CLIENT_ID=your_sandbox_id
SATUSEHAT_CLIENT_SECRET=your_sandbox_secret
SATUSEHAT_BASE_URL=https://api-sandbox.kemkes.go.id
SATUSEHAT_ORGANIZATION_ID=your_org_id' > Apps/web/.env.local

# 2. Start development server
cd Apps/web
npm run dev

# 3. Test at http://localhost:3000
# Go to: Pasien → Daftar Baru
# Fill form and click Simpan
# Watch SatuSehat sync happen
```

### Staging Deployment

```bash
# On staging server
# Set environment variables in hosting platform (Vercel, etc):
SATUSEHAT_CLIENT_ID=sandbox_client_id
SATUSEHAT_CLIENT_SECRET=sandbox_secret
SATUSEHAT_BASE_URL=https://api-sandbox.kemkes.go.id
SATUSEHAT_ORGANIZATION_ID=org_id
```

### Production Deployment

```bash
# On production server after SatuSehat approval
# Update environment variables:
SATUSEHAT_CLIENT_ID=production_client_id
SATUSEHAT_CLIENT_SECRET=production_secret
SATUSEHAT_BASE_URL=https://api.kemkes.go.id
SATUSEHAT_ORGANIZATION_ID=prod_org_id
```

---

## 🛡️ Security Best Practices

### 1. Never Commit Credentials

```bash
# Make sure .env.local is in .gitignore
echo ".env.local" >> .gitignore

# Verify it's in .gitignore
git check-ignore -v Apps/web/.env.local
```

### 2. Use Environment Variables

- Development: `.env.local` (git ignored)
- Staging: Platform secrets (Vercel/Heroku)
- Production: Platform secrets (Vercel/Heroku)

### 3. Rotate Credentials Periodically

- Every 90 days, rotate client secret
- Update in all environments
- Test before production deployment

### 4. Monitor API Usage

- Check SatuSehat dashboard for unusual activity
- Review sync failure rates
- Monitor rate limits

---

## 📞 Support & Troubleshooting

### Getting Help

1. **SatuSehat Support**: https://developer.kemkes.go.id/support
2. **Community Forum**: https://satusehat.kemkes.go.id/forum
3. **Email**: support@kemkes.go.id
4. **Your clinic's SatuSehat liaison**

### Required Information for Support

When contacting SatuSehat support:
- Your Organization ID
- Your Client ID
- Error message (if applicable)
- Request/Response logs
- Timestamp of issue

---

## ✅ Verification Checklist

Before going to production, verify:

- [ ] `.env.local` file created with all 4 variables
- [ ] Client ID copied correctly (no spaces)
- [ ] Client Secret copied correctly (no spaces)
- [ ] Organization ID matches registration
- [ ] Base URL points to correct environment (sandbox/prod)
- [ ] `.env.local` is in `.gitignore`
- [ ] Development server starts without env errors
- [ ] Can successfully register a test patient
- [ ] Patient sync completes and assigns IHS number
- [ ] Medical record submission works
- [ ] Prescription submission works
- [ ] Admin dashboard shows metrics

---

## 📋 Credentials Inventory Template

Use this template to track your credentials securely:

```
Project: Clinic Management System - Aion
Environment: Sandbox

Organization Name: [Your Clinic Name]
Organization ID: org-xxxxxxxxxxxxx

Client ID: abc123defgh456ijklmno
Client Secret: [HIDDEN - stored securely]
Base URL: https://api-sandbox.kemkes.go.id
Status: Active ✅

Created: 2025-11-14
Last Rotated: 2025-11-14
Next Rotation: 2026-02-14

Notes: Test clinic, approved for integration testing
```

---

**Document Version**: 1.0
**Last Updated**: November 14, 2025
**Status**: ACTIVE

For questions or issues, refer to the support contacts above.

