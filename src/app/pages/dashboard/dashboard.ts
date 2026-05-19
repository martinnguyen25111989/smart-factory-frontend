import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Subscription, interval } from 'rxjs';
import { AlertService, ReportService, WorkerService } from '../../core/services/api.services';
import { Alert, AlertSummary } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  private reportSvc = inject(ReportService);
  private alertSvc  = inject(AlertService);
  private workerSvc = inject(WorkerService);
  private cdr = inject(ChangeDetectorRef);
  private subs = new Subscription();

  summary: AlertSummary | null = null;
  recentAlerts: Alert[] = [];
  liveCount = 0;
  workerNames: Record<string, string> = {};

  trendData: ChartData<'line'> = {
    labels: [],
    datasets: [{ data: [], label: 'Alerts', borderColor: '#4f52e8', backgroundColor: 'rgba(79,82,232,0.08)', fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#4f52e8' }]
  };

  zoneData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], 
      backgroundColor: ['#4f52e8','#f59e0b','#ef4444','#22c55e','#3b82f6','#ec4899'], 
      borderWidth: 0 }]
    };

  lineOpts: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d1117', borderColor: '#1e2640', borderWidth: 1, titleColor: '#e2e8f0', bodyColor: '#64748b' } },
    scales: {
      x: { ticks: { color: '#334155', font: { size: 11 } }, grid: { color: '#0d1117' }, border: { color: '#161d2e' } },
      y: { ticks: { color: '#334155', font: { size: 11 } }, grid: { color: '#111520' }, border: { color: '#161d2e' } }
    }
  };

  pieOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#64748b', boxWidth: 10, font: { size: 11 } } },
      tooltip: { backgroundColor: '#0d1117', borderColor: '#1e2640', borderWidth: 1, titleColor: '#e2e8f0', bodyColor: '#64748b' }
    },
   
  };

  ngOnInit(): void {
    this.workerSvc.list(1000).subscribe(workers => {
      this.workerNames = Object.fromEntries(workers.map(w => [w.id, w.full_name]));
      this.cdr.markForCheck();
    });
    this.load();
    // Auto-refresh every 30s
    this.subs.add(interval(30000).subscribe(() => this.load()));
    // WebSocket realtime
    const ws = this.alertSvc.connectWs();
    this.subs.add(ws.subscribe({
      next: () => { this.liveCount++; this.cdr.markForCheck(); },
      error: () => {}
    }));
  }

  load(): void {
    this.reportSvc.summary(7).subscribe(s => {
      this.summary = s;
      this.cdr.markForCheck();
    });
    this.alertSvc.list(undefined, undefined, 8, 0).subscribe(a => {
      this.recentAlerts = a;
      this.cdr.markForCheck();
    });
    this.reportSvc.dailyTrend(30).subscribe(t => {
      this.trendData = {
        labels: t.map(x => x.day.slice(5)),
        datasets: [{ data: t.map(x => x.count), label: 'Alerts', borderColor: '#4f52e8', backgroundColor: 'rgba(79,82,232,0.08)', fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#4f52e8' }]
      };
      this.cdr.markForCheck();
    });
    this.reportSvc.byZone(7).subscribe(z => {
      this.zoneData = {
        labels: z.map(x => x.zone_name),
        datasets: [{ data: z.map(x => x.count), backgroundColor: ['#4f52e8','#f59e0b','#ef4444','#22c55e','#3b82f6','#ec4899'], borderWidth: 0 }]
      };
      this.cdr.markForCheck();
    });
  }

  formatType(t: string): string {
    return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  workerName(id: string | null): string {
    return id ? (this.workerNames[id] ?? '—') : '—';
  }

  trackByAlertId(index: number, alert: Alert): string {
    return alert.id;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.alertSvc.disconnectWs();
  }
}
