import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sku_id, user_id, user_email } = body;

    if (!sku_id) {
      return NextResponse.json({ error: 'sku_id required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: sku, error: skuError } = await supabase
      .from('sku_catalog')
      .select('id, name, description, price_cents, sla_hours')
      .eq('id', sku_id)
      .eq('is_active', true)
      .single();

    if (skuError || !sku) {
      return NextResponse.json({ error: 'SKU not found' }, { status: 404 });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user_id || null,
        status: 'created',
        total_cents: sku.price_cents,
        customer_email: user_email || null,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    await supabase.from('order_items').insert({
      order_id: order.id,
      sku_id,
      quantity: 1,
      unit_price_cents: sku.price_cents,
      subtotal_cents: sku.price_cents,
    });

    const host = request.headers.get('host') || request.nextUrl.host;
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: sku.name,
              description: `SLA: ${sku.sla_hours}h`,
            },
            unit_amount: sku.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        order_id: order.id,
        customer_email: user_email || '',
      },
    });

    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id, status: 'payment_pending' })
      .eq('id', order.id);

    return NextResponse.json({ checkout_url: session.url, order_id: order.id });
  } catch (error) {
    console.error('[checkout]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
