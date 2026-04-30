import { dbHelpers } from '../db/index.js';

export function requireAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const session = dbHelpers.getSession(token);
  if (!session) return res.status(401).json({ error: 'Session expired or invalid' });
  req.user = { id: session.user_id, username: session.username, email: session.email };
  next();
}
