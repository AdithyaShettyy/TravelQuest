const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Friendship = sequelize.define('Friendship', {
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
      },
      comment: 'User who sent the request'
    },
    friendId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who received the request'
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
      defaultValue: 'pending',
      allowNull: false
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'friendId']
      },
      {
        fields: ['userId', 'status']
      },
      {
        fields: ['friendId', 'status']
      }
    ]
  });

  Friendship.associate = (models) => {
    Friendship.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
    Friendship.belongsTo(models.User, { as: 'friend', foreignKey: 'friendId' });
  };

  return Friendship;
};
