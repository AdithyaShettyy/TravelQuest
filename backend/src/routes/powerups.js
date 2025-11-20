const express = require('express');
const router = express.Router();
const { User, PowerUp } = require('../models');
const { Op } = require('sequelize');

// Power-up costs and details
const POWERUP_CONFIG = {
  double_points: {
    cost: 100,
    duration: 30, // minutes
    multiplier: 2.0,
    name: 'Double Points',
    description: 'Earn 2x points for 30 minutes'
  },
  perfect_shot: {
    cost: 150,
    duration: 60,
    multiplier: 1.5,
    name: 'Perfect Shot',
    description: 'Bonus points for photo quality for 1 hour'
  },
  city_explorer: {
    cost: 200,
    duration: 120,
    multiplier: 1.3,
    name: 'City Explorer',
    description: 'Extra points for new locations for 2 hours'
  },
  squad_rally: {
    cost: 250,
    duration: 180,
    multiplier: 1.8,
    name: 'Squad Rally',
    description: 'Boost entire squad for 3 hours'
  }
};

// Get all power-ups config
router.get('/config', (req, res) => {
  res.json({
    success: true,
    powerups: POWERUP_CONFIG
  });
});

// Get user's power-ups
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const powerups = await PowerUp.findAll({
      where: {
        userId,
        status: { [Op.in]: ['available', 'active'] }
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      powerups
    });
  } catch (error) {
    console.error('Error fetching user power-ups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch power-ups'
    });
  }
});

// Get active power-ups for user
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const activePowerups = await PowerUp.findAll({
      where: {
        userId,
        status: 'active',
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    // Calculate total multiplier
    const totalMultiplier = activePowerups.reduce((sum, p) => sum + (p.multiplier - 1), 1);

    res.json({
      success: true,
      powerups: activePowerups,
      totalMultiplier
    });
  } catch (error) {
    console.error('Error fetching active power-ups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active power-ups'
    });
  }
});

// Purchase power-up
router.post('/purchase', async (req, res) => {
  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        error: 'userId and type are required'
      });
    }

    const config = POWERUP_CONFIG[type];
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Invalid power-up type'
      });
    }

    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has enough points
    if (user.totalPoints < config.cost) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient points',
        required: config.cost,
        current: user.totalPoints
      });
    }

    // Deduct points
    user.totalPoints -= config.cost;
    await user.save();

    // Create power-up
    const powerup = await PowerUp.create({
      userId,
      type,
      duration: config.duration,
      multiplier: config.multiplier,
      status: 'available'
    });

    res.json({
      success: true,
      message: 'Power-up purchased successfully',
      powerup,
      newBalance: user.totalPoints
    });
  } catch (error) {
    console.error('Error purchasing power-up:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase power-up'
    });
  }
});

// Activate power-up
router.post('/activate', async (req, res) => {
  try {
    const { userId, powerupId } = req.body;

    if (!userId || !powerupId) {
      return res.status(400).json({
        success: false,
        error: 'userId and powerupId are required'
      });
    }

    // Get power-up
    const powerup = await PowerUp.findOne({
      where: {
        id: powerupId,
        userId,
        status: 'available'
      }
    });

    if (!powerup) {
      return res.status(404).json({
        success: false,
        error: 'Power-up not found or already used'
      });
    }

    // Activate power-up
    const now = new Date();
    const expiresAt = new Date(now.getTime() + powerup.duration * 60000);

    powerup.status = 'active';
    powerup.activatedAt = now;
    powerup.expiresAt = expiresAt;
    await powerup.save();

    // Schedule expiration (in production, use a job queue like Bull)
    setTimeout(async () => {
      const p = await PowerUp.findByPk(powerupId);
      if (p && p.status === 'active') {
        p.status = 'expired';
        await p.save();
      }
    }, powerup.duration * 60000);

    res.json({
      success: true,
      message: 'Power-up activated',
      powerup,
      expiresAt
    });
  } catch (error) {
    console.error('Error activating power-up:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate power-up'
    });
  }
});

// Check and expire old power-ups
router.post('/expire-check', async (req, res) => {
  try {
    const expiredCount = await PowerUp.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          expiresAt: { [Op.lt]: new Date() }
        }
      }
    );

    res.json({
      success: true,
      expiredCount: expiredCount[0]
    });
  } catch (error) {
    console.error('Error expiring power-ups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to expire power-ups'
    });
  }
});

module.exports = router;
