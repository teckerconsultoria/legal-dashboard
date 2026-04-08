const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  console.log('1. Opening page...');
  await page.goto('http://localhost:3000');
  
  console.log('2. Checking form...');
  const title = await page.textContent('h2');
  console.log('   Title:', title);
  
  console.log('3. Selecting state...');
  await page.selectOption('select', 'SP');
  
  console.log('4. Entering OAB number...');
  await page.fill('input[placeholder="123456"]', '123456');
  
  console.log('5. Checking button state...');
  const button = page.locator('button:has-text("Visualizar Carteira")');
  const isEnabled = await button.isEnabled();
  console.log('   Button enabled:', isEnabled);
  
  console.log('   Estado value:', await page.locator('select').inputValue());
  console.log('   Número value:', await page.locator('input[placeholder="123456"]').inputValue());
  
  await button.click();
  
  console.log('6. Waiting for results...');
  await page.waitForTimeout(2000);
  
  const content = await page.content();
  if (content.includes('Total de Processos')) {
    console.log('✅ SUCCESS - KPIs displayed!');
  } else {
    console.log('❌ FAILURE - KPIs not found');
  }
  
  await browser.close();
})();