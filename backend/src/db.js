const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set in .env');

  try {
    await mongoose.connect(uri, {
      dbName: 'indie-ecom',
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      // Mongoose 7 uses sensible defaults; add options if needed
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;