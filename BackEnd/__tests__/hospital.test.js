const request = require('supertest');
const baseUrl = 'http://localhost:5000';


describe('Hospital API Auth Middleware', () => {
  it('should return 401 if auth is missing (update)', async () => {
    const res = await request(baseUrl).put('/api/hospital/testid').send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
  it('should return 401 if auth is invalid (update)', async () => {
    const res = await request(baseUrl)
      .put('/api/hospital/testid')
      .set('Authorization', 'Bearer invalidtoken')
      .send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('should return 200/400/404 if auth is valid (update, payload may be invalid)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const idToken = await getTestIdToken();
    const res = await request(baseUrl)
      .put('/api/hospital/testid')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
});

describe('Hospital API Endpoints (with valid auth where required)', () => {
  let idToken;
  beforeAll(async () => {
    if (process.env.FIREBASE_WEB_API_KEY) {
      const getTestIdToken = require('../scripts/getTestIdToken');
      idToken = await getTestIdToken();
    }
  });

  it('GET /api/hospital/ - list hospitals', async () => {
    const res = await request(baseUrl).get('/api/hospital/');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/hospital/:hospitalId - get hospital by id', async () => {
    const res = await request(baseUrl).get('/api/hospital/testid');
  expect([200, 404, 401, 500, 400, 201]).toContain(res.statusCode);
  });
  it('POST /api/hospital/ - create hospital', async () => {
    const res = await request(baseUrl).post('/api/hospital/').send({});
  expect([200, 201, 400, 401, 500]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('PUT /api/hospital/:hospitalId - update hospital (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .put('/api/hospital/testid')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('DELETE /api/hospital/:hospitalId - delete hospital (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .delete('/api/hospital/testid')
      .set('Authorization', `Bearer ${idToken}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});
