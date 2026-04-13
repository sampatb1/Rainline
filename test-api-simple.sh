#!/bin/bash
API_URL="https://w96vp0r9j2.execute-api.us-east-1.amazonaws.com/prod"

# 1. Create farm
echo "1. Creating farm..."
FARM_RESPONSE=$(curl -s -X POST "$API_URL/farms" -H "Content-Type: application/json" -d '{"name":"Test Farm","location":"CA"}')
echo $FARM_RESPONSE
FARM_ID=$(echo $FARM_RESPONSE | grep -o '"farmId":"[^"]*' | cut -d'"' -f4)
echo "Farm ID: $FARM_ID"

# 2. Create field
echo -e "\n2. Creating field..."
FIELD_RESPONSE=$(curl -s -X POST "$API_URL/farms/$FARM_ID/fields" -H "Content-Type: application/json" -d '{"name":"Field 1","cropType":"corn","soilType":"loam"}')
echo $FIELD_RESPONSE
FIELD_ID=$(echo $FIELD_RESPONSE | grep -o '"fieldId":"[^"]*' | cut -d'"' -f4)
echo "Field ID: $FIELD_ID"

# 3. Generate recommendation
echo -e "\n3. Generating recommendation..."
REC_RESPONSE=$(curl -s -X POST "$API_URL/fields/$FIELD_ID/recommendations" -H "Content-Type: application/json" -d '{"conditions":{"cropType":"corn","soilType":"loam","growthStage":"flowering","lastIrrigation":"2024-01-15T00:00:00.000Z","rainfall":5,"temperature":92}}')
echo $REC_RESPONSE
REC_ID=$(echo $REC_RESPONSE | grep -o '"recommendationId":"[^"]*' | cut -d'"' -f4)
echo "Recommendation ID: $REC_ID"

# 4. Submit feedback
echo -e "\n4. Submitting feedback..."
curl -s -X POST "$API_URL/recommendations/$REC_ID/feedback" -H "Content-Type: application/json" -d '{"worked":true,"comment":"Great!"}'

echo -e "\n\nDone!"
