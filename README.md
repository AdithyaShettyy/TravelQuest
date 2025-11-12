# Gamified Tourism Platform - MVP

A location-based tourism gamification platform with photo verification, challenges, and rewards.

## 🎯 Core Features
- Hidden attraction discovery map
- Photo-angle matching with ghost overlay reference
- GPS + visual verification (anti-cheat)
- Dynamic scoring with streaks and multipliers
- Real-time leaderboards
- Badges and partner rewards
- Admin CMS for POIs/quests

## 🏗️ Architecture

```
├── backend/           # Node.js + Express API
├── frontend/          # React web app
├── verification/      # Python Flask image verification service
├── database/          # PostgreSQL schemas and migrations
└── docs/             # API documentation and guides
```

## 🚀 Tech Stack
- **Backend API**: Node.js, Express, PostgreSQL, PostGIS, Redis
- **Frontend**: React, Leaflet (maps), TailwindCSS
- **Verification**: Python, OpenCV, Flask
- **Auth**: JWT
- **Storage**: S3-compatible (local for dev)

## 📋 Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+ with PostGIS
- Redis (optional for production)

## ⚙️ Setup

### 1. Database Setup
```bash
# Install PostgreSQL with PostGIS
# macOS:
brew install postgresql postgis

# Start PostgreSQL
brew services start postgresql

# Create database
createdb tourism_platform
psql tourism_platform -c "CREATE EXTENSION postgis;"
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
npm run seed
npm run dev
```

### 3. Verification Service Setup
```bash
cd verification
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

## 🔑 API Keys Needed (Tell me when you have these)
- **Optional for MVP**: 
  - Mapbox/Google Maps API key (for better maps)
  - AWS S3 credentials (for production file storage)
  - SendGrid/Email service (for notifications)

## 📊 SDG-9 Alignment
- Open geodata for city analytics
- Local business footfall measurement
- Accessible low-bandwidth modes
- Infrastructure sustainability metrics

## 🎮 Game Economy
- Base points by difficulty (10-100)
- Streak multipliers (1.0-2.0x)
- Squad bonuses (+20%)
- Seasonal decay to keep fresh
- Reward cooldowns (anti-farming)

## 🔒 Anti-Cheat
- GPS geofence validation (±50m)
- EXIF metadata checks
- Visual verification: pHash → SSIM → Keypoint matching
- Submission rate limiting
- Anomaly detection

## 📅 MVP Timeline
Week 1-2: Core API + DB
Week 3-4: Verification service
Week 5-6: Frontend core
Week 7-8: Gamification + scoring
Week 9-10: Admin panel
Week 11: Testing + seed data
Week 12: Deploy + polish

## 🧪 Testing
```bash
# Backend tests
cd backend && npm test

# Verification tests
cd verification && pytest

# Frontend tests
cd frontend && npm test
```

## 📖 Documentation
- API Documentation: `docs/API.md`
- Database Schema: `docs/DATABASE.md`
- Deployment Guide: `docs/DEPLOYMENT.md`

---
Built with 🎯 to make tourism fun, not homework.
