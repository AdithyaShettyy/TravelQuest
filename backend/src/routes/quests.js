const express = require('express');
const { Quest, POI, Submission } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all active quests
router.get('/', async (req, res) => {
  try {
    const { difficulty, type, poiId } = req.query;
    const whereClause = { isActive: true };

    if (difficulty) whereClause.difficulty = difficulty;
    if (type) whereClause.type = type;
    if (poiId) whereClause.poiId = poiId;

    const quests = await Quest.findAll({
      where: whereClause,
      include: [
        {
          model: POI,
          as: 'poi'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(quests);
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

// Get quest by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const quest = await Quest.findByPk(req.params.id, {
      include: [
        {
          model: POI,
          as: 'poi'
        }
      ]
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    // Check if user has completed this quest
    const userSubmission = await Submission.findOne({
      where: {
        userId: req.user.id,
        questId: quest.id,
        verificationStatus: 'approved'
      }
    });

    res.json({
      quest,
      completed: !!userSubmission,
      userSubmission
    });
  } catch (error) {
    console.error('Get quest error:', error);
    res.status(500).json({ error: 'Failed to fetch quest' });
  }
});

// Get quest leaderboard
router.get('/:id/leaderboard', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topSubmissions = await Submission.findAll({
      where: {
        questId: req.params.id,
        verificationStatus: 'approved'
      },
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatar']
        }
      ],
      order: [
        ['pointsAwarded', 'DESC'],
        ['verificationScore', 'DESC'],
        ['createdAt', 'ASC']
      ],
      limit
    });

    res.json(topSubmissions);
  } catch (error) {
    console.error('Get quest leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
