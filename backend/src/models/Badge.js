const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Badge = sequelize.define('Badge', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM(
        'achievement',
        'milestone',
        'explorer',
        'specialist',
        'social',
        'seasonal',
        'challenge'
      ),
      defaultValue: 'achievement'
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
      defaultValue: 'common'
    },
    criteria: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Requirements to earn badge (e.g., {submissions: 10, category: "museum"})'
    },
    pointsBonus: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'One-time points awarded when earned'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    earnCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'How many users have earned this badge'
    }
  }, {
    tableName: 'badges',
    timestamps: true
  });

  return Badge;
};
