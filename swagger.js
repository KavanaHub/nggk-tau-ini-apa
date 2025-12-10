import swaggerJsdoc from 'swagger-jsdoc';

const serverUrl = process.env.SWAGGER_SERVER_URL || 'http://localhost:3000';

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
    {
      url: 'https://kavana-backend-j8ktr.ondigitalocean.app',
      description: 'Development API Testing',
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
    { name: 'Auth', description: 'Registrasi mahasiswa dan login multi role' },
    { name: 'Mahasiswa', description: 'Aksi mahasiswa' },
    { name: 'Dosen', description: 'Aksi dosen (pembimbing/kaprodi)' },
    { name: 'Koordinator', description: 'Aksi koordinator' },
    { name: 'Kaprodi', description: 'Aksi kaprodi' },
    { name: 'Penguji', description: 'Aksi penguji' },
    { name: 'Bimbingan', description: 'Bimbingan dan lampiran' },
    { name: 'Proposal', description: 'Pengajuan proposal' },
    { name: 'Report', description: 'Laporan sidang' },
    { name: 'Sidang', description: 'Jadwal sidang' },
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
        summary: 'Register mahasiswa (hanya mahasiswa yang bisa register)',
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
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login multi-role (mahasiswa, dosen, kaprodi, koordinator, penguji, admin)',
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
      get: { tags: ['Mahasiswa'], summary: 'Ambil profil mahasiswa', responses: { 200: { description: 'Profil mahasiswa' } } },
      put: { tags: ['Mahasiswa'], summary: 'Update profil mahasiswa', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Profil diperbarui' } } },
    },
    '/api/mahasiswa/proposal': {
      post: { tags: ['Mahasiswa'], summary: 'Submit data proposal (non file)', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Proposal submitted' } } },
    },
    '/api/mahasiswa/proposal/status': {
      get: { tags: ['Mahasiswa'], summary: 'Status proposal mahasiswa', responses: { 200: { description: 'Status proposal' } } },
    },
    '/api/mahasiswa/dosen': {
      get: { tags: ['Mahasiswa'], summary: 'Dosen pembimbing yang ditugaskan', responses: { 200: { description: 'Data dosen pembimbing' } } },
    },
    '/api/mahasiswa/dosen/list': {
      get: { tags: ['Mahasiswa'], summary: 'Daftar semua dosen aktif', responses: { 200: { description: 'List dosen' } } },
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
    '/api/mahasiswa/track': {
      patch: {
        tags: ['Mahasiswa'],
        summary: 'Set track mahasiswa (proyek1/2/3 atau internship1/2)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['track'],
                properties: {
                  track: { type: 'string', enum: ['proyek1', 'proyek2', 'proyek3', 'internship1', 'internship2'], example: 'proyek1' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Track berhasil diset' }, 400: { description: 'Track tidak valid' } }
      },
    },
    '/api/mahasiswa/kelompok': {
      post: {
        tags: ['Mahasiswa'],
        summary: 'Buat kelompok baru (untuk proyek)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama'],
                properties: {
                  nama: { type: 'string', example: 'Kelompok A' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Kelompok berhasil dibuat' }, 400: { description: 'Validasi gagal' } }
      },
      get: { tags: ['Mahasiswa'], summary: 'Lihat kelompok saya dan anggotanya', responses: { 200: { description: 'Data kelompok' } } },
    },
    '/api/mahasiswa/kelompok/join': {
      post: {
        tags: ['Mahasiswa'],
        summary: 'Bergabung ke kelompok existing',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['kelompok_id'],
                properties: {
                  kelompok_id: { type: 'integer', example: 1 }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Berhasil bergabung' }, 400: { description: 'Kelompok penuh atau track tidak sesuai' } }
      },
    },
    '/api/mahasiswa/kelompok/available': {
      get: { tags: ['Mahasiswa'], summary: 'Daftar kelompok yang tersedia untuk join (track sama, belum penuh)', responses: { 200: { description: 'List kelompok tersedia' } } },
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
      get: { tags: ['Dosen'], summary: 'Profil dosen (bisa dosen biasa atau kaprodi)', responses: { 200: { description: 'Profil dosen' } } },
    },
    '/api/dosen/list': {
      get: { tags: ['Dosen'], summary: 'Daftar dosen aktif (public)', security: [], responses: { 200: { description: 'List dosen' } } },
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
        summary: 'Update status bimbingan (approved/rejected)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Status diperbarui' } },
      },
    },
    '/api/dosen/laporan': {
      get: { tags: ['Dosen'], summary: 'Laporan sidang mahasiswa bimbingan', responses: { 200: { description: 'Daftar laporan' } } },
    },
    '/api/dosen/laporan/{id}/status': {
      patch: {
        tags: ['Dosen'],
        summary: 'Update status laporan sidang (approved/rejected)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Status diperbarui' } },
      },
    },
    '/api/dosen/sidang': {
      get: { tags: ['Dosen'], summary: 'Sidang yang melibatkan dosen sebagai Penguji 1', responses: { 200: { description: 'Daftar sidang' } } },
    },
    '/api/koordinator/profile': {
      get: { tags: ['Koordinator'], summary: 'Profil koordinator', responses: { 200: { description: 'Profil' } } },
    },
    '/api/koordinator/stats': {
      get: { tags: ['Koordinator'], summary: 'Statistik dashboard koordinator', responses: { 200: { description: 'Data statistik' } } },
    },
    '/api/koordinator/mahasiswa': { get: { tags: ['Koordinator'], summary: 'List mahasiswa', responses: { 200: { description: 'Daftar mahasiswa' } } } },
    '/api/koordinator/dosen': { get: { tags: ['Koordinator'], summary: 'List dosen', responses: { 200: { description: 'Daftar dosen' } } } },
    '/api/koordinator/proposals/pending': { get: { tags: ['Koordinator'], summary: 'Proposal menunggu validasi', responses: { 200: { description: 'Daftar proposal' } } } },
    '/api/koordinator/proposal/validate': { patch: { tags: ['Koordinator'], summary: 'Validasi proposal (approved/rejected)', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Proposal divalidasi' } } } },
    '/api/koordinator/assign-dosen': {
      post: {
        tags: ['Koordinator'],
        summary: 'Assign dosen pembimbing ke mahasiswa (internship wajib 2 pembimbing)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mahasiswa_id', 'dosen_id'],
                properties: {
                  mahasiswa_id: { type: 'integer', example: 1 },
                  dosen_id: { type: 'integer', description: 'Pembimbing utama', example: 1 },
                  dosen_id_2: { type: 'integer', description: 'Pembimbing kedua (wajib untuk internship)', example: 2 }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Dosen ditugaskan' }, 400: { description: 'Internship memerlukan 2 pembimbing' } }
      }
    },
    '/api/koordinator/sidang/schedule': { post: { tags: ['Koordinator'], summary: 'Jadwalkan sidang', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Sidang dijadwalkan' } } } },
    '/api/koordinator/sidang': { get: { tags: ['Koordinator'], summary: 'List sidang', responses: { 200: { description: 'Daftar sidang' } } } },
    '/api/koordinator/jadwal': {
      get: { tags: ['Koordinator'], summary: 'List jadwal proyek/internship', responses: { 200: { description: 'Daftar jadwal' } } },
      post: {
        tags: ['Koordinator'],
        summary: 'Buat jadwal proyek/internship',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama', 'tipe', 'start_date', 'end_date'],
                properties: {
                  nama: { type: 'string', example: 'Proyek 1' },
                  tipe: { type: 'string', enum: ['proyek', 'internship', 'lainnya'], example: 'proyek' },
                  start_date: { type: 'string', format: 'date' },
                  end_date: { type: 'string', format: 'date' },
                  deskripsi: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Jadwal disimpan' }, 400: { description: 'Validasi gagal' } },
      },
    },
    '/api/koordinator/jadwal/{id}': {
      put: {
        tags: ['Koordinator'],
        summary: 'Perbarui jadwal proyek/internship',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama', 'tipe', 'start_date', 'end_date'],
                properties: {
                  nama: { type: 'string', example: 'Proyek 1' },
                  tipe: { type: 'string', enum: ['proyek', 'internship', 'lainnya'], example: 'proyek' },
                  start_date: { type: 'string', format: 'date' },
                  end_date: { type: 'string', format: 'date' },
                  deskripsi: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Jadwal diperbarui' }, 400: { description: 'Validasi gagal' }, 404: { description: 'Tidak ditemukan' } },
      },
    },
    '/api/koordinator/jadwal/{id}/complete': {
      post: {
        tags: ['Koordinator'],
        summary: 'Selesaikan jadwal dan bersihkan data terkait',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Jadwal diselesaikan dan data dibersihkan' },
          400: { description: 'Jadwal sudah completed' },
          404: { description: 'Tidak ditemukan' },
        },
      },
    },
    '/api/kaprodi/profile': { get: { tags: ['Kaprodi'], summary: 'Profil kaprodi (dosen dengan jabatan kaprodi)', responses: { 200: { description: 'Profil' } } } },
    '/api/kaprodi/stats': { get: { tags: ['Kaprodi'], summary: 'Statistik dashboard kaprodi', responses: { 200: { description: 'Statistik' } } } },
    '/api/kaprodi/mahasiswa': { get: { tags: ['Kaprodi'], summary: 'List mahasiswa', responses: { 200: { description: 'Daftar mahasiswa' } } } },
    '/api/kaprodi/dosen': { get: { tags: ['Kaprodi'], summary: 'List dosen', responses: { 200: { description: 'Daftar dosen' } } } },
    '/api/kaprodi/koordinator': { get: { tags: ['Kaprodi'], summary: 'List koordinator', responses: { 200: { description: 'Daftar koordinator' } } } },
    '/api/kaprodi/penguji': { get: { tags: ['Kaprodi'], summary: 'List penguji', responses: { 200: { description: 'Daftar penguji' } } } },
    '/api/kaprodi/assign-dosen': { post: { tags: ['Kaprodi'], summary: 'Assign dosen pembimbing ke mahasiswa', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Dosen ditugaskan' } } } },
    '/api/kaprodi/proposal/status': { patch: { tags: ['Kaprodi'], summary: 'Update status proposal (approved/rejected)', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Status diperbarui' } } } },
    '/api/penguji/profile': { get: { tags: ['Penguji'], summary: 'Profil penguji', responses: { 200: { description: 'Profil' }, 404: { description: 'Tidak ditemukan' } } } },
    '/api/penguji/sidang': { get: { tags: ['Penguji'], summary: 'Sidang yang diampu sebagai Penguji 2', responses: { 200: { description: 'Daftar sidang' } } } },
    '/api/sidang': { get: { tags: ['Sidang'], summary: 'List semua sidang (auth)', responses: { 200: { description: 'Daftar sidang' } } } },
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
