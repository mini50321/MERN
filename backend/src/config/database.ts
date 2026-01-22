import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI_ATLAS || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MongoDB URI is not defined in environment variables');
      }
      console.warn('MongoDB URI not found. Server running without database connection.');
      return;
    }

    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('Continuing without database connection in development mode.');
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

