const express = require('express');
const router = express.Router();
const { User, Achievement, UserAchievement, Friendship, SquadMember } = require('../models');
const { Op } = require('sequelize');

// Get all achievements
router.get('/all', async (req, res) => {
  try {
    const achievements = await Achievement.findAll({
      order: [['category', 'ASC'], ['requirement', 'ASC']]
    });

    res.json({
      success: true,
      achievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements'
    });
  }
});

// Get user's achievements
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userAchievements = await UserAchievement.findAll({
      where: { userId },
      include: [
        {
          model: Achievement,
          as: 'achievement'
        }
      ],
      order: [['unlockedAt', 'DESC']]
    });

    res.json({
      success: true,
      achievements: userAchievements
    });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user achievements'
    });
  }
});

// Check and unlock achievements for user
router.post('/check/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const unlockedAchievements = await checkAchievements(userId);

    res.json({
      success: true,
      newUnlocks: unlockedAchievements.length,
      achievements: unlockedAchievements
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check achievements'
    });
  }
});

// Achievement checking logic
async function checkAchievements(userId) {
  const user = await User.findByPk(userId);
  if (!user) return [];

  const allAchievements = await Achievement.findAll();
  const userAchievements = await UserAchievement.findAll({
    where: { userId },
    attributes: ['achievementId']
  });

  const unlockedIds = userAchievements.map(ua => ua.achievementId);
  const newUnlocks = [];

  for (const achievement of allAchievements) {
    // Skip if already unlocked
    if (unlockedIds.includes(achievement.id)) continue;

    let shouldUnlock = false;

    switch (achievement.key) {
      // Leaderboard achievements
      case 'top_10':
      case 'top_100':
      case 'rank_1':
      case 'weekly_winner':
      case 'city_leader': {
        // Check user's rank (simplified - in production, fetch actual rank)
        const rank = await getUserGlobalRank(userId);
        if (rank <= achievement.requirement) {
          shouldUnlock = true;
        }
        break;
      }

      // Points achievements
      case 'points_1000':
      case 'points_5000':
      case 'points_10000':
      case 'points_50000':
      case 'points_100000': {
        if (user.totalPoints >= achievement.requirement) {
          shouldUnlock = true;
        }
        break;
      }

      // Streak achievements
      case 'streak_7':
      case 'streak_30':
      case 'streak_100':
      case 'streak_365': {
        if (user.currentStreak >= achievement.requirement) {
          shouldUnlock = true;
        }
        break;
      }

      // Social achievements
      case 'friends_5':
      case 'friends_20': {
        const friendCount = await Friendship.count({
          where: {
            [Op.or]: [
              { userId, status: 'accepted' },
              { friendId: userId, status: 'accepted' }
            ]
          }
        });
        if (friendCount >= achievement.requirement) {
          shouldUnlock = true;
        }
        break;
      }

      case 'squad_join': {
        const squadMembership = await SquadMember.findOne({
          where: { userId }
        });
        if (squadMembership) {
          shouldUnlock = true;
        }
        break;
      }

      case 'squad_create': {
        const squadMembership = await SquadMember.findOne({
          where: { userId, role: 'leader' }
        });
        if (squadMembership) {
          shouldUnlock = true;
        }
        break;
      }

      // Special achievements
      case 'first_quest': {
        // Check if user has completed at least one quest
        // This would need to check submissions table
        break;
      }

      case 'overachiever': {
        if (unlockedIds.length >= achievement.requirement) {
          shouldUnlock = true;
        }
        break;
      }
    }

    if (shouldUnlock) {
      const userAchievement = await UserAchievement.create({
        userId,
        achievementId: achievement.id,
        unlockedAt: new Date(),
        progress: achievement.requirement
      });

      // Award bonus points
      if (achievement.rewardPoints > 0) {
        user.totalPoints += achievement.rewardPoints;
        await user.save();
      }

      newUnlocks.push({
        ...achievement.toJSON(),
        unlockedAt: userAchievement.unlockedAt
      });
    }
  }

  return newUnlocks;
}

// Helper function to get user's global rank
async function getUserGlobalRank(userId) {
  const user = await User.findByPk(userId);
  if (!user) return 999999;

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

  return rank;
}

// Export the checking function for use in other routes
module.exports = router;
module.exports.checkAchievements = checkAchievements;
