const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const { Submission, Quest, User, Badge, UserBadge } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'submission-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|heic/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Submit photo for quest
router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    const { questId, latitude, longitude, exifData, deviceInfo } = req.body;

    if (!questId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Quest ID and location are required' });
    }

    // Get quest details
    const quest = await Quest.findByPk(questId, { include: ['poi'] });
    if (!quest || !quest.isActive) {
      return res.status(404).json({ error: 'Quest not found or inactive' });
    }

    // Create submission
    const submission = await Submission.create({
      userId: req.user.id,
      questId,
      photoUrl: `/uploads/${req.file.filename}`,
      captureLocation: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      exifData: exifData ? JSON.parse(exifData) : {},
      deviceInfo: deviceInfo ? JSON.parse(deviceInfo) : {},
      verificationStatus: 'pending'
    });

    // Call verification service
    try {
      const verificationResponse = await axios.post(
        `${process.env.VERIFICATION_SERVICE_URL}/verify`,
        {
          submissionId: submission.id,
          submittedPhotoPath: req.file.path,
          referencePhotoPath: quest.referenceImage,
          submittedLocation: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
          referenceLocation: quest.poi.location.coordinates,
          verificationRadius: quest.verificationRadius,
          referenceMetadata: quest.referenceMetadata
        },
        {
          timeout: 30000
        }
      );

      const verificationResult = verificationResponse.data;

      // Update submission with verification results
      await submission.update({
        verificationStatus: verificationResult.passed ? 'approved' : 'rejected',
        verificationScore: verificationResult.score,
        verificationDetails: verificationResult.details,
        rejectionReason: verificationResult.rejectionReason
      });

      // If approved, calculate and award points
      if (verificationResult.passed) {
        const points = await calculatePoints(req.user, quest, verificationResult);
        await submission.update({ pointsAwarded: points.total, multipliers: points.multipliers });
        await req.user.update({ totalPoints: req.user.totalPoints + points.total });
        await updateStreak(req.user);
        await quest.increment('completionCount');
        await quest.poi.increment('visitCount');
        await checkAndAwardBadges(req.user);
      }

      res.json({
        submission: await Submission.findByPk(submission.id, { include: ['quest', 'user'] }),
        verification: verificationResult
      });
    } catch (verificationError) {
      console.error('Verification service error:', verificationError);
      res.json({
        submission,
        message: 'Submission created, verification pending'
      });
    }
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

// Calculate points with multipliers
async function calculatePoints(user, quest, verificationResult) {
  let basePoints = quest.basePoints;
  const multipliers = {};

  // Difficulty multiplier
  const difficultyMultipliers = { easy: 1.0, medium: 1.2, hard: 1.5, expert: 2.0 };
  multipliers.difficulty = difficultyMultipliers[quest.difficulty] || 1.0;

  // Verification quality bonus (higher similarity = more points)
  multipliers.quality = Math.min(1.0 + (verificationResult.score - 70) / 100, 1.3);

  // Streak multiplier
  multipliers.streak = Math.min(1.0 + (user.currentStreak * 0.05), 2.0);

  // First completion bonus
  const previousSubmissions = await Submission.count({
    where: { questId: quest.id, verificationStatus: 'approved' }
  });
  if (previousSubmissions === 0) {
    multipliers.firstCompletion = 1.5;
  }

  // Calculate total
  let total = basePoints;
  Object.values(multipliers).forEach(mult => {
    total *= mult;
  });

  return {
    base: basePoints,
    total: Math.round(total),
    multipliers
  };
}

// Update user streak
async function updateStreak(user) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastSubmission = user.lastSubmissionDate ? new Date(user.lastSubmissionDate) : null;

  if (lastSubmission) {
    lastSubmission.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastSubmission) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no streak change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      const newStreak = user.currentStreak + 1;
      await user.update({
        currentStreak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak),
        lastSubmissionDate: new Date()
      });
    } else {
      // Streak broken
      await user.update({
        currentStreak: 1,
        lastSubmissionDate: new Date()
      });
    }
  } else {
    // First submission
    await user.update({
      currentStreak: 1,
      longestStreak: 1,
      lastSubmissionDate: new Date()
    });
  }
}

// Check and award badges
async function checkAndAwardBadges(user) {
  const badges = await Badge.findAll({ where: { isActive: true } });

  for (const badge of badges) {
    const hasbadge = await UserBadge.findOne({
      where: { userId: user.id, badgeId: badge.id }
    });

    if (!hasBadge) {
      const earned = await checkBadgeCriteria(user, badge.criteria);
      if (earned) {
        await UserBadge.create({ userId: user.id, badgeId: badge.id });
        await user.update({ totalPoints: user.totalPoints + badge.pointsBonus });
        await badge.increment('earnCount');
      }
    }
  }
}

// Check if user meets badge criteria
async function checkBadgeCriteria(user, criteria) {
  if (criteria.submissions) {
    const count = await Submission.count({
      where: { userId: user.id, verificationStatus: 'approved' }
    });
    if (count < criteria.submissions) return false;
  }

  if (criteria.streak) {
    if (user.currentStreak < criteria.streak) return false;
  }

  if (criteria.totalPoints) {
    if (user.totalPoints < criteria.totalPoints) return false;
  }

  return true;
}

// Get submission by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.id, {
      include: ['user', 'quest']
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

module.exports = router;
