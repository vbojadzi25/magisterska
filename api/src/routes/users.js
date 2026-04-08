const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { User } = require('../models');
const { APIError } = require('../middleware/errorHandler');

const router = express.Router();

router.use(authenticate);

// GET /api/users/profile
router.get('/profile', (req, res) => {
  res.json({ success: true, data: req.user });
});

// PATCH /api/users/profile
router.patch('/profile', [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('bio').optional().isLength({ max: 500 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new APIError('Validation failed', 400));
    }

    const { firstName, lastName, email, bio } = req.body;
    const user = await User.findByPk(req.user.id);

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;

    if (email !== undefined && email !== user.email) {
      const taken = await User.findOne({ where: { email } });
      if (taken) return next(new APIError('Email already in use', 400));
      user.email = email;
    }

    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/change-password
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, number and special character'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new APIError(errors.array()[0].msg, 400));
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return next(new APIError('Current password is incorrect', 401));

    if (currentPassword === newPassword) {
      return next(new APIError('New password must be different from current password', 400));
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/push-token — register or clear an Expo push token
router.post('/push-token', async (req, res, next) => {
  try {
    const { token } = req.body;
    // token === null clears the stored token (on logout)
    if (token !== null && token !== undefined && typeof token !== 'string') {
      return next(new APIError('token must be a string or null', 400));
    }

    const user = await User.findByPk(req.user.id);
    user.pushToken = token || null;
    await user.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Users endpoint' });
});

module.exports = router;
