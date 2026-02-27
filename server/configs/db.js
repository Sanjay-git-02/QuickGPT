
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const raw = process.env.DB_URL || 'mongodb://localhost:27017';
    // If DB_URL already contains a DB name/path, use it as-is; otherwise append the default DB name
    let uri = raw;
    try {
      const url = new URL(raw);
      // if pathname is '/' or empty, append default DB name
      if (!url.pathname || url.pathname === '/' ) {
        uri = raw.replace(/\/*$/, '') + '/quickgpt';
      }
    } catch (e) {
      // raw may be a mongodb connection string without protocol parsing - fallback to simple check
      if (!raw.includes('/')) {
        uri = raw + '/quickgpt';
      }
    }

    await mongoose.connect(uri);
    mongoose.connection.on('connected', () => console.log('Database Connected'));
  } catch (error) {
    console.error('DB connection error:', error.message);
    throw error;
  }
};

export default connectDB;


