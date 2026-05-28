# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/parent_redesign.spec.ts >> Parent Portal Redesign >> should verify navigation and dashboard elements
- Location: tests/parent_redesign.spec.ts:5:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('text=Defined Domains') to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - main [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e8]:
          - img "Courageous Manyuchi" [ref=e10]
          - generic [ref=e11]:
            - paragraph [ref=e12]: Welcome Back!
            - heading "Courageous Manyuchi" [level=1] [ref=e13]
            - paragraph [ref=e14]: Test Parent
        - button [ref=e15] [cursor=pointer]:
          - img [ref=e16]
      - generic [ref=e20]:
        - img [ref=e23]
        - generic [ref=e25]:
          - generic [ref=e26]:
            - paragraph [ref=e27]: Paid fees out of total
            - img [ref=e28]
          - heading "$301" [level=2] [ref=e31]
          - paragraph [ref=e32]: out of $700
          - generic [ref=e33]:
            - generic [ref=e34]: 43%
            - generic [ref=e35]: Last paid $256
      - generic [ref=e36]:
        - generic [ref=e37]:
          - img [ref=e39]
          - paragraph [ref=e42]: This week
          - generic [ref=e43]:
            - heading "2" [level=3] [ref=e44]
            - generic [ref=e45]: Term 2
        - generic [ref=e46]:
          - img [ref=e48]
          - paragraph [ref=e54]: Scores
          - generic [ref=e55]:
            - heading "10%" [level=3] [ref=e56]
            - generic [ref=e57]: High 59%
      - generic [ref=e58]:
        - generic [ref=e59]:
          - generic [ref=e60]:
            - img [ref=e61]
            - heading "Latest reports" [level=2] [ref=e64]
          - button "View all" [ref=e65] [cursor=pointer]
        - button "Brushing Teeth 5/28/2026 +10%" [ref=e67] [cursor=pointer]:
          - img [ref=e69]
          - generic [ref=e72]:
            - paragraph [ref=e73]: Brushing Teeth
            - paragraph [ref=e74]: 5/28/2026
          - generic [ref=e75]:
            - generic [ref=e76]: +10%
            - img [ref=e77]
      - generic [ref=e79]:
        - generic [ref=e80]:
          - generic [ref=e81]:
            - img [ref=e82]
            - heading "Latest notices" [level=2] [ref=e85]
          - button "View more" [ref=e86] [cursor=pointer]
        - generic [ref=e87]:
          - button "Welcome to the New Portal We have updated our system to serve you better. Enjoy the new features!" [ref=e88] [cursor=pointer]:
            - img [ref=e90]
            - generic [ref=e93]:
              - paragraph [ref=e94]: Welcome to the New Portal
              - paragraph [ref=e95]: We have updated our system to serve you better. Enjoy the new features!
            - img [ref=e96]
          - button "Tuition Update Please check your tuition status in the dashboard." [ref=e98] [cursor=pointer]:
            - img [ref=e100]
            - generic [ref=e102]:
              - paragraph [ref=e103]: Tuition Update
              - paragraph [ref=e104]: Please check your tuition status in the dashboard.
            - img [ref=e105]
  - navigation [ref=e107]:
    - button "Graph" [ref=e108] [cursor=pointer]:
      - img [ref=e109]
      - generic [ref=e111]: Graph
    - button "Fees" [ref=e112] [cursor=pointer]:
      - img [ref=e113]
      - generic [ref=e116]: Fees
    - button "Home" [ref=e117] [cursor=pointer]:
      - img [ref=e118]
      - generic [ref=e121]: Home
    - button "Alerts" [ref=e122] [cursor=pointer]:
      - img [ref=e123]
      - generic [ref=e126]: Alerts
    - button "Logout" [ref=e127] [cursor=pointer]:
      - img [ref=e128]
```

# Test source

```ts
  1  |
  2  | import { test, expect } from '@playwright/test';
  3  |
  4  | test.describe('Parent Portal Redesign', () => {
  5  |   test('should verify navigation and dashboard elements', async ({ page }) => {
  6  |     // Set viewport to a common mobile size
  7  |     await page.setViewportSize({ width: 390, height: 844 });
  8  |
  9  |     await page.goto('http://localhost:3000');
  10 |
  11 |     // Landing page - find Access Portal button
  12 |     const accessPortalHero = page.locator('button:has-text("Access Portal")').first();
  13 |     const loginPortalHeader = page.locator('button:has-text("Login Portal")').first();
  14 |
  15 |     if (await accessPortalHero.isVisible()) {
  16 |         await accessPortalHero.click();
  17 |     } else if (await loginPortalHeader.isVisible()) {
  18 |         await loginPortalHeader.click();
  19 |     }
  20 |
  21 |     await page.waitForTimeout(1000);
  22 |
  23 |     // Select PARENT role
  24 |     await page.click('text=PARENT');
  25 |     await page.waitForTimeout(1000);
  26 |
  27 |     // The new LoginPage uses a search input for PARENT role
  28 |     const searchInput = page.locator('input[placeholder="Search database name..."]');
  29 |     await searchInput.fill('Test Parent');
  30 |
  31 |     // Wait for and click the suggestion
  32 |     await page.click('text=Test Parent');
  33 |
  34 |     // Fill password
  35 |     await page.fill('input[type="password"]', '000000');
  36 |
  37 |     await page.click('button:has-text("Login Now")');
  38 |
  39 |     // Wait for Dashboard
  40 |     // Try to find the header by content if the class is not working as expected
> 41 |     await page.waitForSelector('text=Defined Domains', { timeout: 15000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  42 |     await page.screenshot({ path: 'step3_dashboard.png' });
  43 |
  44 |     // Verify Navigation Labels in bottom nav
  45 |     const nav = page.locator('nav');
  46 |     await expect(nav).toContainText('Progress');
  47 |     await expect(nav).toContainText('Fees');
  48 |     await expect(nav).toContainText('Home');
  49 |     await expect(nav).toContainText('Reports');
  50 |
  51 |     // Verify Dashboard Cards
  52 |     await expect(page.locator('text=Tuition Status')).toBeVisible();
  53 |     await expect(page.locator('text=Latest Reports')).toBeVisible();
  54 |     await expect(page.locator('text=Notice Board')).toBeVisible();
  55 |
  56 |     // Go to Progress tab
  57 |     await page.click('button:has-text("Progress")');
  58 |     await expect(page.locator('text=Learning Progress')).toBeVisible();
  59 |     await expect(page.locator('text=See Reports')).toBeVisible();
  60 |     await page.screenshot({ path: 'step4_progress.png' });
  61 |
  62 |     // Go to Reports tab (via nav)
  63 |     await page.click('button:has-text("Reports")');
  64 |     await expect(page.locator('h1:has-text("Report History")')).toBeVisible();
  65 |     await page.screenshot({ path: 'step5_reports.png' });
  66 |
  67 |     // Go to Home and then All Notices
  68 |     await page.click('button:has-text("Home")');
  69 |     await page.click('text=All Notices');
  70 |     await expect(page.locator('h1:has-text("Notices")')).toBeVisible();
  71 |
  72 |     // Check for "NEW" tag in notices list
  73 |     await expect(page.locator('text=NEW').first()).toBeVisible();
  74 |
  75 |     await page.screenshot({ path: 'step6_notices.png' });
  76 |
  77 |     // Verify Logout position in header
  78 |     await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  79 |   });
  80 | });
  81 |
```