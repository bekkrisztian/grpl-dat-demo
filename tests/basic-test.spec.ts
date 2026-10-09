import { expect, test } from '@playwright/test';

const vehicle = {
  fza: 1,
  hst: 130,
  otg: '3',
  ht: 42,
  ut: 7,
  dateCode: '011300420070001',
  fzab: 'Pkw, SUV, Kleintransporter',
  hstb: 'BMW',
  otgb: '3',
  htb: '3er (G20)',
  utb: '320d xDrive',
  avMoB: 'Diesel engine',
  kw: '140',
};

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:3333/**', async (route) => {
    const url = new URL(route.request().url());
    const json = (value: unknown) => route.fulfill({ json: value });

    if (url.pathname === '/datecode2s/count') return json({ count: 1 });
    if (url.pathname === '/datecode2s') {
      const filter = url.searchParams.get('filter') || '';
      const parsedFilter = JSON.parse(filter);
      if (parsedFilter.limit === 1) {
        const fza = parsedFilter.where.fza;
        return json([{ fza, fzab: ['Cars', 'Vans', 'Motorcycles', 'Trucks', 'Buses'][fza - 1] }]);
      }
      return json([vehicle]);
    }
    if (url.pathname === '/brands') return json([{ HST: '130', HSTB: 'BMW' }]);
    if (url.pathname === '/modelRanges') return json([{ OTG: '3', OTGB: '3' }]);
    if (url.pathname === '/modelGroups') return json([{ HT: '42', HTB: '3er (G20)' }]);
    if (url.pathname === '/models') return json([{ UT: '7', UTB: '320d xDrive' }]);
    if (url.pathname === '/dsearchtrees/datecode2s/fuzzy/BMW%20diesel%20automatic') return json([vehicle]);
    if (url.pathname === '/brandsByVehicleType') return json([{ FZA: '1', HST: '130', HSTB: 'BMW' }]);
    if (url.pathname === '/modelRangeByVehicleTypeAndManufacturer') return json([{ OTG: '3', OTGB: '3' }]);
    if (url.pathname === '/modelGroupByVehicleTypeAndManufacturerAndModelRange') return json([{ HT: '42', HTB: '3er (G20)' }]);
    if (url.pathname === '/modelByVehicleTypeAndManufacturerAndModelGroup') return json([{ UT: '7', UTB: '320d xDrive' }]);
    return route.fulfill({ status: 404, json: { error: { message: 'Not mocked' } } });
  });
});

test('loads the structured search tree and lists vehicles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Vehicle search' })).toBeVisible();

  await page.locator('#tree-fza').selectOption('1');
  await page.locator('#tree-hst').selectOption('130');
  await page.locator('#tree-otg').selectOption('3');
  await page.locator('#tree-ht').selectOption('42');
  await page.locator('#tree-ut').selectOption('7');
  await page.getByRole('button', { name: 'Show vehicles' }).click();

  await expect(page.getByRole('cell', { name: 'BMW' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '320d xDrive' })).toBeVisible();
});

test('runs fuzzy text search with optional criteria', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Fuzzy search' }).click();
  await page.locator('#fuzzy-text').fill('BMW diesel automatic');
  await page.locator('#fuzzy-hst').fill('BMW');
  await page.getByRole('option', { name: 'BMW (130)' }).click();
  await page.getByRole('button', { name: 'Find vehicles' }).click();

  await expect(page.getByRole('cell', { name: 'BMW' })).toBeVisible();
  await expect(page.getByText('1 vehicle', { exact: false })).toBeVisible();
});

test('resets the dependent selects to their placeholder', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tree-fza').selectOption('1');
  await expect(page.locator('#tree-hst')).toBeEnabled();
  await page.locator('#tree-hst').selectOption('130');
  await expect(page.locator('#tree-otg')).toBeEnabled();
  await page.locator('#tree-otg').selectOption('3');

  await page.locator('#tree-fza').selectOption('2');

  for (const id of ['#tree-hst', '#tree-otg', '#tree-ht', '#tree-ut']) {
    await expect(page.locator(id)).toHaveValue('');
    // A select holding a value none of its options offer renders blank, which
    // is the regression: the placeholder has to be the selected option.
    await expect(page.locator(`${id} option:checked`)).toHaveCount(1);
  }
});

test('drops the pager when the criteria change', async ({ page }) => {
  // Enough matches for a second page, so the pager is there to disappear.
  await page.route('**/datecode2s/count*', (route) => route.fulfill({ json: { count: 7664 } }));
  await page.goto('/');
  await page.locator('#tree-fza').selectOption('1');
  await page.getByRole('button', { name: 'Show vehicles' }).click();
  await expect(page.getByRole('cell', { name: 'BMW' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Result pages' })).toBeVisible();

  // Changing a criterion clears the rows; a pager offering pages for a search
  // that no longer exists is the regression.
  await page.locator('#tree-fza').selectOption('2');
  await expect(page.getByRole('cell', { name: 'BMW' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Result pages' })).toHaveCount(0);
});
