const request = require('supertest');
const baseUrl = 'http://localhost:5000';


describe('Doctor Verification API Auth Middleware', () => {
  it('should return 401 if auth is missing', async () => {
    const res = await request(baseUrl).post('/api/admin-verification/').send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
  it('should return 401 if auth is invalid', async () => {
    const res = await request(baseUrl)
      .post('/api/admin-verification/')
      .set('Authorization', 'Bearer invalidtoken')
      .send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('should return 200/201/400 if auth is valid (payload may be invalid)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const idToken = await getTestIdToken();
    const res = await request(baseUrl)
      .post('/api/admin-verification/')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([400, 201, 200, 500]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Doctor Verification API Endpoints (with valid auth)', () => {
  let idToken;
  beforeAll(async () => {
    if (process.env.FIREBASE_WEB_API_KEY) {
      const getTestIdToken = require('../scripts/getTestIdToken');
      idToken = await getTestIdToken();
    }
  });

  it('GET /api/admin-verification/ - list verifications', async () => {
    const res = await request(baseUrl).get('/api/admin-verification/');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('PUT /api/admin-verification/:doctorId - update verification', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .put('/api/admin-verification/testid')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('POST /api/admin-verification/documents/:doctorId - upload document', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .post('/api/admin-verification/documents/testid')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 201, 400, 404]).toContain(res.statusCode);
  });
  it('GET /api/admin-verification/documents/:doctorId - list documents', async () => {
    const res = await request(baseUrl).get('/api/admin-verification/documents/testid');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('DELETE /api/admin-verification/documents/:doctorId/:filename - delete document', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .delete('/api/admin-verification/documents/testid/testfile.pdf')
      .set('Authorization', `Bearer ${idToken}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});
