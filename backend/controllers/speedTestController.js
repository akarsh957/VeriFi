import SpeedTestLog from '../models/SpeedTestLog.js';
import Venue from '../models/Venue.js';

// @desc    Create a speed test log
// @route   POST /api/speedtests
// @access  Private
const createSpeedTestLog = async (req, res) => {
  const { venueId, downloadSpeed, uploadSpeed, ping } = req.body;

  if (!venueId || downloadSpeed === undefined || uploadSpeed === undefined || ping === undefined) {
    return res.status(400).json({ message: 'Please provide venueId, downloadSpeed, uploadSpeed, and ping' });
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
