import * as dotenv from 'dotenv'
import * as fs from 'fs'
import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'
import { ReporterDescription } from 'playwright/test'

const serverTimeout = 5 * 60 * 1000
// Set Environment
const ENV = process.env.ENVIRONMENT ?? 'local'
const isLocal = ENV === 'local'

// Only load env files for local + docker
let envFile: string | null = null

if (ENV === 'local') envFile = '.env'
if (ENV === 'docker') envFile = '.env.docker'

if (envFile && fs.existsSync(envFile)) {
  dotenv.config({ path: envFile })
}

// Read values from environment variables
const grantsUiUrl = process.env.GRANTS_UI_BASE_URL || 'http://localhost:3000'
const grantsUiBackendUrl =
  process.env.GRANTS_UI_BACKEND_BASE_URL || 'http://localhost:3001'
const grantsScoringApiUrl =
  process.env.GRANTS_SCORING_API_BASE_URL || 'http://localhost:5001'
const isCDPEnvironment = ENV === 'dev' || ENV === 'test'

process.env.isLocal = isLocal.toString()
process.env.grantsUiUrl = grantsUiUrl
process.env.grantsUiBackendUrl = grantsUiBackendUrl
process.env.grantsScoringApiUrl = grantsScoringApiUrl
process.env.isCDPEnvironment = isCDPEnvironment.toString()

const reporters: ReporterDescription[] = [
  ['list'], // CLI console output
  [
    'html',
    {
      outputFolder: 'playwright-report/html',
      open: isCDPEnvironment ? 'never' : 'on-failure'
    }
  ],
  ['json', { outputFile: 'playwright-report/results.json' }],
  ['allure-playwright', { reportDir: 'allure-report' }]
]

// Enable GitHub reporter ONLY inside GitHub Actions runner
if (process.env.GITHUB_ACTIONS === 'true') {
  reporters.push([
    'playwright-ctrf-json-reporter',
    {
      outputDir: 'playwright-report', // Optional: Output directory path. Defaults to '.' (project root).
      screenshot: true, // Optional: Include screenshots in the report. Defaults to 'false'.
      testType: 'Journey tests', // Optional: Specify the test type (e.g., 'api', 'e2e'). Defaults to 'e2e'.
      buildName: 'Grants UI Water Tests Build' // Optional: Specify the build name.
    }
  ])
}

const testDir = defineBddConfig({
  features: 'tests/features/**/*.feature',
  steps: [
    'tests/features/step-definitions/**/*.ts',
    'tests/fixtures/**/*.fixture.ts'
  ]
})

export default defineConfig({
  testDir,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: reporters,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: grantsUiUrl,
    screenshot: 'only-on-failure',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests if we are in a local development environment */
  webServer: isLocal
    ? [
        {
          name: 'grants-ui-water-tests',
          command: 'bin/platform.sh up',
          gracefulShutdown: { signal: 'SIGTERM', timeout: serverTimeout },
          url: 'http://localhost:5001/health',
          reuseExistingServer: !process.env.CI,
          timeout: serverTimeout,
          ignoreHTTPSErrors: true
        }
      ]
    : []
})
