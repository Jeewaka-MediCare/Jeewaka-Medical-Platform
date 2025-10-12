// Jest + Supertest setup for backend API testing
// Place this in BackEnd/tests/api.test.js


const request = require('supertest');
const baseUrl = 'http://localhost:5000';


describe('API Health Check', () => {
  it('should respond to GET /api/doctor with 200 or 404', async () => {
    const res = await request(baseUrl).get('/api/doctor/');
    expect([200, 404]).toContain(res.statusCode);
  });
});

// Add more describe blocks for each resource (patients, records, etc.)
// Use your manual test checklist as a guide for coverage
