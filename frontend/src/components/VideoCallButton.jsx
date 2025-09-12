import React from 'react';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

export function VideoCallButton({ 
  sessionId, 
  slotIndex, 
  className, 
  children = "Join Video Call" 
}) {
  const handleJoinVideoCall = async () => {
    try {
      // Create or get appointment-specific meeting ID
      const response = await fetch(`/api/session/${sessionId}/appointment/${slotIndex}/meeting-id`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: `meeting-${sessionId}-${slotIndex}-${Date.now()}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        const meetingId = data.session.timeSlots[slotIndex].meetingId;
        
        // For now, open VideoSDK meeting URL (this would be replaced with proper integration)
        const videoCallUrl = `https://app.videosdk.live/meeting/${meetingId}`;
        window.open(videoCallUrl, '_blank');
      } else {
        alert('Failed to start video call. Please try again.');
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Failed to start video call. Please try again.');
    }
  };

  return (
    <Button 
      onClick={handleJoinVideoCall}
      className={className}
      variant="default"
    >
      <Video className="h-4 w-4 mr-2" />
      {children}
    </Button>
  );
}
