// Rejects unauthenticated requests to protected routes (spec Section 1a / GAP-03).
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}

module.exports = { requireAuth };
