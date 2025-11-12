const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reward = sequelize.define('Reward', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    partnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Partner who offers this reward'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('discount', 'freebie', 'experience', 'voucher', 'merchandise'),
      defaultValue: 'discount'
    },
    pointsCost: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'e.g., "20% off", "$5 discount"'
    },
    terms: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    redemptionLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Max redemptions per user'
    },
    totalAvailable: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Total stock available'
    },
    remainingStock: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cooldownDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Days before user can redeem again'
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: true
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    redemptionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    location: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: true,
      comment: 'Where reward can be redeemed'
    }
  }, {
    tableName: 'rewards',
    timestamps: true
  });

  return Reward;
};
