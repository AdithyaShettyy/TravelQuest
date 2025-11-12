# 🚀 TourQuest Mobile App - Quick Start Guide

## ✅ Current Setup Status

- **Backend API**: Running on `http://192.168.1.39:3000`
- **Expo Dev Server**: Running on `http://192.168.1.39:8081` (LAN mode)
- **POIs Available**: 9 locations in Mangalore
- **Quests Available**: 4 photo challenges

## 📱 How to Connect Your Physical Device

### Step 1: Network Requirements
**CRITICAL**: Your phone and computer MUST be on the **same WiFi network**!

- Computer WiFi: `[Check your WiFi settings]`
- Phone WiFi: **Must match computer WiFi**

### Step 2: Scan QR Code
1. Open **Expo Go** app on your phone
2. Tap **Scan QR Code**
3. Scan the QR code displayed in your terminal

### Step 3: Grant Permissions
When the app loads:
1. **Allow location access** when prompted
2. **Enable location services** in phone settings if needed

## ❌ Troubleshooting "Network Error"

### Problem: "Failed to fetch POIs" or "Failed to fetch quests"

**Root Cause**: Your phone cannot reach the backend API

**Solutions**:

### Solution 1: Verify Same WiFi Network
```bash
# Check your computer's IP
ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1

# Output should show: inet 192.168.1.39
```

- Make sure your phone WiFi matches this network
- **Avoid**: Guest WiFi networks (they block device communication)
- **Avoid**: Mobile hotspot mode

### Solution 2: Test Backend Accessibility
From your computer terminal:
```bash
# Test if backend is running
curl http://192.168.1.39:3000/health

# Should return: {"status":"healthy","timestamp":"..."}
```

### Solution 3: Restart Servers
```bash
# Use the startup script
cd /Users/adithya/Downloads/Mini_Project
./start-servers.sh
```

Or manually:
```bash
# Stop everything
pkill -f "node src/index.js"
pkill -f "expo"

# Start backend
cd /Users/adithya/Downloads/Mini_Project/backend
node src/index.js &

# Wait 3 seconds
sleep 3

# Start Expo
cd /Users/adithya/Downloads/Mini_Project/mobile
npx expo start --lan
```

### Solution 4: Check Firewall
Your Mac firewall might be blocking connections:
1. Go to **System Settings** → **Network** → **Firewall**
2. Turn firewall **OFF** temporarily for testing
3. Or add Node.js to allowed apps

### Solution 5: Use Tunnel Mode (If LAN fails)
```bash
cd /Users/adithya/Downloads/Mini_Project/mobile
npx expo start --tunnel
```

**Note**: Tunnel mode is slower but works without same WiFi network

## 🎯 Expected Behavior

### When App Loads Successfully:
1. ✅ Map screen shows your location (blue dot)
2. ✅ **9 POI markers** appear (blue pins)
3. ✅ Tap markers to see POI details
4. ✅ Quests tab shows **4 available quests**
5. ✅ Profile tab displays user info

### POIs You Should See (in Mangalore):
1. Tannirbhavi Beach
2. Panambur Beach
3. Someshwara Beach
4. Sultan Battery (Historic watchtower)
5. Mangaladevi Temple
6. St. Aloysius Chapel
7. Kudroli Gokarnath Temple
8. Kadri Manjunath Temple
9. Pilikula Nisargadhama (Nature park)

## 🔍 Debug Steps

### Check if servers are running:
```bash
# Backend check
lsof -iTCP:3000 -sTCP:LISTEN

# Expo check  
lsof -iTCP:8081 -sTCP:LISTEN

# Both should show processes running
```

### Test API endpoints:
```bash
# Health check
curl http://192.168.1.39:3000/health

# POIs (should return 9 items)
curl "http://192.168.1.39:3000/api/pois/nearby?lat=12.8696&lng=74.9261&radius=5000"

# Quests (should return 4 items)
curl http://192.168.1.39:3000/api/quests
```

### View backend logs:
```bash
cd /Users/adithya/Downloads/Mini_Project/backend
tail -f backend.log
```

### Clear app cache (if needed):
In Expo Go app:
1. Shake device
2. Tap **"Reload"**
3. Or force close and reopen Expo Go

## 📞 Still Having Issues?

### Common Error Messages:

| Error | Cause | Solution |
|-------|-------|----------|
| "Network Error" | Phone can't reach backend | Check same WiFi network |
| "Location unavailable" | Location permission denied | Enable in phone settings |
| "0 places nearby" | API working but no data | Backend needs restart |
| "Failed to fetch POIs" | Backend not running | Start backend server |
| "Connection timeout" | Firewall blocking | Disable firewall temporarily |

## 🎉 Quick Start Command

Just run this:
```bash
cd /Users/adithya/Downloads/Mini_Project
./start-servers.sh
```

Then scan the QR code with Expo Go!

---

**Last Updated**: November 11, 2025
**Your IP**: 192.168.1.39
**Backend Port**: 3000
**Expo Port**: 8081
