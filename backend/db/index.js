import { JSONFilePreset } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'db.json');
const defaultData = { users: [], documents: [], document_shares: [], sessions: [] };

// Singleton promise — guarantees db is ready before any route runs
let _db = null;

export async function initDb() {
  if (_db) return _db;
  _db = await JSONFilePreset(DB_PATH, defaultData);

  // Seed users if empty
  if (_db.data.users.length === 0) {
    const seeds = [
      { id: 'user-alice', username: 'alice', email: 'alice@demo.com', password: 'demo1234' },
      { id: 'user-bob',   username: 'bob',   email: 'bob@demo.com',   password: 'demo1234' },
      { id: 'user-carol', username: 'carol', email: 'carol@demo.com', password: 'demo1234' },
    ];
    for (const u of seeds) {
      _db.data.users.push({
        id: u.id, username: u.username, email: u.email,
        password_hash: bcrypt.hashSync(u.password, 10),
        created_at: new Date().toISOString()
      });
    }
  }

  // Seed sample doc for alice if empty
  if (_db.data.documents.length === 0) {
    _db.data.documents.push({
      id: uuidv4(), title: 'Welcome to DocEditor',
      content: JSON.stringify({ type: 'doc', content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome to DocEditor 👋' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Create, edit, and share documents with your team.' }] }
      ]}),
      owner_id: 'user-alice',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  await _db.write();
  return _db;
}

// Safe getter — throws a clear error if called before initDb()
function getDb() {
  if (!_db) throw new Error('Database not initialised. Call initDb() first.');
  return _db;
}

export const dbHelpers = {
  getUserByEmail:    (email)    => getDb().data.users.find(u => u.email === email),
  getUserByUsername: (username) => getDb().data.users.find(u => u.username === username),
  getUserById:       (id)       => getDb().data.users.find(u => u.id === id),
  getUsersExcept:    (id)       => getDb().data.users.filter(u => u.id !== id),

  createSession: async (id, userId, expiresAt) => {
    const db = getDb();
    db.data.sessions.push({ id, user_id: userId, expires_at: expiresAt, created_at: new Date().toISOString() });
    await db.write();
  },
  getSession: (id) => {
    const s = getDb().data.sessions.find(s => s.id === id && new Date(s.expires_at) > new Date());
    if (!s) return null;
    const u = getDb().data.users.find(u => u.id === s.user_id);
    return u ? { ...s, user_id: u.id, username: u.username, email: u.email } : null;
  },
  deleteSession: async (id) => {
    const db = getDb();
    db.data.sessions = db.data.sessions.filter(s => s.id !== id);
    await db.write();
  },

  getDocumentsByOwner: (ownerId) => {
    const owner = getDb().data.users.find(u => u.id === ownerId);
    return getDb().data.documents
      .filter(d => d.owner_id === ownerId)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .map(d => ({ ...d, role: 'owner', owner_username: owner?.username }));
  },
  getSharedDocuments: (userId) => {
    const db = getDb();
    return db.data.document_shares
      .filter(s => s.shared_with_user_id === userId)
      .map(share => {
        const doc = db.data.documents.find(d => d.id === share.document_id);
        const owner = db.data.users.find(u => u.id === doc?.owner_id);
        return doc ? { ...doc, role: share.permission, owner_username: owner?.username } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  },
  getDocumentById: (id) => getDb().data.documents.find(d => d.id === id),
  createDocument: async (doc) => {
    const db = getDb();
    db.data.documents.push(doc);
    await db.write();
    return doc;
  },
  updateDocument: async (id, updates) => {
    const db = getDb();
    const idx = db.data.documents.findIndex(d => d.id === id);
    if (idx === -1) return null;
    db.data.documents[idx] = { ...db.data.documents[idx], ...updates, updated_at: new Date().toISOString() };
    await db.write();
    return db.data.documents[idx];
  },
  deleteDocument: async (id) => {
    const db = getDb();
    db.data.documents = db.data.documents.filter(d => d.id !== id);
    db.data.document_shares = db.data.document_shares.filter(s => s.document_id !== id);
    await db.write();
  },

  getSharesForDocument: (docId) => {
    const db = getDb();
    return db.data.document_shares
      .filter(s => s.document_id === docId)
      .map(s => {
        const u = db.data.users.find(u => u.id === s.shared_with_user_id);
        return { ...s, username: u?.username, email: u?.email };
      });
  },
  getShare: (docId, userId) =>
    getDb().data.document_shares.find(s => s.document_id === docId && s.shared_with_user_id === userId),
  upsertShare: async (docId, userId, permission, id) => {
    const db = getDb();
    const idx = db.data.document_shares.findIndex(s => s.document_id === docId && s.shared_with_user_id === userId);
    if (idx >= 0) {
      db.data.document_shares[idx].permission = permission;
    } else {
      db.data.document_shares.push({ id, document_id: docId, shared_with_user_id: userId, permission, created_at: new Date().toISOString() });
    }
    await db.write();
  },
  removeShare: async (docId, userId) => {
    const db = getDb();
    db.data.document_shares = db.data.document_shares.filter(
      s => !(s.document_id === docId && s.shared_with_user_id === userId)
    );
    await db.write();
  },
};
