import SpeedTestLog from '../models/SpeedTestLog.js';
import Venue from '../models/Venue.js';
import mongoose from 'mongoose';
import { mockVenues, mockLogs, mockUsers } from '../utils/mockStore.js';

const isConnected = () => mongoose.connection.readyState === 1;

// @desc    Create a speed test log
// @route   POST /api/speedtests
// @access  Private
const createSpeedTestLog = async (req, res) => {
  const { venueId, downloadSpeed, uploadSpeed, ping } = req.body;

  if (!venueId || downloadSpeed === undefined || uploadSpeed === undefined || ping === undefined) {
    return res.status(400).json({ message: 'Please provide venueId, downloadSpeed, uploadSpeed, and ping' });
  }

  if (!isConnected()) {
    // Verify venue exists in mock store
    const venue = mockVenues.find(v => v._id === venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Get current user info
    const currentUser = mockUsers.find(u => u._id === req.user._id) || {
      _id: req.user._id,
      name: 'Logged User',
      email: 'user@example.com'
    };

    const newLog = {
      _id: `mock-log-${Date.now()}`,
      venueId,
      userId: {
        _id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email
      },
      downloadSpeed: parseFloat(downloadSpeed),
      uploadSpeed: parseFloat(uploadSpeed),
      ping: parseFloat(ping),
      timestamp: new Date(),
      createdAt: new Date()
    };

    mockLogs.push(newLog);

    // Recalculate venue averages in-memory
    const venueLogs = mockLogs.filter(log => log.venueId === venueId);
    const totalLogs = venueLogs.length;

    const totalDownload = venueLogs.reduce((sum, log) => sum + log.downloadSpeed, 0);
    const totalUpload = venueLogs.reduce((sum, log) => sum + log.uploadSpeed, 0);
    
    // Reliability = % of logs with download speed >= 15 Mbps
    const reliableLogsCount = venueLogs.filter(log => log.downloadSpeed >= 15).length;
    const reliabilityScore = totalLogs > 0 ? Math.round((reliableLogsCount / totalLogs) * 100) : 0;

    venue.averageDownloadSpeed = Math.round((totalDownload / totalLogs) * 10) / 10;
    venue.averageUploadSpeed = Math.round((totalUpload / totalLogs) * 10) / 10;
    venue.reliabilityScore = reliabilityScore;
    venue.updatedAt = new Date();

    return res.status(201).json({
      speedLog: newLog,
      updatedVenue: venue
    });
  }

  try {
    // Verify venue exists
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    const speedLog = await SpeedTestLog.create({
      venueId,
      userId: req.user._id,
      downloadSpeed: parseFloat(downloadSpeed),
      uploadSpeed: parseFloat(uploadSpeed),
      ping: parseFloat(ping)
    });

    // Populate user info for response (without password)
    const populatedLog = await SpeedTestLog.findById(speedLog._id)
      .populate('userId', 'name email');

    // Retrieve the updated venue (which has its averages recalculated via the SpeedTestLog post('save') hook)
    const updatedVenue = await Venue.findById(venueId);

    res.status(201).json({
      speedLog: populatedLog,
      updatedVenue
    });
  } catch (error) {
    console.error('Error creating speed test log:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get speed test logs for a venue
// @route   GET /api/speedtests/venue/:venueId
// @access  Public
const getSpeedTestLogsForVenue = async (req, res) => {
  if (!isConnected()) {
    // Filter mock logs by venueId and sort by timestamp descending
    const filteredLogs = mockLogs
      .filter(log => log.venueId === req.params.venueId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json(filteredLogs);
  }

  try {
    const logs = await SpeedTestLog.find({ venueId: req.params.venueId })
      .populate('userId', 'name email')
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createSpeedTestLog, getSpeedTestLogsForVenue };
