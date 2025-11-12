# API Testing Guide

## Quick API Tests with curl

### 1. Health Check
```bash
# Backend
curl http://localhost:3000/health

# Verification Service
curl http://localhost:5000/health
```

### 2. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "explorer1@test.com",
    "password": "password123"
  }'
```

Save the token from response!

### 4. Get Nearby POIs
```bash
TOKEN="your_token_here"

curl http://localhost:3000/api/pois/nearby?lat=40.7128&lng=-74.0060&radius=5000 \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Get Quests
```bash
curl http://localhost:3000/api/quests \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Get Leaderboard
```bash
curl http://localhost:3000/api/leaderboards?period=all_time \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Get Rewards
```bash
curl http://localhost:3000/api/rewards \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Get Badges
```bash
curl http://localhost:3000/api/badges \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Submit Photo (multipart)
```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/path/to/your/image.jpg" \
  -F "questId=quest-uuid-here" \
  -F "latitude=40.7829" \
  -F "longitude=-73.9654"
```

### 10. Get User Profile
```bash
USER_ID="user-uuid-here"

curl http://localhost:3000/api/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Admin API Tests

Login as admin first:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tourquest.com",
    "password": "admin123"
  }'
```

### Create POI
```bash
ADMIN_TOKEN="admin_token_here"

curl -X POST http://localhost:3000/api/admin/pois \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Landmark",
    "description": "A cool place to visit",
    "category": "landmark",
    "location": {
      "type": "Point",
      "coordinates": [-74.0060, 40.7128]
    },
    "city": "New York",
    "country": "USA",
    "isActive": true
  }'
```

### Create Quest
```bash
curl -X POST http://localhost:3000/api/admin/quests \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poiId": "poi-uuid-here",
    "title": "New Quest",
    "description": "Capture this awesome view",
    "type": "photo_match",
    "difficulty": "medium",
    "basePoints": 100,
    "referenceImage": "/path/to/reference.jpg",
    "verificationRadius": 50,
    "isActive": true
  }'
```

### Get Analytics
```bash
curl http://localhost:3000/api/admin/analytics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Get Pending Submissions
```bash
curl http://localhost:3000/api/admin/submissions/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Testing with Postman

Import this collection URL:
```
File -> Import -> Raw Text -> Paste the curl commands above
```

Or use the Postman web client: https://web.postman.co/

## Testing with HTTPie (easier syntax)

Install: `brew install httpie`

```bash
# Login
http POST :3000/api/auth/login email=explorer1@test.com password=password123

# Get quests (with token)
http :3000/api/quests Authorization:"Bearer $TOKEN"
```

## Expected Responses

### Success (200)
```json
{
  "data": [...],
  "message": "Success"
}
```

### Created (201)
```json
{
  "id": "uuid",
  "message": "Created successfully"
}
```

### Error (400/401/500)
```json
{
  "error": "Error message here"
}
```

## Rate Limiting

Default: 100 requests per 15 minutes per IP

## Authentication

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

Token expires in 7 days (configurable in .env)

## Testing Verification Service

```bash
# Test image verification
curl -X POST http://localhost:5000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "submittedPhotoPath": "/path/to/submitted.jpg",
    "referencePhotoPath": "/path/to/reference.jpg",
    "submittedLocation": {"lat": 40.7829, "lng": -73.9654},
    "referenceLocation": [-73.9654, 40.7829],
    "verificationRadius": 50
  }'
```

## Common Issues

### 401 Unauthorized
- Token expired or invalid
- Login again to get new token

### 404 Not Found
- Check route spelling
- Ensure service is running

### 500 Server Error
- Check logs: `tail -f logs/backend.log`
- Database connection issue?

## Environment Variables

Check `.env` files in each service:
- `backend/.env`
- `frontend/.env`
- `verification/.env`

---
Happy testing! 🧪
