const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Achievement = sequelize.define('Achievement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique identifier for achievement'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('leaderboard', 'points', 'streak', 'social', 'special'),
      defaultValue: 'leaderboard'
    },
    requirement: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Threshold to unlock (e.g., reach rank 1, earn 10000 points)'
    },
    rewardPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Bonus points awarded on unlock'
    },
    rarity: {
      type: DataTypes.ENUM('common', 'uncommon', 'rare', 'epic', 'legendary'),
      defaultValue: 'common'
    }
  });

  return Achievement;
};
