# Deployment Guide
## ENT Clinic Management System - Production Setup

**Version**: 1.0  
**Date**: November 2025  
**Target Environment**: Production

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Supabase Setup](#2-supabase-setup)
3. [Vercel Deployment](#3-vercel-deployment)
4. [Domain & DNS Configuration](#4-domain--dns-configuration)
5. [Environment Variables](#5-environment-variables)
6. [Database Migration](#6-database-migration)
7. [External API Setup](#7-external-api-setup)
8. [SSL Certificate](#8-ssl-certificate)
9. [Monitoring & Logging](#9-monitoring--logging)
10. [Backup Strategy](#10-backup-strategy)
11. [Post-Deployment Testing](#11-post-deployment-testing)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Pre-Deployment Checklist

### 1.1 Development Completed
- [ ] All MVP features tested locally
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All unit tests passing (`npm run test`)
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] API integrations tested in sandbox/staging

### 1.2 Accounts & Credentials
- [ ] Supabase account created
- [ ] Vercel account created
- [ ] Domain registered (if using custom domain)
- [ ] BPJS VClaim credentials obtained
- [ ] SATUSEHAT credentials obtained
- [ ] Xendit/Midtrans account created
- [ ] Email service configured (for notifications - optional)

### 1.3 Documentation
- [ ] API documentation updated
- [ ] User manual prepared (for clinic staff)
- [ ] Admin guide prepared
- [ ] Backup/restore procedures documented

---

## 2. Supabase Setup

### 2.1 Create Supabase Project

1. **Go to Supabase Dashboard**
   ```
   https://app.supabase.com
   ```

2. **Create New Project**
   - Project Name: `clinic-management-prod`
   - Database Password: Generate strong password (save securely!)
   - Region: Choose closest to Indonesia (e.g., Singapore `ap-southeast-1`)
   - Pricing Plan: 
     - Start with **Pro Plan** ($25/month) for production
     - Includes 8GB database, 50GB bandwidth, 100GB storage

3. **Note Down Credentials**
   ```
   Project URL: https://xxxxx.supabase.co
   Project API Key (anon): eyJhbGc...
   Project API Key (service_role): eyJhbGc... (keep secret!)
   Database Password: (from step 2)
   ```

### 2.2 Configure Database

1. **Navigate to SQL Editor**
   - Dashboard → SQL Editor → New Query

2. **Run Initial Migration**
   ```sql
   -- Copy content from:
   -- supabase/migrations/20250101000000_initial_schema.sql
   -- Paste and execute
   ```

3. **Run RLS Policies Migration**
   ```sql
   -- Copy content from:
   -- supabase/migrations/20250102000000_add_rls_policies.sql
   -- Paste and execute
   ```

4. **Seed ICD-10 Data**
   ```sql
   -- Copy content from:
   -- supabase/migrations/20250103000000_seed_icd10.sql
   -- Paste and execute
   ```

5. **Create Indexes**
   ```sql
   -- Copy content from:
   -- supabase/migrations/20250104000000_add_indexes.sql
   -- Paste and execute
   ```

### 2.3 Configure Storage

1. **Go to Storage**
   - Dashboard → Storage → Create Bucket

2. **Create Buckets**
   ```
   Bucket Name: patient-photos
   - Public: No
   - Allowed MIME types: image/jpeg, image/png
   - Max file size: 5MB
   
   Bucket Name: medical-attachments
   - Public: No
   - Allowed MIME types: image/*, application/pdf
   - Max file size: 10MB
   ```

3. **Set Storage Policies**
   ```sql
   -- Patient photos - authenticated users can read
   CREATE POLICY "Authenticated users can view patient photos"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'patient-photos');

   -- Front desk and doctors can upload
   CREATE POLICY "Staff can upload patient photos"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'patient-photos' AND
     (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'doctor', 'front_desk')
   );

   -- Similar policies for medical-attachments
   CREATE POLICY "Authenticated users can view medical attachments"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'medical-attachments');

   CREATE POLICY "Staff can upload medical attachments"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'medical-attachments' AND
     (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'doctor')
   );
   ```

### 2.4 Configure Authentication

1. **Go to Authentication Settings**
   - Dashboard → Authentication → Settings

2. **Configure Email Auth**
   - Enable Email provider
   - Disable Email Confirmations (for internal users)
   - Set Site URL: `https://yourdomain.com`
   - Add Redirect URLs: `https://yourdomain.com/auth/callback`

3. **Configure Password Policy**
   - Minimum password length: 8 characters
   - Require uppercase: Yes
   - Require lowercase: Yes
   - Require numbers: Yes
   - Require special characters: No (optional)

4. **Session Settings**
   - JWT expiry: 28800 seconds (8 hours)
   - Refresh token rotation: Enabled

### 2.5 Create First Admin User

1. **Navigate to Authentication → Users**
2. **Add User**
   ```
   Email: your-email@example.com
   Password: (strong password)
   Email Confirmed: Yes
   ```

3. **Add User Role in SQL Editor**
   ```sql
   INSERT INTO users (id, full_name, role, phone, is_active)
   VALUES (
     '(user-uuid-from-auth-users-table)',
     'Your Name',
     'admin',
     '08123456789',
     true
   );
   ```

### 2.6 Configure Backups

1. **Go to Database → Backups**
2. **Enable Point-in-Time Recovery (PITR)**
   - Available on Pro plan
   - Allows restore to any point in last 7 days

3. **Schedule Daily Backups**
   - Automatic with Supabase Pro
   - Retention: 7 days

---

## 3. Vercel Deployment

### 3.1 Prepare Repository

1. **Initialize Git Repository** (if not already)
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ready for production"
   ```

2. **Push to GitHub**
   ```bash
   # Create repository on GitHub first
   git remote add origin https://github.com/yourusername/clinic-management.git
   git branch -M main
   git push -u origin main
   ```

3. **Create .gitignore** (ensure these are ignored)
   ```
   .env.local
   .env*.local
   node_modules/
   .next/
   out/
   dist/
   .DS_Store
   *.log
   ```

### 3.2 Deploy to Vercel

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com
   ```

2. **Import Project**
   - Click "Add New" → "Project"
   - Import from GitHub
   - Select your repository: `clinic-management`

3. **Configure Project**
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Add Environment Variables** (see section 5)

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (~3-5 minutes)
   - Note the deployment URL: `https://clinic-management-xxx.vercel.app`

### 3.3 Configure Production Domain

1. **Go to Project Settings → Domains**
2. **Add Custom Domain** (if you have one)
   ```
   yourdomain.com
   www.yourdomain.com
   ```

3. **Follow DNS Configuration Instructions**
   - See section 4 for details

---

## 4. Domain & DNS Configuration

### 4.1 Purchase Domain

**Recommended Registrars:**
- Cloudflare Registrar (best pricing, integrated DNS)
- Namecheap
- Google Domains
- Niagahoster (Indonesian registrar)

**Example**: `klinikthtsarah.com`

### 4.2 Configure DNS

#### Option A: Using Cloudflare (Recommended)

1. **Add Site to Cloudflare**
   - Go to Cloudflare Dashboard
   - Add Site → Enter your domain
   - Select Free plan

2. **Update Nameservers at Registrar**
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

3. **Add DNS Records in Cloudflare**
   ```
   Type: A
   Name: @
   IPv4: 76.76.21.21 (Vercel)
   Proxy: Enabled (orange cloud)
   
   Type: CNAME
   Name: www
   Target: cname.vercel-dns.com
   Proxy: Enabled
   ```

4. **SSL/TLS Settings**
   - Go to SSL/TLS → Overview
   - Set to "Full (strict)"
   - Enable "Always Use HTTPS"

#### Option B: Direct DNS Configuration

If not using Cloudflare, add these records at your registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4.3 Verify Domain

1. **In Vercel Dashboard**
   - Go to Domains
   - Wait for verification (can take 24-48 hours)
   - Status should show "Valid Configuration"

2. **Test Domain**
   ```bash
   # Should show Vercel IPs
   dig yourdomain.com
   
   # Should load your site
   curl -I https://yourdomain.com
   ```

---

## 5. Environment Variables

### 5.1 Production Environment Variables

**In Vercel Dashboard → Settings → Environment Variables**

Add the following:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Keep secret!

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# BPJS VClaim API
BPJS_CONS_ID=xxxxx
BPJS_SECRET_KEY=xxxxx
BPJS_USER_KEY=xxxxx
BPJS_BASE_URL=https://apijkn.bpjs-kesehatan.go.id/vclaim-rest

# SATUSEHAT API
SATUSEHAT_CLIENT_ID=xxxxx
SATUSEHAT_CLIENT_SECRET=xxxxx
SATUSEHAT_BASE_URL=https://api-satusehat.kemkes.go.id
SATUSEHAT_ORGANIZATION_ID=xxxxx

# Payment Gateway (Xendit)
XENDIT_API_KEY=xnd_production_xxxxx
XENDIT_WEBHOOK_TOKEN=xxxxx
XENDIT_BASE_URL=https://api.xendit.co

# Optional: Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxx

# Optional: Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 5.2 Environment-Specific Variables

Set these to apply to specific environments:

- **Production**: Check all
- **Preview**: Uncheck (use sandbox/staging credentials)
- **Development**: Uncheck

### 5.3 Secrets Management

**Important Security Notes:**
- Never commit `.env.local` to Git
- Use different credentials for development/staging/production
- Rotate secrets regularly (every 90 days)
- Store backup of credentials securely (1Password, LastPass, etc.)

---

## 6. Database Migration

### 6.1 Migration Strategy

**For Initial Deployment:**
- All migrations already run in Supabase setup (Section 2.2)

**For Future Updates:**

1. **Create Migration File**
   ```bash
   # In local development
   supabase migration new add_new_feature
   ```

2. **Write Migration SQL**
   ```sql
   -- supabase/migrations/20250115000000_add_new_feature.sql
   ALTER TABLE patients ADD COLUMN blood_type TEXT;
   CREATE INDEX idx_patients_blood_type ON patients(blood_type);
   ```

3. **Test Locally**
   ```bash
   supabase db reset
   ```

4. **Apply to Production**
   - Go to Supabase Dashboard → SQL Editor
   - Copy migration content
   - Execute
   - Or use Supabase CLI:
     ```bash
     supabase db push
     ```

### 6.2 Seed Data

**After migrations, seed essential data:**

1. **Services/Procedures**
   ```sql
   INSERT INTO services (code, name, category, price, bpjs_price) VALUES
   ('CONS-THT', 'Konsultasi Spesialis THT', 'consultation', 150000, 75000),
   ('PROC-001', 'Tindakan Ekstraksi Serumen', 'procedure', 100000, 50000),
   ('PROC-002', 'Pemeriksaan Audiometri', 'procedure', 200000, 100000);
   ```

2. **Common Medications**
   ```sql
   INSERT INTO medications (name, generic_name, category, unit, purchase_price, selling_price, stock_quantity, minimum_stock) VALUES
   ('Amoxicillin 500mg', 'Amoxicillin', 'antibiotic', 'kapsul', 1000, 1500, 500, 100),
   ('Paracetamol 500mg', 'Paracetamol', 'analgesic', 'tablet', 200, 500, 1000, 200);
   ```

3. **ICD-10 Codes** (common ENT diagnoses)
   ```sql
   -- Will be provided in separate seed file
   -- supabase/migrations/20250103000000_seed_icd10.sql
   ```

---

## 7. External API Setup

### 7.1 BPJS VClaim API

**Prerequisites:**
- Clinic must be registered with BPJS
- Obtain credentials from BPJS regional office

**Steps:**

1. **Register Clinic**
   - Visit BPJS regional office
   - Bring clinic documents (SIP, business license, etc.)
   - Fill registration form

2. **Obtain API Credentials**
   - Cons ID
   - Secret Key
   - User Key
   - PPK Code (clinic code)

3. **Test in Sandbox**
   ```bash
   # Use sandbox URL first
   BPJS_BASE_URL=https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev
   ```

4. **Request Production Access**
   - After testing, request production credentials
   - Update environment variables

5. **IP Whitelisting**
   - Get Vercel's outbound IPs:
     ```bash
     nslookup cname.vercel-dns.com
     ```
   - Provide to BPJS for whitelisting

### 7.2 SATUSEHAT API

**Prerequisites:**
- Clinic registered with Kemenkes
- Doctor has valid SIP/STR

**Steps:**

1. **Register Organization**
   - Visit: https://satusehat.kemkes.go.id
   - Register clinic as healthcare facility
   - Obtain Organization IHS number

2. **Register Practitioner**
   - Register doctor with SIP/STR number
   - Obtain Practitioner IHS number

3. **Request API Access**
   - Apply for API credentials
   - Provide organization details
   - Get Client ID and Secret

4. **Test in Staging**
   ```bash
   SATUSEHAT_BASE_URL=https://api-satusehat-stg.dto.kemkes.go.id
   ```

5. **Switch to Production**
   ```bash
   SATUSEHAT_BASE_URL=https://api-satusehat.kemkes.go.id
   ```

### 7.3 Xendit Payment Gateway

**Steps:**

1. **Create Xendit Account**
   - Visit: https://dashboard.xendit.co/register
   - Use business email
   - Complete KYC process

2. **Submit Documents**
   - Business license (NIB)
   - Clinic operational permit
   - Bank account details
   - Owner ID card

3. **Enable QRIS**
   - Go to Settings → Payment Methods
   - Enable QRIS
   - Set settlement account

4. **Get API Keys**
   - Go to Settings → API Keys
   - Copy Production API Key
   - Generate webhook token

5. **Configure Webhook**
   ```
   Webhook URL: https://yourdomain.com/api/webhooks/xendit
   Events: 
   - qris.payment.created
   - qris.payment.completed
   - qris.payment.failed
   ```

6. **Test Payment**
   - Use test API key first
   - Generate test QRIS
   - Scan and pay in sandbox
   - Verify webhook received

---

## 8. SSL Certificate

### 8.1 Automatic SSL (Vercel)

**Vercel provides free SSL automatically:**
- Let's Encrypt certificates
- Auto-renewal
- No configuration needed

**Verify SSL:**
```bash
# Should show valid certificate
curl -vI https://yourdomain.com
```

### 8.2 Using Cloudflare

If using Cloudflare (recommended):

1. **SSL/TLS Mode**
   - Set to "Full (strict)"
   - Ensures end-to-end encryption

2. **Always Use HTTPS**
   - Enable in SSL/TLS → Edge Certificates
   - Redirects HTTP to HTTPS automatically

3. **HSTS**
   - Enable HTTP Strict Transport Security
   - Max Age: 6 months

---

## 9. Monitoring & Logging

### 9.1 Setup Vercel Analytics

1. **Enable Analytics**
   - Go to Project → Analytics
   - Free on all plans
   - Provides real-time metrics

2. **Monitor Metrics**
   - Page views
   - Unique visitors
   - Performance (Web Vitals)
   - Errors

### 9.2 Setup Sentry (Error Tracking)

1. **Create Sentry Account**
   ```
   https://sentry.io
   ```

2. **Create Project**
   - Platform: Next.js
   - Copy DSN

3. **Install Sentry**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

4. **Configure**
   ```javascript
   // sentry.client.config.js
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });
   ```

5. **Add to Environment Variables**
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   ```

### 9.3 Setup Uptime Monitoring

**Option A: UptimeRobot (Free)**
1. Go to https://uptimerobot.com
2. Add New Monitor
   - Type: HTTPS
   - URL: https://yourdomain.com
   - Interval: 5 minutes
3. Add alert contacts (email, SMS)

**Option B: Better Uptime**
1. Go to https://betteruptime.com
2. Create monitor
3. Configure alerts

### 9.4 Log Management

**Vercel Logs:**
- Dashboard → Logs
- Real-time function logs
- 1 day retention (Free), 7 days (Pro)

**Supabase Logs:**
- Dashboard → Logs Explorer
- Database queries
- API requests
- Real-time monitoring

**For Long-term Log Storage:**
Consider integrating with:
- DataDog
- LogRocket
- Papertrail

---

## 10. Backup Strategy

### 10.1 Database Backups

**Supabase Automatic Backups:**
- Daily automated backups (Pro plan)
- 7-day retention
- Point-in-Time Recovery (PITR)

**Manual Backup:**
```bash
# Using Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql

# Or using pg_dump (if using direct connection)
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

### 10.2 Backup Schedule

**Recommended Schedule:**
- **Daily**: Automatic (Supabase)
- **Weekly**: Manual export and store offsite
- **Monthly**: Full backup before major updates

### 10.3 Backup Storage

**Store backups in:**
1. **Google Drive** (encrypted)
2. **AWS S3** or **Cloudflare R2**
3. **External hard drive** (air-gapped)

**Encryption:**
```bash
# Encrypt backup before uploading
gpg -c backup_20250101.sql
# Creates: backup_20250101.sql.gpg
```

### 10.4 Restore Procedure

**From Supabase Backup:**
1. Go to Database → Backups
2. Select backup point
3. Click "Restore"
4. Confirm restoration

**From Manual Backup:**
```bash
# Using Supabase CLI
supabase db reset
psql -h db.xxxxx.supabase.co -U postgres -d postgres < backup.sql
```

### 10.5 Test Restore

**Schedule:**
- Test restore procedure quarterly
- Document any issues
- Update procedures as needed

---

## 11. Post-Deployment Testing

### 11.1 Smoke Tests

**Immediately after deployment:**

1. **Authentication**
   - [ ] Login with admin account
   - [ ] Logout works
   - [ ] Session persistence

2. **Patient Management**
   - [ ] Register new patient
   - [ ] Search patient
   - [ ] View patient details

3. **Appointments**
   - [ ] Create appointment
   - [ ] View calendar
   - [ ] Check-in patient

4. **Medical Records**
   - [ ] Create medical record
   - [ ] Search ICD-10 codes
   - [ ] Save record

5. **Prescriptions**
   - [ ] Create prescription
   - [ ] Generate PDF
   - [ ] Download PDF

6. **Billing**
   - [ ] Generate bill
   - [ ] Process payment (test mode)
   - [ ] Generate receipt

### 11.2 Performance Tests

**Use Lighthouse (Chrome DevTools):**
```
Target Scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90
```

**Load Testing:**
```bash
# Install k6
brew install k6

# Run load test
k6 run load-test.js
```

### 11.3 Security Tests

1. **SSL Certificate**
   - Check on https://www.ssllabs.com/ssltest/
   - Should get A+ rating

2. **Security Headers**
   - Check on https://securityheaders.com
   - Should have good headers

3. **Penetration Testing**
   - Consider hiring security audit (optional)

### 11.4 User Acceptance Testing

**With Clinic Staff:**
1. Walkthrough of all features
2. Test real-world scenarios
3. Collect feedback
4. Document issues
5. Prioritize fixes

---

## 12. Troubleshooting

### 12.1 Common Issues

#### Issue: Deployment Failed

**Solution:**
```bash
# Check build logs in Vercel
# Common causes:
- TypeScript errors
- Missing environment variables
- Build timeout

# Fix locally first:
npm run build
npm run type-check
npm run lint
```

#### Issue: Database Connection Failed

**Solution:**
```bash
# Check Supabase status
# Verify environment variables
# Check if IP whitelisted (if using connection pooler)

# Test connection:
curl https://xxxxx.supabase.co/rest/v1/
```

#### Issue: BPJS API Returns Error

**Common Error Codes:**
- 201: Invalid card number
- 401: Invalid credentials
- 403: IP not whitelisted
- 500: BPJS server error

**Solution:**
- Verify credentials
- Check IP whitelist
- Contact BPJS support

#### Issue: Slow Performance

**Solutions:**
1. **Enable caching:**
   ```typescript
   export const revalidate = 3600; // 1 hour
   ```

2. **Optimize images:**
   - Use Next.js Image component
   - Compress images

3. **Database optimization:**
   - Check slow queries in Supabase
   - Add missing indexes

4. **Enable Vercel Analytics:**
   - Identify slow pages
   - Optimize based on data

### 12.2 Emergency Contacts

**Keep list of contacts:**
- Supabase Support: support@supabase.com
- Vercel Support: support@vercel.com
- BPJS IT Support: [Regional office number]
- SATUSEHAT Support: [Kemenkes contact]
- Xendit Support: support@xendit.co
- Your development team

### 12.3 Rollback Procedure

**If deployment causes critical issues:**

1. **In Vercel Dashboard:**
   - Go to Deployments
   - Find previous working deployment
   - Click "..." → Promote to Production

2. **Database Rollback:**
   - Use PITR in Supabase
   - Or restore from backup

3. **Notify Users:**
   - Send notification about temporary issues
   - Provide ETA for fix

---

## 13. Post-Deployment Maintenance

### 13.1 Regular Tasks

**Daily:**
- [ ] Check error logs (Sentry)
- [ ] Monitor uptime (UptimeRobot)
- [ ] Review system performance

**Weekly:**
- [ ] Review user feedback
- [ ] Check backup completion
- [ ] Update dependencies (`npm outdated`)

**Monthly:**
- [ ] Security audit
- [ ] Performance review
- [ ] Rotate secrets (if needed)
- [ ] Test backup restore

**Quarterly:**
- [ ] Full system audit
- [ ] User training refresher
- [ ] Update documentation
- [ ] Plan new features

### 13.2 Scaling Considerations

**When to scale up:**
- More than 100 patients/day
- More than 3 concurrent doctors
- Database > 8GB
- Bandwidth > 50GB/month

**Scaling options:**
- Upgrade Supabase to Team/Enterprise
- Optimize database queries
- Implement caching layer (Redis)
- Consider microservices for heavy features

---

## Summary Checklist

**Pre-Deployment:**
- [ ] Code tested and working
- [ ] All credentials obtained
- [ ] Documentation updated

**Infrastructure:**
- [ ] Supabase project created
- [ ] Database migrated
- [ ] RLS policies enabled
- [ ] Storage configured
- [ ] Backups enabled

**Deployment:**
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Domain configured
- [ ] SSL certificate active

**Integrations:**
- [ ] BPJS API tested
- [ ] SATUSEHAT API tested
- [ ] Payment gateway configured
- [ ] Webhooks verified

**Monitoring:**
- [ ] Sentry configured
- [ ] Uptime monitoring active
- [ ] Analytics enabled
- [ ] Logs accessible

**Testing:**
- [ ] Smoke tests passed
- [ ] Performance acceptable
- [ ] Security verified
- [ ] UAT completed

**Backup:**
- [ ] Automatic backups enabled
- [ ] Manual backup tested
- [ ] Restore procedure documented

---

## Next Steps After Deployment

1. **User Training** (1-2 days)
   - Train front desk staff
   - Train doctors
   - Provide user manual

2. **Soft Launch** (1 week)
   - Use alongside existing system
   - Monitor closely
   - Fix issues quickly

3. **Full Launch**
   - Switch completely to new system
   - Decommission old system
   - Celebrate! 🎉

4. **Continuous Improvement**
   - Collect feedback
   - Plan Phase 2 features
   - Regular updates

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: System Administrator

Good luck with your deployment! 🚀