import Venue from '../models/Venue.js';

// @desc    Get all venues
// @route   GET /api/venues
// @access  Public
const getVenues = async (req, res) => {
  try {
    const venues = await Venue.find({});
    res.json(venues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get venue by ID
// @route   GET /api/venues/:id
// @access  Public
const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (venue) {
      res.json(venue);
    } else {
      res.status(404).json({ message: 'Venue not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new venue
// @route   POST /api/venues
// @access  Private
const createVenue = async (req, res) => {
  const { name, address, latitude, longitude, placeType } = req.body;

  if (!name || !address || !latitude || !longitude || !placeType) {
    return res.status(400).json({ message: 'All fields are required (name, address, latitude, longitude, placeType)' });
  }

  try {
    const venueExists = await Venue.findOne({ name, address });
    if (venueExists) {
      return res.status(400).json({ message: 'Venue already exists at this address' });
    }

    const venue = await Venue.create({
      name,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      placeType
    });

    res.status(201).json(venue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get venues within a radius of coordinates
// @route   GET /api/venues/search
// @access  Public
const searchVenues = async (req, res) => {
  const { lat, lng, radius } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Please provide latitude (lat) and longitude (lng) query parameters.' });
  }

  try {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistanceInMeters = radius ? parseFloat(radius) : 5000; // default 5km (5000m)

    const venues = await Venue.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistanceInMeters
        }
      }
    });

    res.json(venues);
  } catch (error) {
    console.error('Geospatial search error:', error);
    res.status(500).json({ message: error.message });
  }
};

export { getVenues, getVenueById, createVenue, searchVenues };
