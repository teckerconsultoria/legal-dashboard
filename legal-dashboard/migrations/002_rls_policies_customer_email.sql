-- Re-enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop previous policies if they exist to start fresh
DROP POLICY IF EXISTS "orders_own_read" ON orders;
DROP POLICY IF EXISTS "orders_own_insert" ON orders;
DROP POLICY IF EXISTS "orders_service_role" ON orders;
DROP POLICY IF EXISTS "order_items_own_read" ON order_items;
DROP POLICY IF EXISTS "order_items_service_role" ON order_items;

-- Policy: users can read their own orders (by user_id OR email)
CREATE POLICY "orders_own_read" ON orders
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    (auth.jwt() ->> 'email') = customer_email
  );

-- Policy: users can insert their own orders
CREATE POLICY "orders_own_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: service role can do everything
CREATE POLICY "orders_service_role" ON orders
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: read order items if order is accessible
CREATE POLICY "order_items_own_read" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE auth.uid() = user_id 
      OR (auth.jwt() ->> 'email') = customer_email
    )
  );

-- Policy: service role can do everything
CREATE POLICY "order_items_service_role" ON order_items
  FOR ALL USING (auth.role() = 'service_role');