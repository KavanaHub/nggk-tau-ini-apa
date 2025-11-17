# Database Migration Guide
**University Thesis Guidance System - Schema Enhancement**

---

## Overview

This directory contains SQL migration scripts to upgrade the database schema from v1.0 to v2.0, implementing:
- ✅ Support tables (departments, academic years, audit logs)
- ✅ Enhanced columns (audit trails, soft delete, file metadata)
- ✅ Performance indexes (composite, covering, partial)
- ✅ Data integrity constraints (CHECK, improved FK cascade)
- ✅ File migration from LONGBLOB to file system

**Current Schema Score:** 4.0/10  
**Target Schema Score:** 8.5/10

---

## Migration Files

| File | Description | Downtime | Risk | Order |
|------|-------------|----------|------|-------|
| `001_add_support_tables.sql` | Create new tables | ✅ Zero | Low | 1 |
| `002_enhance_existing_tables.sql` | Add columns | ✅ Zero | Low | 2 |
| `003_add_indexes_and_constraints.sql` | Indexes & constraints | ⚠️ Brief | Medium | 3 |
| `004_file_migration_helper.sql` | File migration prep | ✅ Zero | Low | 4 |

---

## Prerequisites

### 1. Database Backup
```bash
# Create full backup before migration
mysqldump -u root -p Bimbingan_Online > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
mysql -u root -p Bimbingan_Online < backup_YYYYMMDD_HHMMSS.sql
```

### 2. Test Environment
- ✅ Test all migrations on development/staging first
- ✅ Verify application compatibility
- ✅ Test rollback procedures
- ✅ Document any issues

### 3. Application Preparation
- Update ORM models to match new schema
- Implement soft delete filters (`WHERE deleted_at IS NULL`)
- Update file handling to use file paths instead of LONGBLOB
- Implement audit logging in application

### 4. Maintenance Window
Recommended: Saturday 2:00 AM - 4:00 AM
- Migration 001-002: 10-15 minutes
- Migration 003: 5-10 minutes (requires brief lock)
- Migration 004: Application-side, can run post-deployment
- Total downtime: ~15-20 minutes

---

## Migration Procedure

### Phase 1: Support Tables (Zero Downtime)

```bash
# Execute migration 001
mysql -u root -p Bimbingan_Online < 001_add_support_tables.sql
```

**What it does:**
- Creates `departments`, `academic_years` tables
- Creates `audit_logs`, `proposal_status_history` tables
- Creates `file_attachments`, `notifications` tables
- Creates `user_sessions`, `login_attempts` tables
- Creates `system_settings` table
- Populates sample data

**Verification:**
```sql
-- Check tables exist
SHOW TABLES LIKE '%audit%';
SHOW TABLES LIKE '%academic_years%';

-- Verify sample data
SELECT * FROM departments;
SELECT * FROM academic_years WHERE is_active = TRUE;
SELECT * FROM system_settings;
```

**Expected Time:** 2-3 minutes

---

### Phase 2: Enhance Existing Tables (Zero Downtime)

```bash
# Execute migration 002
mysql -u root -p Bimbingan_Online < 002_enhance_existing_tables.sql
```

**What it does:**
- Adds new columns to `users` (nim, nip, department, login tracking, soft delete)
- Adds new columns to `proposals` (academic_year, coordinator, file metadata, workflow timestamps, audit)
- Adds new columns to `guidance_sessions` (scheduling, meeting details, audit)
- Adds new columns to `reports` (report type, version, review tracking, audit)
- Adds new columns to `exam_submissions` (exam type, scheduling, results, audit)
- Adds new columns to `exam_assessments` (detailed scoring, feedback, audit)
- All new columns have DEFAULT values (backward compatible)

**Verification:**
```sql
-- Check new columns exist
DESCRIBE users;
DESCRIBE proposals;
DESCRIBE guidance_sessions;

-- Verify audit fields populated
SELECT COUNT(*) FROM proposals WHERE created_by IS NOT NULL;
SELECT COUNT(*) FROM reports WHERE created_by IS NOT NULL;
```

**Expected Time:** 5-7 minutes

---

### Phase 3: Indexes and Constraints (Brief Downtime)

⚠️ **WARNING:** This migration requires brief table locks

```bash
# Execute migration 003
mysql -u root -p Bimbingan_Online < 003_add_indexes_and_constraints.sql
```

**What it does:**
- Adds CHECK constraints (score ranges, data validation)
- Updates foreign key CASCADE rules
- Creates composite indexes for performance
- Creates covering indexes for list queries
- Creates partial indexes for active records
- Adds unique constraints

**Verification:**
```sql
-- Check constraints
SELECT 
  table_name, 
  constraint_name, 
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'Bimbingan_Online'
  AND constraint_type = 'CHECK';

-- Check indexes
SELECT 
  table_name,
  index_name,
  column_name,
  seq_in_index
FROM information_schema.statistics
WHERE table_schema = 'Bimbingan_Online'
  AND index_name LIKE 'idx_%'
ORDER BY table_name, index_name, seq_in_index;

-- Verify index usage
EXPLAIN SELECT * FROM proposals 
WHERE student_id = 1 AND status = 'pending' AND deleted_at IS NULL;
```

**Expected Time:** 5-8 minutes  
**Downtime:** ~30 seconds during index creation

---

### Phase 4: File Migration Preparation (Zero Downtime)

```bash
# Execute migration 004
mysql -u root -p Bimbingan_Online < 004_file_migration_helper.sql
```

**What it does:**
- Creates `file_migration_log` table
- Analyzes current file storage
- Generates migration task list
- Prepares file path structure

**Verification:**
```sql
-- Check migration statistics
SELECT 
  source_table,
  migration_status,
  COUNT(*) AS count,
  SUM(file_size_bytes) / 1024 / 1024 AS total_size_mb
FROM file_migration_log
GROUP BY source_table, migration_status;

-- List pending migrations
SELECT * FROM file_migration_log 
WHERE migration_status = 'pending'
ORDER BY file_size_bytes ASC
LIMIT 10;
```

**Expected Time:** 2-3 minutes

---

## Post-Migration Tasks

### 1. File Migration (Application-Side)

The file migration requires application code to extract LONGBLOB data and write to file system:

```javascript
// See 004_file_migration_helper.sql for complete Node.js example

const migrationScript = require('./scripts/migrate-files.js');
await migrationScript.run();
```

**Process:**
1. Query `file_migration_log` for pending files
2. For each file:
   - Read LONGBLOB data from database
   - Calculate SHA-256 checksum
   - Write to file system at specified path
   - Verify checksum
   - Update table with `file_path`, `file_size`
   - Mark migration as completed
3. Handle failures gracefully
4. After 100% success, deprecate `file_data` columns

**Timeline:** Can run during normal operation (low priority background job)

### 2. Application Code Updates

**Required Changes:**

```javascript
// OLD: Reading file from database
const proposal = await db.query('SELECT file_data FROM proposals WHERE id = ?', [id]);
const fileBuffer = proposal.file_data;

// NEW: Reading file from file system
const proposal = await db.query('SELECT file_path FROM proposals WHERE id = ?', [id]);
const fileBuffer = await fs.readFile(proposal.file_path);
```

**Soft Delete Filter:**
```javascript
// Add to all queries
WHERE deleted_at IS NULL

// Example
const proposals = await db.query(
  'SELECT * FROM proposals WHERE student_id = ? AND deleted_at IS NULL',
  [studentId]
);
```

**Audit Logging:**
```javascript
// Implement in application
async function updateProposal(id, data, userId) {
  const oldData = await getProposal(id);
  
  await db.query(
    'UPDATE proposals SET ..., updated_by = ?, updated_at = NOW() WHERE id = ?',
    [...values, userId, id]
  );
  
  await logAudit({
    table_name: 'proposals',
    record_id: id,
    action: 'UPDATE',
    old_values: oldData,
    new_values: data,
    changed_by: userId
  });
}
```

### 3. Monitoring Setup

**Enable Performance Monitoring:**
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Monitor query performance
SELECT * FROM performance_schema.events_statements_summary_by_digest
ORDER BY AVG_TIMER_WAIT DESC LIMIT 10;
```

**Create Monitoring Queries:**
```sql
-- Database size monitoring
SELECT 
  table_name,
  ROUND(data_length / 1024 / 1024, 2) AS data_mb,
  ROUND(index_length / 1024 / 1024, 2) AS index_mb
FROM information_schema.tables
WHERE table_schema = 'Bimbingan_Online'
ORDER BY data_length + index_length DESC;

-- Migration progress
SELECT 
  migration_status,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM file_migration_log), 1) AS percent
FROM file_migration_log
GROUP BY migration_status;
```

---

## Rollback Procedures

### Rollback Migration 003
```sql
-- Source the rollback section from 003_add_indexes_and_constraints.sql
-- Uncomment the ROLLBACK section at the end
```

### Rollback Migration 002
```sql
-- WARNING: This will delete data in new columns!
-- Only use in emergency
-- Source the rollback section from 002_enhance_existing_tables.sql
```

### Rollback Migration 001
```sql
-- Source the rollback section from 001_add_support_tables.sql
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS file_attachments;
DROP TABLE IF EXISTS proposal_status_history;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS academic_years;
DROP TABLE IF EXISTS departments;
```

### Full Restore from Backup
```bash
# Stop application
systemctl stop node-app

# Restore backup
mysql -u root -p Bimbingan_Online < backup_YYYYMMDD_HHMMSS.sql

# Restart application
systemctl start node-app
```

---

## Testing Checklist

### Pre-Migration Testing (Development)
- [ ] All migrations run successfully
- [ ] No foreign key constraint violations
- [ ] All indexes created successfully
- [ ] Application starts without errors
- [ ] Login functionality works
- [ ] Proposal creation works
- [ ] Guidance session creation works
- [ ] Report submission works
- [ ] Exam submission works

### Post-Migration Testing (Production)
- [ ] Database backup verified
- [ ] All tables exist
- [ ] All columns exist
- [ ] All indexes created
- [ ] All constraints active
- [ ] Sample queries perform well
- [ ] Application connects successfully
- [ ] User login works
- [ ] CRUD operations work
- [ ] File upload/download works (migration pending)

### Performance Testing
- [ ] Query response times < thresholds
- [ ] Index usage verified with EXPLAIN
- [ ] No full table scans on large tables
- [ ] Connection pool stable
- [ ] No deadlocks or lock waits

---

## Expected Improvements

### Performance Gains
| Query Type | Before | After | Improvement |
|------------|--------|-------|-------------|
| List proposals by student | 50ms | 5ms | 10x faster |
| List guidance sessions | 80ms | 10ms | 8x faster |
| Search proposals | 200ms | 20ms | 10x faster |
| Aggregate statistics | 500ms | 50ms | 10x faster |

### Storage Savings
| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| Database size | 5GB | 500MB | 90% |
| Backup size | 5GB | 500MB | 90% |
| Backup time | 30min | 3min | 90% |

### Data Integrity
| Feature | Before | After |
|---------|--------|-------|
| Audit trail | ❌ None | ✅ Complete |
| Soft delete | ❌ No | ✅ Yes |
| Referential integrity | ⚠️ Basic | ✅ Complete |
| Data validation | ⚠️ Application only | ✅ Database + App |

---

## Troubleshooting

### Issue: Migration 002 Fails with "Duplicate Column"
**Cause:** Migration already partially applied  
**Solution:**
```sql
-- Check which columns exist
DESCRIBE proposals;

-- Skip creating existing columns in migration script
```

### Issue: Migration 003 Fails with "Duplicate Key"
**Cause:** Index already exists  
**Solution:**
```sql
-- Drop existing index first
DROP INDEX idx_name ON table_name;

-- Then run migration
```

### Issue: Application Errors After Migration
**Cause:** Soft delete filter missing  
**Solution:**
```javascript
// Add to all queries
WHERE deleted_at IS NULL
```

### Issue: Slow Queries After Migration
**Cause:** Statistics outdated  
**Solution:**
```sql
-- Update table statistics
ANALYZE TABLE proposals;
ANALYZE TABLE guidance_sessions;
ANALYZE TABLE reports;
ANALYZE TABLE exam_submissions;
```

### Issue: File Migration Fails with Checksum Mismatch
**Cause:** Corruption during write  
**Solution:**
```sql
-- Mark as failed and retry
UPDATE file_migration_log 
SET migration_status = 'pending', error_message = NULL
WHERE id = ?;
```

---

## Support and Documentation

### Documentation Files
- `DATABASE_SCHEMA_ASSESSMENT.md` - Current schema analysis
- `DATABASE_SCHEMA_ENHANCED.md` - Enhanced schema design
- `DATABASE_ERD.md` - Entity relationship diagrams
- `QUERY_OPTIMIZATION_GUIDE.md` - Query patterns and optimization

### Related Scripts
- `database.sql` - Original schema
- `database-optimization.sql` - Existing optimizations
- Migration files 001-004

### Getting Help
1. Check troubleshooting section above
2. Review error messages in MySQL error log
3. Check slow query log for performance issues
4. Contact database administrator

---

## Post-Migration Maintenance

### Daily Tasks
- Monitor slow query log
- Check file migration progress
- Verify backup success

### Weekly Tasks
- Review query performance
- Check index usage statistics
- Analyze table growth
- Clean old audit logs (> 90 days)

### Monthly Tasks
- Optimize tables (OPTIMIZE TABLE)
- Update statistics (ANALYZE TABLE)
- Review and archive old data
- Update documentation

---

## Success Criteria

✅ **Migration Successful If:**
- All migrations completed without errors
- Application runs without errors
- All user workflows functional
- Query performance improved
- No data loss
- Backup/restore tested successfully

✅ **Ready for Production If:**
- Tested on staging environment
- Rollback procedure tested
- Application code updated
- Monitoring configured
- Team trained on new features

---

**Last Updated:** 2025-11-17  
**Schema Version:** 2.0  
**Maintainer:** Database Architecture Team
