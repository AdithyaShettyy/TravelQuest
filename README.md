# TravelQuest - Gamified Tourism Platform

A location-based tourism gamification platform with photo verification, challenges, and rewards. Built with React Native (Expo) mobile app and Node.js backend.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL 14+ with PostGIS
- Expo CLI (`npm install -g @expo/cli`)
- Git

### 1. Clone and Setup
```bash
git clone https://github.com/AdithyaShettyy/TravelQuest.git
cd TravelQuest
```

### 2. Start Backend Server
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
npm run seed
npm start
```
Backend will run on `http://localhost:3000`

### 3. Start Mobile App
```bash
cd mobile
npm install
cp .env.example .env
# Add your API keys to .env
npx expo start --lan
```

### 4. Scan QR Code
- Use Expo Go app on your phone
- Scan the QR code shown in terminal
- Make sure phone and computer are on same WiFi network

## 📱 Mobile App Features
- 🗺️ Interactive map with hidden attractions
- 📸 Photo verification with angle matching
- 🏆 Dynamic scoring and leaderboards
- 🎖️ Badges and achievement system
- 👥 Squad challenges and rewards
- 📍 GPS-based location discovery

## 🛠️ Development Commands

### Backend
```bash
cd backend

# Install dependencies
npm install

# Development server
npm run dev

# Production server
npm start

# Database migration
npm run migrate

# Seed database
npm run seed

# Run tests
npm test
```

### Mobile App
```bash
cd mobile

# Install dependencies
npm install

# Start development server
npx expo start

# Start with LAN access (for physical device)
npx expo start --lan

# Start with tunnel (if LAN doesn't work)
npx expo start --tunnel

# Build for production
npx expo build:android
npx expo build:ios

# Clear cache (if issues)
npx expo r -c
```

### Frontend (Web Version)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## � Environment Setup

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/tourism_platform
JWT_SECRET=your_jwt_secret_here
REDIS_URL=redis://localhost:6379

# Optional APIs
MAPPLS_API_KEY=your_mappls_api_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

### Mobile App (.env)
```env
EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3000
EXPO_PUBLIC_MAPPLS_API_KEY=your_mappls_api_key
```

## 🗄️ Database Setup

### macOS
```bash
# Install PostgreSQL and PostGIS
brew install postgresql postgis

# Start PostgreSQL service
brew services start postgresql

# Create database
createdb tourism_platform

# Enable PostGIS extension
psql tourism_platform -c "CREATE EXTENSION postgis;"
```

### Windows/Linux
```bash
# Install PostgreSQL with PostGIS
# Then create database:
createdb tourism_platform
psql tourism_platform -c "CREATE EXTENSION postgis;"
```

## 📱 Testing on Device

1. **Install Expo Go** on your phone from App Store/Google Play
2. **Connect to same network** as your computer
3. **Run the app**:
   ```bash
   cd mobile
   npx expo start --lan
   ```
4. **Scan QR code** with Expo Go app
5. **Grant permissions** for location services when prompted

## 🔧 Troubleshooting

### Backend Issues
```bash
# Check if port 3000 is free
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Mobile App Issues
```bash
# Clear Expo cache
npx expo r -c

# Clear Metro bundler cache
npx expo start -c

# Check Expo CLI version
npx expo --version
```

### Network Issues
- Make sure firewall allows connections on port 3000
- Try different Expo start options: `--lan`, `--tunnel`, `--localhost`
- Check if your phone and computer are on the same network

## 🎯 Core Features
- **Hidden Attraction Discovery**: GPS-based POI discovery
- **Photo Verification**: Angle matching with reference images
- **Gamification**: Points, streaks, badges, leaderboards
- **Social Features**: Squad challenges and rewards
- **Admin Panel**: POI and quest management

## �️ Tech Stack
- **Mobile**: React Native, Expo
- **Backend**: Node.js, Express, PostgreSQL, PostGIS
- **Frontend**: React, Vite, TailwindCSS
- **Maps**: Mappls API integration
- **Authentication**: JWT
- **Image Processing**: Python, OpenCV (verification service)

## 📊 API Endpoints
- `GET /api/pois` - Get nearby points of interest
- `POST /api/auth/login` - User authentication
- `POST /api/submissions` - Submit quest completion
- `GET /api/leaderboard` - Get rankings
- `GET /api/badges` - Get user achievements

## � Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## � License
MIT License - see LICENSE file for details

---
Built with 🎯 to make tourism fun, not homework.
