const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/leaderboard
router.get('/', auth, async (req, res) => {
  try {
    // Retrieve users from database
    const users = await User.find({}).select('name photoUrl level lifetimeSteps').lean();
    
    // Convert lifetimeSteps to active points or steps, sorting them
    // To represent a dynamic leaderboard, we sort users by their steps/metrics
    const sortedAthletes = users.map((u) => {
      return {
        id: u._id,
        name: u.name,
        photoUrl: u.photoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
        level: u.level,
        points: u.lifetimeSteps || 0,
        shift: 0,
        isCurrentUser: false
      };
    });

    // Sort by points descending
    sortedAthletes.sort((a, b) => b.points - a.points);

    // Apply ranking and identify current user
    const rankings = sortedAthletes.map((athlete, index) => {
      const isCurrentUser = athlete.id.toString() === req.user.id;
      return {
        ...athlete,
        rank: index + 1,
        isCurrentUser
      };
    });

    res.json(rankings);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
