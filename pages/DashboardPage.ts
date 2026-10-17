import type { Page } from '@playwright/test';

export class DashboardPage {
  readonly heading;
  private readonly profilePicture;
  private readonly logoutMenuItem;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
    this.profilePicture = page.getByRole('img', { name: 'profile picture' }).first();
    this.logoutMenuItem = page.getByRole('menuitem', { name: 'Logout' });
  }

  async openModule(moduleName: string): Promise<void> {
    const moduleLink = this.page.getByRole('link', { name: moduleName });
    await moduleLink.focus();
    await moduleLink.press('Enter');
  }

  async logout(): Promise<void> {
    await this.profilePicture.click();
    await this.logoutMenuItem.click();
  }
}
