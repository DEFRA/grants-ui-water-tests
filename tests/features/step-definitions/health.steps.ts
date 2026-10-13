import { expect } from '@playwright/test'
import { HealthResponse } from '../../types/responses/healthResponse.type'
import { StatusCodes } from 'http-status-codes'
import { EndPoints } from '../../utils/enums'
import { Given, When, Then } from '../../fixtures/test.fixture'
import { GrantsScoringApiClient } from '../support/api/grants.scoring.api.client'
import { GrantsUiBackendClient } from '../support/api/grants.ui.backend.client'
import { GrantsUiClient } from '../support/api/grants.ui.client'

let client: GrantsScoringApiClient | GrantsUiBackendClient | GrantsUiClient
let response: HealthResponse

Given(
  'the Grants Scoring API is running',
  async function ({ grantsScoringApiClient }) {
    client = grantsScoringApiClient
  }
)

Given(
  'the Grants UI Backend application is running',
  async function ({ grantsUiBackendClient }) {
    client = grantsUiBackendClient
  }
)

Given(
  'the Grants UI application is running',
  async function ({ grantsUiClient }) {
    client = grantsUiClient
  }
)

When('I check the health endpoint', async function () {
  response = await client.get<HealthResponse>(EndPoints.Health, StatusCodes.OK)
})

Then('I should receive a healthy response', async function () {
  if (
    client instanceof GrantsUiClient ||
    client instanceof GrantsScoringApiClient ||
    client instanceof GrantsUiBackendClient
  ) {
    expect(response).toHaveProperty('message', 'success')
  } else {
    throw new Error('Unknown client type')
  }
})
