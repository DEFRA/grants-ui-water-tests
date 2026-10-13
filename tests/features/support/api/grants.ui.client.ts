import { StatusCodes } from 'http-status-codes'
import { BaseClient } from './base.client'

export class GrantsUiClient extends BaseClient {
  async get<T>(
    url: string,
    statusCode: StatusCodes,
    options?: object
  ): Promise<T> {
    return await super.get<T>(url, statusCode, options)
  }
}
