# API Usage Examples

## 1. Register User

### Mahasiswa
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budi Santoso",
    "email": "budi@student.com",
    "password": "pass123",
    "role": "mahasiswa"
  }'
```

### Dosen (Pembimbing)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Ahmadi",
    "email": "ahmadi@dosen.com",
    "password": "pass123",
    "role": "dosen"
  }'
```

### Koordinator
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Koordinator Skripsi",
    "email": "koordinator@univ.com",
    "password": "pass123",
    "role": "koordinator"
  }'
```

## 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "budi@student.com",
    "password": "pass123"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@student.com",
    "role": "mahasiswa"
  }
}
```

## 3. Upload Proposal (Mahasiswa)
```bash
curl -X POST http://localhost:3000/api/proposals/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@proposal.pdf" \
  -F "title=Sistem Manajemen Akademik" \
  -F "description=Proposal untuk skripsi tentang sistem manajemen akademik"
```

## 4. Get List of Advisors (Mahasiswa)
```bash
curl -X GET http://localhost:3000/api/advisors \
  -H "Authorization: Bearer {token}"
```

## 5. Select Advisor (Mahasiswa)
```bash
curl -X POST http://localhost:3000/api/advisors/select \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": 1,
    "advisorId": 2
  }'
```

## 6. Get Pending Advisor Selections (Koordinator)
```bash
curl -X GET http://localhost:3000/api/advisors/coordinator/pending-selections \
  -H "Authorization: Bearer {token}"
```

## 6b. Approve/Reject Advisor Selection (Koordinator)
```bash
curl -X PATCH http://localhost:3000/api/advisors/coordinator/approve-selection \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": 1,
    "status": "approved"
  }'
```
**Status dapat berupa:** `approved` atau `rejected`

## 7. Get My Proposals (Dosen)
```bash
curl -X GET http://localhost:3000/api/advisors/my-proposals \
  -H "Authorization: Bearer {token}"
```

## 8. Approve Proposal (Dosen)
```bash
curl -X PATCH http://localhost:3000/api/advisors/approve \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": 1,
    "status": "approved"
  }'
```

## 9. Start Guidance Session (Dosen)
```bash
curl -X POST http://localhost:3000/api/guidance/start \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": 1,
    "topic": "Topik Bab 1 - Pengenalan Sistem",
    "notes": "Diskusi awal tentang latar belakang penelitian"
  }'
```

## 10. Get Guidance Sessions
```bash
curl -X GET "http://localhost:3000/api/guidance/sessions?proposalId=1" \
  -H "Authorization: Bearer {token}"
```

## 11. Complete Guidance (Dosen)
```bash
curl -X PATCH http://localhost:3000/api/guidance/complete \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "guidanceId": 1,
    "feedback": "Bagus, lanjutkan penelitian untuk Bab 2"
  }'
```

## 12. Upload Report (Mahasiswa)
```bash
curl -X POST http://localhost:3000/api/reports/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@laporan.pdf" \
  -F "proposalId=1"
```

## 13. Get All Reports (Dosen)
```bash
curl -X GET http://localhost:3000/api/reports \
  -H "Authorization: Bearer {token}"
```

## 14. Approve Report (Dosen)
```bash
curl -X PATCH http://localhost:3000/api/reports/approve \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": 1,
    "status": "approved"
  }'
```

## 15. Submit Exam Document (Mahasiswa)
```bash
curl -X POST http://localhost:3000/api/exams/submit \
  -H "Authorization: Bearer {token}" \
  -F "file=@berkas_sidang.pdf" \
  -F "proposalId=1"
```

## 16. Get Exam Submissions (Dosen/Penguji)
```bash
curl -X GET http://localhost:3000/api/exams/submissions \
  -H "Authorization: Bearer {token}"
```

## 17. Approve Exam Submission (Dosen)
```bash
curl -X PATCH http://localhost:3000/api/exams/approve \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": 1,
    "status": "approved"
  }'
```

## 18. Assess Exam & Give Score (Penguji)
```bash
curl -X POST http://localhost:3000/api/exams/assess \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": 1,
    "assessorId": 3,
    "score": 85,
    "feedback": "Presentasi baik, pemahaman mendalam tentang topik"
  }'
```

## 19. Get Exam Assessments (Dosen)
```bash
curl -X GET http://localhost:3000/api/exams/assessments \
  -H "Authorization: Bearer {token}"
```

## Status Values

### Proposal Status
- `pending` - Menunggu approval pembimbing
- `approved` - Disetujui pembimbing
- `rejected` - Ditolak pembimbing

### Coordinator Approval Status (Advisor Selection)
- `pending_approval` - Menunggu approval koordinator untuk pilihan pembimbing
- `approved` - Koordinator menyetujui pilihan pembimbing, menunggu approval dosen
- `rejected` - Koordinator menolak pilihan pembimbing

### Advisor Approval Status
- `pending_approval` - Menunggu approval dari dosen pembimbing
- `approved` - Dosen pembimbing menyetujui
- `rejected` - Dosen pembimbing menolak

### Guidance Status
- `in_progress` - Sedang berlangsung
- `completed` - Selesai
- `approved` - Disetujui mahasiswa
- `rejected` - Ditolak mahasiswa

### Report Status
- `pending` - Menunggu review
- `approved` - Disetujui
- `rejected` - Ditolak

### Exam Status
- `submitted` - Sudah submit
- `under_review` - Sedang di review
- `approved` - Disetujui
- `rejected` - Ditolak
- `assessed` - Sudah dinilai
