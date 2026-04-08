export type OrderStatus = 
  | 'created'
  | 'payment_pending'
  | 'paid'
  | 'processing'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total_cents: number;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  customer_email: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  sku_id: string;
  quantity: number;
  unit_price_cents: number;
  subtotal_cents: number;
  sku?: SKU;
}

export interface SKU {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  sla_hours: number;
  is_active: boolean;
  features: string[];
  highlights: string[];
  created_at: string;
  updated_at: string;
}

export type CreateOrderRequest = {
  sku_ids: string[];
  customer_email: string;
};

export type CreateOrderResponse = {
  order_id: string;
  checkout_url?: string;
};

export type TransitionResult = {
  success: boolean;
  error?: string;
};
