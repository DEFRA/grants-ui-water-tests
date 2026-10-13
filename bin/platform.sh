#!/usr/bin/env bash
set -euo pipefail

# ------------------------------------------------------------
# Resolve ROOT_DIR to the grants-ui parent folder
# Works locally AND in GitHub Actions
# ------------------------------------------------------------
if [ -z "${ROOT_DIR:-}" ]; then
	export ROOT_DIR="$(cd "$(dirname "$0")/../../" && pwd)"
fi

# ------------------------------------------------------------
# Resolve repo paths relative to grants-ui parent folder
# ------------------------------------------------------------
GRANTS_UI_DIR="$ROOT_DIR/grants-ui"
GRANTS_SCORING_API_DIR="$ROOT_DIR/grants-scoring-api"
GRANTS_UI_PARENT_DIR="$ROOT_DIR"

COMMAND="${1:-help}"

configure_nvm() {
    source ~/.nvm/nvm.sh
    nvm install && nvm use
}

start_grants_ui() {
    if [ "${CI:-}" = "true" ]; then
        npm exec gt up -d
    else
        npm exec gt up
    fi
}

stop_grants_ui() {
    npm exec gt down || true
}

start_grants_scoring_api() {
    if [ "${CI:-}" = "true" ]; then
        docker compose -p grants-ui -f compose.override.yml up --build -d --wait-timeout 300 --quiet-pull
    else
        docker compose -p grants-ui -f compose.override.yml up --build --wait-timeout 300 --quiet-pull
    fi
}

stop_grants_scoring_api() {
    docker compose -p grants-ui -f compose.override.yml down || true
}

start_platform() {
	echo "[platform] Starting grants-ui and grants-scoring-api services..."

    cd "$GRANTS_UI_DIR"
    configure_nvm
    npm i
    start_grants_ui

    cd "$GRANTS_SCORING_API_DIR"
    start_grants_scoring_api

	return $?
}

stop_platform() {
	echo "[platform] Stopping grants-ui and grants-scoring-api services..."
	
    cd "$GRANTS_UI_DIR"
	stop_grants_ui

    cd "$GRANTS_SCORING_API_DIR"
    stop_grants_scoring_api

	return $?
}


case "$COMMAND" in
up)
    start_platform
    ;;
down)
    stop_platform
    ;;
*)
    echo "Usage:"
    echo "  ./platform.sh up     # Start all required services"
    echo "  ./platform.sh down   # Stop all required services"
    ;;
esac
