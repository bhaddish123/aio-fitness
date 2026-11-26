#!/usr/bin/env bash
# Run by GitHub Actions over SSH (forced command for the deploy key). Install on the server as
# /home/ubuntu/deploy.sh. The workflow sends "deploy <sha>": the exact commit whose tests passed.
#
#   1. Refuse anything that isn't a full commit SHA on origin/main, or that is older than what's live.
#   2. Skip if backend/ is unchanged since the last SUCCESSFUL deploy (not since the previous push, so a
#      replaced or skipped CI run can't strand a backend change).
#   3. Move to that exact commit, restart, health-check. Record it as deployed only when healthy;
#      otherwise (restart failed OR unhealthy) roll back to the previous commit.
set -euo pipefail

APP_DIR="${AIO_APP_DIR:-/home/ubuntu/aio-fitness}"
STATE="${AIO_DEPLOY_STATE:-/home/ubuntu/.aio-deployed-sha}"
HEALTH_URL="${AIO_HEALTH_URL:-http://localhost:8080/session-types}"
HEALTH_TRIES="${AIO_HEALTH_TRIES:-60}"

exec 9>/tmp/aio-deploy.lock
flock -n 9 || { echo "Another deploy is running"; exit 1; }

# "deploy <sha>" from the workflow (SSH_ORIGINAL_COMMAND), or the SHA as $1 when run by hand.
REQ="${SSH_ORIGINAL_COMMAND:-deploy ${1:-}}"
if [[ ! "$REQ" =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  echo "Usage: deploy <full 40-char commit sha>"; exit 2
fi
SHA="${BASH_REMATCH[1]}"

cd "$APP_DIR"
PREV=$(git rev-parse HEAD)
LAST=$(cat "$STATE" 2>/dev/null || echo "$PREV")
git fetch --quiet origin main
if ! git merge-base --is-ancestor "$SHA" origin/main; then
  echo "Refusing ${SHA:0:7}: not on origin/main"; exit 1
fi
if ! git merge-base --is-ancestor "$LAST" "$SHA"; then
  echo "Refusing ${SHA:0:7}: older than the deployed ${LAST:0:7}"; exit 1
fi
if git diff --quiet "$LAST" "$SHA" -- backend; then
  echo "No backend changes since the last deploy (${LAST:0:7}); nothing to do."; exit 0
fi

healthy() {
  for _ in $(seq 1 "$HEALTH_TRIES"); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || true)" = 200 ] && return 0
    sleep 5
  done
  return 1
}

git merge --ff-only --quiet "$SHA"
echo "Deploying $(git log -1 --oneline) (was ${PREV:0:7})"
if sudo systemctl restart aio-fitness && healthy; then
  echo "$SHA" > "$STATE"
  echo "Backend healthy"; exit 0
fi

echo "Restart or health check failed; rolling back to ${PREV:0:7}"
sudo journalctl -u aio-fitness -n 40 --no-pager || true
git reset --hard --quiet "$PREV"
if sudo systemctl restart aio-fitness && healthy; then
  echo "Rolled back; backend healthy"
else
  echo "Rollback also unhealthy - check the server"
fi
exit 1
