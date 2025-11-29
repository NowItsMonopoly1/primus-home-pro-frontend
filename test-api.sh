#!/bin/bash

# PrimusInsights Roofing - API Test Script
# Quick testing tool for local development

API_URL="${API_URL:-http://localhost:10000}"
ADMIN_KEY="${ADMIN_KEY:-change-me-in-production}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "PrimusInsights Roofing - API Test Suite"
echo "========================================"
echo ""

# Test 1: Valid Lead Submission
echo -e "${YELLOW}Test 1: Valid Lead Submission${NC}"
response=$(curl -s -X POST "$API_URL/lead" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"John Smith","message":"I need a roof inspection","solarInterest":true}')

if echo "$response" | grep -q '"status":"success"'; then
  echo -e "${GREEN}✓ PASSED${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}✗ FAILED${NC}"
  echo "$response"
fi
echo ""

# Test 2: Missing Fields (Validation)
echo -e "${YELLOW}Test 2: Validation - Missing Fields${NC}"
response=$(curl -s -X POST "$API_URL/lead" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"Test"}')

if echo "$response" | grep -q '"error"'; then
  echo -e "${GREEN}✓ PASSED (Correctly rejected)${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}✗ FAILED (Should have been rejected)${NC}"
  echo "$response"
fi
echo ""

# Test 3: Invalid Phone Format
echo -e "${YELLOW}Test 3: Validation - Invalid Phone${NC}"
response=$(curl -s -X POST "$API_URL/lead" \
  -H "Content-Type: application/json" \
  -d '{"phone":"123","name":"Test User","message":"Testing invalid phone"}')

if echo "$response" | grep -q '"error".*phone'; then
  echo -e "${GREEN}✓ PASSED (Correctly rejected)${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}✗ FAILED (Should have been rejected)${NC}"
  echo "$response"
fi
echo ""

# Test 4: Solar Interest Flag
echo -e "${YELLOW}Test 4: Solar Interest Lead${NC}"
response=$(curl -s -X POST "$API_URL/lead" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15559876543","name":"Solar Customer","message":"Interested in solar panels for my roof","solarInterest":true}')

if echo "$response" | grep -q '"status":"success"'; then
  echo -e "${GREEN}✓ PASSED${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}✗ FAILED${NC}"
  echo "$response"
fi
echo ""

# Test 5: Multiple Valid Leads
echo -e "${YELLOW}Test 5: Submitting 5 Leads${NC}"
success_count=0
for i in {1..5}; do
  response=$(curl -s -X POST "$API_URL/lead" \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"+155512345${i}${i}\",\"name\":\"Customer $i\",\"message\":\"Test message number $i\"}")

  if echo "$response" | grep -q '"status":"success"'; then
    success_count=$((success_count + 1))
  fi
done

if [ $success_count -eq 5 ]; then
  echo -e "${GREEN}✓ PASSED (5/5 leads submitted)${NC}"
else
  echo -e "${RED}✗ FAILED ($success_count/5 leads submitted)${NC}"
fi
echo ""

# Test 6: Admin Dashboard Access (Valid Key)
echo -e "${YELLOW}Test 6: Admin Dashboard - Valid Key${NC}"
response=$(curl -s -w "\n%{http_code}" "$API_URL/admin?key=$ADMIN_KEY")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] && echo "$body" | grep -q "PrimusInsights"; then
  echo -e "${GREEN}✓ PASSED (HTTP $http_code)${NC}"
else
  echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
fi
echo ""

# Test 7: Admin Dashboard Access (Invalid Key)
echo -e "${YELLOW}Test 7: Admin Dashboard - Invalid Key${NC}"
response=$(curl -s -w "\n%{http_code}" "$API_URL/admin?key=wrong-key")
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" = "401" ]; then
  echo -e "${GREEN}✓ PASSED (Correctly rejected with HTTP $http_code)${NC}"
else
  echo -e "${RED}✗ FAILED (Should be HTTP 401, got $http_code)${NC}"
fi
echo ""

# Test 8: Edge Cases - Name Too Short
echo -e "${YELLOW}Test 8: Validation - Name Too Short${NC}"
response=$(curl -s -X POST "$API_URL/lead" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"A","message":"Testing short name"}')

if echo "$response" | grep -q '"error".*Name'; then
  echo -e "${GREEN}✓ PASSED (Correctly rejected)${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}✗ FAILED (Should have been rejected)${NC}"
  echo "$response"
fi
echo ""

# Test 9: Edge Cases - Message Too Short
echo -e "${YELLOW}Test 9: Validation - Message Too Short${NC}"
response=$(curl -s -X POST "$API_URL/lead" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"Test User","message":"Hi"}')

if echo "$response" | grep -q '"error".*Message'; then
  echo -e "${GREEN}✓ PASSED (Correctly rejected)${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}✗ FAILED (Should have been rejected)${NC}"
  echo "$response"
fi
echo ""

# Summary
echo "========================================"
echo -e "${GREEN}Test Suite Complete!${NC}"
echo "========================================"
echo ""
echo "View admin dashboard:"
echo "  $API_URL/admin?key=$ADMIN_KEY"
echo ""
echo "Check leads.json:"
echo "  cat leads.json | jq '.'"
echo ""
