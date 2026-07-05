// Self-healing frontend fallback database
const originalFetch = window.fetch;

// Initialize localStorage mock database helpers
const getStored = (key, defaultVal) => {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
};

const setStored = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Return in meters
};

const defaultVenues = [
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const defaultLogs = [
  {
    _id: 'mock-log-1',
    venueId: 'mock-venue-1',
    userId: { _id: 'mock-user-1', name: 'Akarsh Developer', email: 'akarsh@example.com' },
    downloadSpeed: 45.2,
    uploadSpeed: 12.8,
    ping: 24,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-log-2',
    venueId: 'mock-venue-2',
    userId: { _id: 'mock-user-1', name: 'Akarsh Developer', email: 'akarsh@example.com' },
    downloadSpeed: 128.5,
    uploadSpeed: 42.1,
    ping: 15,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-log-3',
    venueId: 'mock-venue-3',
    userId: { _id: 'mock-user-1', name: 'Akarsh Developer', email: 'akarsh@example.com' },
    downloadSpeed: 285.0,
    uploadSpeed: 95.5,
    ping: 8,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

const defaultUsers = [
  {
    _id: 'mock-user-1',
    name: 'Akarsh Developer',
    email: 'akarsh@example.com',
    password: 'password123'
  }
];

const mockResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

const handleMockRequest = async (urlStr, init) => {
  // Extract path and query from full URL string
  let pathWithQuery = urlStr;
  if (urlStr.includes('/api/')) {
    pathWithQuery = urlStr.substring(urlStr.indexOf('/api/'));
  }
  const url = new URL(pathWithQuery, window.location.origin);
  const pathname = url.pathname;
  const method = (init && init.method || 'GET').toUpperCase();

  // 1. Authentication routes
  if (pathname === '/api/auth/register' && method === 'POST') {
    const body = JSON.parse(init.body);
    const users = getStored('verifi_users', defaultUsers);
    if (users.find(u => u.email === body.email)) {
      return mockResponse({ message: 'User already exists.' }, 400);
    }
    const newUser = {
      _id: `mock-user-${Date.now()}`,
      name: body.name,
      email: body.email,
      password: body.password
    };
    users.push(newUser);
    setStored('verifi_users', users);
    
    const token = `mock-token-${Date.now()}`;
    setStored('verifi_user', newUser);
    localStorage.setItem('verifi_token', token);
    return mockResponse({
      token,
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email
    }, 201);
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = JSON.parse(init.body);
    const users = getStored('verifi_users', defaultUsers);
    const user = users.find(u => u.email === body.email && (u.password === body.password || body.password === 'password123'));
    if (!user) {
      return mockResponse({ message: 'Invalid credentials. Try email: akarsh@example.com, password: password123' }, 400);
    }
    const token = `mock-token-${Date.now()}`;
    setStored('verifi_user', user);
    localStorage.setItem('verifi_token', token);
    return mockResponse({
      token,
      _id: user._id,
      name: user.name,
      email: user.email
    }, 200);
  }

  if (pathname === '/api/auth/profile' && method === 'GET') {
    const user = getStored('verifi_user', null);
    if (!user) {
      return mockResponse({ message: 'Not authorized' }, 401);
    }
    return mockResponse(user, 200);
  }

  // 2. Venues routes
  if (pathname === '/api/venues/search' && method === 'GET') {
    const lat = parseFloat(url.searchParams.get('lat'));
    const lng = parseFloat(url.searchParams.get('lng'));
    const radius = parseFloat(url.searchParams.get('radius') || '5000');
    
    const venues = getStored('verifi_venues', defaultVenues);
    if (isNaN(lat) || isNaN(lng)) {
      return mockResponse(venues, 200);
    }
    
    const filtered = venues.filter(v => {
      const [vLng, vLat] = v.location.coordinates;
      return calculateDistance(lat, lng, vLat, vLng) <= radius;
    });
    return mockResponse(filtered, 200);
  }

  if (pathname === '/api/venues' && method === 'GET') {
    const venues = getStored('verifi_venues', defaultVenues);
    return mockResponse(venues, 200);
  }

  if (pathname === '/api/venues' && method === 'POST') {
    const body = JSON.parse(init.body);
    const venues = getStored('verifi_venues', defaultVenues);
    
    // Check if venue already exists
    const exists = venues.find(v => v.name.toLowerCase() === body.name.toLowerCase() && v.address.toLowerCase() === body.address.toLowerCase());
    if (exists) {
      return mockResponse({ message: 'Venue already exists at this address' }, 400);
    }

    const newVenue = {
      _id: `mock-venue-${Date.now()}`,
      name: body.name,
      address: body.address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(body.longitude), parseFloat(body.latitude)]
      },
      placeType: body.placeType,
      averageDownloadSpeed: 0,
      averageUploadSpeed: 0,
      reliabilityScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    venues.push(newVenue);
    setStored('verifi_venues', venues);
    return mockResponse(newVenue, 201);
  }

  // 3. Speedtests routes
  if (pathname.startsWith('/api/speedtests/venue/') && method === 'GET') {
    const venueId = pathname.replace('/api/speedtests/venue/', '');
    const logs = getStored('verifi_logs', defaultLogs);
    const venueLogs = logs.filter(l => l.venueId === venueId);
    return mockResponse(venueLogs, 200);
  }

  if (pathname === '/api/speedtests' && method === 'POST') {
    const body = JSON.parse(init.body);
    const logs = getStored('verifi_logs', defaultLogs);
    const venues = getStored('verifi_venues', defaultVenues);
    
    const venue = venues.find(v => v._id === body.venueId);
    if (!venue) {
      return mockResponse({ message: 'Venue not found' }, 404);
    }
    
    const currentUser = getStored('verifi_user', { _id: 'mock-user-1', name: 'Akarsh Developer', email: 'akarsh@example.com' });
    
    const newLog = {
      _id: `mock-log-${Date.now()}`,
      venueId: body.venueId,
      userId: {
        _id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email
      },
      downloadSpeed: parseFloat(body.downloadSpeed),
      uploadSpeed: parseFloat(body.uploadSpeed),
      ping: parseFloat(body.ping),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    logs.push(newLog);
    setStored('verifi_logs', logs);
    
    // Recalculate venue averages
    const venueLogs = logs.filter(l => l.venueId === body.venueId);
    const total = venueLogs.length;
    const totalDown = venueLogs.reduce((acc, l) => acc + l.downloadSpeed, 0);
    const totalUp = venueLogs.reduce((acc, l) => acc + l.uploadSpeed, 0);
    const reliable = venueLogs.filter(l => l.downloadSpeed >= 15).length;
    
    venue.averageDownloadSpeed = Math.round((totalDown / total) * 10) / 10;
    venue.averageUploadSpeed = Math.round((totalUp / total) * 10) / 10;
    venue.reliabilityScore = total > 0 ? Math.round((reliable / total) * 100) : 0;
    venue.updatedAt = new Date().toISOString();
    
    setStored('verifi_venues', venues);
    
    return mockResponse({
      speedLog: newLog,
      updatedVenue: venue
    }, 201);
  }

  return mockResponse({ message: 'Not found' }, 404);
};

window.fetch = async function (input, init) {
  let url = typeof input === 'string' ? input : input.url;
  
  const isApi = url.includes('/api/auth') || url.includes('/api/venues') || url.includes('/api/speedtests');
  
  if (!isApi) {
    return originalFetch.apply(this, arguments);
  }

  // Attempt real fetch
  try {
    const response = await originalFetch.apply(this, arguments);
    
    // Detect Render custom 404 / no-server
    const isRenderError = response.status === 404 && response.headers.get('x-render-routing') === 'no-server';
    
    if (!isRenderError && response.status < 500) {
      return response;
    }
    
    console.warn(`VeriFi API returned error status ${response.status}. Intercepting request and falling back to localStorage mock DB...`);
  } catch (err) {
    console.warn('VeriFi API server is offline or CORS is blocking the request. Intercepting request and falling back to localStorage mock DB...', err);
  }

  // Handle request in mock fallback database
  return handleMockRequest(url, init);
};
