const router = require('express').Router();
const User = require('../models/User');
const Quest = require('../models/Quest');
const Activity = require('../models/Activity');

// GET /api/admin/analytics - Retrieve aggregated platform metrics
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalActivities = await Activity.countDocuments({});
    
    // Aggregated steps, kilometers, calories
    const users = await User.find({});
    let totalSteps = 0;
    let totalKilometers = 0;
    let totalCalories = 0;
    
    users.forEach(user => {
      totalSteps += user.lifetimeSteps || 0;
      totalKilometers += user.lifetimeKilometers || 0;
      totalCalories += user.lifetimeCalories || 0;
    });

    // Get unique quests by title, reward, and targetSteps using aggregation
    const questsList = await Quest.aggregate([
      {
        $group: {
          _id: { title: "$title", rewardName: "$rewardName", targetSteps: "$targetSteps" },
          title: { $first: "$title" },
          description: { $first: "$description" },
          targetSteps: { $first: "$targetSteps" },
          rewardName: { $first: "$rewardName" },
          rewardImage: { $first: "$rewardImage" },
          rewardType: { $first: "$rewardType" },
          limitedEdition: { $first: "$limitedEdition" },
          isPaused: { $first: "$isPaused" }
        }
      },
      { $sort: { title: 1 } }
    ]);

    // Activity types breakdown
    const activityStats = await Activity.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const activitiesByType = {
      run: 0,
      gym: 0,
      swim: 0,
      walk: 0,
      cycle: 0,
      other: 0
    };

    activityStats.forEach(stat => {
      if (activitiesByType.hasOwnProperty(stat._id)) {
        activitiesByType[stat._id] = stat.count;
      } else {
        activitiesByType.other += stat.count;
      }
    });

    // Recent 10 activities in system
    const recentActivities = await Activity.find({})
      .populate('user', 'name email photoUrl')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      totalUsers,
      totalSteps,
      totalKilometers,
      totalCalories,
      totalActivities,
      activeQuests: questsList.length,
      quests: questsList,
      activitiesByType,
      recentActivities
    });
  } catch (error) {
    console.error('Admin Analytics Error:', error);
    res.status(500).json({ message: 'Internal server error fetching analytics.' });
  }
});

// GET /api/admin/users - Get all athletes in the system
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ level: -1, name: 1 });
    res.json(users);
  } catch (error) {
    console.error('Admin Fetch Users Error:', error);
    res.status(500).json({ message: 'Internal server error listing athletes.' });
  }
});

// POST /api/admin/quests - Create a new campaign/quest for ALL athletes
router.post('/quests', async (req, res) => {
  const { title, description, targetSteps, rewardName, rewardImage, rewardType, limitedEdition } = req.body;

  if (!title || !description || !targetSteps || !rewardName) {
    return res.status(400).json({ message: 'Please provide title, description, targetSteps, and rewardName.' });
  }

  const stepsNum = parseInt(targetSteps);
  if (isNaN(stepsNum) || stepsNum <= 0) {
    return res.status(400).json({ message: 'Target steps must be a positive integer.' });
  }

  try {
    // Check if an identical campaign already exists to prevent duplicate seeding
    const existing = await Quest.findOne({ title, rewardName, targetSteps: stepsNum });
    if (existing) {
      return res.status(400).json({ message: 'A campaign with this title, reward, and step target already exists.' });
    }

    const users = await User.find({});
    
    // Create quest instance for all athletes
    const questsToInsert = users.map(user => ({
      user: user._id,
      title,
      description,
      targetSteps: stepsNum,
      currentSteps: 0,
      rewardName,
      rewardImage: rewardImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHlj9ed06EGvVTX-TAzNl3aVKoLD0xsfOyVDgeLkc8L58MufBoj-Z8lEyfCdMCDxmCc7JJoGOcMbckMyEAgpPSTvFgcO_IA9tz2VgFErod5NFF7XZ__T_2QHTYHAJMVd3S-vKQyu6f77oaJix4dRMzFMYBqjHEnTnQmSR9dgVSn-e-PkHRf9zAHnkPRhaJq3dxfmwk5DHnBIUMrzFP1hWR6pBMtLC2pFVde5ul4NHEuQxxcAFU2VHqzlKxWFDz-16t2dzlnlVSNrKE',
      rewardType: rewardType || 'gear',
      limitedEdition: !!limitedEdition,
      isCompleted: false,
      isClaimed: false
    }));

    const insertedQuests = await Quest.insertMany(questsToInsert);

    res.status(201).json({
      message: `Quest successfully created and assigned to ${users.length} users!`,
      count: insertedQuests.length
    });
  } catch (error) {
    console.error('Admin Create Quest Error:', error);
    res.status(500).json({ message: 'Internal server error generating quests.' });
  }
});

// POST /api/admin/users/add-activity - Log a mock activity for a user
router.post('/users/add-activity', async (req, res) => {
  const { userId, type, title, duration, calories, steps, distance } = req.body;

  if (!userId || !type || !title) {
    return res.status(400).json({ message: 'Please provide userId, type, and title.' });
  }

  const stepsNum = parseInt(steps) || 0;
  const calNum = parseInt(calories) || 0;
  const durNum = parseInt(duration) || 0;
  const distNum = parseFloat(distance) || 0;

  if (stepsNum < 0 || calNum < 0 || durNum < 0 || distNum < 0) {
    return res.status(400).json({ message: 'Activity metrics cannot be negative.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 1. Create and Save the Activity
    const activity = new Activity({
      user: userId,
      type,
      title,
      duration: durNum,
      calories: calNum,
      steps: stepsNum,
      distance: distNum,
      timestamp: new Date()
    });
    await activity.save();

    // 2. Update Athlete Lifetime Metrics
    user.lifetimeSteps += stepsNum;
    user.lifetimeKilometers += distNum;
    user.lifetimeCalories += calNum;

    // Calculate simulated XP and Levels
    const xpGained = Math.round(stepsNum * 1 + calNum * 5 + durNum * 10);
    user.xp += xpGained;
    user.level = Math.floor(user.xp / 100000) + 1; // 100k XP per level
    
    await user.save();

    // 3. Update Athlete's Active Quests step counts
    const activeQuests = await Quest.find({ user: userId, isCompleted: false, isPaused: { $ne: true } });
    for (const quest of activeQuests) {
      quest.currentSteps += stepsNum;
      await quest.save(); // pre-save hook handles completion check
    }

    res.json({
      message: 'Simulated activity logged successfully!',
      activity,
      user,
      activeQuestsUpdated: activeQuests.length
    });
  } catch (error) {
    console.error('Admin Add Activity Error:', error);
    res.status(500).json({ message: 'Internal server error simulating activity.' });
  }
});

// DELETE /api/admin/quests - Delete a campaign (removes quest for all users)
router.delete('/quests', async (req, res) => {
  const { title, rewardName } = req.body;
  if (!title || !rewardName) {
    return res.status(400).json({ message: 'Campaign title and rewardName are required.' });
  }

  try {
    const result = await Quest.deleteMany({ title, rewardName });
    res.json({
      message: `Campaign "${title}" (${rewardName}) successfully deleted! Cleaned up ${result.deletedCount} user quest records.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Admin Delete Quest Error:', error);
    res.status(500).json({ message: 'Internal server error deleting campaign.' });
  }
});

// PUT /api/admin/quests/pause - Pause or Resume a campaign
router.put('/quests/pause', async (req, res) => {
  const { title, rewardName, isPaused } = req.body;
  if (!title || !rewardName) {
    return res.status(400).json({ message: 'Campaign title and rewardName are required.' });
  }

  try {
    const result = await Quest.updateMany({ title, rewardName }, { isPaused: !!isPaused });
    res.json({
      message: `Campaign "${title}" (${rewardName}) status successfully updated to ${isPaused ? 'Paused' : 'Active'} for all users!`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Admin Pause Quest Error:', error);
    res.status(500).json({ message: 'Internal server error changing campaign status.' });
  }
});

// PUT /api/admin/quests - Edit a campaign's parameters
router.put('/quests', async (req, res) => {
  const { oldTitle, oldRewardName, title, description, targetSteps, rewardName, rewardImage, rewardType, limitedEdition } = req.body;

  if (!oldTitle || !oldRewardName || !title || !description || !targetSteps || !rewardName) {
    return res.status(400).json({ message: 'Please provide oldTitle, oldRewardName, title, description, targetSteps, and rewardName.' });
  }

  const stepsNum = parseInt(targetSteps);
  if (isNaN(stepsNum) || stepsNum <= 0) {
    return res.status(400).json({ message: 'Target steps must be a positive integer.' });
  }

  try {
    // Find all quests matching the old campaign title and reward name
    const quests = await Quest.find({ title: oldTitle, rewardName: oldRewardName });
    
    if (quests.length === 0) {
      return res.status(404).json({ message: 'Campaign not found.' });
    }

    // Update each quest document so that pre-save hooks (completion checks) trigger correctly
    for (const quest of quests) {
      quest.title = title;
      quest.description = description;
      quest.targetSteps = stepsNum;
      quest.rewardName = rewardName;
      quest.rewardImage = rewardImage || quest.rewardImage;
      quest.rewardType = rewardType || quest.rewardType;
      quest.limitedEdition = !!limitedEdition;
      await quest.save();
    }

    res.json({
      message: `Campaign successfully updated to "${title}" for all ${quests.length} users!`,
      count: quests.length
    });
  } catch (error) {
    console.error('Admin Edit Quest Error:', error);
    res.status(500).json({ message: 'Internal server error updating campaign.' });
  }
});

module.exports = router;
