const { POI, sequelize } = require('../models');

// Sample POI data for Mangalore, Karnataka, India (near coordinates 12.8696, 74.9261)
const samplePOIs = [
  {
    name: "Mangaladevi Temple",
    description: "Ancient temple dedicated to Goddess Mangaladevi, after which Mangalore is named. Features beautiful Dravidian architecture.",
    category: "historical",
    location: sequelize.fn('ST_GeomFromText', 'POINT(74.8410 12.8698)', 4326),
    address: "Bolar, Mangalore",
    city: "Mangalore",
    country: "India",
    images: ["https://example.com/mangaladevi.jpg"],
    isActive: true,
    isHidden: false,
    discoveryRadius: 100,
    metadata: {
      openingHours: "6:00 AM - 1:00 PM, 4:00 PM - 8:00 PM",
      entryFee: "Free",
      bestTime: "Early morning or evening"
    },
    visitCount: 0,
    rating: 4.5
  },
  {
    name: "Panambur Beach",
    description: "Popular beach destination with golden sand, water sports activities, and stunning sunsets. Perfect for family outings.",
    category: "nature",
    location: sequelize.fn('ST_GeomFromText', 'POINT(74.8073 12.9480)', 4326),
    address: "Panambur, Mangalore",
    city: "Mangalore",
    country: "India",
    images: ["https://example.com/panambur.jpg"],
    isActive: true,
    isHidden: false,
    discoveryRadius: 150,
    metadata: {
      openingHours: "24 hours",
      activities: ["Swimming", "Jet Skiing", "Camel Rides"],
      bestTime: "Evening for sunset"
    },
    visitCount: 0,
    rating: 4.3
  },
  {
    name: "Kadri Manjunath Temple",
    description: "10th-century temple with impressive bronze statues and a natural spring. One of the oldest temples in Mangalore.",
    category: "historical",
    location: sequelize.fn('ST_GeomFromText', 'POINT(74.8803 12.8990)', 4326),
    address: "Kadri Hills, Mangalore",
    city: "Mangalore",
    country: "India",
    images: ["https://example.com/kadri.jpg"],
    isActive: true,
    isHidden: false,
    discoveryRadius: 100,
    metadata: {
      openingHours: "6:30 AM - 12:30 PM, 3:30 PM - 7:30 PM",
      entryFee: "Free",
      specialFeature: "Natural spring water from Gomukha"
    },
    visitCount: 0,
    rating: 4.6
  },
  {
    name: "Sultan Battery",
    description: "Historic watchtower built by Tipu Sultan in 1784. Offers panoramic views of the Gurupura River.",
    category: "viewpoint",
    location: sequelize.fn('ST_GeomFromText', 'POINT(74.8321 12.9231)', 4326),
    address: "Boloor, Mangalore",
    city: "Mangalore",
    country: "India",
    images: ["https://example.com/sultan-battery.jpg"],
    isActive: true,
    isHidden: false,
    discoveryRadius: 80,
    metadata: {
      openingHours: "9:00 AM - 6:00 PM",
      entryFee: "₹10",
      historicalPeriod: "18th century"
    },
    visitCount: 0,
    rating: 4.2
  },
  {
    name: "St. Aloysius Chapel",
    description: "Magnificent chapel with breathtaking frescoes painted by Italian artist Antonio Moscheni. A masterpiece of religious art.",
    category: "cultural",
    location: sequelize.fn('ST_GeomFromText', 'POINT(74.8426 12.8700)', 4326),
    address: "Lighthouse Hill Road, Hampankatta",
    city: "Mangalore",
    country: "India",
    images: ["https://example.com/st-aloysius.jpg"],
    isActive: true,
    isHidden: false,
    discoveryRadius: 100,
    metadata: {
      openingHours: "9:00 AM - 6:00 PM",
      entryFee: "₹10",
      specialFeature: "Italian frescoes covering walls and ceiling"
    },
    visitCount: 0,
    rating: 4.7
  },
  {
    name: "Tannirbhavi Beach",
    description: "Serene and less crowded beach, perfect for peaceful walks and enjoying natural beauty. Known for its clean shores.",
    category: "nature",
    location: sequelize.fn('ST_GeomFromText', 'POINT(74.7912 12.9089)', 4326),
    address: "Tannirbhavi, Mangalore",
    city: "Mangalore",
    country: "India",
    images: ["https://example.com/tannirbhavi.jpg"],
    isActive: true,
    isHidden: false,
    discoveryRadius: 150,
    metadata: {
      openingHours: "24 hours",
      bestTime: "Early morning or evening",
      features: ["Clean beach", "Less crowded", "Good for swimming"]
    },
    visitCount: 0,
    rating: 4.1
  },
  {
    name: "Pilikula Nisargadhama",
    description: "Integrated nature and heritage park with zoo, botanical garden, lake, and science center. Great for family day trips.",
    category: "park",
    location: sequelize.fn('ST_GeomFromText', 'POINT(75.0189 12.9261)', 4326),
    address: "Vamanjoor, Mangalore",
    city: "Mangalore",
    country: "India",
    images: ["https://example.com/pilikula.jpg"],
    isActive: true,
    isHidden: false,
    discoveryRadius: 200,
    metadata: {
      openingHours: "9:30 AM - 5:30 PM",
      entryFee: "₹40 adults, ₹20 children",
      attractions: ["Zoo", "Lake", "Boating", "Science Center", "Heritage Village"]
    },
    visitCount: 0,
    rating: 4.4
  },
  {
    name: "Kudroli Gokarnath Temple",
    description: "Beautiful temple dedicated to Lord Gokarnanatha. Known for its grand celebrations during Dasara festival.",
    category: "cultural",
    location: sequelize.fn('ST_GeomFromText', 'POINT(74.8449 12.8607)', 4326),
    address: "Kudroli, Mangalore",
    city: "Mangalore",
    country: "India",
    images: ["https://example.com/kudroli.jpg"],
    isActive: true,
    isHidden: false,
    discoveryRadius: 100,
    metadata: {
      openingHours: "6:00 AM - 8:00 PM",
      entryFee: "Free",
      festivalHighlight: "Dasara celebrations"
    },
    visitCount: 0,
    rating: 4.5
  },
  {
    name: "Someshwara Beach",
    description: "Rocky beach with a famous Someshwara Temple nearby. Known for its unique rock formations and sunset views.",
    category: "viewpoint",
    location: sequelize.fn('ST_GeomFromText', 'POINT(74.8038 12.7979)', 4326),
    address: "Ullal, Mangalore",
    city: "Mangalore",
    country: "India",
    images: ["https://example.com/someshwara.jpg"],
    isActive: true,
    isHidden: false,
    discoveryRadius: 150,
    metadata: {
      openingHours: "24 hours",
      bestTime: "Sunset",
      features: ["Rock formations", "Temple nearby", "Scenic views"]
    },
    visitCount: 0,
    rating: 4.3
  },
  {
    name: "Bejai Museum",
    description: "Small museum showcasing artifacts and history of Mangalore region. Hidden gem for history enthusiasts.",
    category: "museum",
    location: sequelize.fn('ST_GeomFromText', 'POINT(74.8649 12.8843)', 4326),
    address: "Bejai, Mangalore",
    city: "Mangalore",
    country: "India",
    images: ["https://example.com/bejai-museum.jpg"],
    isActive: true,
    isHidden: true,
    discoveryRadius: 50,
    metadata: {
      openingHours: "10:00 AM - 5:00 PM, Closed on Mondays",
      entryFee: "₹20",
      collections: ["Ancient artifacts", "Historical documents", "Local crafts"]
    },
    visitCount: 0,
    rating: 4.0
  }
];

async function seedPOIs() {
  try {
    console.log('Starting POI seeding...');
    
    // Check if POIs already exist
    const existingCount = await POI.count();
    
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing POIs. Clearing...`);
      await POI.destroy({ where: {}, truncate: true, cascade: true });
    }
    
    // Insert sample POIs
    console.log(`Inserting ${samplePOIs.length} POI records...`);
    await POI.bulkCreate(samplePOIs);
    
    const newCount = await POI.count();
    console.log(`✅ Successfully seeded ${newCount} POIs!`);
    
    // Display some sample data
    const sampleData = await POI.findAll({ limit: 3 });
    console.log('\nSample POIs:');
    sampleData.forEach(poi => {
      console.log(`- ${poi.name} (${poi.category}) in ${poi.city}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding POIs:', error);
    process.exit(1);
  }
}

// Run the seed function
seedPOIs();
