const router = require('express').Router();
const Reward = require('../models/Reward');
const auth = require('../middleware/auth');

// GET /api/rewards
router.get('/', auth, async (req, res) => {
  try {
    const rewards = await Reward.find({ user: req.user.id }).sort({ claimedAt: -1 });
    res.json(rewards);
  } catch (error) {
    console.error('Error fetching claimed rewards:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
