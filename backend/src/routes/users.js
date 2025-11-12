const express = require('express');
const { User, Submission, Badge } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Badge,
          as: 'badges',
          through: { attributes: ['earnedAt', 'displayOrder'] }
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get stats
    const submissionCount = await Submission.count({
      where: { userId: user.id, verificationStatus: 'approved' }
    });

    res.json({
      user,
      stats: {
        totalSubmissions: submissionCount,
        totalPoints: user.totalPoints,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        level: user.level
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.patch('/me', auth, async (req, res) => {
  try {
    const { displayName, avatar, preferences } = req.body;
    const updates = {};

    if (displayName) updates.displayName = displayName;
    if (avatar) updates.avatar = avatar;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    await req.user.update(updates);
    res.json(req.user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get user submissions history
router.get('/:id/submissions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const submissions = await Submission.findAndCountAll({
      where: { userId: req.params.id },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: ['quest']
    });

    res.json({
      submissions: submissions.rows,
      pagination: {
        total: submissions.count,
        page,
        pages: Math.ceil(submissions.count / limit)
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

module.exports = router;
