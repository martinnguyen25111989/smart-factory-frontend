import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ReportService } from '../../core/services/api.services';
import { AlertSummary } from '../../core/models/models';

interface SummaryCard {
  label: string;
  value: number;
  color: string;
  cls: string;
}

interface SummaryCardDef {
  label: string;
  key: keyof AlertSummary;
  color: string;
  cls: string;
}

const ZONE_PALETTE = ['#4f52e8', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6'];

const SUMMARY_CARD_DEFS: SummaryCardDef[] = [
  { label: 'Total',    key: 'total',    color: '#818cf8', cls: 'c-purple' },
  { label: 'Open',     key: 'open',     color: '#60a5fa', cls: 'c-blue'   },
  { label: 'Critical', key: 'critical', color: '#f87171', cls: 'c-red'    },
  { label: 'High',     key: 'high',     color: '#fbbf24', cls: 'c-amber'  },
  { label: 'Medium',   key: 'medium',   color: '#38bdf8', cls: 'c-sky'    },
  { label: 'Low',      key: 'low',      color: '#4ade80', cls: 'c-green'  },
];

const TOOLTIP = {
  backgroundColor: '#0d1117',
  borderColor: '#161d2e',
  borderWidth: 1,
  titleColor: '#e2e8f0',
  bodyColor: '#64748b',
} as const;

const AXIS_TICKS  = { color: '#334155', font: { size: 11 } } as const;
const AXIS_GRID   = { color: '#0a0d14' } as const;
const AXIS_BORDER = { color: '#161d2e' } as const;

@Component({
  selector: 'app-reports',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports implements OnInit {
  reportSvc = inject(ReportService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  days = 7;
  dayOptions = [7, 14, 30, 90];
  summary: AlertSummary | null = null;
  summaryCards: SummaryCard[] = [];

  trendData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Alerts', backgroundColor: '#4f52e8', borderRadius: 5 }],
  };
  zoneData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ZONE_PALETTE, borderWidth: 0 }],
  };
  ppeData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Violations', backgroundColor: '#f59e0b', borderRadius: 6 }],
  };

  barOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: TOOLTIP },
    scales: {
      x: { ticks: AXIS_TICKS, grid: AXIS_GRID, border: AXIS_BORDER },
      y: { ticks: AXIS_TICKS, grid: AXIS_GRID, border: AXIS_BORDER },
    },
  };

  pieOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'right', labels: { color: '#475569', boxWidth: 10, font: { size: 11 } } },
      tooltip: TOOLTIP,
    },
  };

  hbarOpts: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: TOOLTIP },
    scales: {
      x: { ticks: AXIS_TICKS, grid: AXIS_GRID, border: AXIS_BORDER },
      y: {
        ticks: { color: '#94a3b8', font: { size: 12 } },
        grid: { display: false },
        border: AXIS_BORDER,
      },
    },
  };

  ngOnInit(): void {
    this.load();
  }

  setDays(d: number): void {
    this.days = d;
    this.load();
  }

  load(): void {
    this.reportSvc.summary(this.days)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => {
        this.summary = s;
        this.summaryCards = SUMMARY_CARD_DEFS.map(d => ({
          label: d.label,
          value: s[d.key],
          color: d.color,
          cls: d.cls,
        }));
        this.cdr.markForCheck();
      });

    this.reportSvc.dailyTrend(this.days)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(t => {
        this.trendData = {
          labels: t.map(x => x.day.slice(5)),
          datasets: [{ data: t.map(x => x.count), label: 'Alerts', backgroundColor: '#4f52e8', borderRadius: 5 }],
        };
        this.cdr.markForCheck();
      });

    this.reportSvc.byZone(this.days)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(z => {
        this.zoneData = {
          labels: z.map(x => x.zone_name),
          datasets: [{ data: z.map(x => x.count), backgroundColor: ZONE_PALETTE, borderWidth: 0 }],
        };
        this.cdr.markForCheck();
      });

    this.reportSvc.ppeCompliance(this.days)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => {
        this.ppeData = {
          labels: p.map(x => x.type.replace('ppe_', '').replace(/_/g, ' ')),
          datasets: [{ data: p.map(x => x.count), label: 'Violations', backgroundColor: '#f59e0b', borderRadius: 6 }],
        };
        this.cdr.markForCheck();
      });
  }
}
