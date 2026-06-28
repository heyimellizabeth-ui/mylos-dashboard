export type Role = "kitchen" | "service" | "admin";
export type ScheduleStatus = "v" | "x" | "vak";
export type RequestStatus = "pending" | "approved" | "denied";
export type SwapStatus = "pending" | "accepted" | "declined" | "admin_approved" | "admin_denied" | "cancelled";
export type TargetRole = "all" | "kitchen" | "service";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  active: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  employee_id: string;
  date: string;
  status: ScheduleStatus;
  shift_start: string | null;
  shift_end: string | null;
  notes: string | null;
  created_by: string | null;
  updated_at: string;
  profiles?: Profile;
}

export interface TimeOffRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: RequestStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  profiles?: Profile;
  reviewer?: Profile;
}

export interface ShiftSwapRequest {
  id: string;
  requester_id: string;
  target_employee_id: string;
  requester_date: string;
  target_date: string;
  status: SwapStatus;
  admin_approved_by: string | null;
  created_at: string;
  requester?: Profile;
  target_employee?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  body: string | null;
  target_role: TargetRole;
  created_by: string;
  created_at: string;
  author?: Profile;
}
