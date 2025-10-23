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

describe('API Service', () => {
  beforeEach(() => {
    // Only clear fetch mock, not all mocks since we need axios.create calls
    global.fetch.mockClear();
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

      const { createMeeting } = require('../../services/api');
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

      expect(result).toEqual('room-123');
    });

    it('handles API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      };

      global.fetch.mockResolvedValue(mockResponse);

      const { createMeeting } = require('../../services/api');

      await expect(createMeeting({ token: mockToken }))
        .rejects
        .toThrow('HTTP error! status: 400');
    });

    it('handles network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const { createMeeting } = require('../../services/api');

      await expect(createMeeting({ token: mockToken }))
        .rejects
        .toThrow('Network error');
    });

    it('sends correct headers and body', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ roomId: 'test-room' })
      };
      global.fetch.mockResolvedValue(mockResponse);

      const { createMeeting } = require('../../services/api');
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

  // Simplified API instance test
  describe('API instance configuration', () => {
    it('creates and exports api instance without errors', () => {
      // Simply verify the module can be imported without errors
      expect(() => {
        const api = require('../../services/api').default;
        expect(api).toBeDefined();
      }).not.toThrow();
    });
  });

  // Test that the module loads and exports expected functions
  describe('Module exports', () => {
    it('exports all expected functions and objects', () => {
      const apiModule = require('../../services/api');
      
      expect(apiModule.default).toBeDefined(); // api instance
      expect(apiModule.getBaseUrl).toBeDefined();
      expect(apiModule.createMeeting).toBeDefined();
      expect(apiModule.token).toBeDefined();
      expect(typeof apiModule.getBaseUrl).toBe('function');
      expect(typeof apiModule.createMeeting).toBe('function');
    });
  });
});