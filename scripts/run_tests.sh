#!/usr/bin/env bash
# Canonical Python test gate for Phase 8B.2
# Runs the same command locally and in CI
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Running Python unittest gate..."
echo "Working directory: $PWD"
echo "Python version: $(python3 --version)"
echo ""

export PYTHONPATH=$PWD
python3 -m unittest discover -s tests -p "test_*.py" -v
