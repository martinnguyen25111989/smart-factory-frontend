import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── INTERFACES ────────────────────────────────────────────────────────────────

interface Zone {
  id: string;
  name: string;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'SAFE';
  color: string;
  sensors: string[];
}

interface Worker {
  id: string;
  name: string;
  dept: string;
  rfid: string;
  violations: number;
}

interface AlertEntry {
  id: string;
  code: string;
  worker: Worker;
  zone: Zone;
  helmet: boolean;
  shoes: boolean;
  confidence: number;
  severity: string;
  violationType: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
  timestamp: Date;
  snapshot: string;
  isViolation: boolean;
  resolvedAt?: Date;
}

interface FeedItem {
  text: string;
  ts: string;
  dot: string;
}

interface KafkaEntry {
  ts: string;
  data: string;
  viol: boolean;
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────

/** Violation event fires every 10 s (+ up to 2 s random jitter). */
const SIM_INTERVAL_MS = 10_000;
/** An OPEN alert is auto-escalated after this many ms without action. */
const ESCALATE_AFTER_MS = 30_000;
/** Max items kept in the Kafka log ring-buffer. */
const KAFKA_CAP = 50;
/** Max items kept in the activity feed ring-buffer. */
const FEED_CAP = 30;
/** Max violation alerts kept in memory. */
const ALERT_CAP = 100;

// ─── COMPONENT ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {

  constructor(
    private ngZone: NgZone,
    private cd: ChangeDetectorRef,
  ) {}

  // ─── MASTER DATA ─────────────────────────────────────────────────────────────

  readonly ZONES: Zone[] = [
    { id: 'ZONE-A', name: 'Zone A — 220kV',     risk: 'CRITICAL', color: '#993C1D', sensors: ['CAM-A-01', 'CAM-A-02'] },
    { id: 'ZONE-B', name: 'Zone B — 110kV',     risk: 'HIGH',     color: '#854F0B', sensors: ['CAM-B-01', 'RFID-B-01'] },
    { id: 'ZONE-C', name: 'Zone C — 22kV',      risk: 'MEDIUM',   color: '#185FA5', sensors: ['CAM-C-01'] },
    { id: 'ZONE-D', name: 'Zone D — Hành lang', risk: 'SAFE',     color: '#3B6D11', sensors: ['CAM-D-01'] },
  ];

  WORKERS: Worker[] = [
    { id: 'W01', name: 'Nguyễn Văn An',     dept: 'Vận hành', rfid: 'RFID-001', violations: 0 },
    { id: 'W02', name: 'Trần Thị Bình',    dept: 'Xây dựng', rfid: 'RFID-002', violations: 0 },
    { id: 'W03', name: 'Lê Minh Cường',    dept: 'Vận hành', rfid: 'RFID-003', violations: 0 },
    { id: 'W04', name: 'Phạm Thị Dung',    dept: 'Bảo trì',  rfid: 'RFID-004', violations: 0 },
    { id: 'W05', name: 'Hoàng Văn Em',     dept: 'Xây dựng', rfid: 'RFID-005', violations: 0 },
    { id: 'W06', name: 'Đặng Thị Phương',  dept: 'An toàn',  rfid: 'RFID-006', violations: 0 },
  ];

  private readonly SEEDS = [
    'ppe1','ppe2','ppe3','ppe4','ppe5','ppe6','ppe7','ppe8','ppe9','ppe10',
  ];

  // ─── REACTIVE STATE ──────────────────────────────────────────────────────────

  alerts:        AlertEntry[] = [];
  feedItems:     FeedItem[]   = [];
  kafkaLog:      KafkaEntry[] = [];

  currentTab     = 'dashboard';
  selectedAlert: AlertEntry | null = null;
  toastMsg       = '';
  toastVisible   = false;
  clockStr       = '';

  // Simulator config (bound via ngModel in the template)
  simRate  = 30;   // 0–100 % chance of a violation per event
  simZone  = 'all';

  // Simulator counters
  simEvents = 0;
  simViol   = 0;
  simOk     = 0;
  simEsc    = 0;

  // Filter state (alerts tab)
  filterSev    = '';
  filterStatus = '';

  openAlertsCount = 10 ;

  // ─── PRIVATE TIMER HANDLES ───────────────────────────────────────────────────

  private simTimer: ReturnType<typeof setTimeout> | null = null;
  private intervals: ReturnType<typeof setInterval>[]    = [];
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── COMPUTED GETTERS ────────────────────────────────────────────────────────

  get kpiToday(): number { return this.alerts.length; }

  get kpiOpen(): number { return this.alerts.filter(a => a.status === 'OPEN').length; }

  get kpiCompliance(): number {
    if (this.simEvents === 0) return 100;
    return Math.round((1 - this.simViol / this.simEvents) * 100);
  }

  get kpiMttr(): number | null {
    const resolved = this.alerts.filter(a => a.status === 'RESOLVED' && a.resolvedAt);
    if (!resolved.length) return null;
    const totalMs = resolved.reduce(
      (sum, a) => sum + (a.resolvedAt!.getTime() - a.timestamp.getTime()),
      0,
    );
    return Math.round(totalMs / resolved.length / 60_000);
  }

  get dashboardAlerts(): AlertEntry[] { return this.alerts.slice(0, 5); }

  get topWorkers(): Worker[] {
    return [...this.WORKERS]
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 4);
  }

  get filteredAlerts(): AlertEntry[] {
    return this.alerts.filter(a =>
      (!this.filterSev    || a.severity === this.filterSev) &&
      (!this.filterStatus || a.status   === this.filterStatus),
    );
  }

  get zoneBars() {
    const counts = this.ZONES.map(z => this.zoneCount(z.id));
    const max    = Math.max(...counts, 1);
    return this.ZONES.map((z, i) => ({
      ...z,
      count: counts[i],
      width: Math.round((counts[i] / max) * 100),
    }));
  }

  // ─── LIFECYCLE ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // All timers run outside Angular's zone so they don't trigger CD on every tick.
    this.ngZone.runOutsideAngular(() => {

      // 1. Clock — updates every second
      this.intervals.push(
        setInterval(() => {
          this.clockStr = new Date().toLocaleTimeString('vi-VN');
          this.cd.detectChanges();
        }, 1_000),
      );

      // 2. Seed — fire a handful of realistic events at startup
      setTimeout(() => {
        this.generateEvent('ZONE-A', true);
        this.generateEvent('ZONE-B', true);
        this.generateEvent('ZONE-A', true);
        this.generateEvent('ZONE-C', false);
        this.generateEvent('ZONE-B', true);
        this.cd.detectChanges();
      }, 300);

      // 3. Start the 10-second simulation loop
      setTimeout(() => this.startSimulation(), 1_200);

      // 4. Auto-escalate OPEN alerts that have been sitting > 30 s
      this.intervals.push(
        setInterval(() => this.escalateStalealerts(), 10_000),
      );
    });
  }

  ngOnDestroy(): void {
    this.intervals.forEach(id => clearInterval(id));
    if (this.simTimer)  clearTimeout(this.simTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ─── SIMULATION ──────────────────────────────────────────────────────────────

  /**
   * Core event generator.
   * - `forcedZone`      — pin the event to a specific zone ID (undefined = random)
   * - `forceViolation`  — true = always violation | false = always compliant | undefined = use simRate
   */
  generateEvent(forcedZone?: string, forceViolation?: boolean): void {
    const zone   = forcedZone
      ? (this.ZONES.find(z => z.id === forcedZone) ?? this.rnd(this.ZONES))
      : this.rnd(this.ZONES);
    const worker = this.rnd(this.WORKERS);

    // ── Determine violation & missing PPE ──────────────────────────────────────
    const isViolation = forceViolation ?? (Math.random() < this.simRate / 100);

    let helmet = true;
    let shoes  = true;
    if (isViolation) {
      const t = Math.random();
      if      (t < 0.35) { helmet = false; shoes = false; }   // both missing
      else if (t < 0.65) { helmet = false; }                   // no helmet
      else               { shoes  = false; }                   // no shoes
    }

    // ── Update counters ───────────────────────────────────────────────────────
    this.simEvents++;
    if (isViolation) { this.simViol++; worker.violations++; }
    else             { this.simOk++; }

    // ── Build the alert entry ─────────────────────────────────────────────────
    const entry: AlertEntry = {
      id:            this.uid(),
      code:          'ALT-' + this.uid(),
      zone,
      worker,
      helmet,
      shoes,
      confidence:    +(0.85 + Math.random() * 0.13).toFixed(2),
      severity:      isViolation ? this.getSeverity(zone, helmet, shoes) : '',
      violationType: isViolation ? this.getViolationType(helmet, shoes)  : '',
      status:        'OPEN',
      timestamp:     new Date(),
      snapshot:      `https://picsum.photos/seed/${this.rnd(this.SEEDS)}/320/200`,
      isViolation,
    };

    // ── Kafka ring-buffer (cap: KAFKA_CAP) ────────────────────────────────────
    this.kafkaLog = [
      {
        ts:   this.fmtTime(entry.timestamp),
        data: JSON.stringify({
          event_id:         entry.id,
          sensor:           this.rnd(zone.sensors),
          zone_id:          zone.id,
          worker_id:        worker.rfid,
          has_helmet:       helmet,
          has_safety_shoes: shoes,
          confidence:       entry.confidence,
          ts:               entry.timestamp.toISOString(),
        }),
        viol: isViolation,
      },
      ...this.kafkaLog.slice(0, KAFKA_CAP - 1),
    ];

    // ── Activity feed ring-buffer (cap: FEED_CAP) ─────────────────────────────
    this.feedItems = [
      {
        text: `${worker.name} → ${zone.id} | ${isViolation ? entry.violationType : 'Tuân thủ ✓'}`,
        ts:   this.fmtTime(entry.timestamp),
        dot:  isViolation ? entry.severity : 'OK',
      },
      ...this.feedItems.slice(0, FEED_CAP - 1),
    ];

    // ── Push violation into alert list (cap: ALERT_CAP) ───────────────────────
    if (isViolation) {
      this.alerts = [entry, ...this.alerts.slice(0, ALERT_CAP - 1)];
      this.showToast(`🚨 ${entry.severity}: ${worker.name} — ${entry.violationType} tại ${zone.id}`);
    }

    this.cd.detectChanges();
  }

  /** Manual trigger wired to the "Force Violation" button in the template. */
  triggerViolation(): void {
    const zone = this.simZone === 'all' ? undefined : this.simZone;
    this.generateEvent(zone, true);
  }

  // ─── PRIVATE SIMULATION HELPERS ──────────────────────────────────────────────

  /**
   * Recursive setTimeout loop — fires every SIM_INTERVAL_MS + 0–2 s jitter.
   * Using setTimeout instead of setInterval so each tick starts only after
   * the previous one finishes (avoids stacking on slow machines).
   */
  private startSimulation(): void {
    const tick = (): void => {
      this.generateEvent();                                           // compliant or violation based on simRate
      const jitter = SIM_INTERVAL_MS + Math.random() * 2_000;
      this.simTimer = setTimeout(tick, jitter);
    };
    tick();
  }

  /** Escalate any OPEN alert that has gone unacknowledged for too long. */
  private escalateStalealerts(): void {
    const now = Date.now();
    let changed = false;

    this.alerts.forEach(a => {
      if (a.status === 'OPEN' && now - a.timestamp.getTime() > ESCALATE_AFTER_MS) {
        a.status = 'ESCALATED';
        this.simEsc++;
        changed = true;
      }
    });

    if (changed) {
      this.alerts = [...this.alerts];  // new reference so Angular's OnPush sees the change
      this.cd.detectChanges();
    }
  }

  private getSeverity(zone: Zone, helmet: boolean, shoes: boolean): string {
    if (zone.risk === 'CRITICAL')  return 'CRITICAL';
    if (!helmet && !shoes)         return 'HIGH';
    if (zone.risk === 'HIGH')      return 'HIGH';
    return 'LOW';
  }

  private getViolationType(helmet: boolean, shoes: boolean): string {
    if (!helmet && !shoes) return 'Thiếu mũ + giày bảo hộ';
    if (!helmet)           return 'Không đội mũ bảo hộ';
    return 'Không đi giày bảo hộ';
  }

  // ─── ALERT ACTIONS ───────────────────────────────────────────────────────────

  openModal(alert: AlertEntry): void { this.selectedAlert = alert; }
  closeModal(): void                 { this.selectedAlert = null; }

  ackAlert(): void {
    if (this.selectedAlert?.status === 'OPEN') {
      this.selectedAlert.status = 'ACKNOWLEDGED';
      this.alerts = [...this.alerts];
    }
    this.closeModal();
  }

  resolveAlert(): void {
    if (this.selectedAlert) {
      this.selectedAlert.status    = 'RESOLVED';
      this.selectedAlert.resolvedAt = new Date();
      this.alerts = [...this.alerts];
    }
    this.closeModal();
  }

  // ─── UI HELPERS ──────────────────────────────────────────────────────────────

  showTab(tab: string): void { this.currentTab = tab; }

  showToast(msg: string): void {
    this.toastMsg     = msg;
    this.toastVisible = true;
    this.cd.detectChanges();

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.toastVisible = false;
        this.cd.detectChanges();
      });
    }, 3_500);
  }

  // ─── DISPLAY FORMATTERS ──────────────────────────────────────────────────────

  getInitials(name: string): string {
    return name.split(' ').slice(-2).map(p => p[0]).join('').toUpperCase();
  }

  ago(d: Date): string {
    const s = Math.round((Date.now() - d.getTime()) / 1_000);
    if (s < 60)    return `${s}s trước`;
    if (s < 3_600) return `${Math.round(s / 60)}m trước`;
    return `${Math.round(s / 3_600)}h trước`;
  }

  fmtDate(d: Date): string {
    return d.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit',
      day: '2-digit',  month: '2-digit',
    });
  }

  fmtTime(d: Date): string {
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  zoneCount(zoneId: string): number {
    return this.alerts.filter(a => a.zone.id === zoneId).length;
  }

  severityColor(s: string): string {
    return ({ CRITICAL: '#993C1D', HIGH: '#854F0B', LOW: '#3B6D11' } as Record<string, string>)[s] ?? '#5F5E5A';
  }

  severityBg(s: string): string {
    return ({ CRITICAL: '#FAECE7', HIGH: '#FAEEDA', LOW: '#EAF3DE' } as Record<string, string>)[s] ?? '#F1EFE8';
  }

  violationColor(count: number): string { return count === 0 ? '#3B6D11' : '#993C1D'; }

  dotClass(dot: string): string {
    return 'dot-' + (dot === 'OK' ? 'ok' : dot.toLowerCase());
  }

  riskColors(risk: string): { bg: string; text: string } {
    const map: Record<string, { bg: string; text: string }> = {
      CRITICAL: { bg: '#FAECE7', text: '#993C1D' },
      HIGH:     { bg: '#FAEEDA', text: '#854F0B' },
      MEDIUM:   { bg: '#E6F1FB', text: '#185FA5' },
      SAFE:     { bg: '#EAF3DE', text: '#3B6D11' },
    };
    return map[risk] ?? { bg: '#F1EFE8', text: '#5F5E5A' };
  }

  riskLabel(risk: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'Cực kỳ nguy hiểm',
      HIGH:     'Nguy hiểm cao',
      MEDIUM:   'Trung bình',
      SAFE:     'An toàn',
    };
    return map[risk] ?? risk;
  }

  zoneSubname(name: string): string { return name.split('—')[1]?.trim() ?? ''; }

  // ─── PRIVATE UTILITIES ───────────────────────────────────────────────────────

  private rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
  private uid(): string       { return Math.random().toString(36).slice(2, 10).toUpperCase(); }
}