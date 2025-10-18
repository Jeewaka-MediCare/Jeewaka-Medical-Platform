import { paymentService } from '../../services/paymentService';
import api from '../../services/api';
import { auth } from '../../config/firebase';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn()
  }
}));

describe('paymentService', () => {
  const mockUser = {
    uid: 'test-user-123',
    getIdToken: jest.fn().mockResolvedValue('mock-token')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    api.post = jest.fn();
    api.get = jest.fn();
    auth.currentUser = mockUser;
  });

  describe('createPaymentIntent', () => {
    const mockPaymentData = {
      amount: 150,
      currency: 'LKR',
      sessionId: 'session-123',
      slotIndex: 0,
      doctorId: 'doctor-456'
    };

    it('creates payment intent successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          clientSecret: 'pi_test_client_secret',
          paymentIntentId: 'pi_test_123'
        }
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await paymentService.createPaymentIntent(mockPaymentData);

      expect(api.post).toHaveBeenCalledWith('/api/payments/create-intent', mockPaymentData);
      expect(result).toEqual(mockResponse.data);
    });

    it('throws error when user is not authenticated', async () => {
      auth.currentUser = null;

      await expect(paymentService.createPaymentIntent(mockPaymentData))
        .rejects
        .toThrow('Authentication required for payment processing');

      expect(api.post).not.toHaveBeenCalled();
    });

    it('handles API error gracefully', async () => {
      const mockError = new Error('Network error');
      mockError.response = {
        data: { error: 'Payment processing failed' }
      };

      api.post.mockRejectedValue(mockError);

      await expect(paymentService.createPaymentIntent(mockPaymentData))
        .rejects
        .toThrow('Network error');

      expect(api.post).toHaveBeenCalledWith('/api/payments/create-intent', mockPaymentData);
    });
  });

  describe('handlePaymentSuccess', () => {
    const mockSessionId = 'session-123';
    const mockSlotIndex = 0;
    const mockPaymentIntentId = 'pi_test_123';

    it('handles payment success and creates booking', async () => {
      const mockResponse = {
        data: {
          success: true,
          booking: {
            id: 'booking-123',
            status: 'confirmed'
          }
        }
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await paymentService.handlePaymentSuccess(
        mockSessionId,
        mockPaymentIntentId,
        mockSlotIndex
      );

      expect(api.post).toHaveBeenCalledWith(`/api/session/${mockSessionId}/book`, {
        slotIndex: mockSlotIndex,
        paymentIntentId: mockPaymentIntentId
      });
      expect(result).toEqual({
        success: true,
        message: "Appointment booked successfully!",
        data: mockResponse.data,
        paymentIntentId: mockPaymentIntentId,
        sessionId: mockSessionId,
        slotIndex: mockSlotIndex,
      });
    });

    it('throws error when user is not authenticated', async () => {
      auth.currentUser = null;
      
      // Mock API to reject with authentication error
      api.post.mockRejectedValue(new Error('Failed to book appointment. Please contact support.'));

      await expect(paymentService.handlePaymentSuccess(
        mockSessionId,
        mockPaymentIntentId,
        mockSlotIndex
      )).rejects.toThrow('Failed to book appointment. Please contact support.');
    });
  });

  describe('getPaymentHistory', () => {
    it('fetches payment history successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          payments: [
            {
              id: 'payment-1',
              amount: 150,
              status: 'completed',
              date: '2024-01-01'
            }
          ]
        }
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await paymentService.getPaymentHistory();

      expect(api.get).toHaveBeenCalledWith('/api/payments/history');
      expect(result).toEqual(mockResponse.data);
    });

    it('handles empty payment history', async () => {
      const mockResponse = {
        data: {
          success: true,
          payments: []
        }
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await paymentService.getPaymentHistory();

      expect(result.payments).toEqual([]);
    });

    it('throws error when user is not authenticated', async () => {
      auth.currentUser = null;

      await expect(paymentService.getPaymentHistory())
        .rejects
        .toThrow('Authentication required');

      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentDetails', () => {
    const mockPaymentId = 'payment-123';

    it('fetches payment details successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          payment: {
            id: mockPaymentId,
            amount: 150,
            status: 'completed',
            doctorName: 'Dr. John Smith',
            appointmentDate: '2024-01-01'
          }
        }
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await paymentService.getPaymentDetails(mockPaymentId);

      expect(api.get).toHaveBeenCalledWith(`/api/payments/${mockPaymentId}`);
      expect(result).toEqual(mockResponse.data);
    });

    it('handles non-existent payment', async () => {
      const mockError = new Error('Payment not found');
      mockError.response = { status: 404 };

      api.get.mockRejectedValue(mockError);

      await expect(paymentService.getPaymentDetails(mockPaymentId))
        .rejects
        .toThrow('Payment not found');
    });
  });

  describe('waitForAuth', () => {
    it('resolves immediately when user is already authenticated', async () => {
      // User is already set in beforeEach
      const result = await paymentService.waitForAuth?.(1000);
      expect(result).toBe(true);
    });

    it('waits for authentication state change', async () => {
      auth.currentUser = null;
      
      // Mock onAuthStateChanged to simulate user login
      const mockUnsubscribe = jest.fn();
      auth.onAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => {
          auth.currentUser = mockUser;
          callback(mockUser);
        }, 100);
        return mockUnsubscribe;
      });

      const result = await paymentService.waitForAuth?.(1000);
      expect(result).toBe(true);
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('times out when authentication takes too long', async () => {
      auth.currentUser = null;
      auth.onAuthStateChanged.mockImplementation(() => jest.fn());

      const result = await paymentService.waitForAuth?.(100);
      expect(result).toBe(false);
    });
  });
});