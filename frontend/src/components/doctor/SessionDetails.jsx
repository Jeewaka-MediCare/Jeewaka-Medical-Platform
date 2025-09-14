import React, { useEffect, useState } from 'react';
import { getSessionById, updateSession, addTimeSlot, updateTimeSlot, deleteTimeSlot } from '../../services/sessionService';

export default function SessionDetails({ sessionId, onBack }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    getSessionById(sessionId)
      .then(res => {
        setSession(res.data);
        setEditTitle(res.data.title || '');
      })
      .catch(() => setError('Failed to load session'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleUpdate = async () => {
    await updateSession(sessionId, { title: editTitle });
    setSession({ ...session, title: editTitle });
  };

  const handleAddTimeSlot = async () => {
    const slot = prompt('Enter new time slot (e.g. 2025-09-14T10:00)');
    if (!slot) return;
    await addTimeSlot(sessionId, { slot });
    setSession({ ...session, timeSlots: [...(session.timeSlots || []), slot] });
  };

  const handleUpdateTimeSlot = async (idx) => {
    const slot = prompt('Update time slot:', session.timeSlots[idx]);
    if (!slot) return;
    await updateTimeSlot(sessionId, idx, { slot });
    const updated = [...session.timeSlots];
    updated[idx] = slot;
    setSession({ ...session, timeSlots: updated });
  };

  const handleDeleteTimeSlot = async (idx) => {
    await deleteTimeSlot(sessionId, idx);
    setSession({ ...session, timeSlots: session.timeSlots.filter((_, i) => i !== idx) });
  };

  if (loading) return <div>Loading session...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <button onClick={onBack}>Back to Sessions</button>
      <h3>Session Details</h3>
      <div>
        <label>Title: <input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></label>
        <button onClick={handleUpdate}>Update</button>
      </div>
      <div>
        <h4>Time Slots</h4>
        <button onClick={handleAddTimeSlot}>Add Time Slot</button>
        <ul>
          {(session.timeSlots || []).map((slot, idx) => (
            <li key={idx}>
              {slot}
              <button onClick={() => handleUpdateTimeSlot(idx)}>Edit</button>
              <button onClick={() => handleDeleteTimeSlot(idx)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
