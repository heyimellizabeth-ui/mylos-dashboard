-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Helper: check if caller is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
-- Everyone can read profiles (needed for name display in swap requests)
CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admin can update profiles (role changes, deactivation)
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- SCHEDULES
-- Everyone can read all schedules
CREATE POLICY "schedules_select_authenticated" ON schedules
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admin can write schedules
CREATE POLICY "schedules_insert_admin" ON schedules
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "schedules_update_admin" ON schedules
  FOR UPDATE USING (is_admin());

CREATE POLICY "schedules_delete_admin" ON schedules
  FOR DELETE USING (is_admin());

-- TIME OFF REQUESTS
-- Employees see only their own; admins see all
CREATE POLICY "timeoff_select" ON time_off_requests
  FOR SELECT USING (auth.uid() = employee_id OR is_admin());

-- Any authenticated user can submit
CREATE POLICY "timeoff_insert" ON time_off_requests
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

-- Only admin can update status
CREATE POLICY "timeoff_update_admin" ON time_off_requests
  FOR UPDATE USING (is_admin());

-- SHIFT SWAP REQUESTS
-- Requester, target, and admin can see
CREATE POLICY "swap_select" ON shift_swap_requests
  FOR SELECT USING (
    auth.uid() = requester_id OR
    auth.uid() = target_employee_id OR
    is_admin()
  );

-- Any employee can create a swap request for themselves
CREATE POLICY "swap_insert" ON shift_swap_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Target employee can accept/decline; admin can approve/deny
CREATE POLICY "swap_update" ON shift_swap_requests
  FOR UPDATE USING (
    auth.uid() = target_employee_id OR is_admin()
  );

-- ANNOUNCEMENTS
-- All authenticated users can read
CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admin can write
CREATE POLICY "announcements_insert_admin" ON announcements
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "announcements_delete_admin" ON announcements
  FOR DELETE USING (is_admin());
