const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RewardRedemption = sequelize.define('RewardRedemption', {
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
    rewardId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'rewards',
        key: 'id'
      }
    },
    redemptionCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    pointsSpent: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'used', 'expired', 'cancelled'),
      defaultValue: 'active'
    },
    redeemedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'reward_redemptions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['rewardId']
      },
      {
        fields: ['redemptionCode']
      }
    ]
  });

  return RewardRedemption;
};
