const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SquadMember = sequelize.define('SquadMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    squadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Squads',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('leader', 'admin', 'member'),
      defaultValue: 'member'
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    pointsContributed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    weeklyPointsContributed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['squadId', 'userId']
      }
    ]
  });

  SquadMember.associate = (models) => {
    SquadMember.belongsTo(models.Squad, { foreignKey: 'squadId' });
    SquadMember.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return SquadMember;
};
