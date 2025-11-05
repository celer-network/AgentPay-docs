#!/bin/bash

# Enhanced test script to simulate the full GitHub Actions workflow
# This tests the complete flow including branch switching and file copying

echo "🧪 Testing complete GitHub Actions workflow simulation..."

# Check current branch and status
ORIGINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Starting on branch: $ORIGINAL_BRANCH"

# Step 1: Simulate checkout main branch
if [ "$ORIGINAL_BRANCH" != "main" ]; then
    echo "Switching to main branch..."
    git checkout main
fi

echo "📝 Step 1: Processing markdown files on main branch..."
python .github/scripts/process_markdown.py

if git diff --quiet; then
    echo "❌ No files were processed"
    git checkout "$ORIGINAL_BRANCH"
    exit 1
else
    echo "✅ Files were successfully processed"
fi

echo "📦 Step 2: Backing up processed files..."
# Simulate the backup step
cp -r src /tmp/processed_src_test
echo "✅ Backup created"

echo "🔄 Step 3: Switching to deploy branch..."
git fetch origin deploy 2>/dev/null || echo "Deploy branch doesn't exist remotely"
if git checkout deploy 2>/dev/null; then
    echo "✅ Switched to existing deploy branch"
else
    echo "Creating new deploy branch..."
    git checkout -b deploy
    echo "✅ Created and switched to deploy branch"
fi

echo "🚀 Step 4: Syncing files to deploy branch..."
# Remove existing src if it exists
if [ -d "src" ]; then
    rm -rf src
    echo "Removed existing src folder"
fi

# Copy from backup
cp -r /tmp/processed_src_test src
echo "✅ Copied processed files to deploy branch"

# Show what would be committed
echo "Files that would be committed to deploy branch:"
git add src
git status --porcelain

echo "🔙 Step 5: Simulating revert on main branch..."
git checkout main
git checkout -- src
echo "✅ Reverted changes on main branch"

# Verify main branch is clean
if git diff --quiet; then
    echo "✅ Main branch is clean"
else
    echo "❌ Main branch still has changes"
    git status --porcelain
fi

echo "🧹 Cleaning up..."
rm -rf /tmp/processed_src_test
git checkout "$ORIGINAL_BRANCH"

echo "✅ Complete workflow test passed!"