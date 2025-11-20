# Navigation Routing Setup Guide

The app currently uses straight-line fallback routes for navigation. To get **real road-based routing** like Google Maps, you need to set up a routing API service.

## Quick Setup (Recommended): Mapbox Directions API

Mapbox offers the **most generous free tier** for routing:
- ✅ **100,000 requests/month FREE**
- ✅ No credit card required initially
- ✅ Easy setup (5 minutes)
- ✅ Same quality as Google Maps

### Step 1: Create Mapbox Account

1. Go to: https://account.mapbox.com/auth/signup/
2. Sign up with email (no credit card needed)
3. Verify your email

### Step 2: Get Access Token

1. After login, you'll see your **Default Public Token**
2. Copy the token (starts with `pk.`)
3. Or create a new token at: https://account.mapbox.com/access-tokens/

### Step 3: Add Token to Your App

1. Open `/Users/adithya/Downloads/Mini_Project/mobile/.env`
2. Add this line:
   ```
   EXPO_PUBLIC_MAPBOX_TOKEN=pk.YOUR_TOKEN_HERE
   ```
3. Replace `pk.YOUR_TOKEN_HERE` with your actual token

### Step 4: Restart Expo

```bash
cd /Users/adithya/Downloads/Mini_Project/mobile
npx expo start --tunnel
```

That's it! The app will now show real road routes following actual streets.

---

## Alternative Options

### Option 2: Google Maps Directions API

If you prefer Google Maps:

**Free Tier**: $200 monthly credit = ~40,000 requests

1. Go to: https://console.cloud.google.com/google/maps-apis
2. Create/select a project
3. Enable **Directions API**
4. Create an API key
5. Add to `.env`:
   ```
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
   ```

**Note**: Requires credit card for verification, but won't charge within free tier.

### Option 3: OpenRouteService

**Free Tier**: 2,000 requests/day

1. Sign up: https://openrouteservice.org/dev/#/signup
2. Get API key
3. Add to `.env`:
   ```
   EXPO_PUBLIC_ORS_API_KEY=YOUR_KEY_HERE
   ```

---
## Testing Without API Key

The app will work without any API key using straight-line fallback routes. These are:
- ✅ Simple and reliable
- ✅ Show distance accurately
- ✅ Work offline
- ❌ Don't follow roads
- ❌ Don't account for obstacles

For a better experience, set up Mapbox (takes 5 minutes, completely free).

---

## How It Works

The app tries to fetch routes in this order:

1. **Check cache** - Previously fetched routes are cached
2. **Try API** - Fetch real route from configured service (Mapbox/Google/ORS)
3. **Fallback** - Use straight line if API fails or not configured

All requests are cached to minimize API usage and work offline after the first fetch.

---

## Troubleshooting

### "401 Unauthorized" or "403 Forbidden"
- Check your API key is correct in `.env`
- Verify the API key has proper permissions
- For Mapbox: ensure you're using a **public token** (starts with `pk.`)

### "429 Too Many Requests"
- You've exceeded the free tier limits
- Wait for quota to reset (usually next day)
- Or upgrade to paid tier

### Routes still showing as straight lines
- Make sure `.env` file has the correct token
- Restart Expo completely: `Ctrl+C` then `npx expo start --tunnel`
- Check logs for error messages (they'll show why real routing failed)

### Can't see `.env` file
- It's a hidden file. In terminal: `ls -la /Users/adithya/Downloads/Mini_Project/mobile/.env`
- Edit with: `nano /Users/adithya/Downloads/Mini_Project/mobile/.env`

---

## API Comparison

| Service | Free Tier | Requires Card | Setup Time | Quality |
|---------|-----------|---------------|------------|---------|
| **Mapbox** | 100K/month | No | 5 min | ⭐⭐⭐⭐⭐ |
| Google Maps | 40K/month | Yes | 10 min | ⭐⭐⭐⭐⭐ |
| OpenRouteService | 2K/day | No | 5 min | ⭐⭐⭐⭐ |
| Fallback (current) | Unlimited | No | 0 min | ⭐⭐ |

**Recommendation**: Use Mapbox for the best free tier.

---

## Questions?

- Mapbox docs: https://docs.mapbox.com/api/navigation/directions/
- Google Maps docs: https://developers.google.com/maps/documentation/directions
- OpenRouteService docs: https://openrouteservice.org/dev/#/api-docs

