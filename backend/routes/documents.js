import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const owned = dbHelpers.getDocumentsByOwner(req.user.id);
  const shared = dbHelpers.getSharedDocuments(req.user.id);
  res.json({ owned, shared });
});

router.post('/', async (req, res) => {
  const { title, content } = req.body;
  const doc = { id: uuidv4(), title: title || 'Untitled Document', content: content || JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }), owner_id: req.user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  await dbHelpers.createDocument(doc);
  res.status(201).json({ document: doc });
});

router.get('/:id', (req, res) => {
  const doc = dbHelpers.getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const isOwner = doc.owner_id === req.user.id;
  const share = dbHelpers.getShare(req.params.id, req.user.id);
  if (!isOwner && !share) return res.status(403).json({ error: 'Access denied' });
  const shares = dbHelpers.getSharesForDocument(req.params.id);
  const owner = dbHelpers.getUserById(doc.owner_id);
  res.json({ document: doc, role: isOwner ? 'owner' : share.permission, shares, owner: { id: owner.id, username: owner.username, email: owner.email } });
});

router.put('/:id', async (req, res) => {
  const doc = dbHelpers.getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const isOwner = doc.owner_id === req.user.id;
  const share = dbHelpers.getShare(req.params.id, req.user.id);
  if (!isOwner && share?.permission !== 'edit') return res.status(403).json({ error: 'No edit permission' });
  const { title, content } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  const updated = await dbHelpers.updateDocument(req.params.id, updates);
  res.json({ document: updated });
});

router.delete('/:id', async (req, res) => {
  const doc = dbHelpers.getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can delete' });
  await dbHelpers.deleteDocument(req.params.id);
  res.json({ ok: true });
});

router.post('/:id/share', async (req, res) => {
  const doc = dbHelpers.getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can share' });
  const { username, permission = 'view' } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  if (!['view', 'edit'].includes(permission)) return res.status(400).json({ error: 'Permission must be view or edit' });
  const targetUser = dbHelpers.getUserByUsername(username);
  if (!targetUser) return res.status(404).json({ error: `User "${username}" not found` });
  if (targetUser.id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });
  await dbHelpers.upsertShare(req.params.id, targetUser.id, permission, uuidv4());
  const shares = dbHelpers.getSharesForDocument(req.params.id);
  res.json({ ok: true, shares });
});

router.delete('/:id/share/:userId', async (req, res) => {
  const doc = dbHelpers.getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can manage shares' });
  await dbHelpers.removeShare(req.params.id, req.params.userId);
  res.json({ ok: true });
});

export default router;
