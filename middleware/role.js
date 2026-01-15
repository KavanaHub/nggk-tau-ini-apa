// Middleware untuk cek role biasa - admin bisa akses semua
// Koordinator juga bisa akses route dosen (karena koordinator juga dosen pembimbing)
// Kaprodi juga bisa akses route koordinator (bila sudah di-assign) dan route dosen
export default function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Admin dapat mengakses semua route yang membutuhkan role.
    if (req.user.role === 'admin') {
      return next();
    }

    // Koordinator dapat mengakses route dosen (koordinator juga dosen pembimbing)
    if (req.user.role === 'koordinator' && roles.includes('dosen')) {
      return next();
    }

    // Kaprodi dapat mengakses route dosen (kaprodi juga dosen pembimbing)
    if (req.user.role === 'kaprodi' && roles.includes('dosen')) {
      return next();
    }

    // Kaprodi dapat mengakses route koordinator (bila sudah di-assign sebagai koordinator)
    // Catatan: Ini memerlukan pengecekan is_koordinator dari profile, tapi untuk simplicity
    // kita izinkan kaprodi akses koordinator endpoints - validasi semester di controller
    if (req.user.role === 'kaprodi' && roles.includes('koordinator')) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

// Middleware khusus untuk route yang HANYA kaprodi yang boleh akses (admin tidak boleh)
export function kaprodiOnly() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Hanya kaprodi yang boleh akses, admin TIDAK boleh
    if (req.user.role !== 'kaprodi') {
      return res.status(403).json({ message: 'Forbidden - Kaprodi only' });
    }
    next();
  };
}
