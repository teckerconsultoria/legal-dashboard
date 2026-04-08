import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

async function getOrders() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, sku_catalog(*))')
    .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
    .order('created_at', { ascending: false });

  return orders || [];
}

const statusLabels: Record<string, string> = {
  created: 'Criado',
  payment_pending: 'Aguardando Pagamento',
  paid: 'Pago',
  processing: 'Em Processamento',
  delivered: 'Entregue',
  failed: 'Falhou',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  created: 'bg-gray-100 text-gray-800',
  payment_pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default async function DashboardReportsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const orders = await getOrders();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Meus Relatórios</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-4">Você ainda não tem nenhum relatório.</p>
              <a
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Ver Serviços Disponíveis
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: { id: string; status: string; total_cents: number; created_at: string; order_items: Array<{ sku_catalog: { name: string; sla_hours: number } | null }> }) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow p-6 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-gray-500">
                      Pedido #{order.id.slice(0, 8)}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">
                      {order.order_items?.map((item) => item.sku_catalog?.name).join(', ')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Solicitado em {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      R$ {(order.total_cents / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}