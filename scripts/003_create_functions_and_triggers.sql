-- Functions and Triggers for Data Center Management Application
-- These handle automatic profile creation, change logging, and data validation

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers to all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_data_centers_updated_at BEFORE UPDATE ON public.data_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_racks_updated_at BEFORE UPDATE ON public.racks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ip_pools_updated_at BEFORE UPDATE ON public.ip_pools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ip_addresses_updated_at BEFORE UPDATE ON public.ip_addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log changes for audit trail
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.change_logs (table_name, record_id, action, old_values, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.change_logs (table_name, record_id, action, old_values, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.change_logs (table_name, record_id, action, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Add change logging triggers to important tables
CREATE TRIGGER log_customers_changes AFTER INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER log_projects_changes AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER log_assets_changes AFTER INSERT OR UPDATE OR DELETE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.log_changes();
CREATE TRIGGER log_ip_addresses_changes AFTER INSERT OR UPDATE OR DELETE ON public.ip_addresses FOR EACH ROW EXECUTE FUNCTION public.log_changes();

-- Function to validate rack capacity
CREATE OR REPLACE FUNCTION public.validate_rack_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  rack_height INTEGER;
  used_units INTEGER;
BEGIN
  -- Get rack height
  SELECT height_units INTO rack_height
  FROM public.racks
  WHERE id = NEW.rack_id;
  
  -- Calculate used units in rack (excluding current asset if updating)
  SELECT COALESCE(SUM(height_units), 0) INTO used_units
  FROM public.assets
  WHERE rack_id = NEW.rack_id
    AND status != 'decommissioned'
    AND (TG_OP = 'INSERT' OR id != NEW.id);
  
  -- Check if new asset fits
  IF used_units + NEW.height_units > rack_height THEN
    RAISE EXCEPTION 'Asset does not fit in rack. Available units: %, Required units: %', 
      rack_height - used_units, NEW.height_units;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add rack capacity validation trigger
CREATE TRIGGER validate_asset_rack_capacity 
  BEFORE INSERT OR UPDATE ON public.assets 
  FOR EACH ROW 
  WHEN (NEW.rack_id IS NOT NULL AND NEW.status != 'decommissioned')
  EXECUTE FUNCTION public.validate_rack_capacity();

-- Function to auto-assign IP addresses
CREATE OR REPLACE FUNCTION public.get_next_available_ip(pool_id UUID)
RETURNS INET
LANGUAGE plpgsql
AS $$
DECLARE
  pool_network INET;
  pool_mask INTEGER;
  next_ip INET;
BEGIN
  -- Get pool network details
  SELECT network_address, subnet_mask INTO pool_network, pool_mask
  FROM public.ip_pools
  WHERE id = pool_id;
  
  -- Find next available IP (simplified logic)
  SELECT ip_address + 1 INTO next_ip
  FROM public.ip_addresses
  WHERE pool_id = pool_id
    AND status = 'available'
  ORDER BY ip_address
  LIMIT 1;
  
  RETURN next_ip;
END;
$$;
