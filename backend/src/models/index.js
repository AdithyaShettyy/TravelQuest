const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'tourism_platform',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const User = require('./User')(sequelize);
const POI = require('./POI')(sequelize);
const Quest = require('./Quest')(sequelize);
const Submission = require('./Submission')(sequelize);
const Badge = require('./Badge')(sequelize);
const UserBadge = require('./UserBadge')(sequelize);
const Reward = require('./Reward')(sequelize);
const RewardRedemption = require('./RewardRedemption')(sequelize);
const Leaderboard = require('./Leaderboard')(sequelize);

// Define associations
User.hasMany(Submission, { foreignKey: 'userId', as: 'submissions' });
Submission.belongsTo(User, { foreignKey: 'userId', as: 'user' });

POI.hasMany(Quest, { foreignKey: 'poiId', as: 'quests' });
Quest.belongsTo(POI, { foreignKey: 'poiId', as: 'poi' });

Quest.hasMany(Submission, { foreignKey: 'questId', as: 'submissions' });
Submission.belongsTo(Quest, { foreignKey: 'questId', as: 'quest' });

User.belongsToMany(Badge, { through: UserBadge, foreignKey: 'userId', as: 'badges' });
Badge.belongsToMany(User, { through: UserBadge, foreignKey: 'badgeId', as: 'users' });

User.hasMany(RewardRedemption, { foreignKey: 'userId', as: 'redemptions' });
RewardRedemption.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Reward.hasMany(RewardRedemption, { foreignKey: 'rewardId', as: 'redemptions' });
RewardRedemption.belongsTo(Reward, { foreignKey: 'rewardId', as: 'reward' });

module.exports = {
  sequelize,
  User,
  POI,
  Quest,
  Submission,
  Badge,
  UserBadge,
  Reward,
  RewardRedemption,
  Leaderboard
};
