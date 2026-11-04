#!/usr/bin/env bash
# Build, push and (re)deploy the Cable Bahamas web service to SPCS.
#
# Usage:  VITE_CARTO_BASEMAP_KEY=... spcs/deploy.sh
# The CARTO key is stored as a Cortex secret named CARTO_BASEMAP_KEY; inject it without
# echoing it, e.g. from Cortex Code: VITE_CARTO_BASEMAP_KEY="CARTO_BASEMAP_KEY" spcs/deploy.sh
# Env overrides: CONNECTION (default PJOSE_AWS3_ADMIN), ROLE (default CABLE_BAHAMAS_APP).
set -euo pipefail
cd "$(dirname "$0")/.."

CONNECTION="${CONNECTION:-PJOSE_AWS3_ADMIN}"
ROLE="${ROLE:-CABLE_BAHAMAS_APP}"
IMAGE_NAME="cablebahamas-web"
# Unique tag per build: SPCS keeps a cached image when the tag and spec are unchanged.
TAG="${TAG:-$(git rev-parse --short HEAD)$(git diff --quiet || echo -dirty)}"
SERVICE="CABLEBAHAMAS_DEMO.APP.WEB"
POOL="CABLE_BAHAMAS_POOL"

sql() { snow sql --connection "$CONNECTION" --role "$ROLE" -q "$1"; }

REPO_URL=$(snow spcs image-repository url CABLEBAHAMAS_DEMO.APP.IMAGES --connection "$CONNECTION" --role "$ROLE")
echo "Image repository: $REPO_URL"

docker build --platform linux/amd64 --provenance=false \
  --build-arg VITE_CARTO_BASEMAP_KEY="${VITE_CARTO_BASEMAP_KEY:-}" \
  -t "$IMAGE_NAME:$TAG" .

snow spcs image-registry login --connection "$CONNECTION" --role "$ROLE"
docker tag "$IMAGE_NAME:$TAG" "$REPO_URL/$IMAGE_NAME:$TAG"
docker push "$REPO_URL/$IMAGE_NAME:$TAG"

SPEC=$(sed "s#cablebahamas-web:latest#cablebahamas-web:$TAG#" spcs/spec.yaml)
# JSON output: the table format pads columns, which broke a text match and skipped ALTER.
if snow sql --connection "$CONNECTION" --role "$ROLE" --format JSON -q "SHOW SERVICES LIKE 'WEB' IN SCHEMA CABLEBAHAMAS_DEMO.APP" | grep -q '"name": *"WEB"'; then
  sql "ALTER SERVICE $SERVICE FROM SPECIFICATION \$\$
$SPEC
\$\$"
else
  sql "CREATE SERVICE IF NOT EXISTS $SERVICE
  IN COMPUTE POOL $POOL
  FROM SPECIFICATION \$\$
$SPEC
\$\$
  MIN_INSTANCES = 1 MAX_INSTANCES = 1"
fi

echo "Waiting for service..."
for _ in $(seq 1 30); do
  STATUS=$(sql "SELECT SYSTEM\$GET_SERVICE_STATUS('$SERVICE')" || true)
  echo "$STATUS" | grep -q '"status":"READY"' && break
  sleep 10
done
sql "SHOW ENDPOINTS IN SERVICE $SERVICE"
echo "Then run section 3 of spcs/setup.sql (GRANT SERVICE ROLE ... TO ROLE CABLE_BAHAMAS_VIEWER) if not done yet."
