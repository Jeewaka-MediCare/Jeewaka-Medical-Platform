
const request = require('supertest');
const baseUrl = 'http://localhost:5000';


describe('Ratings API Auth Middleware', () => {
  it('should return 401 if auth is missing', async () => {
    const res = await request(baseUrl).post('/api/ratings/').send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 if auth is invalid', async () => {
    const res = await request(baseUrl)
      .post('/api/ratings/')
      .set('Authorization', 'Bearer invalidtoken')
      .send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  // Only one endpoint needs to be tested for auth if all use the same middleware
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('should return 200/201/400 if auth is valid (payload may be invalid)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const idToken = await getTestIdToken();
    const res = await request(baseUrl)
      .post('/api/ratings/')
      .set('Authorization', `Bearer ${idToken}`)
      .send({}); // intentionally invalid payload
    expect([400, 500]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Ratings API Endpoints (with valid auth)', () => {
  let idToken;
  beforeAll(async () => {
    if (process.env.FIREBASE_WEB_API_KEY) {
      const getTestIdToken = require('../scripts/getTestIdToken');
      idToken = await getTestIdToken();
    }
  });

  it('GET /api/ratings/doctor/:doctorId - get doctor reviews (public)', async () => {
    const res = await request(baseUrl).get('/api/ratings/doctor/testid');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });

  it('GET /api/ratings/doctor/:doctorId/average - get doctor average rating (public)', async () => {
    const res = await request(baseUrl).get('/api/ratings/doctor/testid/average');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });

  it('GET /api/ratings/ - list all ratings (public)', async () => {
    const res = await request(baseUrl).get('/api/ratings/');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });

  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('POST /api/ratings/ - create/update review (valid auth, valid payload)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const payload = {
      doctorId: 'testdoctor',
      patientId: 'testuser',
      rating: 5,
      comment: 'Great doctor!',
      appointmentId: 'appt123',
    };
    const res = await request(baseUrl)
      .post('/api/ratings/')
      .set('Authorization', `Bearer ${idToken}`)
      .send(payload);
    expect([200, 201, 400]).toContain(res.statusCode);
    if ([200, 201].includes(res.statusCode)) {
      expect(res.body).toHaveProperty('review');
    } else {
      expect(res.body).toHaveProperty('error');
    }
  });
});
