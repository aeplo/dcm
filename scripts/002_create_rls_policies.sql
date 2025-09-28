-- Row Level Security Policies for Data Center Management Application
-- These policies ensure users can only access data they're authorized to see

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Customers policies (all authenticated users can view, managers+ can modify)
CREATE POLICY "All users can view customers" ON public.customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers can insert customers" ON public.customers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Managers can update customers" ON public.customers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Admins can delete customers" ON public.customers FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Projects policies
CREATE POLICY "All users can view projects" ON public.projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers can insert projects" ON public.projects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Managers can update projects" ON public.projects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Admins can delete projects" ON public.projects FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Data centers policies
CREATE POLICY "All users can view data centers" ON public.data_centers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage data centers" ON public.data_centers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Racks policies
CREATE POLICY "All users can view racks" ON public.racks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Technicians can manage racks" ON public.racks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'technician'))
);
CREATE POLICY "Technicians can update racks" ON public.racks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'technician'))
);
CREATE POLICY "Admins can delete racks" ON public.racks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Asset categories policies
CREATE POLICY "All users can view asset categories" ON public.asset_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers can manage asset categories" ON public.asset_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Assets policies
CREATE POLICY "All users can view assets" ON public.assets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Technicians can insert assets" ON public.assets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'technician'))
);
CREATE POLICY "Technicians can update assets" ON public.assets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'technician'))
);
CREATE POLICY "Managers can delete assets" ON public.assets FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- IP pools policies
CREATE POLICY "All users can view IP pools" ON public.ip_pools FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Technicians can manage IP pools" ON public.ip_pools FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'technician'))
);
CREATE POLICY "Technicians can update IP pools" ON public.ip_pools FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'technician'))
);
CREATE POLICY "Managers can delete IP pools" ON public.ip_pools FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- IP addresses policies
CREATE POLICY "All users can view IP addresses" ON public.ip_addresses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Technicians can manage IP addresses" ON public.ip_addresses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'technician'))
);
CREATE POLICY "Technicians can update IP addresses" ON public.ip_addresses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'technician'))
);
CREATE POLICY "Managers can delete IP addresses" ON public.ip_addresses FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Asset connections policies
CREATE POLICY "All users can view asset connections" ON public.asset_connections FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Technicians can manage asset connections" ON public.asset_connections FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'technician'))
);
CREATE POLICY "Technicians can update asset connections" ON public.asset_connections FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'technician'))
);
CREATE POLICY "Technicians can delete asset connections" ON public.asset_connections FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'technician'))
);

-- Monitoring metrics policies (read-only for most users, insert for system)
CREATE POLICY "All users can view monitoring metrics" ON public.monitoring_metrics FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert monitoring metrics" ON public.monitoring_metrics FOR INSERT WITH CHECK (true);

-- Alerts policies
CREATE POLICY "All users can view alerts" ON public.alerts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can acknowledge alerts" ON public.alerts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Change logs policies (read-only for audit purposes)
CREATE POLICY "Managers can view change logs" ON public.change_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "System can insert change logs" ON public.change_logs FOR INSERT WITH CHECK (true);
