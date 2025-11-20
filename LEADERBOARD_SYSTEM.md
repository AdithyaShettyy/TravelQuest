# TravelQuest Leaderboard System
## Simple Real-Time Ranking System - IMPLEMENTED ✅

---

## 🎯 System Overview

A straightforward leaderboard system that ranks users based on points earned from completing location-based challenges, photo quests, and discovering hidden attractions. Real-time updates using Socket.IO keep rankings fresh and competitive.

---

## ✅ Implementation Status

### Completed Features

#### Backend (Node.js + Socket.IO)
- ✅ Real-time Socket.IO server integration
- ✅ Global leaderboard API (`/api/leaderboard/global`)
- ✅ City leaderboard API (`/api/leaderboard/city/:cityId`)
- ✅ User rank calculation API (`/api/leaderboard/rank/:userId`)
- ✅ Points update API (`/api/leaderboard/update-points`)
- ✅ Real-time event broadcasting for point updates
- ✅ Automatic rank recalculation on point changes

#### Frontend (React Native + Expo)
- ✅ LeaderboardScreen component with tabs
- ✅ Real-time Socket.IO client connection
- ✅ Global and City leaderboard tabs
- ✅ User rank card with percentile display
- ✅ Top 3 users with trophy icons (Gold/Silver/Bronze)
- ✅ Pull-to-refresh functionality
- ✅ Current user highlighting
- ✅ Avatar display with fallback placeholders
- ✅ Level and streak badges
- ✅ Professional UI with smooth animations

#### Navigation
- ✅ Leaderboard tab added between Quests and Profile
- ✅ Podium icon for tab navigation
- ✅ Integrated into main bottom tab navigator

---

## 📊 Leaderboard Types

### 1. **Global Leaderboard**
**Description:** Worldwide ranking of all TravelQuest users
- **Scope:** All users across all cities
- **Update Frequency:** Real-time via Socket.IO
- **Display:** Top 100 users + user's current rank
- **Ranking Metric:** Total lifetime points

**Features:**
- Real-time rank updates
- Top 3 trophy display (🥇🥈🥉)
- User level badges
- Streak counters
- Percentile ranking

---

### 2. **City Leaderboard**
**Description:** Rankings within specific cities
- **Scope:** Users who have completed quests in that city
- **Update Frequency:** Real-time
- **Display:** Top 50 users per city + user's rank
- **Ranking Metric:** City-specific points

**Features:**
- City-specific competition
- Local ranking display
- Same real-time updates as global

---

## 🎮 Scoring System (Simplified)

### Point Categories

| Activity Type | Base Points | Description |
|---------------|-------------|-------------|
| **Location Check-in** | 50 pts | Visit a POI |
| **Complete Quest** | 100-200 pts | Based on quest difficulty |
| **Photo Upload** | 75 pts | Submit quest photo |
| **Hidden Location Discovery** | 150 pts | Find unmarked attraction |
| **Complete Route** | 100 pts | Finish navigation route |

### Level System
Users gain levels based on total points:
- Level 1: 0-500 pts
- Level 2: 501-1,000 pts
- Level 3: 1,001-2,000 pts
- Level 4: 2,001-5,000 pts
- Level 5+: +2,500 pts per level

---

## ⚡ Real-Time Updates

### Socket.IO Events

#### Server Emits:
```javascript
// When user earns points
socket.emit('points_earned', {
  userId: 'uuid',
  username: 'explorer1',
  points: 100,
  newTotal: 1450,
  newRank: 1,
  rankChange: +1,
  activityType: 'location_visit',
  timestamp: '2025-11-13T20:51:32Z'
});

// When leaderboard positions change
socket.emit('leaderboard_updated', {
  userId: 'uuid',
  newRank: 1,
  oldRank: 2,
  timestamp: '2025-11-13T20:51:32Z'
});
```

#### Client Subscribes:
```javascript
// Subscribe to leaderboard updates
socket.emit('subscribe_leaderboard', { 
  type: 'global' // or 'city'
});

// Unsubscribe when leaving screen
socket.emit('unsubscribe_leaderboard', { 
  type: 'global' 
});
```

---

## 🔧 API Endpoints

### GET `/api/leaderboard/global`
Fetch global leaderboard rankings

**Query Parameters:**
- `limit`: Number of users to return (default: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "id": "uuid",
      "username": "explorer1",
      "displayName": "Explorer One",
      "avatar": null,
      "totalPoints": 1450,
      "level": 3,
      "currentStreak": 5
    }
  ],
  "totalUsers": 3,
  "lastUpdated": "2025-11-13T20:51:32Z"
}
```

---

### GET `/api/leaderboard/city/:cityId`
Fetch city-specific leaderboard

**Parameters:**
- `cityId`: City identifier (e.g., "mangalore")

**Query Parameters:**
- `limit`: Number of users (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:** Same format as global leaderboard with added `cityId` field

---

### GET `/api/leaderboard/rank/:userId`
Get specific user's rank and stats

**Parameters:**
- `userId`: User UUID

**Response:**
```json
{
  "success": true,
  "rank": 1,
  "totalUsers": 3,
  "percentile": 100.0,
  "user": {
    "id": "uuid",
    "username": "explorer1",
    "displayName": "Explorer One",
    "avatar": null,
    "totalPoints": 1450,
    "level": 3,
    "currentStreak": 5
  }
}
```

---

### POST `/api/leaderboard/update-points`
Update user points (called when user completes activities)

**Request Body:**
```json
{
  "userId": "uuid",
  "points": 100,
  "activityType": "location_visit"
}
```

**Response:**
```json
{
  "success": true,
  "newTotal": 1450,
  "pointsEarned": 100,
  "newRank": 1,
  "oldRank": 2,
  "rankChange": 1,
  "activityType": "location_visit"
}
```

**Side Effects:**
- Emits `points_earned` Socket.IO event
- Emits `leaderboard_updated` Socket.IO event
- Updates user's totalPoints in database
- Recalculates user's rank

---

## 📱 Mobile App Integration

### LeaderboardScreen Features

#### User Rank Card
- Large trophy icon badge
- Current rank display (#1, #347, etc.)
- Percentile badge (Top 5%, Top 25%, etc.)
- Total points with star icon
- Prominent "Your Rank" label

#### Leaderboard Tabs
- **Global Tab**: 🌍 Globe icon
- **City Tab**: 📍 Location icon
- Active tab highlighting with blue background
- Smooth tab switching

#### Leaderboard Item Display
- **Rank**: Trophy icons for top 3, numbers for others
- **Avatar**: User profile picture or placeholder
- **Username**: Display name with "(You)" badge for current user
- **Stats**: Level badge and streak counter
- **Points**: Large point total with "points" label

#### Visual Highlights
- **Top 3 Users**: Enhanced shadow and spacing
- **Current User**: Blue background with border
- **Gold/Silver/Bronze**: Colored trophy icons (#FFD700, #C0C0C0, #CD7F32)

#### Pull-to-Refresh
- Swipe down to refresh leaderboard
- Refreshes both leaderboard and user rank
- Blue spinner animation

---

## 🎨 Design Features

### Color Scheme
- **Primary Blue**: #2563eb (active tabs, highlights)
- **Gold**: #FFD700 (1st place trophy)
- **Silver**: #C0C0C0 (2nd place trophy)
- **Bronze**: #CD7F32 (3rd place trophy)
- **Purple**: #8b5cf6 (level icons)
- **Orange**: #f97316 (streak icons)
- **Yellow**: #f59e0b (star icons)

### Typography
- **Rank Numbers**: Bold, 28px for user rank card
- **Usernames**: Bold, 16px
- **Points**: Bold, 18px
- **Stats**: Regular, 12-14px

### Icons (Ionicons)
- `trophy`: Rankings and achievements
- `podium`: Tab navigator icon
- `globe`: Global leaderboard tab
- `location`: City leaderboard tab
- `flash`: Level indicator
- `flame`: Streak counter
- `star`: Points indicator
- `person`: Avatar placeholder

---

## 🚀 How to Use

### For Users

1. **Navigate to Leaderboard**
   - Tap the Podium icon in the bottom navigation
   - Located between Quests and Profile tabs

2. **View Your Rank**
   - Your rank card appears at the top
   - Shows your current position and percentile
   - Displays total points earned

3. **Browse Rankings**
   - Scroll through the leaderboard
   - See usernames, levels, streaks, and points
   - Top 3 users have special trophy icons

4. **Switch Views**
   - Tap "Global" to see worldwide rankings
   - Tap "City" to see local competition

5. **Refresh Data**
   - Pull down to refresh manually
   - Rankings update automatically in real-time

### For Developers

#### Award Points to Users
```javascript
// When user completes an activity
const response = await fetch(`${API_URL}/api/leaderboard/update-points`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    points: 100,
    activityType: 'quest_completion'
  })
});

// All connected clients receive real-time updates automatically
```

#### Listen for Updates
```javascript
// Socket.IO automatically broadcasts updates
socket.on('points_earned', (data) => {
  console.log(`${data.username} earned ${data.points} points!`);
  // UI updates automatically via React state
});
```

---

## 📈 Database Schema

### User Model (Updated)
```sql
users {
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  displayName VARCHAR(255),
  avatar VARCHAR(255),
  totalPoints INTEGER DEFAULT 0,  -- ✅ Used for leaderboard
  level INTEGER DEFAULT 1,          -- ✅ Displayed in rankings
  currentStreak INTEGER DEFAULT 0,  -- ✅ Shown as days
  created_at TIMESTAMP
}
```

### Ranking Calculation
```sql
-- User rank is calculated dynamically
SELECT COUNT(*) + 1 AS rank
FROM users
WHERE totalPoints > (SELECT totalPoints FROM users WHERE id = :userId)
   OR (totalPoints = (SELECT totalPoints FROM users WHERE id = :userId)
       AND createdAt < (SELECT createdAt FROM users WHERE id = :userId))
```

---

## 🧪 Testing

### Test Script
Location: `/backend/test-leaderboard.js`

**Run Tests:**
```bash
cd backend
node test-leaderboard.js
```

**Tests Include:**
1. ✅ Fetch global leaderboard
2. ✅ Get user rank with percentile
3. ✅ Update user points
4. ✅ Verify rank recalculation
5. ✅ Fetch city leaderboard
6. ✅ Real-time Socket.IO events

**Sample Output:**
```
🧪 Testing Leaderboard API

1️⃣ Fetching global leaderboard...
✅ Global Leaderboard: Found 3 users

2️⃣ Fetching rank for user: explorer1...
✅ User Rank: Rank #1 (Top 100%)

3️⃣ Adding 100 points to explorer1...
✅ Points Updated: New Total: 1450 points, Rank Change: +1

4️⃣ Fetching city leaderboard (Mangalore)...
✅ City Leaderboard: Found 3 users

✨ All tests passed successfully!
```

---

## 🔄 Integration with Existing Features

### MapScreen Integration
When user completes navigation or visits POI:
```javascript
// Award points for visiting location
await fetch(`${API_URL}/api/leaderboard/update-points`, {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    points: 50,
    activityType: 'location_visit'
  })
});
```

### QuestsScreen Integration
When user completes quest:
```javascript
// Award points for quest completion
await fetch(`${API_URL}/api/leaderboard/update-points`, {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    points: questDifficulty === 'hard' ? 200 : 100,
    activityType: 'quest_completion'
  })
});
```

---

## 🎯 Future Enhancements (Not Implemented)

### Phase 2 - Friends & Social
- Friends leaderboard (compete with connections)
- Friend challenges (1v1 competitions)
- Social sharing of achievements

### Phase 3 - Squads & Teams
- Create/join squads (teams of 5-20 users)
- Squad vs Squad competitions
- Team achievements and badges

### Phase 4 - Weekly Competitions
- Weekly leaderboard reset (every Monday)
- Weekly rewards and badges
- Season championships

### Phase 5 - Advanced Features
- Multiple activity categories
- Photo quality scoring
- Hidden location rarity multipliers
- Achievement-based multipliers
- Power-ups and boosters

---

## 📦 File Structure

```
backend/
├── src/
│   ├── routes/
│   │   └── leaderboard.js           # ✅ Leaderboard API routes
│   ├── models/
│   │   └── User.js                  # ✅ User model with points
│   └── index.js                     # ✅ Socket.IO server setup
└── test-leaderboard.js              # ✅ API test script

mobile/
├── src/
│   └── screens/
│       └── LeaderboardScreen.js     # ✅ Leaderboard UI component
└── App.js                           # ✅ Navigation with leaderboard tab
```

---

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install socket.io socket.io-client
node src/index.js
```

### Mobile
```bash
cd mobile
npm install socket.io-client
npx expo start --lan
```

### Test API
```bash
cd backend
node test-leaderboard.js
```

---

## ✅ Checklist

- [x] Install Socket.IO dependencies
- [x] Create leaderboard API routes
- [x] Implement Socket.IO server
- [x] Create LeaderboardScreen component
- [x] Add leaderboard tab to navigation
- [x] Implement real-time updates
- [x] Add user rank calculation
- [x] Design professional UI
- [x] Test API endpoints
- [x] Verify Socket.IO connection
- [x] Test real-time updates
- [ ] Integrate with quest completion
- [ ] Integrate with location visits
- [ ] Add weekly reset system (future)
- [ ] Add friends system (future)
- [ ] Add squads system (future)

---

**Status:** ✅ **CORE SYSTEM IMPLEMENTED AND TESTED**

**Version:** 1.0 (Simplified Real-Time System)

**Last Updated:** November 14, 2025

**Ready for:** Production use with basic global and city leaderboards

---

## 📊 Leaderboard Types

### 1. **Global Leaderboard**
**Description:** Worldwide ranking of all TravelQuest users
- **Scope:** All users across all cities
- **Update Frequency:** Real-time with 30-second aggregation
- **Display:** Top 100 users + user's current rank
- **Ranking Metric:** Total lifetime points

**Features:**
- Hall of Fame for top 10 all-time users
- Country flags next to usernames
- Total cities explored badge
- Lifetime achievement badges

---

### 2. **City Leaderboard**
**Description:** Rankings within specific cities
- **Scope:** Users who have completed at least one quest in that city
- **Update Frequency:** Real-time
- **Display:** Top 50 users per city + user's rank
- **Ranking Metric:** City-specific points

**Categories per City:**
- **City Explorer:** Total points earned in city
- **Photo Master:** Points from photo quests
- **Hidden Gem Hunter:** Points from discovering hidden attractions
- **Challenge Champion:** Points from location-based challenges

**Features:**
- City completion percentage
- Local expert badge (top 10 in city)
- City streak counter (consecutive days active)
- Neighborhood domination tracker

---

### 3. **Weekly Leaderboard**
**Description:** Fresh competition every week
- **Scope:** All users (resets every Monday 00:00 UTC)
- **Update Frequency:** Real-time
- **Display:** Top 100 + user's rank
- **Ranking Metric:** Points earned in current week

**Reward Tiers:**
- 🥇 **Top 3:** Exclusive weekly badges + 500 bonus points
- 🥈 **Top 10:** Weekly champion badge + 200 bonus points
- 🥉 **Top 50:** Weekly warrior badge + 50 bonus points

**Features:**
- Weekly quest multipliers (2x points on weekends)
- Comeback mechanic (bonus points for climbing ranks)
- Weekly challenges with bonus rewards
- Previous week's top 10 "Champions Wall"

---

### 4. **Friends Leaderboard**
**Description:** Compete with your social circle
- **Scope:** User's friends list (Facebook/Email connected)
- **Update Frequency:** Real-time
- **Display:** All friends ranked
- **Ranking Metric:** Total points or weekly points (toggleable)

**Features:**
- Friend challenges (direct 1v1 competitions)
- Shared quest progress
- Private group leaderboards (up to 50 friends)
- Friend streaks (consecutive days both active)
- Friendly rivalry notifications

**Social Features:**
- Challenge friend button
- Share achievements to social media
- Friends' recent quest completions feed
- Congratulate/kudos system

---

### 5. **Squad Leaderboard**
**Description:** Team-based competition
- **Scope:** User-created teams (5-20 members)
- **Update Frequency:** Real-time
- **Display:** Top 50 squads + user's squad rank
- **Ranking Metric:** Combined team points (average or total)

**Squad Features:**
- Squad challenges (team goals)
- Squad chat and coordination
- Squad achievements and badges
- Squad vs Squad tournaments
- Squad territories (dominate specific areas)

**Squad Types:**
- **Open:** Anyone can join
- **Invite-only:** Requires approval
- **Region-locked:** Only users from specific region
- **Theme-based:** Photography, history, food, etc.

---

## 🎮 Scoring Logic & Point System

### Point Categories

#### 1. **Location-Based Challenges** (Standard Points)
| Challenge Type | Base Points | Bonus Conditions |
|----------------|-------------|------------------|
| Check-in at POI | 50 pts | +25 first visit, +10 off-peak hours |
| Visit Hidden Location | 150 pts | +50 first discoverer in friend group |
| Complete Route | 100 pts | +30 scenic route, +20 fastest time |
| Explore Neighborhood | 200 pts | +100 100% completion |
| Distance Challenge | 10 pts/km | +50 >10km in single session |

#### 2. **Photo-Angle Quests** (Creative Points)
| Quest Type | Base Points | Quality Multipliers |
|------------|-------------|---------------------|
| Standard Photo Quest | 75 pts | 1.5x high quality, 2x perfect angle |
| Recreate Historical Photo | 200 pts | 1.3x accuracy match |
| Sunrise/Sunset Photo | 150 pts | 1.5x golden hour timing |
| Action Shot | 125 pts | 1.4x motion capture |
| Panorama Quest | 175 pts | 1.6x >180° coverage |

**Photo Quality Algorithm:**
- AI analysis for composition (rule of thirds)
- Lighting quality score (0-100)
- Subject clarity and focus
- Angle accuracy matching (for specific quests)
- User ratings (community validation)

#### 3. **Hidden-Attraction Discovery** (Explorer Points)
| Discovery Type | Base Points | Rarity Bonus |
|----------------|-------------|--------------|
| Find Unmarked Landmark | 300 pts | +200 <10 discoverers |
| Secret Viewpoint | 250 pts | +150 untouched location |
| Local Hidden Gem | 200 pts | +100 verified by locals |
| Historical Easter Egg | 400 pts | +250 first finder globally |
| Cultural Discovery | 350 pts | +175 cultural significance |

**Rarity Tiers:**
- 🔷 **Common:** >1000 discoverers (1.0x multiplier)
- 🟦 **Uncommon:** 500-1000 discoverers (1.2x multiplier)
- 🟪 **Rare:** 100-500 discoverers (1.5x multiplier)
- 🟥 **Epic:** 10-100 discoverers (2.0x multiplier)
- ⭐ **Legendary:** <10 discoverers (3.0x multiplier)

#### 4. **Streak Bonuses**
| Streak Type | Points | Requirement |
|-------------|--------|-------------|
| Daily Login | +10 pts/day | Consecutive days |
| Quest Streak | +25 pts | Complete 1 quest/day for 7 days |
| City Loyalty | +50 pts/week | Active in same city for 4 weeks |
| Photo Perfectionist | +100 pts | 10 consecutive high-quality photos |

#### 5. **Achievement Multipliers**
| Achievement Level | Multiplier | Requirement |
|------------------|------------|-------------|
| Beginner | 1.0x | 0-1,000 pts |
| Explorer | 1.1x | 1,001-5,000 pts |
| Adventurer | 1.2x | 5,001-15,000 pts |
| Master | 1.3x | 15,001-50,000 pts |
| Legend | 1.5x | 50,001+ pts |

---

## ⚡ Real-Time Leaderboard Updates

### Update Architecture

#### Event-Driven Updates
```
User Action → Point Calculation → Database Update → WebSocket Broadcast → Client Update
```

**Update Triggers:**
1. Quest completion
2. Photo submission approval
3. Location check-in
4. Achievement unlock
5. Streak completion
6. Squad activity

#### Update Frequencies by Leaderboard Type
- **Global:** Every 30 seconds (batch aggregation)
- **City:** Instant (< 2 seconds)
- **Weekly:** Instant (< 2 seconds)
- **Friends:** Instant (< 1 second, smaller dataset)
- **Squad:** Instant (< 2 seconds)

#### Optimization Strategies
1. **Caching Layer:** Redis cache for top 100 users (5-minute TTL)
2. **Batch Processing:** Aggregate minor point changes every 30s
3. **Regional Sharding:** Distribute load by geographic regions
4. **Lazy Loading:** Load only visible ranks, fetch more on scroll
5. **WebSocket Channels:** Subscribe only to relevant leaderboards

---

## 🏆 Ranking Algorithm

### Primary Ranking Factors
1. **Total Points** (70% weight)
2. **Recency** (15% weight) - More recent activity ranks higher in ties
3. **Diversity** (10% weight) - Bonus for varied activity types
4. **Quality** (5% weight) - Average photo ratings, completion speed

### Tie-Breaker Logic
When users have equal points:
1. Most recent significant activity (quest completion)
2. Higher diversity score
3. Longer account age
4. Alphabetical username

### Anti-Cheat Measures
- **Rate Limiting:** Max 100 points per 10-minute window
- **Location Verification:** GPS accuracy checks
- **Photo Analysis:** AI detects duplicates/fake photos
- **Anomaly Detection:** Flag suspicious point spikes
- **Manual Review:** Queue for human verification if flagged
- **Penalty System:** Point deductions for violations

---

## 📱 UI/UX Components

### Leaderboard Display Elements

#### Header Section
```
┌─────────────────────────────────────┐
│  🏆 Global Leaderboard              │
│  ┌───────────────────────────────┐  │
│  │ Your Rank: #347  ⬆️ +12       │  │
│  │ Points: 8,542  📊 Top 5%      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

#### Leaderboard Tabs
```
[ Global ] [ City ] [ Weekly ] [ Friends ] [ Squad ]
     •                                        (active)
```

#### User Row Design
```
┌─────────────────────────────────────┐
│ 1  👑 AlexTheExplorer      🇺🇸      │
│     ⭐ 45,230 pts  🏙️ 23 cities    │
│     Level 47 Master  🔥 125 streak  │
├─────────────────────────────────────┤
│ 2  🥈 CityWanderer        🇬🇧      │
│     ⭐ 43,890 pts  🏙️ 19 cities    │
│     Level 45 Master  🔥 98 streak   │
└─────────────────────────────────────┘
```

#### You Indicator
```
┌─────────────────────────────────────┐
│ 347 🎯 YOU                  🇮🇳     │
│     ⭐ 8,542 pts  🏙️ 5 cities      │
│     Level 28 Adventurer  🔥 7 days  │
└─────────────────────────────────────┘
```

### Animation & Feedback
- **Rank Changes:** Smooth transitions with up/down arrows
- **Point Gains:** Animated "+XXX pts" popups
- **Achievements:** Confetti burst for top 10 entry
- **Overtakes:** Push notification when overtaking friends
- **Celebrations:** Special effects for personal bests

---

## 🎁 Rewards & Incentives

### Weekly Rewards
| Rank | Reward |
|------|--------|
| #1 | 500 bonus pts + Exclusive weekly badge + Feature on app homepage |
| #2-3 | 300 bonus pts + Weekly podium badge |
| #4-10 | 200 bonus pts + Top 10 badge |
| #11-50 | 100 bonus pts + Weekly champion badge |
| #51-100 | 50 bonus pts + Weekly warrior badge |

### Season Championships (Quarterly)
| Rank | Reward |
|------|--------|
| #1-10 | TravelQuest Premium (3 months) + Physical trophy + $100 travel voucher |
| #11-50 | TravelQuest Premium (1 month) + Exclusive season badge |
| #51-100 | Exclusive season badge + 1000 bonus points |

### Squad Rewards
| Achievement | Reward per Member |
|-------------|-------------------|
| Top Squad | 1000 bonus pts + Squad trophy icon |
| Most Improved | 500 bonus pts |
| Best Collaboration | Special squad badge |

---

## 🔧 Technical Implementation

### Database Schema

#### Leaderboard Tables
```sql
-- Users Points Table
CREATE TABLE user_points (
    user_id UUID PRIMARY KEY,
    total_points INTEGER DEFAULT 0,
    weekly_points INTEGER DEFAULT 0,
    monthly_points INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    streak_days INTEGER DEFAULT 0,
    diversity_score FLOAT DEFAULT 0,
    quality_rating FLOAT DEFAULT 0
);

-- City Leaderboard
CREATE TABLE city_rankings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    city_id UUID REFERENCES cities(id),
    points INTEGER DEFAULT 0,
    rank INTEGER,
    quests_completed INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT NOW()
);

-- Squad Rankings
CREATE TABLE squad_rankings (
    id UUID PRIMARY KEY,
    squad_id UUID REFERENCES squads(id),
    total_points INTEGER DEFAULT 0,
    member_count INTEGER,
    rank INTEGER,
    avg_points_per_member INTEGER,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Weekly Leaderboard Snapshot
CREATE TABLE weekly_snapshots (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    week_start DATE,
    points_earned INTEGER,
    final_rank INTEGER,
    reward_claimed BOOLEAN DEFAULT FALSE
);
```

### API Endpoints

#### Get Leaderboard
```
GET /api/leaderboard/:type
Query Params:
  - type: global | city | weekly | friends | squad
  - city_id: (for city leaderboard)
  - limit: default 100
  - offset: for pagination
  
Response:
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "uuid",
      "username": "AlexTheExplorer",
      "avatar_url": "...",
      "points": 45230,
      "level": 47,
      "streak_days": 125,
      "cities_explored": 23,
      "badges": ["master", "photo_expert"]
    }
  ],
  "user_rank": 347,
  "user_points": 8542,
  "total_users": 15230,
  "last_updated": "2025-11-14T10:30:00Z"
}
```

#### Submit Points
```
POST /api/leaderboard/points
Body:
{
  "quest_id": "uuid",
  "points_earned": 150,
  "activity_type": "photo_quest",
  "metadata": {
    "quality_score": 85,
    "city_id": "uuid"
  }
}

Response:
{
  "success": true,
  "new_total": 8692,
  "rank_change": +5,
  "new_rank": 342,
  "achievements_unlocked": ["photo_master_10"]
}
```

### WebSocket Events
```javascript
// Client subscribes to leaderboard updates
socket.emit('subscribe_leaderboard', {
  type: 'weekly',
  user_id: 'uuid'
});

// Server broadcasts rank changes
socket.on('rank_updated', (data) => {
  // {
  //   type: 'weekly',
  //   affected_users: [
  //     { user_id: '...', old_rank: 348, new_rank: 342 }
  //   ],
  //   timestamp: '...'
  // }
});

// Real-time point gains
socket.on('points_earned', (data) => {
  // {
  //   user_id: '...',
  //   points: 150,
  //   source: 'photo_quest',
  //   new_total: 8692
  // }
});
```

---

## 📈 Analytics & Insights

### User Dashboard Metrics
- Personal rank trend (7-day/30-day chart)
- Points breakdown by activity type (pie chart)
- Top performing activities
- Comparison with friends (average)
- Predicted rank at week end
- Recommended quests for maximum points

### Admin Analytics
- Daily active users on leaderboards
- Average points per user
- Most competitive cities
- Churn rate by rank tier
- Engagement metrics per leaderboard type
- Fraud detection alerts

---

## 🚀 Gamification Features

### Power-Ups & Boosters
| Power-Up | Effect | Duration | Cost |
|----------|--------|----------|------|
| 2x Points Boost | Double all quest points | 1 hour | 500 pts |
| Perfect Shot | Guarantee high photo score | 3 photos | 300 pts |
| City Explorer | +50% city quest points | 24 hours | 750 pts |
| Squad Rally | +25% points for whole squad | 12 hours | 1000 pts (shared) |

### Challenges & Tournaments
- **Daily Challenges:** Small quests with bonus points
- **Weekend Warriors:** Saturday-Sunday special events
- **City Takeover:** Monthly event to dominate specific city
- **Photo Battle Royale:** Best photo wins tournament
- **Squad Wars:** Team vs Team seasonal competition

### Progression System
- **Levels 1-100:** Unlock features, power-ups, badges
- **Prestige System:** Reset and earn special colors/icons
- **Title System:** Earn and display titles (e.g., "Master Explorer")
- **Avatar Customization:** Unlock items with achievements

---

## 🛡️ Fairness & Balance

### Fair Play Policies
1. **Region Balancing:** Normalize points based on POI density
2. **Difficulty Scaling:** Harder quests in rural areas give more points
3. **Time Zone Fairness:** Weekly resets consider all time zones
4. **Accessibility Options:** Alternative ways to earn points
5. **Grace Periods:** Keep streak if user explains absence

### Moderation
- Community reporting system
- AI detection for fake activities
- Human review team for disputes
- Appeal process for banned users
- Transparent point calculation

---

## 📱 Mobile App Integration

### Push Notifications
- "You've climbed to rank #342! Keep going! 🚀"
- "Your friend just overtook you! Reclaim your spot! 🎯"
- "Weekly leaderboard resets in 24 hours! 🏆"
- "New challenge available: 3x points! ⚡"
- "You're 50 points from top 10 in your city! 💪"

### Widgets
- **Rank Widget:** Show current rank on home screen
- **Points Widget:** Track daily point progress
- **Friends Widget:** See friends' recent activities

---

## 🎨 Design Philosophy

### Visual Design Principles
1. **Competitive but Friendly:** Motivating without being aggressive
2. **Clear Hierarchy:** Easy to see rankings at a glance
3. **Celebratory:** Reward achievements with visual flair
4. **Accessible:** Readable for all users
5. **Scannable:** Quick to parse important information

### Color Coding
- 🥇 **Gold:** Rank 1-3
- 🥈 **Silver:** Rank 4-10
- 🥉 **Bronze:** Rank 11-50
- 🔵 **Blue:** User's own rank
- ⚪ **White/Gray:** Other ranks

---

## 🌍 Localization & Global Scaling

### Multi-Region Support
- Regional leaderboards for continents
- Country-specific leaderboards
- Language support for all text
- Currency for rewards (local equivalent)
- Cultural sensitivity in challenges

### Scaling Strategy
- Microservices architecture
- CDN for static assets
- Geographic database sharding
- Load balancing across regions
- Caching at multiple levels

---

## 📊 Success Metrics

### KPIs to Track
- **User Engagement:** Daily/Weekly active users
- **Competition Rate:** % of users checking leaderboards daily
- **Point Velocity:** Average points earned per user per day
- **Social Interaction:** Friend challenges, squad activity
- **Retention:** 7-day, 30-day retention by rank tier
- **Monetization:** Premium conversions from competitive users

---

## 🔮 Future Enhancements

### Planned Features
1. **AI Predictions:** Forecast final ranks based on activity patterns
2. **Live Events:** Real-time global competitions
3. **Partnerships:** City tourism board sponsorships
4. **NFT Badges:** Blockchain-verified achievements
5. **AR Challenges:** Augmented reality leaderboard quests
6. **Voice Commands:** "Alexa, what's my rank?"
7. **Smart Watch Integration:** Quick rank checks
8. **Leaderboard Betting:** Predict winners (virtual currency)

---

## 📄 Integration Checklist

- [ ] Design leaderboard UI components
- [ ] Implement database schema
- [ ] Build API endpoints
- [ ] Set up WebSocket server
- [ ] Create scoring algorithm
- [ ] Implement anti-cheat system
- [ ] Design notification system
- [ ] Build admin dashboard
- [ ] Create analytics pipeline
- [ ] Test load performance
- [ ] Implement caching layer
- [ ] Set up monitoring/alerts
- [ ] Write user documentation
- [ ] Launch beta testing
- [ ] Collect feedback and iterate

---

**Document Version:** 1.0
**Last Updated:** November 14, 2025
**Status:** Ready for Development Integration
