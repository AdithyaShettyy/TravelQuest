#!/bin/bash

# TourQuest Server Startup Script
# This script starts both backend and mobile development servers

echo "🚀 Starting TourQuest Servers..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current IP address
IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo -e "${YELLOW}📍 Your IP Address: ${IP_ADDRESS}${NC}"
echo ""

# Check if backend is already running
if lsof -iTCP:3000 -sTCP:LISTEN -P -n > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend already running on port 3000${NC}"
else
    echo "🔧 Starting Backend Server..."
    cd /Users/adithya/Downloads/Mini_Project/backend
    nohup node src/index.js > backend.log 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
    sleep 3
    
    # Test backend
    if curl -s "http://${IP_ADDRESS}:3000/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy at http://${IP_ADDRESS}:3000${NC}"
    else
        echo -e "${RED}❌ Backend failed to start${NC}"
        exit 1
    fi
fi

echo ""
echo "📱 Starting Mobile Development Server..."
cd /Users/adithya/Downloads/Mini_Project/mobile

# Start Expo in LAN mode
echo -e "${YELLOW}Note: Make sure your phone and computer are on the same WiFi network!${NC}"
echo ""

npx expo start --lan

# Note: This will keep running until you press Ctrl+C
# When you stop Expo, the backend will keep running in the background
