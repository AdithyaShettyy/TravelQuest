// Advanced Scoring System
// Calculates points based on multiple factors

// POI Rarity multipliers
const RARITY_MULTIPLIERS = {
  common: 1.0,
  uncommon: 1.3,
  rare: 1.8,
  epic: 2.5,
  legendary: 3.0
};

// Streak bonuses (consecutive days)
const STREAK_BONUSES = [
  { days: 7, multiplier: 1.1, name: 'Week Streak' },
  { days: 14, multiplier: 1.2, name: '2 Week Streak' },
  { days: 30, multiplier: 1.5, name: 'Month Streak' },
  { days: 60, multiplier: 1.8, name: '2 Month Streak' },
  { days: 100, multiplier: 2.0, name: '100 Day Streak' },
  { days: 365, multiplier: 3.0, name: 'Year Streak' }
];

// Time-of-day bonuses
const TIME_BONUSES = {
  early_bird: {  // 5-8 AM
    hours: [5, 6, 7, 8],
    multiplier: 1.2,
    name: 'Early Bird'
  },
  lunch_explorer: {  // 12-2 PM
    hours: [12, 13, 14],
    multiplier: 1.1,
    name: 'Lunch Explorer'
  },
  golden_hour: {  // 5-7 PM
    hours: [17, 18, 19],
    multiplier: 1.3,
    name: 'Golden Hour'
  },
  night_owl: {  // 10 PM - 2 AM
    hours: [22, 23, 0, 1, 2],
    multiplier: 1.2,
    name: 'Night Owl'
  }
};

// Photo quality scoring (simplified - in production, use AI)
function scorePhotoQuality(photoData) {
  // In production, integrate with:
  // - Google Cloud Vision API
  // - AWS Rekognition
  // - Azure Computer Vision
  // 
  // For now, return random score between 0.8-1.0
  return 0.8 + (Math.random() * 0.2);
}

// Calculate streak bonus
function getStreakMultiplier(streakDays) {
  let multiplier = 1.0;
  let bonusName = null;

  for (const bonus of STREAK_BONUSES) {
    if (streakDays >= bonus.days) {
      multiplier = bonus.multiplier;
      bonusName = bonus.name;
    }
  }

  return { multiplier, bonusName };
}

// Calculate time bonus
function getTimeBonus() {
  const hour = new Date().getHours();
  
  for (const [key, bonus] of Object.entries(TIME_BONUSES)) {
    if (bonus.hours.includes(hour)) {
      return { multiplier: bonus.multiplier, name: bonus.name };
    }
  }

  return { multiplier: 1.0, name: null };
}

// Calculate location accuracy bonus
function getAccuracyBonus(distance) {
  // distance in meters from target location
  if (distance < 10) return { multiplier: 1.5, name: 'Perfect Accuracy' };
  if (distance < 25) return { multiplier: 1.3, name: 'Great Accuracy' };
  if (distance < 50) return { multiplier: 1.1, name: 'Good Accuracy' };
  return { multiplier: 1.0, name: null };
}

// Calculate first visit bonus
function getFirstVisitBonus(isFirstVisit) {
  if (isFirstVisit) {
    return { multiplier: 1.3, name: 'First Visit' };
  }
  return { multiplier: 1.0, name: null };
}

// Main scoring function
function calculateAdvancedScore(params) {
  const {
    basePoints = 100,
    poiRarity = 'common',
    streakDays = 0,
    photoData = null,
    distance = null,
    isFirstVisit = false,
    activePowerups = []
  } = params;

  let totalMultiplier = 1.0;
  const breakdown = {
    basePoints,
    multipliers: []
  };

  // 1. POI Rarity multiplier
  const rarityMultiplier = RARITY_MULTIPLIERS[poiRarity] || 1.0;
  if (rarityMultiplier > 1.0) {
    totalMultiplier *= rarityMultiplier;
    breakdown.multipliers.push({
      type: 'rarity',
      name: `${poiRarity.charAt(0).toUpperCase() + poiRarity.slice(1)} POI`,
      multiplier: rarityMultiplier
    });
  }

  // 2. Streak bonus
  const streakBonus = getStreakMultiplier(streakDays);
  if (streakBonus.multiplier > 1.0) {
    totalMultiplier *= streakBonus.multiplier;
    breakdown.multipliers.push({
      type: 'streak',
      name: streakBonus.bonusName,
      multiplier: streakBonus.multiplier
    });
  }

  // 3. Time-of-day bonus
  const timeBonus = getTimeBonus();
  if (timeBonus.multiplier > 1.0) {
    totalMultiplier *= timeBonus.multiplier;
    breakdown.multipliers.push({
      type: 'time',
      name: timeBonus.name,
      multiplier: timeBonus.multiplier
    });
  }

  // 4. Photo quality (if provided)
  if (photoData) {
    const photoScore = scorePhotoQuality(photoData);
    if (photoScore > 0.9) {
      totalMultiplier *= 1.2;
      breakdown.multipliers.push({
        type: 'photo',
        name: 'Excellent Photo',
        multiplier: 1.2
      });
    }
  }

  // 5. Location accuracy bonus
  if (distance !== null) {
    const accuracyBonus = getAccuracyBonus(distance);
    if (accuracyBonus.multiplier > 1.0) {
      totalMultiplier *= accuracyBonus.multiplier;
      breakdown.multipliers.push({
        type: 'accuracy',
        name: accuracyBonus.name,
        multiplier: accuracyBonus.multiplier
      });
    }
  }

  // 6. First visit bonus
  if (isFirstVisit) {
    const firstVisitBonus = getFirstVisitBonus(isFirstVisit);
    totalMultiplier *= firstVisitBonus.multiplier;
    breakdown.multipliers.push({
      type: 'first_visit',
      name: firstVisitBonus.name,
      multiplier: firstVisitBonus.multiplier
    });
  }

  // 7. Active power-ups (handled separately in leaderboard route)
  // Just document them here
  if (activePowerups && activePowerups.length > 0) {
    const powerupMultiplier = activePowerups.reduce((sum, p) => sum + (p.multiplier - 1), 1);
    breakdown.multipliers.push({
      type: 'powerup',
      name: 'Active Power-ups',
      multiplier: powerupMultiplier
    });
  }

  // Calculate final points
  const finalPoints = Math.floor(basePoints * totalMultiplier);

  return {
    finalPoints,
    totalMultiplier: parseFloat(totalMultiplier.toFixed(2)),
    breakdown
  };
}

module.exports = {
  calculateAdvancedScore,
  RARITY_MULTIPLIERS,
  STREAK_BONUSES,
  TIME_BONUSES,
  scorePhotoQuality
};
