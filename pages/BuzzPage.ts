import type { Page } from '@playwright/test';

export class BuzzPage {
  readonly latestPostsSection;
  private readonly messageInput;
  private readonly postButton;

  constructor(private readonly page: Page) {
    this.latestPostsSection = page.getByRole('button', { name: /Most Recent Posts/ });
    this.messageInput = page.getByRole('textbox', { name: "What's on your mind?" });
    this.postButton = page.getByRole('button', { name: 'Post', exact: true });
  }

  async publish(message: string): Promise<void> {
    await this.messageInput.fill(message);
    await this.postButton.click();
  }

  post(message: string) {
    return this.page.getByText(message, { exact: true }).first();
  }
}
