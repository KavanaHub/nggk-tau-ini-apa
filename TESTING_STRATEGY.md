# Testing Strategy Document
## University Thesis Guidance System (Bimbingan Online)

---

## 1. Executive Summary

This document outlines a comprehensive testing strategy for the University Thesis Guidance System backend API. The system is a multi-role Express.js REST API that manages thesis proposals, advisor assignments, guidance sessions, reports, and exam submissions with complex approval workflows.

### Key Testing Objectives
- **Ensure 80%+ code coverage** for critical business logic
- **Validate security** against common vulnerabilities (SQL injection, unauthorized access)
- **Verify multi-role authorization** for all protected endpoints
- **Test complex workflow states** (proposals, guidance, exams)
- **Validate file upload handling** and data integrity
- **Ensure database transaction integrity** across operations

---

## 2. Test Pyramid Strategy

We follow the standard test pyramid with appropriate distribution:

```
                    /\
                   /  \
                  / E2E \         10% - End-to-End Tests
                 /______\
                /        \
               /  INTEG.  \       30% - Integration Tests
              /____________\
             /              \
            /   UNIT TESTS   \   60% - Unit Tests
           /__________________\
```

### Test Distribution
- **60% Unit Tests** - Fast, isolated tests for controllers, middleware, utilities
- **30% Integration Tests** - API endpoint tests with database interactions
- **10% E2E Tests** - Complete user workflow scenarios

---

## 3. Testing Framework & Tools

### Recommended Stack

#### Core Testing Framework: **Jest**
**Rationale:**
- Excellent ES modules support (required for this project)
- Built-in mocking capabilities
- Parallel test execution for fast feedback
- Comprehensive assertion library
- Coverage reporting built-in
- Widely adopted with strong community support

#### Supporting Libraries
- **supertest** - HTTP assertion library for API endpoint testing
- **jest-mock-extended** - Enhanced mocking capabilities
- **@shelf/jest-mongodb** - In-memory MongoDB for test isolation (alternative: mysql2 test pools)
- **faker-js/faker** - Realistic test data generation
- **dotenv** - Test environment configuration

### Alternative: Vitest
**Consideration:** Vitest offers faster execution and better ES modules support but has a smaller ecosystem. Recommended for future migration if needed.

---

## 4. Test Environment Setup

### Test Database Strategy

#### Option 1: Separate Test Database (Recommended)
- Dedicated MySQL test database
- Reset before each test suite
- Seeded with fixtures for consistent state
- Isolated from development/production data

#### Option 2: In-Memory Database
- SQLite in-memory for faster tests
- May require schema adjustments
- Excellent for CI/CD pipelines

### Environment Configuration
```env
# .env.test
DB_HOST=localhost
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=bimbingan_online_test
DB_PORT=3306

JWT_SECRET=test_jwt_secret_key_for_testing_only
JWT_EXPIRE=1h

NODE_ENV=test
```

### Database Lifecycle
1. **beforeAll** - Create test database, run migrations
2. **beforeEach** - Seed with fixtures, start transaction
3. **afterEach** - Rollback transaction, clear data
4. **afterAll** - Drop test database, close connections

---

## 5. Coverage Targets

### Overall Target: **80%+**

#### Per-Module Targets
| Module | Target | Priority | Rationale |
|--------|--------|----------|-----------|
| Authentication | 95% | CRITICAL | Security-sensitive, user entry point |
| Authorization Middleware | 95% | CRITICAL | Guards all protected routes |
| Proposal Controller | 85% | HIGH | Core business logic, file handling |
| Advisor Controller | 85% | HIGH | Complex approval workflows |
| Guidance Controller | 80% | HIGH | Session management logic |
| Report Controller | 80% | MEDIUM | Similar to proposals |
| Exam Controller | 85% | HIGH | Multi-stage approval process |
| Database Config | 70% | LOW | Infrastructure code |

### Coverage Metrics to Track
- **Line Coverage** - Percentage of executed code lines
- **Branch Coverage** - Conditional logic paths tested
- **Function Coverage** - Functions called during tests
- **Statement Coverage** - Individual statements executed

---

## 6. Test Categories & Scope

### 6.1 Unit Tests (60% of test suite)

#### Authentication Controller
**File:** `__tests__/unit/controllers/auth.controller.test.js`

Test Cases:
- ✅ Register new user successfully
- ✅ Register fails with duplicate email
- ✅ Register fails with missing fields
- ✅ Register hashes password correctly
- ✅ Login successful with valid credentials
- ✅ Login fails with invalid email
- ✅ Login fails with invalid password
- ✅ Login returns valid JWT token
- ✅ JWT token contains correct user data

#### Authorization Middleware
**File:** `__tests__/unit/middleware/auth.middleware.test.js`

Test Cases:
- ✅ verifyToken allows valid token
- ✅ verifyToken rejects missing token
- ✅ verifyToken rejects malformed token
- ✅ verifyToken rejects expired token
- ✅ verifyToken rejects invalid signature
- ✅ verifyRole allows authorized role
- ✅ verifyRole rejects unauthorized role
- ✅ verifyRole works with multiple allowed roles

#### Proposal Controller
**File:** `__tests__/unit/controllers/proposal.controller.test.js`

Test Cases:
- ✅ Upload proposal successfully
- ✅ Upload fails without file
- ✅ Upload fails with oversized file
- ✅ Get proposals returns all for dosen
- ✅ Get student proposals filters correctly
- ✅ Download proposal returns correct file
- ✅ Download fails for non-existent proposal

### 6.2 Integration Tests (30% of test suite)

#### Authentication Flow
**File:** `__tests__/integration/auth.flow.test.js`

Test Cases:
- ✅ Complete registration → login → authenticated request
- ✅ Register → login → access protected endpoint
- ✅ Multiple users with different roles
- ✅ Token expiration handling

#### Proposal Workflow
**File:** `__tests__/integration/proposal.workflow.test.js`

Test Cases:
- ✅ Student uploads proposal → coordinator reviews → advisor approves
- ✅ Proposal rejection workflow
- ✅ Multiple proposals per student
- ✅ File upload and download integrity
- ✅ Proposal status transitions

#### Advisor Assignment
**File:** `__tests__/integration/advisor.workflow.test.js`

Test Cases:
- ✅ Coordinator assigns advisor to proposal
- ✅ Advisor accepts/rejects assignment
- ✅ Multiple advisors per proposal validation
- ✅ Advisor-student relationship establishment

#### Guidance Session Management
**File:** `__tests__/integration/guidance.workflow.test.js`

Test Cases:
- ✅ Create guidance session with approved proposal
- ✅ Advisor provides feedback
- ✅ Session completion workflow
- ✅ Multiple sessions per proposal

### 6.3 Security Tests (Critical)

#### SQL Injection
**File:** `__tests__/security/sql-injection.test.js`

Test Cases:
- ✅ Login with SQL injection attempts
- ✅ Search/filter with malicious input
- ✅ File names with SQL commands
- ✅ Parameterized queries validation

#### Authorization Bypass
**File:** `__tests__/security/authorization.test.js`

Test Cases:
- ✅ Access protected routes without token
- ✅ Access routes with invalid token
- ✅ Role escalation attempts (mahasiswa → dosen)
- ✅ Access other users' data
- ✅ Modify other users' resources

#### File Upload Security
**File:** `__tests__/security/file-upload.test.js`

Test Cases:
- ✅ Malicious file type upload attempts
- ✅ Oversized file rejection
- ✅ Script injection in filenames
- ✅ Path traversal in file operations

#### CORS & Headers
**File:** `__tests__/security/cors.test.js`

Test Cases:
- ✅ CORS policy enforcement
- ✅ Security headers present
- ✅ Sensitive data not exposed in errors

---

## 7. Mock Strategy

### Database Mocking
- **Approach:** Use actual test database with transactions
- **Rationale:** Ensures realistic behavior, catches DB-specific issues
- **Alternative:** Mock mysql2 pool for pure unit tests

### External Dependencies
- **JWT:** Use test secret, short expiration
- **Bcrypt:** Mock for faster tests, real for integration
- **File System:** Mock multer buffer operations
- **Time:** Mock Date.now() for deterministic tests

### Mock Utilities Location
```
__tests__/
  mocks/
    database.mock.js      - Database pool mocking
    auth.mock.js          - JWT and bcrypt mocks
    multer.mock.js        - File upload mocks
  fixtures/
    users.fixture.js      - Test user data
    proposals.fixture.js  - Test proposal data
    tokens.fixture.js     - Pre-generated test tokens
  helpers/
    db.helper.js          - Database setup/teardown
    auth.helper.js        - Token generation helpers
    request.helper.js     - Supertest wrapper functions
```

---

## 8. CI/CD Integration Plan

### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: bimbingan_online_test
    steps:
      - Checkout code
      - Setup Node.js 18+
      - Install dependencies
      - Run linter
      - Run tests with coverage
      - Upload coverage to Codecov
      - Fail if coverage < 80%
```

### Pre-commit Hooks
- Run unit tests (< 30s)
- Run linter
- Check coverage on changed files

### Pull Request Gates
- All tests pass
- Coverage threshold met
- No critical security vulnerabilities
- Code review approval

---

## 9. Test Data Management

### Fixtures Strategy
- **Immutable seed data** for reference tables
- **Dynamic factories** for test-specific data
- **Relationship builders** for complex object graphs

### Example Fixture Structure
```javascript
// users.fixture.js
export const testUsers = {
  mahasiswa: {
    name: 'Test Student',
    email: 'student@test.com',
    password: 'password123',
    role: 'mahasiswa'
  },
  dosen: {
    name: 'Test Advisor',
    email: 'advisor@test.com',
    password: 'password123',
    role: 'dosen',
    sub_role: 'pembimbing'
  },
  koordinator: {
    name: 'Test Coordinator',
    email: 'coordinator@test.com',
    password: 'password123',
    role: 'koordinator'
  }
};
```

---

## 10. Testing Workflow

### TDD Cycle (Red-Green-Refactor)
1. **RED** - Write failing test for new feature
2. **GREEN** - Implement minimal code to pass
3. **REFACTOR** - Clean up while maintaining green tests

### Development Flow
```
Feature Request
    ↓
Write Integration Test (RED)
    ↓
Write Unit Tests (RED)
    ↓
Implement Feature (GREEN)
    ↓
Refactor & Optimize
    ↓
Code Review
    ↓
Merge to Main
```

### Test Execution Order
1. **Fast Unit Tests** - Run first, fail fast
2. **Integration Tests** - After units pass
3. **Security Tests** - Before deployment
4. **E2E Tests** - Final validation

---

## 11. High-Risk Untested Areas (Initial Analysis)

### Critical Gaps to Address
1. **File Upload Validation** - Malicious file detection missing
2. **Transaction Rollback** - Database error handling not tested
3. **Concurrent Access** - Race condition in proposal approval
4. **Token Refresh** - No refresh token mechanism
5. **Rate Limiting** - API abuse prevention not tested
6. **Input Sanitization** - XSS attack vectors in descriptions
7. **Cascade Deletes** - Foreign key constraint handling
8. **File Size Limits** - Large file DoS prevention

### Recommended Priority Tests
1. **P0 (Immediate):**
   - Authentication security tests
   - Authorization bypass tests
   - SQL injection tests

2. **P1 (Next Sprint):**
   - File upload security
   - Transaction integrity
   - Concurrent user scenarios

3. **P2 (Future):**
   - Performance/load tests
   - Stress tests
   - Chaos engineering

---

## 12. Metrics & Monitoring

### Test Health Metrics
- **Execution Time** - Keep < 5 minutes for full suite
- **Flakiness Rate** - Target < 1% flaky tests
- **Code Coverage Trend** - Track over time
- **Test-to-Code Ratio** - Aim for 1:1 or better

### Quality Gates
- ✅ All tests pass
- ✅ Coverage ≥ 80%
- ✅ No high-severity security issues
- ✅ No disabled/skipped tests in main
- ✅ Test execution time < 5 min

---

## 13. Maintenance Strategy

### Test Maintenance
- **Monthly review** of test coverage gaps
- **Quarterly refactoring** of test utilities
- **Update fixtures** when business logic changes
- **Remove obsolete tests** for deprecated features

### Documentation
- Keep this strategy document updated
- Document complex test scenarios
- Maintain test data dictionary
- Record known flakiness patterns

---

## 14. Success Criteria

### Phase 1: Foundation (Week 1-2)
- ✅ Jest setup complete
- ✅ Test database configured
- ✅ 20+ core unit tests written
- ✅ 50% code coverage achieved

### Phase 2: Expansion (Week 3-4)
- ✅ Integration tests for all modules
- ✅ Security test suite complete
- ✅ 75% code coverage achieved
- ✅ CI/CD pipeline integrated

### Phase 3: Maturity (Week 5+)
- ✅ 80%+ sustained coverage
- ✅ All critical paths tested
- ✅ Zero P0 security issues
- ✅ TDD workflow adopted by team

---

## 15. Resources & Training

### Team Training Needs
- Jest testing fundamentals
- Supertest API testing
- TDD methodology
- Security testing practices

### Reference Materials
- Jest documentation: https://jestjs.io/
- Supertest: https://github.com/visionmedia/supertest
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- Node.js Testing Best Practices: https://github.com/goldbergyoni/nodebestpractices

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-17  
**Next Review:** 2025-12-17
