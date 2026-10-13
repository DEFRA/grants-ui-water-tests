import { request, Page } from '@playwright/test'
import { test as base, createBdd } from 'playwright-bdd'
import { GrantsUiBackendClient } from '../features/support/api/grants.ui.backend.client'
import { GrantsScoringApiClient } from '../features/support/api/grants.scoring.api.client'
import { GrantsUiClient } from '../features/support/api/grants.ui.client'

export const test = base.extend<{
  grantsScoringApiClient: GrantsScoringApiClient
  grantsUiBackendClient: GrantsUiBackendClient
  grantsUiClient: GrantsUiClient
  grantsUiPage: Page
}>({
  grantsUiPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: process.env.GRANTS_UI_BASE_URL || 'http://localhost:3000'
    })
    await use(await context.newPage())
  },

  // eslint-disable-next-line no-empty-pattern
  grantsScoringApiClient: async ({}, use) => {
    const apiContext = await request.newContext({
      baseURL:
        process.env.GRANTS_SCORING_API_BASE_URL || 'http://localhost:5001'
    })
    const grantsScoringApiClient = new GrantsScoringApiClient(
      apiContext,
      'grants-scoring-api'
    )
    await use(grantsScoringApiClient)
  },

  // eslint-disable-next-line no-empty-pattern
  grantsUiBackendClient: async ({}, use) => {
    const apiContext = await request.newContext({
      baseURL: process.env.GRANTS_UI_BACKEND_BASE_URL || 'http://localhost:3001'
    })
    const grantsUiBackendClient = new GrantsUiBackendClient(
      apiContext,
      'grants-ui-backend'
    )
    await use(grantsUiBackendClient)
  },

  // eslint-disable-next-line no-empty-pattern
  grantsUiClient: async ({}, use) => {
    const apiContext = await request.newContext({
      baseURL: process.env.GRANTS_UI_BASE_URL || 'http://localhost:3000'
    })
    const grantsUiClient = new GrantsUiClient(apiContext, 'grants-ui')
    await use(grantsUiClient)
  }
})

const { AfterScenario } = createBdd(test)

AfterScenario(async ({ page }) => {
  await page.close()
})

export const { Given, When, Then } = createBdd(test)
