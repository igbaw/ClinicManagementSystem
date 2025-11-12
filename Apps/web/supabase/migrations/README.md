# Database Migrations

This directory contains all Supabase database migrations for the Clinic Management System.

## Migration Order

Migrations are executed in alphabetical order by filename. The naming convention is:
```
YYYYMMDDHHMMSS_description.sql
```

## Applying Migrations

### Option 1: Supabase CLI (Recommended)
```bash
cd Apps/web
supabase db push
```

### Option 2: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file in order
4. Execute them sequentially

## Default Seeded Users

The system includes a default user for testing and initial setup:

### Front Desk User
- **Email:** `frontdesk@aionclinic.com`
- **Password:** `!Password.123`
- **Role:** `front_desk`
- **Created by:** Migration `20250104000003_seed_default_frontdesk_user.sql`
- **Status:** Email auto-confirmed (ready to use)

**⚠️ IMPORTANT:** Change this password in production environments!

## Creating New Migrations

To create a new migration:

1. Create a new file with the timestamp format:
   ```bash
   touch supabase/migrations/$(date +%Y%m%d%H%M%S)_description.sql
   ```

2. Write your SQL changes

3. Test locally first if possible

4. Apply to production via Supabase Dashboard or CLI

## Migration Files

| File | Description |
|------|-------------|
| `20250101000000_initial_schema.sql` | Initial database schema (users, patients, appointments, etc.) |
| `20250102000000_add_rls_policies.sql` | Row Level Security policies for all tables |
| `20250103000000_seed_icd10.sql` | Seed ICD-10 codes (basic) |
| `20250103000001_seed_icd10_comprehensive.sql` | Comprehensive ICD-10 codes |
| `20250103000002_add_bpjs_fields.sql` | Add BPJS-related fields |
| `20250103000003_add_queue_number.sql` | Add queue number generation |
| `20250103000004_fix_medical_records_rls.sql` | Fix medical records RLS policies |
| `20250103000005_sync_auth_users.sql` | Sync auth.users with public.users |
| `20250103000006_create_storage_buckets.sql` | Create storage buckets for file uploads |
| `20250103000007_add_medical_record_constraints.sql` | Add constraints to medical records |
| `20250103000008_create_queue_system.sql` | Create queue management system |
| `20250104000001_add_stock_deduction_function.sql` | Add automatic stock deduction |
| `20250104000002_add_diagnosis_text_field.sql` | Add diagnosis text field |
| `20250104000003_seed_default_frontdesk_user.sql` | Seed default front desk user |

## Roles in the System

The system supports three roles:

1. **admin** - Full system access
   - Manage all users
   - Access all features
   - View reports

2. **doctor** - Medical staff access
   - View assigned patient queue
   - Create/edit medical records (own)
   - Create prescriptions
   - View patient details (read-only)

3. **front_desk** - Administrative access
   - Register patients
   - Manage appointments
   - Process billing
   - Manage inventory
   - BPJS integration

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access data according to their role
- Default user is for development/testing only
- Always use strong passwords in production
- Review and update RLS policies as needed
