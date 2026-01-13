# Phase 8B.2: Canonical Python Test Gate

**Date**: 2026-01-13
**Issue**: Establish reproducible, deterministic Python test gate (local == CI)
**Status**: RESOLVED ✅

## Problem Summary

The venue pipeline tests needed a canonical, reproducible test gate that works identically locally and in CI. The goal was to eliminate "pytest missing" ambiguity and establish ONE canonical gate command.

## Decision: Use unittest (stdlib)

**Chosen Framework**: Python stdlib `unittest`

**Rationale**:
1. Test file already uses unittest (`tests/test_shadow_venuebook.py` line 1: `import unittest`)
2. CI workflow already configured for unittest (`.github/workflows/ci.yml` lines 61-76)
3. No external dependencies required (fail-closed, no dependency footguns)
4. No pytest infrastructure in repo (no requirements.txt, no pyproject.toml, no pytest config)

**Decision Rule Applied**: "If adding pytest would require plumbing new dependency management across the repo, choose unittest." ✅

## Canonical Test Gate Command

```bash
export PYTHONPATH=$PWD
python3 -m unittest discover -s tests -p "test_*.py" -v
```

**Components**:
- `export PYTHONPATH=$PWD` - Ensures Python can import `slimy` modules
- `python3 -m unittest` - Use stdlib unittest module
- `discover -s tests` - Auto-discover tests in `tests/` directory
- `-p "test_*.py"` - Pattern matches all test files (currently: `test_shadow_venuebook.py`)
- `-v` - Verbose output (optional, for local use; CI omits this flag)

## Implementation

### Convenience Script

Created: `scripts/run_tests.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PYTHONPATH=$PWD
python3 -m unittest discover -s tests -p "test_*.py" -v
```

**Usage**:
```bash
./scripts/run_tests.sh
```

### CI Configuration

Already configured in `.github/workflows/ci.yml` (lines 61-76):

```yaml
python-tests:
  name: Python Tests
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.10'

    - name: Run Unittest Gate
      run: |
        export PYTHONPATH=$PWD
        python3 -m unittest discover -s tests -p "test_*.py"
```

## Verification Results

### Local Test Run (Python 3.12.3)

```
Running Python unittest gate...
Working directory: /opt/slimy/slimy-monorepo
Python version: Python 3.12.3

test_ambiguous_state (test_shadow_venuebook.TestShadowVenueBook.test_ambiguous_state) ... ok
test_failure_reasons (test_shadow_venuebook.TestShadowVenueBook.test_failure_reasons) ... ok
test_venue_book_schema_stability (test_shadow_venuebook.TestShadowVenueBook.test_venue_book_schema_stability) ... ok

----------------------------------------------------------------------
Ran 3 tests in 0.000s

OK
```

### Test Coverage

**Test File**: `tests/test_shadow_venuebook.py` (35 lines)
**Test Class**: `TestShadowVenueBook`
**Test Methods**: 3
1. `test_venue_book_schema_stability` - Validates VenueBook schema and serialization
2. `test_failure_reasons` - Tests error states (NO_BBO, PARSE_ERROR)
3. `test_ambiguous_state` - Tests AMBIGUOUS status

**Dependencies**:
- `slimy/types/venue_book.py` - VenueBook and VenueStatus types
- `tests/fixtures/venue_books.py` - Test fixtures

### Comparison: Local vs CI

| Aspect | Local | CI | Match |
|--------|-------|-----|-------|
| Command | `python3 -m unittest discover -s tests -p "test_*.py"` | Same | ✅ |
| PYTHONPATH | `export PYTHONPATH=$PWD` | Same | ✅ |
| Python Version | 3.12.3 | 3.10 | ⚠️ Minor diff |
| Test Pattern | `test_*.py` | `test_*.py` | ✅ |
| Working Dir | Repo root | Repo root | ✅ |

**Note**: Python version difference (3.12.3 local vs 3.10 CI) is acceptable for unittest stdlib compatibility.

## Proof Artifacts

**PROOF_DIR**: `/tmp/proof_phase8B2_test_gate_20260113T032058Z`

Files:
- `00_proof_dir.txt` - Proof directory path
- `01_head.txt` - Git commit SHA: `a97e0cff625d6088c3a5f5566e337cd8f374b777`
- `01_pyver.txt` - Python version: `3.12.3`
- `02_test_files.txt` - Verified test files exist
- `03_unittest_local_run.txt` - Direct unittest command output
- `04_test_output.txt` - Test script output (via `run_tests.sh`)
- `05_ci_config.txt` - CI python-tests job configuration
- `06_comparison.txt` - Local vs CI comparison

## Benefits

1. **Deterministic**: Same command works locally and in CI
2. **No Dependencies**: Uses stdlib unittest, no pip install required
3. **Fast**: Tests run in < 1ms (0.000s)
4. **Discoverable**: Auto-discovers all `test_*.py` files
5. **Verifiable**: Clear output shows all tests passed
6. **Maintainable**: Simple bash script for convenience

## CI Job Status

**Job Name**: `python-tests` (`.github/workflows/ci.yml`)
**Status**: ✅ Already configured and working
**Run Command**: Same as local gate
**Python Version**: 3.10 (vs 3.12.3 local, acceptable difference)

CI will run on all PRs and pushes to main, ensuring tests pass before merge.

## Files Modified

1. **Created**: `scripts/run_tests.sh` - Convenience test runner
2. **Created**: `docs/buglog/BUG_2026-01-13_phase8B2_canonical_test_gate.md` - This document

## Files Verified (No Changes)

- `.github/workflows/ci.yml` - CI already configured correctly ✅
- `tests/test_shadow_venuebook.py` - Test file uses unittest ✅
- `tests/fixtures/venue_books.py` - Fixtures exist ✅
- `slimy/types/venue_book.py` - Module being tested ✅

## Future Additions

When adding new tests:
1. Create `tests/test_*.py` files
2. Use `unittest.TestCase` base class
3. Run `./scripts/run_tests.sh` to verify locally
4. CI will automatically pick up new tests (pattern: `test_*.py`)

## Truth Statement

**TRUTH**: Phase 8B.2 canonical test gate is now deterministic (local == CI) using stdlib unittest. Command: `python3 -m unittest discover -s tests -p "test_*.py"` with PYTHONPATH=$PWD.

No pytest required. No external dependencies. Fails closed. Reproducible.
