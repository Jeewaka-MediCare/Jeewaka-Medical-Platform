// Session API service for doctor dashboard
import axios from 'axios';

const API_BASE = '/api/sessions';

export const createSession = (data) => axios.post(API_BASE, data);
export const getSessions = () => axios.get(API_BASE);
export const getSessionById = (sessionId) => axios.get(`${API_BASE}/${sessionId}`);
export const updateSession = (sessionId, data) => axios.patch(`${API_BASE}/${sessionId}`, data);
export const deleteSession = (sessionId) => axios.delete(`${API_BASE}/${sessionId}`);

export const addTimeSlot = (sessionId, data) => axios.post(`${API_BASE}/${sessionId}/timeslot`, data);
export const updateTimeSlot = (sessionId, slotIndex, data) => axios.put(`${API_BASE}/${sessionId}/timeslot/${slotIndex}`, data);
export const deleteTimeSlot = (sessionId, slotIndex) => axios.delete(`${API_BASE}/${sessionId}/timeslot/${slotIndex}`);

export const bookAppointment = (sessionId, data) => axios.post(`${API_BASE}/${sessionId}/book`, data);
