/**
 * Test upload profile image
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';

async function uploadProfile() {
    console.log('=== TEST UPLOAD PROFILE ===\n');

    // 1. Login sebagai mahasiswa
    console.log('1. Login mahasiswa...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test5380617504@test.com', password: 'test123' })
    });

    if (!loginRes.ok) {
        // Register dulu jika belum ada
        console.log('   Registering new mahasiswa...');
        await fetch(`${BASE_URL}/api/auth/register/mahasiswa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test5380617504@test.com',
                password: 'test123',
                npm: '5380617504',
                nama: 'Test User',
                angkatan: 2025
            })
        });

        const retryLogin = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test5380617504@test.com', password: 'test123' })
        });
        var loginData = await retryLogin.json();
    } else {
        var loginData = await loginRes.json();
    }

    const token = loginData.token;
    console.log('   Token:', token ? 'OK' : 'FAILED');

    if (!token) {
        console.log('   Login failed!');
        return;
    }

    // 2. Upload file
    console.log('\n2. Uploading image...');

    const imagePath = path.join(__dirname, 'Kousaka Reina ♡.jpg');

    if (!fs.existsSync(imagePath)) {
        console.log('   File tidak ditemukan:', imagePath);
        return;
    }

    const fileBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('file', blob, 'Kousaka Reina ♡.jpg');

    const uploadRes = await fetch(`${BASE_URL}/api/profile/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    const uploadData = await uploadRes.json();

    console.log('   Status:', uploadRes.status);
    console.log('   Response:', JSON.stringify(uploadData, null, 2));

    if (uploadRes.ok) {
        console.log('\n✅ Upload berhasil!');
        console.log('   URL:', uploadData.file_url);
    } else {
        console.log('\n❌ Upload gagal:', uploadData.error || uploadData.message);
    }
}

uploadProfile().catch(e => console.log('Error:', e.message));
