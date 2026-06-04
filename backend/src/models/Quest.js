const mongoose = require('mongoose');

const QuestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  targetSteps: {
    type: Number,
    required: true
  },
  currentSteps: {
    type: Number,
    default: 0
  },
  rewardName: {
    type: String,
    required: true
  },
  rewardImage: {
    type: String,
    default: ''
  },
  rewardType: {
    type: String,
    enum: ['gear', 'badge'],
    default: 'gear'
  },
  limitedEdition: {
    type: Boolean,
    default: false
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isClaimed: {
    type: Boolean,
    default: false
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update completed state pre-save
QuestSchema.pre('save', function (next) {
  if (this.currentSteps >= this.targetSteps) {
    this.isCompleted = true;
  } else {
    this.isCompleted = false;
  }
  next();
});

module.exports = mongoose.model('Quest', QuestSchema);
