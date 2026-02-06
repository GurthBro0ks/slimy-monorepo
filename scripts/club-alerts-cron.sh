#!/bin/bash
# Club alerts cron: Score milestone → Discord

SCORE=$(curl -s localhost:3000/api/supersnail/scores | jq -r '.yourScore.score')
if [ "$SCORE" -ge 1000000 ]; then
  # Discord message (OpenClaw message tool stub)
  echo "Score $SCORE milestone → Discord alert" >> /tmp/club-alerts.log
fi