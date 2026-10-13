#!/bin/sh

# Linux make this executable via: chmod +x entrypoint.sh

echo "run_id: $RUN_ID"

# Pick up values from environment variables provided at container runtime.
# EXPECTED ENV VARS:
# - TEST_INPUT: optional test suite filter (e.g. "API" or "UI")
# - ENVIRONMENT: target environment (e.g. "docker", "dev", "test")

echo "------------------------------------------------------------"
echo "[journey-tests] Environment variables in use:"
echo "------------------------------------------------------------"

echo "ENVIRONMENT:              ${ENVIRONMENT:-<not set>}"
echo "PROFILE:                  ${PROFILE:-<not set>}"
echo "CI:                       ${CI:-<not set>}"
echo "CDP:                      ${CDP:-<not set>}"
echo ""

echo "LIS_FRONTOFFICE_BASE_URL:         ${LIS_FRONTOFFICE_BASE_URL:-<not set>}"
echo "LIS_BACKOFFICE_BASE_URL:          ${LIS_BACKOFFICE_BASE_URL:-<not set>}"
echo ""

echo "GITHUB_ACTIONS:           ${GITHUB_ACTIONS:-<not set>}"
echo "RUN_ID:                   ${RUN_ID:-<not set>}"
echo ""

echo "Node version:             $(node -v)"
echo "NPM version:              $(npm -v)"
echo "Working directory:        $(pwd)"
echo "------------------------------------------------------------"

TEST_INPUT="${PROFILE}"

FILTER=""

if [ -n "$TEST_INPUT" ]; then
  FILTER="$TEST_INPUT"
fi

if [ -z "$FILTER" ]; then
  echo "No filters provided. Running all tests for environment: $ENVIRONMENT"
  npx bddgen && npx playwright test --config=playwright.config.ts || touch FAILED
else
  echo "Running filtered tests with grep: $FILTER"
  npx bddgen && npx playwright test --config=playwright.config.ts --grep="$FILTER"  || touch FAILED
fi

# Merge the CTRF JSON reports into a single report file for Github actions summary and publishing
# Skip publishing when running in GitHub Actions
if [ "$GITHUB_ACTIONS" = "true" ]; then
  echo "Merging CTRF JSON reports for GitHub Actions summary"
  npm run merge:report
  echo "Skipping test result publishing in CI"
else
  npm run report:publish
  publish_exit_code=$?

  if [ $publish_exit_code -ne 0 ]; then
    echo "failed to publish test results"
  fi
fi

# At the end of the test run, if the suite has failed we write a file called 'FAILED'
if [ -f FAILED ]; then
  echo "test suite failed"
  exit 1
fi

echo "test suite passed"
exit 0
