const express = require('express');
const { Reward, RewardRedemption, User } = require('../models');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// Get available rewards
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const whereClause = { isActive: true };

    if (type) whereClause.type = type;

    const rewards = await Reward.findAll({
      where: whereClause,
      order: [['pointsCost', 'ASC']]
    });

    res.json(rewards);
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// Redeem reward
router.post('/:id/redeem', auth, async (req, res) => {
  try {
    const reward = await Reward.findByPk(req.params.id);

    if (!reward || !reward.isActive) {
      return res.status(404).json({ error: 'Reward not found or inactive' });
    }

    // Check if user has enough points
    if (req.user.totalPoints < reward.pointsCost) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Check stock
    if (reward.remainingStock !== null && reward.remainingStock <= 0) {
      return res.status(400).json({ error: 'Reward out of stock' });
    }

    // Check redemption limit per user
    if (reward.redemptionLimit) {
      const userRedemptions = await RewardRedemption.count({
        where: {
          userId: req.user.id,
          rewardId: reward.id,
          status: { [require('sequelize').Op.ne]: 'cancelled' }
        }
      });

      if (userRedemptions >= reward.redemptionLimit) {
        return res.status(400).json({ error: 'Redemption limit reached for this reward' });
      }
    }

    // Check cooldown
    if (reward.cooldownDays > 0) {
      const lastRedemption = await RewardRedemption.findOne({
        where: {
          userId: req.user.id,
          rewardId: reward.id,
          status: { [require('sequelize').Op.ne]: 'cancelled' }
        },
        order: [['redeemedAt', 'DESC']]
      });

      if (lastRedemption) {
        const daysSinceLastRedemption = Math.floor(
          (new Date() - new Date(lastRedemption.redeemedAt)) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastRedemption < reward.cooldownDays) {
          return res.status(400).json({
            error: `Cooldown active. Wait ${reward.cooldownDays - daysSinceLastRedemption} more days`
          });
        }
      }
    }

    // Generate redemption code
    const redemptionCode = crypto.randomBytes(8).toString('hex').toUpperCase();

    // Calculate expiration
    const expiresAt = reward.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    // Create redemption
    const redemption = await RewardRedemption.create({
      userId: req.user.id,
      rewardId: reward.id,
      redemptionCode,
      pointsSpent: reward.pointsCost,
      expiresAt
    });

    // Deduct points
    await req.user.update({
      totalPoints: req.user.totalPoints - reward.pointsCost
    });

    // Update stock
    if (reward.remainingStock !== null) {
      await reward.update({
        remainingStock: reward.remainingStock - 1
      });
    }

    await reward.increment('redemptionCount');

    res.json({
      redemption: await RewardRedemption.findByPk(redemption.id, {
        include: ['reward', 'user']
      })
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ error: 'Failed to redeem reward' });
  }
});

// Get user's redemptions
router.get('/my-redemptions', auth, async (req, res) => {
  try {
    const redemptions = await RewardRedemption.findAll({
      where: { userId: req.user.id },
      include: ['reward'],
      order: [['redeemedAt', 'DESC']]
    });

    res.json(redemptions);
  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({ error: 'Failed to fetch redemptions' });
  }
});

// Validate redemption code (for partners)
router.post('/validate', auth, async (req, res) => {
  try {
    const { code } = req.body;

    const redemption = await RewardRedemption.findOne({
      where: { redemptionCode: code },
      include: ['reward', 'user']
    });

    if (!redemption) {
      return res.status(404).json({ error: 'Invalid redemption code' });
    }

    if (redemption.status !== 'active') {
      return res.status(400).json({ error: `Redemption is ${redemption.status}` });
    }

    if (new Date() > new Date(redemption.expiresAt)) {
      await redemption.update({ status: 'expired' });
      return res.status(400).json({ error: 'Redemption has expired' });
    }

    res.json({
      valid: true,
      redemption
    });
  } catch (error) {
    console.error('Validate redemption error:', error);
    res.status(500).json({ error: 'Failed to validate redemption' });
  }
});

// Mark redemption as used (for partners)
router.post('/:id/use', auth, async (req, res) => {
  try {
    const redemption = await RewardRedemption.findByPk(req.params.id);

    if (!redemption) {
      return res.status(404).json({ error: 'Redemption not found' });
    }

    if (redemption.status !== 'active') {
      return res.status(400).json({ error: `Redemption is ${redemption.status}` });
    }

    await redemption.update({
      status: 'used',
      usedAt: new Date()
    });

    res.json({ message: 'Redemption marked as used', redemption });
  } catch (error) {
    console.error('Use redemption error:', error);
    res.status(500).json({ error: 'Failed to mark redemption as used' });
  }
});

module.exports = router;
