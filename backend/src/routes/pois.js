const express = require('express');
const { Op } = require('sequelize');
const { POI, Quest } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get nearby POIs
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, includeHidden = false } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const userLocation = `POINT(${parseFloat(lng)} ${parseFloat(lat)})`;
    const radiusMeters = parseFloat(radius);

    // Use raw SQL query to avoid GROUP BY issues
    const [pois] = await POI.sequelize.query(`
      SELECT 
        id, name, description, category, 
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        address, city, country, images, 
        "isActive", "isHidden", "discoveryRadius", 
        metadata, "visitCount", rating, 
        "createdAt", "updatedAt",
        ST_Distance(location, ST_GeomFromText('${userLocation}', 4326)) as distance
      FROM pois
      WHERE "isActive" = true 
        AND (
          "isHidden" = false 
          OR "isHidden" = ${includeHidden === 'true'}
        )
        AND ST_Distance(location, ST_GeomFromText('${userLocation}', 4326)) <= ${radiusMeters}
      ORDER BY distance
    `);

    // Transform the data to include coordinates in the expected format
    const transformedPois = pois.map(poi => ({
      ...poi,
      location: {
        type: 'Point',
        coordinates: [parseFloat(poi.longitude), parseFloat(poi.latitude)]
      }
    }));

    res.json(transformedPois);
  } catch (error) {
    console.error('Get nearby POIs error:', error);
    res.status(500).json({ error: 'Failed to fetch POIs' });
  }
});

// Get POI by ID
router.get('/:id', async (req, res) => {
  try {
    const poi = await POI.findByPk(req.params.id, {
      include: [
        {
          model: Quest,
          as: 'quests',
          where: { isActive: true },
          required: false
        }
      ]
    });

    if (!poi) {
      return res.status(404).json({ error: 'POI not found' });
    }

    res.json(poi);
  } catch (error) {
    console.error('Get POI error:', error);
    res.status(500).json({ error: 'Failed to fetch POI' });
  }
});

// Search POIs
router.get('/', async (req, res) => {
  try {
    const { city, category, search } = req.query;
    const whereClause = { isActive: true };

    if (city) whereClause.city = city;
    if (category) whereClause.category = category;
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const pois = await POI.findAll({
      where: whereClause,
      include: [
        {
          model: Quest,
          as: 'quests',
          where: { isActive: true },
          required: false
        }
      ]
    });

    res.json(pois);
  } catch (error) {
    console.error('Search POIs error:', error);
    res.status(500).json({ error: 'Failed to search POIs' });
  }
});

module.exports = router;
