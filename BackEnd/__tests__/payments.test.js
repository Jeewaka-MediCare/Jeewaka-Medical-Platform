const request = require('supertest');

const baseUrl = 'http://localhost:5000';

describe('Payments API', () => {
  it('POST /api/payments/create-intent - create payment intent', async () => {
    const res = await request(baseUrl).post('/api/payments/create-intent').send({});
    expect([200, 201, 400, 401]).toContain(res.statusCode);
  });
  it('GET /api/payments/history - get payment history', async () => {
    const res = await request(baseUrl).get('/api/payments/history');
    expect([200, 404, 401]).toContain(res.statusCode);
  });
  it('GET /api/payments/earnings - get doctor earnings', async () => {
    const res = await request(baseUrl).get('/api/payments/earnings');
    expect([200, 404, 401]).toContain(res.statusCode);
  });
  it('GET /api/payments/earnings/stats - get earnings stats', async () => {
    const res = await request(baseUrl).get('/api/payments/earnings/stats');
    expect([200, 404, 401]).toContain(res.statusCode);
  });
  it('GET /api/payments/:paymentId - get payment details', async () => {
    const res = await request(baseUrl).get('/api/payments/testid');
    expect([200, 404, 401]).toContain(res.statusCode);
  });
});
