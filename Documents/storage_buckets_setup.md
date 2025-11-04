# Supabase Storage Buckets Setup
**Date**: November 3, 2025  
**Status**: ✅ Complete

## Overview

Two storage buckets have been created to handle file uploads in the clinic management system:

1. **`patients`** - Patient profile photos
2. **`medical-attachments`** - Medical examination photos and documents

---

## Bucket Configuration

### 1. Patient Photos Bucket (`patients`)

**Purpose**: Store patient profile pictures uploaded during registration

**Configuration**:
- **Bucket ID**: `patients`
- **Visibility**: Private (requires authentication)
- **File Size Limit**: 5 MB per file
- **Allowed MIME Types**: 
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`

**Access Policies**:
- ✅ All authenticated users can **upload** (INSERT)
- ✅ All authenticated users can **view** (SELECT)
- ✅ All authenticated users can **update** (UPDATE)
- ✅ All authenticated users can **delete** (DELETE)

**Usage in Code**:
```typescript
// Upload patient photo during registration
const { error } = await supabase.storage
  .from("patients")
  .upload(`patient-photos/${fileName}`, file);

// Get public URL
const { data } = supabase.storage
  .from("patients")
  .getPublicUrl(`patient-photos/${fileName}`);
```

**File Path Structure**:
```
patients/
  └── patient-photos/
      ├── MR-20251103-001.jpg
      ├── MR-20251103-002.png
      └── ...
```

---

### 2. Medical Attachments Bucket (`medical-attachments`)

**Purpose**: Store medical examination photos, x-rays, documents attached to medical records

**Configuration**:
- **Bucket ID**: `medical-attachments`
- **Visibility**: Private (requires authentication)
- **File Size Limit**: 10 MB per file
- **Allowed MIME Types**: 
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`
  - `application/pdf`

**Access Policies**:
- ✅ All authenticated users can **upload** (INSERT)
- ✅ All authenticated users can **view** (SELECT)
- ✅ All authenticated users can **update** (UPDATE)
- ✅ Only **doctors and admins** can **delete** (DELETE)

**Usage in Code**:
```typescript
// Upload medical attachment
const fileName = `${medicalRecordId}-${Date.now()}-${file.name}`;
const { data, error } = await supabase.storage
  .from('medical-attachments')
  .upload(fileName, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('medical-attachments')
  .getPublicUrl(fileName);
```

**File Path Structure**:
```
medical-attachments/
  ├── uuid-1234-timestamp-photo1.jpg
  ├── uuid-1234-timestamp-photo2.jpg
  ├── uuid-5678-timestamp-xray.jpg
  └── uuid-9012-timestamp-report.pdf
```

---

## Security Features

### Row-Level Security (RLS)
Both buckets have RLS enabled with the following protections:

1. **Authentication Required**: Only authenticated users can access files
2. **Private Buckets**: Files are not publicly accessible without proper authentication
3. **Role-Based Deletion**: Medical attachments can only be deleted by doctors/admins

### File Restrictions
- **Size Limits**: 
  - Patient photos: 5 MB
  - Medical attachments: 10 MB
- **Type Restrictions**: Only specific MIME types allowed
- **Validation**: Files are validated on upload

---

## Migration Applied

**File**: `supabase/migrations/20250103000006_create_storage_buckets.sql`

```bash
npx supabase db push
```

**Result**: 
- ✅ `patients` bucket created
- ✅ `medical-attachments` bucket created
- ✅ All storage policies applied
- ✅ File size and MIME type restrictions configured

---

## Testing Checklist

### Patient Photos Bucket
- [x] Bucket created successfully
- [x] Upload policy allows authenticated users
- [x] View policy allows authenticated users
- [ ] Test upload patient photo during registration
- [ ] Verify file size limit (5MB)
- [ ] Verify only images allowed

### Medical Attachments Bucket
- [x] Bucket created successfully
- [x] Upload policy allows authenticated users
- [x] View policy allows authenticated users
- [x] Delete policy restricted to doctors/admins
- [ ] Test upload photos in medical record form
- [ ] Verify file size limit (10MB)
- [ ] Verify images and PDFs allowed

---

## Usage Examples

### Patient Registration with Photo

```typescript
// In patient registration form
const photo = formData.get("photo") as File;

if (photo && photo.size > 0) {
  const fileExt = photo.name.split(".").pop();
  const fileName = `${mrNumber}.${fileExt}`;
  const filePath = `patient-photos/${fileName}`;
  
  // Upload to 'patients' bucket
  const { error } = await supabase.storage
    .from("patients")
    .upload(filePath, photo, {
      contentType: photo.type,
      upsert: false,
    });
  
  if (!error) {
    const { data } = supabase.storage
      .from("patients")
      .getPublicUrl(filePath);
    photoUrl = data.publicUrl;
  }
}
```

### Medical Record with Attachments

```typescript
// In medical record form
const attachments: File[] = [...];

for (const file of attachments) {
  const fileName = `${medicalRecordId}-${Date.now()}-${file.name}`;
  
  // Upload to 'medical-attachments' bucket
  const { data, error } = await supabase.storage
    .from('medical-attachments')
    .upload(fileName, file);
  
  if (!error) {
    const { data: { publicUrl } } = supabase.storage
      .from('medical-attachments')
      .getPublicUrl(fileName);
    uploadedUrls.push(publicUrl);
  }
}

// Store URLs in medical_records.attachments column (TEXT[])
await supabase
  .from('medical_records')
  .update({ attachments: uploadedUrls })
  .eq('id', medicalRecordId);
```

---

## Troubleshooting

### Common Issues

**Issue**: Upload fails with "Bucket not found"
- **Solution**: Verify migration was applied successfully
- **Check**: Run `SELECT * FROM storage.buckets` in SQL editor

**Issue**: Upload fails with "Permission denied"
- **Solution**: Ensure user is authenticated
- **Check**: Verify storage policies are created correctly

**Issue**: File size too large
- **Solution**: 
  - Patient photos: Compress to < 5MB
  - Medical attachments: Compress to < 10MB
  - Or adjust limits in migration file

**Issue**: Wrong file type error
- **Solution**: Verify file MIME type is in allowed list
- **Patient photos**: Only images (JPEG, PNG, WebP)
- **Medical attachments**: Images + PDF

---

## Future Enhancements

### Priority 1
- [ ] Add automatic image compression on upload
- [ ] Add thumbnail generation for patient photos
- [ ] Add virus scanning for uploaded files

### Priority 2
- [ ] Add file versioning (keep old versions)
- [ ] Add audit logging for file access
- [ ] Add automatic cleanup of orphaned files

### Priority 3
- [ ] Add CDN integration for faster access
- [ ] Add image watermarking for medical photos
- [ ] Add bulk upload capability

---

## References

- **Migration File**: `supabase/migrations/20250103000006_create_storage_buckets.sql`
- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage
- **Code Usage**: 
  - `src/app/(dashboard)/patients/new/page.tsx` (patient photos)
  - `src/app/(dashboard)/medical-records/new/page.tsx` (attachments)
