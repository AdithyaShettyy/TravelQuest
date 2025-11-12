const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Submission = sequelize.define('Submission', {
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
    questId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'quests',
        key: 'id'
      }
    },
    photoUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    captureLocation: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: false
    },
    captureTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    exifData: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
      defaultValue: 'pending'
    },
    verificationScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Similarity score 0-100'
    },
    verificationDetails: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'pHash match, SSIM score, GPS check, etc'
    },
    pointsAwarded: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    multipliers: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Streak, squad, time bonuses applied'
    },
    rejectionReason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deviceInfo: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    attemptNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    tableName: 'submissions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['questId']
      },
      {
        fields: ['verificationStatus']
      },
      {
        fields: ['captureTimestamp']
      }
    ]
  });

  return Submission;
};
