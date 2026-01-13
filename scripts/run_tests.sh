#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Call the python gate
python3 scripts/gate.py
