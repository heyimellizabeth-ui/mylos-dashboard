# Mylos Rooster — Database Setup

Paste the SQL below into **Supabase → SQL Editor → New query → Run**.

```sql
-- Profiles table: extends auth.users with name and role
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name        text NOT NULL,
  role        text NOT NULL CHECK (role IN ('kitchen', 'service', 'admin')),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'service')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Schedules: one row per employee per day
CREATE TABLE IF NOT EXISTS schedules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  date         date NOT NULL,
  status       text NOT NULL CHECK (status IN ('v', 'x', 'vak')),
  shift_start  time,
  shift_end    time,
  notes        text,
  created_by   uuid REFERENCES profiles,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  body         text,
  target_role  text NOT NULL CHECK (target_role IN ('all', 'kitchen', 'service')) DEFAULT 'all',
  created_by   uuid NOT NULL REFERENCES profiles,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Time-off requests
CREATE TABLE IF NOT EXISTS time_off_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  start_date   date NOT NULL,
  end_date     date NOT NULL CHECK (end_date >= start_date),
  reason       text,
  status       text NOT NULL CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
  admin_notes  text,
  reviewed_by  uuid REFERENCES profiles,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Shift swap requests
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id        uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  target_employee_id  uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  requester_date      date NOT NULL,
  target_date         date NOT NULL,
  status              text NOT NULL CHECK (
    status IN ('pending', 'accepted', 'declined', 'admin_approved', 'admin_denied', 'cancelled')
  ) DEFAULT 'pending',
  admin_approved_by   uuid REFERENCES profiles,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

CREATE POLICY "schedules_select_authenticated" ON schedules
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "schedules_insert_admin" ON schedules
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "schedules_update_admin" ON schedules
  FOR UPDATE USING (is_admin());
CREATE POLICY "schedules_delete_admin" ON schedules
  FOR DELETE USING (is_admin());

CREATE POLICY "timeoff_select" ON time_off_requests
  FOR SELECT USING (auth.uid() = employee_id OR is_admin());
CREATE POLICY "timeoff_insert" ON time_off_requests
  FOR INSERT WITH CHECK (auth.uid() = employee_id);
CREATE POLICY "timeoff_update_admin" ON time_off_requests
  FOR UPDATE USING (is_admin());

CREATE POLICY "swap_select" ON shift_swap_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_employee_id OR is_admin());
CREATE POLICY "swap_insert" ON shift_swap_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "swap_update" ON shift_swap_requests
  FOR UPDATE USING (auth.uid() = target_employee_id OR is_admin());

CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "announcements_insert_admin" ON announcements
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "announcements_delete_admin" ON announcements
  FOR DELETE USING (is_admin());
```

Expected result: **"Success. No rows returned"**

---

## After the SQL runs — create your admin account

1. Supabase → **Authentication** → **Add user** → **Create new user**
2. Enter your email + a password → **Create user**
3. Supabase → **Table Editor** → open the `profiles` table
4. Find your row → change `role` from `service` to `admin` → **Save**

You can now log in and add all other staff accounts from inside the app.
