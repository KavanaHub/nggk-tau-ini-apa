// Middleware untuk cek role biasa - admin bisa akses semua
export default function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Admin dapat mengakses semua route yang membutuhkan role.
    if (req.user.role === 'admin') {
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
