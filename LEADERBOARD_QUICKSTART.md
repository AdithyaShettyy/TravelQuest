# TravelQuest Leaderboard - Quick Start Guide

## ✅ What's Been Implemented

The leaderboard system is now fully functional with:
- ✅ Real-time Socket.IO updates
- ✅ Global and City leaderboards  
- ✅ User rank calculation with percentiles
- ✅ Professional mobile UI
- ✅ Top 3 trophy display (Gold/Silver/Bronze)
- ✅ Pull-to-refresh functionality
- ✅ New tab between Quests and Profile

## 🚀 How to Test

### 1. Check the Backend

The backend should already be running with Socket.IO enabled:

```bash
ps aux | grep "node.*index.js" | grep -v grep
```

You should see the node process. Backend logs show:
```
info: Server running on port 3000
info: Socket.IO enabled for real-time updates
info: Environment: development
```

### 2. Open the Mobile App

On your phone (Expo Go app):
1. Scan the QR code from the Metro bundler
2. App will load with 4 tabs now: Map, Quests, **Leaderboard**, Profile
3. Tap the **Leaderboard** tab (podium icon - 3rd tab)

### 3. Explore the Leaderboard

You'll see:
- **Your Rank Card** at the top showing your position and percentile
- **Two Tabs**: Global and City
- **Leaderboard List** with all users ranked by points
- **Top 3 users** have special trophy icons (🥇🥈🥉)
- **Your entry** is highlighted in blue

### 4. Test Real-Time Updates

Run this command to add 100 points to a user:

```bash
cd backend
node -e "
const axios = require('axios');
axios.post('http://localhost:3000/api/leaderboard/update-points', {
  userId: '0e7436ee-9c8d-4a93-a065-34c2afbff6fe',
  points: 100,
  activityType: 'test'
}).then(res => console.log('Points added:', res.data));
"
```

**Watch the leaderboard update in real-time on your phone!** No need to refresh.

### 5. Pull to Refresh

Swipe down on the leaderboard screen to manually refresh the data.

## 📊 Current Test Data

Your database has 3 users:
1. **explorer1** - 1450 points, Level 3 (After test)
2. **traveler99** - 890 points, Level 2
3. **admin** - 0 points, Level 1

## 🔗 API Endpoints You Can Test

### Get Global Leaderboard
```bash
curl http://localhost:3000/api/leaderboard/global?limit=10
```

### Get User Rank
```bash
curl http://localhost:3000/api/leaderboard/rank/0e7436ee-9c8d-4a93-a065-34c2afbff6fe
```

### Add Points
```bash
curl -X POST http://localhost:3000/api/leaderboard/update-points \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "0e7436ee-9c8d-4a93-a065-34c2afbff6fe",
    "points": 50,
    "activityType": "location_visit"
  }'
```

### Get City Leaderboard
```bash
curl http://localhost:3000/api/leaderboard/city/mangalore?limit=10
```

## 🎯 Scoring System

When you implement point awards in your app, use these values:

| Activity | Points |
|----------|--------|
| Visit POI | 50 |
| Complete Quest | 100-200 |
| Upload Photo | 75 |
| Discover Hidden Location | 150 |
| Complete Route | 100 |

### Example Integration

In your MapScreen or QuestsScreen:
```javascript
// After user completes a quest or visits POI
const response = await fetch(`${API_URL}/api/leaderboard/update-points`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    points: 100,
    activityType: 'quest_completion'
  })
});

// Leaderboard updates automatically via Socket.IO!
```

## 🎨 UI Features

### Your Rank Card
- Large trophy badge icon
- Your current rank (#347, etc.)
- Percentile badge (Top 5%, Top 25%)
- Total points with star icon

### Leaderboard Items
- **Top 3**: Gold, Silver, Bronze trophy icons
- **Rank Numbers**: For everyone else (#4, #5, etc.)
- **Avatar**: Profile picture or placeholder
- **Username**: Display name + "(You)" badge for current user
- **Level Badge**: Purple flash icon
- **Streak Counter**: Orange flame icon
- **Points**: Large bold number

### Tabs
- **Global** (🌍): Worldwide rankings
- **City** (📍): Local competition

## 🔄 What Happens Automatically

1. **Points Update**: When ANY user earns points via the API
2. **Socket Event**: Server broadcasts to all connected clients
3. **UI Update**: LeaderboardScreen receives event and refreshes
4. **Rank Recalculation**: Everyone's rank updates instantly
5. **No Refresh Needed**: Changes appear in real-time

## 📱 Navigation

The app now has 4 tabs:
1. **Map** (🗺️): Explore POIs and navigate
2. **Quests** (🏆): View available challenges
3. **Leaderboard** (🏆 Podium): NEW - Rankings and competition
4. **Profile** (👤): User profile and stats

## 🐛 Troubleshooting

### Backend not responding?
```bash
cd /Users/adithya/Downloads/Mini_Project/backend
pkill -f "node.*index.js"
NODE_ENV=development node src/index.js > backend.log 2>&1 &
tail -f backend.log
```

### Socket.IO not connecting?
Check the mobile console logs for:
```
✅ Connected to leaderboard socket
```

If you see connection errors, verify the API_URL in mobile/.env matches your backend IP.

### Leaderboard empty?
Run the test script to verify data:
```bash
cd backend
node test-leaderboard.js
```

## 🎉 You're All Set!

The leaderboard system is ready to use. As you add point-earning features to other parts of your app (quest completion, POI visits, etc.), just call the `/api/leaderboard/update-points` endpoint and the leaderboard will update automatically!

## 📚 Full Documentation

See `LEADERBOARD_SYSTEM.md` for complete technical documentation including:
- Full API reference
- Database schema
- Socket.IO event details
- Integration examples
- Future enhancement plans
