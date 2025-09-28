-- Seed initial data for Data Center Management Application
-- This creates sample data for testing and demonstration

-- Insert asset categories
INSERT INTO public.asset_categories (name, description) VALUES
  ('Server', 'Physical and virtual servers'),
  ('Network Equipment', 'Switches, routers, firewalls'),
  ('Storage', 'SAN, NAS, and storage arrays'),
  ('Power Equipment', 'UPS, PDUs, power distribution'),
  ('Cooling Equipment', 'CRAC units, cooling systems'),
  ('Security Equipment', 'Cameras, access control systems')
ON CONFLICT (name) DO NOTHING;

-- Insert sample data center
INSERT INTO public.data_centers (name, location, address, total_racks, power_capacity_kw, cooling_capacity_tons) VALUES
  ('DC-Primary', 'New York', '123 Data Center Drive, New York, NY 10001', 100, 2000.00, 500.00),
  ('DC-Secondary', 'California', '456 Tech Boulevard, San Francisco, CA 94105', 75, 1500.00, 375.00)
ON CONFLICT DO NOTHING;

-- Insert sample racks (using the data center IDs)
INSERT INTO public.racks (name, data_center_id, row_position, column_position, height_units, power_capacity_watts, weight_capacity_kg, status)
SELECT 
  'Rack-' || generate_series(1, 20),
  dc.id,
  'Row-' || ((generate_series(1, 20) - 1) / 10 + 1),
  'Col-' || ((generate_series(1, 20) - 1) % 10 + 1),
  42,
  8000,
  1000.00,
  'available'
FROM public.data_centers dc
WHERE dc.name = 'DC-Primary'
LIMIT 20;

-- Insert sample IP pools
INSERT INTO public.ip_pools (name, network_address, subnet_mask, gateway, dns_servers, vlan_id, description) VALUES
  ('Production Network', '192.168.1.0'::inet, 24, '192.168.1.1'::inet, ARRAY['8.8.8.8', '8.8.4.4'], 100, 'Main production network'),
  ('Management Network', '10.0.1.0'::inet, 24, '10.0.1.1'::inet, ARRAY['8.8.8.8', '8.8.4.4'], 200, 'Management and monitoring network'),
  ('DMZ Network', '172.16.1.0'::inet, 24, '172.16.1.1'::inet, ARRAY['8.8.8.8', '8.8.4.4'], 300, 'DMZ for public-facing services')
ON CONFLICT DO NOTHING;

-- Insert sample IP addresses for each pool
INSERT INTO public.ip_addresses (ip_address, pool_id, status)
SELECT 
  (p.network_address + generate_series(1, 50))::inet,
  p.id,
  'available'
FROM public.ip_pools p;

-- Insert sample customers
INSERT INTO public.customers (name, contact_email, contact_phone, address, status) VALUES
  ('TechCorp Solutions', 'admin@techcorp.com', '+1-555-0101', '789 Business Ave, New York, NY 10002', 'active'),
  ('Global Enterprises', 'contact@globalent.com', '+1-555-0102', '321 Corporate Blvd, San Francisco, CA 94106', 'active'),
  ('StartupXYZ', 'hello@startupxyz.com', '+1-555-0103', '654 Innovation St, Austin, TX 78701', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample projects
INSERT INTO public.projects (name, description, customer_id, status, start_date, end_date, budget)
SELECT 
  'Infrastructure Upgrade',
  'Complete server infrastructure modernization',
  c.id,
  'active',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '90 days',
  250000.00
FROM public.customers c
WHERE c.name = 'TechCorp Solutions'
LIMIT 1;

INSERT INTO public.projects (name, description, customer_id, status, start_date, end_date, budget)
SELECT 
  'Cloud Migration',
  'Migration of legacy systems to cloud infrastructure',
  c.id,
  'planning',
  CURRENT_DATE + INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '180 days',
  500000.00
FROM public.customers c
WHERE c.name = 'Global Enterprises'
LIMIT 1;

-- Insert sample assets
INSERT INTO public.assets (name, asset_tag, serial_number, model, manufacturer, category_id, rack_id, rack_position, height_units, power_consumption_watts, weight_kg, purchase_date, warranty_expiry, purchase_cost, status, customer_id, project_id, notes)
SELECT 
  'Web Server ' || generate_series(1, 10),
  'WS-' || LPAD(generate_series(1, 10)::text, 4, '0'),
  'SN' || LPAD(generate_series(1, 10)::text, 8, '0'),
  'PowerEdge R750',
  'Dell',
  cat.id,
  rack.id,
  generate_series(1, 10),
  2,
  750,
  25.5,
  CURRENT_DATE - INTERVAL '1 year',
  CURRENT_DATE + INTERVAL '2 years',
  8500.00,
  'active',
  cust.id,
  proj.id,
  'Production web server'
FROM public.asset_categories cat,
     public.racks rack,
     public.customers cust,
     public.projects proj
WHERE cat.name = 'Server'
  AND rack.name = 'Rack-1'
  AND cust.name = 'TechCorp Solutions'
  AND proj.name = 'Infrastructure Upgrade'
LIMIT 10;

-- Assign IP addresses to some assets
UPDATE public.ip_addresses 
SET asset_id = a.id, 
    hostname = 'web' || LPAD((ROW_NUMBER() OVER())::text, 2, '0') || '.techcorp.com',
    status = 'assigned',
    assignment_date = NOW()
FROM (
  SELECT id, ROW_NUMBER() OVER() as rn
  FROM public.assets 
  WHERE name LIKE 'Web Server%'
  LIMIT 5
) a
WHERE ip_addresses.id IN (
  SELECT id 
  FROM public.ip_addresses 
  WHERE status = 'available' 
  AND pool_id = (SELECT id FROM public.ip_pools WHERE name = 'Production Network')
  LIMIT 5
);

-- Insert sample monitoring metrics
INSERT INTO public.monitoring_metrics (asset_id, metric_type, value, unit, timestamp)
SELECT 
  a.id,
  metric_types.metric_type,
  CASE 
    WHEN metric_types.metric_type = 'cpu' THEN random() * 100
    WHEN metric_types.metric_type = 'memory' THEN random() * 100
    WHEN metric_types.metric_type = 'disk' THEN random() * 100
    WHEN metric_types.metric_type = 'temperature' THEN 20 + random() * 40
    WHEN metric_types.metric_type = 'power' THEN 500 + random() * 250
    ELSE random() * 100
  END,
  CASE 
    WHEN metric_types.metric_type IN ('cpu', 'memory', 'disk') THEN 'percent'
    WHEN metric_types.metric_type = 'temperature' THEN 'celsius'
    WHEN metric_types.metric_type = 'power' THEN 'watts'
    ELSE 'units'
  END,
  NOW() - (random() * INTERVAL '24 hours')
FROM public.assets a
CROSS JOIN (
  VALUES ('cpu'), ('memory'), ('disk'), ('temperature'), ('power')
) AS metric_types(metric_type)
WHERE a.status = 'active'
LIMIT 100;

-- Insert sample alerts
INSERT INTO public.alerts (asset_id, alert_type, title, description, status)
SELECT 
  a.id,
  CASE 
    WHEN random() < 0.3 THEN 'critical'
    WHEN random() < 0.7 THEN 'warning'
    ELSE 'info'
  END,
  'High CPU Usage',
  'CPU usage has exceeded 90% for more than 5 minutes',
  'open'
FROM public.assets a
WHERE a.status = 'active'
AND random() < 0.2  -- Only create alerts for 20% of assets
LIMIT 5;
