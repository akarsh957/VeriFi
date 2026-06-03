import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a venue name'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  placeType: {
    type: String,
    enum: ['Cafe', 'Hotel', 'Coworking'],
    required: [true, 'Please specify place type']
  },
  averageDownloadSpeed: {
    type: Number,
    default: 0
  },
  averageUploadSpeed: {
    type: Number,
    default: 0
  },
  reliabilityScore: {
    type: Number,
    default: 0 // Reliability percentage (0-100%)
  }
}, {
  timestamps: true
});

// Set up 2dsphere index for location field
venueSchema.index({ location: '2dsphere' });

const Venue = mongoose.model('Venue', venueSchema);
export default Venue;
