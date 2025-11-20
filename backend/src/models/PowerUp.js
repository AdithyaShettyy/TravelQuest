const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PowerUp = sequelize.define('PowerUp', {
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
    type: {
      type: DataTypes.ENUM('double_points', 'perfect_shot', 'city_explorer', 'squad_rally'),
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration in minutes'
    },
    activatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('available', 'active', 'expired', 'used'),
      defaultValue: 'available'
    },
    multiplier: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
      comment: 'Points multiplier (e.g., 2.0 for double points)'
    }
  });

  PowerUp.associate = (models) => {
    PowerUp.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return PowerUp;
};
