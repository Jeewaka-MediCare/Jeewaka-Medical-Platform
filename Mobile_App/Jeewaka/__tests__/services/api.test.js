import { auth } from '../../config/firebase';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null
  }
}));

// Mock Constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {}
    }
  }
}));

// Mock global fetch
global.fetch = jest.fn();

// Set up axios.create mock before importing api module
const mockInterceptors = {
  request: {
    use: jest.fn()
  },
  response: {
    use: jest.fn()
  }
};

const mockAxiosInstance = {
  interceptors: mockInterceptors
};

axios.create.mockReturnValue(mockAxiosInstance);

describe('API Service', () => {
  let api, createMeeting, getBaseUrl;

  beforeAll(() => {
    // Force the module to be loaded after mocks are set up
    delete require.cache[require.resolve('../../services/api')];
    const apiModule = require('../../services/api');
    api = apiModule.default;
    createMeeting = apiModule.createMeeting;
    getBaseUrl = apiModule.getBaseUrl;
  });

  beforeEach(() => {
    // Don't clear all mocks here since we need the interceptor setup
    // jest.clearAllMocks();
    // Reset auth state
    auth.currentUser = null;
  });

  describe('getBaseUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('uses environment variable when available', () => {
      process.env.EXPO_PUBLIC_BACKEND_URL = 'http://localhost:3000';
      
      // Re-import to get the updated environment
      const { getBaseUrl } = require('../../services/api');
      const baseUrl = getBaseUrl();
      
      expect(baseUrl).toBe('http://localhost:3000');
    });

    it('falls back to default URL when no environment variable', () => {
      delete process.env.EXPO_PUBLIC_BACKEND_URL;
      
      const { getBaseUrl } = require('../../services/api');
      const baseUrl = getBaseUrl();
      
      expect(baseUrl).toBe('http://13.53.53.29:5000');
    });
  });

  describe('Request Interceptor', () => {
    beforeEach(() => {
      // Reset auth state but don't clear mock calls - we need them to test the interceptors
      auth.currentUser = null;
    });

    it('adds authorization header when user is authenticated', async () => {
      const mockToken = 'mock-firebase-token';
      const mockUser = {
        getIdToken: jest.fn().mockResolvedValue(mockToken)
      };
      
      auth.currentUser = mockUser;

      // Check if the interceptors were actually registered
      expect(mockInterceptors.request.use).toHaveBeenCalled();
      
      // Get the request interceptor function that was registered during module import
      const requestInterceptor = mockInterceptors.request.use.mock.calls[0][0];
      
      const mockConfig = {
        method: 'GET',
        url: '/api/test',
        baseURL: 'http://localhost',
        headers: {}
      };

      const result = await requestInterceptor(mockConfig);

      expect(mockUser.getIdToken).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('continues without auth header when user is not authenticated', async () => {
      auth.currentUser = null;

      const requestInterceptor = mockInterceptors.request.use.mock.calls[0][0];
      
      const mockConfig = {
        method: 'GET',
        url: '/api/test',
        baseURL: 'http://localhost',
        headers: {}
      };

      const result = await requestInterceptor(mockConfig);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('handles token retrieval errors gracefully', async () => {
      const mockUser = {
        getIdToken: jest.fn().mockRejectedValue(new Error('Token error'))
      };
      
      auth.currentUser = mockUser;

      const requestInterceptor = mockInterceptors.request.use.mock.calls[0][0];
      
      const mockConfig = {
        method: 'GET',
        url: '/api/test',
        baseURL: 'http://localhost',
        headers: {}
      };

      const result = await requestInterceptor(mockConfig);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('handles successful responses', () => {
      // Check if the interceptors were actually registered
      expect(mockInterceptors.response.use).toHaveBeenCalled();
      
      const responseInterceptor = mockInterceptors.response.use.mock.calls[0][0];
      
      const mockResponse = {
        status: 200,
        config: { url: '/api/test' },
        data: { success: true }
      };

      const result = responseInterceptor(mockResponse);

      expect(result).toBe(mockResponse);
    });

    it('handles 404 errors for admin verification silently', () => {
      const errorInterceptor = mockInterceptors.response.use.mock.calls[0][1];
      
      const mockError = {
        response: {
          status: 404
        },
        config: {
          url: '/api/admin-verification/test'
        }
      };

      expect(() => errorInterceptor(mockError)).rejects.toBe(mockError);
    });

    it('handles 401 authentication errors', () => {
      const errorInterceptor = mockInterceptors.response.use.mock.calls[0][1];
      
      const mockError = {
        response: {
          status: 401,
          data: { error: 'Unauthorized' }
        },
        config: {
          url: '/api/protected'
        },
        message: 'Request failed with status code 401'
      };

      expect(() => errorInterceptor(mockError)).rejects.toBe(mockError);
    });

    it('handles network errors without response', () => {
      const errorInterceptor = mockInterceptors.response.use.mock.calls[0][1];
      
      const mockError = {
        message: 'Network Error'
      };

      expect(() => errorInterceptor(mockError)).rejects.toBe(mockError);
    });
  });

  describe('createMeeting', () => {
    const mockToken = 'mock-videosdk-token';

    beforeEach(() => {
      global.fetch.mockClear();
    });

    it('creates meeting successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          roomId: 'room-123'
        })
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await createMeeting({ token: mockToken });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.videosdk.live/v2/rooms',
        {
          method: 'POST',
          headers: {
            authorization: `${mockToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      );

      expect(result).toEqual({ roomId: 'room-123' });
    });

    it('handles API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      };

      global.fetch.mockResolvedValue(mockResponse);

      await expect(createMeeting({ token: mockToken }))
        .rejects
        .toThrow('HTTP error! status: 400');
    });

    it('handles network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(createMeeting({ token: mockToken }))
        .rejects
        .toThrow('Network error');
    });

    it('sends correct headers and body', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ roomId: 'room-123' })
      };

      global.fetch.mockResolvedValue(mockResponse);

      await createMeeting({ token: mockToken });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.videosdk.live/v2/rooms',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            authorization: mockToken,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({})
        })
      );
    });
  });

  describe('API instance configuration', () => {
    it('creates axios instance with correct baseURL', () => {
      // Check if axios.create was called during module import
      expect(axios.create).toHaveBeenCalled();
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://13.53.53.29:5000'
      });
    });
  });
});