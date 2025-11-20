#!/bin/bash

# Start All Services for TravelQuest

echo "🚀 Starting TravelQuest Services..."

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "node src/index.js" 2>/dev/null
pkill -f "lt --port 3000" 2>/dev/null
pkill -f "expo start" 2>/dev/null
sleep 2

# Start Backend
echo "✅ Starting Backend Server..."
cd /Users/adithya/Downloads/Mini_Project/backend
node src/index.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 3

# Start LocalTunnel
echo "✅ Starting LocalTunnel..."
lt --port 3000 > /tmp/localtunnel.log 2>&1 &
TUNNEL_PID=$!
echo "LocalTunnel PID: $TUNNEL_PID"
sleep 5

# Get LocalTunnel URL
LT_URL=$(cat /tmp/localtunnel.log | grep "your url is:" | awk '{print $4}')
echo "LocalTunnel URL: $LT_URL"

# Update .env file
echo "✅ Updating .env with LocalTunnel URL..."
cd /Users/adithya/Downloads/Mini_Project/mobile
sed -i.bak "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$LT_URL|" .env
echo "Updated .env with: $LT_URL"

# Start Expo
echo "✅ Starting Expo..."
cd /Users/adithya/Downloads/Mini_Project/mobile
npx expo start --tunnel

echo "✅ All services started!"
echo ""
echo "Backend: http://localhost:3000"
echo "LocalTunnel: $LT_URL"
echo "Expo: Scan the QR code above"
