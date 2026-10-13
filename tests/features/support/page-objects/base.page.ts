import { Page } from '@playwright/test'

export class BasePage {
  public page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(path: string) {
    await this.page.goto(path)
  }

  async getTitle() {
    return await this.page.title()
  }
}
