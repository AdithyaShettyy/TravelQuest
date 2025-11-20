const express = require('express');
const router = express.Router();
const { User, Friendship } = require('../models');
const { Op } = require('sequelize');

// Send friend request
router.post('/request', async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ error: 'userId and friendId are required' });
    }

    if (userId === friendId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friend exists
    const friend = await User.findByPk(friendId);
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friendship already exists
    const existingFriendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'blocked') {
        return res.status(403).json({ error: 'Cannot send friend request' });
      }
      if (existingFriendship.status === 'pending') {
        return res.status(400).json({ error: 'Friend request already sent' });
      }
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      }
    }

    // Create friend request
    const friendship = await Friendship.create({
      userId,
      friendId,
      status: 'pending'
    });

    res.json({
      message: 'Friend request sent',
      friendship
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept friend request
router.post('/accept', async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ error: 'userId and friendId are required' });
    }

    // Find pending request where friendId is userId (the receiver)
    const friendship = await Friendship.findOne({
      where: {
        userId: friendId,
        friendId: userId,
        status: 'pending'
      }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Update to accepted
    friendship.status = 'accepted';
    friendship.acceptedAt = new Date();
    await friendship.save();

    res.json({
      message: 'Friend request accepted',
      friendship
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Reject friend request
router.post('/reject', async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ error: 'userId and friendId are required' });
    }

    const friendship = await Friendship.findOne({
      where: {
        userId: friendId,
        friendId: userId,
        status: 'pending'
      }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    friendship.status = 'rejected';
    await friendship.save();

    res.json({
      message: 'Friend request rejected',
      friendship
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

// Remove friend
router.delete('/remove', async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ error: 'userId and friendId are required' });
    }

    const friendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId, friendId, status: 'accepted' },
          { userId: friendId, friendId: userId, status: 'accepted' }
        ]
      }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    await friendship.destroy();

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// Block user
router.post('/block', async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ error: 'userId and friendId are required' });
    }

    // Find or create friendship record
    let friendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    if (friendship) {
      friendship.status = 'blocked';
      await friendship.save();
    } else {
      friendship = await Friendship.create({
        userId,
        friendId,
        status: 'blocked'
      });
    }

    res.json({ message: 'User blocked', friendship });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Get friends list
router.get('/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' }
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'totalPoints', 'weeklyPoints', 'level', 'profilePicture']
        },
        {
          model: User,
          as: 'friend',
          attributes: ['id', 'username', 'totalPoints', 'weeklyPoints', 'level', 'profilePicture']
        }
      ]
    });

    // Extract friend data
    const friends = friendships.map(f => {
      return f.userId === userId ? f.friend : f.user;
    });

    res.json({ friends });
  } catch (error) {
    console.error('Error getting friends list:', error);
    res.status(500).json({ error: 'Failed to get friends list' });
  }
});

// Get pending friend requests
router.get('/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const pendingRequests = await Friendship.findAll({
      where: {
        friendId: userId,
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'totalPoints', 'weeklyPoints', 'level', 'profilePicture']
        }
      ]
    });

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
});

// Search users for adding friends
router.get('/search', async (req, res) => {
  try {
    const { query, userId } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: userId },
        username: { [Op.iLike]: `%${query}%` }
      },
      attributes: ['id', 'username', 'totalPoints', 'weeklyPoints', 'level', 'profilePicture'],
      limit: 20
    });

    // Get friendship status for each user
    const userIds = users.map(u => u.id);
    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { userId, friendId: { [Op.in]: userIds } },
          { userId: { [Op.in]: userIds }, friendId: userId }
        ]
      }
    });

    // Create a map of friendship statuses
    const friendshipMap = {};
    friendships.forEach(f => {
      const otherId = f.userId === userId ? f.friendId : f.userId;
      friendshipMap[otherId] = f.status;
    });

    // Add friendship status to each user
    const usersWithStatus = users.map(u => ({
      ...u.toJSON(),
      friendshipStatus: friendshipMap[u.id] || 'none'
    }));

    res.json({ users: usersWithStatus });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

module.exports = router;
