import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data: skus, error } = await supabase
      .from('sku_catalog')
      .select('id, name, description, price_cents, sla_hours, features, highlights')
      .eq('is_active', true)
      .order('price_cents', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ skus: skus || [] });
  } catch (error) {
    console.error('[skus]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
