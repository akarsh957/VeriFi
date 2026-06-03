import mongoose from 'mongoose';

const speedTestLogSchema = new mongoose.Schema({
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  downloadSpeed: {
    type: Number, // in Mbps
    required: [true, 'Please add download speed']
  },
  uploadSpeed: {
    type: Number, // in Mbps
    required: [true, 'Please add upload speed']
  },
  ping: {
    type: Number, // in ms
    required: [true, 'Please add ping']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Static method to get average speeds and update Venue
speedTestLogSchema.statics.getAverageStats = async function(venueId) {
  const stats = await this.aggregate([
    {
      $match: { venueId: venueId }
    },
    {
      $group: {
        _id: '$venueId',
        avgDownloadSpeed: { $avg: '$downloadSpeed' },
        avgUploadSpeed: { $avg: '$uploadSpeed' },
        totalTests: { $sum: 1 },
        reliableTests: {
          $sum: {
            $cond: [
              { 
                $and: [ 
                  { $gte: ['$downloadSpeed', 15] }, // 15 Mbps download threshold for reliability
                  { $lte: ['$ping', 100] }          // 100 ms ping threshold for reliability
                ] 
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      const avgDownload = Math.round(stats[0].avgDownloadSpeed * 10) / 10;
      const avgUpload = Math.round(stats[0].avgUploadSpeed * 10) / 10;
      const reliability = Math.round((stats[0].reliableTests / stats[0].totalTests) * 100);

      await mongoose.model('Venue').findByIdAndUpdate(venueId, {
        averageDownloadSpeed: avgDownload,
        averageUploadSpeed: avgUpload,
        reliabilityScore: reliability
      });
    } else {
      await mongoose.model('Venue').findByIdAndUpdate(venueId, {
        averageDownloadSpeed: 0,
        averageUploadSpeed: 0,
        reliabilityScore: 0
      });
    }
  } catch (err) {
    console.error(`Error updating venue stats: ${err}`);
  }
};

// Call getAverageStats after save
speedTestLogSchema.post('save', async function() {
  await this.constructor.getAverageStats(this.venueId);
});

// Call getAverageStats before delete (in case we delete logs)
speedTestLogSchema.post('deleteOne', { document: true, query: false }, async function() {
  await this.constructor.getAverageStats(this.venueId);
});

const SpeedTestLog = mongoose.model('SpeedTestLog', speedTestLogSchema);
export default SpeedTestLog;
