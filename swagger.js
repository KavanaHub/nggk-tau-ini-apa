import swaggerJsdoc from 'swagger-jsdoc';

const serverUrl = process.env.SWAGGER_SERVER_URL || 'http://localhost:8080';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bimbingan Online API',
    version: '1.0.0',
    description: 'Dokumentasi API menggunakan Swagger UI untuk layanan bimbingan online.',
  },
  servers: [
    {
      url: 'https://asia-southeast2-renzip-478811.cloudfunctions.net/kavana',
      description: 'Produksi',
    },
    {
      url: serverUrl,
      description: 'Pengembangan lokal',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          role: { type: 'string', example: 'mahasiswa' },
          user_id: { type: 'integer', example: 1 },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
      MahasiswaRegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'npm', 'nama'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          npm: { type: 'string' },
          nama: { type: 'string' },
          no_wa: { type: 'string' },
          angkatan: { type: 'integer', example: 2024 },
        },
      },
      DosenRegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'nama'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          nidn: { type: 'string' },
          nama: { type: 'string' },
          no_wa: { type: 'string' },
        },
      },
      BimbinganUploadRequest: {
        type: 'object',
        properties: {
          mahasiswa_id: { type: 'integer' },
          bimbingan_id: { type: 'integer' },
          file_url: { type: 'string', description: 'Gunakan jika ingin menyimpan link Google Drive tanpa upload' },
          file: { type: 'string', format: 'binary' },
        },
      },
      ProposalUploadRequest: {
        type: 'object',
        properties: {
          file_url: { type: 'string' },
          file: { type: 'string', format: 'binary' },
        },
      },
      ReportUploadRequest: {
        type: 'object',
        properties: {
          file_url: { type: 'string' },
          file: { type: 'string', format: 'binary' },
        },
      },
      ProfileUploadRequest: {
        type: 'object',
        properties: {
          file: { type: 'string', format: 'binary' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Registrasi dan login multi role' },
    { name: 'Mahasiswa', description: 'Aksi mahasiswa' },
    { name: 'Dosen', description: 'Aksi dosen pembimbing' },
    { name: 'Koordinator', description: 'Aksi koordinator' },
    { name: 'Kaprodi', description: 'Aksi kaprodi' },
    { name: 'Penguji', description: 'Aksi penguji' },
    { name: 'Bimbingan', description: 'Bimbingan dan lampiran' },
    { name: 'Proposal', description: 'Pengajuan proposal' },
    { name: 'Report', description: 'Laporan sidang' },
    { name: 'Sidang', description: 'Jadwal dan nilai sidang' },
    { name: 'Profile', description: 'Upload foto profil' },
    { name: 'System', description: 'Endpoint pemeriksaan kesehatan' },
  ],
  paths: {
    '/': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Bimbingan Online API OK' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ping': {
      get: {
        tags: ['System'],
        summary: 'Ping endpoint',
        security: [],
        responses: {
          200: {
            description: 'Ping response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    message: { type: 'string', example: 'pong' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register/mahasiswa': {
      post: {
        tags: ['Auth'],
        summary: 'Register mahasiswa',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MahasiswaRegisterRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Mahasiswa registered successfully' },
          400: { description: 'Email/NPM duplicate', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/register/koordinator': {
      post: {
        tags: ['Auth'],
        summary: 'Register koordinator',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DosenRegisterRequest' } } },
        },
        responses: {
          201: { description: 'Koordinator registered successfully' },
        },
      },
    },
    '/api/auth/register/penguji': {
      post: {
        tags: ['Auth'],
        summary: 'Register penguji',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DosenRegisterRequest' } } },
        },
        responses: {
          201: { description: 'Penguji registered successfully' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login multi-role',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: {
            description: 'JWT returned',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/mahasiswa/profile': {
      get: { tags: ['Mahasiswa'], summary: 'Ambil profil mahasiswa' , responses: { 200: { description: 'Profil mahasiswa' } } },
      put: { tags: ['Mahasiswa'], summary: 'Update profil mahasiswa', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Profil diperbarui' } } },
    },
    '/api/mahasiswa/proposal': {
      post: { tags: ['Mahasiswa'], summary: 'Submit data proposal (non file)', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Proposal submitted' } } },
    },
    '/api/mahasiswa/proposal/status': {
      get: { tags: ['Mahasiswa'], summary: 'Status proposal mahasiswa', responses: { 200: { description: 'Status proposal' } } },
    },
    '/api/mahasiswa/dosen-pembimbing': {
      get: { tags: ['Mahasiswa'], summary: 'Dosen pembimbing yang ditugaskan', responses: { 200: { description: 'Data dosen pembimbing' } } },
    },
    '/api/mahasiswa/dosen-pembimbing/list': {
      get: { tags: ['Mahasiswa'], summary: 'Daftar semua dosen pembimbing', responses: { 200: { description: 'List dosen' } } },
    },
    '/api/mahasiswa/bimbingan': {
      post: { tags: ['Mahasiswa'], summary: 'Ajukan sesi bimbingan', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Bimbingan dibuat' } } },
      get: { tags: ['Mahasiswa'], summary: 'Lihat riwayat bimbingan pribadi', responses: { 200: { description: 'Daftar bimbingan' } } },
    },
    '/api/mahasiswa/laporan': {
      post: { tags: ['Mahasiswa'], summary: 'Submit laporan sidang', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Laporan dibuat' } } },
      get: { tags: ['Mahasiswa'], summary: 'Lihat laporan yang dikirim', responses: { 200: { description: 'Daftar laporan' } } },
    },
    '/api/mahasiswa/sidang': {
      get: { tags: ['Mahasiswa'], summary: 'Jadwal sidang saya', responses: { 200: { description: 'Jadwal sidang' } } },
    },
    '/api/bimbingan/{id}': {
      get: {
        tags: ['Bimbingan'],
        summary: 'Detail bimbingan tertentu',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detail bimbingan' }, 404: { description: 'Tidak ditemukan' } },
      },
    },
    '/api/bimbingan/upload': {
      post: {
        tags: ['Bimbingan'],
        summary: 'Upload atau simpan link lampiran bimbingan',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': { schema: { $ref: '#/components/schemas/BimbinganUploadRequest' } },
            'application/json': { schema: { $ref: '#/components/schemas/BimbinganUploadRequest' } },
          },
        },
        responses: { 200: { description: 'Lampiran tersimpan' } },
      },
    },
    '/api/proposal/upload': {
      post: {
        tags: ['Proposal'],
        summary: 'Upload proposal (PDF) atau simpan link',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': { schema: { $ref: '#/components/schemas/ProposalUploadRequest' } },
            'application/json': { schema: { $ref: '#/components/schemas/ProposalUploadRequest' } },
          },
        },
        responses: { 200: { description: 'Proposal tersimpan' }, 400: { description: 'Validasi gagal' } },
      },
    },
    '/api/report/upload': {
      post: {
        tags: ['Report'],
        summary: 'Upload laporan sidang (PDF) atau simpan link',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': { schema: { $ref: '#/components/schemas/ReportUploadRequest' } },
            'application/json': { schema: { $ref: '#/components/schemas/ReportUploadRequest' } },
          },
        },
        responses: { 200: { description: 'Report tersimpan' }, 400: { description: 'Validasi gagal' } },
      },
    },
    '/api/profile/upload': {
      post: {
        tags: ['Profile'],
        summary: 'Upload foto profil (JPG/PNG)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': { schema: { $ref: '#/components/schemas/ProfileUploadRequest' } },
          },
        },
        responses: { 200: { description: 'Foto profil tersimpan' }, 400: { description: 'Validasi gagal' } },
      },
    },
    '/api/dosen/profile': {
      get: { tags: ['Dosen'], summary: 'Profil dosen pembimbing', responses: { 200: { description: 'Profil dosen' } } },
    },
    '/api/dosen/list': {
      get: { tags: ['Dosen'], summary: 'Daftar dosen pembimbing (public)', security: [], responses: { 200: { description: 'List dosen' } } },
    },
    '/api/dosen/mahasiswa': {
      get: { tags: ['Dosen'], summary: 'Mahasiswa bimbingan saya', responses: { 200: { description: 'List mahasiswa' } } },
    },
    '/api/dosen/bimbingan': {
      get: { tags: ['Dosen'], summary: 'Bimbingan untuk disetujui', responses: { 200: { description: 'Daftar bimbingan' } } },
    },
    '/api/dosen/bimbingan/{id}/status': {
      patch: {
        tags: ['Dosen'],
        summary: 'Update status bimbingan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Status diperbarui' } },
      },
    },
    '/api/dosen/laporan': {
      get: { tags: ['Dosen'], summary: 'Laporan sidang mahasiswa', responses: { 200: { description: 'Daftar laporan' } } },
    },
    '/api/dosen/laporan/{id}/status': {
      patch: {
        tags: ['Dosen'],
        summary: 'Update status laporan sidang',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Status diperbarui' } },
      },
    },
    '/api/dosen/sidang': {
      get: { tags: ['Dosen'], summary: 'Sidang yang melibatkan dosen pembimbing', responses: { 200: { description: 'Daftar sidang' } } },
    },
    '/api/dosen/sidang/nilai': {
      post: { tags: ['Dosen'], summary: 'Input nilai sidang sebagai pembimbing', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Nilai tersimpan' } } },
    },
    '/api/koordinator/profile': {
      get: { tags: ['Koordinator'], summary: 'Profil koordinator', responses: { 200: { description: 'Profil' } } },
    },
    '/api/koordinator/stats': {
      get: { tags: ['Koordinator'], summary: 'Statistik dashboard koordinator', responses: { 200: { description: 'Data statistik' } } },
    },
    '/api/koordinator/mahasiswa': { get: { tags: ['Koordinator'], summary: 'List mahasiswa', responses: { 200: { description: 'Daftar mahasiswa' } } } },
    '/api/koordinator/dosen-pembimbing': { get: { tags: ['Koordinator'], summary: 'List dosen pembimbing', responses: { 200: { description: 'Daftar dosen' } } } },
    '/api/koordinator/proposals/pending': { get: { tags: ['Koordinator'], summary: 'Proposal menunggu validasi', responses: { 200: { description: 'Daftar proposal' } } } },
    '/api/koordinator/proposal/validate': { patch: { tags: ['Koordinator'], summary: 'Validasi proposal', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Proposal divalidasi' } } } },
    '/api/koordinator/assign-dosen': { post: { tags: ['Koordinator'], summary: 'Assign dosen pembimbing', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Dosen ditugaskan' } } } },
    '/api/koordinator/sidang/schedule': { post: { tags: ['Koordinator'], summary: 'Jadwalkan sidang', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Sidang dijadwalkan' } } } },
    '/api/koordinator/sidang': { get: { tags: ['Koordinator'], summary: 'List sidang', responses: { 200: { description: 'Daftar sidang' } } } },
    '/api/kaprodi/profile': { get: { tags: ['Kaprodi'], summary: 'Profil kaprodi', responses: { 200: { description: 'Profil' } } } },
    '/api/kaprodi/stats': { get: { tags: ['Kaprodi'], summary: 'Statistik kaprodi', responses: { 200: { description: 'Statistik' } } } },
    '/api/kaprodi/mahasiswa': { get: { tags: ['Kaprodi'], summary: 'List mahasiswa', responses: { 200: { description: 'Daftar mahasiswa' } } } },
    '/api/kaprodi/dosen-pembimbing': { get: { tags: ['Kaprodi'], summary: 'List dosen pembimbing', responses: { 200: { description: 'Daftar dosen' } } } },
    '/api/kaprodi/koordinator': { get: { tags: ['Kaprodi'], summary: 'List koordinator', responses: { 200: { description: 'Daftar koordinator' } } } },
    '/api/kaprodi/penguji': { get: { tags: ['Kaprodi'], summary: 'List penguji', responses: { 200: { description: 'Daftar penguji' } } } },
    '/api/kaprodi/assign-dosen': { post: { tags: ['Kaprodi'], summary: 'Assign dosen pembimbing', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Dosen ditugaskan' } } } },
    '/api/kaprodi/proposal/status': { patch: { tags: ['Kaprodi'], summary: 'Update status proposal', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Status diperbarui' } } } },
    '/api/penguji/profile': { get: { tags: ['Penguji'], summary: 'Profil penguji', responses: { 200: { description: 'Profil' }, 404: { description: 'Tidak ditemukan' } } } },
    '/api/penguji/sidang': { get: { tags: ['Penguji'], summary: 'Sidang yang diampu sebagai penguji', responses: { 200: { description: 'Daftar sidang' } } } },
    '/api/penguji/nilai': { post: { tags: ['Penguji'], summary: 'Input nilai sebagai penguji utama', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Nilai tersimpan' } } } },
    '/api/sidang': { get: { tags: ['Sidang'], summary: 'List sidang (auth)', responses: { 200: { description: 'Daftar sidang' } } } },
    '/api/sidang/{sidang_id}/nilai': {
      get: {
        tags: ['Sidang'],
        summary: 'Nilai sidang tertentu',
        parameters: [{ name: 'sidang_id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detail nilai' }, 404: { description: 'Tidak ditemukan' } },
      },
    },
    '/api/sidang/nilai': { post: { tags: ['Sidang'], summary: 'Input nilai (penguji)', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Nilai tersimpan' } } } },
    '/api/sidang/upload': {
      post: {
        tags: ['Sidang'],
        summary: 'Upload berkas sidang (PDF)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  mahasiswa_id: { type: 'integer' },
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Berkas tersimpan' }, 400: { description: 'Validasi gagal' } },
      },
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
