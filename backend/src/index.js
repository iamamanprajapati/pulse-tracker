const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const activityRoutes = require('./routes/activities');
const questRoutes = require('./routes/quests');
const leaderboardRoutes = require('./routes/leaderboard');
const rewardRoutes = require('./routes/rewards');
const adminRoutes = require('./routes/admin');

const app = express();

// Apply security headers
app.use(helmet());

// Configure strict CORS (Allow Expo web development ports)
const allowedOrigins = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS security policy'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Log all incoming API calls
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API Call] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Strict HTTP Method Whitelist
app.use((req, res, next) => {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ message: `HTTP Method ${req.method} not allowed.` });
  }
  next();
});

// Bind routers
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/admin', adminRoutes);

// Generic error handler to avoid stack leaks to clients
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: 'A server error occurred. Please try again later.' });
});

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulsetrack';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    // Listen on 0.0.0.0 to allow connection from physical devices on the local network
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`PulseTrack backend listening at http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB database connection error:', err);
    process.exit(1);
  });
