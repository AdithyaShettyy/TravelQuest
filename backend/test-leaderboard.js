const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Test leaderboard functionality
async function testLeaderboard() {
  try {
    console.log('🧪 Testing Leaderboard API\n');

    // 1. Fetch global leaderboard
    console.log('1️⃣ Fetching global leaderboard...');
    const leaderboardResponse = await axios.get(`${API_URL}/leaderboard/global?limit=10`);
    console.log('✅ Global Leaderboard:', leaderboardResponse.data);
    console.log(`   Found ${leaderboardResponse.data.leaderboard.length} users\n`);

    // 2. Get user rank (using first user from leaderboard)
    if (leaderboardResponse.data.leaderboard.length > 0) {
      const firstUser = leaderboardResponse.data.leaderboard[0];
      console.log(`2️⃣ Fetching rank for user: ${firstUser.username}...`);
      const rankResponse = await axios.get(`${API_URL}/leaderboard/rank/${firstUser.id}`);
      console.log('✅ User Rank:', rankResponse.data);
      console.log(`   Rank: #${rankResponse.data.rank} (Top ${rankResponse.data.percentile}%)\n`);

      // 3. Update user points
      console.log(`3️⃣ Adding 100 points to ${firstUser.username}...`);
      const updateResponse = await axios.post(`${API_URL}/leaderboard/update-points`, {
        userId: firstUser.id,
        points: 100,
        activityType: 'location_visit'
      });
      console.log('✅ Points Updated:', updateResponse.data);
      console.log(`   New Total: ${updateResponse.data.newTotal} points`);
      console.log(`   Rank Change: ${updateResponse.data.rankChange > 0 ? '+' : ''}${updateResponse.data.rankChange}\n`);
    }

    // 4. Fetch city leaderboard
    console.log('4️⃣ Fetching city leaderboard (Mangalore)...');
    const cityResponse = await axios.get(`${API_URL}/leaderboard/city/mangalore?limit=10`);
    console.log('✅ City Leaderboard:', cityResponse.data);
    console.log(`   Found ${cityResponse.data.leaderboard.length} users\n`);

    console.log('✨ All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testLeaderboard();
