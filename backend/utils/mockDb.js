import bcrypt from 'bcryptjs';

// In-memory data store with high-fidelity seed data
const users = [];
const venues = [
  {
    _id: 'v1',
    name: 'Ritual Coffee Roasters',
    address: '1026 Valencia St, San Francisco, CA',
    location: { type: 'Point', coordinates: [-122.4214, 37.7533] },
    placeType: 'Cafe',
    averageDownloadSpeed: 48.5,
    averageUploadSpeed: 24.2,
    reliabilityScore: 90,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5)
  },
  {
    _id: 'v2',
    name: 'The Workshop Coworking',
    address: '242 2nd St, San Francisco, CA',
    location: { type: 'Point', coordinates: [-122.3989, 37.7865] },
    placeType: 'Coworking',
    averageDownloadSpeed: 95.0,
    averageUploadSpeed: 82.4,
    reliabilityScore: 100,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3)
  },
  {
    _id: 'v3',
    name: 'Citizen Space SF',
    address: '425 2nd St, San Francisco, CA',
    location: { type: 'Point', coordinates: [-122.3956, 37.7842] },
    placeType: 'Coworking',
    averageDownloadSpeed: 12.4,
    averageUploadSpeed: 8.5,
    reliabilityScore: 40,
    createdAt: new Date(Date.now() - 3600000 * 24 * 10)
  }
];

const logs = [
  {
    _id: 'l1',
    venueId: 'v1',
    userId: 'u1',
    downloadSpeed: 48.5,
    uploadSpeed: 24.2,
    ping: 28,
    timestamp: new Date(Date.now() - 3600000 * 4)
  },
  {
    _id: 'l2',
    venueId: 'v2',
    userId: 'u1',
    downloadSpeed: 95.0,
    uploadSpeed: 82.4,
    ping: 12,
    timestamp: new Date(Date.now() - 3600000 * 2)
  }
];

// Seed a default user to match the log
users.push({
  _id: 'u1',
  name: 'Alex Developer',
  email: 'alex@example.com',
  password: 'hashed_password_placeholder',
  createdAt: new Date()
});

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Haversine formula for mock geospatial search (returns meters)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export class User {
  constructor(data) {
    this._id = data._id || generateId();
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.createdAt = data.createdAt || new Date();
  }

  async matchPassword(enteredPassword) {
    // For seeded user, allow simple password bypass or match if bcrypt
    if (this.password === 'hashed_password_placeholder') {
      return enteredPassword === 'password123';
    }
    return await bcrypt.compare(enteredPassword, this.password);
  }

  static findOne({ email }) {
    const user = users.find(u => u.email === email);
    const result = user ? new User(user) : null;

    const chain = {
      select: function(fields) {
        return this;
      },
      then: function(onSuccess) {
        onSuccess(result);
        return Promise.resolve(result);
      }
    };
    return chain;
  }

  static async findById(id) {
    const user = users.find(u => u._id === id);
    return user ? new User(user) : null;
  }

  static async create({ name, email, password }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
      _id: generateId(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };
    users.push(newUser);
    return new User(newUser);
  }
}

export class Venue {
  constructor(data) {
    this._id = data._id || generateId();
    this.name = data.name;
    this.address = data.address;
    this.location = data.location; // { type: 'Point', coordinates: [lng, lat] }
    this.placeType = data.placeType;
    this.averageDownloadSpeed = data.averageDownloadSpeed || 0;
    this.averageUploadSpeed = data.averageUploadSpeed || 0;
    this.reliabilityScore = data.reliabilityScore || 0;
    this.createdAt = data.createdAt || new Date();
  }

  static async find(query = {}) {
    // Geospatial search: { location: { $near: { $geometry: ... } } }
    if (query?.location?.$near?.$geometry) {
      const [lng, lat] = query.location.$near.$geometry.coordinates;
      const maxDistance = query.location.$near.$maxDistance || 5000;

      return venues
        .map(v => {
          const [vLng, vLat] = v.location.coordinates;
          const distance = calculateDistance(lat, lng, vLat, vLng);
          return { venue: new Venue(v), distance };
        })
        .filter(item => item.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .map(item => item.venue);
    }

    return venues.map(v => new Venue(v));
  }

  static async findById(id) {
    const venue = venues.find(v => v._id === id);
    return venue ? new Venue(venue) : null;
  }

  static async findOne({ name, address }) {
    const venue = venues.find(v => v.name === name && v.address === address);
    return venue ? new Venue(venue) : null;
  }

  static async create(data) {
    const newVenue = {
      _id: generateId(),
      name: data.name,
      address: data.address,
      location: data.location,
      placeType: data.placeType,
      averageDownloadSpeed: 0,
      averageUploadSpeed: 0,
      reliabilityScore: 0,
      createdAt: new Date()
    };
    venues.push(newVenue);
    return new Venue(newVenue);
  }

  static async findByIdAndUpdate(id, updateData) {
    const idx = venues.findIndex(v => v._id === id);
    if (idx !== -1) {
      venues[idx] = { ...venues[idx], ...updateData };
      return new Venue(venues[idx]);
    }
    return null;
  }
}

export class SpeedTestLog {
  constructor(data) {
    this._id = data._id || generateId();
    this.venueId = data.venueId;
    this.userId = data.userId;
    this.downloadSpeed = data.downloadSpeed;
    this.uploadSpeed = data.uploadSpeed;
    this.ping = data.ping;
    this.timestamp = data.timestamp || new Date();
  }

  static async create(data) {
    const newLog = {
      _id: generateId(),
      venueId: data.venueId,
      userId: data.userId,
      downloadSpeed: data.downloadSpeed,
      uploadSpeed: data.uploadSpeed,
      ping: data.ping,
      timestamp: new Date()
    };
    logs.push(newLog);
    
    // Recalculate average stats for the venue
    await SpeedTestLog.recalculateStats(data.venueId);

    // Populate user object for response
    const userObj = users.find(u => u._id === data.userId);
    return new SpeedTestLog({
      ...newLog,
      userId: userObj ? { _id: userObj._id, name: userObj.name, email: userObj.email } : data.userId
    });
  }

  static async recalculateStats(venueId) {
    const venueLogs = logs.filter(l => l.venueId === venueId);
    if (venueLogs.length === 0) {
      await Venue.findByIdAndUpdate(venueId, {
        averageDownloadSpeed: 0,
        averageUploadSpeed: 0,
        reliabilityScore: 0
      });
      return;
    }

    const totalDownload = venueLogs.reduce((sum, l) => sum + l.downloadSpeed, 0);
    const totalUpload = venueLogs.reduce((sum, l) => sum + l.uploadSpeed, 0);
    const totalTests = venueLogs.length;

    const reliableTests = venueLogs.filter(l => l.downloadSpeed >= 15 && l.ping <= 100).length;

    const avgDownload = Math.round((totalDownload / totalTests) * 10) / 10;
    const avgUpload = Math.round((totalUpload / totalTests) * 10) / 10;
    const reliability = Math.round((reliableTests / totalTests) * 100);

    await Venue.findByIdAndUpdate(venueId, {
      averageDownloadSpeed: avgDownload,
      averageUploadSpeed: avgUpload,
      reliabilityScore: reliability
    });
  }

  static find(query = {}) {
    let result = logs.filter(l => l.venueId === query.venueId);
    
    // Mock Mongoose chainable helper
    const chain = {
      populate: function(path, select) {
        if (path === 'userId') {
          result = result.map(l => {
            const userObj = typeof l.userId === 'object' ? l.userId : users.find(u => u._id === l.userId);
            return {
              ...l,
              userId: userObj ? { _id: userObj._id, name: userObj.name, email: userObj.email } : null
            };
          });
        }
        return this;
      },
      sort: function(sortQuery) {
        if (sortQuery.timestamp === -1) {
          result.sort((a, b) => b.timestamp - a.timestamp);
        }
        return this;
      },
      then: function(onSuccess) {
        const mappedLogs = result.map(l => new SpeedTestLog(l));
        onSuccess(mappedLogs);
        return Promise.resolve(mappedLogs);
      }
    };
    
    return chain;
  }
}
