const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Squad = sequelize.define('Squad', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    leaderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    weeklyPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    memberCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 20
    },
    type: {
      type: DataTypes.ENUM('open', 'invite_only', 'region_locked'),
      defaultValue: 'open'
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'For region-locked squads'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  Squad.associate = (models) => {
    Squad.belongsTo(models.User, { as: 'leader', foreignKey: 'leaderId' });
    Squad.hasMany(models.SquadMember, { foreignKey: 'squadId' });
  };

  return Squad;
};
