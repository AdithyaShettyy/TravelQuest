const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserAchievement = sequelize.define('UserAchievement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    achievementId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'achievements',
        key: 'id'
      }
    },
    unlockedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Current progress towards achievement'
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'achievementId']
      }
    ]
  });

  UserAchievement.associate = (models) => {
    UserAchievement.belongsTo(models.User, { foreignKey: 'userId' });
    UserAchievement.belongsTo(models.Achievement, { foreignKey: 'achievementId' });
  };

  return UserAchievement;
};
