#!/usr/bin/env bash
# Run by GitHub Actions over SSH (forced command for the deploy key).
# Fast-forwards to origin/main, restarts the backend, checks health, rolls back on failure.
set -euo pipefail
exec 9>/tmp/aio-deploy.lock
flock -n 9 || { echo "Another deploy is running"; exit 1; }

cd /home/ubuntu/aio-fitness
PREV=$(git rev-parse HEAD)
git fetch --quiet origin main
git merge --ff-only --quiet origin/main
echo "Deploying $(git log -1 --oneline) (was ${PREV:0:7})"

healthy() {
  for _ in $(seq 1 60); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/session-types || true)" = 200 ] && return 0
    sleep 5
  done
  return 1
}

sudo systemctl restart aio-fitness
if healthy; then echo "Backend healthy"; exit 0; fi

echo "Health check failed; rolling back to ${PREV:0:7}"
sudo journalctl -u aio-fitness -n 40 --no-pager || true
git reset --hard --quiet "$PREV"
sudo systemctl restart aio-fitness
healthy && echo "Rolled back; backend healthy" || echo "Rollback also unhealthy - check the server"
exit 1
