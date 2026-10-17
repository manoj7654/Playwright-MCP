
import { expect, test, type Page } from '@playwright/test';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { AdminPage } from '../pages/AdminPage';
import { BuzzPage } from '../pages/BuzzPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { PIMPage } from '../pages/PIMPage';

async function login(
  page: Page,
  username = 'Admin',
  password = 'admin123'
): Promise<LoginPage> {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(username, password);
  return loginPage;
}

test.describe.configure({ mode: 'serial' });

test.describe('OrangeHRM login and logout', () => {
  test('logs in with valid credentials and displays the dashboard', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await login(page);

    await expect(page).toHaveURL(/\/web\/index\.php\/dashboard\/index/);
    await expect(dashboardPage.heading).toBeVisible();
  });

  test('logs out and displays the login page', async ({ page }) => {
    const loginPage = await login(page);
    const dashboardPage = new DashboardPage(page);

    await expect(page).toHaveURL(/\/web\/index\.php\/dashboard\/index/);

    await dashboardPage.logout();

    await expect(page).toHaveURL(/\/web\/index\.php\/auth\/login/);
    await expect(loginPage.usernameInput).toBeVisible();
  });
});

test.describe('OrangeHRM PIM', () => {
  test('searches for an employee and displays matching results', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const pimPage = new PIMPage(page);

    await login(page);

    await expect(page).toHaveURL(/\/web\/index\.php\/dashboard\/index/);

    await dashboardPage.openModule('PIM');

    await expect(page).toHaveURL(/\/web\/index\.php\/pim\/viewEmployeeList/);
    await expect(pimPage.employeeInformationHeading).toBeVisible();

    const employeeName = await pimPage.firstEmployeeFullName();

    await pimPage.searchEmployee(employeeName, employeeName);

    await expect(pimPage.recordCount()).toBeVisible();
    await expect(pimPage.employeeResultRow(new RegExp(employeeName))).toBeVisible();
  });

  test('creates an employee and displays the employee profile', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const pimPage = new PIMPage(page);

    await login(page);

    await expect(page).toHaveURL(/\/web\/index\.php\/dashboard\/index/);

    await dashboardPage.openModule('PIM');

    await expect(page).toHaveURL(/\/web\/index\.php\/pim\/viewEmployeeList/);

    // Create the employee. The method should click Save.
    await pimPage.addEmployee('John123', 'Doe456');

    // Wait for navigation to the employee profile.
    await expect(page).toHaveURL(
      /\/web\/index\.php\/pim\/viewPersonalDetails\/empNumber\/\d+/,
      { timeout: 15000 }
    );

    await expect(pimPage.employeeName('John123 Doe456')).toBeVisible();
  });
});

test('opens Admin and displays System Users with the Add button', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  const adminPage = new AdminPage(page);

  await login(page);

  await expect(page).toHaveURL(/\/web\/index\.php\/dashboard\/index/);

  await dashboardPage.openModule('Admin');

  await expect(page).toHaveURL(/\/web\/index\.php\/admin\/viewSystemUsers/);
  await expect(adminPage.systemUsersHeading).toBeVisible();
  await expect(adminPage.addButton).toBeVisible();
});

test('publishes a message in the Buzz feed', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  const buzzPage = new BuzzPage(page);

  await login(page);

  await expect(page).toHaveURL(/\/web\/index\.php\/dashboard\/index/);

  await dashboardPage.openModule('Buzz');

  await expect(page).toHaveURL(/\/web\/index\.php\/buzz\/viewBuzz/);
  await expect(buzzPage.latestPostsSection).toBeVisible();

  const message = 'Excited for testing!';

  await buzzPage.publish(message);

  await expect(buzzPage.post(message)).toBeVisible();
});

type LoginCase = {
  username: string;
  password: string;
  expected: 'dashboard' | 'invalid credentials';
};

const loginCases: LoginCase[] = [
  { username: 'Admin', password: 'admin123', expected: 'dashboard' },
  { username: 'fakeuser', password: 'fakepass', expected: 'invalid credentials' },
  { username: 'ESSUser1', password: 'ess123', expected: 'invalid credentials' },
];

test.describe('Data-driven login functionality', () => {
  for (const { username, password, expected } of loginCases) {
    test(`${username} login expects ${expected}`, async ({ page }) => {
      const loginPage = await login(page, username, password);

      if (expected === 'dashboard') {
        const dashboardPage = new DashboardPage(page);

        await expect(page).toHaveURL(/\/web\/index\.php\/dashboard\/index/);
        await expect(dashboardPage.heading).toBeVisible();

        await dashboardPage.logout();

        await expect(page).toHaveURL(/\/web\/index\.php\/auth\/login/);
        await expect(loginPage.usernameInput).toBeVisible();
      } else {
        await expect(page).toHaveURL(/\/web\/index\.php\/auth\/login/);
        await expect(loginPage.invalidCredentialsAlert).toContainText(
          'Invalid credentials'
        );
      }
    });
  }
});

type CsvLoginRow = {
  Username: string;
  Password: string;
  Expected: string;
};

type CsvLoginCase = {
  username: string;
  password: string;
  expected: 'Dashboard' | 'Invalid credentials';
};

const csvContent = readFileSync(
  resolve(__dirname, '../test_data/loginData.csv'),
  'utf8'
);

const csvRows = parse<CsvLoginRow>(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

if (csvRows.length === 0) {
  throw new Error('The login CSV file contains no test data.');
}

const csvLoginCases: CsvLoginCase[] = csvRows.map(
  ({ Username, Password, Expected }, index) => {
    if (!Username || !Password) {
      throw new Error(
        `Login CSV row ${index + 2} must include Username and Password.`
      );
    }

    if (Expected !== 'Dashboard' && Expected !== 'Invalid credentials') {
      throw new Error(
        `Login CSV row ${index + 2} has unsupported Expected value: "${Expected}".`
      );
    }

    return {
      username: Username,
      password: Password,
      expected: Expected,
    };
  }
);

test.describe('CSV-driven login validation', () => {
  for (const { username, password, expected } of csvLoginCases) {
    test(`${username} expects ${expected}`, async ({ page }) => {
      const loginPage = await login(page, username, password);

      if (expected === 'Dashboard') {
        const dashboardPage = new DashboardPage(page);

        await expect(page).toHaveURL(/\/web\/index\.php\/dashboard\/index/);
        await expect(dashboardPage.heading).toBeVisible();
      } else {
        await expect(page).toHaveURL(/\/web\/index\.php\/auth\/login/);
        await expect(loginPage.invalidCredentialsAlert).toContainText(expected);
      }
    });
  }
});
