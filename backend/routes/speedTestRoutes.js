import express from 'express';
import { createSpeedTestLog, getSpeedTestLogsForVenue } from '../controllers/speedTestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createSpeedTestLog);
router.get('/venue/:venueId', getSpeedTestLogsForVenue);

export default router;
