#!/bin/bash

# Test script for all new features
BASE_URL="http://localhost:3000/api"
USER_ID="0e7436ee-9c8d-4a93-a065-34c2afbff6fe"

echo "🧪 Testing New Features"
echo "======================="
echo ""

# Test 1: Power-up Purchase
echo "1️⃣ Testing Power-up Purchase..."
curl -X POST "$BASE_URL/powerups/purchase" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$USER_ID\",\"type\":\"double_points\"}" \
  -s | jq '.'
echo ""

# Test 2: Get User Power-ups
echo "2️⃣ Testing Get User Power-ups..."
curl -X GET "$BASE_URL/powerups/user/$USER_ID" -s | jq '.'
echo ""

# Test 3: Advanced Scoring Calculation
echo "3️⃣ Testing Advanced Scoring..."
curl -X POST "$BASE_URL/leaderboard/calculate-score" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$USER_ID\",\"poiRarity\":\"epic\",\"isFirstVisit\":true,\"photoQualityScore\":0.95,\"accuracyMeters\":8}" \
  -s | jq '.'
echo ""

# Test 4: List All Achievements
echo "4️⃣ Testing List Achievements..."
curl -X GET "$BASE_URL/achievements/all" -s | jq '. | length'
echo " achievements found"
echo ""

# Test 5: Check User Achievements
echo "5️⃣ Testing Check Achievements..."
curl -X POST "$BASE_URL/achievements/check/$USER_ID" -s | jq '.'
echo ""

# Test 6: Friends List
echo "6️⃣ Testing Friends List..."
curl -X GET "$BASE_URL/friends/$USER_ID" -s | jq '.'
echo ""

# Test 7: Squads List
echo "7️⃣ Testing Squads List..."
curl -X GET "$BASE_URL/squads" -s | jq '. | length'
echo " squads found"
echo ""

echo "✅ All tests completed!"
