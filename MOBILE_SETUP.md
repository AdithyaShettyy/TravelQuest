# TourQuest Platform - Complete Setup Guide

## 🎉 Project Overview

TourQuest is a gamified tourism platform with:
- **Web Frontend** (React + Vite)
- **Mobile App** (React Native + Expo) ← **NEW!**
- **Backend API** (Node.js + Express)
- **Verification Service** (Python + Flask)
- **Database** (PostgreSQL 18 + PostGIS)

---

## 📱 Mobile App (NEW!)

### Quick Start

1. **Navigate to mobile directory:**
```bash
cd /Users/adithya/Downloads/Mini_Project/mobile
```

2. **Start Expo:**
```bash
npx expo start
```

3. **Run on device:**
   - **iOS Simulator:** Press `i`
   - **Android Emulator:** Press `a`
   - **Physical Device:** 
     - Install Expo Go app
     - Scan QR code with camera (iOS) or Expo Go (Android)

### Mobile App Features

✅ **Interactive Map** - Real-time location with nearby POIs
✅ **Quest System** - Photo challenges at specific locations  
✅ **Camera Integration** - Take photos or select from gallery
✅ **GPS Verification** - Automatic location checking
✅ **Bottom Tab Navigation** - Easy access to Map, Quests, Profile
✅ **Offline-Ready** - Works with AsyncStorage caching

### Important Configuration

**Update API URL for your device:**

Open `mobile/src/lib/api.js` and update:

```javascript
// For iOS Simulator:
const API_BASE_URL = 'http://localhost:3000/api';

// For Android Emulator:
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// For Physical Device (use your computer's IP):
const API_BASE_URL = 'http://192.168.1.X:3000/api';
```

To find your computer's IP:
```bash
# Mac/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

### Permissions Required

The app will request:
- **Location** - To find nearby attractions
- **Camera** - To take photos for quests  
- **Photo Library** - To select existing photos

---

## 🌐 Web Frontend

### Start Web App

```bash
cd /Users/adithya/Downloads/Mini_Project/frontend
npm run dev
```

Access at: http://localhost:5173

---

## 🔧 Backend Services

### Backend API

```bash
cd /Users/adithya/Downloads/Mini_Project/backend
npm run dev
```

Running on: http://localhost:3000

### Verification Service

```bash
cd /Users/adithya/Downloads/Mini_Project/verification
source venv/bin/activate
python app.py
```

Running on: http://localhost:5000

---

## 🗄️ Database

PostgreSQL 18 with PostGIS is running via Homebrew:

```bash
# Check status
brew services list

# Start/Stop
brew services start postgresql@18
brew services stop postgresql@18
```

---

## 🧪 Test Credentials

**Regular User:**
- Email: `explorer1@test.com`
- Password: `password123`

**Admin User:**
- Email: `admin@tourquest.com`
- Password: `admin123`

**Alternative User:**
- Email: `traveler@test.com`
- Password: `password123`

---

## 📂 Project Structure

```
Mini_Project/
├── mobile/              ← NEW React Native App
│   ├── App.js          # Navigation setup
│   ├── app.json        # Expo config
│   └── src/
│       ├── screens/    # Login, Map, Quests, Profile
│       ├── store/      # Auth state management
│       └── lib/        # API client
├── frontend/           # React web app
├── backend/            # Node.js API
├── verification/       # Python verification service
└── logs/               # Service logs
```

---

## 🚀 Start Everything

### Option 1: Manual Start (Recommended for Development)

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Verification
cd verification && source venv/bin/activate && python app.py

# Terminal 3: Web Frontend
cd frontend && npm run dev

# Terminal 4: Mobile App
cd mobile && npx expo start
```

### Option 2: Use Start Script (Web only)

```bash
./start.sh
```

---

## 📱 Mobile Development Tips

### Testing on iOS Simulator

1. Install Xcode from App Store
2. Run: `npx expo start`
3. Press `i` to open iOS simulator

### Testing on Android Emulator

1. Install Android Studio
2. Create a virtual device (AVD)
3. Run: `npx expo start`
4. Press `a` to open Android emulator

### Testing on Physical Device

1. Install Expo Go:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Make sure your phone and computer are on the same WiFi

3. Update API URL in `mobile/src/lib/api.js` to use your computer's IP

4. Scan QR code from Expo dev server

### Debugging

```bash
# Open React DevTools
npx expo start --dev-client

# View logs
npx expo start --log

# Clear cache
npx expo start -c
```

---

## 🛠️ Troubleshooting

### Mobile can't connect to backend

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Update API URL in mobile app:**
   - iOS Simulator: `http://localhost:3000/api`
   - Android Emulator: `http://10.0.2.2:3000/api`
   - Physical device: `http://YOUR_IP:3000/api`

3. **Allow firewall access** for Node.js if using physical device

### Location not working

1. Grant location permissions in device settings
2. For iOS Simulator: Features → Location → Custom Location
3. For Android Emulator: Extended Controls → Location

### Camera not working

1. Grant camera permissions
2. iOS Simulator: Camera not available, use gallery
3. Android Emulator: Enable virtual scene camera

### Build errors

```bash
# Clean install
cd mobile
rm -rf node_modules
npm install

# Clear Expo cache
npx expo start -c
```

---

## 🎯 Key Features by Platform

### Mobile App (React Native)
- ✅ Native GPS/Camera integration
- ✅ Offline support with AsyncStorage
- ✅ Push notifications (ready)
- ✅ Native performance
- ✅ Touch-optimized UI

### Web App (React)
- ✅ Desktop-friendly layout
- ✅ Admin dashboard access
- ✅ Larger screen real estate
- ✅ Browser-based debugging

---

## 📊 API Endpoints

All endpoints are documented in `/backend/API_TESTING.md`

**Base URL:** 
- Web: `http://localhost:3000/api`
- Mobile iOS Simulator: Same
- Mobile Android: `http://10.0.2.2:3000/api`

**Key Endpoints:**
- `POST /auth/login` - User login
- `GET /pois` - Get nearby POIs
- `GET /quests` - Get available quests
- `POST /submissions` - Submit quest photo

---

## 🔐 Security Notes

1. **Never commit** real API keys
2. **Update JWT_SECRET** in production
3. **Enable HTTPS** for production backend
4. **Rate limiting** is configured (100 req/15min)
5. **CORS** is enabled for localhost only

---

## 📈 Next Steps

### Mobile Enhancements
- [ ] Add push notifications
- [ ] Implement offline quest caching
- [ ] Add social features (friends)
- [ ] Build leaderboard screen
- [ ] Add reward redemption UI
- [ ] Enable photo filters/editing

### Platform Features
- [ ] Add more quest types
- [ ] Implement AR quest mode
- [ ] Add achievement system
- [ ] Create partner dashboard
- [ ] Build analytics panel

### Production Deployment
- [ ] Setup CI/CD pipeline
- [ ] Deploy backend to cloud
- [ ] Configure CDN for images
- [ ] Setup monitoring/logging
- [ ] Build for App Store/Play Store

---

## 📝 Platform Comparison

| Feature | Mobile App | Web App |
|---------|-----------|---------|
| GPS Integration | ✅ Native | ⚠️ Browser API |
| Camera Access | ✅ Native | ⚠️ Browser API |
| Offline Support | ✅ AsyncStorage | ⚠️ LocalStorage |
| Push Notifications | ✅ Ready | ❌ Not implemented |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Admin Features | ❌ | ✅ |
| Best For | Users on-the-go | Admin/Partners |

---

## 🆘 Support

- **Backend API Docs:** `/backend/API_TESTING.md`
- **Mobile README:** `/mobile/README.md`
- **Project Docs:** `/PROJECT_COMPLETE.md`

---

**🎊 You now have both web and mobile platforms running!**

**Web:** http://localhost:5173
**Mobile:** Scan QR code in terminal
**API:** http://localhost:3000
**Verification:** http://localhost:5000
