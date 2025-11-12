# Mappls API Setup - Step by Step Guide

## Why Mappls?
- ✅ **100% FREE** - No credit card required
- ✅ **Best for India** - Highest quality maps and routes for Indian locations
- ✅ **Easy setup** - Takes just 3 minutes
- ✅ **Made in India** - By MapmyIndia 🇮🇳

---

## Step-by-Step Setup

### Step 1: Go to Mappls Console
Open this link in your browser:
```
https://apis.mappls.com/console/
```

### Step 2: Click "Sign Up"
- You'll see "Sign Up" button in the top-right corner
- Click it to create a new account

### Step 3: Fill the Registration Form
Fill in these details:
- **Name**: Your name
- **Email**: Your email address
- **Mobile**: Your phone number (Indian number)
- **Company/Organization**: You can put "Personal Project" or anything
- **Password**: Create a strong password
- Check the terms and conditions box
- Click **"Sign Up"**

### Step 4: Verify Your Account
- Check your **email** for verification link
- Check your **phone** for OTP (one-time password)
- Enter the OTP to verify

### Step 5: Login to Dashboard
After verification:
1. Go back to: https://apis.mappls.com/console/
2. Login with your email and password
3. You'll see your **Dashboard**

### Step 6: Find Your API Key
On the dashboard, you'll see:
- **REST API Key** or **Consumer Key**
- It looks like a long string: `abcd1234efgh5678ijkl9012mnop3456`
- Click the **"Copy"** icon next to it

### Step 7: Add to Your App

Open terminal and edit the `.env` file:
```bash
cd /Users/adithya/Downloads/Mini_Project/mobile
nano .env
```

Find the line that says:
```
EXPO_PUBLIC_MAPPLS_API_KEY=
```

Paste your API key after the `=`:
```
EXPO_PUBLIC_MAPPLS_API_KEY=abcd1234efgh5678ijkl9012mnop3456
```

Save the file:
- Press `Ctrl+X`
- Press `Y` (for yes)
- Press `Enter`

### Step 8: Restart Expo
```bash
# Press Ctrl+C to stop the current Expo server
# Then start it again:
npx expo start --tunnel
```

---

## ✅ Verification

Watch the Expo terminal logs. You should see:

**Before (without API key):**
```
⚠️  No Mappls API key - using straight line
```

**After (with API key):**
```
✅ Got real route: 247 points, 3.45 km, ~12 min
```

If you see the ✅ message, **it's working perfectly!**

---

## Troubleshooting

### Issue: Still seeing "No Mappls API key" message

**Solution:**
1. Make sure you saved the `.env` file properly
2. Check there's no space between `EXPO_PUBLIC_MAPPLS_API_KEY=` and your key
3. Restart Expo completely (Ctrl+C, then start again)

### Issue: Seeing "401 - Check your API key" message

**Solution:**
1. Your API key is incorrect
2. Go back to https://apis.mappls.com/console/
3. Copy the key again (make sure you copy the full key)
4. Paste it again in `.env` file

### Issue: Seeing "403 Forbidden" message

**Solution:**
1. Your account might not be verified yet
2. Check your email and phone for verification messages
3. Complete the verification process
4. Wait a few minutes and try again

### Issue: Can't find the .env file

**Solution:**
```bash
# Check if it exists:
ls -la /Users/adithya/Downloads/Mini_Project/mobile/.env

# If it doesn't exist, create it:
cd /Users/adithya/Downloads/Mini_Project/mobile
touch .env
nano .env

# Add these lines:
EXPO_PUBLIC_MAPPLS_API_KEY=YOUR_KEY_HERE
EXPO_PUBLIC_API_URL=http://192.168.1.39:3000
```

---

## What You'll Get

Once Mappls is set up:

✅ **Real Road Routes**
- Routes follow actual roads in Mangalore
- Turn-by-turn navigation paths
- Accurate distances and travel times

✅ **High Quality for India**
- Better than Google Maps for Indian locations
- Most up-to-date road data
- Includes local streets and landmarks

✅ **Completely Free**
- No limits for personal projects
- No credit card ever needed
- No hidden charges

---

## Quick Reference

| What | Where |
|------|-------|
| **Sign Up** | https://apis.mappls.com/console/ |
| **Dashboard** | https://apis.mappls.com/console/ |
| **API Docs** | https://apis.mappls.com/advancedmaps/doc/routing-api |
| **Support** | support@mappls.com |

---

## Alternative: Use Without API Key

Your app works fine without Mappls API key:
- Shows straight-line routes
- Accurate distances
- All features work
- Just doesn't follow real roads

But with Mappls (3-minute setup), you get **professional-grade navigation** for free!

---

## Next Steps

After setup:
1. Open your app in Expo Go
2. Tap "Show Routes" button
3. Watch routes follow **real roads** in Mangalore! 🎉

Check `QUICK_START.md` for the simplified version of this guide.

