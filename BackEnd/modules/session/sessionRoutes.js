import express from 'express';
import { createSession , getSessionById , getSessions , updateSession , deleteSession , addTimeSlot , updateTimeSlot , deleteTimeSlot  } from './sessionController.js';

const sessionRouter  = express.Router();


// Create a new session
sessionRouter.post('/',createSession);

// Get all sessions
sessionRouter.get('/', getSessions);

// Get a single session by ID
sessionRouter.get('/:sessionId', getSessionById);

// Update a session
sessionRouter.patch('/:sessionId',updateSession);

// Delete a session
sessionRouter.delete('/:sessionId', deleteSession);

// Add a time slot to a session
sessionRouter.post('/:sessionId/timeslot', addTimeSlot);

// Update a time slot in a session
sessionRouter.put('/:sessionId/timeslot/:slotIndex', updateTimeSlot);

// Delete a time slot from a session
sessionRouter.delete('/:sessionId/timeslot/:slotIndex', deleteTimeSlot);

export default sessionRouter;