#!/usr/bin/env bash
# Auto-pull deploy untuk titikjiwa — dipanggil webhook CI/CD atau manual.
# Prosedur: fetch → bandingkan → pull (merge, batal jika konflik) → deps → build → restart → verifikasi → rollback jika gagal.
set -uo pipefail
cd /app
LOGFILE=/var/log/auto_deploy.log
LOG() { echo "[$(date -u +%FT%TZ)] $*" | tee -a "$LOGFILE"; }

PREV=$(git rev-parse HEAD)
git fetch origin main >> "$LOGFILE" 2>&1
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if git merge-base --is-ancestor origin/main HEAD && git diff --quiet HEAD origin/main -- . ':!memory/PRD.md'; then
  LOG "tidak ada update (konten setara ${REMOTE:0:7})"
  exit 0
fi

LOG "update ditemukan: ${LOCAL:0:7} → ${REMOTE:0:7}, menarik…"
if ! git pull --no-rebase --no-edit origin main >> "$LOGFILE" 2>&1; then
  git merge --abort >> "$LOGFILE" 2>&1 || true
  LOG "GAGAL: konflik merge pada $REMOTE — dibatalkan, tetap di $PREV"
  exit 1
fi
NEW=$(git rev-parse HEAD)
python3 scripts/ensure_deploy_hook.py >> "$LOGFILE" 2>&1

pip install -r backend/requirements.txt >> "$LOGFILE" 2>&1
PIP_OK=$?
if [ -f backend/requirements-emergent.txt ]; then
  pip install -r backend/requirements-emergent.txt >> "$LOGFILE" 2>&1 || PIP_OK=$?
fi

pip install -r backend/requirements.txt >> "$LOGFILE" 2>&1
PIP_OK=$?
export $(grep -E '^REACT_APP_BACKEND_URL' frontend/.env | xargs)
CI=false bash -c 'cd frontend && npm ci && npm run build' >> "$LOGFILE" 2>&1
FE_OK=$?

if [ "$PIP_OK" -ne 0 ] || [ "$FE_OK" -ne 0 ]; then
  LOG "GAGAL: dependensi/build (pip=$PIP_OK frontend=$FE_OK) pada $NEW — rollback ke $PREV"
  git reset --hard "$PREV" >> "$LOGFILE" 2>&1
  python3 scripts/ensure_deploy_hook.py >> "$LOGFILE" 2>&1
  sudo supervisorctl restart backend frontend >> "$LOGFILE" 2>&1
  exit 1
fi

sudo supervisorctl restart backend frontend >> "$LOGFILE" 2>&1
sleep 25
B="000"; F="000"
for i in 1 2 3 4; do
  B=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8001/api/)
  F=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/)
  [ "$B" = "200" ] && [ "$F" = "200" ] && break
  sleep 10
done
if [ "$B" != "200" ] || [ "$F" != "200" ]; then
  LOG "GAGAL: health check (backend=$B frontend=$F) pada $NEW — rollback ke $PREV"
  git reset --hard "$PREV" >> "$LOGFILE" 2>&1
  python3 scripts/ensure_deploy_hook.py >> "$LOGFILE" 2>&1
  sudo supervisorctl restart backend frontend >> "$LOGFILE" 2>&1
  exit 1
fi

LOG "SUKSES: deploy $NEW (health backend=$B frontend=$F)"
exit 0
