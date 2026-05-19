// ── Alert ──────────────────────────────────────────────────────
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  alert_type: string;
  severity: Severity;
  status: AlertStatus;
  description: string | null;
  zone_id: string | null;
  worker_id : string | null;
  created_at: string;
}

export interface AlertSummary {
  total: number;
  open: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ZoneStat { zone: string; count: number; }
export interface DailyTrend { day: string; count: number; }
export interface PpeStat { type: string; count: number; }

// ── Worker ─────────────────────────────────────────────────────
export type WorkerRole = 'worker' | 'supervisor' | 'admin';

export interface Worker {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role: WorkerRole;
  is_active: boolean;
  zone_id: string | null;
  shift_id: string | null;
  created_at: string;
}

export interface WorkerCreate {
  employee_id: string;
  full_name: string;
  email: string;
  password: string;
  role: WorkerRole;
  zone_id?: string;
  shift_id?: string;
}

// ── Zone / Shift ───────────────────────────────────────────────
export interface Zone {
  id: string;
  name: string;
  location: string | null;
  is_active: boolean;
}

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// ── Auth ───────────────────────────────────────────────────────
export interface LoginRequest  { email: string; password: string; }
export interface TokenResponse { access_token: string; token_type: string; }
