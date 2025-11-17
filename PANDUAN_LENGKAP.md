# Panduan Lengkap Sistem Bimbingan Online Skripsi

**Versi**: 1.0.0  
**Tanggal**: 2025-11-17  
**Status**: Production Ready

---

## 📋 Daftar Isi

1. [Ringkasan Proyek](#ringkasan-proyek)
2. [Setup dan Instalasi](#setup-dan-instalasi)
3. [Alur Kerja Sistem](#alur-kerja-sistem)
4. [Dokumentasi API](#dokumentasi-api)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Ringkasan Proyek

### Deskripsi
Sistem Bimbingan Online Skripsi adalah aplikasi backend yang dirancang untuk memfasilitasi proses bimbingan skripsi di universitas. Sistem ini mendukung tiga peran utama:
- **Mahasiswa**: Mengajukan proposal, mengikuti bimbingan, mengunggah laporan
- **Dosen Pembimbing**: Menyetujui proposal, mengelola sesi bimbingan, memberi penilaian
- **Koordinator**: Menyetujui pemilihan pembimbing, mengelola alur workflow

### Fitur Utama
- ✅ Autentikasi & Autorisasi berbasis JWT
- ✅ Manajemen Proposal Skripsi
- ✅ Sistem Pemilihan Pembimbing dengan Approval Koordinator
- ✅ Pelacakan Sesi Bimbingan
- ✅ Manajemen Laporan & Ujian
- ✅ Sistem Penilaian Multi-tier

### Tech Stack
| Komponen | Teknologi |
|----------|-----------|
| **Runtime** | Node.js 14+ |
| **Framework** | Express.js 5.x |
| **Database** | MySQL2 3.x |
| **Auth** | JWT + bcryptjs |
| **File Upload** | Multer 2.x |
| **Logging** | Winston 3.x |
| **Testing** | Jest 29.x |
| **Env Management** | Dotenv 17.x |

---

## Setup dan Instalasi

### Prasyarat
```bash
# Periksa versi Node.js
node --version    # Harus >= 14

# Periksa npm
npm --version

# MySQL running
mysql --version
```

### Langkah 1: Clone Repository
```bash
git clone <repository-url>
cd nggk-tau-ini-apa
```

### Langkah 2: Install Dependencies
```bash
npm install
```

### Langkah 3: Setup Database
```bash
# 1. Buka MySQL client
mysql -u root -p

# 2. Jalankan script setup
source database.sql;

# 3. Verifikasi
USE university_project;
SHOW TABLES;
```

### Langkah 4: Konfigurasi Environment
```bash
# Copy template
cp .env.example .env

# Edit .env dengan editor favorit
# Isi dengan kredensial MySQL Anda
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=university_project
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

### Langkah 5: Jalankan Server
```bash
# Development mode
npm run dev

# Production mode
npm start

# Server berjalan di http://localhost:3000
```

---

## Alur Kerja Sistem

### Workflow Utama

```
┌─────────────────────┐
│ 1. UPLOAD PROPOSAL  │  Mahasiswa upload proposal
│    (Mahasiswa)      │  Status: pending
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ 2. SELECT ADVISOR   │  Mahasiswa memilih pembimbing
│    (Mahasiswa)      │  Status: pending_approval
└──────────┬──────────┘
           │
┌──────────▼─────────────────────┐
│ 3. COORDINATOR APPROVAL        │  Koordinator approve pemilihan
│    (Coordinator)               │  Status: approved/rejected
└──────────┬─────────────────────┘
           │
┌──────────▼──────────┐
│ 4. ADVISOR APPROVAL │  Dosen pembimbing approve
│    (Dosen)          │  Status: approved/rejected
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ 5. GUIDANCE SESSION │  Sesi bimbingan berlangsung
│    (Dosen)          │  Multiple sessions possible
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ 6. UPLOAD REPORT    │  Mahasiswa upload laporan
│    (Mahasiswa)      │  
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ 7. APPROVE REPORT   │  Dosen approve laporan
│    (Dosen)          │  
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ 8. SUBMIT EXAM      │  Mahasiswa submit ujian
│    (Mahasiswa)      │  
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ 9. ASSESS EXAM      │  Dosen memberi nilai
│    (Dosen)          │  SELESAI ✓
└─────────────────────┘
```

### Status Diagram

```
Proposal Status Transitions:
pending → (advisor selected) → pending_approval 
          → (coordinator approved) → pending_advisor_approval
          → (advisor approved) → approved ✓

advisor_status Options:
NULL → pending_approval → approved / rejected

coordinator_approval_status Options:
NULL → pending_approval → approved / rejected
```

---

## Dokumentasi API

### 1. Authentication (Autentikasi)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Budi Santoso",
  "email": "budi@student.com", 
  "password": "SecurePass123",
  "role": "mahasiswa"  // mahasiswa | dosen | koordinator
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "User berhasil didaftarkan",
  "data": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@student.com",
    "role": "mahasiswa"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "budi@student.com",
  "password": "SecurePass123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@student.com",
    "role": "mahasiswa"
  }
}
```

### 2. Proposals (Proposal Skripsi)

#### Upload Proposal
```http
POST /api/proposals/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [PDF file]
title: "Sistem Manajemen Akademik"
description: "Proposal untuk skripsi tentang..."
```

#### Get My Proposals
```http
GET /api/proposals/my-proposals
Authorization: Bearer {token}
```

### 3. Advisors (Pembimbing)

#### Get List Advisors
```http
GET /api/advisors
Authorization: Bearer {token}
```

#### Select Advisor
```http
POST /api/advisors/select
Authorization: Bearer {token}
Content-Type: application/json

{
  "proposalId": 1,
  "advisorId": 2
}
```

#### Coordinator: Pending Selections
```http
GET /api/advisors/coordinator/pending-selections
Authorization: Bearer {token}
```

#### Coordinator: Approve Selection
```http
PATCH /api/advisors/coordinator/approve-selection
Authorization: Bearer {token}
Content-Type: application/json

{
  "proposalId": 1,
  "status": "approved"  // approved | rejected
}
```

### 4. Guidance (Bimbingan)

#### Start Guidance Session
```http
POST /api/guidance/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "proposalId": 1,
  "date": "2025-11-20",
  "notes": "Diskusi bab 1"
}
```

#### Complete Guidance
```http
PATCH /api/guidance/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": 1,
  "feedback": "Sudah good, lanjut ke bab 2"
}
```

### 5. Reports (Laporan)

#### Upload Report
```http
POST /api/reports/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [PDF file]
```

#### Approve Report
```http
PATCH /api/reports/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "reportId": 1,
  "status": "approved"  // approved | rejected
}
```

### 6. Exams (Ujian)

#### Submit Exam Documents
```http
POST /api/exams/submit
Authorization: Bearer {token}
Content-Type: multipart/form-data

files: [multiple files]
```

#### Assess Exam
```http
POST /api/exams/assess
Authorization: Bearer {token}
Content-Type: application/json

{
  "submissionId": 1,
  "score": 85,
  "feedback": "Presentasi bagus"
}
```

---

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Security Tests
```bash
npm run test:security
```

### Coverage Report
```bash
npm run test:coverage
```

### All Tests
```bash
npm test
```

---

## Deployment

### Production Setup
```bash
# Build (jika ada)
npm run build

# Set environment ke production
NODE_ENV=production

# Start server
npm start

# Monitor logs
npm run logs

# atau pakai PM2
pm2 start index.js --name "nggk-api"
pm2 save
pm2 startup
```

### Docker Deployment (Opsional)
```bash
# Build image
docker build -t nggk-api:latest .

# Run container
docker run -p 3000:3000 --env-file .env nggk-api:latest
```

---

## Troubleshooting

### Error Umum

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `EADDRINUSE: port 3000` | Port sudah digunakan | Ubah PORT di .env atau `lsof -i :3000 && kill <PID>` |
| `Cannot find module` | Dependency tidak terinstall | `npm install` |
| `Error: getaddrinfo ENOTFOUND localhost` | MySQL tidak berjalan | Pastikan MySQL service berjalan |
| `ER_ACCESS_DENIED_FOR_USER` | Kredensial MySQL salah | Cek DB_USER, DB_PASSWORD di .env |
| `jwt malformed` | Token invalid | Login ulang dan dapatkan token baru |

### Debug Mode
```bash
# Set debug environment variable
DEBUG=* npm start

# atau pakai NODE_DEBUG
NODE_DEBUG=* npm start
```

---

## File Dokumentasi Lainnya

- **[README.md](./README.md)** - Gambaran umum proyek
- **[SETUP.md](./SETUP.md)** - Panduan setup detail
- **[WORKFLOW.md](./WORKFLOW.md)** - Alur workflow sistem
- **[API_USAGE.md](./API_USAGE.md)** - Contoh penggunaan API dengan CURL
- **[TESTING_QUICKSTART.md](./TESTING_QUICKSTART.md)** - Panduan testing cepat

---

## Kontak & Support

Untuk bantuan atau pertanyaan:
- 📧 Email: [support email]
- 📱 WhatsApp: [support phone]
- 🔗 GitHub Issues: [repository URL]

---

**Generated**: 2025-11-17  
**Status**: Production Ready ✓  
**Last Updated**: 2025-11-17
