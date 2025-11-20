const express = require('express');
const router = express.Router();
const { User, Friendship, Squad, SquadMember, PowerUp } = require('../models');
const { Op } = require('sequelize');
const { checkAchievements } = require('./achievements');
const { calculateAdvancedScore } = require('../utils/scoring');

// Helper function to get start of current week (Monday 00:00 UTC)
const getWeekStart = () => {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysToMonday = (dayOfWeek + 6) % 7; // Days since last Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - daysToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
};

// Get global leaderboard
router.get('/global', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const leaderboard = await User.findAll({
      attributes: ['id', 'username', 'displayName', 'avatar', 'totalPoints', 'level', 'currentStreak'],
      order: [['totalPoints', 'DESC'], ['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: parseInt(offset) + index + 1,
      ...user.toJSON(),
    }));

    // Get total user count
    const totalUsers = await User.count();

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      totalUsers,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message,
    });
  }
});

// Get weekly leaderboard
router.get('/weekly', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const weekStart = getWeekStart();
    
    const leaderboard = await User.findAll({
      attributes: [
        'id', 'username', 'displayName', 'avatar', 
        'weeklyPoints', 'level', 'currentStreak', 
        'lastWeekRank', 'weeklyRank'
      ],
      where: {
        weeklyPoints: { [Op.gt]: 0 }
      },
      order: [['weeklyPoints', 'DESC'], ['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Add rank and rank change
    const rankedLeaderboard = leaderboard.map((user, index) => {
      const currentRank = parseInt(offset) + index + 1;
      const lastRank = user.lastWeekRank || null;
      const rankChange = lastRank ? lastRank - currentRank : null;
      
      return {
        rank: currentRank,
        rankChange,
        ...user.toJSON(),
      };
    });

    const totalUsers = await User.count({
      where: { weeklyPoints: { [Op.gt]: 0 } }
    });

    // Calculate time until next reset
    const nextMonday = new Date(weekStart);
    nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
    const timeUntilReset = nextMonday - new Date();

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      totalUsers,
      weekStart: weekStart.toISOString(),
      weekEnd: nextMonday.toISOString(),
      timeUntilReset,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly leaderboard',
      error: error.message,
    });
  }
});

// Get city leaderboard
router.get('/city/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // For now, return global leaderboard (city-specific implementation can be added later)
    const leaderboard = await User.findAll({
      attributes: ['id', 'username', 'displayName', 'avatar', 'totalPoints', 'level', 'currentStreak'],
      order: [['totalPoints', 'DESC'], ['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: parseInt(offset) + index + 1,
      ...user.toJSON(),
    }));

    const totalUsers = await User.count();

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      cityId,
      totalUsers,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching city leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch city leaderboard',
      error: error.message,
    });
  }
});

// Get user rank
router.get('/rank/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'displayName', 'avatar', 'totalPoints', 'level', 'currentStreak'],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Calculate user's rank
    const rank = await User.count({
      where: {
        [Op.or]: [
          { totalPoints: { [Op.gt]: user.totalPoints } },
          {
            totalPoints: user.totalPoints,
            createdAt: { [Op.lt]: user.createdAt }
          }
        ]
      }
    }) + 1;

    const totalUsers = await User.count();
    const percentile = ((totalUsers - rank + 1) / totalUsers * 100).toFixed(1);

    res.json({
      success: true,
      rank,
      totalUsers,
      percentile: parseFloat(percentile),
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user rank',
      error: error.message,
    });
  }
});

// Update user points (called when user completes activities)
router.post('/update-points', async (req, res) => {
  try {
    const { userId, points, activityType } = req.body;

    if (!userId || !points) {
      return res.status(400).json({
        success: false,
        message: 'userId and points are required',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if we need to reset weekly points
    const weekStart = getWeekStart();
    if (!user.weekStartDate || new Date(user.weekStartDate) < weekStart) {
      // New week started, save last week's data
      user.lastWeekPoints = user.weeklyPoints;
      user.lastWeekRank = user.weeklyRank;
      user.weeklyPoints = 0;
      user.weekStartDate = weekStart;
    }

    // Check for active power-ups and apply multipliers
    const activePowerups = await PowerUp.findAll({
      where: {
        userId,
        status: 'active',
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    let totalMultiplier = 1;
    if (activePowerups.length > 0) {
      // Add all multipliers (e.g., 2.0x + 1.5x = 3.5x total)
      totalMultiplier = activePowerups.reduce((sum, p) => sum + (p.multiplier - 1), 1);
    }

    const finalPoints = Math.floor(parseInt(points) * totalMultiplier);

    // Update user points
    const oldPoints = user.totalPoints;
    const oldWeeklyPoints = user.weeklyPoints;
    
    user.totalPoints = parseInt(user.totalPoints) + finalPoints;
    user.weeklyPoints = parseInt(user.weeklyPoints) + finalPoints;
    await user.save();

    // Calculate new rank
    const newRank = await User.count({
      where: {
        [Op.or]: [
          { totalPoints: { [Op.gt]: user.totalPoints } },
          {
            totalPoints: user.totalPoints,
            createdAt: { [Op.lt]: user.createdAt }
          }
        ]
      }
    }) + 1;

    const oldRank = await User.count({
      where: {
        [Op.or]: [
          { totalPoints: { [Op.gt]: oldPoints } },
          {
            totalPoints: oldPoints,
            createdAt: { [Op.lt]: user.createdAt }
          }
        ]
      }
    }) + 1;

    const rankChange = oldRank - newRank;

    // Calculate weekly rank
    const weeklyRank = await User.count({
      where: {
        [Op.or]: [
          { weeklyPoints: { [Op.gt]: user.weeklyPoints } },
          {
            weeklyPoints: user.weeklyPoints,
            createdAt: { [Op.lt]: user.createdAt }
          }
        ]
      }
    }) + 1;

    // Update user's weekly rank
    user.weeklyRank = weeklyRank;
    await user.save();

    // Check for achievement unlocks
    let newAchievements = [];
    try {
      newAchievements = await checkAchievements(userId);
    } catch (error) {
      console.error('Error checking achievements:', error);
    }

    res.json({
      success: true,
      newTotal: user.totalPoints,
      weeklyPoints: user.weeklyPoints,
      pointsEarned: finalPoints,
      basePoints: points,
      multiplier: totalMultiplier,
      newRank,
      oldRank,
      rankChange,
      weeklyRank,
      activityType,
      newAchievements
    });

    // Emit socket event for real-time update (will be handled by socket.io)
    if (req.app.get('io')) {
      req.app.get('io').emit('points_earned', {
        userId: user.id,
        username: user.username,
        points: points,
        newTotal: user.totalPoints,
        newRank,
        rankChange,
        activityType,
        timestamp: new Date().toISOString(),
      });

      // Emit leaderboard update
      req.app.get('io').emit('leaderboard_updated', {
        userId: user.id,
        newRank,
        oldRank,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error updating user points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update points',
      error: error.message,
    });
  }
});

// Get friends leaderboard
router.get('/friends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'weekly' } = req.query; // 'weekly' or 'total'

    // Get user's friends
    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' }
        ]
      }
    });

    // Extract friend IDs
    const friendIds = friendships.map(f => 
      f.userId === userId ? f.friendId : f.userId
    );

    // Include the user themselves in the leaderboard
    friendIds.push(userId);

    if (friendIds.length === 0) {
      return res.json({
        success: true,
        leaderboard: [],
        totalFriends: 0
      });
    }

    // Get leaderboard based on type
    const orderField = type === 'weekly' ? 'weeklyPoints' : 'totalPoints';
    const leaderboard = await User.findAll({
      where: {
        id: { [Op.in]: friendIds }
      },
      attributes: [
        'id', 'username', 'displayName', 'avatar', 
        'totalPoints', 'weeklyPoints', 'level', 'currentStreak'
      ],
      order: [[orderField, 'DESC'], ['createdAt', 'ASC']]
    });

    // Add rank
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      isCurrentUser: user.id === userId,
      ...user.toJSON()
    }));

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      totalFriends: friendIds.length - 1, // Exclude self
      type
    });
  } catch (error) {
    console.error('Error fetching friends leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch friends leaderboard',
      error: error.message
    });
  }
});

// Get squads leaderboard
router.get('/squads', async (req, res) => {
  try {
    const { limit = 50, offset = 0, type = 'weekly' } = req.query;

    // Get squads based on type
    const orderField = type === 'weekly' ? 'weeklyPoints' : 'totalPoints';
    const squads = await Squad.findAll({
      attributes: [
        'id', 'name', 'totalPoints', 'weeklyPoints', 
        'memberCount', 'type', 'region'
      ],
      include: [
        {
          model: User,
          as: 'leader',
          attributes: ['id', 'username', 'level', 'avatar']
        }
      ],
      order: [[orderField, 'DESC'], ['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Add rank
    const rankedLeaderboard = squads.map((squad, index) => ({
      rank: parseInt(offset) + index + 1,
      ...squad.toJSON()
    }));

    const totalSquads = await Squad.count();

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      totalSquads,
      type
    });
  } catch (error) {
    console.error('Error fetching squads leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch squads leaderboard',
      error: error.message
    });
  }
});

// Calculate advanced score (NEW ENDPOINT)
router.post('/calculate-score', async (req, res) => {
  try {
    const {
      userId,
      basePoints = 100,
      poiRarity = 'common',
      photoData = null,
      distance = null,
      isFirstVisit = false
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Get user for streak info
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get active power-ups
    const activePowerups = await PowerUp.findAll({
      where: {
        userId,
        status: 'active',
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    // Calculate score
    const scoreResult = calculateAdvancedScore({
      basePoints,
      poiRarity,
      streakDays: user.currentStreak || 0,
      photoData,
      distance,
      isFirstVisit,
      activePowerups
    });

    res.json({
      success: true,
      ...scoreResult
    });
  } catch (error) {
    console.error('Error calculating score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate score'
    });
  }
});

module.exports = router;
