# Database Performance Monitoring Strategy
## University Thesis Guidance System

---

## Table of Contents
1. [Overview](#overview)
2. [MySQL Configuration](#mysql-configuration)
3. [Slow Query Monitoring](#slow-query-monitoring)
4. [Application-Level Monitoring](#application-level-monitoring)
5. [Connection Pool Monitoring](#connection-pool-monitoring)
6. [Performance Metrics](#performance-metrics)
7. [Alerting Strategy](#alerting-strategy)
8. [Maintenance Schedule](#maintenance-schedule)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

This document outlines the comprehensive performance monitoring strategy for the MySQL database backing the University Thesis Guidance System. The strategy focuses on proactive monitoring, early bottleneck detection, and continuous optimization.

### Key Monitoring Objectives
- Identify slow queries before they impact users
- Track connection pool health and prevent exhaustion
- Monitor database resource utilization (CPU, memory, I/O)
- Detect N+1 query patterns in production
- Track query execution plan regressions
- Monitor LONGBLOB storage growth

---

## MySQL Configuration

### 1. Enable Slow Query Log

Add to MySQL configuration file (`my.cnf` or `my.ini`):

```ini
[mysqld]
# Enable slow query log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2  # Log queries taking more than 2 seconds

# Log queries not using indexes
log_queries_not_using_indexes = 1

# Throttle non-indexed queries to prevent log spam
log_throttle_queries_not_using_indexes = 10

# Log administrative statements
log_slow_admin_statements = 1

# Capture query execution time details
log_slow_extra = 1
```

### 2. Performance Schema Configuration

Enable performance schema for detailed query analysis:

```ini
[mysqld]
performance_schema = ON
performance-schema-instrument='statement/%=ON'
performance-schema-consumer-statements-digest=ON
```

### 3. General Log (Development Only)

⚠️ **WARNING**: General log has high overhead. Only enable in development.

```sql
-- Enable general log (development only)
SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = '/var/log/mysql/general.log';

-- Disable when not needed
SET GLOBAL general_log = 'OFF';
```

---

## Slow Query Monitoring

### 1. Analyze Slow Query Log

Use `mysqldumpslow` to analyze patterns:

```bash
# Top 10 slowest queries by average execution time
mysqldumpslow -s at -t 10 /var/log/mysql/slow-query.log

# Top 10 queries by total execution time
mysqldumpslow -s t -t 10 /var/log/mysql/slow-query.log

# Top 10 most frequent slow queries
mysqldumpslow -s c -t 10 /var/log/mysql/slow-query.log

# Filter queries from specific table
mysqldumpslow /var/log/mysql/slow-query.log | grep "proposals"
```

### 2. Query Performance Analysis

```sql
-- Most time-consuming queries (Performance Schema)
SELECT 
    DIGEST_TEXT AS query,
    COUNT_STAR AS exec_count,
    ROUND(AVG_TIMER_WAIT / 1000000000, 3) AS avg_time_ms,
    ROUND(SUM_TIMER_WAIT / 1000000000, 3) AS total_time_ms,
    ROUND(MAX_TIMER_WAIT / 1000000000, 3) AS max_time_ms
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME = 'Bimbingan_Online'
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;

-- Queries doing full table scans
SELECT 
    DIGEST_TEXT AS query,
    COUNT_STAR AS exec_count,
    SUM_NO_INDEX_USED AS full_scans,
    SUM_NO_GOOD_INDEX_USED AS poor_index_usage
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME = 'Bimbingan_Online'
  AND (SUM_NO_INDEX_USED > 0 OR SUM_NO_GOOD_INDEX_USED > 0)
ORDER BY SUM_NO_INDEX_USED DESC
LIMIT 20;

-- Queries with high row scans (potential N+1)
SELECT 
    DIGEST_TEXT AS query,
    COUNT_STAR AS exec_count,
    SUM_ROWS_EXAMINED AS total_rows_scanned,
    ROUND(SUM_ROWS_EXAMINED / COUNT_STAR, 0) AS avg_rows_per_query
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME = 'Bimbingan_Online'
ORDER BY SUM_ROWS_EXAMINED DESC
LIMIT 20;
```

### 3. Reset Performance Schema Statistics

```sql
-- Reset statistics to track new baseline
CALL sys.ps_truncate_all_tables(FALSE);

-- Or manually:
TRUNCATE TABLE performance_schema.events_statements_summary_by_digest;
```

---

## Application-Level Monitoring

### 1. Query Execution Time Logging

Create a middleware to log slow queries in the application:

```javascript
// middleware/queryLogger.js
import pool from '../config/database-optimized.js';

const originalQuery = pool.query.bind(pool);

pool.query = function(...args) {
  const start = Date.now();
  const sql = args[0];
  
  return originalQuery(...args).then(result => {
    const duration = Date.now() - start;
    
    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      console.warn(`[SLOW QUERY] ${duration}ms:`, sql.substring(0, 200));
    }
    
    // Optional: Send to monitoring service
    if (process.env.MONITORING_ENABLED === 'true') {
      sendQueryMetric({
        query: sql,
        duration,
        timestamp: new Date().toISOString()
      });
    }
    
    return result;
  });
};

export default pool;
```

### 2. N+1 Query Detection

Implement request-level query counting:

```javascript
// middleware/queryCounter.js
export const queryCounterMiddleware = (req, res, next) => {
  req.queryCount = 0;
  req.queries = [];
  
  const originalQuery = pool.query.bind(pool);
  pool.query = function(...args) {
    req.queryCount++;
    req.queries.push(args[0]);
    return originalQuery(...args);
  };
  
  res.on('finish', () => {
    // Alert on potential N+1 (> 10 queries per request)
    if (req.queryCount > 10) {
      console.warn(`[N+1 WARNING] ${req.method} ${req.path}: ${req.queryCount} queries`);
      console.warn('Queries:', req.queries.map(q => q.substring(0, 100)));
    }
  });
  
  next();
};
```

### 3. Express Route-Level Metrics

Track endpoint performance:

```javascript
// middleware/performanceMonitor.js
export const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow endpoints
    if (duration > 3000) {
      console.warn(`[SLOW ENDPOINT] ${req.method} ${req.path}: ${duration}ms`);
    }
    
    // Track metrics by endpoint
    recordMetric({
      endpoint: `${req.method} ${req.path}`,
      duration,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};
```

---

## Connection Pool Monitoring

### 1. Real-Time Pool Statistics

Add health check endpoint:

```javascript
// routes/health.js
import { getPoolStats } from '../config/database-optimized.js';

export const getDatabaseHealth = async (req, res) => {
  try {
    const stats = getPoolStats();
    
    // Calculate utilization percentage
    const utilization = (stats.activeConnections / stats.config.connectionLimit) * 100;
    
    // Determine health status
    let status = 'healthy';
    if (utilization > 90) status = 'critical';
    else if (utilization > 75) status = 'warning';
    
    res.json({
      status,
      pool: stats,
      utilization: `${utilization.toFixed(1)}%`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};
```

### 2. Periodic Pool Monitoring

Enable in application startup:

```javascript
// index.js
import { startPoolMonitoring } from './config/database-optimized.js';

// Start monitoring (logs every 60 seconds)
if (process.env.NODE_ENV === 'production') {
  startPoolMonitoring(60000);
}
```

### 3. Connection Leak Detection

Track long-running connections:

```javascript
// Monitor connections held longer than threshold
const trackConnections = () => {
  const activeConnections = new Map();
  
  pool.on('acquire', (connection) => {
    activeConnections.set(connection.threadId, {
      acquired: Date.now(),
      stack: new Error().stack
    });
  });
  
  pool.on('release', (connection) => {
    activeConnections.delete(connection.threadId);
  });
  
  // Check every 30 seconds for leaked connections
  setInterval(() => {
    const now = Date.now();
    for (const [threadId, info] of activeConnections.entries()) {
      const duration = now - info.acquired;
      
      // Alert on connections held > 30 seconds
      if (duration > 30000) {
        console.error(`[CONNECTION LEAK] Thread ${threadId} held for ${duration}ms`);
        console.error('Stack trace:', info.stack);
      }
    }
  }, 30000);
};
```

---

## Performance Metrics

### 1. Key Database Metrics to Track

| Metric | Target | Alert Threshold | Query |
|--------|--------|-----------------|-------|
| Average Query Time | < 100ms | > 500ms | Performance Schema |
| Slow Query Count | < 10/min | > 50/min | Slow query log |
| Connection Pool Utilization | < 70% | > 85% | Application pool stats |
| Table Scan Ratio | < 5% | > 15% | Handler_read_rnd_next / Handler_read_rnd |
| Index Usage Ratio | > 95% | < 85% | Key_reads / Key_read_requests |
| LONGBLOB Storage Growth | < 100MB/day | > 500MB/day | Table size monitoring |
| Queries per Request | < 5 | > 10 | Application middleware |

### 2. System-Level Metrics

```sql
-- Current connection count
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';

-- Query cache performance (if enabled)
SHOW STATUS LIKE 'Qcache%';

-- Table lock statistics
SHOW STATUS LIKE 'Table_locks%';

-- InnoDB buffer pool efficiency
SHOW STATUS LIKE 'Innodb_buffer_pool_read%';

-- Temporary table usage
SHOW STATUS LIKE 'Created_tmp%';
```

### 3. Table Statistics Monitoring

```sql
-- Table sizes and row counts
SELECT 
    TABLE_NAME,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Total Size (MB)',
    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS 'Data Size (MB)',
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS 'Index Size (MB)',
    TABLE_ROWS AS 'Row Count',
    ROUND(DATA_LENGTH / TABLE_ROWS, 2) AS 'Avg Row Size (Bytes)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'Bimbingan_Online'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;

-- Index usage statistics
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    CARDINALITY,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'Bimbingan_Online'
ORDER BY TABLE_NAME, SEQ_IN_INDEX;

-- Unused indexes (Performance Schema required)
SELECT 
    OBJECT_SCHEMA,
    OBJECT_NAME,
    INDEX_NAME
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE OBJECT_SCHEMA = 'Bimbingan_Online'
  AND INDEX_NAME IS NOT NULL
  AND INDEX_NAME != 'PRIMARY'
  AND COUNT_STAR = 0
ORDER BY OBJECT_NAME;
```

---

## Alerting Strategy

### 1. Critical Alerts (Immediate Action Required)

- Connection pool exhausted (utilization > 95%)
- Database connection failures
- Queries taking > 10 seconds
- Disk space < 10% free
- Replication lag > 30 seconds (if using replication)

### 2. Warning Alerts (Investigation Required)

- Connection pool utilization > 75%
- Slow query rate > 50/minute
- Average query time > 500ms
- Table scan ratio > 15%
- LONGBLOB table growth > 500MB/day

### 3. Info Alerts (Monitoring)

- Unusual query patterns
- New slow queries detected
- Index usage changes
- Connection pool pattern changes

### 4. Alert Implementation Example

```javascript
// utils/alerting.js
const ALERT_THRESHOLDS = {
  POOL_CRITICAL: 95,
  POOL_WARNING: 75,
  SLOW_QUERY_MS: 500,
  QUERIES_PER_REQUEST_WARNING: 10
};

export const checkAndAlert = (metrics) => {
  const alerts = [];
  
  // Pool utilization check
  const poolUtilization = (metrics.activeConnections / metrics.connectionLimit) * 100;
  if (poolUtilization >= ALERT_THRESHOLDS.POOL_CRITICAL) {
    alerts.push({
      level: 'critical',
      message: `Connection pool at ${poolUtilization.toFixed(1)}% capacity`,
      action: 'Immediate investigation required'
    });
  } else if (poolUtilization >= ALERT_THRESHOLDS.POOL_WARNING) {
    alerts.push({
      level: 'warning',
      message: `Connection pool at ${poolUtilization.toFixed(1)}% capacity`,
      action: 'Monitor closely'
    });
  }
  
  // Send alerts (email, Slack, PagerDuty, etc.)
  if (alerts.length > 0) {
    sendAlerts(alerts);
  }
  
  return alerts;
};
```

---

## Maintenance Schedule

### Daily Tasks
- Review slow query log for new patterns
- Check connection pool utilization trends
- Monitor error logs for connection issues
- Verify backup completion

### Weekly Tasks
- Analyze top 20 slowest queries
- Review query execution plan changes
- Check table growth trends
- Update table statistics (`ANALYZE TABLE`)
- Review application query patterns

### Monthly Tasks
- Full slow query log analysis
- Index usage review (remove unused indexes)
- Table fragmentation check
- Connection pool configuration review
- Performance regression testing
- Archive old data if needed

### Quarterly Tasks
- Comprehensive performance audit
- Capacity planning review
- Database schema optimization review
- Benchmark against baseline metrics
- Review and update alerting thresholds

---

## Troubleshooting Guide

### Issue 1: Slow Query Performance

**Symptoms**: Queries taking > 2 seconds, increased latency

**Investigation Steps**:
1. Check slow query log for specific queries
2. Run `EXPLAIN` on slow queries
3. Verify indexes exist and are being used
4. Check table statistics are current
5. Look for table locks or deadlocks

**Resolution**:
```sql
-- Analyze query execution plan
EXPLAIN SELECT ...;

-- Check if indexes are used
SHOW INDEX FROM table_name;

-- Update statistics
ANALYZE TABLE table_name;

-- Add missing indexes (see optimization script)
```

### Issue 2: Connection Pool Exhaustion

**Symptoms**: "Too many connections" errors, requests timing out

**Investigation Steps**:
1. Check current connection count: `SHOW PROCESSLIST;`
2. Review pool statistics in application
3. Look for connection leaks (connections not released)
4. Check for long-running queries blocking connections

**Resolution**:
```javascript
// Review code for missing connection.release()
// Increase pool size if legitimate traffic
// Implement query timeout
// Add connection leak detection
```

### Issue 3: High Memory Usage (LONGBLOB)

**Symptoms**: Out of memory errors, slow file retrieval

**Investigation Steps**:
1. Check table sizes for LONGBLOB columns
2. Review file upload patterns
3. Analyze typical file sizes

**Resolution**:
```sql
-- Check LONGBLOB storage usage
SELECT 
    TABLE_NAME,
    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS 'Data Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'Bimbingan_Online'
  AND TABLE_NAME IN ('proposals', 'reports', 'exam_submissions');

-- Consider moving to external file storage
-- Implement file size limits
-- Add file compression
```

### Issue 4: N+1 Query Problems

**Symptoms**: High query count per request, slow list endpoints

**Investigation Steps**:
1. Enable query counter middleware
2. Review endpoint query patterns
3. Check for loops fetching related data

**Resolution**:
```javascript
// Use JOINs instead of separate queries
// Implement eager loading
// Use optimized views
// Batch fetch related data
```

### Issue 5: Index Not Being Used

**Symptoms**: Full table scans despite index existing

**Investigation Steps**:
1. Check query predicate matches index columns
2. Verify statistics are current
3. Check for type mismatches
4. Review where clause for index-unfriendly patterns

**Resolution**:
```sql
-- Force index usage (testing only)
SELECT ... FROM table USE INDEX (index_name) WHERE ...;

-- Update statistics
ANALYZE TABLE table_name;

-- Check for implicit type conversions
-- Ensure WHERE clause column type matches value type
```

---

## Monitoring Tools Integration

### 1. MySQL Workbench
- Visual query performance analysis
- Real-time server status
- Query execution plan visualization

### 2. Percona Monitoring and Management (PMM)
- Open-source database monitoring
- Query analytics
- Performance dashboards

### 3. MySQL Enterprise Monitor
- Commercial monitoring solution
- Advanced alerting
- Query analyzer

### 4. Third-Party APM Solutions
- **New Relic**: Full-stack monitoring with database insights
- **DataDog**: Database performance monitoring
- **Application Insights**: Azure-based monitoring
- **Prometheus + Grafana**: Self-hosted monitoring

### 5. Simple Shell Script Monitoring

```bash
#!/bin/bash
# monitor_db.sh - Simple database monitoring script

LOG_FILE="/var/log/mysql/monitor.log"

echo "=== Database Monitor - $(date) ===" >> $LOG_FILE

# Check connection count
mysql -u root -p$DB_PASSWORD -e "SHOW STATUS LIKE 'Threads_connected';" >> $LOG_FILE

# Check slow queries
mysql -u root -p$DB_PASSWORD -e "SHOW STATUS LIKE 'Slow_queries';" >> $LOG_FILE

# Check table sizes
mysql -u root -p$DB_PASSWORD -D Bimbingan_Online -e "
SELECT TABLE_NAME, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Size_MB' 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'Bimbingan_Online' 
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;
" >> $LOG_FILE

echo "" >> $LOG_FILE
```

---

## Conclusion

Implementing this monitoring strategy will provide comprehensive visibility into database performance, enabling proactive optimization and rapid issue resolution. Regular review of metrics and adherence to the maintenance schedule will ensure the database continues to perform optimally as the system scales.

### Quick Start Checklist

- [ ] Enable slow query log in MySQL configuration
- [ ] Apply database optimization script (indexes)
- [ ] Deploy optimized connection pool configuration
- [ ] Add query performance middleware
- [ ] Create database health check endpoint
- [ ] Set up periodic pool monitoring
- [ ] Configure alerting thresholds
- [ ] Schedule weekly performance reviews
- [ ] Document baseline performance metrics
- [ ] Test monitoring under load

### Next Steps

1. Apply `database-optimization.sql` to add indexes
2. Replace `config/database.js` with `config/database-optimized.js`
3. Add performance monitoring middleware to Express app
4. Create database health dashboard
5. Set up automated alerts for critical metrics
6. Establish baseline metrics for comparison
7. Schedule first performance review meeting
