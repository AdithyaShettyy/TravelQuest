const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Leaderboard = sequelize.define('Leaderboard', {
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
    period: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'all_time'),
      allowNull: false
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'For city-specific leaderboards'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'For category-specific leaderboards'
    }
  }, {
    tableName: 'leaderboards',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['period', 'periodStart']
      },
      {
        fields: ['city']
      },
      {
        fields: ['rank']
      }
    ]
  });

  return Leaderboard;
};
