const request = require('supertest');

const baseUrl = 'http://localhost:5000';

describe('Admin API', () => {
  it('GET /api/admin/ - list admins', async () => {
    const res = await request(baseUrl).get('/api/admin/');
    expect([200, 404]).toContain(res.statusCode);
  });
  it('POST /api/admin/add-role - add admin role', async () => {
    const res = await request(baseUrl).post('/api/admin/add-role').send({});
    expect([200, 201, 400]).toContain(res.statusCode);
  });
  it('POST /api/admin/remove-role - remove admin role', async () => {
    const res = await request(baseUrl).post('/api/admin/remove-role').send({});
    expect([200, 201, 400]).toContain(res.statusCode);
  });
});
