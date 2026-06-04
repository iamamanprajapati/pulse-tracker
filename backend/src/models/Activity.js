const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['run', 'gym', 'swim', 'walk', 'cycle', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: [0, 'Duration cannot be negative']
  },
  steps: {
    type: Number,
    default: 0,
    min: [0, 'Steps cannot be negative']
  },
  calories: {
    type: Number,
    required: true,
    min: [0, 'Calories cannot be negative']
  },
  distance: {
    type: Number, // in kilometers/meters
    default: 0,
    min: [0, 'Distance cannot be negative']
  }
});

module.exports = mongoose.model('Activity', ActivitySchema);
