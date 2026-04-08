const express = require('express');
const crypto = require('crypto');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Generate a random 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send phone verification code
router.post('/phone/send', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Validate Macedonian phone number format
    const macedonianPhoneRegex = /^\+3897[0-9]{7}$/;
    if (!macedonianPhoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        error: 'Invalid phone number format. Must be a valid Macedonian number (+3897xxxxxxx)'
      });
    }

    // Check if phone number is already verified by another user
    const existingUser = await User.findOne({
      where: {
        phoneNumber,
        phoneVerified: true
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Phone number is already registered' });
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // In a real app, you would use a service like Twilio to send SMS
    console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);

    // Store or update verification code
    await User.upsert({
      phoneNumber,
      phoneVerificationCode: verificationCode,
      phoneVerificationCodeExpiresAt: expiresAt,
      phoneVerified: false
    }, {
      where: { phoneNumber }
    });

    res.json({
      message: 'Verification code sent successfully',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify phone number
router.post('/phone/verify', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and verification code are required' });
    }

    const user = await User.findOne({
      where: { phoneNumber }
    });

    if (!user) {
      return res.status(404).json({ error: 'No verification request found for this phone number' });
    }

    // Check if code is valid and not expired
    if (user.phoneVerificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > user.phoneVerificationCodeExpiresAt) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Update user as verified
    await user.update({
      phoneVerified: true,
      phoneVerificationCode: null,
      phoneVerificationCodeExpiresAt: null
    });

    res.json({
      message: 'Phone number verified successfully',
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        phoneVerified: true
      }
    });
  } catch (error) {
    console.error('Error verifying phone number:', error);
    res.status(500).json({ error: 'Failed to verify phone number' });
  }
});

// Resend verification code
router.post('/phone/resend', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const user = await User.findOne({
      where: { phoneNumber }
    });

    if (!user) {
      return res.status(404).json({ error: 'No verification request found for this phone number' });
    }

    if (user.phoneVerified) {
      return res.status(400).json({ error: 'Phone number is already verified' });
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // In a real app, you would use a service like Twilio to send SMS
    console.log(`New verification code for ${phoneNumber}: ${verificationCode}`);

    await user.update({
      phoneVerificationCode: verificationCode,
      phoneVerificationCodeExpiresAt: expiresAt
    });

    res.json({
      message: 'New verification code sent successfully',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// Check verification status
router.get('/phone/status', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      verificationPending: !!(user.phoneVerificationCode && !user.phoneVerified)
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({ error: 'Failed to check verification status' });
  }
});

module.exports = router;