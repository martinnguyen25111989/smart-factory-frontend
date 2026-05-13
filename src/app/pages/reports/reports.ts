import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../core/services/api.services';

interface Report {
  id: string;
  title: string;
  date: Date;
  type: string;
  events: number;
}

@Component({
  selector: 'app-reports',
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  private alertSvc = inject(AlertService);

  reports: Report[] = [];
  loading = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    // Simulate loading reports
    setTimeout(() => {
      this.reports = [
        { id: 'R001', title: 'Daily Safety Report', date: new Date(), type: 'Daily', events: 5 },
        { id: 'R002', title: 'Weekly Compliance', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), type: 'Weekly', events: 23 },
        { id: 'R003', title: 'Monthly Summary', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), type: 'Monthly', events: 87 },
      ];
      this.loading = false;
    }, 500);
  }

  trackByReportId(index: number, report: Report): string {
    return report.id;
  }
}
