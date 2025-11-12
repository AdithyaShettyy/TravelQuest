# Quick Start Guide

## 🚀 Fast Setup (5 minutes)

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org/))
- Python 3.9+ ([download](https://www.python.org/))
- PostgreSQL 14+ with PostGIS ([download](https://www.postgresql.org/))

### Option 1: Automated Setup (Recommended)
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

#### 1. Database
```bash
# Create database
createdb tourism_platform
psql tourism_platform -c "CREATE EXTENSION postgis;"
```

#### 2. Backend API
```bash
cd backend
cp .env.example .env
# Edit .env with your settings
npm install
npm run seed    # Add test data
npm run dev     # Start server on port 3000
```

#### 3. Verification Service
```bash
cd verification
cp .env.example .env
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py   # Start service on port 5000
```

#### 4. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # Start app on port 5173
```

## 🎮 Test the App

1. Open http://localhost:5173
2. Register or login with test account:
   - Email: `explorer1@test.com`
   - Password: `password123`
3. View map with POIs
4. Browse quests
5. Check leaderboards

## 🔑 API Keys (Optional for MVP)

The app works without API keys, but you can enhance it:

### Maps (Optional)
- **Mapbox**: Better maps and geocoding
  - Get key: https://www.mapbox.com/
  - Add to `frontend/.env`: `VITE_MAPBOX_TOKEN=your_key`

### File Storage (For Production)
- **AWS S3**: Image storage
  - Get credentials from AWS Console
  - Add to `backend/.env`:
    ```
    AWS_ACCESS_KEY_ID=your_key
    AWS_SECRET_ACCESS_KEY=your_secret
    AWS_S3_BUCKET=your_bucket
    ```

### Email (Optional)
- **SendGrid**: Notifications
  - Get API key: https://sendgrid.com/
  - Add to `backend/.env`: `SENDGRID_API_KEY=your_key`

## 📊 Database Schema

The app creates these tables automatically:
- `users` - User accounts and points
- `pois` - Points of interest (locations)
- `quests` - Photo challenges at POIs
- `submissions` - User photo submissions
- `badges` - Achievement badges
- `rewards` - Redeemable rewards
- `leaderboards` - Rankings
- `user_badges` - User-badge relationships
- `reward_redemptions` - Reward usage tracking

## 🧪 Testing

### Test POIs
5 locations seeded in New York City:
- Central Park
- Statue of Liberty
- Brooklyn Bridge
- Times Square
- Empire State Building

### Test Users
- Admin: `admin@tourquest.com` / `admin123`
- User: `explorer1@test.com` / `password123`
- User: `traveler@test.com` / `password123`

## 🐛 Troubleshooting

### Database connection error
```bash
# Check if PostgreSQL is running
brew services list  # macOS
# or
pg_ctl status       # Other systems

# Restart if needed
brew services restart postgresql
```

### Python packages error
```bash
# On macOS, you might need:
brew install opencv
```

### Port already in use
```bash
# Change ports in .env files:
# Backend: PORT=3001
# Frontend: VITE_PORT=5174
# Verification: PORT=5001
```

## 📱 Mobile Testing

The frontend is responsive. Test on mobile:
1. Find your local IP: `ifconfig | grep inet`
2. Access from phone: `http://YOUR_IP:5173`

## 🚢 Production Deployment

See `docs/DEPLOYMENT.md` for:
- Docker deployment
- Environment variables
- Cloud hosting (AWS/Heroku/Railway)
- Database migrations
- CI/CD setup

## 🔥 Core Features Working

✅ User authentication (register/login)
✅ Interactive map with POIs
✅ Quest browsing and filtering
✅ Photo submission with verification
✅ Points and scoring system
✅ Streak tracking
✅ Badge system
✅ Rewards catalog
✅ Leaderboards
✅ Admin panel

## 🛠️ Tech Stack

- **Backend**: Node.js + Express + Sequelize
- **Database**: PostgreSQL + PostGIS
- **Verification**: Python + Flask + OpenCV
- **Frontend**: React + Vite + TailwindCSS
- **Maps**: Leaflet + OpenStreetMap

## 📞 Need Help?

Check the main README.md for detailed docs and API reference.

---
Happy exploring! 🎯
