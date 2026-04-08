import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect('/');
  }

  const supabase = createClient();
  
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*, sku_catalog(*))')
    .eq('stripe_session_id', session_id)
    .single();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h1>
        <p className="text-gray-600 mb-6">
          Obrigado pela sua compra. Seu pedido foi recebido e está sendo processado.
        </p>

        {order && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-2">Pedido #{order.id.slice(0, 8)}</p>
            <p className="font-semibold text-gray-900">
              {order.order_items?.map((item: { sku_catalog: { name: string } }) => item.sku_catalog?.name).join(', ')}
            </p>
            <p className="text-lg font-bold text-green-600 mt-2">
              R$ {(order.total_cents / 100).toFixed(2)}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <a
            href="/dashboard/reports"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Ver Meus Pedidos
          </a>
          <a
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Voltar ao Início
          </a>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Você receberá um e-mail quando seu relatório estiver pronto.
        </p>
      </div>
    </div>
  );
}