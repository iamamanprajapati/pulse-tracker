const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/user/profile
router.put(
  '/profile',
  auth,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 50 }).withMessage('Name is too long'),
    body('dailyStepGoal').optional().isInt({ min: 1000, max: 100000 }).withMessage('Daily step goal must be an integer between 1,000 and 100,000')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, dailyStepGoal } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      if (name) user.name = name;
      if (dailyStepGoal) user.dailyStepGoal = dailyStepGoal;

      await user.save();
      res.json(user);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
);

// PUT /api/user/sync-health
router.put(
  '/sync-health',
  auth,
  [
    body('steps').isInt({ min: 0 }).withMessage('Steps must be a non-negative integer'),
    body('calories').isInt({ min: 0 }).withMessage('Calories must be a non-negative integer'),
    body('clientDate').trim().notEmpty().withMessage('Client date (YYYY-MM-DD) is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { steps, calories, clientDate } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      let newSteps = 0;
      let newCalories = 0;

      // Check if we are syncing for the same date as last time
      if (user.lastSyncDate === clientDate) {
        // Calculate deltas based on same-day metrics
        newSteps = Math.max(0, steps - user.todaySteps);
        newCalories = Math.max(0, calories - user.todayCalories);

        user.todaySteps = steps;
        user.todayCalories = calories;
      } else {
        // It's a new day!
        newSteps = steps;
        newCalories = calories;

        user.todaySteps = steps;
        user.todayCalories = calories;
        user.lastSyncDate = clientDate;
      }

      // Add deltas to lifetime totals
      user.lifetimeSteps += newSteps;
      user.lifetimeCalories += newCalories;

      // Approximate distance walked (average step is ~0.000762 km)
      const newDistance = newSteps * 0.000762;
      user.lifetimeKilometers += newDistance;

      // Experience (XP) & Leveling Logic: 
      // 10 XP per calorie burned + 1 XP per step
      const earnedXp = (newCalories * 10) + newSteps;
      user.xp += earnedXp;

      // 100,000 XP per level
      const baseLevel = 1 + Math.floor(user.xp / 100000);
      if (baseLevel > user.level) {
        user.level = baseLevel;
        console.log(`Athlete ${user.name} leveled up from sync! New Level: ${user.level}`);
      }

      await user.save();

      // Update active quests with steps
      if (newSteps > 0) {
        const Quest = require('../models/Quest');
        const activeQuests = await Quest.find({ user: user._id, isCompleted: false, isPaused: { $ne: true } });
        for (const quest of activeQuests) {
          quest.currentSteps += newSteps;
          if (quest.currentSteps >= quest.targetSteps) {
            quest.currentSteps = quest.targetSteps;
            quest.isCompleted = true;
            console.log(`Quest "${quest.title}" completed by athlete ${user.name} during sync!`);
          }
          await quest.save();
        }
      }

      res.json(user);
    } catch (error) {
      console.error('Error syncing health metrics:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
);

module.exports = router;
