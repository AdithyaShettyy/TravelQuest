# Quick Start - Get Real Road Routes (3 Minutes)

Your app currently shows **straight-line routes**. Follow these steps to get **real road-based routing** like Google Maps:

## Mappls (MapmyIndia) - 100% FREE for India! 🇮🇳

✅ **NO credit card required**  
✅ **FREE for Indian locations**  
✅ **Works perfectly for Mangalore**  
✅ **Best quality for India**

### Step 1: Sign Up (1 minute)
1. Go to: **https://apis.mappls.com/console/**
2. Click "Sign Up" (top right)
3. Fill in:
   - Name
   - Email
   - Phone number
   - Company name (can be anything, even "Personal Project")
   - Click "Sign Up"
4. Verify your email and phone

### Step 2: Get API Key (1 minute)
1. Login to: **https://apis.mappls.com/console/**
2. You'll see your dashboard
3. Look for **"REST API Key"** or **"Consumer Key"**
4. Copy the key (looks like: `abc123xyz456...`)

### Step 3: Add to App (1 minute)
```bash
# Open .env file
nano /Users/adithya/Downloads/Mini_Project/mobile/.env

# Replace the MAPPLS_API_KEY line with your key:
EXPO_PUBLIC_MAPPLS_API_KEY=YOUR_KEY_HERE

# Save: Ctrl+X, then Y, then Enter
```

### Step 4: Restart App
```bash
# Stop Expo (Ctrl+C in the terminal where it's running)
# Start again
cd /Users/adithya/Downloads/Mini_Project/mobile
npx expo start --tunnel
```

## Done! 🎉

Watch the Expo logs - you'll see:
```
✅ Got real route: 247 points, 3.45 km, ~12 min
```

Your routes will now follow **real Indian roads** perfectly!

---

## Why Mappls?

| Feature | Mappls | Google Maps | Mapbox |
|---------|--------|-------------|---------|
| **Cost** | FREE | Requires card | Requires card |
| **India Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Setup Time** | 3 min | 10 min | 5 min |
| **Best For** | India 🇮🇳 | Global | Global |

For Indian locations (Mangalore, Bangalore, etc.), **Mappls is the best choice!**

---

## Troubleshooting

### Still seeing straight lines?

Check the Expo logs:

**If you see:**
```
⚠️  No Mappls API key - using straight line
```
→ Add your API key to `.env` file

**If you see:**
```
❌ Mappls API returned 401 - using straight line
```
→ Your API key is wrong, check it again

**If you see:**
```
✅ Got real route: 247 points, 3.45 km
```
→ **It's working!** Routes follow real roads 🎉

### Can't find .env file?
```bash
ls -la /Users/adithya/Downloads/Mini_Project/mobile/.env
```

### Need to edit .env?
```bash
nano /Users/adithya/Downloads/Mini_Project/mobile/.env
# Or use any text editor
```

---

## Using Without API Key

The app works fine with straight-line routes:
- ✅ Shows accurate distances
- ✅ All navigation features work
- ✅ No setup required
- ❌ Just won't follow actual roads

But setting up Mappls takes only **3 minutes** and is **completely free**!

---

## Questions?

- Mappls Console: https://apis.mappls.com/console/
- Mappls Docs: https://apis.mappls.com/advancedmaps/doc/routing-api
- Need help? Check `ROUTING_SETUP.md` for detailed guide

