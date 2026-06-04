const router = require('express').Router();
const Quest = require('../models/Quest');
const Reward = require('../models/Reward');
const auth = require('../middleware/auth');

// GET /api/quests
router.get('/', auth, async (req, res) => {
  try {
    const quests = await Quest.find({ user: req.user.id, isPaused: { $ne: true } }).sort({ createdAt: -1 });
    res.json(quests);
  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/quests/claim
router.post('/claim', auth, async (req, res) => {
  const { questId } = req.body;
  if (!questId) {
    return res.status(400).json({ message: 'Quest ID is required.' });
  }

  try {
    const quest = await Quest.findOne({ _id: questId, user: req.user.id });
    if (!quest) {
      return res.status(404).json({ message: 'Quest not found.' });
    }

    if (!quest.isCompleted) {
      return res.status(400).json({ message: 'Quest is not yet completed.' });
    }

    if (quest.isClaimed) {
      return res.status(400).json({ message: 'Quest reward has already been claimed.' });
    }

    // Mark as claimed
    quest.isClaimed = true;
    await quest.save();

    // Create claimed Reward entry
    const reward = new Reward({
      user: req.user.id,
      quest: quest._id,
      title: quest.rewardName,
      image: quest.rewardImage,
      type: quest.rewardType,
      claimedAt: new Date()
    });
    await reward.save();

    res.json({
      message: 'Reward claimed successfully!',
      quest,
      reward
    });
  } catch (error) {
    console.error('Error claiming quest reward:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
