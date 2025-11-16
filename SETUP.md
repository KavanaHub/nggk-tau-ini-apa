# Setup Instructions

## Prerequisites
- Node.js installed
- MySQL server running
- npm installed

## Database Setup

1. Open MySQL client/workbench
2. Run the SQL script in `database.sql`:
   ```
   source database.sql;
   ```
   Or copy-paste the contents of database.sql into MySQL

3. Verify database created:
   ```
   USE university_project;
   SHOW TABLES;
   ```

## Environment Configuration

1. Edit `.env` file with your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=university_project
   DB_PORT=3306
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   PORT=3000
   ```

## Running the Server

```bash
npm start
# or
node index.js
```

Server will start on `http://localhost:3000`

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user (mahasiswa or dosen)
- `POST /api/auth/login` - Login user and get JWT token

### Request Body Examples

**Register (Mahasiswa)**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "mahasiswa"
}
```

**Register (Dosen)**
```json
{
  "name": "Dr. Jane",
  "email": "jane@example.com",
  "password": "password123",
  "role": "dosen"
}
```

**Login**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Proposal Endpoints (Mahasiswa)
- `POST /api/proposals/upload` - Upload proposal PDF
- `GET /api/proposals/my-proposals` - Get student's proposals
- `GET /api/proposals/:id/download` - Download proposal

### Advisor Endpoints
- `GET /api/advisors` - Get list of advisors (Mahasiswa)
- `POST /api/advisors/select` - Select advisor for proposal (Mahasiswa)
- `GET /api/advisors/my-proposals` - Get proposals assigned to advisor (Dosen)
- `PATCH /api/advisors/approve` - Approve/reject proposal (Dosen)

### Guidance Endpoints
- `POST /api/guidance/start` - Start guidance session (Dosen)
- `GET /api/guidance/sessions` - Get guidance sessions for proposal
- `PATCH /api/guidance/complete` - Complete guidance session (Dosen)
- `PATCH /api/guidance/approve` - Approve guidance session

### Report Endpoints
- `POST /api/reports/upload` - Upload report PDF (Mahasiswa)
- `GET /api/reports` - Get all reports (Dosen)
- `GET /api/reports/:id/download` - Download report
- `PATCH /api/reports/approve` - Approve/reject report (Dosen)

### Exam Endpoints
- `POST /api/exams/submit` - Submit exam documents (Mahasiswa)
- `GET /api/exams/submissions` - Get exam submissions (Dosen)
- `PATCH /api/exams/approve` - Approve exam submission (Dosen)
- `POST /api/exams/assess` - Assess exam and give score (Dosen)
- `GET /api/exams/assessments` - Get exam assessments (Dosen)

### Request Headers
All endpoints (except auth) require:
```
Authorization: Bearer {token}
```

### Response Format
Success: `200 OK`
```json
{
  "message": "Success message",
  "token": "jwt_token",
  "user": { ... }
}
```

Error: `400/401/403/500`
```json
{
  "message": "Error message"
}
```
