// Shared in-memory mock store for when MongoDB is disconnected
import bcrypt from 'bcryptjs';

export const mockUsers = [
  {
    _id: 'mock-user-1',
    name: 'Akarsh Developer',
    email: 'akarsh@example.com',
    passwordHash: bcrypt.hashSync('password123', 10)
  }
];

export const mockVenues = [
  {
    _id: 'mock-venue-1',
    name: 'Central Perk Cafe',
    address: '12 Baker St, London NW1 6XE',
    location: {
      type: 'Point',
      coordinates: [-0.09, 51.505]
    },
    placeType: 'Cafe',
    averageDownloadSpeed: 45.2,
    averageUploadSpeed: 12.8,
    reliabilityScore: 85,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mock-venue-2',
    name: 'Grand Plaza Hotel',
    address: '45 Park Ln, London W1K 1PN',
    location: {
      type: 'Point',
      coordinates: [-0.08, 51.515]
    },
    placeType: 'Hotel',
    averageDownloadSpeed: 128.5,
    averageUploadSpeed: 42.1,
    reliabilityScore: 95,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mock-venue-3',
    name: 'WeWork CyberCity',
    address: '100 Bishopsgate, London EC2M 1GT',
    location: {
      type: 'Point',
      coordinates: [-0.10, 51.495]
    },
    placeType: 'Coworking',
    averageDownloadSpeed: 285.0,
    averageUploadSpeed: 95.5,
    reliabilityScore: 98,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockLogs = [
  {
    _id: 'mock-log-1',
    venueId: 'mock-venue-1',
    userId: {
      _id: 'mock-user-1',
      name: 'Akarsh Developer',
      email: 'akarsh@example.com'
    },
    downloadSpeed: 45.2,
    uploadSpeed: 12.8,
    ping: 24,
    timestamp: new Date(),
    createdAt: new Date()
  },
  {
    _id: 'mock-log-2',
    venueId: 'mock-venue-2',
    userId: {
      _id: 'mock-user-1',
      name: 'Akarsh Developer',
      email: 'akarsh@example.com'
    },
    downloadSpeed: 128.5,
    uploadSpeed: 42.1,
    ping: 15,
    timestamp: new Date(),
    createdAt: new Date()
  },
  {
    _id: 'mock-log-3',
    venueId: 'mock-venue-3',
    userId: {
      _id: 'mock-user-1',
      name: 'Akarsh Developer',
      email: 'akarsh@example.com'
    },
    downloadSpeed: 285.0,
    uploadSpeed: 95.5,
    ping: 8,
    timestamp: new Date(),
    createdAt: new Date()
  }
];
