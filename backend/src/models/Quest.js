const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Quest = sequelize.define('Quest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    poiId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'pois',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('photo_match', 'scavenger', 'challenge', 'time_limited', 'group'),
      defaultValue: 'photo_match'
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard', 'expert'),
      defaultValue: 'medium'
    },
    basePoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10
    },
    referenceImage: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Reference photo for angle matching'
    },
    referenceMetadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'pHash, keypoints, GPS coords for verification'
    },
    requiredAngle: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Camera angle, direction requirements'
    },
    geofence: {
      type: DataTypes.GEOMETRY('POLYGON', 4326),
      allowNull: true,
      comment: 'Valid photo capture area'
    },
    verificationRadius: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      comment: 'GPS tolerance in meters'
    },
    hints: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time limit in minutes for completion'
    },
    requiredGroupSize: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    tableName: 'quests',
    timestamps: true,
    indexes: [
      {
        fields: ['poiId']
      },
      {
        fields: ['difficulty']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  return Quest;
};
