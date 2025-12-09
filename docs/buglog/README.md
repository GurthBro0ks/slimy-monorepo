# Bug Log Protocol

This folder contains the "Flight Recorder" data for bug fixes.
AI Agents (Claude, Codex, etc.) are REQUIRED to read and write to these files.

## Naming Convention
`BUG_<YYYY-MM-DD>_<slug>.md`
Example: `BUG_2025-12-06_club-save-404.md`

## Required Structure
Every file must track the lifecycle of the fix:
1. **Symptom:** The exact error and command run.
2. **Root Cause:** The analysis.
3. **Plan:** The checklist of files to touch.
4. **Changes:** The files modified.
5. **Verification:** The final test command and result.

## The Golden Rule
If a test fails, you must UPDATE the log with the failure details before trying a new fix.
