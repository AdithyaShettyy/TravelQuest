const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const POI = sequelize.define('POI', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM(
        'landmark',
        'museum',
        'park',
        'restaurant',
        'cafe',
        'viewpoint',
        'historical',
        'cultural',
        'nature',
        'entertainment',
        'hidden_gem'
      ),
      allowNull: false
    },
    location: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'If true, POI only appears after nearby discovery'
    },
    discoveryRadius: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      comment: 'Meters within which POI becomes visible'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Opening hours, contact info, accessibility, etc'
    },
    visitCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0
    }
  }, {
    tableName: 'pois',
    timestamps: true,
    indexes: [
      {
        type: 'SPATIAL',
        fields: ['location']
      },
      {
        fields: ['city']
      },
      {
        fields: ['category']
      }
    ]
  });

  return POI;
};
