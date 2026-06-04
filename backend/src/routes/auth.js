const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Quest = require('../models/Quest');

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'temp_ephemeral_secret_key_12345_kinetic_green';
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { token, mockEmail, mockName, mockPhoto } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Authentication token is required.' });
  }

  let email, name, photoUrl, googleId;

  // Check if we are running in Mock/Demo mode (no Google Client ID configured, or explicit mock token provided)
  const isMockFlow = !process.env.GOOGLE_CLIENT_ID || token === 'mock-google-token';

  if (isMockFlow) {
    // Demo Mode: Use mock parameters or fallback to default Alex Henderson
    email = mockEmail || 'alex@pulsetrack.com';
    name = mockName || 'Alex Henderson';
    photoUrl = mockPhoto || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVWf_EgZ3ed05m---xLADr8lrRgvXEJk0hUfWx4YJ3Qk1LyBlK4PxAdPKtNlZzkBRkDpUz-v1OnJ3iVD9w0IxLzCd5k7iBZWKDspsxsCSPwdsFWj1YqUeEytEbvbxmdNdo2sqgzrj9WCD0O9WxbFKubtW8uUQL6NcRZwHemHa7hvjvMeRoEgmD3pbTrovkskbo-wcX_25tlFYAaZcI6DHoLGpP136JuRzqQtPbtrej-0mmZz4HLXUU0pRnJAps_tKhCZJGvxVOGInu';
    googleId = 'mock_google_id_' + email;
    console.log(`Auth Mode: Mock/Demo login for ${email}`);
  } else {
    try {
      // Production Mode: Verify Google ID token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      email = payload.email;
      name = payload.name;
      photoUrl = payload.picture || '';
      googleId = payload.sub;
      console.log(`Auth Mode: Production Google OAuth verification successful for ${email}`);
    } catch (err) {
      console.error('Google OAuth token verification failed:', err);
      return res.status(401).json({ message: 'Invalid Google Sign-In token.' });
    }
  }

  try {
    // Find or create the user
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user with standard starter stats
      user = new User({
        googleId,
        email,
        name,
        photoUrl,
        level: 1,
        xp: 0,
        dailyStepGoal: 10000,
        lifetimeSteps: 0,
        lifetimeKilometers: 0,
        lifetimeCalories: 0,
        role: 'Athlete',
      });
      await user.save();
      console.log(`New athlete profile created: ${email}`);

      // Clone all distinct quests for the new user so they immediately get active campaigns
      try {
        const distinctQuests = await Quest.aggregate([
          {
            $group: {
              _id: "$title",
              title: { $first: "$title" },
              description: { $first: "$description" },
              targetSteps: { $first: "$targetSteps" },
              rewardName: { $first: "$rewardName" },
              rewardImage: { $first: "$rewardImage" },
              rewardType: { $first: "$rewardType" },
              limitedEdition: { $first: "$limitedEdition" }
            }
          }
        ]);
        
        if (distinctQuests.length > 0) {
          const userQuests = distinctQuests.map(q => ({
            user: user._id,
            title: q.title,
            description: q.description,
            targetSteps: q.targetSteps,
            currentSteps: 0,
            rewardName: q.rewardName,
            rewardImage: q.rewardImage,
            rewardType: q.rewardType,
            limitedEdition: q.limitedEdition,
            isCompleted: false,
            isClaimed: false
          }));
          await Quest.insertMany(userQuests);
          console.log(`Cloned ${distinctQuests.length} existing quests for new athlete: ${email}`);
        } else {
          // If no campaigns in DB, seed default quest
          const defaultQuest = new Quest({
            user: user._id,
            title: 'UltraPulse Pro Watch',
            description: 'Complete 100k steps this week to unlock this exclusive gear reward.',
            targetSteps: 100000,
            currentSteps: 0,
            rewardName: 'UltraPulse Pro Watch',
            rewardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHlj9ed06EGvVTX-TAzNl3aVKoLD0xsfOyVDgeLkc8L58MufBoj-Z8lEyfCdMCDxmCc7JJoGOcMbckMyEAgpPSTvFgcO_IA9tz2VgFErod5NFF7XZ__T_2QHTYHAJMVd3S-vKQyu6f77oaJix4dRMzFMYBqjHEnTnQmSR9dgVSn-e-PkHRf9zAHnkPRhaJq3dxfmwk5DHnBIUMrzFP1hWR6pBMtLC2pFVde5ul4NHEuQxxcAFU2VHqzlKxWFDz-16t2dzlnlVSNrKE',
            rewardType: 'gear',
            limitedEdition: true
          });
          await defaultQuest.save();
          console.log(`Seeded default quest for new athlete: ${email}`);
        }
      } catch (questErr) {
        console.error('Error seeding quests for new user:', questErr);
      }
    } else if (googleId && !user.googleId) {
      // Update Google ID if logging in with Google for the first time
      user.googleId = googleId;
      await user.save();
    }

    // Generate session JWT
    const jwtToken = jwt.sign(
      { id: user._id },
      getJwtSecret(),
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
        level: user.level,
        xp: user.xp,
        dailyStepGoal: user.dailyStepGoal,
        lifetimeSteps: user.lifetimeSteps,
        lifetimeKilometers: user.lifetimeKilometers,
        lifetimeCalories: user.lifetimeCalories,
        role: user.role,
        joinedDate: user.joinedDate,
      }
    });
  } catch (dbErr) {
    console.error('Database error during authentication:', dbErr);
    res.status(500).json({ message: 'Server database error during authentication.' });
  }
});

module.exports = router;
