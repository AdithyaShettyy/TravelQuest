const express = require('express');
const { POI, Quest, User, Submission, Reward } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(auth);
router.use(adminAuth);

// ============ POI Management ============

// Create POI
router.post('/pois', async (req, res) => {
  try {
    const poi = await POI.create(req.body);
    res.status(201).json(poi);
  } catch (error) {
    console.error('Create POI error:', error);
    res.status(500).json({ error: 'Failed to create POI' });
  }
});

// Update POI
router.patch('/pois/:id', async (req, res) => {
  try {
    const poi = await POI.findByPk(req.params.id);
    if (!poi) {
      return res.status(404).json({ error: 'POI not found' });
    }

    await poi.update(req.body);
    res.json(poi);
  } catch (error) {
    console.error('Update POI error:', error);
    res.status(500).json({ error: 'Failed to update POI' });
  }
});

// Delete POI
router.delete('/pois/:id', async (req, res) => {
  try {
    const poi = await POI.findByPk(req.params.id);
    if (!poi) {
      return res.status(404).json({ error: 'POI not found' });
    }

    await poi.destroy();
    res.json({ message: 'POI deleted' });
  } catch (error) {
    console.error('Delete POI error:', error);
    res.status(500).json({ error: 'Failed to delete POI' });
  }
});

// ============ Quest Management ============

// Create quest
router.post('/quests', async (req, res) => {
  try {
    const quest = await Quest.create(req.body);
    res.status(201).json(quest);
  } catch (error) {
    console.error('Create quest error:', error);
    res.status(500).json({ error: 'Failed to create quest' });
  }
});

// Update quest
router.patch('/quests/:id', async (req, res) => {
  try {
    const quest = await Quest.findByPk(req.params.id);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    await quest.update(req.body);
    res.json(quest);
  } catch (error) {
    console.error('Update quest error:', error);
    res.status(500).json({ error: 'Failed to update quest' });
  }
});

// Delete quest
router.delete('/quests/:id', async (req, res) => {
  try {
    const quest = await Quest.findByPk(req.params.id);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    await quest.destroy();
    res.json({ message: 'Quest deleted' });
  } catch (error) {
    console.error('Delete quest error:', error);
    res.status(500).json({ error: 'Failed to delete quest' });
  }
});

// ============ Submission Moderation ============

// Get pending submissions
router.get('/submissions/pending', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const submissions = await Submission.findAndCountAll({
      where: { verificationStatus: 'pending' },
      include: ['user', 'quest'],
      limit,
      offset,
      order: [['createdAt', 'ASC']]
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
    console.error('Get pending submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Manually approve/reject submission
router.patch('/submissions/:id', async (req, res) => {
  try {
    const { verificationStatus, rejectionReason } = req.body;
    const submission = await Submission.findByPk(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    await submission.update({
      verificationStatus,
      rejectionReason
    });

    res.json(submission);
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// ============ User Management ============

// Get all users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
      limit,
      offset,
      order: [['totalPoints', 'DESC']]
    });

    res.json({
      users: users.rows,
      pagination: {
        total: users.count,
        page,
        pages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ role });
    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Ban/unban user
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ isActive });
    res.json(user);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// ============ Reward Management ============

// Create reward
router.post('/rewards', async (req, res) => {
  try {
    const reward = await Reward.create(req.body);
    res.status(201).json(reward);
  } catch (error) {
    console.error('Create reward error:', error);
    res.status(500).json({ error: 'Failed to create reward' });
  }
});

// Update reward
router.patch('/rewards/:id', async (req, res) => {
  try {
    const reward = await Reward.findByPk(req.params.id);
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    await reward.update(req.body);
    res.json(reward);
  } catch (error) {
    console.error('Update reward error:', error);
    res.status(500).json({ error: 'Failed to update reward' });
  }
});

// ============ Analytics ============

router.get('/analytics', async (req, res) => {
  try {
    const [
      totalUsers,
      totalPOIs,
      totalQuests,
      totalSubmissions,
      approvedSubmissions
    ] = await Promise.all([
      User.count(),
      POI.count(),
      Quest.count(),
      Submission.count(),
      Submission.count({ where: { verificationStatus: 'approved' } })
    ]);

    res.json({
      totalUsers,
      totalPOIs,
      totalQuests,
      totalSubmissions,
      approvedSubmissions,
      approvalRate: totalSubmissions > 0 ? (approvedSubmissions / totalSubmissions * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
