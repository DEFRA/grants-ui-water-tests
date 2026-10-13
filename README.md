grants-ui-water-tests

A Playwright-based end-to-end and API test suite for the Grants UI Water services.  
Tests can be executed locally, in CI (GitHub Actions), or on the CDP Platform using the published Docker image.

- [Local Development](#local-development)
  - [Requirements](#requirements)
    - [Node.js](#nodejs)
    - [Prerequisites](#Prerequisites)
  - [Setup](#setup)
  - [Running tests](#running-tests)
  - [Environment Configuration](#environment-configuration)
  - [Debugging tests](#debugging-tests)
- [Project Structure](#project-structure)
- [Production](#production)
- [Licence](#licence)

## Local Development

### Prerequisites

- **.NET 10 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/10.0)
- **Docker & Docker Compose** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** LIS Dev (Front and Back office ochestration) - [Download](https://github.com/DEFRA/lis-dev)

#### Node.js

Please install [Node.js](http://nodejs.org/) `>= v22.13.1` and [npm](https://nodejs.org/). You will find it
easier to use the Node Version Manager [nvm](https://github.com/creationix/nvm).

To use the correct version of Node.js for this application, via nvm:

```bash
nvm use
```

### Setup

Install application dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install
```

### Running tests

Run all tests (Default ENV=local, HEADLESS=true):

```bash
npm run test
```

Run tests for a specific environment:

```bash
npx playwright test --ENV=local
npx playwright test --ENV=dev
```

Run tests in UI mode (interactive):

```bash
npx playwright test --ui
```

Run a specific test file:

```bash
npx playwright test tests/features/api/example.feature
```

### Environment Configuration

The test environment is configured via the `ENV` environment variable in `playwright.config.ts`:

- `local` (default): Runs against the following services
  - `https://localhost:3000` (Grants Scoring API)
  - `https://localhost:4000` (Grants UI)
  - `https://localhost:4001` (Grants UI Backend)
- `docker`: Used when running inside the tests Docker container
- `dev`: Runs against development environment URLs

When `ENV=local`, Playwright will automatically start the the grants scoring api, ui and backend environments before running tests.

### Debugging tests

Run tests in debug mode:

```bash
npx playwright test --debug
```

Run tests with Playwright Inspector:

```bash
npx playwright test --headed
```

View test reports:

```bash
npx playwright show-report
```

## Project Structure

```
tests/
├── features               # API tests
│   ├── api/               # All API related tests
│   |── ui/                # All UI related tests
│   ├── support/           # Test support and setup
│   └── step-definitions/  # Step definition classes
├── fixtures/              # Playwright test fixtures
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions and constants
```

## Production

### Running the tests

Tests are run from the CDP-Portal under the Test Suites section. Before any changes can be run, a new docker image must be built, this will happen automatically when a pull request is merged into the `main` branch.
You can check the progress of the build under the actions section of this repository. Builds typically take around 1-2 minutes.

The results of the test run are made available in the portal.

### Test Reports

Test reports is generated in the following format:

- **HTML Report**: `allure-report` - Interactive HTML report
- **JSON Report**: `allure-results` - Machine-readable test results
- **Console Output**: Real-time test execution output

View the HTML report:

```bash
npx playwright show-report
```

## Running on the CDP Platform

The CDP Platform runs the published Docker image of this test suite.

**How it works**

- A new Docker image is built and published automatically when changes are merged into main.
- CDP Portal always runs the latest published image.
- CDP injects environment variables:
  - PROFILE (optional test filter)
  - ENVIRONMENT (dev/test/perf-test)
- The container runs `entrypoint.sh`, which:
  - executes Playwright Cucumber-js tests
  - generates `allure-results/`
  - builds the Allure HTML report (`allure-report/`)
  - publishes the report via `./bin/publish-tests.sh` to S3.
- CDP Portal displays the final HTML report

### Requirements for CDP

The Docker image must be published via `.github/workflows/publish.yml`.

`entrypoint.sh` must exit with:

- 0 on success
- non-zero on failure

`./bin/publish-tests.sh` must upload the Allure HTML report to S3.

### Running the Test Suite via GitHub Workflow

You can also run the test suite directly from GitHub using the composite action in:

```
Code
./run-journey-tests/action.yml
```

This runs Playwright without Docker, using CDP environment variables if provided.

Useful for:

- smoke testing
- running against dev/test environments
- debugging failures outside CDP Portal

## Running on GitHub

CI runs the test suite inside Docker using docker compose.
Reports are mounted out of the container and uploaded as artifacts.

CI uploads:

- allure-results/ (raw Allure data)
- playwright-report/html/ (Playwright HTML report)
- ctrf-report (A merged CTRF JSON formatted report for Github Actions)
- docker-logs (Docker related logs)

CI does not generate the Allure HTML report (allure-report/), because the entrypoint intentionally skips publishing when GITHUB_ACTIONS=true.

## Platform Orchestration (`grants-ui and scoring api docker compose`)

The test suite includes a helper script located at:

`bin/platform.sh`

```

This script provides a consistent way to start and stop the **local/docker LIS platform**, including:

- shared infrastructure (LocalStack, Redis, PostgreSQL, etc.)
- backend service (`grants-ui-backend, grants-scoring-api`)
- ui service (`grants-ui`)

It is used in **local development**, **GitHub Actions CI**, and **CDP‑style local simulation**.

---

### How `platform.sh` Works

The script:

1. Resolves paths to:
   - `grants-ui`
   - `grants-ui-backend`
   - `grants-scoring-api
2. Ensures the shared Docker network `grants-ui-net` exists
3. Starts or stops:
   - shared infra
   - grants-ui
   - grants-ui-backend
   - grants-scoring-api

---
```

### Commands

Start the grants-ui platform:

```bash
./bin/platform.sh up
```

Stop the grants-ui platform:

```bash
./bin/platform.sh down
```

`bin/platform.sh` provides a **unified orchestration layer** for local and CI environments:

- Ensures consistent Docker networking
- Ensures correct override files
- Starts back-office, front-office, and shared infra
- Makes local and CI environments match
- Not used by CDP Portal (which runs the Docker image directly)

This gives you:

- Local parity with CI
- CI parity with CDP
- Predictable, reproducible test environments

### How grants-ui Behaves in Each Environment

#### Local Development

When running locally:

The script starts:

- grants-ui
- grants-ui-backend
- grants-config-broker

Uses `docker-compose.yml` unless an override is provided.

Ensures the `grants-ui-net` Docker network exists.

Allows you to run tests against a fully local Grants UI and Grants Scoring API Service.

Typical workflow:

```
./bin/platform.sh up
npm run test
./bin/platform.sh down
```

####GitHub Actions (CI)

In CI:

- CI=true is set automatically
- The scripts run in exactly the same way as they run locally for parity

This ensures:

- deterministic builds
- no local-only overrides
- correct networking
- correct environment variables
- reproducible test runs

CI uses the script to start:

- grants-ui
- grants-ui-backend
- grants-scoring-api

Then the test suite runs inside Docker.

After the run, CI calls:

```
./bin/platform.sh down
```

to clean up.

#### CDP Platform

Important:

The CDP Platform **does NOT** use `./bin/platform.sh`.

CDP Portal runs the **published Docker image** of the test suite directly:

```
docker run <image>
```

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government licence v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
