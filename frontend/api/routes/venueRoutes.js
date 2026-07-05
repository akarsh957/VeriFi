import express from 'express';
import { getVenues, getVenueById, createVenue, searchVenues } from '../controllers/venueController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Geospatial search must be defined before the generic ID route to prevent routing conflicts
router.get('/search', searchVenues);

router.route('/')
  .get(getVenues)
  .post(protect, createVenue);

router.get('/:id', getVenueById);

export default router;
