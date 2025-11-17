# nggk-tau-ini-apa

Sistem Bimbingan Online - Backend API dengan Express.js

## Deskripsi
Aplikasi backend untuk sistem manajemen bimbingan online universitas yang memungkinkan mahasiswa, dosen pembimbing, dan koordinator untuk mengelola proses bimbingan secara online.

## Fitur Utama
- Registrasi dan autentikasi pengguna (mahasiswa, dosen, koordinator)
- Manajemen proposal bimbingan
- Sistem pemilihan dan persetujuan pembimbing
- Pelacakan sesi bimbingan
- Manajemen laporan dan pengajuan sidang
- Sistem penilaian berbasis peran

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js 5.x (ES Modules)
- **Database**: MySQL2
- **Autentikasi**: JWT + bcryptjs
- **Upload**: Multer
- **Logging**: Winston
- **Environment**: Dotenv

## Instalasi Cepat
```bash
npm install
cp .env.example .env
npm start
```

Lihat [SETUP.md](./SETUP.md) untuk instruksi setup lengkap.
