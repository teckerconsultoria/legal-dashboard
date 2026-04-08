import { redirect } from 'next/navigation';

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Cancelado</h1>
        <p className="text-gray-600 mb-6">
          O pagamento não foi concluído. Você pode tentar novamente quando quiser.
        </p>

        {session_id && (
          <p className="text-sm text-gray-500 mb-6">
            Sessão: {session_id.slice(0, 12)}...
          </p>
        )}

        <div className="space-y-3">
          <a
            href="/"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Escolher Outro Serviço
          </a>
          <a
            href="/dashboard/reports"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Ver Meus Pedidos
          </a>
        </div>
      </div>
    </div>
  );
}