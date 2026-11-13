#!/usr/bin/env bash
set -euo pipefail
install -d -m 700 /opt/veyra
test ! -f /opt/veyra/.env || { echo "Veyra already configured; refusing to replace secrets"; exit 1; }
tar -xzf /home/ubuntu/veyra-transfer/veyra-vps.tar.gz -C /opt/veyra
install -m 600 /home/ubuntu/veyra-transfer/vps.env /opt/veyra/.env
docker network inspect veyra_proxy >/dev/null 2>&1 || docker network create veyra_proxy
cd /opt/veyra
docker compose -f compose.vps.yaml config --quiet
docker compose -f compose.vps.yaml up --build -d --wait --wait-timeout 180
docker compose -f compose.vps.yaml --profile setup run --rm seed
docker compose -f compose.vps.yaml ps
