const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  photoUrl: {
    type: String,
    default: ''
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  dailyStepGoal: {
    type: Number,
    default: 10000
  },
  lifetimeSteps: {
    type: Number,
    default: 0
  },
  lifetimeKilometers: {
    type: Number,
    default: 0
  },
  lifetimeCalories: {
    type: Number,
    default: 0
  },
  todaySteps: {
    type: Number,
    default: 0
  },
  todayCalories: {
    type: Number,
    default: 0
  },
  lastSyncDate: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'Athlete'
  },
  joinedDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
