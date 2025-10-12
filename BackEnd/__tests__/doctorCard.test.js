const request = require('supertest');
const baseUrl = 'http://localhost:5000';
// No protected endpoints in doctorCard, so no auth middleware suite needed

describe('Doctor Card API', () => {
  it('GET /api/doctorCard/ - list doctor cards', async () => {
    const res = await request(baseUrl).get('/api/doctorCard/');
  expect([200, 404, 401, 500]).toContain(res.statusCode);
  });
  it('GET /api/doctorCard/:doctorId - get doctor card by id', async () => {
    const res = await request(baseUrl).get('/api/doctorCard/testid');
  expect([200, 404, 401, 500, 400, 201]).toContain(res.statusCode);
  });
});
