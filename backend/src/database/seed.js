const { sequelize, User, POI, Quest, Badge, Reward } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@tourquest.com',
      password: 'admin123',
      displayName: 'Admin User',
      role: 'admin',
      totalPoints: 0
    });

    // Create test users
    const users = await Promise.all([
      User.create({
        username: 'explorer1',
        email: 'explorer1@test.com',
        password: 'password123',
        displayName: 'Explorer One',
        totalPoints: 1250,
        currentStreak: 5,
        level: 3
      }),
      User.create({
        username: 'traveler99',
        email: 'traveler@test.com',
        password: 'password123',
        displayName: 'Traveler',
        totalPoints: 890,
        currentStreak: 2,
        level: 2
      })
    ]);

    console.log('✅ Created users');

    // Create POIs (New York City examples)
    const pois = await Promise.all([
      POI.create({
        name: 'Central Park',
        description: 'An urban park in Manhattan, New York City',
        category: 'park',
        location: { type: 'Point', coordinates: [-73.9654, 40.7829] },
        address: 'Central Park, New York, NY',
        city: 'New York',
        country: 'USA',
        images: ['https://images.unsplash.com/photo-1568515387631-8b650bbcdb90'],
        isActive: true,
        discoveryRadius: 100
      }),
      POI.create({
        name: 'Statue of Liberty',
        description: 'A colossal neoclassical sculpture on Liberty Island',
        category: 'landmark',
        location: { type: 'Point', coordinates: [-74.0445, 40.6892] },
        address: 'Liberty Island, New York, NY',
        city: 'New York',
        country: 'USA',
        images: ['https://images.unsplash.com/photo-1524820197278-540916411e20'],
        isActive: true,
        discoveryRadius: 150
      }),
      POI.create({
        name: 'Brooklyn Bridge',
        description: 'A hybrid cable-stayed/suspension bridge in New York City',
        category: 'landmark',
        location: { type: 'Point', coordinates: [-73.9969, 40.7061] },
        address: 'Brooklyn Bridge, New York, NY',
        city: 'New York',
        country: 'USA',
        images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9'],
        isActive: true,
        discoveryRadius: 100
      }),
      POI.create({
        name: 'Times Square',
        description: 'Major commercial intersection and entertainment center',
        category: 'entertainment',
        location: { type: 'Point', coordinates: [-73.9855, 40.7580] },
        address: 'Times Square, Manhattan, NY',
        city: 'New York',
        country: 'USA',
        images: ['https://images.unsplash.com/photo-1519961655-16be515f20da'],
        isActive: true,
        discoveryRadius: 80
      }),
      POI.create({
        name: 'Empire State Building',
        description: 'Art Deco skyscraper in Midtown Manhattan',
        category: 'landmark',
        location: { type: 'Point', coordinates: [-73.9857, 40.7484] },
        address: '350 5th Ave, New York, NY',
        city: 'New York',
        country: 'USA',
        images: ['https://images.unsplash.com/photo-1554995207-c18c203602cb'],
        isActive: true,
        discoveryRadius: 100
      })
    ]);

    console.log('✅ Created POIs');

    // Create quests for each POI
    const quests = await Promise.all([
      Quest.create({
        poiId: pois[0].id,
        title: 'Central Park Fountain Shot',
        description: 'Capture the Bethesda Fountain from the famous angle',
        type: 'photo_match',
        difficulty: 'easy',
        basePoints: 50,
        referenceImage: '/seeds/reference/central-park-fountain.jpg',
        referenceMetadata: { phash: 'abc123' },
        verificationRadius: 50,
        hints: ['Look for the angel statue', 'Best shot from the terrace'],
        isActive: true
      }),
      Quest.create({
        poiId: pois[1].id,
        title: 'Lady Liberty Close-up',
        description: 'Get a photo from Battery Park showing the crown',
        type: 'photo_match',
        difficulty: 'medium',
        basePoints: 100,
        referenceImage: '/seeds/reference/statue-liberty.jpg',
        referenceMetadata: { phash: 'def456' },
        verificationRadius: 100,
        hints: ['Take the ferry for best view', 'Crown should be clearly visible'],
        isActive: true
      }),
      Quest.create({
        poiId: pois[2].id,
        title: 'Brooklyn Bridge Walkway',
        description: 'Capture the iconic view from the pedestrian walkway',
        type: 'photo_match',
        difficulty: 'easy',
        basePoints: 60,
        referenceImage: '/seeds/reference/brooklyn-bridge.jpg',
        referenceMetadata: { phash: 'ghi789' },
        verificationRadius: 50,
        hints: ['Walk to the middle of the bridge', 'Manhattan skyline in background'],
        isActive: true
      }),
      Quest.create({
        poiId: pois[3].id,
        title: 'Times Square Night Lights',
        description: 'Capture the dazzling lights after sunset',
        type: 'photo_match',
        difficulty: 'medium',
        basePoints: 80,
        referenceImage: '/seeds/reference/times-square.jpg',
        referenceMetadata: { phash: 'jkl012' },
        verificationRadius: 50,
        hints: ['Best after 7 PM', 'Include the big screens'],
        isActive: true
      }),
      Quest.create({
        poiId: pois[4].id,
        title: 'Empire State Classic',
        description: 'Get the classic shot from 5th Avenue',
        type: 'photo_match',
        difficulty: 'hard',
        basePoints: 150,
        referenceImage: '/seeds/reference/empire-state.jpg',
        referenceMetadata: { phash: 'mno345' },
        verificationRadius: 75,
        hints: ['Stand back for full building', 'Morning light is best'],
        isActive: true
      })
    ]);

    console.log('✅ Created quests');

    // Create badges
    const badges = await Promise.all([
      Badge.create({
        name: 'First Steps',
        description: 'Complete your first quest',
        icon: '🎯',
        category: 'milestone',
        rarity: 'common',
        criteria: { submissions: 1 },
        pointsBonus: 10
      }),
      Badge.create({
        name: 'Explorer',
        description: 'Complete 10 quests',
        icon: '🧭',
        category: 'milestone',
        rarity: 'rare',
        criteria: { submissions: 10 },
        pointsBonus: 100
      }),
      Badge.create({
        name: 'Streak Master',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        category: 'achievement',
        rarity: 'rare',
        criteria: { streak: 7 },
        pointsBonus: 150
      }),
      Badge.create({
        name: 'Point Collector',
        description: 'Earn 1000 total points',
        icon: '💰',
        category: 'milestone',
        rarity: 'epic',
        criteria: { totalPoints: 1000 },
        pointsBonus: 200
      }),
      Badge.create({
        name: 'Landmark Lover',
        description: 'Visit 5 landmark POIs',
        icon: '🏛️',
        category: 'specialist',
        rarity: 'rare',
        criteria: { category: 'landmark', count: 5 },
        pointsBonus: 120
      })
    ]);

    console.log('✅ Created badges');

    // Create rewards
    const rewards = await Promise.all([
      Reward.create({
        name: 'Coffee Shop 10% Off',
        description: 'Get 10% off at any partner coffee shop',
        type: 'discount',
        pointsCost: 100,
        value: '10% off',
        remainingStock: 50,
        totalAvailable: 50,
        cooldownDays: 7,
        isActive: true
      }),
      Reward.create({
        name: 'Museum Free Entry',
        description: 'Free entry to select museums',
        type: 'freebie',
        pointsCost: 500,
        value: 'Free entry',
        remainingStock: 20,
        totalAvailable: 20,
        redemptionLimit: 1,
        cooldownDays: 30,
        isActive: true
      }),
      Reward.create({
        name: 'Restaurant $5 Voucher',
        description: '$5 off at partner restaurants',
        type: 'voucher',
        pointsCost: 250,
        value: '$5 off',
        remainingStock: 100,
        totalAvailable: 100,
        cooldownDays: 14,
        isActive: true
      }),
      Reward.create({
        name: 'Exclusive Tour Experience',
        description: 'Private guided tour of hidden gems',
        type: 'experience',
        pointsCost: 1000,
        value: '2-hour private tour',
        remainingStock: 5,
        totalAvailable: 5,
        redemptionLimit: 1,
        cooldownDays: 90,
        isActive: true
      })
    ]);

    console.log('✅ Created rewards');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin@tourquest.com / admin123');
    console.log('User: explorer1@test.com / password123');
    console.log('User: traveler@test.com / password123');
    
    console.log(`\n📍 Created ${pois.length} POIs`);
    console.log(`🎯 Created ${quests.length} quests`);
    console.log(`🏆 Created ${badges.length} badges`);
    console.log(`🎁 Created ${rewards.length} rewards`);

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run seed
seed();
