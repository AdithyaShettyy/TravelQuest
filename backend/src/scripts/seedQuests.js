const { Quest, POI, sequelize } = require('../models');

// Seed some demo quests for the POIs
const sampleQuests = [
  {
    title: "Capture the Temple's Golden Hour",
    description: "Take a photo of Mangaladevi Temple during golden hour (sunrise/sunset) to capture its majestic architecture in perfect lighting.",
    type: "photo_match",
    difficulty: "medium",
    basePoints: 25,
    referenceImage: "mangaladevi_golden_hour.jpg",
    referenceMetadata: {
      angle: "front_facing",
      lighting: "golden_hour",
      landmarks: ["main_temple_tower", "entrance_steps"]
    },
    requiredAngle: {
      pitch: -15,
      yaw: 0,
      roll: 0
    },
    geofence: sequelize.fn('ST_GeomFromText', 'POLYGON((74.840 12.869, 74.842 12.869, 74.842 12.870, 74.840 12.870, 74.840 12.869))', 4326),
    verificationRadius: 50,
    hints: [
      "Visit early morning or late evening",
      "Position yourself facing the main temple entrance",
      "Include the temple steps in your photo"
    ],
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    timeLimit: 60,
    requiredGroupSize: 1,
    completionCount: 0
  },
  {
    title: "St. Aloysius Fresco Masterpiece",
    description: "Photograph the stunning Italian frescoes inside St. Aloysius Chapel. Focus on capturing the intricate artwork and ceiling details.",
    type: "photo_match",
    difficulty: "hard",
    basePoints: 40,
    referenceImage: "st_aloysius_fresco.jpg",
    referenceMetadata: {
      angle: "upward",
      lighting: "indoor",
      landmarks: ["ceiling_frescoes", "stained_glass"]
    },
    requiredAngle: {
      pitch: -45,
      yaw: 0,
      roll: 0
    },
    geofence: sequelize.fn('ST_GeomFromText', 'POLYGON((74.842 12.869, 74.843 12.869, 74.843 12.871, 74.842 12.871, 74.842 12.869))', 4326),
    verificationRadius: 30,
    hints: [
      "Look up at the ceiling for the frescoes",
      "Find a spot where you can capture the full artwork",
      "Visit during daylight for best lighting"
    ],
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    timeLimit: 45,
    requiredGroupSize: 1,
    completionCount: 0
  },
  {
    title: "Panambur Sunset Vista",
    description: "Capture the beautiful sunset over Panambur Beach. Position yourself to include both the beach and the setting sun.",
    type: "photo_match",
    difficulty: "easy",
    basePoints: 15,
    referenceImage: "panambur_sunset.jpg",
    referenceMetadata: {
      angle: "landscape",
      lighting: "sunset",
      landmarks: ["beach_sand", "ocean_horizon", "setting_sun"]
    },
    requiredAngle: {
      pitch: 0,
      yaw: 180,
      roll: 0
    },
    geofence: sequelize.fn('ST_GeomFromText', 'POLYGON((74.806 12.947, 74.809 12.947, 74.809 12.949, 74.806 12.949, 74.806 12.947))', 4326),
    verificationRadius: 100,
    hints: [
      "Visit 30 minutes before sunset",
      "Face the ocean for the best view",
      "Include the sandy beach in your composition"
    ],
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    timeLimit: 30,
    requiredGroupSize: 1,
    completionCount: 0
  },
  {
    title: "Kadri Temple Natural Spring",
    description: "Find and photograph the natural spring at Kadri Manjunath Temple. This hidden gem flows throughout the year.",
    type: "scavenger",
    difficulty: "medium",
    basePoints: 30,
    referenceImage: "kadri_spring.jpg",
    referenceMetadata: {
      angle: "close_up",
      lighting: "natural",
      landmarks: ["spring_water", "stone_structure", "temple_backdrop"]
    },
    requiredAngle: {
      pitch: -10,
      yaw: 45,
      roll: 0
    },
    geofence: sequelize.fn('ST_GeomFromText', 'POLYGON((74.879 12.898, 74.881 12.898, 74.881 12.900, 74.879 12.900, 74.879 12.898))', 4326),
    verificationRadius: 40,
    hints: [
      "Look for the Gomukha (cow's mouth) shaped spring",
      "It's located behind the main temple",
      "The water flows continuously"
    ],
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    timeLimit: 90,
    requiredGroupSize: 1,
    completionCount: 0
  },
  {
    title: "Sultan Battery Historic View",
    description: "Photograph Sultan Battery from the best vantage point to capture both the watchtower and the river view.",
    type: "photo_match",
    difficulty: "easy",
    basePoints: 20,
    referenceImage: "sultan_battery_river.jpg",
    referenceMetadata: {
      angle: "wide_angle",
      lighting: "daylight",
      landmarks: ["watchtower", "gurupura_river", "mangalore_city"]
    },
    requiredAngle: {
      pitch: 0,
      yaw: 90,
      roll: 0
    },
    geofence: sequelize.fn('ST_GeomFromText', 'POLYGON((74.831 12.922, 74.833 12.922, 74.833 12.924, 74.831 12.924, 74.831 12.922))', 4326),
    verificationRadius: 60,
    hints: [
      "Climb to the top for the best view",
      "Include the river in your photo",
      "Visit during clear weather"
    ],
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    timeLimit: 45,
    requiredGroupSize: 1,
    completionCount: 0
  }
];

async function seedQuests() {
  try {
    console.log('Starting quest seeding...');

    // Get POI IDs for linking quests
    const pois = await POI.findAll({
      where: { city: 'Mangalore' },
      attributes: ['id', 'name']
    });

    console.log('Available POIs:');
    pois.forEach(poi => {
      console.log(`- ${poi.name}: ${poi.id}`);
    });

    const poiMap = {};
    pois.forEach(poi => {
      poiMap[poi.name] = poi.id;
    });

    // Link quests to POIs
    const questsWithPOIs = sampleQuests.map(quest => {
      let poiId = null;
      if (quest.title.includes('Mangaladevi')) poiId = poiMap['Mangaladevi Temple'];
      else if (quest.title.includes('St. Aloysius')) poiId = poiMap['St. Aloysius Chapel'];
      else if (quest.title.includes('Panambur')) poiId = poiMap['Panambur Beach'];
      else if (quest.title.includes('Kadri')) poiId = poiMap['Kadri Manjunath Temple'];
      else if (quest.title.includes('Sultan Battery')) poiId = poiMap['Sultan Battery'];

      // If we can't find the POI, skip this quest
      if (!poiId) {
        console.log(`Skipping quest "${quest.title}" - POI not found`);
        return null;
      }

      return { ...quest, poiId };
    }).filter(quest => quest !== null);

    // Clear existing quests
    const existingCount = await Quest.count();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing quests. Clearing...`);
      await Quest.destroy({ where: {}, truncate: true, cascade: true });
    }

    // Insert sample quests
    console.log(`Inserting ${questsWithPOIs.length} quest records...`);
    await Quest.bulkCreate(questsWithPOIs);

    const newCount = await Quest.count();
    console.log(`✅ Successfully seeded ${newCount} quests!`);

    // Display sample quests
    const sampleData = await Quest.findAll({
      limit: 3,
      include: [{ model: POI, as: 'poi', attributes: ['name'] }]
    });

    console.log('\nSample Quests:');
    sampleData.forEach(quest => {
      console.log(`- "${quest.title}" (${quest.difficulty}) at ${quest.poi?.name || 'Unknown POI'} - ${quest.basePoints} points`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding quests:', error);
    process.exit(1);
  }
}

// Run the seed function
seedQuests();
