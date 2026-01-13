#!/usr/bin/env python3
"""
Canonical Python test gate for Phase 8B.2
Runs locally and in CI.
FAIL-CLOSED: exits with code 2 if zero tests are discovered.
"""

import unittest
import sys
import os

def main():
    # Setup paths
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    tests_dir = os.path.join(root_dir, 'tests')
    
    # Add lib to python path for imports
    lib_dir = os.path.join(root_dir, 'lib')
    if lib_dir not in sys.path:
        sys.path.insert(0, lib_dir)
        
    print(f"Running Python unittest gate...")
    print(f"Working directory: {root_dir}")
    print(f"Python version: {sys.version.split()[0]}")
    print("")

    if not os.path.isdir(tests_dir):
        print("\nBLOCKER_NO_TESTS_FOUND")
        print("ERROR: tests/ directory does not exist.")
        print("This gate is fail-closed: zero tests is a blocker.")
        sys.exit(2)

    # Discover tests
    print("Discovering tests...")
    loader = unittest.TestLoader()
    suite = loader.discover(tests_dir, pattern="test_*.py")
    
    test_count = suite.countTestCases()
    print(f"Tests discovered: {test_count}")

    if test_count == 0:
        print("\nBLOCKER_NO_TESTS_FOUND")
        print("ERROR: No tests were discovered in tests/ directory.")
        print("This gate is fail-closed: zero tests is a blocker.")
        sys.exit(2)

    # Run tests
    print(f"\nRunning {test_count} test(s)...")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if result.wasSuccessful():
        print(f"\nOK_TESTS_RAN count={test_count}")
        sys.exit(0)
    else:
        print(f"\nTESTS_FAILED failure_count={len(result.failures)} error_count={len(result.errors)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
