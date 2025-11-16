# Project Workflow dengan Coordinator

## Alur Lengkap Proses Skripsi

### 1. UPLOAD PROPOSAL (Mahasiswa)
- Mahasiswa upload proposal dengan file dan deskripsi
- Status: `proposals.status = pending`

### 2. PILIH PEMBIMBING (Mahasiswa)
- Mahasiswa memilih dosen pembimbing dari list
- **Triggers:**
  - `proposals.advisor_id = [selected advisor]`
  - `proposals.coordinator_approval_status = pending_approval` ✅ **NEW**
  - `proposals.advisor_status = NULL`

### 3. APPROVE PEMBIMBING (Koordinator) ⭐ **NEW WORKFLOW**
- Koordinator melihat list pending advisor selections
  - GET `/api/advisors/coordinator/pending-selections`
- Koordinator approve atau reject pilihan pembimbing
  - PATCH `/api/advisors/coordinator/approve-selection`
  - Status dapat: `approved` atau `rejected`

**Jika APPROVED:**
- `proposals.coordinator_approval_status = approved`
- `proposals.advisor_status = pending_approval` (otomatis auto-set)
- ➡️ Lanjut ke step 4

**Jika REJECTED:**
- `proposals.coordinator_approval_status = rejected`
- Mahasiswa harus memilih pembimbing lain lagi

### 4. APPROVE PEMBIMBING (Dosen Pembimbing)
- Dosen pembimbing melihat proposals yang awaiting approval
  - GET `/api/advisors/my-proposals`
- Dosen menyetujui atau menolak
  - PATCH `/api/advisors/approve`
  - Status dapat: `approved` atau `rejected`

**Jika APPROVED:**
- `proposals.advisor_status = approved`
- ➡️ Lanjut ke step 5

### 5. PROSES BIMBINGAN (Dosen & Mahasiswa)
- Dosen membuat guidance session
  - POST `/api/guidance/start`
- Tracking pertemuan dengan pembimbing
  - Dosen: `status = in_progress` → `status = completed`
  - Dosen memberi feedback

### 6. PERSETUJUAN SIDANG & LAPORAN (Dosen)
- Mahasiswa upload laporan hasil proyek
  - POST `/api/reports/upload`
- Dosen approve laporan
  - PATCH `/api/reports/approve`

### 7. SUBMIT SIDANG (Mahasiswa)
- Mahasiswa submit berkas sidang
  - POST `/api/exams/submit`
- Koordinator/Penguji approve sidang
  - PATCH `/api/exams/approve`

### 8. PENILAIAN SIDANG (Penguji)
- Penguji assess exam dan memberi score
  - POST `/api/exams/assess`
  - Input: score, feedback, assessor_id

---

## Database Schema Changes

### User Roles (users table)
```
role: 'mahasiswa' | 'dosen' | 'koordinator' ✅ **NEW**
```

### Proposals Table
```
coordinator_approval_status: NULL | 'pending_approval' | 'approved' | 'rejected' ✅ **NEW**
advisor_status: NULL | 'pending_approval' | 'approved' | 'rejected'
```

---

## API Endpoints Summary

### Mahasiswa
- `POST /api/proposals/upload` - Upload proposal
- `GET /api/advisors` - List advisor available
- `POST /api/advisors/select` - Select advisor
- `POST /api/reports/upload` - Upload laporan
- `POST /api/exams/submit` - Submit sidang

### Koordinator ⭐ **NEW**
- `GET /api/advisors/coordinator/pending-selections` - List pending advisor selections
- `PATCH /api/advisors/coordinator/approve-selection` - Approve/reject advisor selection

### Dosen (Pembimbing)
- `GET /api/advisors/my-proposals` - View assigned proposals
- `PATCH /api/advisors/approve` - Approve/reject advisor selection
- `POST /api/guidance/start` - Create guidance session
- `PATCH /api/guidance/complete` - Complete guidance session
- `PATCH /api/reports/approve` - Approve report

### Penguji
- `POST /api/exams/assess` - Grade exam

---

## Status Flow Diagram

```
Mahasiswa Upload Proposal
    ↓
Mahasiswa Pilih Pembimbing
    ↓
coordinator_approval_status = pending_approval
    ↓
[KOORDINATOR APPROVE/REJECT] ⭐ NEW
    ├─ APPROVED → advisor_status = pending_approval
    │   ↓
    │   [DOSEN APPROVE/REJECT]
    │   ├─ APPROVED → Guidance starts
    │   └─ REJECTED → back to step 2
    │
    └─ REJECTED → back to step 2
    ↓
Proses Bimbingan (Guidance)
    ↓
Upload Laporan
    ↓
[DOSEN APPROVE LAPORAN]
    ↓
Submit Sidang
    ↓
[KOORDINATOR/PENGUJI APPROVE SIDANG]
    ↓
Penilaian Sidang (Grading)
    ↓
SELESAI
```

---

## Test Scenarios

### Scenario 1: Happy Path
1. Mahasiswa upload proposal ✓
2. Mahasiswa pilih pembimbing ✓
3. Koordinator approve ✓
4. Dosen approve ✓
5. Proses bimbingan ✓
6. Laporan & Sidang ✓

### Scenario 2: Coordinator Reject
1. Mahasiswa upload proposal ✓
2. Mahasiswa pilih pembimbing ✓
3. Koordinator reject ✓
4. Mahasiswa harus pilih pembimbing lain

### Scenario 3: Advisor Reject
1. Mahasiswa upload proposal ✓
2. Mahasiswa pilih pembimbing ✓
3. Koordinator approve ✓
4. Dosen reject ✓
5. Mahasiswa harus pilih pembimbing lain
