// ============================================================
// auth.js — JWT middleware for customer + admin routes
// ============================================================
const jwt = require('jsonwebtoken');

// Protect customer-only routes
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided.' });

  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Protect admin-only routes
function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided.' });

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.ADMIN_JWT_SECRET);
    if (!decoded.is_admin) return res.status(403).json({ error: 'Admin access required.' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired admin token.' });
  }
}

module.exports = { requireAuth, requireAdmin };
