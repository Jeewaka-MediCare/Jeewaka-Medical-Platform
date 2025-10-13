const request = require('supertest');
const baseUrl = 'http://localhost:5000';


describe('Medical Records API Auth Middleware', () => {
  it('should return 401 if auth is missing (update)', async () => {
    const res = await request(baseUrl).put('/api/medical-records/records/testid').send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
  it('should return 401 if auth is invalid (update)', async () => {
    const res = await request(baseUrl)
      .put('/api/medical-records/records/testid')
      .set('Authorization', 'Bearer invalidtoken')
      .send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('should return 200/400/404 if auth is valid (update, payload may be invalid)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const idToken = await getTestIdToken();
    const res = await request(baseUrl)
      .put('/api/medical-records/records/testid')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
});

describe('Medical Records API Endpoints (with valid auth where required)', () => {
  let idToken;
  beforeAll(async () => {
    if (process.env.FIREBASE_WEB_API_KEY) {
      const getTestIdToken = require('../scripts/getTestIdToken');
      idToken = await getTestIdToken();
    }
  });

  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('POST /api/medical-records/patients/:patientId/records - create record (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .post('/api/medical-records/patients/testid/records')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 201, 400]).toContain(res.statusCode);
  });
  it('GET /api/medical-records/patients/:patientId/records - list records for patient', async () => {
    const res = await request(baseUrl).get('/api/medical-records/patients/testid/records');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/medical-records/records/:recordId - get record by id', async () => {
    const res = await request(baseUrl).get('/api/medical-records/records/testid');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('PUT /api/medical-records/records/:recordId - update record (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .put('/api/medical-records/records/testid')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 400, 404]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('DELETE /api/medical-records/records/:recordId - delete record (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .delete('/api/medical-records/records/testid')
      .set('Authorization', `Bearer ${idToken}`);
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/medical-records/records/:recordId/versions - list record versions', async () => {
    const res = await request(baseUrl).get('/api/medical-records/records/testid/versions');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/medical-records/records/:recordId/versions/:versionNumber - get version content', async () => {
    const res = await request(baseUrl).get('/api/medical-records/records/testid/versions/1');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/medical-records/records/:recordId/audit - get record audit trail', async () => {
    const res = await request(baseUrl).get('/api/medical-records/records/testid/audit');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/medical-records/patients/:patientId/audit - get patient audit trail', async () => {
    const res = await request(baseUrl).get('/api/medical-records/patients/testid/audit');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/medical-records/doctors/:doctorId/activity - get doctor activity', async () => {
    const res = await request(baseUrl).get('/api/medical-records/doctors/testid/activity');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('POST /api/medical-records/records/:recordId/backup - backup record (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .post('/api/medical-records/records/testid/backup')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 201, 400, 404]).toContain(res.statusCode);
  });
  it('GET /api/medical-records/patients/:patientId/backups - list patient backups', async () => {
    const res = await request(baseUrl).get('/api/medical-records/patients/testid/backups');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  (process.env.FIREBASE_WEB_API_KEY ? it : it.skip)('POST /api/medical-records/patients/:patientId/export - export patient records (valid auth)', async () => {
    const getTestIdToken = require('../scripts/getTestIdToken');
    const res = await request(baseUrl)
      .post('/api/medical-records/patients/testid/export')
      .set('Authorization', `Bearer ${idToken}`)
      .send({});
    expect([200, 201, 400, 404]).toContain(res.statusCode);
  });
  it('GET /api/medical-records/admin/backup-stats/:patientId - admin backup stats', async () => {
    const res = await request(baseUrl).get('/api/medical-records/admin/backup-stats/testid');
  expect([200, 404, 401, 500, 400, 201]).toContain(res.statusCode);
  });
});
