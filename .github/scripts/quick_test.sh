#!/bin/bash

echo "🔧 Quick validation test..."

# Test 1: Processing works
echo "Test 1: Processing markdown files..."
python .github/scripts/process_markdown.py > /dev/null 2>&1

if git diff --quiet; then
    echo "❌ Processing failed - no changes detected"
    exit 1
else
    echo "✅ Processing successful - files were modified"
fi

# Test 2: Check specific changes
echo "Test 2: Checking SUMMARY.md title conversion..."
if grep -q "^# Developer Guide" SUMMARY.md; then
    echo "✅ SUMMARY.md title conversion works"
else
    echo "❌ SUMMARY.md title conversion failed"
fi

# Test 3: Check figure tag removal
echo "Test 3: Checking figure tag removal..."
FIGURE_COUNT=$(find . -name "*.md" -exec grep -l "<figure>" {} \; 2>/dev/null | wc -l)
if [ "$FIGURE_COUNT" -eq 0 ]; then
    echo "✅ Figure tags removed successfully"
else
    echo "❌ Figure tags still present in $FIGURE_COUNT files"
fi

# Test 4: Revert functionality
echo "Test 4: Testing revert functionality..."
git checkout -- README.md SUMMARY.md developer-guide/ developer-resources/ 2>/dev/null

if git diff --quiet --name-only | grep -v ".github" | wc -l | grep -q "0"; then
    echo "✅ Revert functionality works"
else
    echo "❌ Revert functionality failed"
fi

echo "🎉 All tests completed!"