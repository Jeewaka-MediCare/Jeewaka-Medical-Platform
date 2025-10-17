import { Alert } from 'react-native';

/**
 * Enhanced camera switching logic with comprehensive device detection
 */
export const switchCamera = async (
  getWebcams: () => Promise<any[]>,
  changeWebcam: (deviceId: string) => void,
  isUsingFrontCamera: boolean,
  setIsUsingFrontCamera: (value: boolean) => void
) => {
  try {
    console.log('=== CAMERA SWITCH START ===');
    console.log('Current state - isUsingFrontCamera:', isUsingFrontCamera);

    const webcams = await getWebcams();
    console.log('Available cameras:', webcams);

    if (webcams && webcams.length > 1) {
      // Enhanced camera detection
      console.log('Detailed camera info:');
      webcams.forEach((cam, index) => {
        console.log(`Camera ${index}:`, {
          deviceId: cam.deviceId,
          label: cam.label,
          facingMode: cam.facingMode,
        });
      });

      // Find front and back cameras with multiple detection methods
      const frontCamera = webcams.find(
        (cam) =>
          cam.label?.toLowerCase().includes('front') ||
          cam.label?.toLowerCase().includes('user') ||
          cam.label?.toLowerCase().includes('facing') ||
          cam.label?.toLowerCase().includes('selfie') ||
          cam.facingMode === 'user' ||
          cam.deviceId?.includes('front') ||
          cam.deviceId?.includes('1') // Often front camera is camera 1
      );

      const backCamera = webcams.find(
        (cam) =>
          cam.label?.toLowerCase().includes('back') ||
          cam.label?.toLowerCase().includes('environment') ||
          cam.label?.toLowerCase().includes('rear') ||
          cam.label?.toLowerCase().includes('main') ||
          cam.facingMode === 'environment' ||
          cam.deviceId?.includes('back') ||
          cam.deviceId?.includes('0') // Often back camera is camera 0
      );

      console.log('Front camera found:', frontCamera);
      console.log('Back camera found:', backCamera);

      // Toggle between cameras
      if (frontCamera && backCamera) {
        const targetCamera = isUsingFrontCamera ? backCamera : frontCamera;
        const newCameraType = isUsingFrontCamera ? 'back' : 'front';
        console.log('Target camera:', targetCamera);
        console.log('Switching TO:', newCameraType);

        try {
          changeWebcam(targetCamera.deviceId);
          console.log('changeWebcam call successful');

          setIsUsingFrontCamera(!isUsingFrontCamera);
          console.log('State updated. New state should be:', !isUsingFrontCamera);

          Alert.alert('Camera Switched', `Switched to ${newCameraType} camera`);
        } catch (changeError) {
          console.error('Error in changeWebcam:', changeError);
          Alert.alert('Error', 'Failed to change camera. Please try again.');
        }
      } else {
        // Fallback: cycle through available cameras
        const currentIndex = 0; // You might want to track this
        const nextIndex = (currentIndex + 1) % webcams.length;
        const nextCamera = webcams[nextIndex];

        if (nextCamera?.deviceId) {
          changeWebcam(nextCamera.deviceId);
          Alert.alert('Camera Switched', 'Switched to next available camera');
        }
      }
    } else if (webcams && webcams.length === 1) {
      Alert.alert('Camera Switch', 'Only one camera found on this device.');
    } else {
      Alert.alert('Camera Switch', 'No cameras found on this device.');
    }
  } catch (error) {
    console.error('Error switching camera:', error);
    Alert.alert('Error', 'Unable to switch camera. Please try again.');
  }
};

/**
 * Generate unique participant name based on user info
 */
export const generateParticipantName = (user: any, userRole: string): string => {
  if (user?.name) {
    return `${user.name} (${userRole === 'doctor' ? 'Doctor' : 'Patient'})`;
  }
  return userRole === 'doctor' ? 'Doctor' : 'Patient';
};

/**
 * Validate meeting ID format
 */
export const isValidMeetingId = (meetingId: string): boolean => {
  // Basic validation for meeting ID format (adjust as needed)
  return /^[a-zA-Z0-9-]{4,}$/.test(meetingId);
};

/**
 * Meeting state management helpers
 */
export const meetingStateHelpers = {
  isJoining: (hasJoined: boolean, isJoining: boolean): boolean => {
    return !hasJoined && isJoining;
  },
  
  canJoin: (hasJoined: boolean, isJoining: boolean): boolean => {
    return !hasJoined && !isJoining;
  },
  
  shouldShowControls: (hasJoined: boolean): boolean => {
    return hasJoined;
  }
};

/**
 * Error handling utilities
 */
export const handleMeetingError = (error: any, context: string): void => {
  console.error(`Meeting error in ${context}:`, error);
  
  // Common error messages based on error type
  let userMessage = 'An unexpected error occurred. Please try again.';
  
  if (error?.message?.includes('network')) {
    userMessage = 'Network error. Please check your internet connection.';
  } else if (error?.message?.includes('permission')) {
    userMessage = 'Permission denied. Please allow camera and microphone access.';
  } else if (error?.message?.includes('meeting')) {
    userMessage = 'Failed to join meeting. Please check the meeting ID.';
  }
  
  Alert.alert('Error', userMessage);
};