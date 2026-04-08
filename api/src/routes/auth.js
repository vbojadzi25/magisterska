const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { User } = require('../models');
const { generateTokens, verifyToken, authenticate } = require('../middleware/auth');
const { APIError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 5,
  skip: () => process.env.NODE_ENV === 'test',
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  skip: () => process.env.NODE_ENV === 'test',
  message: 'Too many registration attempts, please try again later.',
});

// Register validation rules
const registerValidation = [
  body('username')
    .trim()
    .matches(/^[a-zA-Z][a-zA-Z0-9_]{2,29}$/)
    .withMessage('Username must be 3–30 characters, start with a letter, and contain only letters, numbers, or underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('phoneNumber')
    .matches(/^\+389[0-9]{8}$/)
    .withMessage('Valid Macedonian phone number is required (+389XXXXXXXX)'),
  body('dateOfBirth')
    .isISO8601()
    .isBefore(new Date().toISOString())
    .withMessage('Valid date of birth is required'),
  body('nationality')
    .optional()
    .isLength({ min: 2, max: 3 })
];

// Login validation rules
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// GET /api/auth/check-username?username=xxx
router.get('/check-username', async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username || !/^[a-zA-Z][a-zA-Z0-9_]{2,29}$/.test(username)) {
      return res.json({ available: false, reason: 'invalid' });
    }

    const existing = await User.findOne({ where: { username } });
    res.json({ available: !existing });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register
router.post('/register', registerLimiter, registerValidation, async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new APIError('Validation failed', 400, true));
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      nationality = 'MK'
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }, { phoneNumber }]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return next(new APIError('Username is already taken', 409));
      }
      return next(new APIError('User with this email or phone number already exists', 409));
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      nationality
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    logger.info('New user registered', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate a random 6-digit code
const generate2FACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Mask phone number for display: +389 7** ***45
const maskPhone = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.length < 6) return phoneNumber;
  const last2 = phoneNumber.slice(-2);
  return `+389 7** ***${last2}`;
};

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new APIError('Validation failed', 400));
    }

    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ where: { username } });

    if (!user || !user.isActive) {
      return next(new APIError('Invalid credentials', 401));
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new APIError('Invalid credentials', 401));
    }

    // Generate 2FA code and store it
    const code = generate2FACode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.phoneVerificationCode = code;
    user.phoneVerificationCodeExpiresAt = expiresAt;
    await user.save();

    // Simulate SMS - in production use Twilio/similar
    logger.info(`[2FA] Login code for ${user.email} (${user.phoneNumber}): ${code}`, {
      userId: user.id,
      ip: req.ip
    });
    console.log(`\n📱 [SIMULATED SMS] 2FA code for ${user.phoneNumber}: ${code}\n`);

    res.json({
      success: true,
      data: {
        requiresTwoFactor: true,
        userId: user.id,
        phoneHint: maskPhone(user.phoneNumber),
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-login — complete 2FA and get tokens
router.post('/verify-login', authLimiter, async (req, res, next) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return next(new APIError('userId and code are required', 400));
    }

    const user = await User.findByPk(userId);
    if (!user || !user.isActive) {
      return next(new APIError('Invalid request', 401));
    }

    if (user.phoneVerificationCode !== code) {
      return next(new APIError('Invalid verification code', 401));
    }

    if (!user.phoneVerificationCodeExpiresAt || new Date() > user.phoneVerificationCodeExpiresAt) {
      return next(new APIError('Verification code has expired', 401));
    }

    // Clear code
    user.phoneVerificationCode = null;
    user.phoneVerificationCodeExpiresAt = null;
    user.lastLoginAt = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user.id);

    logger.info('User logged in via 2FA', { userId: user.id, email: user.email, ip: req.ip });

    res.json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/resend-login-code
router.post('/resend-login-code', authLimiter, async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return next(new APIError('userId is required', 400));

    const user = await User.findByPk(userId);
    if (!user || !user.isActive) return next(new APIError('User not found', 404));

    const code = generate2FACode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.phoneVerificationCode = code;
    user.phoneVerificationCodeExpiresAt = expiresAt;
    await user.save();

    console.log(`\n📱 [SIMULATED SMS] New 2FA code for ${user.phoneNumber}: ${code}\n`);

    res.json({ success: true, message: 'New code sent' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new APIError('Refresh token is required', 400));
    }

    const decoded = await verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return next(new APIError('Invalid refresh token', 401));
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new APIError('Refresh token expired', 401));
    }
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  // In a production app, you might want to blacklist the token
  // For now, we'll just return success
  logger.info('User logged out', {
    userId: req.user.id,
    email: req.user.email,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Successfully logged out'
  });
});

module.exports = router;