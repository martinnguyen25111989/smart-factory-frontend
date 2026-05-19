import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertService } from '../../core/services/api.services';
interface FeedItem {
  id: string;
  alert_type: string;
  severity: string;
  description: string;
  zone_id: string;
  zone_name: string;
  worker_id: string;
  full_name: string;
  time: Date;
  isNew: boolean;
}
@Component({
  selector: 'app-sensors',
    imports: [CommonModule],
  templateUrl: './sensors.html',
  styleUrl: './sensors.scss',
})
export class Sensors implements OnInit, OnDestroy {
  private alertSvc  = inject(AlertService);
  private cdr       = inject(ChangeDetectorRef);
  private sub?: Subscription;

  connected = false;
  feed: FeedItem[] = [];

  stats = [
    { key: 'critical', color: '#f87171', count: 0 },
    { key: 'high',     color: '#fbbf24', count: 0 },
    { key: 'medium',   color: '#60a5fa', count: 0 },
    { key: 'low',      color: '#4ade80', count: 0 },
  ];

  ngOnInit(): void {
    this.connect();
  }

  connect(): void {
    const ws = this.alertSvc.connectWs();
    this.connected = true;
    this.cdr.markForCheck();
    this.sub = ws.subscribe({
      next: (msg: any) => this.onMessage(msg),
      error: () => { this.connected = false; this.cdr.markForCheck(); },
      complete: () => { this.connected = false; this.cdr.markForCheck(); }
    });
    
  }

  disconnect(): void {
    this.alertSvc.disconnectWs();
    this.connected = false;
    this.cdr.markForCheck();
    this.sub?.unsubscribe();
  }

  clearFeed(): void {
    this.feed = [];
    this.stats.forEach(s => s.count = 0);
    this.cdr.markForCheck();
  }

  private onMessage(msg: any): void {
    if (!msg || (!msg.alert_id && !msg.alert_type && !msg.id)) return;
    const alertId = msg.alert_id || msg.id;
    const item: FeedItem = {
      id:          alertId || Date.now().toString(),
      alert_type:  msg.alert_type  || 'unknown',
      severity:    msg.severity    || 'low',
      description: msg.description || '',
      zone_id:     msg.zone_id     || '',
      zone_name:   msg.zone_name   || '',
      worker_id:   msg.worker_id   || '',
      full_name:   msg.full_name   || '',
      time:        new Date(),
      isNew:       true
    };
    this.feed = [item, ...this.feed].slice(0, 100);
    const stat = this.stats.find(s => s.key === item.severity);
    if (stat) stat.count++;
    this.cdr.markForCheck();
    setTimeout(() => { item.isNew = false; this.cdr.markForCheck(); }, 3000);
    if (item.severity === 'critical') this.playAlert();

    // Fallback: hydrate from REST when WS payload missed full_name / zone_name
    if (alertId && (!item.full_name || !item.zone_name)) {
      this.alertSvc.get(alertId).subscribe({
        next: (a: any) => {
          item.full_name = a?.full_name ?? item.full_name;
          item.zone_name = a?.zone_name ?? item.zone_name;
          item.worker_id = a?.worker_id ?? item.worker_id;
          item.zone_id   = a?.zone_id   ?? item.zone_id;
          this.cdr.markForCheck();
        },
        error: () => {},
      });
    }
  }

  private playAlert(): void {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.connect(ctx.destination);
      osc.frequency.value = 880;
      console.log('Playing alert sound ', osc);
      osc.start(); setTimeout(() => osc.stop(), 200);
    } catch {}
  }

  formatType(t: string): string {
    return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  ngOnDestroy(): void { this.disconnect(); }
}