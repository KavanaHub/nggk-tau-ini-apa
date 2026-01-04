import swaggerJsdoc from 'swagger-jsdoc';

const serverUrl = process.env.SWAGGER_SERVER_URL || 'http://localhost:3000';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bimbingan Online API',
    version: '1.0.0',
    description: 'Dokumentasi API untuk Sistem Bimbingan Online Mahasiswa - Kavana',
    contact: {
      name: 'Kavana Team',
      email: 'support@kavana.com'
    }
  },
  servers: [
    {
      url: 'https://kavana-backend-j8ktr.ondigitalocean.app',
      description: 'Production Server',
    },
    {
      url: serverUrl,
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan token JWT yang didapat dari endpoint login'
      },
    },
    schemas: {
      // Auth Schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'mahasiswa@ulbi.ac.id', description: 'Email atau NPM' },
          password: { type: 'string', example: 'password123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT Token untuk autentikasi' },
          role: { type: 'string', enum: ['mahasiswa', 'dosen', 'koordinator', 'kaprodi', 'penguji', 'admin'], example: 'mahasiswa' },
          user_id: { type: 'integer', example: 1 },
        },
      },
      MahasiswaRegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'npm', 'nama'],
        properties: {
          email: { type: 'string', format: 'email', example: 'mahasiswa@ulbi.ac.id' },
          password: { type: 'string', minLength: 6, example: 'password123' },
          npm: { type: 'string', pattern: '^[0-9]{10}$', example: '1234567890' },
          nama: { type: 'string', example: 'John Doe' },
          no_wa: { type: 'string', example: '081234567890' },
          angkatan: { type: 'integer', example: 2024 },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['old_password', 'new_password'],
        properties: {
          old_password: { type: 'string', example: 'password123' },
          new_password: { type: 'string', minLength: 6, example: 'newpassword456' }
        }
      },

      // Mahasiswa Schemas
      MahasiswaProfile: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          npm: { type: 'string' },
          nama: { type: 'string' },
          no_wa: { type: 'string' },
          angkatan: { type: 'integer' },
          track: { type: 'string', enum: ['proyek1', 'proyek2', 'proyek3', 'internship1', 'internship2'] },
          kelompok_id: { type: 'integer' },
          judul_proyek: { type: 'string' },
          status_proposal: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          dosen_nama: { type: 'string' },
          dosen_nama_2: { type: 'string' }
        }
      },
      SetTrackRequest: {
        type: 'object',
        required: ['track'],
        properties: {
          track: { type: 'string', enum: ['proyek1', 'proyek2', 'proyek3', 'internship1', 'internship2'], example: 'proyek1' },
          partner_npm: { type: 'string', description: 'NPM partner untuk proyek (opsional)', example: '1234567891' }
        }
      },
      SubmitProposalRequest: {
        type: 'object',
        required: ['judul_proyek', 'file_url'],
        properties: {
          judul_proyek: { type: 'string', example: 'Sistem Informasi Bimbingan Online' },
          file_url: { type: 'string', example: 'https://drive.google.com/file/xxx' },
          usulan_dosen_id: { type: 'integer', description: 'ID dosen yang diusulkan', example: 1 }
        }
      },

      // Kelompok Schemas
      CreateKelompokRequest: {
        type: 'object',
        required: ['nama'],
        properties: {
          nama: { type: 'string', example: 'Kelompok A' }
        }
      },
      JoinKelompokRequest: {
        type: 'object',
        required: ['kelompok_id'],
        properties: {
          kelompok_id: { type: 'integer', example: 1 }
        }
      },

      // Bimbingan Schemas
      CreateBimbinganRequest: {
        type: 'object',
        required: ['tanggal', 'minggu_ke', 'topik'],
        properties: {
          tanggal: { type: 'string', format: 'date', example: '2024-01-15' },
          minggu_ke: { type: 'integer', minimum: 1, maximum: 8, example: 1 },
          topik: { type: 'string', example: 'Konsultasi BAB 1' },
          catatan: { type: 'string', example: 'Diskusi latar belakang masalah' }
        }
      },
      Bimbingan: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          mahasiswa_id: { type: 'integer' },
          dosen_id: { type: 'integer' },
          tanggal: { type: 'string', format: 'date' },
          minggu_ke: { type: 'integer' },
          topik: { type: 'string' },
          catatan: { type: 'string' },
          status: { type: 'string', enum: ['waiting', 'approved', 'rejected'] },
          approved_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      UpdateBimbinganStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['approved', 'rejected'], example: 'approved' },
          catatan: { type: 'string', example: 'Bimbingan diterima' }
        }
      },

      // Koordinator Schemas
      ValidateProposalRequest: {
        type: 'object',
        required: ['mahasiswa_id', 'status'],
        properties: {
          mahasiswa_id: { type: 'integer', example: 1 },
          status: { type: 'string', enum: ['approved', 'rejected'], example: 'approved' },
          catatan: { type: 'string', example: 'Proposal diterima' }
        }
      },
      AssignDosenRequest: {
        type: 'object',
        required: ['mahasiswa_id', 'dosen_id'],
        properties: {
          mahasiswa_id: { type: 'integer', example: 1 },
          dosen_id: { type: 'integer', description: 'Pembimbing utama', example: 1 },
          dosen_id_2: { type: 'integer', description: 'Pembimbing kedua (wajib untuk internship)', example: 2 }
        }
      },
      CreateJadwalRequest: {
        type: 'object',
        required: ['nama', 'tipe', 'start_date', 'end_date', 'semester'],
        properties: {
          nama: { type: 'string', example: 'Proyek 1 Semester Genap 2024' },
          tipe: { type: 'string', enum: ['proyek', 'internship', 'lainnya'], example: 'proyek' },
          start_date: { type: 'string', format: 'date', example: '2024-02-01' },
          end_date: { type: 'string', format: 'date', example: '2024-06-30' },
          semester: { type: 'integer', enum: [2, 3, 5, 7, 8], example: 2 },
          deskripsi: { type: 'string', example: 'Periode proyek semester genap' }
        }
      },

      // Kaprodi Schemas
      AssignKoordinatorRequest: {
        type: 'object',
        required: ['koordinator_id', 'semester'],
        properties: {
          koordinator_id: { type: 'integer', description: 'ID dosen', example: 1 },
          semester: { type: 'integer', enum: [2, 3, 5, 7, 8], example: 5 }
        }
      },
      UnassignKoordinatorRequest: {
        type: 'object',
        required: ['koordinator_id'],
        properties: {
          koordinator_id: { type: 'integer', example: 1 }
        }
      },

      // Laporan Schemas
      SubmitLaporanRequest: {
        type: 'object',
        required: ['file_url'],
        properties: {
          file_url: { type: 'string', example: 'https://drive.google.com/file/xxx' }
        }
      },

      // Common Schemas
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Error message' },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operation successful' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'System', description: 'Health check endpoints' },
    { name: 'Auth', description: 'Autentikasi dan manajemen akun' },
    { name: 'Mahasiswa', description: 'Endpoint untuk mahasiswa' },
    { name: 'Dosen', description: 'Endpoint untuk dosen pembimbing' },
    { name: 'Koordinator', description: 'Endpoint untuk koordinator' },
    { name: 'Kaprodi', description: 'Endpoint untuk kaprodi' },
    { name: 'Penguji', description: 'Endpoint untuk penguji sidang' },
    { name: 'Bimbingan', description: 'Upload file bimbingan' },
    { name: 'Proposal', description: 'Upload file proposal' },
    { name: 'Report', description: 'Upload laporan sidang' },
    { name: 'Sidang', description: 'Jadwal sidang' },
    { name: 'Profile', description: 'Upload foto profil' },
  ],
  paths: {
    // ==================== SYSTEM ====================
    '/': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'Service is running',
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
            description: 'Pong response',
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

    // ==================== AUTH ====================
    '/api/auth/register/mahasiswa': {
      post: {
        tags: ['Auth'],
        summary: 'Register mahasiswa baru',
        description: 'Hanya mahasiswa yang bisa registrasi sendiri',
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
          201: {
            description: 'Registrasi berhasil',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          400: {
            description: 'Email/NPM sudah terdaftar',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login multi-role',
        description: 'Login untuk semua role: mahasiswa, dosen, koordinator, kaprodi, penguji, admin',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: {
            description: 'Login berhasil, JWT token dikembalikan',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: {
            description: 'Kredensial tidak valid',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get profil user yang login',
        responses: {
          200: { description: 'Profil user' },
          401: { description: 'Unauthorized' }
        }
      },
      patch: {
        tags: ['Auth'],
        summary: 'Update profil user',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nama: { type: 'string', example: 'Nama Baru' },
                  no_wa: { type: 'string', example: '081234567890' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Profil berhasil diupdate' } }
      }
    },
    '/api/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Ganti password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Password berhasil diubah' },
          400: { description: 'Password lama salah' }
        }
      }
    },

    // ==================== MAHASISWA ====================
    '/api/mahasiswa/profile': {
      get: {
        tags: ['Mahasiswa'],
        summary: 'Get profil mahasiswa',
        responses: {
          200: {
            description: 'Profil mahasiswa',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/MahasiswaProfile' } } }
          }
        }
      },
      put: {
        tags: ['Mahasiswa'],
        summary: 'Update profil mahasiswa',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nama: { type: 'string' },
                  no_wa: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Profil berhasil diupdate' } }
      },
    },
    '/api/mahasiswa/track': {
      patch: {
        tags: ['Mahasiswa'],
        summary: 'Set track mahasiswa',
        description: 'Pilih track proyek/internship. Untuk proyek bisa input partner_npm untuk auto-matching kelompok',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SetTrackRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Track berhasil diset',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    track: { type: 'string' },
                    matched: { type: 'boolean' },
                    kelompok_id: { type: 'integer' }
                  }
                }
              }
            }
          },
          400: { description: 'Track tidak valid atau sudah bergabung kelompok' }
        }
      },
    },
    '/api/mahasiswa/periode-aktif': {
      get: {
        tags: ['Mahasiswa'],
        summary: 'Cek periode aktif',
        description: 'Cek apakah mahasiswa eligible untuk mengikuti proyek/internship',
        responses: {
          200: {
            description: 'Status periode',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    active: { type: 'boolean' },
                    periode: { type: 'object' },
                    semester: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
    },
    '/api/mahasiswa/kelompok': {
      post: {
        tags: ['Mahasiswa'],
        summary: 'Buat kelompok baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateKelompokRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Kelompok berhasil dibuat' },
          400: { description: 'Validasi gagal' }
        }
      },
      get: {
        tags: ['Mahasiswa'],
        summary: 'Lihat kelompok saya',
        responses: { 200: { description: 'Data kelompok dan anggota' } }
      },
    },
    '/api/mahasiswa/kelompok/join': {
      post: {
        tags: ['Mahasiswa'],
        summary: 'Bergabung ke kelompok',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JoinKelompokRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Berhasil bergabung' },
          400: { description: 'Kelompok penuh atau track tidak sesuai' }
        }
      },
    },
    '/api/mahasiswa/kelompok/available': {
      get: {
        tags: ['Mahasiswa'],
        summary: 'Daftar kelompok tersedia',
        description: 'Kelompok dengan track sama dan belum penuh',
        responses: { 200: { description: 'List kelompok' } }
      },
    },
    '/api/mahasiswa/proposal': {
      post: {
        tags: ['Mahasiswa'],
        summary: 'Submit proposal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubmitProposalRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Proposal berhasil disubmit' },
          400: { description: 'Belum pilih track atau proposal sudah disubmit' }
        }
      },
    },
    '/api/mahasiswa/proposal/status': {
      get: {
        tags: ['Mahasiswa'],
        summary: 'Status proposal',
        responses: { 200: { description: 'Status proposal mahasiswa' } }
      },
    },
    '/api/mahasiswa/dosen': {
      get: {
        tags: ['Mahasiswa'],
        summary: 'Dosen pembimbing saya',
        responses: { 200: { description: 'Data dosen pembimbing' } }
      },
    },
    '/api/mahasiswa/dosen/list': {
      get: {
        tags: ['Mahasiswa'],
        summary: 'Daftar semua dosen aktif',
        responses: { 200: { description: 'List dosen' } }
      },
    },
    '/api/mahasiswa/bimbingan': {
      post: {
        tags: ['Mahasiswa'],
        summary: 'Ajukan sesi bimbingan',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBimbinganRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Bimbingan berhasil dibuat' },
          400: { description: 'Belum punya dosen pembimbing atau sudah 8x bimbingan' }
        }
      },
      get: {
        tags: ['Mahasiswa'],
        summary: 'Riwayat bimbingan saya',
        responses: {
          200: {
            description: 'Daftar bimbingan',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Bimbingan' }
                }
              }
            }
          }
        }
      },
    },
    '/api/mahasiswa/laporan': {
      post: {
        tags: ['Mahasiswa'],
        summary: 'Submit laporan sidang',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubmitLaporanRequest' }
            }
          }
        },
        responses: { 201: { description: 'Laporan berhasil disubmit' } }
      },
      get: {
        tags: ['Mahasiswa'],
        summary: 'Laporan saya',
        responses: { 200: { description: 'Daftar laporan' } }
      },
    },
    '/api/mahasiswa/sidang': {
      get: {
        tags: ['Mahasiswa'],
        summary: 'Jadwal sidang saya',
        responses: { 200: { description: 'Jadwal sidang' } }
      },
    },

    // ==================== BIMBINGAN ====================
    '/api/bimbingan/{id}': {
      get: {
        tags: ['Bimbingan'],
        summary: 'Detail bimbingan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Detail bimbingan',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Bimbingan' } } }
          },
          404: { description: 'Tidak ditemukan' }
        },
      },
    },
    '/api/bimbingan/upload': {
      post: {
        tags: ['Bimbingan'],
        summary: 'Upload lampiran bimbingan',
        description: 'Upload file atau simpan link Google Drive',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  mahasiswa_id: { type: 'integer' },
                  bimbingan_id: { type: 'integer' },
                  file: { type: 'string', format: 'binary' }
                }
              }
            },
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  mahasiswa_id: { type: 'integer' },
                  bimbingan_id: { type: 'integer' },
                  file_url: { type: 'string', description: 'Link Google Drive' }
                }
              }
            },
          },
        },
        responses: { 200: { description: 'Lampiran tersimpan' } },
      },
    },

    // ==================== DOSEN ====================
    '/api/dosen/profile': {
      get: {
        tags: ['Dosen'],
        summary: 'Profil dosen',
        responses: { 200: { description: 'Profil dosen' } }
      },
    },
    '/api/dosen/stats': {
      get: {
        tags: ['Dosen'],
        summary: 'Statistik dashboard',
        responses: {
          200: {
            description: 'Statistik',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total_mahasiswa: { type: 'integer' },
                    bimbingan_pending: { type: 'integer' },
                    siap_sidang: { type: 'integer' },
                    laporan_pending: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
    },
    '/api/dosen/list': {
      get: {
        tags: ['Dosen'],
        summary: 'Daftar dosen aktif',
        description: 'Endpoint public, tidak perlu authentication',
        security: [],
        responses: { 200: { description: 'List dosen' } }
      },
    },
    '/api/dosen/mahasiswa': {
      get: {
        tags: ['Dosen'],
        summary: 'Mahasiswa bimbingan saya',
        responses: { 200: { description: 'List mahasiswa' } }
      },
    },
    '/api/dosen/bimbingan': {
      get: {
        tags: ['Dosen'],
        summary: 'Bimbingan untuk disetujui',
        responses: { 200: { description: 'Daftar bimbingan' } }
      },
    },
    '/api/dosen/bimbingan/{id}/status': {
      patch: {
        tags: ['Dosen'],
        summary: 'Approve/Reject bimbingan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateBimbinganStatusRequest' }
            }
          }
        },
        responses: { 200: { description: 'Status berhasil diupdate' } },
      },
    },
    '/api/dosen/laporan': {
      get: {
        tags: ['Dosen'],
        summary: 'Laporan sidang mahasiswa',
        responses: { 200: { description: 'Daftar laporan' } }
      },
    },
    '/api/dosen/laporan/{id}/status': {
      patch: {
        tags: ['Dosen'],
        summary: 'Approve/Reject laporan sidang',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['approved', 'rejected'] }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Status berhasil diupdate' } },
      },
    },
    '/api/dosen/sidang': {
      get: {
        tags: ['Dosen'],
        summary: 'Sidang sebagai Penguji 1',
        responses: { 200: { description: 'Daftar sidang' } }
      },
    },

    // ==================== KOORDINATOR ====================
    '/api/koordinator/profile': {
      get: {
        tags: ['Koordinator'],
        summary: 'Profil koordinator',
        responses: { 200: { description: 'Profil' } }
      },
    },
    '/api/koordinator/stats': {
      get: {
        tags: ['Koordinator'],
        summary: 'Statistik dashboard',
        responses: { 200: { description: 'Statistik' } }
      },
    },
    '/api/koordinator/my-semester': {
      get: {
        tags: ['Koordinator'],
        summary: 'Semester yang di-assign',
        responses: {
          200: {
            description: 'Data semester',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    assigned: { type: 'boolean' },
                    assigned_semester: { type: 'integer' },
                    semester_label: { type: 'string' }
                  }
                }
              }
            }
          },
          404: { description: 'Belum di-assign' }
        }
      },
    },
    '/api/koordinator/mahasiswa': {
      get: {
        tags: ['Koordinator'],
        summary: 'List mahasiswa',
        responses: { 200: { description: 'Daftar mahasiswa' } }
      }
    },
    '/api/koordinator/dosen': {
      get: {
        tags: ['Koordinator'],
        summary: 'List dosen',
        responses: { 200: { description: 'Daftar dosen' } }
      }
    },
    '/api/koordinator/proposal/pending': {
      get: {
        tags: ['Koordinator'],
        summary: 'Proposal pending',
        responses: { 200: { description: 'Daftar proposal pending' } }
      }
    },
    '/api/koordinator/proposal/validate': {
      patch: {
        tags: ['Koordinator'],
        summary: 'Validasi proposal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidateProposalRequest' }
            }
          }
        },
        responses: { 200: { description: 'Proposal berhasil divalidasi' } }
      }
    },
    '/api/koordinator/assign-dosen': {
      post: {
        tags: ['Koordinator'],
        summary: 'Assign dosen pembimbing',
        description: 'Internship wajib 2 pembimbing',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AssignDosenRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Dosen berhasil ditugaskan' },
          400: { description: 'Internship memerlukan 2 pembimbing' }
        }
      }
    },
    '/api/koordinator/penguji': {
      get: {
        tags: ['Koordinator'],
        summary: 'List penguji',
        responses: { 200: { description: 'Daftar penguji' } }
      }
    },
    '/api/koordinator/sidang/schedule': {
      post: {
        tags: ['Koordinator'],
        summary: 'Jadwalkan sidang',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  mahasiswa_id: { type: 'integer' },
                  tanggal: { type: 'string', format: 'date' },
                  waktu: { type: 'string', format: 'time' },
                  ruangan: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Sidang berhasil dijadwalkan' } }
      }
    },
    '/api/koordinator/sidang': {
      get: {
        tags: ['Koordinator'],
        summary: 'List sidang',
        responses: { 200: { description: 'Daftar sidang' } }
      }
    },
    '/api/koordinator/jadwal': {
      get: {
        tags: ['Koordinator'],
        summary: 'List jadwal proyek',
        responses: { 200: { description: 'Daftar jadwal' } }
      },
      post: {
        tags: ['Koordinator'],
        summary: 'Buat jadwal proyek',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateJadwalRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Jadwal berhasil dibuat' },
          400: { description: 'Validasi gagal' }
        },
      },
    },
    '/api/koordinator/jadwal/active': {
      get: {
        tags: ['Koordinator'],
        summary: 'Jadwal aktif',
        responses: {
          200: { description: 'Jadwal yang sedang aktif' },
          404: { description: 'Tidak ada jadwal aktif' }
        }
      },
    },
    '/api/koordinator/jadwal/{id}': {
      put: {
        tags: ['Koordinator'],
        summary: 'Update jadwal',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateJadwalRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Jadwal berhasil diupdate' },
          404: { description: 'Tidak ditemukan' }
        },
      },
    },
    '/api/koordinator/jadwal/{id}/complete': {
      post: {
        tags: ['Koordinator'],
        summary: 'Selesaikan jadwal',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Jadwal berhasil diselesaikan' },
          400: { description: 'Jadwal sudah completed' },
          404: { description: 'Tidak ditemukan' },
        },
      },
    },

    // ==================== KAPRODI ====================
    '/api/kaprodi/profile': {
      get: {
        tags: ['Kaprodi'],
        summary: 'Profil kaprodi',
        responses: { 200: { description: 'Profil' } }
      }
    },
    '/api/kaprodi/stats': {
      get: {
        tags: ['Kaprodi'],
        summary: 'Statistik dashboard',
        responses: { 200: { description: 'Statistik keseluruhan' } }
      }
    },
    '/api/kaprodi/activities': {
      get: {
        tags: ['Kaprodi'],
        summary: 'Aktivitas terbaru',
        responses: { 200: { description: 'List aktivitas' } }
      }
    },
    '/api/kaprodi/mahasiswa': {
      get: {
        tags: ['Kaprodi'],
        summary: 'List mahasiswa',
        responses: { 200: { description: 'Daftar mahasiswa' } }
      }
    },
    '/api/kaprodi/dosen': {
      get: {
        tags: ['Kaprodi'],
        summary: 'List dosen',
        responses: { 200: { description: 'Daftar dosen' } }
      }
    },
    '/api/kaprodi/koordinator': {
      get: {
        tags: ['Kaprodi'],
        summary: 'List koordinator',
        responses: { 200: { description: 'Daftar koordinator dengan semester' } }
      }
    },
    '/api/kaprodi/penguji': {
      get: {
        tags: ['Kaprodi'],
        summary: 'List penguji',
        responses: { 200: { description: 'Daftar penguji' } }
      }
    },
    '/api/kaprodi/assign-dosen': {
      post: {
        tags: ['Kaprodi'],
        summary: 'Assign dosen pembimbing',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AssignDosenRequest' }
            }
          }
        },
        responses: { 200: { description: 'Dosen ditugaskan' } }
      }
    },
    '/api/kaprodi/proposal/status': {
      patch: {
        tags: ['Kaprodi'],
        summary: 'Update status proposal',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidateProposalRequest' }
            }
          }
        },
        responses: { 200: { description: 'Status diupdate' } }
      }
    },
    '/api/kaprodi/koordinator/assign-semester': {
      post: {
        tags: ['Kaprodi'],
        summary: 'Assign koordinator ke semester',
        description: 'Satu koordinator hanya bisa menangani satu semester',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AssignKoordinatorRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Berhasil di-assign' },
          400: { description: 'Semester sudah di-assign ke koordinator lain' },
          404: { description: 'Dosen tidak ditemukan' }
        }
      },
    },
    '/api/kaprodi/koordinator/unassign-semester': {
      post: {
        tags: ['Kaprodi'],
        summary: 'Hapus assignment koordinator',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UnassignKoordinatorRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Assignment berhasil dihapus' },
          400: { description: 'Validasi gagal' }
        }
      },
    },

    // ==================== PENGUJI ====================
    '/api/penguji/profile': {
      get: {
        tags: ['Penguji'],
        summary: 'Profil penguji',
        responses: {
          200: { description: 'Profil' },
          404: { description: 'Tidak ditemukan' }
        }
      }
    },
    '/api/penguji/sidang': {
      get: {
        tags: ['Penguji'],
        summary: 'Sidang sebagai penguji',
        responses: { 200: { description: 'Daftar sidang' } }
      }
    },

    // ==================== SIDANG ====================
    '/api/sidang': {
      get: {
        tags: ['Sidang'],
        summary: 'List semua sidang',
        responses: { 200: { description: 'Daftar sidang' } }
      }
    },
    '/api/sidang/upload': {
      post: {
        tags: ['Sidang'],
        summary: 'Upload berkas sidang',
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
        responses: {
          200: { description: 'Berkas tersimpan' },
          400: { description: 'Validasi gagal' }
        },
      },
    },

    // ==================== PROPOSAL ====================
    '/api/proposal/upload': {
      post: {
        tags: ['Proposal'],
        summary: 'Upload file proposal',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' }
                }
              }
            },
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  file_url: { type: 'string' }
                }
              }
            },
          },
        },
        responses: {
          200: { description: 'Proposal tersimpan' },
          400: { description: 'Validasi gagal' }
        },
      },
    },

    // ==================== REPORT ====================
    '/api/report/upload': {
      post: {
        tags: ['Report'],
        summary: 'Upload laporan sidang',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' }
                }
              }
            },
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  file_url: { type: 'string' }
                }
              }
            },
          },
        },
        responses: {
          200: { description: 'Report tersimpan' },
          400: { description: 'Validasi gagal' }
        },
      },
    },

    // ==================== PROFILE ====================
    '/api/profile/upload': {
      post: {
        tags: ['Profile'],
        summary: 'Upload foto profil',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' }
                }
              }
            },
          },
        },
        responses: {
          200: { description: 'Foto profil tersimpan' },
          400: { description: 'Validasi gagal' }
        },
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
