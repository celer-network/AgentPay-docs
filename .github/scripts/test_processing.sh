#!/bin/bash

# Simple test script to validate the workflow locally
# This simulates what the GitHub Action will do

echo "Testing markdown processing workflow..."

# Save current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Test the processing script
echo "Running markdown processing script..."
python .github/scripts/process_markdown.py

# Check if files were modified
if git diff --quiet; then
    echo "❌ No files were modified by the script"
    exit 1
else
    echo "✅ Files were successfully processed"
fi

# Show a sample of changes
echo "Sample changes in SUMMARY.md:"
git diff src/SUMMARY.md | head -20

echo "Sample changes in app-circuit-interface.md:"
git diff src/developer-resources/circuit-sdk-reference/app-circuit-interface.md | head -20

# Test the revert functionality (simulating what happens in CI)
echo "Testing revert functionality..."
git stash push -m "Temporary stash of processed files"

# Simulate switching branches and copying files (like in CI)
echo "Simulating deploy branch sync..."
echo "Files would be copied to deploy branch here..."

# Revert changes (this is what the CI does)
echo "Reverting changes on main branch..."
git stash pop
git checkout -- src

echo "✅ Test completed successfully - changes reverted"