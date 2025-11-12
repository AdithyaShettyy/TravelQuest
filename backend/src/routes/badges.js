const express = require('express');
const { Badge, UserBadge, User } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all badges
router.get('/', auth, async (req, res) => {
  try {
    const { category, rarity } = req.query;
    const whereClause = { isActive: true };

    if (category) whereClause.category = category;
    if (rarity) whereClause.rarity = rarity;

    const badges = await Badge.findAll({
      where: whereClause,
      order: [['rarity', 'DESC'], ['createdAt', 'ASC']]
    });

    // Check which badges the user has earned
    const userBadges = await UserBadge.findAll({
      where: { userId: req.user.id },
      attributes: ['badgeId', 'earnedAt']
    });

    const userBadgeMap = {};
    userBadges.forEach(ub => {
      userBadgeMap[ub.badgeId] = ub.earnedAt;
    });

    const badgesWithStatus = badges.map(badge => ({
      ...badge.toJSON(),
      earned: !!userBadgeMap[badge.id],
      earnedAt: userBadgeMap[badge.id] || null
    }));

    res.json(badgesWithStatus);
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Get user's earned badges
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userBadges = await UserBadge.findAll({
      where: { userId: req.params.userId },
      include: [
        {
          model: Badge,
          as: 'badge'
        }
      ],
      order: [['earnedAt', 'DESC']]
    });

    res.json(userBadges);
  } catch (error) {
    console.error('Get user badges error:', error);
    res.status(500).json({ error: 'Failed to fetch user badges' });
  }
});

module.exports = router;
