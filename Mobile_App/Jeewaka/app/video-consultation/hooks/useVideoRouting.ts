import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createMeeting, token } from '../../../services/api';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import { generateParticipantName, handleMeetingError } from '../utils/videoMeetingHelpers';

interface VideoRoutingState {
  meetingId: string | null;
  loading: boolean;
}

export function useVideoRouting(urlMeetingId: string | string[] | undefined) {
  // Don't set "new" or "new-meeting" as initial meetingId, keep it null until we have a real ID
  const initialMeetingId = urlMeetingId && 
                          typeof urlMeetingId === 'string' && 
                          urlMeetingId !== 'new' && 
                          urlMeetingId !== 'new-meeting' 
                          ? urlMeetingId 
                          : null;
  
  const [meetingId, setMeetingId] = useState<string | null>(initialMeetingId);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, userRole } = useAuthStore();

  const getMeetingId = useCallback(async (id: string | null) => {
    try {
      setLoading(true);
      // Create a new meeting if id is null or "new"
      const newMeetingId = id == null || id === 'new' ? await createMeeting({ token }) : id;
      
      if (!newMeetingId) {
        throw new Error('Failed to create meeting ID');
      }
      
      setMeetingId(newMeetingId);

      // Note: URL updates are handled by the calling component when needed
      // This prevents unnecessary double navigation during appointment flows
    } catch (error) {
      console.error('Error creating meeting:', error);
      handleMeetingError(error, 'creating meeting');
      // Navigate back on error to prevent stuck state
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Handle session-based video consultation (uses session.meetingId)
  const handleSessionMeeting = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);

      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      // For SESSION-level meetings, check session.meetingId (NOT timeSlots)
      const sessionResponse = await api.get(`/api/session/${sessionId}`);
      const session = sessionResponse.data;

      if (!session) {
        throw new Error('Session not found');
      }

      let meetingId = session.meetingId; // Session-level meetingId

      if (!meetingId) {
        // Create a valid VideoSDK meeting ID through the API
        meetingId = await createMeeting({ token });

        if (!meetingId) {
          throw new Error('Failed to create VideoSDK meeting room');
        }

        // Update the session with the new meeting ID (backend will handle race conditions)
        const response = await api.patch(`/api/session/${sessionId}/meeting-id`, {
          meetingId: meetingId,
        });
        
        if (!response.data || !response.data.success) {
          throw new Error('Failed to update session with meeting ID');
        }
        
        // Use the meeting ID from the updated session (backend returns the full session)
        meetingId = response.data.session.meetingId || meetingId;
      }

      if (!meetingId) {
        throw new Error('No meeting ID available');
      }

      // Set the meeting ID directly instead of navigating again
      setMeetingId(meetingId);
    } catch (error) {
      console.error('Error handling session meeting:', error);
      handleMeetingError(error, 'handling session meeting');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Handle appointment-based video consultation (uses timeSlots[index].meetingId)
  const handleAppointmentMeeting = useCallback(async (sessionId: string, slotIndex: string) => {
    try {
      setLoading(true);

      if (!sessionId || !slotIndex) {
        throw new Error('Session ID and slot index are required');
      }

      // Get the session to check the specific appointment's meeting ID
      const sessionResponse = await api.get(`/api/session/${sessionId}`);
      const session = sessionResponse.data;

      if (!session) {
        throw new Error('Session not found');
      }

      const appointmentIndex = parseInt(slotIndex);
      if (isNaN(appointmentIndex)) {
        throw new Error('Invalid slot index');
      }

      const appointment = session.timeSlots[appointmentIndex];

      if (!appointment) {
        Alert.alert('Error', 'Appointment not found.');
        router.back();
        return;
      }

      // Check if appointment is booked and has a patient
      if (!appointment.patientId) {
        Alert.alert('Error', 'This appointment is not booked yet.');
        router.back();
        return;
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
          `You can join this video consultation in ${timeUntilJoin} minutes. ( 5 minutes before the appointment time (${appointment.startTime})). Please try again later.`
        );
        router.back();
        return;
      }

      // Check if appointment has already ended
      const appointmentEndTime = new Date(`${session.date.split('T')[0]}T${appointment.endTime}`);
      if (currentTime > appointmentEndTime) {
        Alert.alert(
          'Appointment Ended',
          'This appointment has already ended. You can no longer join the video consultation.'
        );
        router.back();
        return;
      }

      // ✅ ALWAYS check database first before creating new meeting ID
      let meetingId;
      
      try {
        // Step 1: Get fresh session data to check for existing timeSlot meetingId
        console.log(`🔍 Checking for existing timeSlot[${appointmentIndex}].meetingId in database...`);
        const checkResponse = await api.get(`/api/session/${sessionId}`);
        const latestSession = checkResponse.data;
        const latestAppointment = latestSession?.timeSlots?.[appointmentIndex];
        
        console.log(`📊 Session-level meetingId (should be ignored):`, latestSession?.meetingId);
        console.log(`📊 TimeSlot[${appointmentIndex}] meetingId:`, latestAppointment?.meetingId);
        
        if (latestAppointment?.meetingId) {
          // ✅ TimeSlot meeting ID exists in database - use it directly
          meetingId = latestAppointment.meetingId;
          console.log(`✅ Found existing timeSlot meetingId in database: ${meetingId}`);
        } else {
          // ❌ No timeSlot meetingId in database - create new one
          console.log(`❌ No timeSlot[${appointmentIndex}].meetingId found. Creating new VideoSDK room...`);
          
          // 🔄 Small delay to check if another participant is already creating one
          console.log(`⏳ Waiting 1 second to check for concurrent meeting creation...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Re-check database after delay
          const recheckResponse = await api.get(`/api/session/${sessionId}`);
          const recheckSession = recheckResponse.data;
          const recheckAppointment = recheckSession?.timeSlots?.[appointmentIndex];
          
          if (recheckAppointment?.meetingId) {
            console.log(`✅ Another participant created meeting ID during delay: ${recheckAppointment.meetingId}`);
            meetingId = recheckAppointment.meetingId;
          } else {
            // Still no meeting ID, proceed with creation
            const newMeetingId = await createMeeting({ token });

            if (!newMeetingId) {
              throw new Error('Failed to create VideoSDK meeting room');
            }

            console.log(`🆔 Created new VideoSDK meeting ID: ${newMeetingId}`);

            // Step 2: Try to store the new meeting ID atomically
            const response = await api.patch(`/api/session/${sessionId}/appointment/${slotIndex}/meeting-id`, {
              meetingId: newMeetingId,
            });
            
            if (!response.data || !response.data.success) {
              throw new Error('Failed to store meeting ID for appointment');
            }
            
            // ✅ Use the meeting ID returned by backend (handles race conditions)
            meetingId = response.data.meetingId;
            
            if (meetingId === newMeetingId) {
              console.log(`✅ Successfully stored new meeting ID: ${meetingId}`);
            } else {
              console.log(`⚠️ Race condition handled - using existing meeting ID: ${meetingId} instead of created ID: ${newMeetingId}`);
            }

            // 🔄 CRITICAL: Double-check the database to ensure meeting ID is properly stored
            console.log(`🔄 Double-checking database for stored meeting ID...`);
            const verifyResponse = await api.get(`/api/session/${sessionId}`);
            const verifiedSession = verifyResponse.data;
            const verifiedAppointment = verifiedSession?.timeSlots?.[appointmentIndex];
            
            if (verifiedAppointment?.meetingId && verifiedAppointment.meetingId !== meetingId) {
              console.log(`⚠️ Meeting ID mismatch! Using database value: ${verifiedAppointment.meetingId} instead of response: ${meetingId}`);
              meetingId = verifiedAppointment.meetingId;
            } else if (verifiedAppointment?.meetingId) {
              console.log(`✅ Database verification successful: ${verifiedAppointment.meetingId}`);
            } else {
              console.log(`❌ WARNING: Meeting ID not found in database after storage!`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error managing meeting ID:', error);
        throw error;
      }

      if (!meetingId) {
        throw new Error('No meeting ID available for appointment');
      }

      // Set the meeting ID directly instead of navigating again
      setMeetingId(meetingId);
    } catch (error) {
      console.error('Error handling appointment meeting:', error);
      handleMeetingError(error, 'handling appointment meeting');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Auto-join if meetingId is provided in URL
  // NOTE: Do NOT auto-create meetings for "new" - let the parent component handle appointment/session flows
  useEffect(() => {
    if (urlMeetingId && typeof urlMeetingId === 'string' && urlMeetingId !== 'new') {
      // Only set meeting ID for actual meeting IDs, not "new"
      setMeetingId(urlMeetingId);
      console.log(`🔗 Using meeting ID from URL: ${urlMeetingId}`);
    }
  }, [urlMeetingId]);

  // Generate unique participant name based on user info
  const getParticipantName = useCallback(() => {
    return generateParticipantName(user, userRole);
  }, [user, userRole]);

  return {
    meetingId,
    loading,
    getMeetingId,
    handleSessionMeeting,
    handleAppointmentMeeting,
    getParticipantName,
  };
}