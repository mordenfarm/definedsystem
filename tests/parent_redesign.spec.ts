
import { test, expect } from '@playwright/test';

test.describe('Parent Portal Redesign', () => {
  test('should verify navigation and dashboard elements', async ({ page }) => {
    // Set viewport to a common mobile size
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('http://localhost:3000');

    // Landing page - find Access Portal button
    const accessPortalHero = page.locator('button:has-text("Access Portal")').first();
    const loginPortalHeader = page.locator('button:has-text("Login Portal")').first();

    if (await accessPortalHero.isVisible()) {
        await accessPortalHero.click();
    } else if (await loginPortalHeader.isVisible()) {
        await loginPortalHeader.click();
    }

    await page.waitForTimeout(1000);

    // Select PARENT role
    await page.click('text=PARENT');
    await page.waitForTimeout(1000);

    // The new LoginPage uses a search input for PARENT role
    const searchInput = page.locator('input[placeholder="Search database name..."]');
    await searchInput.fill('Test Parent');

    // Wait for and click the suggestion
    await page.click('text=Test Parent');

    // Fill password
    await page.fill('input[type="password"]', '000000');

    await page.click('button:has-text("Login Now")');

    // Wait for Dashboard
    // Try to find the header by content if the class is not working as expected
    await page.waitForSelector('text=Defined Domains', { timeout: 15000 });
    await page.screenshot({ path: 'step3_dashboard.png' });

    // Verify Navigation Labels in bottom nav
    const nav = page.locator('nav');
    await expect(nav).toContainText('Progress');
    await expect(nav).toContainText('Fees');
    await expect(nav).toContainText('Home');
    await expect(nav).toContainText('Reports');

    // Verify Dashboard Cards
    await expect(page.locator('text=Tuition Status')).toBeVisible();
    await expect(page.locator('text=Latest Reports')).toBeVisible();
    await expect(page.locator('text=Notice Board')).toBeVisible();

    // Go to Progress tab
    await page.click('button:has-text("Progress")');
    await expect(page.locator('text=Learning Progress')).toBeVisible();
    await expect(page.locator('text=See Reports')).toBeVisible();
    await page.screenshot({ path: 'step4_progress.png' });

    // Go to Reports tab (via nav)
    await page.click('button:has-text("Reports")');
    await expect(page.locator('h1:has-text("Report History")')).toBeVisible();
    await page.screenshot({ path: 'step5_reports.png' });

    // Go to Home and then All Notices
    await page.click('button:has-text("Home")');
    await page.click('text=All Notices');
    await expect(page.locator('h1:has-text("Notices")')).toBeVisible();

    // Check for "NEW" tag in notices list
    await expect(page.locator('text=NEW').first()).toBeVisible();

    await page.screenshot({ path: 'step6_notices.png' });

    // Verify Logout position in header
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });
});
