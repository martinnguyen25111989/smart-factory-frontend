import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, interval } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Alert, AlertSummary, Worker, WorkerCreate, Zone, Shift, ZoneStat, DailyTrend, PpeStat } from '../models/models';

// ── Alert Service ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AlertService {
  private http = inject(HttpClient);
  private readonly BASE = '/api/alerts';
  private ws$: WebSocketSubject<any> | null = null;

  list(status?: string, severity?: string, limit = 50, offset = 0): Observable<Alert[]> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (status)   params = params.set('status', status);
    if (severity) params = params.set('severity', severity);
    return this.http.get<Alert[]>(`${this.BASE}/`, { params });
  }

  get(id: string): Observable<Alert> {
    return this.http.get<Alert>(`${this.BASE}/${id}`);
  }

  acknowledge(id: string, workerId: string): Observable<any> {
    return this.http.patch(`${this.BASE}/${id}/acknowledge`, { acknowledged_by: workerId });
  }

  resolve(id: string): Observable<any> {
    return this.http.patch(`${this.BASE}/${id}/resolve`, {});
  }

  connectWs(): WebSocketSubject<any> {
    if (!this.ws$ || this.ws$.closed) {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${protocol}://${window.location.host}/ws/alerts`;
      this.ws$ = webSocket(url);
    }
    return this.ws$;
  }

  disconnectWs(): void { this.ws$?.complete(); }
}

// ── Worker Service ────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class WorkerService {
  private http = inject(HttpClient);
  private readonly BASE = '/api/workers';

  list(limit = 100): Observable<Worker[]> {
    return this.http.get<Worker[]>(`${this.BASE}/`, { params: { limit } });
  }

  get(id: string): Observable<Worker> {
    return this.http.get<Worker>(`${this.BASE}/${id}`);
  }

  create(body: WorkerCreate): Observable<Worker> {
    return this.http.post<Worker>(`${this.BASE}/`, body);
  }

  update(id: string, body: Partial<WorkerCreate>): Observable<Worker> {
    return this.http.patch<Worker>(`${this.BASE}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  zones(): Observable<Zone[]> {
    return this.http.get<Zone[]>('/api/zones/');
  }

  shifts(): Observable<Shift[]> {
    return this.http.get<Shift[]>('/api/shifts/');
  }

  createZone(body: any): Observable<Zone> {
    return this.http.post<Zone>('/api/zones/', body);
  }

  createShift(body: any): Observable<Shift> {
    return this.http.post<Shift>('/api/shifts/', body);
  }
}

// ── Report Service ────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private readonly BASE = '/api/reports';

  summary(days = 7): Observable<AlertSummary> {
    return this.http.get<AlertSummary>(`${this.BASE}/summary`, { params: { days } });
  }

  byZone(days = 7): Observable<ZoneStat[]> {
    return this.http.get<ZoneStat[]>(`${this.BASE}/alerts-by-zone`, { params: { days } });
  }

  dailyTrend(days = 30): Observable<DailyTrend[]> {
    return this.http.get<DailyTrend[]>(`${this.BASE}/daily-trend`, { params: { days } });
  }

  ppeCompliance(days = 7): Observable<PpeStat[]> {
    return this.http.get<PpeStat[]>(`${this.BASE}/ppe-compliance`, { params: { days } });
  }

  exportExcel(days = 7): void {
    window.open(`${this.BASE}/export/excel?days=${days}`, '_blank');
  }

  exportPdf(days = 7): void {
    window.open(`${this.BASE}/export/pdf?days=${days}`, '_blank');
  }
}
