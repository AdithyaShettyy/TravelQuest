const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserBadge = sequelize.define('UserBadge', {
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
    badgeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'badges',
        key: 'id'
      }
    },
    earnedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'User-defined display order on profile'
    }
  }, {
    tableName: 'user_badges',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'badgeId']
      }
    ]
  });

  return UserBadge;
};
