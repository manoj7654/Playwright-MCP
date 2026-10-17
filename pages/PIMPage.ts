import type { Page } from '@playwright/test';

export class PIMPage {
  readonly employeeInformationHeading;
  readonly addEmployeeLink;
  readonly addEmployeeHeading;
  readonly firstNameInput;
  readonly lastNameInput;
  readonly saveButton;
  private readonly employeeNameInput;
  private readonly searchButton;
  private readonly employeeTable;

  constructor(private readonly page: Page) {
    this.employeeInformationHeading = page.getByRole('heading', { name: 'Employee Information' });
    this.addEmployeeLink = page.getByRole('link', { name: 'Add Employee' });
    this.addEmployeeHeading = page.getByRole('heading', { name: 'Add Employee' });
    this.firstNameInput = page.getByRole('textbox', { name: 'First Name' });
    this.lastNameInput = page.getByRole('textbox', { name: 'Last Name' });
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.employeeNameInput = page.getByRole('textbox', { name: 'Type for hints...' }).first();
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.employeeTable = page.getByRole('table');
  }

  async firstEmployeeFullName(): Promise<string> {
    const firstEmployee = this.employeeTable.getByRole('row').nth(1);
    const firstName = (await firstEmployee.getByRole('cell').nth(2).innerText()).trim();
    const lastName = (await firstEmployee.getByRole('cell').nth(3).innerText()).trim();

    if (!firstName || !lastName) {
      throw new Error('The first employee row does not contain a name.');
    }

    return `${firstName} ${lastName}`;
  }

  async searchEmployee(name: string, suggestion: string): Promise<void> {
    if (!(await this.employeeNameInput.isVisible())) {
      await this.employeeInformationHeading
        .locator('xpath=..')
        .getByRole('button')
        .click();
    }

    await this.employeeNameInput.fill(name);
    await this.page.getByRole('option', { name: suggestion }).click();
    await this.searchButton.click();
  }

  async addEmployee(firstName: string, lastName: string): Promise<void> {
    await this.addEmployeeLink.click();
    await this.addEmployeeHeading.waitFor({ state: 'visible' });
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.saveButton.click();
  }

  recordCount() {
    return this.page.getByText(/\(\d+\) Records? Found/);
  }

  employeeResultRow(name: RegExp) {
    return this.employeeTable.getByRole('row', { name });
  }

  employeeName(name: string) {
    return this.page.getByText(name, { exact: true });
  }
}
