import { Alert } from 'react-native';
import api from '../services/api';

/**
 * Validates if an appointment can be joined based on timing rules
 * @param {string} sessionId - The session ID
 * @param {number} slotIndex - The slot index
 * @returns {Promise<{canJoin: boolean, appointment?: object, session?: object}>}
 */
export const validateAppointmentTiming = async (sessionId, slotIndex) => {
  try {
    // Get the session to check the specific appointment's timing
    const sessionResponse = await api.get(`/api/session/${sessionId}`);
    const session = sessionResponse.data;

    const appointmentIndex = parseInt(slotIndex);
    const appointment = session.timeSlots[appointmentIndex];

    if (!appointment) {
      Alert.alert('Error', 'Appointment not found.');
      return { canJoin: false };
    }

    // Check if appointment is booked and has a patient
    if (!appointment.patientId) {
      Alert.alert('Error', 'This appointment is not booked yet.');
      return { canJoin: false };
    }

    // Validate appointment timing - allow joining only 5 minutes before appointment
    const appointmentDateTime = new Date(`${session.date.split('T')[0]}T${appointment.startTime}`);
    const currentTime = new Date();
    const fiveMinutesBeforeAppointment = new Date(appointmentDateTime.getTime() - 5 * 60 * 1000);

    console.log('Appointment time:', appointmentDateTime);
    console.log('Current time:', currentTime);
    console.log('Can join from:', fiveMinutesBeforeAppointment);

    // Check if current time is before the 5-minute window
    if (currentTime < fiveMinutesBeforeAppointment) {
      const timeUntilJoin = Math.ceil(
        (fiveMinutesBeforeAppointment.getTime() - currentTime.getTime()) / (1000 * 60)
      );
      Alert.alert(
        'Too Early',
        `You can join this video consultation ${timeUntilJoin} minutes before the appointment time (${appointment.startTime}). Please try again later.`
      );
      return { canJoin: false };
    }

    // Check if appointment has already ended
    const appointmentEndTime = new Date(`${session.date.split('T')[0]}T${appointment.endTime}`);
    if (currentTime > appointmentEndTime) {
      Alert.alert(
        'Appointment Ended',
        'This appointment has already ended. You can no longer join the video consultation.'
      );
      return { canJoin: false };
    }

    // All checks passed - can join the appointment
    return { 
      canJoin: true, 
      appointment, 
      session 
    };

  } catch (error) {
    console.error('Error validating appointment timing:', error);
    Alert.alert('Error', 'Failed to validate appointment timing. Please try again.');
    return { canJoin: false };
  }
};

/**
 * Validates if a session can be joined (for session-based video calls)
 * @param {string} sessionId - The session ID
 * @returns {Promise<{canJoin: boolean, session?: object}>}
 */
export const validateSessionTiming = async (sessionId) => {
  try {
    // Get the session to check if it exists and is active
    const sessionResponse = await api.get(`/api/session/${sessionId}`);
    const session = sessionResponse.data;

    if (!session) {
      Alert.alert('Error', 'Session not found.');
      return { canJoin: false };
    }

    // For session-based calls, typically no timing restrictions
    // But you can add custom logic here if needed
    return { 
      canJoin: true, 
      session 
    };

  } catch (error) {
    console.error('Error validating session timing:', error);
    Alert.alert('Error', 'Failed to validate session. Please try again.');
    return { canJoin: false };
  }
};