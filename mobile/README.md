# TourQuest Mobile App

A React Native mobile application built with Expo for the TourQuest gamified tourism platform.

## Features

✅ **Interactive Map** - View nearby POIs with real-time location tracking
✅ **Quest System** - Complete photo challenges at specific locations
✅ **Camera Integration** - Take photos or select from gallery for quest submissions
✅ **Gamification** - Earn points, maintain streaks, level up
✅ **User Profiles** - Track your progress and achievements
✅ **Real-time Verification** - Photo verification with GPS checking

## Tech Stack

- **React Native** with Expo
- **React Navigation** for screen navigation
- **Expo Location** for GPS/geolocation
- **React Native Maps** for interactive maps
- **Expo Camera** & Image Picker for photo capture
- **Zustand** for state management
- **Axios** for API communication
- **AsyncStorage** for local data persistence

## Mappls API Setup (Optional - For Real Routes)

TourQuest uses Mappls (MapmyIndia) API for accurate road-based navigation routes. This is optional but recommended for better user experience.

### Get Mappls API Key

1. Visit [Mappls Developer Portal](https://www.mappls.com/api/)
2. Sign up for a free account
3. Create a new project/application
4. Get your API key from the dashboard

### Configure API Key

1. Open `.env` file in the mobile directory
2. Replace `YOUR_MAPPLS_API_KEY_HERE` with your actual API key:
```env
EXPO_PUBLIC_MAPPLS_API_KEY=your_actual_api_key_here
```

3. Restart the Expo server:
```bash
npx expo start --tunnel
```

### Features with Mappls API

- ✅ **Real road routes** instead of straight lines
- ✅ **Accurate turn-by-turn directions**
- ✅ **Traffic-aware routing**
- ✅ **Better navigation experience**

### Without API Key

- Routes will show as straight lines between points
- All other features work normally
- Perfect for development and demos

## Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure API endpoint:
   - Open `src/lib/api.js`
   - Update `API_BASE_URL`:
     - iOS Simulator: `http://localhost:3000/api`
     - Android Emulator: `http://10.0.2.2:3000/api`
     - Physical Device: `http://YOUR_COMPUTER_IP:3000/api`

## Running the App

### iOS Simulator (Mac only)

```bash
npm run ios
```

### Android Emulator

```bash
npm run android
```

### Expo Go App (Physical Device)

1. Install Expo Go from App Store or Google Play
2. Start the dev server:
```bash
npm start
```
3. Scan the QR code with your device

## Test Credentials

**Regular User:**
- Email: `explorer1@test.com`
- Password: `password123`

**Admin User:**
- Email: `admin@tourquest.com`
- Password: `admin123`

## Project Structure

```
mobile/
├── App.js                      # Main app with navigation
├── app.json                    # Expo configuration
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js      # Login/Register screen
│   │   ├── MapScreen.js        # Interactive map with POIs
│   │   ├── QuestsScreen.js     # Quest list
│   │   ├── QuestDetailScreen.js # Quest details & submission
│   │   └── ProfileScreen.js    # User profile
│   ├── store/
│   │   └── authStore.js        # Authentication state
│   └── lib/
│       └── api.js              # API client configuration
```

## Key Features Explained

### Map Screen
- Shows user's current location
- Displays nearby POIs as markers
- Real-time location updates
- Pull-to-refresh for POI list

### Quest System
- View available quests
- Filter by difficulty and location
- Take photos for submissions
- Real-time verification with backend

### Camera Integration
- Take photos with device camera
- Select from photo library
- GPS coordinates attached automatically
- EXIF data preserved for verification

### Profile
- View user stats (points, streak, level)
- Track achievements and progress
- Logout functionality

## Permissions Required

- **Location** - To find nearby POIs and verify quest locations
- **Camera** - To take photos for quest submissions
- **Photo Library** - To select existing photos

## Troubleshooting

### Cannot connect to backend

1. Make sure backend is running on `http://localhost:3000`
2. Update API_BASE_URL in `src/lib/api.js`:
   - For Android Emulator use: `http://10.0.2.2:3000/api`
   - For physical device use your computer's IP: `http://192.168.x.x:3000/api`

### Location not working

1. Make sure location permissions are granted
2. Enable location services on your device
3. For iOS Simulator: Features → Location → Custom Location

### Camera not working

1. Grant camera permissions in device settings
2. For iOS Simulator: Camera not available, use gallery instead
3. For Android Emulator: Use virtual camera in settings

## Building for Production

### iOS

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

## Environment Variables

Create a `.env` file in the mobile directory:

```env
API_BASE_URL=http://localhost:3000/api
GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Next Steps

1. Add Google Maps API key for better map functionality
2. Enable push notifications for quest reminders
3. Add offline mode support
4. Implement social features (friends, sharing)
5. Add more quest types and challenges

## Support

For issues or questions, check:
- Backend API documentation at `/backend/API_TESTING.md`
- Expo documentation: https://docs.expo.dev
- React Native Maps: https://github.com/react-native-maps/react-native-maps

---

Built with ❤️ using React Native and Expo
