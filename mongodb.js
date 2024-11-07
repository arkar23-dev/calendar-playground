const mongoose = require('mongoose');

// MongoDB URI (replace with your actual MongoDB URI)
const mongoURI = process.env.MONGO_DB_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // Exit process with failure
  }
};


module.exports = connectDB;
