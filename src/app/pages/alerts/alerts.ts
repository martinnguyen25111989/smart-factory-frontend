import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { AlertService, WorkerService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { Alert } from '../../core/models/models';

@Component({
  selector: 'app-alerts',
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Alerts implements OnInit {
  private alertSvc  = inject(AlertService);
  private workerSvc = inject(WorkerService);
  private authSvc   = inject(AuthService);
  private snack     = inject(MatSnackBar);
  private cdr       = inject(ChangeDetectorRef);

  alerts: Alert[] = [];
  loading = false;
  filterStatus   = '';
  filterSeverity = '';

  workerNames: Record<string, string> = {};
  zoneNames:   Record<string, string> = {};

  pageSize = 10;
  currentPage = 1;
  totalAlerts = 0;

  ngOnInit(): void {
    forkJoin({
      workers: this.workerSvc.list(1000),
      zones:   this.workerSvc.zones(),
    }).subscribe(({ workers, zones }) => {
      this.workerNames = Object.fromEntries(workers.map(w => [w.id, w.full_name]));
      this.zoneNames   = Object.fromEntries(zones.map(z => [z.id, z.name]));
      this.cdr.markForCheck();
    });
    this.load();
  }

  workerName(id: string | null): string { return id ? (this.workerNames[id] ?? '—') : '—'; }
  zoneName(id: string | null):   string { return id ? (this.zoneNames[id]   ?? '—') : '—'; }

  setStatus(s: string):   void { this.filterStatus   = s; this.currentPage = 1; this.cdr.markForCheck(); this.load(); }
  setSeverity(s: string): void { this.filterSeverity = s; this.currentPage = 1; this.cdr.markForCheck(); this.load(); }

  load(): void {
    this.loading = true;
    this.alertSvc.list(
      this.filterStatus   || undefined,
      this.filterSeverity || undefined,
      1000
    ).subscribe({
      next: a => { 
        this.totalAlerts = a.length; 
        this.alerts = this.getPaginatedAlerts(a);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getPaginatedAlerts(allAlerts: Alert[]): Alert[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return allAlerts.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalAlerts / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.markForCheck();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.load();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackByAlertId(index: number, alert: Alert): string {
    return alert.id;
  }

  trackByPage(index: number, page: number): number {
    return page;
  }

  acknowledge(alert: Alert): void {
    const userId = this.authSvc.currentUser?.id;
    if (!userId) return;
    this.alertSvc.acknowledge(alert.id, userId.toString()).subscribe({
      next: () => { this.snack.open('✓ Acknowledged', '', { duration: 2000 }); this.load(); this.cdr.markForCheck(); },
      error: () => { this.snack.open('Failed', '', { duration: 2000 }); this.cdr.markForCheck(); }
    });
  }

  resolve(alert: Alert): void {
    this.alertSvc.resolve(alert.id).subscribe({
      next: () => { this.snack.open('✓ Resolved', '', { duration: 2000 }); this.load(); this.cdr.markForCheck(); },
      error: () => { this.snack.open('Failed', '', { duration: 2000 }); this.cdr.markForCheck(); }
    });
  }

  formatType(t: string): string {
    return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}