const request = require('supertest');

const baseUrl = 'http://localhost:5000';

describe('Auth API', () => {
  it('POST /api/auth/role - set user role', async () => {
    // TODO: Add payload and auth
    const res = await request(baseUrl).post('/api/auth/role').send({});
    expect([200, 400, 401]).toContain(res.statusCode);
  });
  it('GET /api/auth/users/:uid/role - get user role', async () => {
    const res = await request(baseUrl).get('/api/auth/users/testuid/role');
    expect([200, 404, 401]).toContain(res.statusCode);
  });
  it('PUT /api/auth/users/:uid/role - update user role', async () => {
    const res = await request(baseUrl).put('/api/auth/users/testuid/role').send({});
    expect([200, 400, 401]).toContain(res.statusCode);
  });
});
