// Mock axios
const mockInterceptors = {
  request: {
    use: jest.fn(),
    eject: jest.fn(),
  },
  response: {
    use: jest.fn(),
    eject: jest.fn(),
  },
};

const mockInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  interceptors: mockInterceptors,
  defaults: {
    headers: {
      common: {},
    },
  },
};

const mockAxios = {
  ...mockInstance,
  create: jest.fn(() => mockInstance),
};

module.exports = mockAxios;