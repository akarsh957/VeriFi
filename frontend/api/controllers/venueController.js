import Venue from '../models/Venue.js';
import mongoose from 'mongoose';
import { mockVenues } from '../utils/mockStore.js';

const isConnected = () => mongoose.connection.readyState === 1;

// Haversine formula for mock geospatial search
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// @desc    Get all venues
// @route   GET /api/venues
// @access  Public
const getVenues = async (req, res) => {
  if (!isConnected()) {
    return res.json(mockVenues);
  }

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
  if (!isConnected()) {
    const venue = mockVenues.find(v => v._id === req.params.id);
    if (venue) {
      return res.json(venue);
    } else {
      return res.status(404).json({ message: 'Venue not found' });
    }
  }

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

  if (!isConnected()) {
    const venueExists = mockVenues.find(v => v.name.toLowerCase() === name.toLowerCase() && v.address.toLowerCase() === address.toLowerCase());
    if (venueExists) {
      return res.status(400).json({ message: 'Venue already exists at this address' });
    }

    const newVenue = {
      _id: `mock-venue-${Date.now()}`,
      name,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      placeType,
      averageDownloadSpeed: 0,
      averageUploadSpeed: 0,
      reliabilityScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockVenues.push(newVenue);
    return res.status(201).json(newVenue);
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

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const maxDistanceInMeters = radius ? parseFloat(radius) : 5000; // default 5km (5000m)

  if (!isConnected()) {
    // In-memory geospatial search filter
    const maxDistanceInKm = maxDistanceInMeters / 1000;
    const results = mockVenues.filter(venue => {
      const [vLng, vLat] = venue.location.coordinates;
      const dist = calculateDistance(latitude, longitude, vLat, vLng);
      return dist <= maxDistanceInKm;
    });

    return res.json(results);
  }

  try {
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
