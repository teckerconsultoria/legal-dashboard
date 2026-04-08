import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { OrderStatus } from '@/types/orders';



async function transitionOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  metadata?: Record<string, string>
) {
  const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    created: ['payment_pending', 'cancelled'],
    payment_pending: ['paid', 'cancelled'],
    paid: ['processing'],
    processing: ['delivered', 'failed'],
    delivered: [],
    failed: [],
    cancelled: [],
  };

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, user_id')
    .eq('id', orderId)
    .single();

  if (!order) return { success: false, error: 'Order not found' };

  const currentStatus = order.status as OrderStatus;
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(newStatus)) {
    return { success: false, error: `Invalid transition from ${currentStatus} to ${newStatus}` };
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'paid' && metadata?.payment_intent_id) {
    updateData.stripe_payment_intent_id = metadata.payment_intent_id;
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
    details: JSON.stringify({ from: currentStatus, to: newStatus, metadata, source: 'stripe_webhook' }),
  });

  return { success: true };
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (orderId) {
          await transitionOrderStatus(orderId, 'paid', {
            payment_intent_id: session.payment_intent as string,
            stripe_session_id: session.id,
          });
          console.log(`Order ${orderId} status changed to paid`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (orderId) {
          await transitionOrderStatus(orderId, 'cancelled', {
            stripe_session_id: session.id,
            reason: 'expired',
          });
          console.log(`Order ${orderId} status changed to cancelled (expired)`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}