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
