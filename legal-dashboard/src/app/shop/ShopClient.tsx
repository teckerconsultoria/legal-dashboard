'use client';

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SKU {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  sla_hours: number;
  highlights: string[];
}

export default function ShopClient({ skus }: { skus: SKU[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const handleBuy = async (skuId: string) => {
    setLoading(skuId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku_id: skuId,
          user_id: user?.id || null,
          user_email: user?.email || null,
        }),
      });

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        console.error('Checkout error:', data.error);
        setLoading(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {skus.map((sku) => (
        <div key={sku.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{sku.name}</h2>
            <p className="text-gray-600 mb-4">{sku.description}</p>
            
            <div className="mb-6">
              <span className="text-3xl font-bold text-blue-600">{formatCurrency(sku.price_cents)}</span>
              <span className="text-gray-500 ml-2">/ pedido</span>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Inclui:</p>
              <ul className="space-y-2">
                {sku.highlights?.map((highlight, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleBuy(sku.id)}
              disabled={loading === sku.id}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading === sku.id ? 'Processando...' : 'Comprar Agora'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
