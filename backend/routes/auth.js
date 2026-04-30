import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = dbHelpers.getUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await dbHelpers.createSession(sessionId, user.id, expiresAt);
  res.json({ token: sessionId, user: { id: user.id, username: user.username, email: user.email } });
});

router.post('/logout', requireAuth, async (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  await dbHelpers.deleteSession(token);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.get('/users', requireAuth, (req, res) => {
  const users = dbHelpers.getUsersExcept(req.user.id).map(u => ({ id: u.id, username: u.username, email: u.email }));
  res.json({ users });
});

export default router;
