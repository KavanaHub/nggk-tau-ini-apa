# Database Optimization - Quick Start Guide
## University Thesis Guidance System

**Last Updated**: November 17, 2025

---

## 🚀 Quick Implementation (30 Minutes)

Follow these steps to get immediate 10-200x performance improvements:

### Step 1: Backup Database (5 minutes)

```bash
# Create backup before making changes
mysqldump -u root -p Bimbingan_Online > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using Windows:
mysqldump -u root -p Bimbingan_Online > backup.sql
```

### Step 2: Apply Database Optimizations (10 minutes)

```bash
# Apply the optimization script
mysql -u root -p Bimbingan_Online < database-optimization.sql

# You'll see output like:
# Query OK, 0 rows affected (0.05 sec)  -- Index created
# Query OK, 0 rows affected (0.03 sec)  -- Index created
# ...
```

**What this does**:
- ✅ Adds 23 missing indexes (foreign keys, status columns, composites)
- ✅ Creates optimized views for common queries
- ✅ Adds stored procedures for complex operations
- ✅ Updates table statistics

### Step 3: Update Connection Pool (5 minutes)

```bash
# Update your application to use the optimized pool
# Option A: Replace the file
mv config/database.js config/database-old.js
mv config/database-optimized.js config/database.js

# Option B: Update import in your files
# Change: import pool from './config/database.js'
# To: import pool from './config/database-optimized.js'
```

### Step 4: Restart Application (2 minutes)

```bash
# Restart your Node.js application
npm restart

# Or if using pm2:
pm2 restart all

# Or manually:
# Stop the server (Ctrl+C)
# Start again: npm start
```

### Step 5: Verify Improvements (10 minutes)

```bash
# Check that indexes were created
mysql -u root -p Bimbingan_Online -e "SHOW INDEX FROM proposals;"
mysql -u root -p Bimbingan_Online -e "SHOW INDEX FROM reports;"
mysql -u root -p Bimbingan_Online -e "SHOW INDEX FROM exam_submissions;"

# Test an endpoint
curl http://localhost:3000/api/proposals

# Check application logs for performance
# You should see significantly faster response times
```

---

## 📊 Expected Results

### Before Optimization
- ❌ List queries: 2000-5000ms
- ❌ Single queries: 500-2000ms  
- ❌ Concurrent capacity: 10 users
- ❌ Connection errors under load

### After Optimization
- ✅ List queries: 20-100ms (20-200x faster)
- ✅ Single queries: 10-50ms (20-100x faster)
- ✅ Concurrent capacity: 50 users (5x increase)
- ✅ Stable under load

---

## 🔍 Verify Optimization Success

### Test 1: Check Indexes

```sql
-- Should show 10+ indexes for proposals
SHOW INDEX FROM proposals;

-- Should show 5+ indexes for reports
SHOW INDEX FROM reports;

-- Verify all FKs have indexes
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    COUNT(*) as index_count
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'Bimbingan_Online'
  AND COLUMN_NAME IN ('proposal_id', 'student_id', 'advisor_id', 'submission_id', 'assessor_id')
GROUP BY TABLE_NAME, COLUMN_NAME;
```

### Test 2: Check Query Performance

```sql
-- Enable performance tracking
SET profiling = 1;

-- Run a common query
SELECT p.*, u.name as student_name 
FROM proposals p 
JOIN users u ON p.student_id = u.id 
ORDER BY p.created_at DESC 
LIMIT 50;

-- Check execution time (should be < 100ms)
SHOW PROFILES;
```

### Test 3: Connection Pool Health

```javascript
// Add to any route for testing
import { getPoolStats } from './config/database-optimized.js';

app.get('/api/health/database', (req, res) => {
  const stats = getPoolStats();
  res.json({
    status: 'healthy',
    stats: stats,
    utilization: `${(stats.activeConnections / stats.config.connectionLimit * 100).toFixed(1)}%`
  });
});

// Visit: http://localhost:3000/api/health/database
```

---

## 🎯 Next Steps (Optional but Recommended)

### Week 2: Add Pagination

Update controllers to use pagination:

```javascript
// Before
const [proposals] = await pool.query('SELECT ... ORDER BY created_at DESC');

// After
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 50;
const offset = (page - 1) * limit;

const [proposals] = await pool.query(
  'SELECT ... ORDER BY created_at DESC LIMIT ? OFFSET ?',
  [limit, offset]
);

const [total] = await pool.query('SELECT COUNT(*) as count FROM proposals');

res.json({
  data: proposals,
  pagination: {
    page,
    limit,
    total: total[0].count,
    totalPages: Math.ceil(total[0].count / limit)
  }
});
```

**Affected files**:
- `controllers/proposalController.js` - getProposals
- `controllers/reportController.js` - getReports  
- `controllers/examController.js` - getExamSubmissions
- `controllers/advisorController.js` - getAdvisorProposals

### Month 2: Enable Monitoring

```bash
# Add to MySQL config (my.cnf or my.ini)
[mysqld]
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
log_queries_not_using_indexes = 1

# Restart MySQL
# Windows: services.msc -> MySQL -> Restart
# Linux: sudo systemctl restart mysql
```

---

## 🆘 Troubleshooting

### Issue: "Index already exists" error

**Solution**: Some indexes already exist, that's fine. Continue with the script.

```sql
-- If needed, check existing indexes:
SHOW INDEX FROM proposals;

-- Skip duplicate index creation errors
```

### Issue: Connection pool errors after update

**Solution**: Revert to old configuration temporarily

```bash
# Restore old config
mv config/database-old.js config/database.js

# Restart app
npm restart

# Then investigate the issue
```

### Issue: Application errors after optimization

**Solution**: Rollback database changes

```bash
# Restore from backup
mysql -u root -p Bimbingan_Online < backup.sql

# Restart app
npm restart

# Review DATABASE_PERFORMANCE_REPORT.md for details
```

### Issue: Queries still slow

**Solution**: Verify indexes are being used

```sql
-- Check if query uses indexes
EXPLAIN SELECT p.*, u.name as student_name 
FROM proposals p 
JOIN users u ON p.student_id = u.id 
WHERE p.advisor_id = 123;

-- Look for "Using index" in Extra column
-- Look for "ref" or "eq_ref" in type column (NOT "ALL")
```

---

## 📚 Documentation Reference

For detailed information, refer to:

1. **DATABASE_PERFORMANCE_REPORT.md**
   - Complete analysis of bottlenecks
   - Detailed query optimization strategies
   - Performance metrics and benchmarks

2. **database-optimization.sql**
   - All index creation statements
   - Optimized views and stored procedures
   - Maintenance queries

3. **config/database-optimized.js**
   - Optimized connection pool settings
   - Helper functions for queries
   - Connection monitoring utilities

4. **PERFORMANCE_MONITORING.md**
   - Monitoring setup guide
   - Alert configuration
   - Troubleshooting procedures

---

## ✅ Checklist

Before deploying to production:

- [ ] Database backup created
- [ ] Optimization script applied successfully
- [ ] Indexes verified (SHOW INDEX)
- [ ] Connection pool updated
- [ ] Application restarted without errors
- [ ] Query performance tested (< 100ms)
- [ ] Connection pool stats checked
- [ ] Staging environment tested (if available)
- [ ] Rollback plan prepared
- [ ] Team notified of changes

---

## 📈 Performance Metrics Baseline

Record these before and after optimization:

```sql
-- Connection stats
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';

-- Query stats
SHOW STATUS LIKE 'Slow_queries';
SHOW STATUS LIKE 'Questions';

-- Table stats
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Size_MB'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'Bimbingan_Online'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;
```

**Save these values** to compare performance improvements!

---

## 🎉 Success Criteria

You'll know optimization succeeded when:

- ✅ All list endpoints respond in < 100ms
- ✅ No "too many connections" errors
- ✅ Application handles 20+ concurrent users smoothly
- ✅ Database CPU usage drops significantly
- ✅ Slow query log shows minimal entries

---

## 💡 Pro Tips

1. **Test in staging first** if possible
2. **Monitor for 24 hours** after deployment
3. **Keep backups** for at least 7 days
4. **Review slow query log** weekly
5. **Update table statistics** monthly: `ANALYZE TABLE table_name;`

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review DATABASE_PERFORMANCE_REPORT.md
3. Examine application logs
4. Check MySQL error log
5. Verify network connectivity to database

---

**Ready to optimize? Start with Step 1 above! 🚀**
