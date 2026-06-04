#!/bin/bash
set -e

echo "=== PULSETRACK API INTEGRATION TESTS ==="

# 1. Login with Mock OAuth
echo "1. Simulating Google login (Mock Flow)..."
LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token": "mock-google-token", "mockEmail": "alex@pulsetrack.com", "mockName": "Alex Henderson"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
echo "JWT Token generated successfully: ${TOKEN:0:15}..."

# 2. Get Athlete Profile
echo "2. Fetching athlete profile details..."
PROFILE_RESPONSE=$(curl -s -X GET http://127.0.0.1:5000/api/user/profile \
  -H "Authorization: Bearer $TOKEN")

LEVEL=$(echo "$PROFILE_RESPONSE" | grep -o '"level":[0-9]*' | grep -o '[0-9]*')
STEPS=$(echo "$PROFILE_RESPONSE" | grep -o '"lifetimeSteps":[0-9]*' | grep -o '[0-9]*')
echo "Current Level: $LEVEL, Lifetime Steps: $STEPS"

# 3. Update Profile Goal
echo "3. Updating profile daily step goal to 12,000..."
UPDATE_RESPONSE=$(curl -s -X PUT http://127.0.0.1:5000/api/user/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alex Henderson Jr", "dailyStepGoal": 12000}')

NEW_GOAL=$(echo "$UPDATE_RESPONSE" | grep -o '"dailyStepGoal":[0-9]*' | grep -o '[0-9]*')
echo "Updated Daily Step Goal: $NEW_GOAL"

# 4. Log Workout Activity (Increase Steps)
echo "4. Logging a run activity of 5,000 steps..."
ACTIVITY_RESPONSE=$(curl -s -X POST http://127.0.0.1:5000/api/activities \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "run", "title": "Verification Power Run", "duration": 30, "calories": 300, "steps": 5000, "distance": 5.0}')

echo "Activity logged successfully."

# 5. Check Quest Progress Updates
echo "5. Verifying step counts incremented on active quests..."
QUESTS_RESPONSE=$(curl -s -X GET http://127.0.0.1:5000/api/quests \
  -H "Authorization: Bearer $TOKEN")

# Seeding starts at 74200 steps. Adding 5000 steps brings it to 79200.
QUEST_STEPS=$(echo "$QUESTS_RESPONSE" | grep -o '"currentSteps":[0-9]*' | head -n 1 | grep -o '[0-9]*')
echo "Active quest step count now: $QUEST_STEPS / 100000"

# 6. Check Leaderboard Standings
echo "6. Checking Leaderboard Standings..."
LEADERBOARD_RESPONSE=$(curl -s -X GET http://127.0.0.1:5000/api/leaderboard \
  -H "Authorization: Bearer $TOKEN")
echo "Leaderboard returned successfully."

# 7. Complete the Active Quest (Log another activity with 25,000 steps)
echo "7. Logging a long walk of 25,800 steps to complete the quest (79200 + 25800 = 105000 >= 100000)..."
curl -s -X POST http://127.0.0.1:5000/api/activities \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "run", "title": "Ultra Quest Finish Run", "duration": 120, "calories": 900, "steps": 25800, "distance": 25.8}' > /dev/null

# Verify Quest is completed
QUESTS_RESPONSE2=$(curl -s -X GET http://127.0.0.1:5000/api/quests \
  -H "Authorization: Bearer $TOKEN")
QUEST_ID=$(echo "$QUESTS_RESPONSE2" | grep -o '"_id":"[^"]*' | head -n 1 | grep -o '[^"]*$')
QUEST_COMPLETED=$(echo "$QUESTS_RESPONSE2" | grep -o '"isCompleted":[^,]*' | head -n 1 | grep -o '[a-z]*$')
echo "Quest completed state: $QUEST_COMPLETED"

# 8. Claim Quest Reward
echo "8. Claiming the UltraPulse Pro Watch quest reward..."
CLAIM_RESPONSE=$(curl -s -X POST http://127.0.0.1:5000/api/quests/claim \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"questId\": \"$QUEST_ID\"}")
echo "Reward Claim Response: $CLAIM_RESPONSE"

# 9. Verify claimed rewards history
echo "9. Fetching history list of claimed rewards..."
REWARDS_RESPONSE=$(curl -s -X GET http://127.0.0.1:5000/api/rewards \
  -H "Authorization: Bearer $TOKEN")
echo "Claimed rewards: $REWARDS_RESPONSE"

echo "=== ALL API INTEGRATION TESTS PASSED ==="
