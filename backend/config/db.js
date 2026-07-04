import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000 // 3 seconds timeout
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`WARNING: Could not connect to MongoDB: ${error.message}`);
    console.warn('Backend is running in fallback IN-MEMORY mock storage mode.');
  }
};

export default connectDB;
