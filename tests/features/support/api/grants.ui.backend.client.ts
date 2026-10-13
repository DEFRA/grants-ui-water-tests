import { StatusCodes } from 'http-status-codes'
import { BaseClient } from './base.client'

export class GrantsUiBackendClient extends BaseClient {
  async get<T>(
    url: string,
    statusCode: StatusCodes,
    options?: object
  ): Promise<T> {
    return await super.get<T>(url, statusCode, options)
  }

  async post<T>(
    url: string,
    statusCode: StatusCodes,
    options?: object
  ): Promise<T> {
    return await super.post<T>(url, statusCode, options)
  }
}
