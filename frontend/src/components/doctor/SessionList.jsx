import React, { useEffect, useState } from 'react';
import { getSessions, deleteSession } from '../../services/sessionService';

export default function SessionList({ onSelect, onCreate }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSessions()
      .then(res => setSessions(res.data))
      .catch(err => setError('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    await deleteSession(id);
    setSessions(sessions.filter(s => s._id !== id));
  };

  if (loading) return <div>Loading sessions...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Sessions</h2>
      <button onClick={onCreate}>Create New Session</button>
      <ul>
        {sessions.map(session => (
          <li key={session._id}>
            <button onClick={() => onSelect(session._id)}>{session.title || session._id}</button>
            <button onClick={() => handleDelete(session._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
