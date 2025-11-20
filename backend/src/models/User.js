const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        len: [3, 30]
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    weeklyPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Points earned this week (resets Monday 00:00 UTC)'
    },
    lastWeekPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Points from previous week'
    },
    weeklyRank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Current rank in weekly leaderboard'
    },
    lastWeekRank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Rank from previous week'
    },
    weekStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Start of current week period'
    },
    currentStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastSubmissionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'partner'),
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        notifications: true,
        privacy: 'public',
        theme: 'light'
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
};
