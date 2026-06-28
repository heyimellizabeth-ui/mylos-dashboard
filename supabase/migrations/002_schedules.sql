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

-- Auto-update updated_at
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
