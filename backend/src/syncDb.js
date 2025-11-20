require('dotenv').config();
const { sequelize, User, Squad, SquadMember, Friendship, PowerUp, Achievement, UserAchievement } = require('./models');

async function syncDatabase() {
  try {
    console.log('Starting database sync...');
    
    // Sync in the correct order to handle foreign keys
    await User.sync({ force: false });
    console.log('✓ User table synced');
    
    await Friendship.sync({ force: false });
    console.log('✓ Friendship table synced');
    
    await Squad.sync({ force: false });
    console.log('✓ Squad table synced');
    
    await SquadMember.sync({ force: false });
    console.log('✓ SquadMember table synced');
    
    await PowerUp.sync({ force: false });
    console.log('✓ PowerUp table synced');
    
    await Achievement.sync({ force: false });
    console.log('✓ Achievement table synced');
    
    await UserAchievement.sync({ force: false });
    console.log('✓ UserAchievement table synced');
    
    console.log('✅ Database sync complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

syncDatabase();
