import React from 'react';
import { fireEvent, act } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/customRender';

// Mock React Native Alert before any other imports
const mockAlert = jest.fn();
jest.doMock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: mockAlert,
    },
  };
});

import VideoCallButton from '../../components/VideoCallButton';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Date to ensure consistent timing in tests
let mockCurrentTime = new Date('2024-02-15T09:57:00'); // Default: 3 minutes before appointment start
const originalDate = global.Date;

class MockDate extends originalDate {
  constructor(...args) {
    if (args.length === 0) {
      super(mockCurrentTime);
    } else {
      super(...args);
    }
  }
  
  static now() {
    return mockCurrentTime.getTime();
  }
}

MockDate.UTC = originalDate.UTC;
MockDate.parse = originalDate.parse;

global.Date = MockDate;

// Helper function to set mock time for tests
const setMockTime = (timeString) => {
  mockCurrentTime = new Date(timeString);
};

describe('VideoCallButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    // Reset to default time (3 minutes before appointment)
    setMockTime('2024-02-15T09:57:00');
  });

  const defaultProps = {
    meetingId: 'test-meeting-123',
    sessionId: 'test-session-456',
    slotIndex: 0,
    title: 'Join Video Call',
    disabled: false,
    appointmentDate: '2024-02-15',
    appointmentStartTime: '10:00',
    appointmentEndTime: '10:30'
  };

  it('renders button with default title', async () => {
    const { getByText } = renderWithProviders(
      <VideoCallButton {...defaultProps} />
    );

    expect(getByText('Join Video Call')).toBeTruthy();
  });

  it('navigates to video consultation when pressed with meetingId', () => {
    const { getByText } = renderWithProviders(
      <VideoCallButton {...defaultProps} />
    );

    const button = getByText('Join Video Call');
    fireEvent.press(button);

    expect(mockPush).toHaveBeenCalledWith('/video-consultation/test-meeting-123');
  });

  it('navigates with session and slot parameters when no meetingId', () => {
    const propsWithoutMeetingId = {
      ...defaultProps,
      meetingId: undefined
    };

    const { getByText } = renderWithProviders(
      <VideoCallButton {...propsWithoutMeetingId} />
    );

    const button = getByText('Join Video Call');
    fireEvent.press(button);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/video-consultation/[meetingId]',
      params: {
        meetingId: 'new',
        sessionId: 'test-session-456',
        slotIndex: '0',
        type: 'appointment'
      }
    });
  });

  it('navigates with session only when no meetingId and slotIndex', () => {
    const propsWithoutMeetingIdAndSlot = {
      ...defaultProps,
      meetingId: undefined,
      slotIndex: undefined
    };

    const { getByText } = renderWithProviders(
      <VideoCallButton {...propsWithoutMeetingIdAndSlot} />
    );

    const button = getByText('Join Video Call');
    fireEvent.press(button);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/video-consultation/[meetingId]',
      params: {
        meetingId: 'new',
        sessionId: 'test-session-456',
        type: 'session'
      }
    });
  });

  it('creates new meeting when no parameters provided', () => {
    const minimalProps = {
      title: 'Start New Call'
    };

    const { getByText } = renderWithProviders(
      <VideoCallButton {...minimalProps} />
    );

    const button = getByText('Start New Call');
    fireEvent.press(button);

    expect(mockPush).toHaveBeenCalledWith('/video-consultation/new-meeting');
  });

  it('disables button when explicitly disabled', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
      title: 'Call Ended'
    };

    const { getByText } = renderWithProviders(
      <VideoCallButton {...disabledProps} />
    );

    const button = getByText('Call Ended');
    fireEvent.press(button);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows "Available in X min" when too early to join', async () => {
    // Set current time to be 10 minutes before appointment
    setMockTime('2024-02-15T09:45:00');

    const { getByText } = renderWithProviders(
      <VideoCallButton {...defaultProps} />
    );

    expect(getByText('Available in 10 min')).toBeTruthy();

    // Button should be disabled when showing "Available in X min"
    const button = getByText('Available in 10 min');
    // TouchableOpacity doesn't have disabled prop directly accessible, 
    // but we can check that pressing it doesn't navigate
    fireEvent.press(button);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('allows joining 5 minutes before appointment', async () => {
    // Set current time to be 3 minutes before appointment (within 5-minute window)
    setMockTime('2024-02-15T09:57:00');

    const { getByText } = renderWithProviders(
      <VideoCallButton {...defaultProps} />
    );

    expect(getByText('Join Video Call')).toBeTruthy();

    const button = getByText('Join Video Call');
    fireEvent.press(button);

    expect(mockPush).toHaveBeenCalled();
  });

  it('shows "Appointment Ended" when appointment has ended', async () => {
    // Set current time to be after appointment end time
    setMockTime('2024-02-15T10:35:00');

    const { getByText } = renderWithProviders(
      <VideoCallButton {...defaultProps} />
    );

    expect(getByText('Appointment Ended')).toBeTruthy();

    // Button should be disabled when showing "Appointment Ended"
    const button = getByText('Appointment Ended');
    // TouchableOpacity doesn't have disabled prop directly accessible,
    // but we can check that pressing it doesn't navigate
    fireEvent.press(button);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('allows joining when no timing data provided', () => {
    const propsWithoutTiming = {
      meetingId: 'test-meeting-123',
      title: 'Join Call'
    };

    const { getByText } = renderWithProviders(
      <VideoCallButton {...propsWithoutTiming} />
    );

    expect(getByText('Join Call')).toBeTruthy();

    const button = getByText('Join Call');
    fireEvent.press(button);

    expect(mockPush).toHaveBeenCalledWith('/video-consultation/test-meeting-123');
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };

    const { getByText } = renderWithProviders(
      <VideoCallButton {...defaultProps} style={customStyle} />
    );

    const button = getByText('Join Video Call');
    // Check that button exists with custom styling
    expect(button).toBeTruthy();
  });

  it('handles edge case of appointment starting exactly now', async () => {
    // Set current time to exactly appointment start time
    setMockTime('2024-02-15T10:00:00');

    const { getByText } = renderWithProviders(
      <VideoCallButton {...defaultProps} />
    );

    expect(getByText('Join Video Call')).toBeTruthy();

    const button = getByText('Join Video Call');
    fireEvent.press(button);

    expect(mockPush).toHaveBeenCalled();
  });
});