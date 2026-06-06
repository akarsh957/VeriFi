import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/verifyfi';

    // If using the default local URI, check if it's reachable; if not, spin up memory server fallback
    if (!process.env.MONGODB_URI) {
      try {
        // Try connecting to local MongoDB with a short timeout (2000ms)
        const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        console.log(`MongoDB Connected (Local): ${conn.connection.host}`);
        return;
      } catch (err) {
        console.warn('Local MongoDB connection refused. Initializing MongoMemoryServer fallback...');
        const mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
