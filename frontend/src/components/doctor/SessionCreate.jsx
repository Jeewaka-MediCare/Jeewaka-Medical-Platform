import React, { useState } from 'react';
import { createSession } from '../../services/sessionService';

export default function SessionCreate({ onCreated, onCancel }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createSession({ title });
      onCreated();
    } catch (err) {
      setError('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create New Session</h3>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Session Title" required />
      <button type="submit" disabled={loading}>Create</button>
      <button type="button" onClick={onCancel}>Cancel</button>
      {error && <div>{error}</div>}
    </form>
  );
}
