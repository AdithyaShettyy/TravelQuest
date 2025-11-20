require('dotenv').config();
const { Achievement, sequelize } = require('./models');

const achievements = [
  // Leaderboard Achievements
  {
    key: 'top_10',
    name: 'Elite Explorer',
    description: 'Reach top 10 in global leaderboard',
    icon: '🏆',
    category: 'leaderboard',
    requirement: 10,
    rewardPoints: 500,
    rarity: 'epic'
  },
  {
    key: 'top_100',
    name: 'Rising Star',
    description: 'Reach top 100 in global leaderboard',
    icon: '⭐',
    category: 'leaderboard',
    requirement: 100,
    rewardPoints: 100,
    rarity: 'uncommon'
  },
  {
    key: 'rank_1',
    name: 'Champion',
    description: 'Reach #1 in global leaderboard',
    icon: '👑',
    category: 'leaderboard',
    requirement: 1,
    rewardPoints: 2000,
    rarity: 'legendary'
  },
  {
    key: 'weekly_winner',
    name: 'Weekly Champion',
    description: 'Win the weekly leaderboard',
    icon: '🥇',
    category: 'leaderboard',
    requirement: 1,
    rewardPoints: 1000,
    rarity: 'rare'
  },
  {
    key: 'city_leader',
    name: 'City Champion',
    description: 'Reach #1 in your city leaderboard',
    icon: '🌆',
    category: 'leaderboard',
    requirement: 1,
    rewardPoints: 300,
    rarity: 'rare'
  },

  // Points Achievements
  {
    key: 'points_1000',
    name: 'Getting Started',
    description: 'Earn 1,000 total points',
    icon: '🎯',
    category: 'points',
    requirement: 1000,
    rewardPoints: 50,
    rarity: 'common'
  },
  {
    key: 'points_5000',
    name: 'Explorer',
    description: 'Earn 5,000 total points',
    icon: '🗺️',
    category: 'points',
    requirement: 5000,
    rewardPoints: 200,
    rarity: 'uncommon'
  },
  {
    key: 'points_10000',
    name: 'Adventurer',
    description: 'Earn 10,000 total points',
    icon: '🏔️',
    category: 'points',
    requirement: 10000,
    rewardPoints: 500,
    rarity: 'rare'
  },
  {
    key: 'points_50000',
    name: 'Master Explorer',
    description: 'Earn 50,000 total points',
    icon: '🌟',
    category: 'points',
    requirement: 50000,
    rewardPoints: 2000,
    rarity: 'epic'
  },
  {
    key: 'points_100000',
    name: 'Legend',
    description: 'Earn 100,000 total points',
    icon: '💫',
    category: 'points',
    requirement: 100000,
    rewardPoints: 5000,
    rarity: 'legendary'
  },

  // Streak Achievements
  {
    key: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain 7-day streak',
    icon: '🔥',
    category: 'streak',
    requirement: 7,
    rewardPoints: 100,
    rarity: 'common'
  },
  {
    key: 'streak_30',
    name: 'Dedicated Explorer',
    description: 'Maintain 30-day streak',
    icon: '🔥',
    category: 'streak',
    requirement: 30,
    rewardPoints: 500,
    rarity: 'rare'
  },
  {
    key: 'streak_100',
    name: 'Unstoppable',
    description: 'Maintain 100-day streak',
    icon: '🔥',
    category: 'streak',
    requirement: 100,
    rewardPoints: 2000,
    rarity: 'epic'
  },
  {
    key: 'streak_365',
    name: 'Year-Round Explorer',
    description: 'Maintain 365-day streak',
    icon: '🔥',
    category: 'streak',
    requirement: 365,
    rewardPoints: 10000,
    rarity: 'legendary'
  },

  // Social Achievements
  {
    key: 'friends_5',
    name: 'Social Butterfly',
    description: 'Add 5 friends',
    icon: '👥',
    category: 'social',
    requirement: 5,
    rewardPoints: 50,
    rarity: 'common'
  },
  {
    key: 'friends_20',
    name: 'Popular Explorer',
    description: 'Add 20 friends',
    icon: '🎉',
    category: 'social',
    requirement: 20,
    rewardPoints: 200,
    rarity: 'uncommon'
  },
  {
    key: 'squad_join',
    name: 'Team Player',
    description: 'Join a squad',
    icon: '🛡️',
    category: 'social',
    requirement: 1,
    rewardPoints: 100,
    rarity: 'common'
  },
  {
    key: 'squad_create',
    name: 'Squad Leader',
    description: 'Create a squad',
    icon: '👑',
    category: 'social',
    requirement: 1,
    rewardPoints: 200,
    rarity: 'uncommon'
  },
  {
    key: 'squad_top_10',
    name: 'Elite Squad',
    description: 'Get your squad to top 10',
    icon: '🏆',
    category: 'social',
    requirement: 10,
    rewardPoints: 1000,
    rarity: 'epic'
  },

  // Special Achievements
  {
    key: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a quest before 8 AM',
    icon: '🌅',
    category: 'special',
    requirement: 1,
    rewardPoints: 50,
    rarity: 'uncommon'
  },
  {
    key: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a quest after 10 PM',
    icon: '🦉',
    category: 'special',
    requirement: 1,
    rewardPoints: 50,
    rarity: 'uncommon'
  },
  {
    key: 'photo_perfect',
    name: 'Photographer',
    description: 'Get 10 perfect photo scores',
    icon: '📸',
    category: 'special',
    requirement: 10,
    rewardPoints: 300,
    rarity: 'rare'
  },
  {
    key: 'power_user',
    name: 'Power User',
    description: 'Use 10 power-ups',
    icon: '⚡',
    category: 'special',
    requirement: 10,
    rewardPoints: 200,
    rarity: 'uncommon'
  },
  {
    key: 'first_quest',
    name: 'First Steps',
    description: 'Complete your first quest',
    icon: '🎊',
    category: 'special',
    requirement: 1,
    rewardPoints: 25,
    rarity: 'common'
  },
  {
    key: 'overachiever',
    name: 'Overachiever',
    description: 'Unlock 20 achievements',
    icon: '🌟',
    category: 'special',
    requirement: 20,
    rewardPoints: 1000,
    rarity: 'epic'
  }
];

async function seedAchievements() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Clear existing achievements (optional)
    // await Achievement.destroy({ where: {} });
    // console.log('🗑️  Cleared existing achievements');

    // Insert achievements
    for (const achievement of achievements) {
      await Achievement.findOrCreate({
        where: { key: achievement.key },
        defaults: achievement
      });
    }

    console.log(`✅ Seeded ${achievements.length} achievements`);
    
    // Display summary
    const counts = await Achievement.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category']
    });

    console.log('\n📊 Achievement Summary:');
    counts.forEach(c => {
      console.log(`   ${c.category}: ${c.dataValues.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding achievements:', error);
    process.exit(1);
  }
}

seedAchievements();
