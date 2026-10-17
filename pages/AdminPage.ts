import type { Page } from '@playwright/test';

export class AdminPage {
  readonly systemUsersHeading;
  readonly addButton;

  constructor(page: Page) {
    this.systemUsersHeading = page.getByRole('heading', { name: 'System Users' });
    this.addButton = page.getByRole('button', { name: 'Add' });
  }
}
