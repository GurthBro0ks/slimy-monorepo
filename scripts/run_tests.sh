#!/usr/bin/env bash
# Canonical Python test gate for Phase 8B.2
# Runs the same command locally and in CI
# FAIL-CLOSED: exits with code 2 if zero tests are discovered
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Running Python unittest gate..."
echo "Working directory: $PWD"
echo "Python version: $(python3 --version)"
echo ""

export PYTHONPATH=$PWD

# Discover tests and count them (fail-closed if zero)
echo "Discovering tests..."

# Check if tests directory exists
if [ ! -d "tests" ]; then
  echo ""
  echo "BLOCKER_NO_TESTS_FOUND"
  echo "ERROR: tests/ directory does not exist."
  echo "This gate is fail-closed: zero tests is a blocker."
  echo "Either:"
  echo "  1. Create tests/ directory with test files, OR"
  echo "  2. If intentionally removing tests, update this gate."
  exit 2
fi

# Try to discover tests
TEST_OUTPUT=$(python3 -m unittest discover -s tests -p "test_*.py" --quiet 2>&1 || true)

# Count tests by looking for lines that look like test methods
# (unittest outputs format like: test_something (module.TestClass) ... ok)
TEST_COUNT=$(echo "$TEST_OUTPUT" | grep -E "^test_.*\(" | wc -l)

echo "Tests discovered: $TEST_COUNT"

if [ "$TEST_COUNT" -eq 0 ]; then
  echo ""
  echo "BLOCKER_NO_TESTS_FOUND"
  echo "ERROR: No tests were discovered in tests/ directory."
  echo "This gate is fail-closed: zero tests is a blocker."
  echo "Either:"
  echo "  1. Add test files (test_*.py) to tests/ directory, OR"
  echo "  2. If intentionally removing tests, update this gate."
  exit 2
fi

# Run tests with verbose output
echo ""
echo "Running $TEST_COUNT test(s)..."
python3 -m unittest discover -s tests -p "test_*.py" -v
