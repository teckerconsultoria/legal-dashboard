import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OrderStatus, TransitionResult } from '@/types/orders';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['payment_pending', 'cancelled'],
  payment_pending: ['paid', 'cancelled'],
  paid: ['processing'],
  processing: ['delivered', 'failed'],
  delivered: [],
  failed: [],
  cancelled: [],
};

async function transitionOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  metadata?: Record<string, string>
): Promise<TransitionResult> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return { success: false, error: 'Order not found' };
  }

  const currentStatus = order.status as OrderStatus;
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(newStatus)) {
    return { 
      success: false, 
      error: `Invalid transition from ${currentStatus} to ${newStatus}` 
    };
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'paid' && metadata?.stripe_payment_intent_id) {
    updateData.stripe_payment_intent_id = metadata.stripe_payment_intent_id;
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from('audit_logs').insert({
    user_id: order.user_id,
    action: 'order_status_change',
    resource: 'orders',
    resource_id: orderId,
    details: JSON.stringify({
      from: currentStatus,
      to: newStatus,
      metadata,
    }),
  });

  return { success: true };
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { status, metadata } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 });
    }

    const result = await transitionOrderStatus(orderId, status as OrderStatus, metadata);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Order status transition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, success_url, cancel_url } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'order_id required' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*, sku_catalog(*))')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.order_items || order.order_items.length === 0) {
      return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
    }

    await transitionOrderStatus(order_id, 'payment_pending');

    const lineItems = order.order_items.map((item: { sku_catalog: { name: string; sla_hours: number } | null; unit_price_cents: number }) => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.sku_catalog?.name || 'Report',
          description: ` SLA: ${item.sku_catalog?.sla_hours || 24}h`,
        },
        unit_amount: item.unit_price_cents,
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['pix', 'card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: success_url || `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${request.nextUrl.origin}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        order_id,
        customer_email: order.customer_email || '',
      },
    });

    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order_id);

    return NextResponse.json({
      session_id: session.id,
      checkout_url: session.url,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
