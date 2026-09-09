import mongoose from 'mongoose';
import { config } from './env';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 2000;

export const connectDB = async (retryCount = 0): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // 15 seconds for Atlas primary selection
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`MongoDB connection error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message || error);

    if (retryCount < MAX_RETRIES - 1) {
      const delay = INITIAL_RETRY_DELAY_MS * (retryCount + 1);
      console.log(`Retrying MongoDB connection in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectDB(retryCount + 1);
    } else {
      console.error('Max MongoDB connection attempts reached. Database operations may fail until connection is re-established.');
      // Do not exit process in production to allow Render web service to remain up and retry on subsequent requests
      if (config.NODE_ENV !== 'production') {
        process.exit(1);
      }
    }
  }
};

// Monitor ongoing connection events
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime connection error:', err.message || err);
});
