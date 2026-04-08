const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { APIError } = require('./errorHandler');
const logger = require('../utils/logger');

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

// Verify JWT token
const verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new APIError('Access denied. No token provided.', 401));
    }

    const token = authHeader.substring(7);

    const decoded = await verifyToken(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return next(new APIError('Invalid token. User not found or inactive.', 401));
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new APIError('Token expired', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new APIError('Invalid token', 401));
    }
    next(error);
  }
};

// Optional auth middleware (for public endpoints that can benefit from auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

// KYC verification middleware
const requireKYC = (req, res, next) => {
  if (!req.user) {
    return next(new APIError('Authentication required', 401));
  }

  if (req.user.kycStatus !== 'approved') {
    return next(new APIError('KYC verification required. Please complete your identity verification.', 403));
  }

  next();
};

// Email verification middleware
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return next(new APIError('Authentication required', 401));
  }

  if (!req.user.emailVerifiedAt) {
    return next(new APIError('Email verification required. Please verify your email address.', 403));
  }

  next();
};

// Phone verification middleware
const requirePhoneVerification = (req, res, next) => {
  if (!req.user) {
    return next(new APIError('Authentication required', 401));
  }

  if (!req.user.phoneVerifiedAt) {
    return next(new APIError('Phone verification required. Please verify your phone number.', 403));
  }

  next();
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = async (req, res, next) => {
  if (!req.user) {
    return next(new APIError('Authentication required', 401));
  }

  // Log sensitive operation attempt
  logger.info('Sensitive operation attempted', {
    userId: req.user.id,
    operation: req.route.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  next();
};

module.exports = {
  generateTokens,
  verifyToken,
  authenticate,
  optionalAuth,
  requireKYC,
  requireEmailVerification,
  requirePhoneVerification,
  sensitiveOperationLimit
};