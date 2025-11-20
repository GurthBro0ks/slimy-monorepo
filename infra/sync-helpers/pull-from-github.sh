#!/bin/bash
#
# pull-from-github.sh
# Simple script to pull latest changes from GitHub
# Intended for use on NUCs to sync from the remote repository
#

set -e  # Exit on error

echo "========================================="
echo "Pulling latest changes from GitHub"
echo "========================================="
echo ""

# Fetch latest changes from origin
echo "Fetching from origin..."
git fetch origin

# Checkout main branch
# NOTE: Replace 'main' with your actual main branch name if different
echo "Checking out main branch..."
git checkout main

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

echo ""
echo "========================================="
echo "Successfully synced with GitHub!"
echo "========================================="
