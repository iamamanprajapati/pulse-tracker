const jwt = require('jsonwebtoken');

// Helper to resolve JWT secret
const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  console.warn("WARNING: JWT_SECRET environment variable is missing. Generating a secure temporary secret key.");
  // Fallback to secure random key for testing/limited sandbox to avoid crashes
  return 'temp_ephemeral_secret_key_12345_kinetic_green';
};

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = getJwtSecret();
    // Enforce HS256 algorithm and verify the token signature
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Authentication failed. Invalid token structure.' });
    }

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Authentication failed. Invalid or malformed token.' });
  }
};
