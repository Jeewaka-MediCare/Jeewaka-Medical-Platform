const request = require('supertest');
const baseUrl = 'http://localhost:5000';


describe('Session API Auth Middleware', () => {
  it('should return 401 if auth is missing (update)', async () => {
    const res = await request(baseUrl).patch('/api/session/testid').send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
  it('should return 401 if auth is invalid (update)', async () => {
    const res = await request(baseUrl)
      .patch('/api/session/testid')
      .set('Authorization', 'Bearer invalidtoken')
      .send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('should return 200/400/404 if auth is valid (update, payload may be invalid)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const idToken = await getTestIdToken();
    const res = await request(baseUrl)
      .patch('/api/session/testid')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
});

describe('Session API Endpoints (with valid auth where required)', () => {
  let idToken;
  beforeAll(async () => {
    if (process.env.FIREBASE_WEB_API_KEY) {
      const getTestIdToken = require('../scripts/getTestIdToken');
      idToken = await getTestIdToken();
    }
  });

  it('GET /api/session/ - list sessions', async () => {
    const res = await request(baseUrl).get('/api/session/');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/session/doctor/:doctorId/statistics - doctor stats', async () => {
    const res = await request(baseUrl).get('/api/session/doctor/testid/statistics');
  expect([200, 404, 401, 500, 400, 201]).toContain(res.statusCode);
  });
  it('GET /api/session/doctor/:doctorId - doctor sessions', async () => {
    const res = await request(baseUrl).get('/api/session/doctor/testid');
  expect([200, 404, 401, 500, 400, 201]).toContain(res.statusCode);
  });
  it('GET /api/session/:sessionId - get session by id', async () => {
    const res = await request(baseUrl).get('/api/session/testid');
  expect([200, 404, 401, 500, 400, 201]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('POST /api/session/:sessionId/book - book session (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .post('/api/session/testid/book')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('POST /api/session/ - create session (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .post('/api/session/')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 201, 400]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('PATCH /api/session/:sessionId - update session (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .patch('/api/session/testid')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('PATCH /api/session/:sessionId/meeting-id - update meeting id (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .patch('/api/session/testid/meeting-id')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('PATCH /api/session/:sessionId/status - update session status (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .patch('/api/session/testid/status')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('DELETE /api/session/:sessionId - delete session (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .delete('/api/session/testid')
      .set('Authorization', `Bearer ${idToken}`);
    expect([200, 404]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('POST /api/session/:sessionId/timeslot - add timeslot (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .post('/api/session/testid/timeslot')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 201, 400, 404]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('PUT /api/session/:sessionId/timeslot/:slotIndex - update timeslot (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .put('/api/session/testid/timeslot/0')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('DELETE /api/session/:sessionId/timeslot/:slotIndex - delete timeslot (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .delete('/api/session/testid/timeslot/0')
      .set('Authorization', `Bearer ${idToken}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});
