import request from 'supertest';
import { initDb } from '../db/index.js';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth.js';
import documentRoutes from '../routes/documents.js';

// Build a test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

let token = '';
let docId = '';

beforeAll(async () => {
  await initDb();
});

describe('Auth', () => {
  test('POST /api/auth/login - valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@demo.com', password: 'demo1234' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('alice');
    token = res.body.token;
  });

  test('POST /api/auth/login - invalid credentials returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@demo.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me - authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('alice');
  });

  test('GET /api/auth/me - unauthenticated returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Documents', () => {
  test('POST /api/documents - create document', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Doc', content: JSON.stringify({ type: 'doc', content: [] }) });
    expect(res.status).toBe(201);
    expect(res.body.document.title).toBe('Test Doc');
    docId = res.body.document.id;
  });

  test('GET /api/documents - lists owned and shared', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.owned)).toBe(true);
    expect(Array.isArray(res.body.shared)).toBe(true);
    expect(res.body.owned.length).toBeGreaterThan(0);
  });

  test('PUT /api/documents/:id - updates title', async () => {
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe('Updated Title');
  });

  test('POST /api/documents/:id/share - shares with bob', async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'bob', permission: 'edit' });
    expect(res.status).toBe(200);
    expect(res.body.shares.length).toBe(1);
    expect(res.body.shares[0].username).toBe('bob');
    expect(res.body.shares[0].permission).toBe('edit');
  });

  test('GET /api/documents - bob sees shared doc', async () => {
    const bobLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@demo.com', password: 'demo1234' });
    const bobToken = bobLogin.body.token;

    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${bobToken}`);
    expect(res.body.shared.some(d => d.id === docId)).toBe(true);
  });

  test('GET /api/documents/:id - returns 403 for unauthorized user', async () => {
    const carolLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carol@demo.com', password: 'demo1234' });
    const carolToken = carolLogin.body.token;

    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${carolToken}`);
    expect(res.status).toBe(403);
  });

  test('DELETE /api/documents/:id - deletes document', async () => {
    const res = await request(app)
      .delete(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
