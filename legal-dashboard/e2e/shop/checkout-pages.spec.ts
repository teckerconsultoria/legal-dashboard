import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Páginas de Retorno do Checkout
 * 
 * Cobertura:
 * - Página de sucesso (/checkout/success)
 * - Página de cancelamento (/checkout/cancel)
 * - Integração com Supabase para buscar pedido
 * - Estados de erro e loading
 */

test.describe('Checkout - Página de Sucesso', () => {
  test('deve mostrar página de sucesso com session_id', async ({ page }) => {
    await page.goto('/checkout/success?session_id=cs_test_123');
    
    // Verifica elementos principais
    await expect(page.locator('text=Pagamento Confirmado!')).toBeVisible();
    await expect(page.locator('text=Obrigado pela sua compra')).toBeVisible();
  });

  test('deve mostrar detalhes do pedido quando encontrado', async ({ page }) => {
    // Mocka API de orders para retornar pedido
    await page.route('/api/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          order: {
            id: 'order-test-123',
            total_cents: 15000,
            order_items: [
              { sku_catalog: { name: 'Report Saúde' } }
            ]
          }
        }),
      });
    });
    
    await page.goto('/checkout/success?session_id=cs_test_123');
    
    // Verifica detalhes exibidos
    await expect(page.locator('text=Report Saúde')).toBeVisible();
    await expect(page.locator('text=R$ 150,00')).toBeVisible();
  });

  test('deve ter link para dashboard de pedidos', async ({ page }) => {
    await page.goto('/checkout/success?session_id=cs_test_123');
    
    const dashboardLink = page.locator('a:has-text("Ver Meus Pedidos")');
    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toHaveAttribute('href', '/dashboard/reports');
  });

  test('deve ter link para voltar ao início', async ({ page }) => {
    await page.goto('/checkout/success?session_id=cs_test_123');
    
    const homeLink = page.locator('a:has-text("Voltar ao Início")');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute('href', '/');
  });

  test('deve redirecionar para home sem session_id', async ({ page }) => {
    await page.goto('/checkout/success');
    
    // Aguarda redirecionamento
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');
  });

  test('deve mostrar mensagem quando pedido não é encontrado', async ({ page }) => {
    // Mocka API retornando erro
    await page.route('/api/orders*', async (route) => {
      await route.fulfill({
        status: 404,
        body: JSON.stringify({ error: 'Order not found' }),
      });
    });
    
    await page.goto('/checkout/success?session_id=cs_test_invalid');
    
    // Página deve mostrar sucesso mesmo sem pedido (graceful degradation)
    await expect(page.locator('text=Pagamento Confirmado!')).toBeVisible();
  });

  test('deve mostrar ícone de sucesso', async ({ page }) => {
    await page.goto('/checkout/success?session_id=cs_test_123');
    
    // Verifica ícone de check (SVG com cor verde)
    const successIcon = page.locator('svg[class*="text-green"], [class*="bg-green"]');
    await expect(successIcon.first()).toBeVisible();
  });

  test('deve formatar valor total corretamente', async ({ page }) => {
    await page.route('/api/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          order: {
            id: 'order-test',
            total_cents: 9999,
            order_items: [{ sku_catalog: { name: 'Test' } }]
          }
        }),
      });
    });
    
    await page.goto('/checkout/success?session_id=cs_test_123');
    
    // Verifica formatação BRL (R$ 99,99)
    await expect(page.locator('text=R$ 99,99')).toBeVisible();
  });
});

test.describe('Checkout - Página de Cancelamento', () => {
  test('deve mostrar página de cancelamento com session_id', async ({ page }) => {
    await page.goto('/checkout/cancel?session_id=cs_test_cancel_123');
    
    // Verifica elementos principais
    await expect(page.locator('text=Pagamento Cancelado')).toBeVisible();
    await expect(page.locator('text=não foi concluído')).toBeVisible();
  });

  test('deve mostrar número da sessão truncado', async ({ page }) => {
    await page.goto('/checkout/cancel?session_id=cs_test_cancel_123456789');
    
    // Verifica que mostra parte do session_id
    await expect(page.locator('text=Sessão:')).toBeVisible();
    await expect(page.locator('text=cs_test_cancel')).toBeVisible();
  });

  test('deve mostrar página mesmo sem session_id', async ({ page }) => {
    await page.goto('/checkout/cancel');
    
    // Página deve funcionar mesmo sem parâmetros
    await expect(page.locator('text=Pagamento Cancelado')).toBeVisible();
  });

  test('deve ter link para escolher outro serviço', async ({ page }) => {
    await page.goto('/checkout/cancel?session_id=cs_test_cancel_123');
    
    const shopLink = page.locator('a:has-text("Escolher Outro Serviço")');
    await expect(shopLink).toBeVisible();
    await expect(shopLink).toHaveAttribute('href', '/');
  });

  test('deve ter link para dashboard de pedidos', async ({ page }) => {
    await page.goto('/checkout/cancel?session_id=cs_test_cancel_123');
    
    const dashboardLink = page.locator('a:has-text("Ver Meus Pedidos")');
    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toHaveAttribute('href', '/dashboard/reports');
  });

  test('deve mostrar ícone de alerta', async ({ page }) => {
    await page.goto('/checkout/cancel?session_id=cs_test_cancel_123');
    
    // Verifica ícone de alerta (SVG com cor amarela)
    const warningIcon = page.locator('svg[class*="text-yellow"], [class*="bg-yellow"]');
    await expect(warningIcon.first()).toBeVisible();
  });
});

test.describe('Checkout - Páginas Responsivas', () => {
  test('página de sucesso em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/checkout/success?session_id=cs_test_123');
    
    await expect(page.locator('text=Pagamento Confirmado!')).toBeVisible();
  });

  test('página de cancelamento em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/checkout/cancel?session_id=cs_test_cancel_123');
    
    await expect(page.locator('text=Pagamento Cancelado')).toBeVisible();
  });
});

test.describe('Checkout - SEO e Meta', () => {
  test('página de sucesso deve ter título adequado', async ({ page }) => {
    await page.goto('/checkout/success?session_id=cs_test_123');
    
    // Verifica título da página
    await expect(page).toHaveTitle(/Sucesso|Confirmado/i);
  });

  test('página de cancelamento deve ter título adequado', async ({ page }) => {
    await page.goto('/checkout/cancel?session_id=cs_test_cancel_123');
    
    // Verifica título da página
    await expect(page).toHaveTitle(/Cancelado/i);
  });
});
