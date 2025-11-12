const express = require('express');
const { Op } = require('sequelize');
const { Leaderboard, User } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get leaderboard
router.get('/', auth, async (req, res) => {
  try {
    const { period = 'all_time', city, limit = 50 } = req.query;

    const whereClause = { period };
    if (city) whereClause.city = city;

    // Get current period dates
    const { periodStart, periodEnd } = getPeriodDates(period);
    whereClause.periodStart = periodStart;
    whereClause.periodEnd = periodEnd;

    const leaderboard = await Leaderboard.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatar', 'level']
        }
      ],
      order: [['rank', 'ASC']],
      limit: parseInt(limit)
    });

    // Find current user's rank
    const userEntry = await Leaderboard.findOne({
      where: {
        ...whereClause,
        userId: req.user.id
      }
    });

    res.json({
      leaderboard,
      userRank: userEntry ? userEntry.rank : null,
      userPoints: userEntry ? userEntry.points : 0,
      period,
      periodStart,
      periodEnd
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user rank
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { period = 'all_time' } = req.query;
    const { periodStart, periodEnd } = getPeriodDates(period);

    const userEntry = await Leaderboard.findOne({
      where: {
        userId: req.params.userId,
        period,
        periodStart,
        periodEnd
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatar', 'level']
        }
      ]
    });

    if (!userEntry) {
      return res.status(404).json({ error: 'User not found in leaderboard' });
    }

    res.json(userEntry);
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ error: 'Failed to fetch user rank' });
  }
});

// Helper function to get period dates
function getPeriodDates(period) {
  const now = new Date();
  let periodStart, periodEnd;

  switch (period) {
    case 'daily':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 1);
      break;
    case 'weekly':
      const dayOfWeek = now.getDay();
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - dayOfWeek);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 7);
      break;
    case 'monthly':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'all_time':
    default:
      periodStart = new Date('2000-01-01');
      periodEnd = new Date('2100-01-01');
      break;
  }

  return { periodStart, periodEnd };
}

module.exports = router;
