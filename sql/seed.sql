INSERT INTO categories (name, description, report_count, display_order)
VALUES
  ('Electronics', 'Consumer tech and accessories', 5, 1),
  ('Home & Kitchen', 'Appliances and cookware', 3, 2),
  ('Outdoor & Sports', 'Outdoor gear and fitness equipment', 4, 3),
  ('Wellness', 'Health and wellness devices', 2, 4)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  report_count = VALUES(report_count),
  display_order = VALUES(display_order);

INSERT INTO reports (category_id, name, report_number, description, status, version)
SELECT c.id,
       data.name,
       data.report_number,
       data.description,
       data.status,
       data.version
FROM (
  SELECT 'Electronics' AS category_name, 'Monthly Product Performance' AS name, 'RPT-1001' AS report_number,
         'Revenue, margin, and inventory balance for top SKUs.' AS description, 'active' AS status, 3 AS version
  UNION ALL
  SELECT 'Electronics', 'Top Selling SKUs', 'RPT-1002', 'Fastest moving products by net revenue.', 'active', 2
  UNION ALL
  SELECT 'Electronics', 'Warranty Claim Overview', 'RPT-1003', 'Open warranty claims by product family.', 'draft', 1
  UNION ALL
  SELECT 'Home & Kitchen', 'Inventory Reorder Alert', 'RPT-2101', 'Items below reorder threshold and supplier SLA.', 'active', 1
  UNION ALL
  SELECT 'Outdoor & Sports', 'Order Fulfillment SLA Monitor', 'RPT-3201', 'Fulfillment time and delivery status trends.', 'active', 1
  UNION ALL
  SELECT 'Wellness', 'Customer Purchase Trends', 'RPT-4201', 'Repeat purchase frequency and subscription renewals.', 'active', 2
) AS data
JOIN categories c ON c.name = data.category_name
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  status = VALUES(status),
  version = VALUES(version);

INSERT INTO products (
  category_id,
  sku,
  name,
  description,
  unit_price,
  cost_price,
  stock_quantity,
  reorder_level,
  is_active
)
SELECT c.id,
       data.sku,
       data.name,
       data.description,
       data.unit_price,
       data.cost_price,
       data.stock_quantity,
       data.reorder_level,
       data.is_active
FROM (
  SELECT 'Electronics' AS category_name, 'EL-1001' AS sku, 'Noise Cancelling Headphones' AS name,
         'Bluetooth over-ear headphones with adaptive noise control.' AS description,
         189.99 AS unit_price, 110.00 AS cost_price, 52 AS stock_quantity, 15 AS reorder_level, 1 AS is_active
  UNION ALL
  SELECT 'Electronics', 'EL-1002', '4K Action Camera',
         'Waterproof action camera with image stabilization.',
         249.50, 150.00, 34, 10, 1
  UNION ALL
  SELECT 'Home & Kitchen', 'HK-2001', 'Smart Air Fryer',
         '6-quart smart air fryer with app-controlled presets.',
         129.00, 78.00, 25, 8, 1
  UNION ALL
  SELECT 'Home & Kitchen', 'HK-2002', 'Self-Cleaning Blender',
         'High-speed blender with self-cleaning cycle.',
         98.75, 55.00, 42, 12, 1
  UNION ALL
  SELECT 'Outdoor & Sports', 'OS-3001', 'Carbon Trekking Poles',
         'Ultralight trekking poles with quick-lock adjustment.',
         149.00, 90.00, 18, 6, 1
  UNION ALL
  SELECT 'Outdoor & Sports', 'OS-3002', 'Waterproof Trail Jacket',
         'Breathable waterproof shell for trail runs.',
         179.95, 105.00, 21, 5, 1
  UNION ALL
  SELECT 'Wellness', 'WL-4001', 'Smart Body Scale',
         'Wi-Fi body composition scale with mobile insights.',
         79.99, 45.00, 30, 10, 1
  UNION ALL
  SELECT 'Wellness', 'WL-4002', 'Sleep Tracking Ring',
         'Titanium sleep and readiness monitor.',
         219.00, 140.00, 16, 4, 1
) AS data
JOIN categories c ON c.name = data.category_name
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  unit_price = VALUES(unit_price),
  cost_price = VALUES(cost_price),
  stock_quantity = VALUES(stock_quantity),
  reorder_level = VALUES(reorder_level),
  is_active = VALUES(is_active);

INSERT INTO orders (
  order_number,
  customer_name,
  customer_email,
  order_date,
  status,
  payment_method,
  total_amount,
  tax_amount,
  shipping_cost
)
VALUES
  ('ORD-2024-001', 'Amelia Rodriguez', 'amelia.rodriguez@example.com', '2024-05-02', 'delivered', 'credit_card', 533.20, 34.23, 9.99),
  ('ORD-2024-002', 'Jordan Patel', 'jordan.patel@example.com', '2024-05-05', 'processing', 'paypal', 431.87, 28.42, 14.50),
  ('ORD-2024-003', 'Priya Desai', 'priya.desai@example.com', '2024-05-06', 'shipped', 'credit_card', 1127.71, 72.21, 24.00),
  ('ORD-2024-004', 'Marcus Chen', 'marcus.chen@example.com', '2024-05-08', 'pending', 'bank_transfer', 447.18, 28.47, 12.00),
  ('ORD-2024-005', 'Olivia Bennett', 'olivia.bennett@example.com', '2024-05-10', 'delivered', 'credit_card', 1521.24, 98.34, 18.00)
ON DUPLICATE KEY UPDATE
  customer_name = VALUES(customer_name),
  customer_email = VALUES(customer_email),
  order_date = VALUES(order_date),
  status = VALUES(status),
  payment_method = VALUES(payment_method),
  total_amount = VALUES(total_amount),
  tax_amount = VALUES(tax_amount),
  shipping_cost = VALUES(shipping_cost);

INSERT INTO order_items (
  order_id,
  product_id,
  quantity,
  unit_price,
  discount_amount
)
SELECT o.id,
       p.id,
       data.quantity,
       data.unit_price,
       data.discount_amount
FROM (
  SELECT 'ORD-2024-001' AS order_number, 'EL-1001' AS sku, 2 AS quantity, 189.99 AS unit_price, 20.00 AS discount_amount
  UNION ALL
  SELECT 'ORD-2024-001', 'HK-2001', 1, 129.00, 0.00
  UNION ALL
  SELECT 'ORD-2024-002', 'WL-4002', 1, 219.00, 0.00
  UNION ALL
  SELECT 'ORD-2024-002', 'OS-3002', 1, 179.95, 10.00
  UNION ALL
  SELECT 'ORD-2024-003', 'EL-1002', 3, 249.50, 0.00
  UNION ALL
  SELECT 'ORD-2024-003', 'OS-3001', 2, 149.00, 15.00
  UNION ALL
  SELECT 'ORD-2024-004', 'HK-2002', 1, 98.75, 0.00
  UNION ALL
  SELECT 'ORD-2024-004', 'WL-4001', 4, 79.99, 12.00
  UNION ALL
  SELECT 'ORD-2024-005', 'WL-4002', 5, 219.00, 50.00
  UNION ALL
  SELECT 'ORD-2024-005', 'OS-3002', 2, 179.95, 0.00
) AS data
JOIN orders o ON o.order_number = data.order_number
JOIN products p ON p.sku = data.sku
ON DUPLICATE KEY UPDATE
  quantity = VALUES(quantity),
  unit_price = VALUES(unit_price),
  discount_amount = VALUES(discount_amount);

INSERT INTO data_sources (name, display_name, description)
VALUES
  ('product_inventory', 'Product Inventory', 'Inventory levels and gross margin insights'),
  ('customer_orders', 'Customer Orders', 'Order header metrics and payment information'),
  ('order_items_view', 'Order Line Items', 'Granular line items with product attribution')
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  description = VALUES(description);

INSERT INTO data_fields (data_source_id, field_name, field_label, field_type, is_numeric)
SELECT ds.id, data.field_name, data.field_label, data.field_type, data.is_numeric
FROM (
  SELECT 'product_inventory' AS source_name, 'sku' AS field_name, 'SKU' AS field_label, 'string' AS field_type, 0 AS is_numeric
  UNION ALL
  SELECT 'product_inventory', 'product_name', 'Product Name', 'string', 0
  UNION ALL
  SELECT 'product_inventory', 'category', 'Category', 'string', 0
  UNION ALL
  SELECT 'product_inventory', 'unit_price', 'Unit Price', 'decimal', 1
  UNION ALL
  SELECT 'product_inventory', 'cost_price', 'Cost Price', 'decimal', 1
  UNION ALL
  SELECT 'product_inventory', 'stock_quantity', 'On Hand', 'integer', 1
  UNION ALL
  SELECT 'product_inventory', 'reorder_level', 'Reorder Level', 'integer', 1
  UNION ALL
  SELECT 'product_inventory', 'gross_margin', 'Gross Margin %', 'decimal', 1
  UNION ALL
  SELECT 'customer_orders', 'order_number', 'Order Number', 'string', 0
  UNION ALL
  SELECT 'customer_orders', 'order_date', 'Order Date', 'date', 0
  UNION ALL
  SELECT 'customer_orders', 'status', 'Status', 'string', 0
  UNION ALL
  SELECT 'customer_orders', 'payment_method', 'Payment Method', 'string', 0
  UNION ALL
  SELECT 'customer_orders', 'customer_name', 'Customer Name', 'string', 0
  UNION ALL
  SELECT 'customer_orders', 'customer_email', 'Customer Email', 'string', 0
  UNION ALL
  SELECT 'customer_orders', 'total_amount', 'Total Amount', 'decimal', 1
  UNION ALL
  SELECT 'customer_orders', 'tax_amount', 'Tax Amount', 'decimal', 1
  UNION ALL
  SELECT 'customer_orders', 'shipping_cost', 'Shipping Cost', 'decimal', 1
  UNION ALL
  SELECT 'order_items_view', 'order_number', 'Order Number', 'string', 0
  UNION ALL
  SELECT 'order_items_view', 'sku', 'SKU', 'string', 0
  UNION ALL
  SELECT 'order_items_view', 'product_name', 'Product Name', 'string', 0
  UNION ALL
  SELECT 'order_items_view', 'quantity', 'Quantity', 'integer', 1
  UNION ALL
  SELECT 'order_items_view', 'unit_price', 'Unit Price', 'decimal', 1
  UNION ALL
  SELECT 'order_items_view', 'discount_amount', 'Discount Amount', 'decimal', 1
  UNION ALL
  SELECT 'order_items_view', 'line_total', 'Line Total', 'decimal', 1
  UNION ALL
  SELECT 'order_items_view', 'category', 'Category', 'string', 0
  UNION ALL
  SELECT 'order_items_view', 'order_date', 'Order Date', 'date', 0
) AS data
JOIN data_sources ds ON ds.name = data.source_name
ON DUPLICATE KEY UPDATE
  field_label = VALUES(field_label),
  field_type = VALUES(field_type),
  is_numeric = VALUES(is_numeric);

INSERT INTO report_configurations (
  report_id,
  data_source,
  selected_fields,
  print_order_fields,
  summary_fields,
  filter_conditions,
  aggregate_filters,
  sort_fields,
  sort_orders,
  joined_available_fields,
  joined_print_order_fields
)
SELECT
  r.id,
  'customer_orders',
  JSON_ARRAY('order_number', 'order_date', 'status', 'total_amount', 'tax_amount', 'shipping_cost'),
  JSON_ARRAY('customer_name', 'order_number', 'order_date'),
  JSON_ARRAY('total_amount', 'tax_amount', 'shipping_cost'),
  JSON_ARRAY(
    JSON_OBJECT('field', 'status', 'operator', 'equal to', 'value', 'delivered')
  ),
  JSON_ARRAY(
    JSON_OBJECT('field', 'total_amount', 'operator', 'greater than', 'value', '500')
  ),
  JSON_ARRAY('order_date', 'total_amount'),
  JSON_ARRAY('Descending', 'Descending'),
  JSON_ARRAY('product_name', 'sku', 'quantity', 'line_total', 'category'),
  JSON_ARRAY('product_name', 'quantity', 'line_total')
FROM reports r
JOIN categories c ON c.id = r.category_id
WHERE r.report_number = 'RPT-1001'
ON DUPLICATE KEY UPDATE
  selected_fields = VALUES(selected_fields),
  print_order_fields = VALUES(print_order_fields),
  summary_fields = VALUES(summary_fields),
  filter_conditions = VALUES(filter_conditions),
  aggregate_filters = VALUES(aggregate_filters),
  sort_fields = VALUES(sort_fields),
  sort_orders = VALUES(sort_orders),
  joined_available_fields = VALUES(joined_available_fields),
  joined_print_order_fields = VALUES(joined_print_order_fields);
