import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';
import { CreateOrderRequest, CreateOrderResponse, OrderStatus } from '@/types/orders';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['payment_pending', 'cancelled'],
  payment_pending: ['paid', 'cancelled'],
  paid: ['processing'],
  processing: ['delivered', 'failed'],
  delivered: [],
  failed: [],
  cancelled: [],
};

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let userId: string | null = null;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    if (orderId) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (order.user_id && userId && order.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      const { data: skus } = await supabase
        .from('sku_catalog')
        .select('*');

      const itemsWithSku = items?.map(item => ({
        ...item,
        sku: skus?.find(s => s.id === item.sku_id)
      })) || [];

      return NextResponse.json({ order: { ...order, items: itemsWithSku } });
    }

    let query = supabase
      .from('orders')
      .select('*, order_items(*, sku_catalog(*))')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data: orders, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body: CreateOrderRequest = await request.json();
    const { sku_ids, customer_email } = body;

    if (!sku_ids || !sku_ids.length) {
      return NextResponse.json({ error: 'sku_ids required' }, { status: 400 });
    }

    const { data: skus, error: skuError } = await supabase
      .from('sku_catalog')
      .select('*')
      .in('id', sku_ids)
      .eq('is_active', true);

    if (skuError || !skus?.length) {
      return NextResponse.json({ error: 'Invalid SKUs' }, { status: 400 });
    }

    const totalCents = skus.reduce((sum, sku) => sum + sku.price_cents, 0);

    const authHeader2 = request.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader2) {
      const token = authHeader2.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: 'created',
        total_cents: totalCents,
        customer_email: customer_email || null,
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const orderItems = skus.map(sku => ({
      order_id: order.id,
      sku_id: sku.id,
      quantity: 1,
      unit_price_cents: sku.price_cents,
      subtotal_cents: sku.price_cents,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Items error:', itemsError);
    }

    const response: CreateOrderResponse = {
      order_id: order.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
