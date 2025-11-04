# Panduan Pengguna Sistem Klinik
## Klinik THT Aion Singaraja

**Versi**: 1.0  
**Tanggal**: November 2025  
**Untuk**: Staf Front Desk dan Dokter

---

## Daftar Isi

1. [Pengenalan Sistem](#1-pengenalan-sistem)
2. [Cara Login](#2-cara-login)
3. [Dashboard Utama](#3-dashboard-utama)
4. [Registrasi Pasien Baru](#4-registrasi-pasien-baru)
5. [Mencari Data Pasien](#5-mencari-data-pasien)
6. [Membuat Janji Temu](#6-membuat-janji-temu)
7. [Check-in Pasien](#7-check-in-pasien)
8. [Membuat Rekam Medis (Dokter)](#8-membuat-rekam-medis-dokter)
9. [Membuat Resep (Dokter)](#9-membuat-resep-dokter)
10. [Pembuatan Tagihan](#10-pembuatan-tagihan)
11. [Proses Pembayaran](#11-proses-pembayaran)
12. [Manajemen Stok Obat](#12-manajemen-stok-obat)
13. [Tips & Trik](#13-tips--trik)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Pengenalan Sistem

### 1.1 Apa itu Sistem Klinik THT Aion?

Sistem ini adalah aplikasi manajemen klinik berbasis web yang membantu mengelola:
- Data pasien
- Jadwal janji temu
- Rekam medis
- Resep obat
- Tagihan dan pembayaran
- Stok obat

### 1.2 Siapa yang Menggunakan Sistem Ini?

**Front Desk**:
- Registrasi pasien baru
- Membuat jadwal janji temu
- Check-in pasien
- Pembuatan tagihan
- Proses pembayaran
- Update stok obat

**Dokter**:
- Melihat jadwal pasien
- Membuat rekam medis
- Menulis resep
- Melihat riwayat medis pasien

**Admin** (Pemilik Klinik):
- Semua akses di atas
- Manajemen pengguna
- Laporan keuangan
- Setting sistem

### 1.3 Perangkat yang Dibutuhkan

- **Komputer/Laptop**: Windows, Mac, atau Linux
- **Browser**: Google Chrome (direkomendasikan), Firefox, atau Safari
- **Koneksi Internet**: Stabil (minimal 2 Mbps)
- **Printer**: Untuk cetak resep dan kwitansi

---

## 2. Cara Login

### 2.1 Membuka Aplikasi

1. Buka browser Google Chrome
2. Ketik alamat: **https://klinikthtsion.com**
3. Tekan Enter

### 2.2 Login

1. Masukkan **Email** Anda
   ```
   Contoh: frontdesk@klinikthtsion.com
   ```

2. Masukkan **Password** Anda
   ```
   Password yang diberikan oleh admin
   ```

3. Klik tombol **"Masuk"**

### 2.3 Lupa Password?

1. Klik **"Lupa Password?"** di halaman login
2. Masukkan email Anda
3. Cek email untuk link reset password
4. Klik link dan buat password baru

⚠️ **Penting**: Jangan share password Anda ke siapa pun!

---

## 3. Dashboard Utama

Setelah login, Anda akan melihat dashboard dengan menu di sebelah kiri:

### Menu untuk Front Desk:
```
🏠 Dashboard
👥 Pasien
   ├─ Daftar Pasien
   └─ Pasien Baru
📅 Janji Temu
   ├─ Kalender
   └─ Daftar Hari Ini
💰 Tagihan
   ├─ Buat Tagihan
   └─ Daftar Tagihan
💊 Inventori
   ├─ Daftar Obat
   └─ Stok Menipis
📊 Laporan (terbatas)
```

### Menu untuk Dokter:
```
🏠 Dashboard
👥 Pasien
📅 Janji Temu Saya
📝 Rekam Medis
   ├─ Buat Baru
   └─ Riwayat
💊 Resep
💊 Inventori (lihat saja)
```

---

## 4. Registrasi Pasien Baru

### 4.1 Kapan Mendaftarkan Pasien Baru?

- Pasien datang pertama kali
- Pasien lama yang belum terdaftar di sistem

### 4.2 Langkah-langkah

**Langkah 1**: Klik **"Pasien"** → **"Pasien Baru"**

**Langkah 2**: Isi formulir pendaftaran

#### Data Wajib (harus diisi):
```
✓ Nama Lengkap
  Contoh: I Made Adi Putra
  
✓ NIK (Nomor KTP)
  16 digit angka
  Contoh: 5107012345678901
  
✓ Tanggal Lahir
  Pilih dari kalender
  
✓ Jenis Kelamin
  Pilih: Laki-laki atau Perempuan
  
✓ No. Telepon
  Format: 08xxxxxxxxxx
  Contoh: 081234567890
  
✓ Alamat Lengkap
  Minimal 10 karakter
  Contoh: Jl. Ahmad Yani No. 123, Singaraja
```

#### Data Opsional (boleh dikosongkan):
```
○ No. BPJS
  13 digit angka (jika pasien punya)
  Contoh: 0001234567890
  
○ Email
  Contoh: adiputra@gmail.com
  
○ Kontak Darurat
  - Nama
  - Hubungan (Orang tua/Suami/Istri/Saudara)
  - No. Telepon
```

**Langkah 3**: Klik **"Simpan"**

✅ **Berhasil**: Sistem akan menampilkan nomor rekam medis (MR)
   ```
   Contoh: MR-20250115-001
   ```

⚠️ **Jika Gagal**:
- Cek NIK sudah benar (16 digit)
- Cek No. BPJS sudah benar (13 digit)
- Cek No. Telepon format Indonesia (08xxx)

### 4.3 Tips Registrasi

💡 **Foto Pasien** (opsional tapi direkomendasikan):
- Klik "Upload Foto" atau "Ambil Foto"
- Pastikan wajah terlihat jelas
- Memudahkan identifikasi pasien

💡 **NIK vs No. BPJS**:
- NIK: Wajib untuk semua pasien
- No. BPJS: Hanya jika pasien peserta BPJS

💡 **Cek Duplikat**:
- Sistem otomatis cek NIK duplikat
- Jika NIK sudah terdaftar, akan muncul peringatan

---

## 5. Mencari Data Pasien

### 5.1 Cara Mencari Pasien

**Langkah 1**: Klik **"Pasien"** → **"Daftar Pasien"**

**Langkah 2**: Gunakan kotak pencarian

Anda bisa mencari dengan:
- ✅ Nama pasien (sebagian juga bisa)
- ✅ Nomor MR (rekam medis)
- ✅ NIK
- ✅ Nomor BPJS

**Contoh Pencarian**:
```
Ketik: "adi"
Hasil: I Made Adi Putra, Adi Wijaya, Kadek Aditya

Ketik: "MR-20250115-001"
Hasil: Pasien dengan nomor MR tersebut

Ketik: "5107012345678901" (NIK)
Hasil: Pasien dengan NIK tersebut
```

### 5.2 Melihat Detail Pasien

1. Klik pada nama pasien dari hasil pencarian
2. Anda akan melihat:
   - Data pribadi
   - Riwayat kunjungan
   - Riwayat medis
   - Riwayat pembayaran

### 5.3 Mengubah Data Pasien

1. Di halaman detail pasien
2. Klik **"Edit Data"**
3. Ubah data yang perlu diubah
4. Klik **"Simpan Perubahan"**

⚠️ **Catatan**: NIK dan No. MR tidak bisa diubah

---

## 6. Membuat Janji Temu

### 6.1 Alur Pembuatan Janji Temu

```
1. Pasien datang/telepon
2. Cek ketersediaan jadwal
3. Buat janji temu
4. Konfirmasi ke pasien
```

### 6.2 Langkah-langkah

**Langkah 1**: Klik **"Janji Temu"** → **"Kalender"**

**Langkah 2**: Pilih tanggal dan waktu

Anda akan melihat kalender mingguan:
```
         Senin    Selasa   Rabu     Kamis    Jumat    Sabtu
08:00    Tersedia Tersedia Tersedia Tersedia Tersedia LIBUR
08:15    Tersedia Booked   Tersedia Tersedia Tersedia LIBUR
08:30    Booked   Tersedia Tersedia Booked   Tersedia LIBUR
...
```

- ✅ **Hijau** = Slot tersedia
- ❌ **Abu-abu** = Sudah terisi
- 🔴 **Merah** = Libur

**Langkah 3**: Klik slot yang tersedia

**Langkah 4**: Cari dan pilih pasien
- Ketik nama atau MR number pasien
- Atau klik **"Pasien Baru"** jika belum terdaftar

**Langkah 5**: Tambah catatan (opsional)
```
Contoh: "Pasien mengeluh telinga berdenging"
```

**Langkah 6**: Klik **"Jadwalkan"**

✅ **Berhasil**: Janji temu tersimpan
- Slot akan berubah warna jadi abu-abu (terisi)
- Pasien akan muncul di daftar hari ini

### 6.3 Aturan Jadwal

**Jam Operasional**:
- Senin - Jumat: 17:00 - 19:00
- Sabtu - Minggu: Libur

**Durasi per Pasien**: 15 menit

**Kapasitas**:
- 8 pasien per hari (maksimal)
- Jika penuh, sarankan hari lain

### 6.4 Membatalkan Janji Temu

1. Buka kalender
2. Klik pada janji temu yang akan dibatalkan
3. Klik **"Batalkan Janji"**
4. Masukkan alasan pembatalan
5. Konfirmasi

⚠️ **Catatan**: Janji yang sudah check-in tidak bisa dibatalkan

---

## 7. Check-in Pasien

### 7.1 Kapan Melakukan Check-in?

Saat pasien tiba di klinik untuk janji temu hari ini.

### 7.2 Langkah-langkah

**Langkah 1**: Klik **"Janji Temu"** → **"Daftar Hari Ini"**

Anda akan melihat daftar:
```
┌────────────────────────────────────────────┐
│ 17:00  I Made Adi Putra  [Check-in]       │
│        MR-20250115-001                     │
│        Status: Dijadwalkan                 │
├────────────────────────────────────────────┤
│ 17:15  Ni Luh Sari       [Check-in]       │
│        MR-20250110-005                     │
│        Status: Dijadwalkan                 │
└────────────────────────────────────────────┘
```

**Langkah 2**: Klik **"Check-in"** pada pasien yang datang

**Langkah 3**: Konfirmasi check-in

Status berubah menjadi:
```
┌────────────────────────────────────────────┐
│ ✓ 17:00  I Made Adi Putra                 │
│          MR-20250115-001                   │
│          Status: Check-in ✓                │
│          Antrian: 1                        │
└────────────────────────────────────────────┘
```

### 7.3 Setelah Check-in

Pasien akan:
1. Masuk ke antrian dokter
2. Muncul di layar dokter
3. Siap dipanggil untuk pemeriksaan

💡 **Tips**: Check-in pasien segera saat tiba agar antrian akurat

---

## 8. Membuat Rekam Medis (Dokter)

### 8.1 Akses Rekam Medis

**Langkah 1**: Login sebagai dokter

**Langkah 2**: Klik **"Rekam Medis"** → **"Buat Baru"**

**Langkah 3**: Pilih pasien yang sudah check-in

### 8.2 Format SOAP

Rekam medis menggunakan format SOAP:
- **S** (Subjective): Keluhan pasien
- **O** (Objective): Hasil pemeriksaan
- **A** (Assessment): Diagnosis
- **P** (Plan): Rencana tindakan

### 8.3 Mengisi Rekam Medis

#### Tab 1: Tanda Vital
```
Tekanan Darah: 120/80 mmHg
Nadi: 80 x/menit
Suhu: 36.5 °C
Berat Badan: 70 kg
```

#### Tab 2: Subjective (S)
```
Keluhan Utama:
"Telinga kanan sakit dan berdenging sejak 3 hari"

Anamnesis (cerita lengkap):
- Onset: 3 hari yang lalu
- Lokasi: Telinga kanan
- Karakteristik: Nyeri tajam, berdenging terus-menerus
- Faktor yang memperburuk: Tidur miring ke kanan
- Faktor yang meringankan: Kompres hangat
- Riwayat: Pernah berenang 4 hari lalu
- Obat yang sudah diminum: Parasetamol
```

#### Tab 3: Objective (O)
```
Pemeriksaan Fisik:

Telinga:
- Kanan: Hiperemis pada membrane timpani, sekret (+)
- Kiri: Dalam batas normal

Hidung: Dalam batas normal
Tenggorokan: Dalam batas normal
```

💡 **Tips**: Gunakan template pemeriksaan THT untuk lebih cepat

#### Tab 4: Assessment (A)
```
Diagnosis (Kode ICD-10):

1. Cari diagnosis dengan mengetik:
   Ketik: "otitis"
   
2. Pilih dari hasil:
   ✓ H66.9 - Otitis Media (Primer)
   
3. Bisa tambah diagnosis lain jika perlu
```

**Cara Mencari Kode ICD-10**:
- Ketik 2-3 huruf pertama diagnosis
- Sistem akan menampilkan pilihan
- Pilih yang paling sesuai
- Diagnosis pertama otomatis jadi diagnosis primer

#### Tab 5: Plan (P)
```
Rencana Tindakan:
1. Bersihkan telinga dengan suction
2. Terapi antibiotik oral
3. Obat tetes telinga
4. Analgetik untuk nyeri

Edukasi:
- Jaga telinga tetap kering
- Hindari berenang 2 minggu
- Jangan mengorek telinga

Kontrol: 7 hari lagi
```

**Langkah 4**: Klik **"Simpan dan Lanjut ke Resep"**

---

## 9. Membuat Resep (Dokter)

### 9.1 Setelah Menyimpan Rekam Medis

Sistem otomatis pindah ke halaman resep.

### 9.2 Menambah Obat

**Langkah 1**: Cari obat
```
Ketik: "amoxicillin"

Hasil:
┌────────────────────────────────────────┐
│ Amoxicillin 500mg - Kapsul             │
│ Stok: 150 kapsul ✓                     │
│ Harga: Rp 1.500/kapsul                 │
└────────────────────────────────────────┘
```

**Langkah 2**: Klik obat untuk menambahkan

**Langkah 3**: Atur dosis
```
Dosis: 500mg
Frekuensi: 3x sehari (pilih dari dropdown)
Waktu: Sesudah makan (pilih dari dropdown)
Durasi: 7 hari (pilih dari dropdown)

Jumlah: 21 kapsul (otomatis dihitung)
```

**Langkah 4**: Tambah instruksi khusus (opsional)
```
"Habiskan antibiotik walaupun sudah merasa baik"
```

**Langkah 5**: Klik **"Tambah ke Resep"**

### 9.3 Menambah Obat Lainnya

Ulangi langkah 1-5 untuk obat lain:
```
Contoh Resep Lengkap:

1. Amoxicillin 500mg - Kapsul
   3x sehari sesudah makan, 7 hari
   Jumlah: 21 kapsul
   
2. Tetes Telinga Otolin 10ml
   Teteskan 3-4 tetes ke telinga kanan 3x sehari
   Jumlah: 1 botol
```

### 9.4 Menyimpan dan Mencetak Resep

**Langkah 1**: Klik **"Cetak Resep"**

**Langkah 2**: Resep akan terbuka dalam format PDF

**Langkah 3**: Klik **"Print"** untuk mencetak

✅ Resep siap diberikan ke pasien

### 9.5 Format Resep yang Tercetak

```
┌─────────────────────────────────────────┐
│    KLINIK THT AION SINGARAJA            │
│    Jl. Ahmad Yani No. 123, Singaraja    │
│    Telp: (0362) 123456                  │
│                                          │
│    RESEP OBAT                            │
│                                          │
│ Nama     : I Made Adi Putra             │
│ Umur     : 35 tahun                     │
│ No. RM   : MR-20250115-001              │
│ Tanggal  : 15 Januari 2025              │
│                                          │
│ Diagnosis: Otitis Media (H66.9)         │
│                                          │
│ R/                                       │
│ 1. Amoxicillin 500mg - Kapsul           │
│    No. XXI (dua puluh satu)             │
│    S 3 dd caps I pc                     │
│    (3x sehari 1 kapsul sesudah makan)   │
│                                          │
│ 2. Tetes Telinga Otolin 10ml            │
│    No. I (satu botol)                   │
│    Teteskan 3-4 tetes ke telinga        │
│    kanan 3x sehari                      │
│                                          │
│              Singaraja, 15 Januari 2025 │
│                                          │
│              Dr. [Nama Dokter], Sp.THT  │
│              SIP: 123/SIP/2024          │
└─────────────────────────────────────────┘
```

---

## 10. Pembuatan Tagihan

### 10.1 Kapan Membuat Tagihan?

Setelah:
1. ✅ Dokter selesai memeriksa
2. ✅ Rekam medis tersimpan
3. ✅ Resep dibuat

### 10.2 Langkah-langkah

**Langkah 1**: Klik **"Tagihan"** → **"Buat Tagihan"**

**Langkah 2**: Pilih pasien yang selesai diperiksa

**Langkah 3**: Sistem otomatis menghitung

Tagihan termasuk:
```
Konsultasi Spesialis THT    Rp 150.000
Obat-obatan:
- Amoxicillin 21 kapsul     Rp  31.500
- Tetes Telinga 1 botol     Rp  45.000
────────────────────────────────────────
Subtotal                    Rp 226.500
Diskon: 0%                  Rp       0
Pajak: 0%                   Rp       0
────────────────────────────────────────
TOTAL                       Rp 226.500
```

**Langkah 4**: Pilih jenis pembayaran
- ○ BPJS
- ● Umum/Pribadi (default)

💡 **Jika BPJS**: Harga akan otomatis berubah ke tarif BPJS

**Langkah 5**: Tambah diskon jika ada (opsional)
```
Contoh: Diskon 10% untuk karyawan
```

**Langkah 6**: Klik **"Lanjut ke Pembayaran"**

---

## 11. Proses Pembayaran

### 11.1 Metode Pembayaran

Klinik THT Aion menerima:
- 💵 Tunai (Cash)
- 📱 QRIS (semua bank & e-wallet)
- 💳 Kartu Debit
- 🏥 BPJS
- 🏦 Transfer Bank

### 11.2 Pembayaran Tunai

**Langkah 1**: Pilih **"Tunai"**

**Langkah 2**: Masukkan jumlah yang diterima
```
Total Tagihan: Rp 226.500
Diterima: Rp 230.000
────────────────────────────
Kembalian: Rp 3.500
```

**Langkah 3**: Klik **"Proses Pembayaran"**

**Langkah 4**: Cetak kwitansi
- Klik **"Cetak Kwitansi"**
- Berikan ke pasien

### 11.3 Pembayaran QRIS

**Langkah 1**: Pilih **"QRIS"**

**Langkah 2**: Sistem menampilkan QR Code

**Langkah 3**: Pasien scan dengan:
- 📱 Mobile Banking (BCA, Mandiri, BRI, dll)
- 📱 E-Wallet (GoPay, Dana, ShopeePay, OVO)

**Langkah 4**: Tunggu konfirmasi
```
⏱️ Menunggu pembayaran...

(Setelah pasien bayar)

✅ Pembayaran Berhasil!
Metode: QRIS (GoPay)
Ref: QRIS123456789
```

**Langkah 5**: Cetak kwitansi

⚠️ **Jika timeout (15 menit)**:
- QR Code kadaluarsa
- Buat QRIS baru

### 11.4 Pembayaran E-Wallet Langsung

**Langkah 1**: Pilih e-wallet
- GoPay
- Dana  
- ShopeePay

**Langkah 2**: Masukkan nomor HP pasien
```
No. HP: 08123456789
```

**Langkah 3**: Pasien terima notifikasi di HP

**Langkah 4**: Pasien konfirmasi pembayaran di app

**Langkah 5**: Sistem konfirmasi otomatis

### 11.5 Pembayaran BPJS

**Langkah 1**: Pastikan SEP sudah dibuat

**Langkah 2**: Pilih **"BPJS"**

**Langkah 3**: Masukkan nomor SEP
```
No. SEP: 0301R00108250000123
```

**Langkah 4**: Klik **"Klaim BPJS"**

**Langkah 5**: Cetak kwitansi untuk arsip

💡 **Catatan**: Pembayaran BPJS tidak langsung masuk, diproses oleh BPJS

### 11.6 Format Kwitansi

```
┌─────────────────────────────────────────┐
│    KLINIK THT AION SINGARAJA            │
│    Jl. Ahmad Yani No. 123, Singaraja    │
│    Telp: (0362) 123456                  │
│                                          │
│    KWITANSI PEMBAYARAN                   │
│    No: INV-20250115-001                 │
│                                          │
│ Tanggal : 15 Januari 2025 18:30        │
│ Kasir   : Dewi (Front Desk)            │
│                                          │
│ Nama    : I Made Adi Putra             │
│ No. RM  : MR-20250115-001              │
│                                          │
│ RINCIAN:                                │
│ Konsultasi          Rp 150.000         │
│ Amoxicillin 21 kps  Rp  31.500         │
│ Tetes Telinga       Rp  45.000         │
│ ─────────────────────────────────       │
│ TOTAL               Rp 226.500         │
│                                          │
│ Metode: Tunai                           │
│ Dibayar   : Rp 230.000                 │
│ Kembali   : Rp   3.500                 │
│                                          │
│ Terima kasih atas kunjungan Anda!      │
│                                          │
│ Simpan struk sebagai bukti pembayaran  │
└─────────────────────────────────────────┘
```

---

## 12. Manajemen Stok Obat

### 12.1 Melihat Stok Obat

**Langkah 1**: Klik **"Inventori"** → **"Daftar Obat"**

Anda akan melihat:
```
┌────────────────────────────────────────────┐
│ Nama Obat             Stok   Status        │
├────────────────────────────────────────────┤
│ Amoxicillin 500mg     150    ✓ Cukup      │
│ Paracetamol 500mg     30     ⚠️ Rendah     │
│ Cetirizine 10mg       5      🔴 Habis      │
│ Tetes Telinga Otolin  25     ✓ Cukup      │
└────────────────────────────────────────────┘
```

### 12.2 Stok Menipis

**Langkah 1**: Klik **"Inventori"** → **"Stok Menipis"**

Daftar obat yang perlu direstock:
```
┌────────────────────────────────────────────┐
│ ⚠️ STOK MENIPIS                            │
├────────────────────────────────────────────┤
│ Paracetamol 500mg                          │
│ Stok: 30 tablet (Min: 50)                 │
│ Perlu order: 70 tablet                     │
│                                            │
│ Cetirizine 10mg                            │
│ Stok: 5 tablet (Min: 20)                  │
│ Perlu order: 50 tablet                     │
└────────────────────────────────────────────┘
```

### 12.3 Penyesuaian Stok

**Kapan melakukan**:
- Terima stok baru dari supplier
- Obat kadaluarsa/rusak
- Koreksi data

**Langkah 1**: Klik **"Inventori"** → **"Penyesuaian Stok"**

**Langkah 2**: Cari obat yang akan disesuaikan

**Langkah 3**: Pilih jenis penyesuaian
- Pembelian Baru (+)
- Obat Kadaluarsa (-)
- Obat Rusak (-)
- Koreksi Data (+/-)

**Langkah 4**: Masukkan jumlah
```
Obat: Amoxicillin 500mg
Stok saat ini: 150 kapsul

Jenis: Pembelian Baru
Jumlah: +100 kapsul

No. Referensi: PO-2025-001
Alasan: Pembelian dari PT Distributor ABC
Batch: BATCH2025A
Kadaluarsa: 31/12/2026

Stok setelah: 250 kapsul
```

**Langkah 5**: Klik **"Simpan"**

✅ Stok terupdate otomatis

---

## 13. Tips & Trik

### 13.1 Keyboard Shortcuts

Untuk bekerja lebih cepat:

```
Ctrl + F     = Cari/Search
Ctrl + S     = Simpan (saat edit)
Ctrl + P     = Print
Esc          = Tutup dialog/popup
Tab          = Pindah ke field berikutnya
```

### 13.2 Tips Registrasi Cepat

**Persiapkan Data Sebelum Input**:
- KTP pasien (untuk NIK)
- Kartu BPJS (jika ada)
- Foto pasien (HP/webcam)

**Urutan Efisien**:
1. Scan/foto KTP → salin NIK
2. Isi nama sambil pasien duduk
3. Data lain bisa dilengkapi kemudian

### 13.3 Tips Manajemen Jadwal

**Atur Buffer Time**:
- Jangan jadwalkan terlalu padat
- Sisakan 1-2 slot kosong untuk emergency

**Reminder**:
- Telepon/WA pasien H-1 untuk reminder
- Kurangi no-show

### 13.4 Tips Pembayaran

**Siapkan Uang Kembalian**:
```
Pecahan yang baik:
- Rp 50.000 × 10 lembar
- Rp 20.000 × 10 lembar
- Rp 10.000 × 20 lembar
- Rp 5.000 × 10 lembar
- Rp 2.000 × 10 lembar
- Rp 1.000 × 20 lembar
```

**Cek Uang Tunai di Akhir Hari**:
- Hitung fisik vs data sistem
- Catat selisih jika ada

### 13.5 Tips Stok Obat

**Cek Rutin**:
- Setiap hari: Stok obat yang sering diresepkan
- Setiap minggu: Semua stok
- Setiap bulan: Obat mendekati kadaluarsa

**Sistem FIFO** (First In First Out):
- Gunakan obat yang lama lebih dulu
- Taruh obat baru di belakang

---

## 14. Troubleshooting

### 14.1 Tidak Bisa Login

**Masalah**: Email/password salah

**Solusi**:
1. Cek CAPS LOCK mati
2. Coba reset password
3. Hubungi admin jika tetap gagal

---

**Masalah**: "Session expired"

**Solusi**:
1. Refresh browser (F5)
2. Login ulang
3. Session timeout setelah 8 jam tidak aktif

---

### 14.2 Data Pasien Tidak Muncul

**Masalah**: Pencarian tidak menemukan pasien

**Solusi**:
1. Cek ejaan nama (typo?)
2. Coba cari dengan NIK atau MR
3. Mungkin pasien memang belum terdaftar → registrasi baru

---

### 14.3 Tidak Bisa Membuat Janji Temu

**Masalah**: Semua slot penuh/abu-abu

**Solusi**:
1. Pilih hari lain
2. Atau hubungi dokter jika urgent

---

**Masalah**: "Patient already has appointment today"

**Solusi**:
- Pasien sudah punya janji hari ini
- Cek di daftar janji temu
- Batalkan janji lama jika perlu reschedule

---

### 14.4 Printer Tidak Mencetak

**Masalah**: Resep/kwitansi tidak keluar

**Solusi**:
1. Cek printer menyala
2. Cek kertas tersedia
3. Cek kabel printer terhubung
4. Coba print test page
5. Restart browser
6. Jika tetap gagal: Download PDF → print manual

---

### 14.5 QRIS Tidak Muncul

**Masalah**: QR Code tidak tampil

**Solusi**:
1. Refresh halaman
2. Cek koneksi internet
3. Buat tagihan ulang
4. Atau gunakan metode pembayaran lain

---

### 14.6 Stok Tidak Berkurang Setelah Resep

**Masalah**: Stok obat masih sama

**Solusi**:
1. Cek resep sudah di-dispensed belum
2. Klik "Tandai Dispensed" pada resep
3. Stok akan otomatis berkurang

---

### 14.7 Internet Lambat/Putus

**Masalah**: Sistem loading lama atau error

**Solusi**:
1. Cek koneksi internet
2. Restart WiFi router
3. Tutup aplikasi lain yang pakai internet
4. Jika urgent: catat manual dulu → input nanti

**Data Aman**: Semua data tersimpan di cloud, tidak hilang

---

### 14.8 Salah Input Data

**Masalah**: Sudah terlanjur salah input

**Solusi**:

**Untuk Data Pasien**:
- Bisa di-edit kapan saja
- Klik "Edit Data" → perbaiki

**Untuk Rekam Medis**:
- Hanya bisa di-edit 24 jam setelah dibuat
- Setelah itu: buat addendum (tambahan catatan)
- Hubungi admin jika perlu edit urgent

**Untuk Pembayaran**:
- Tidak bisa di-edit setelah disimpan
- Hubungi admin untuk void/refund

---

### 14.9 Lupa Cara Menggunakan Fitur

**Solusi**:
1. Buka manual ini lagi
2. Lihat di bagian terkait
3. Tanya rekan kerja
4. Hubungi admin/pemilik klinik

---

## 15. Kontak Bantuan

### Admin/Pemilik Klinik
```
Nama: [Your Name]
WhatsApp: [Your Number]
Email: admin@klinikthtsion.com
```

### Dukungan Teknis
```
Jam Kerja: Senin - Jumat, 09:00 - 17:00
Email: support@klinikthtsion.com
```

### Emergency (Sistem Down)
```
1. Catat manual di buku
2. Input ke sistem setelah online
3. Hubungi admin segera
```

---

## 16. Checklist Harian

### Pagi Hari (Sebelum Operasional)
- [ ] Login ke sistem
- [ ] Cek jadwal hari ini
- [ ] Cek stok obat
- [ ] Siapkan uang kembalian
- [ ] Test printer

### Saat Operasional
- [ ] Check-in pasien saat tiba
- [ ] Update jadwal jika ada perubahan
- [ ] Proses pembayaran segera setelah pemeriksaan
- [ ] Cetak resep dan kwitansi

### Akhir Hari
- [ ] Cek semua pasien sudah dibayar
- [ ] Hitung uang tunai
- [ ] Cek stok obat yang dipakai hari ini
- [ ] Logout dari sistem

---

## Lampiran A: Istilah Medis Umum

| Istilah | Arti |
|---------|------|
| Anamnesis | Wawancara medis, cerita penyakit |
| SOAP | Format rekam medis (Subjective, Objective, Assessment, Plan) |
| ICD-10 | Kode diagnosis internasional |
| Vital Signs | Tanda vital (tekanan darah, nadi, suhu, dll) |
| MR Number | Nomor Rekam Medis |
| NIK | Nomor Induk Kependudukan (KTP) |
| BPJS | Badan Penyelenggara Jaminan Sosial |
| SEP | Surat Eligibilitas Peserta (BPJS) |
| Resep | Daftar obat yang diberikan dokter |
| R/ | Simbol resep (dari bahasa Latin "recipe") |

---

## Lampiran B: Kode Warna Status

### Status Janji Temu
- 🟢 **Hijau**: Slot tersedia
- ⚪ **Abu-abu**: Sudah terisi
- 🟡 **Kuning**: Check-in
- 🔵 **Biru**: Sedang diperiksa
- ✅ **Hijau centang**: Selesai
- ❌ **Merah**: Dibatalkan

### Status Pembayaran
- ⏳ **Pending**: Belum dibayar
- 🟡 **Partial**: Dibayar sebagian
- ✅ **Paid**: Lunas
- ❌ **Cancelled**: Dibatalkan

### Status Stok
- ✅ **Cukup**: Stok di atas minimum
- ⚠️ **Rendah**: Stok mendekati minimum
- 🔴 **Habis**: Stok habis

---

## Lampiran C: FAQ (Pertanyaan Sering Ditanya)

**Q: Bagaimana jika pasien datang tanpa janji?**
A: 
1. Cek jadwal apakah ada slot kosong
2. Jika ada, buatkan janji temu untuk hari ini
3. Check-in langsung
4. Atau tanya pasien bersedia tunggu jika ada pembatalan

**Q: Pasien lupa bawa kartu BPJS, bagaimana?**
A:
1. Tanya nomor BPJS (13 digit)
2. Input manual
3. Atau registrasi sebagai pasien umum dulu
4. Bisa klaim BPJS kemudian jika ada bukti

**Q: Obat habis, bagaimana?**
A:
1. Beritahu dokter
2. Dokter ganti obat alternatif
3. Atau pasien beli di apotek luar
4. Segera order obat yang habis

**Q: Sistem error/down, apa yang harus dilakukan?**
A:
1. Catat manual di buku
   - Nama pasien, keluhan
   - Diagnosis, resep
   - Pembayaran
2. Screenshot error (jika bisa)
3. Hubungi admin
4. Input ke sistem setelah online lagi

**Q: Bagaimana cara backup data?**
A:
- Otomatis backup setiap hari
- Admin yang mengatur
- Anda tidak perlu melakukan apa-apa

**Q: Boleh akses dari HP?**
A:
- Bisa, buka di browser HP
- Tapi tidak direkomendasikan
- Lebih baik pakai laptop/komputer

**Q: Password bisa diganti?**
A:
- Bisa
- Klik nama Anda di pojok kanan atas
- Pilih "Ubah Password"
- Masukkan password lama dan baru

---

## Penutup

Terima kasih telah menggunakan Sistem Klinik THT Aion!

Manual ini akan terus diperbarui sesuai perkembangan sistem.

**Ingat**:
- 🔒 Jaga kerahasiaan password
- 💾 Data pasien sangat penting dan rahasia
- 🆘 Jangan ragu bertanya jika bingung
- 📚 Baca manual ini berkala untuk refresh

**Semangat bekerja!** 💪

---

**Versi Dokumen**: 1.0  
**Terakhir Diperbarui**: November 2025  
**Kontak**: admin@klinikthtsion.com

---

## Catatan Revisi

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 1.0 | Nov 2025 | Dokumen awal |
| | | |
| | | |

---

**Klinik THT Aion Singaraja**  
*Kesehatan Telinga, Hidung, Tenggorokan Sepanjang Masa*