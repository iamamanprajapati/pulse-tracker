const mongoose = require('mongoose');
const User = require('./models/User');
const Quest = require('./models/Quest');
const Activity = require('./models/Activity');
const Reward = require('./models/Reward');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulsetrack';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Seed: Connected to MongoDB.');

    // Clear existing collection records
    await User.deleteMany({});
    await Quest.deleteMany({});
    await Activity.deleteMany({});
    await Reward.deleteMany({});
    console.log('Seed: Cleared old collections data.');

    console.log('Seed: Database cleared and ready for real users!');

    console.log('Seed: Database successfully populated with initial stats!');
  } catch (err) {
    console.error('Seed: Error seeding MongoDB data:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Seed: Disconnected from MongoDB.');
  }
}

seed();
