# Panduan Setup

## Prasyarat
- Node.js terinstal (versi 14+)
- MySQL server berjalan
- npm terinstal

## Setup Database

1. Buka MySQL client atau workbench
2. Jalankan script SQL di `database.sql`:
   ```
   source database.sql;
   ```
   Atau copy-paste isi database.sql ke MySQL

3. Verifikasi database sudah dibuat:
   ```
   USE Bimbingan_Online;
   SHOW TABLES;
   ```

## Konfigurasi Environment

1. Edit file `.env` dengan kredensial MySQL Anda:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=Bimbingan_Online
   DB_PORT=3306
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   PORT=3000
   NODE_ENV=development
   ```

2. Copy dari template jika diperlukan:
   ```bash
   cp .env.example .env
   ```

## Menjalankan Server

```bash
npm install          # Install dependencies
npm start           # Start production server
# atau
npm run dev         # Start development with nodemon (jika tersedia)
```

Server akan berjalan di `http://localhost:3000`

---

## Dokumentasi API

### 1. Endpoint Autentikasi
Untuk registrasi dan login pengguna.

**POST /api/auth/register** - Daftar pengguna baru
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "mahasiswa"
}
```
Response: User ID dan pesan sukses

**POST /api/auth/login** - Login dan dapatkan token JWT
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
Response: JWT token dan data user

### 2. Endpoint Proposal (Mahasiswa)
- `POST /api/proposals/upload` - Upload proposal PDF (dengan file)
- `GET /api/proposals/my-proposals` - Dapatkan proposal milik mahasiswa
- `GET /api/proposals/:id/download` - Download proposal

### 3. Endpoint Pembimbing (Advisor)
- `GET /api/advisors` - Dapatkan daftar dosen pembimbing (Mahasiswa)
- `POST /api/advisors/select` - Pilih pembimbing untuk proposal (Mahasiswa)
- `GET /api/advisors/my-proposals` - Dapatkan proposal yang ditugaskan (Dosen)
- `PATCH /api/advisors/approve` - Setujui/tolak proposal (Dosen)

### 4. Endpoint Bimbingan (Guidance)
- `POST /api/guidance/start` - Mulai sesi bimbingan (Dosen)
- `GET /api/guidance/sessions` - Dapatkan sesi bimbingan untuk proposal
- `PATCH /api/guidance/complete` - Selesaikan sesi bimbingan (Dosen)
- `PATCH /api/guidance/approve` - Setujui sesi bimbingan

### 5. Endpoint Laporan (Report)
- `POST /api/reports/upload` - Upload laporan PDF (Mahasiswa)
- `GET /api/reports` - Dapatkan semua laporan (Dosen)
- `GET /api/reports/:id/download` - Download laporan
- `PATCH /api/reports/approve` - Setujui/tolak laporan (Dosen)

### 6. Endpoint Ujian (Exam)
- `POST /api/exams/submit` - Kirim dokumen ujian (Mahasiswa)
- `GET /api/exams/submissions` - Dapatkan submisi ujian (Dosen)
- `PATCH /api/exams/approve` - Setujui submisi ujian (Dosen)
- `POST /api/exams/assess` - Beri nilai ujian (Dosen)
- `GET /api/exams/assessments` - Dapatkan penilaian ujian (Dosen)

---

## Header Request

Semua endpoint (kecuali auth) memerlukan header:
```
Authorization: Bearer {jwt_token}
```

## Format Response

### Success (Status 200/201)
```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": {}
}
```

### Error (Status 400/401/403/500)
```json
{
  "success": false,
  "message": "Deskripsi error",
  "error": {}
}
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Port sudah digunakan | Ubah PORT di .env atau kill process pada port tersebut |
| Koneksi database failed | Pastikan MySQL berjalan dan kredensial benar di .env |
| JWT_SECRET error | Set JWT_SECRET yang kuat di .env |
| Permission denied pada uploads | Pastikan folder uploads ada dan writable |

## Dokumentasi Lebih Lanjut

- [API_USAGE.md](./API_USAGE.md) - Contoh penggunaan API
- [WORKFLOW.md](./WORKFLOW.md) - Alur kerja sistem
- [Testing](./TESTING_QUICKSTART.md) - Panduan testing
