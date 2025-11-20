require('dotenv').config();
const cron = require('node-cron');
const { User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper function to get start of current week (Monday 00:00 UTC)
const getWeekStart = () => {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - daysToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
};

// Reward tiers
const REWARD_TIERS = [
  { rank: 1, points: 5000, badge: 'weekly_champion_gold' },
  { rank: 2, points: 3000, badge: 'weekly_champion_silver' },
  { rank: 3, points: 2000, badge: 'weekly_champion_bronze' },
  { rankRange: [4, 10], points: 1000, badge: 'weekly_top_10' },
  { rankRange: [11, 25], points: 500, badge: 'weekly_top_25' },
  { rankRange: [26, 50], points: 250, badge: 'weekly_top_50' },
  { rankRange: [51, 100], points: 100, badge: 'weekly_top_100' }
];

async function distributeWeeklyRewards() {
  try {
    console.log('🎁 Starting weekly rewards distribution...');
    const weekStart = getWeekStart();

    // Get top 100 users by weekly points
    const topUsers = await User.findAll({
      where: {
        weeklyPoints: { [Op.gt]: 0 }
      },
      order: [['weeklyPoints', 'DESC'], ['createdAt', 'ASC']],
      limit: 100
    });

    if (topUsers.length === 0) {
      console.log('ℹ️  No active users this week');
      return;
    }

    let rewardsDistributed = 0;

    // Distribute rewards based on rank
    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      const rank = i + 1;

      // Find applicable reward tier
      let reward = null;
      for (const tier of REWARD_TIERS) {
        if (tier.rank && tier.rank === rank) {
          reward = tier;
          break;
        } else if (tier.rankRange && rank >= tier.rankRange[0] && rank <= tier.rankRange[1]) {
          reward = tier;
          break;
        }
      }

      if (reward) {
        // Award bonus points
        user.totalPoints += reward.points;
        
        // Save last week's data
        user.lastWeekPoints = user.weeklyPoints;
        user.lastWeekRank = rank;
        
        // Reset weekly points
        user.weeklyPoints = 0;
        user.weeklyRank = null;
        user.weekStartDate = new Date();
        
        await user.save();

        console.log(`✅ Rank ${rank}: ${user.username} - ${reward.points} bonus points`);
        rewardsDistributed++;

        // In production, also:
        // - Create badge record
        // - Send push notification
        // - Log to rewards history table
      }
    }

    // Reset weekly points for all other users
    await User.update(
      {
        lastWeekPoints: sequelize.col('weeklyPoints'),
        lastWeekRank: sequelize.col('weeklyRank'),
        weeklyPoints: 0,
        weeklyRank: null,
        weekStartDate: new Date()
      },
      {
        where: {
          id: { [Op.notIn]: topUsers.map(u => u.id) },
          weeklyPoints: { [Op.gt]: 0 }
        }
      }
    );

    console.log(`🎉 Distributed rewards to ${rewardsDistributed} users`);
    console.log(`📊 Top 3 winners:`);
    if (topUsers[0]) console.log(`   🥇 ${topUsers[0].username} - ${topUsers[0].lastWeekPoints} pts`);
    if (topUsers[1]) console.log(`   🥈 ${topUsers[1].username} - ${topUsers[1].lastWeekPoints} pts`);
    if (topUsers[2]) console.log(`   🥉 ${topUsers[2].username} - ${topUsers[2].lastWeekPoints} pts`);

  } catch (error) {
    console.error('❌ Error distributing weekly rewards:', error);
  }
}

// Schedule: Every Monday at 00:01 UTC
// Cron format: minute hour day-of-month month day-of-week
// '1 0 * * 1' = 00:01 on Mondays
function startWeeklyRewardsCron() {
  console.log('⏰ Scheduling weekly rewards cron job...');
  
  cron.schedule('1 0 * * 1', async () => {
    console.log('⏰ Weekly rewards cron triggered');
    await distributeWeeklyRewards();
  }, {
    timezone: 'UTC'
  });

  console.log('✅ Weekly rewards cron job scheduled (Mondays 00:01 UTC)');
}

// Export functions
module.exports = {
  startWeeklyRewardsCron,
  distributeWeeklyRewards // For manual testing
};

// If run directly, execute rewards distribution
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected');
      await distributeWeeklyRewards();
      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}
