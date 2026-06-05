const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Quest = require('../models/Quest');
const auth = require('../middleware/auth');

// GET /api/activities
router.get('/', auth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const query = Activity.find({ user: req.user.id }).sort({ timestamp: -1 });
    if (limit > 0) {
      query.limit(limit);
    }
    const activities = await query;
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/activities
router.post(
  '/',
  auth,
  [
    body('type').isIn(['run', 'gym', 'swim', 'walk', 'cycle', 'other']).withMessage('Invalid activity type'),
    body('title').trim().notEmpty().withMessage('Activity title is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
    body('calories').isInt({ min: 0 }).withMessage('Calories cannot be negative'),
    body('steps').optional().isInt({ min: 0 }).withMessage('Steps cannot be negative'),
    body('distance').optional().isFloat({ min: 0 }).withMessage('Distance cannot be negative')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, title, duration, calories, steps = 0, distance = 0 } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Create new activity
      const activity = new Activity({
        user: user._id,
        type,
        title,
        duration,
        calories,
        steps,
        distance,
        timestamp: new Date()
      });
      await activity.save();

      // Update user lifetime metrics
      user.lifetimeSteps += steps;
      user.lifetimeKilometers += distance;
      user.lifetimeCalories += calories;

      // Experience (XP) & Leveling Logic: 
      // 10 XP per calorie burned + 1 XP per step
      const earnedXp = (calories * 10) + steps;
      user.xp += earnedXp;

      // 100,000 XP per level (LVL 1 -> LVL 2 requires 100,000 XP)
      const baseLevel = 1 + Math.floor(user.xp / 100000);
      if (baseLevel > user.level) {
        user.level = baseLevel;
        console.log(`Athlete ${user.name} leveled up! New Level: ${user.level}`);
      }

      await user.save();

      // Update active quests with steps
      if (steps > 0) {
        const activeQuests = await Quest.find({ user: user._id, isCompleted: false, isPaused: { $ne: true } });
        for (const quest of activeQuests) {
          quest.currentSteps += steps;
          if (quest.currentSteps >= quest.targetSteps) {
            quest.currentSteps = quest.targetSteps;
            quest.isCompleted = true;
            console.log(`Quest "${quest.title}" completed by athlete ${user.name}!`);
          }
          await quest.save();
        }
      }

      res.status(201).json({
        activity,
        user: {
          level: user.level,
          xp: user.xp,
          lifetimeSteps: user.lifetimeSteps,
          lifetimeKilometers: user.lifetimeKilometers,
          lifetimeCalories: user.lifetimeCalories
        }
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
);

module.exports = router;
