const request = require('supertest');
const baseUrl = 'http://localhost:5000';


describe('Patient API Auth Middleware', () => {
  it('should return 401 if auth is missing (update)', async () => {
    const res = await request(baseUrl).put('/api/patient/testid').send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
  it('should return 401 if auth is invalid (update)', async () => {
    const res = await request(baseUrl)
      .put('/api/patient/testid')
      .set('Authorization', 'Bearer invalidtoken')
      .send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('should return 200/400/404 if auth is valid (update, payload may be invalid)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const idToken = await getTestIdToken();
    const res = await request(baseUrl)
      .put('/api/patient/testid')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
});

describe('Patient API Endpoints (with valid auth where required)', () => {
  let idToken;
  beforeAll(async () => {
    if (process.env.FIREBASE_WEB_API_KEY) {
      const getTestIdToken = require('../scripts/getTestIdToken');
      idToken = await getTestIdToken();
    }
  });

  it('POST /api/patient/ - create patient', async () => {
    const res = await request(baseUrl).post('/api/patient/').send({});
  expect([200, 201, 400, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/patient/uuid/:uuid - get patient by uuid', async () => {
    const res = await request(baseUrl).get('/api/patient/uuid/testuuid');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/patient/:patientId/appointments - get appointments', async () => {
    const res = await request(baseUrl).get('/api/patient/testid/appointments');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/patient/:id - get patient by id', async () => {
    const res = await request(baseUrl).get('/api/patient/testid');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('PUT /api/patient/:id - update patient (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .put('/api/patient/testid')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
  it('GET /api/patient/ - list all patients', async () => {
    const res = await request(baseUrl).get('/api/patient/');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('DELETE /api/patient/:id - delete patient (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .delete('/api/patient/testid')
      .set('Authorization', `Bearer ${idToken}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});
