const mongoose = require('mongoose');
const User = require('./models/User');
const Quest = require('./models/Quest');
const Activity = require('./models/Activity');
const Reward = require('./models/Reward');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulsetrack';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Seed: Connected to MongoDB.');

    // Clear existing collection records
    await User.deleteMany({});
    await Quest.deleteMany({});
    await Activity.deleteMany({});
    await Reward.deleteMany({});
    console.log('Seed: Cleared old collections data.');

    // 1. Create Alex Henderson profile
    const alex = new User({
      googleId: 'mock_google_id_alex@pulsetrack.com',
      email: 'alex@pulsetrack.com',
      name: 'Alex Henderson',
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVWf_EgZ3ed05m---xLADr8lrRgvXEJk0hUfWx4YJ3Qk1LyBlK4PxAdPKtNlZzkBRkDpUz-v1OnJ3iVD9w0IxLzCd5k7iBZWKDspsxsCSPwdsFWj1YqUeEytEbvbxmdNdo2sqgzrj9WCD0O9WxbFKubtW8uUQL6NcRZwHemHa7hvjvMeRoEgmD3pbTrovkskbo-wcX_25tlFYAaZcI6DHoLGpP136JuRzqQtPbtrej-0mmZz4HLXUU0pRnJAps_tKhCZJGvxVOGInu',
      level: 42,
      xp: 4150000, // level 42
      dailyStepGoal: 10000,
      lifetimeSteps: 2400000, // 2.4M Steps
      lifetimeKilometers: 1842, // 1842 km
      lifetimeCalories: 28000, // 28k kcal
      role: 'Athlete',
      joinedDate: new Date('2023-03-15')
    });
    await alex.save();

    // 2. Create Leaderboard Mock Competitors
    const marcus = new User({
      email: 'marcus@pulsetrack.com',
      name: 'Marcus Vance',
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYFIEeixGmHQpLrZpfeNMaV-h4hndGVwdou1LQsWk8NsDqTpHHP-sV35E2TBGR3cmEBR305Ni7wCydZR4f_YHDapOE3mcVBIX-LE5cURmIEJ7Mnug5lG_WChZsr4ogSHpEARO9ZgQomou7kxfJ6iaL9jG7P_xizPinumIJcEAtovWfy3zRE2prwTLXlJj_yG3H5LTnb9etPqauQ5IHysjGlYjGjuAkYpBT9BWwRNbEBrMaIgSDSMrPHULgHMqgkLcEUMA1IzDDcR_a',
      level: 48,
      xp: 4750000,
      lifetimeSteps: 3100000
    });
    await marcus.save();

    const elena = new User({
      email: 'elena@pulsetrack.com',
      name: 'Elena Rostova',
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4c0w9yEsMuN4-FSlZ4IECHtUEZcuKqYxY804ppQ0CuHxlPD5MwB_nPR0HF9ruTdu8bQ1IU0tVMpKYohwc_00E8HXq4ELH2uvFfhyvvauvtB3YZBX0Fw1qxrYyqHbXOHptbSFL4vChRCZ_ZKYBTWfYgH-2dw9GAyyembvoW-Gr453xWxsnmmAKTZPcc1fxICpJlO11Psp0McIqRUYCSZkuzcQU3GITqNRriD1pWurjend1WZR89zsPM8qtTkkB_ohOOKyYhLVpw40t',
      level: 45,
      xp: 4420000,
      lifetimeSteps: 2900000
    });
    await elena.save();

    const jordan = new User({
      email: 'jordan@pulsetrack.com',
      name: 'Jordan Hayes',
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAu_9ASyJIYnNcWuzpXysVa_hswC4t9Ui-necptm8rVT6129Gv3SiOsQUgAgxV2r0muwV4NgbgsAcklL_mdRmmOX2l35jfdSgLyjxc0rb2gBjRSQbtL6kTKNl-IfJAKej-TAQNHDx6FebXsBLzX1j25f9sAFwgrpVQ3hd1c-ogfHmf-hsjVNl0csIG0CyYYd3wRLqxLAciqURuCXAKZbSq3hav9jUmkP4kYj8q8RA-QcbGo5K5eiSsILiqPd4AfdInlfPnfBbOOrzxX',
      level: 39,
      xp: 3820000,
      lifetimeSteps: 2100000
    });
    await jordan.save();

    const chloe = new User({
      email: 'chloe@pulsetrack.com',
      name: 'Chloe Zhao',
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4c0w9yEsMuN4-FSlZ4IECHtUEZcuKqYxY804ppQ0CuHxlPD5MwB_nPR0HF9ruTdu8bQ1IU0tVMpKYohwc_00E8HXq4ELH2uvFfhyvvauvtB3YZBX0Fw1qxrYyqHbXOHptbSFL4vChRCZ_ZKYBTWfYgH-2dw9GAyyembvoW-Gr453xWxsnmmAKTZPcc1fxICpJlO11Psp0McIqRUYCSZkuzcQU3GITqNRriD1pWurjend1WZR89zsPM8qtTkkB_ohOOKyYhLVpw40t',
      level: 34,
      xp: 3300000,
      lifetimeSteps: 1800000
    });
    await chloe.save();

    // 3. Create Active Quest: UltraPulse Pro Watch
    const quest = new Quest({
      user: alex._id,
      title: 'UltraPulse Pro Watch',
      description: 'Complete 100k steps this week to unlock this exclusive gear reward.',
      targetSteps: 100000,
      currentSteps: 74200, // Match 74.2% from design
      rewardName: 'UltraPulse Pro Watch',
      rewardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHlj9ed06EGvVTX-TAzNl3aVKoLD0xsfOyVDgeLkc8L58MufBoj-Z8lEyfCdMCDxmCc7JJoGOcMbckMyEAgpPSTvFgcO_IA9tz2VgFErod5NFF7XZ__T_2QHTYHAJMVd3S-vKQyu6f77oaJix4dRMzFMYBqjHEnTnQmSR9dgVSn-e-PkHRf9zAHnkPRhaJq3dxfmwk5DHnBIUMrzFP1hWR6pBMtLC2pFVde5ul4NHEuQxxcAFU2VHqzlKxWFDz-16t2dzlnlVSNrKE',
      rewardType: 'gear',
      limitedEdition: true
    });
    await quest.save();

    // 4. Create Milestone Badges
    const badge1 = new Reward({
      user: alex._id,
      title: 'Swift Starter',
      image: 'bolt',
      type: 'badge',
      claimedAt: new Date('2023-04-10')
    });
    await badge1.save();

    const badge2 = new Reward({
      user: alex._id,
      title: 'Calorie Burner',
      image: 'local_fire_department',
      type: 'badge',
      claimedAt: new Date('2023-05-12')
    });
    await badge2.save();

    // Note: 'Peak Performer' is locked, so we do not seed it.
    // '7-Day Streak' is seeded.
    const badge3 = new Reward({
      user: alex._id,
      title: '7-Day Streak',
      image: 'stars',
      type: 'badge',
      claimedAt: new Date('2023-09-01')
    });
    await badge3.save();

    // 5. Create Claimed Gear Rewards
    const reward1 = new Reward({
      user: alex._id,
      title: 'Viper Streak Running Shoes',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZq5K_czAj2NSZzvDauORPhWGRb1I0XhoWwrhx9NLa_oPTM3h88WEqO9kh_4joxataKxq_pXssl4ILRpP9IJ2tvrMwtSGc_18v6NTmlUWAW0rsstBoEvqmvGXoy7Y0xttXHBPdlNR7ApQmBnI6a2boFK_ZyEAHJiTIFheRuOjRtWvn8bKcEB0G6Tpl_kOdQ1XtT_WUo2yx7yd01xFWWkkXpnMY6_s8k8FFMdguM3vgxnDGAovRBblGvrrOhBrkJhe80w-nB3LDY4GL',
      type: 'gear',
      claimedAt: new Date('2023-10-24')
    });
    await reward1.save();

    const reward2 = new Reward({
      user: alex._id,
      title: 'HydroFlow 1L Bottle',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKyl8d7e1foLsqxaytBdLRY4a0SihsecQSEsx513G8B52HdWFPhCNfUDG3bVilYNZKvIo8IMzAGPIarHXffohvJThaAq9CXqXErca4hCgazl-_nigM-LHj5KR4vVqw7qENfkl1VFlEjn4GSkhwTYIMffgGAf7o4ht9r63Jv3Iw352-HsYiMk8ZnHWMbKI-fAl5lM7bVEy21pGf_nMcO7BU4R2Fg0kc-wH93hXYQDzgUCSFS8Ya8kaMMepm3lby9IqoFGj8tKwcsJ1_',
      type: 'gear',
      claimedAt: new Date('2023-09-12')
    });
    await reward2.save();

    // 6. Create Recent Activities
    const act1 = new Activity({
      user: alex._id,
      type: 'run',
      title: 'Morning Run',
      duration: 35,
      calories: 450,
      steps: 5200,
      distance: 5.2,
      timestamp: new Date()
    });
    await act1.save();

    const act2 = new Activity({
      user: alex._id,
      type: 'gym',
      title: 'Strength Training',
      duration: 45,
      calories: 320,
      steps: 1200,
      distance: 0,
      timestamp: new Date(Date.now() - 3600000 * 2) // 2 hours ago
    });
    await act2.save();

    const act3 = new Activity({
      user: alex._id,
      type: 'swim',
      title: 'Evening Swim',
      duration: 30,
      calories: 280,
      steps: 0,
      distance: 0.8,
      timestamp: new Date(Date.now() - 3600000 * 12) // 12 hours ago
    });
    await act3.save();

    console.log('Seed: Database successfully populated with initial stats!');
  } catch (err) {
    console.error('Seed: Error seeding MongoDB data:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Seed: Disconnected from MongoDB.');
  }
}

seed();
