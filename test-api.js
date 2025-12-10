/**
 * API Test Script - COMPLETE ALL ENDPOINTS
 */

const BASE_URL = 'http://localhost:3000';

async function request(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
}

async function runTests() {
    console.log('=== COMPLETE API TEST ===\n');

    let passed = 0, failed = 0;
    const log = (ok, name, msg = '') => {
        console.log(ok ? 'PASS' : 'FAIL', '-', name, msg ? `(${msg})` : '');
        ok ? passed++ : failed++;
    };

    // ======== SYSTEM ========
    console.log('[SYSTEM]');
    let r = await request('GET', '/');
    log(r.ok, 'GET /');

    r = await request('GET', '/ping');
    log(r.ok, 'GET /ping');

    // ======== AUTH ========
    console.log('\n[AUTH]');
    const npm = Date.now().toString().slice(-10);

    r = await request('POST', '/api/auth/register/mahasiswa', {
        email: `test${npm}@test.com`, password: 'test123', npm, nama: 'Test MHS', angkatan: 2024
    });
    log(r.ok, 'POST /auth/register/mahasiswa');

    r = await request('POST', '/api/auth/login', { email: `test${npm}@test.com`, password: 'test123' });
    const mhsToken = r.data.token;
    log(r.ok, 'Login mahasiswa');

    r = await request('POST', '/api/auth/login', { email: 'renzarnando@gmail.com', password: 'renz7474' });
    const adminToken = r.data.token;
    log(r.ok, 'Login admin');

    r = await request('POST', '/api/auth/login', { email: 'kaprodi@polindra.ac.id', password: 'kaprodi123' });
    const kaprodiToken = r.data.token;
    log(r.ok, 'Login kaprodi');

    // ======== MAHASISWA ========
    console.log('\n[MAHASISWA]');

    r = await request('GET', '/api/mahasiswa/profile', null, mhsToken);
    log(r.ok, 'GET /mahasiswa/profile');

    r = await request('GET', '/api/mahasiswa/dosen/list', null, mhsToken);
    log(r.ok, 'GET /mahasiswa/dosen/list');

    r = await request('GET', '/api/mahasiswa/dosen', null, mhsToken);
    log(r.ok, 'GET /mahasiswa/dosen');

    r = await request('PATCH', '/api/mahasiswa/track', { track: 'proyek1' }, mhsToken);
    log(r.ok, 'PATCH /mahasiswa/track');

    r = await request('POST', '/api/mahasiswa/kelompok', { nama: `Kel${npm}` }, mhsToken);
    log(r.ok, 'POST /mahasiswa/kelompok');

    r = await request('GET', '/api/mahasiswa/kelompok', null, mhsToken);
    log(r.ok, 'GET /mahasiswa/kelompok');

    r = await request('GET', '/api/mahasiswa/kelompok/available', null, mhsToken);
    log(r.ok, 'GET /mahasiswa/kelompok/available');

    r = await request('GET', '/api/mahasiswa/bimbingan', null, mhsToken);
    log(r.ok, 'GET /mahasiswa/bimbingan');

    r = await request('GET', '/api/mahasiswa/sidang', null, mhsToken);
    log(r.ok, 'GET /mahasiswa/sidang');

    r = await request('GET', '/api/mahasiswa/laporan', null, mhsToken);
    log(r.ok, 'GET /mahasiswa/laporan');

    r = await request('GET', '/api/mahasiswa/proposal/status', null, mhsToken);
    log(r.ok, 'GET /mahasiswa/proposal/status');

    // ======== DOSEN ========
    console.log('\n[DOSEN]');

    r = await request('GET', '/api/dosen/list');
    log(r.ok, 'GET /dosen/list (public)');

    r = await request('GET', '/api/dosen/profile', null, kaprodiToken);
    log(r.ok, 'GET /dosen/profile');

    r = await request('GET', '/api/dosen/mahasiswa', null, kaprodiToken);
    log(r.ok, 'GET /dosen/mahasiswa');

    r = await request('GET', '/api/dosen/bimbingan', null, kaprodiToken);
    log(r.ok, 'GET /dosen/bimbingan');

    r = await request('GET', '/api/dosen/laporan', null, kaprodiToken);
    log(r.ok, 'GET /dosen/laporan');

    r = await request('GET', '/api/dosen/sidang', null, kaprodiToken);
    log(r.ok, 'GET /dosen/sidang');

    // ======== KAPRODI ========
    console.log('\n[KAPRODI]');

    r = await request('GET', '/api/kaprodi/profile', null, kaprodiToken);
    log(r.ok, 'GET /kaprodi/profile');

    r = await request('GET', '/api/kaprodi/stats', null, kaprodiToken);
    log(r.ok, 'GET /kaprodi/stats');

    r = await request('GET', '/api/kaprodi/mahasiswa', null, kaprodiToken);
    log(r.ok, 'GET /kaprodi/mahasiswa');

    r = await request('GET', '/api/kaprodi/dosen', null, kaprodiToken);
    log(r.ok, 'GET /kaprodi/dosen');

    r = await request('GET', '/api/kaprodi/koordinator', null, kaprodiToken);
    log(r.ok, 'GET /kaprodi/koordinator');

    r = await request('GET', '/api/kaprodi/penguji', null, kaprodiToken);
    log(r.ok, 'GET /kaprodi/penguji');

    // ======== BIMBINGAN ========
    console.log('\n[BIMBINGAN]');

    r = await request('GET', '/api/bimbingan/1', null, mhsToken);
    log(r.status !== 500, 'GET /bimbingan/:id', r.status === 404 ? 'not found ok' : '');

    // ======== SIDANG ========
    console.log('\n[SIDANG]');

    r = await request('GET', '/api/sidang', null, kaprodiToken);
    log(r.ok, 'GET /sidang');

    // ======== SUMMARY ========
    console.log('\n' + '='.repeat(30));
    console.log('TOTAL ENDPOINTS TESTED:', passed + failed);
    console.log('PASSED:', passed, '| FAILED:', failed);
    console.log('='.repeat(30));

    if (failed > 0) {
        console.log('\nNote: Beberapa endpoint mungkin FAIL karena:');
        console.log('- Data koordinator/penguji belum ada di database');
        console.log('- Endpoint memerlukan data yang belum dibuat');
    }
}

runTests().catch(e => console.log('Error:', e.message));
