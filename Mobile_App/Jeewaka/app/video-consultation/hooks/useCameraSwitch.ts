import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export function useCameraSwitch(getWebcams: () => Promise<any[]>, changeWebcam: (deviceId: string) => void) {
  const [isUsingFrontCamera, setIsUsingFrontCamera] = useState(false);

  const handleSwitchCamera = useCallback(async () => {
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
  }, [getWebcams, changeWebcam, isUsingFrontCamera]);

  return {
    isUsingFrontCamera,
    handleSwitchCamera,
  };
}