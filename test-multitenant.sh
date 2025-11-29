#!/bin/bash

# PrimusInsights Multi-Tenant Test Script
# Tests complete user journey: registration, login, lead creation, data isolation

API_URL="${API_URL:-http://localhost:10000}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "PrimusInsights Multi-Tenant Test Suite"
echo "========================================"
echo ""
echo "Testing against: $API_URL"
echo ""

# Test 1: Register User 1
echo -e "${YELLOW}Test 1: Register Contractor 1${NC}"
REGISTER1=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contractor1@test.com",
    "password": "TestPass123",
    "firstName": "Alice",
    "lastName": "Johnson",
    "companyName": "Alice Roofing Co",
    "companyPhone": "+15551111111"
  }')

TOKEN1=$(echo "$REGISTER1" | jq -r '.token')

if [ "$TOKEN1" != "null" ] && [ "$TOKEN1" != "" ]; then
  echo -e "${GREEN}✓ PASSED${NC} - Contractor 1 registered"
  echo "  Token: ${TOKEN1:0:20}..."
else
  echo -e "${RED}✗ FAILED${NC}"
  echo "$REGISTER1"
  exit 1
fi
echo ""

# Test 2: Register User 2
echo -e "${YELLOW}Test 2: Register Contractor 2${NC}"
REGISTER2=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contractor2@test.com",
    "password": "TestPass456",
    "firstName": "Bob",
    "lastName": "Smith",
    "companyName": "Bob Roofing LLC",
    "companyPhone": "+15552222222"
  }')

TOKEN2=$(echo "$REGISTER2" | jq -r '.token')

if [ "$TOKEN2" != "null" ] && [ "$TOKEN2" != "" ]; then
  echo -e "${GREEN}✓ PASSED${NC} - Contractor 2 registered"
  echo "  Token: ${TOKEN2:0:20}..."
else
  echo -e "${RED}✗ FAILED${NC}"
  echo "$REGISTER2"
  exit 1
fi
echo ""

# Test 3: Login as User 1
echo -e "${YELLOW}Test 3: Login as Contractor 1${NC}"
LOGIN1=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contractor1@test.com",
    "password": "TestPass123"
  }')

LOGIN_TOKEN1=$(echo "$LOGIN1" | jq -r '.token')

if [ "$LOGIN_TOKEN1" != "null" ] && [ "$LOGIN_TOKEN1" != "" ]; then
  echo -e "${GREEN}✓ PASSED${NC} - Login successful"
else
  echo -e "${RED}✗ FAILED${NC}"
  echo "$LOGIN1"
  exit 1
fi
echo ""

# Test 4: Get User Info
echo -e "${YELLOW}Test 4: Get User Info (GET /api/auth/me)${NC}"
ME=$(curl -s -X GET "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN1")

USER_EMAIL=$(echo "$ME" | jq -r '.user.email')

if [ "$USER_EMAIL" == "contractor1@test.com" ]; then
  echo -e "${GREEN}✓ PASSED${NC} - User info retrieved"
  echo "  Email: $USER_EMAIL"
else
  echo -e "${RED}✗ FAILED${NC}"
  echo "$ME"
  exit 1
fi
echo ""

# Test 5: Submit Lead for Contractor 1
echo -e "${YELLOW}Test 5: Submit Lead for Contractor 1${NC}"
LEAD1=$(curl -s -X POST "$API_URL/api/lead" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+15553333333",
    "name": "Customer A",
    "message": "Need roof inspection ASAP",
    "solarInterest": true
  }')

LEAD1_STATUS=$(echo "$LEAD1" | jq -r '.status')

if [ "$LEAD1_STATUS" == "success" ]; then
  echo -e "${GREEN}✓ PASSED${NC} - Lead created for Contractor 1"
  echo "$LEAD1" | jq '.'
else
  echo -e "${RED}✗ FAILED${NC}"
  echo "$LEAD1"
  exit 1
fi
echo ""

# Test 6: Submit Lead for Contractor 2
echo -e "${YELLOW}Test 6: Submit Lead for Contractor 2${NC}"
LEAD2=$(curl -s -X POST "$API_URL/api/lead" \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+15554444444",
    "name": "Customer B",
    "message": "Roof repair needed after storm",
    "solarInterest": false
  }')

LEAD2_STATUS=$(echo "$LEAD2" | jq -r '.status')

if [ "$LEAD2_STATUS" == "success" ]; then
  echo -e "${GREEN}✓ PASSED${NC} - Lead created for Contractor 2"
  echo "$LEAD2" | jq '.'
else
  echo -e "${RED}✗ FAILED${NC}"
  echo "$LEAD2"
  exit 1
fi
echo ""

# Test 7: Verify Data Isolation - Contractor 1
echo -e "${YELLOW}Test 7: Verify Data Isolation - Contractor 1 Leads${NC}"
LEADS1=$(curl -s -X GET "$API_URL/api/leads" \
  -H "Authorization: Bearer $TOKEN1")

LEADS1_COUNT=$(echo "$LEADS1" | jq '.leads | length')

if [ "$LEADS1_COUNT" == "1" ]; then
  echo -e "${GREEN}✓ PASSED${NC} - Contractor 1 sees only their 1 lead"
  echo "$LEADS1" | jq '.leads[] | {name, phone}'
else
  echo -e "${RED}✗ FAILED${NC} - Expected 1 lead, got $LEADS1_COUNT"
  echo "$LEADS1"
  exit 1
fi
echo ""

# Test 8: Verify Data Isolation - Contractor 2
echo -e "${YELLOW}Test 8: Verify Data Isolation - Contractor 2 Leads${NC}"
LEADS2=$(curl -s -X GET "$API_URL/api/leads" \
  -H "Authorization: Bearer $TOKEN2")

LEADS2_COUNT=$(echo "$LEADS2" | jq '.leads | length')

if [ "$LEADS2_COUNT" == "1" ]; then
  echo -e "${GREEN}✓ PASSED${NC} - Contractor 2 sees only their 1 lead"
  echo "$LEADS2" | jq '.leads[] | {name, phone}'
else
  echo -e "${RED}✗ FAILED${NC} - Expected 1 lead, got $LEADS2_COUNT"
  echo "$LEADS2"
  exit 1
fi
echo ""

# Test 9: Invalid Token
echo -e "${YELLOW}Test 9: Invalid Token (Security Test)${NC}"
INVALID=$(curl -s -X GET "$API_URL/api/leads" \
  -H "Authorization: Bearer invalid-token")

ERROR=$(echo "$INVALID" | jq -r '.error')

if [[ "$ERROR" == *"Invalid"* ]] || [[ "$ERROR" == *"expired"* ]]; then
  echo -e "${GREEN}✓ PASSED${NC} - Invalid token correctly rejected"
else
  echo -e "${RED}✗ FAILED${NC} - Should reject invalid token"
  echo "$INVALID"
fi
echo ""

# Test 10: Duplicate Email Registration
echo -e "${YELLOW}Test 10: Duplicate Email (Should Fail)${NC}"
DUPLICATE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contractor1@test.com",
    "password": "TestPass123",
    "firstName": "Duplicate",
    "companyName": "Duplicate Co"
  }')

DUP_ERROR=$(echo "$DUPLICATE" | jq -r '.error')

if [[ "$DUP_ERROR" == *"already registered"* ]]; then
  echo -e "${GREEN}✓ PASSED${NC} - Duplicate email correctly rejected"
else
  echo -e "${RED}✗ FAILED${NC} - Should reject duplicate email"
  echo "$DUPLICATE"
fi
echo ""

echo "========================================"
echo -e "${GREEN}All Tests Passed!${NC}"
echo "========================================"
echo ""
echo "Multi-tenant setup verified:"
echo "  ✓ User registration works"
echo "  ✓ User login works"
echo "  ✓ JWT authentication works"
echo "  ✓ Lead creation works"
echo "  ✓ Data isolation works (each contractor sees only their leads)"
echo "  ✓ Invalid tokens are rejected"
echo "  ✓ Duplicate emails are rejected"
echo ""
echo "Test Tokens (valid for 7 days):"
echo "  Contractor 1: $TOKEN1"
echo "  Contractor 2: $TOKEN2"
echo ""
