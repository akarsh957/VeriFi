import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Route imports
import userRoutes from './routes/userRoutes.js';
import venueRoutes from './routes/venueRoutes.js';
import speedTestRoutes from './routes/speedTestRoutes.js';

// Load env variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/auth', userRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/speedtests', speedTestRoutes);

// Simple home route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the VerifyFi API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
