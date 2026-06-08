#!/bin/bash

# Test SEPL Reference Number Generation
# This script tests the implementation

echo "======================================"
echo "SEPL Reference Number Generation Test"
echo "======================================"
echo ""

# Test 1: Check if the reference number utility exists
echo "✓ Test 1: Checking utility file..."
if [ -f /home/vikas/Desktop/seplapps/insuranceportal/backend/utils/referenceNumber.js ]; then
    echo "  ✅ referenceNumber.js exists"
    echo ""
    echo "  File contents preview:"
    head -20 /home/vikas/Desktop/seplapps/insuranceportal/backend/utils/referenceNumber.js
else
    echo "  ❌ referenceNumber.js not found"
fi

echo ""
echo "✓ Test 2: Checking policy controller import..."
if grep -q "generateSeplReferenceNumber" /home/vikas/Desktop/seplapps/insuranceportal/backend/controllers/policy.controller.js; then
    echo "  ✅ generateSeplReferenceNumber imported in policy controller"
else
    echo "  ❌ generateSeplReferenceNumber not found in policy controller"
fi

echo ""
echo "✓ Test 3: Checking frontend helper function..."
if grep -q "generateSeplReferenceNumber" /home/vikas/Desktop/seplapps/insuranceportal/frontend/src/utils/helpers.js; then
    echo "  ✅ generateSeplReferenceNumber exported from helpers"
else
    echo "  ❌ generateSeplReferenceNumber not found in helpers"
fi

echo ""
echo "✓ Test 4: Checking Policies component import..."
if grep -q "generateSeplReferenceNumber" /home/vikas/Desktop/seplapps/insuranceportal/frontend/src/pages/Policies.jsx; then
    echo "  ✅ generateSeplReferenceNumber imported in Policies component"
else
    echo "  ❌ generateSeplReferenceNumber not found in Policies component"
fi

echo ""
echo "✓ Test 5: Checking Generate button handler..."
if grep -q "handleGenerateRefNumber" /home/vikas/Desktop/seplapps/insuranceportal/frontend/src/pages/Policies.jsx; then
    echo "  ✅ handleGenerateRefNumber handler defined"
else
    echo "  ❌ handleGenerateRefNumber handler not found"
fi

echo ""
echo "✓ Test 6: Checking backend service status..."
if pm2 list | grep -q "insurance-backend.*online"; then
    echo "  ✅ insurance-backend service is online"
else
    echo "  ❌ insurance-backend service is not online"
fi

echo ""
echo "✓ Test 7: Checking frontend service status..."
if pm2 list | grep -q "insurance-frontend.*online"; then
    echo "  ✅ insurance-frontend service is online"
else
    echo "  ❌ insurance-frontend service is not online"
fi

echo ""
echo "======================================"
echo "All tests completed!"
echo "======================================"
echo ""
echo "SEPL Reference Number Format:"
echo "  Format: SEPL-[YY]D[00001-99999]"
echo "  Example: SEPL-26D00001, SEPL-26D00002, etc."
echo ""
echo "Usage:"
echo "  1. Frontend: Click 'Generate' button to preview reference number"
echo "  2. Backend: Auto-generates if policy_number field is empty"
echo ""
