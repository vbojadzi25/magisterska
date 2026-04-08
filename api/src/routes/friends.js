const express = require('express');
const { Op } = require('sequelize');
const { Friend, User, Contact } = require('../models');
const { authenticate } = require('../middleware/auth');
const { notifyUser } = require('../services/notificationService');
const router = express.Router();

// Get user's friends
router.get('/', authenticate, async (req, res) => {
  try {
    const friends = await Friend.findAll({
      where: {
        userId: req.user.id,
        status: 'accepted'
      },
      include: [{
        model: User,
        as: 'friendUser',
        attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'profileImageUrl']
      }]
    });

    const friendsList = friends.map(friend => ({
      id: friend.friendUser.id,
      name: `${friend.friendUser.firstName} ${friend.friendUser.lastName}`.trim(),
      phoneNumber: friend.friendUser.phoneNumber,
      profileImageUrl: friend.friendUser.profileImageUrl,
      friendshipId: friend.id,
      friendsSince: friend.acceptedAt
    }));

    res.json({ friends: friendsList });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Get friend requests
router.get('/requests', authenticate, async (req, res) => {
  try {
    const receivedRequests = await Friend.findAll({
      where: {
        friendUserId: req.user.id,
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'profileImageUrl']
      }]
    });

    const sentRequests = await Friend.findAll({
      where: {
        userId: req.user.id,
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'friendUser',
        attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'profileImageUrl']
      }]
    });

    const received = receivedRequests.map(request => ({
      id: request.id,
      user: {
        id: request.user.id,
        name: `${request.user.firstName} ${request.user.lastName}`.trim(),
        phoneNumber: request.user.phoneNumber,
        profileImageUrl: request.user.profileImageUrl
      },
      requestedAt: request.requestedAt,
      type: 'received'
    }));

    const sent = sentRequests.map(request => ({
      id: request.id,
      user: {
        id: request.friendUser.id,
        name: `${request.friendUser.firstName} ${request.friendUser.lastName}`.trim(),
        phoneNumber: request.friendUser.phoneNumber,
        profileImageUrl: request.friendUser.profileImageUrl
      },
      requestedAt: request.requestedAt,
      type: 'sent'
    }));

    res.json({
      received,
      sent,
      total: received.length + sent.length
    });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

// Send friend request
router.post('/request', authenticate, async (req, res) => {
  try {
    const { friendUserId } = req.body;

    if (!friendUserId) {
      return res.status(400).json({ error: 'Friend user ID is required' });
    }

    if (friendUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existingFriendship = await Friend.findOne({
      where: {
        [Op.or]: [
          { userId: req.user.id, friendUserId },
          { userId: friendUserId, friendUserId: req.user.id }
        ]
      }
    });

    if (existingFriendship) {
      return res.status(400).json({ error: 'Friend request already exists or you are already friends' });
    }

    // Check if target user exists
    const targetUser = await User.findByPk(friendUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const friendRequest = await Friend.create({
      userId: req.user.id,
      friendUserId,
      status: 'pending'
    });

    // Notify recipient — fire-and-forget
    notifyUser(targetUser, 'friendRequests', {
      title: 'New friend request',
      body: `${req.user.firstName} ${req.user.lastName} sent you a friend request`,
      data: { type: 'friend_request', requestId: friendRequest.id },
    });

    res.status(201).json({
      message: 'Friend request sent successfully',
      requestId: friendRequest.id
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept friend request
router.post('/accept/:requestId', authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await Friend.findOne({
      where: {
        id: requestId,
        friendUserId: req.user.id,
        status: 'pending'
      }
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await friendRequest.update({
      status: 'accepted',
      acceptedAt: new Date()
    });

    // Notify the original sender — fire-and-forget
    const sender = await User.findByPk(friendRequest.userId);
    if (sender) {
      notifyUser(sender, 'friendRequests', {
        title: 'Friend request accepted',
        body: `${req.user.firstName} ${req.user.lastName} accepted your friend request`,
        data: { type: 'friend_accepted' },
      });
    }

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Decline friend request
router.post('/decline/:requestId', authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await Friend.findOne({
      where: {
        id: requestId,
        friendUserId: req.user.id,
        status: 'pending'
      }
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await friendRequest.destroy();

    res.json({ message: 'Friend request declined' });
  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({ error: 'Failed to decline friend request' });
  }
});

// Search user by username to add as friend
router.get('/search', authenticate, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await User.findOne({
      where: {
        username: username.trim(),
        id: { [Op.ne]: req.user.id },
        isActive: true,
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'profileImageUrl'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = await Friend.findOne({
      where: {
        [Op.or]: [
          { userId: req.user.id, friendUserId: user.id },
          { userId: user.id, friendUserId: req.user.id },
        ],
      },
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: `${user.firstName} ${user.lastName}`.trim(),
        profileImageUrl: user.profileImageUrl,
      },
      friendshipStatus: existing ? existing.status : null,
      requestDirection: existing
        ? (existing.userId === req.user.id ? 'sent' : 'received')
        : null,
    });
  } catch (error) {
    console.error('Error searching user by username:', error);
    res.status(500).json({ error: 'Failed to search user' });
  }
});

// Remove friend
router.delete('/:friendId', authenticate, async (req, res) => {
  try {
    const { friendId } = req.params;

    const friendship = await Friend.findOne({
      where: {
        [Op.or]: [
          { userId: req.user.id, friendUserId: friendId },
          { userId: friendId, friendUserId: req.user.id }
        ],
        status: 'accepted'
      }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    await friendship.destroy();

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

module.exports = router;