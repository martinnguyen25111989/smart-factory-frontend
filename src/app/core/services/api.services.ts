import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, interval } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Alert, AlertSummary, Worker, WorkerCreate, Zone, Shift, ZoneStat, DailyTrend, PpeStat } from '../models/models';

// ── Alert Service ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AlertService {
  private http = inject(HttpClient);
  private readonly BASE = 'http://localhost:8001';
  private ws$: WebSocketSubject<any> | null = null;

  list(status?: string, severity?: string, limit = 50, offset = 0): Observable<Alert[]> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (status)   params = params.set('status', status);
    if (severity) params = params.set('severity', severity);
    return this.http.get<Alert[]>(`${this.BASE}/api/alerts/`, { params });
  }

  get(id: string): Observable<Alert> {
    return this.http.get<Alert>(`${this.BASE}/api/alerts/${id}`);
  }

  acknowledge(id: string, workerId: string): Observable<any> {
    return this.http.patch(`${this.BASE}/api/alerts/${id}/acknowledge`, { acknowledged_by: workerId });
  }

  resolve(id: string): Observable<any> {
    return this.http.patch(`${this.BASE}/api/alerts/${id}/resolve`, {});
  }

  connectWs(): WebSocketSubject<any> {
    if (!this.ws$ || this.ws$.closed) {
      this.ws$ = webSocket('ws://localhost:8001/ws/alerts');
    }
    return this.ws$;
  }

  disconnectWs(): void { this.ws$?.complete(); }
}

// ── Worker Service ────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class WorkerService {
  private http = inject(HttpClient);
  private readonly BASE = 'http://localhost:8002';

  list(limit = 100): Observable<Worker[]> {
    return this.http.get<Worker[]>(`${this.BASE}/api/workers/`, { params: { limit } });
  }

  get(id: string): Observable<Worker> {
    return this.http.get<Worker>(`${this.BASE}/api/workers/${id}`);
  }

  create(body: WorkerCreate): Observable<Worker> {
    return this.http.post<Worker>(`${this.BASE}/api/workers/`, body);
  }

  update(id: string, body: Partial<WorkerCreate>): Observable<Worker> {
    return this.http.patch<Worker>(`${this.BASE}/api/workers/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/api/workers/${id}`);
  }

  zones(): Observable<Zone[]> {
    return this.http.get<Zone[]>(`${this.BASE}/api/zones/`);
  }

  shifts(): Observable<Shift[]> {
    return this.http.get<Shift[]>(`${this.BASE}/api/shifts/`);
  }
}

// ── Report Service ────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private readonly BASE = 'http://localhost:8003';

  summary(days = 7): Observable<AlertSummary> {
    return this.http.get<AlertSummary>(`${this.BASE}/api/reports/summary`, { params: { days } });
  }

  byZone(days = 7): Observable<ZoneStat[]> {
    return this.http.get<ZoneStat[]>(`${this.BASE}/api/reports/alerts-by-zone`, { params: { days } });
  }

  dailyTrend(days = 30): Observable<DailyTrend[]> {
    return this.http.get<DailyTrend[]>(`${this.BASE}/api/reports/daily-trend`, { params: { days } });
  }

  ppeCompliance(days = 7): Observable<PpeStat[]> {
    return this.http.get<PpeStat[]>(`${this.BASE}/api/reports/ppe-compliance`, { params: { days } });
  }

  exportExcel(days = 7): void {
    window.open(`${this.BASE}/api/reports/export/excel?days=${days}`, '_blank');
  }

  exportPdf(days = 7): void {
    window.open(`${this.BASE}/api/reports/export/pdf?days=${days}`, '_blank');
  }
}
