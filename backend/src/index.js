require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const { sequelize } = require('./models');
const logger = require('./utils/logger');
const { startWeeklyRewardsCron } = require('./jobs/weeklyRewards');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const poiRoutes = require('./routes/pois');
const questRoutes = require('./routes/quests');
const submissionRoutes = require('./routes/submissions');
const leaderboardRoutes = require('./routes/leaderboards');
const leaderboardApiRoutes = require('./routes/leaderboard'); // New leaderboard API
const badgeRoutes = require('./routes/badges');
const rewardRoutes = require('./routes/rewards');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pois', poiRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/leaderboard', leaderboardApiRoutes); // New leaderboard API
app.use('/api/badges', badgeRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/friends', require('./routes/friends'));
app.use('/api/squads', require('./routes/squads'));
app.use('/api/powerups', require('./routes/powerups'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/notifications', require('./routes/notifications'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Subscribe to leaderboard updates
  socket.on('subscribe_leaderboard', (data) => {
    logger.info(`Client ${socket.id} subscribed to leaderboard: ${data.type || 'global'}`);
    socket.join(`leaderboard_${data.type || 'global'}`);
  });

  // Unsubscribe from leaderboard
  socket.on('unsubscribe_leaderboard', (data) => {
    logger.info(`Client ${socket.id} unsubscribed from leaderboard: ${data.type || 'global'}`);
    socket.leave(`leaderboard_${data.type || 'global'}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false });
      logger.info('Database models synchronized');
    }

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Socket.IO enabled for real-time updates`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      
      // Start weekly rewards cron job
      startWeeklyRewardsCron();
      logger.info('Weekly rewards cron job initialized');
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
