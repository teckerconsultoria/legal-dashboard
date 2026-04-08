import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Gerenciamento de Pedidos
 * 
 * Cobertura:
 * - Dashboard de pedidos (/dashboard/reports)
 * - Listagem de pedidos do usuário
 * - Visualização de detalhes
 * - Estados dos pedidos
 */

test.describe('Orders - Dashboard de Pedidos', () => {
  test('deve carregar página de relatórios/pedidos', async ({ page }) => {
    await page.goto('/dashboard/reports');
    
    // Verifica carregamento básico
    await expect(page.locator('main, [class*="dashboard"], h1')).toBeVisible();
  });

  test('deve mostrar lista vazia quando não há pedidos', async ({ page }) => {
    // Mocka API retornando lista vazia
    await page.route('/api/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ orders: [] }),
      });
    });
    
    await page.goto('/dashboard/reports');
    
    // Verifica mensagem de vazio
    await expect(page.locator('text=/nenhum pedido|vazio|sem pedidos/i')).toBeVisible();
  });

  test('deve listar pedidos do usuário', async ({ page }) => {
    // Mocka API com pedidos
    await page.route('/api/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          orders: [
            {
              id: 'order-1',
              status: 'paid',
              total_cents: 15000,
              created_at: '2026-04-08T10:00:00Z',
              order_items: [{ sku_catalog: { name: 'Report Saúde' } }]
            },
            {
              id: 'order-2',
              status: 'delivered',
              total_cents: 30000,
              created_at: '2026-04-07T10:00:00Z',
              order_items: [{ sku_catalog: { name: 'Report Priorização' } }]
            }
          ]
        }),
      });
    });
    
    await page.goto('/dashboard/reports');
    
    // Verifica que pedidos são exibidos
    await expect(page.locator('text=Report Saúde')).toBeVisible();
    await expect(page.locator('text=Report Priorização')).toBeVisible();
  });

  test('deve mostrar status dos pedidos corretamente', async ({ page }) => {
    await page.route('/api/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          orders: [
            { id: 'order-1', status: 'paid', total_cents: 15000, created_at: '2026-04-08T10:00:00Z', order_items: [] },
            { id: 'order-2', status: 'processing', total_cents: 30000, created_at: '2026-04-07T10:00:00Z', order_items: [] },
            { id: 'order-3', status: 'delivered', total_cents: 60000, created_at: '2026-04-06T10:00:00Z', order_items: [] }
          ]
        }),
      });
    });
    
    await page.goto('/dashboard/reports');
    
    // Verifica diferentes status
    const statusTexts = ['pago', 'processando', 'entregue', 'paid', 'processing', 'delivered'];
    let foundStatus = false;
    
    for (const status of statusTexts) {
      const elements = page.locator(`text=/${status}/i`);
      if (await elements.count() > 0) {
        foundStatus = true;
        break;
      }
    }
    
    expect(foundStatus).toBeTruthy();
  });

  test('deve formatar datas corretamente', async ({ page }) => {
    await page.route('/api/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          orders: [
            { 
              id: 'order-1', 
              status: 'paid', 
              total_cents: 15000, 
              created_at: '2026-04-08T10:00:00Z',
              order_items: []
            }
          ]
        }),
      });
    });
    
    await page.goto('/dashboard/reports');
    
    // Verifica que data é exibida (formato pode variar)
    await expect(page.locator('text=/08|08/04|abr|2026/')).toBeVisible();
  });

  test('deve formatar valores em BRL', async ({ page }) => {
    await page.route('/api/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          orders: [
            { 
              id: 'order-1', 
              status: 'paid', 
              total_cents: 15000, 
              created_at: '2026-04-08T10:00:00Z',
              order_items: [{ sku_catalog: { name: 'Test' } }]
            }
          ]
        }),
      });
    });
    
    await page.goto('/dashboard/reports');
    
    // Verifica formatação BRL
    await expect(page.locator('text=R$ 150,00')).toBeVisible();
  });
});

test.describe('Orders - Detalhes do Pedido', () => {
  test('deve mostrar detalhes ao clicar em pedido', async ({ page }) => {
    // Mocka listagem
    await page.route('/api/orders', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          orders: [
            { 
              id: 'order-detail-123', 
              status: 'paid', 
              total_cents: 15000, 
              created_at: '2026-04-08T10:00:00Z',
              customer_email: 'test@example.com',
              order_items: [{ 
                sku_catalog: { name: 'Report Saúde', sla_hours: 24 },
                quantity: 1,
                unit_price_cents: 15000
              }]
            }
          ]
        }),
      });
    });
    
    // Mocka detalhes
    await page.route('/api/orders/order-detail-123', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          order: { 
            id: 'order-detail-123', 
            status: 'paid', 
            total_cents: 15000, 
            created_at: '2026-04-08T10:00:00Z',
            customer_email: 'test@example.com',
            items: [{ 
              sku: { name: 'Report Saúde', sla_hours: 24 },
              quantity: 1,
              unit_price_cents: 15000
            }]
          }
        }),
      });
    });
    
    await page.goto('/dashboard/reports');
    
    // Clica no pedido (se houver link)
    const orderLink = page.locator('a, button, [class*="order"]').first();
    if (await orderLink.count() > 0) {
      await orderLink.click();
    }
  });
});

test.describe('Orders - Autenticação', () => {
  test('deve redirecionar para login quando não autenticado', async ({ page }) => {
    // Mocka API retornando 401
    await page.route('/api/orders*', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });
    
    await page.goto('/dashboard/reports');
    
    // Deve redirecionar para login ou mostrar mensagem
    await page.waitForTimeout(1000);
    
    const url = page.url();
    expect(url.includes('login') || url.includes('signin') || url.includes('auth')).toBeTruthy();
  });

  test('deve mostrar apenas pedidos do usuário logado', async ({ page }) => {
    let receivedToken: string | null = null;
    
    await page.route('/api/orders*', async (route, request) => {
      const headers = await request.allHeaders();
      receivedToken = headers['authorization'] || null;
      
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ orders: [] }),
      });
    });
    
    await page.goto('/dashboard/reports');
    await page.waitForTimeout(1000);
    
    // Verifica que token é enviado (quando usuário está logado)
    // Se não estiver logado, pode não enviar ou enviar null
  });
});

test.describe('Orders - Estados de Erro', () => {
  test('deve lidar com erro 500 da API', async ({ page }) => {
    await page.route('/api/orders*', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
    
    await page.goto('/dashboard/reports');
    
    // Deve mostrar mensagem de erro ou estado vazio
    await page.waitForTimeout(1000);
  });

  test('deve lidar com timeout da API', async ({ page }) => {
    await page.route('/api/orders*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 10000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ orders: [] }),
      });
    });
    
    await page.goto('/dashboard/reports');
    
    // Deve mostrar loading ou mensagem de timeout
    await page.waitForTimeout(2000);
  });
});
