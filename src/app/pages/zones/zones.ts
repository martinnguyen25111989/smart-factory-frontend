import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../core/services/api.services';

interface Zone {
  id: string;
  name: string;
  status: string;
  workers: number;
  alerts: number;
}

@Component({
  selector: 'app-zones',
  imports: [CommonModule],
  templateUrl: './zones.html',
  styleUrl: './zones.css',
})
export class Zones implements OnInit {
  private alertSvc = inject(AlertService);

  zones: Zone[] = [];
  loading = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    // Simulate loading zones
    setTimeout(() => {
      this.zones = [
        { id: 'Z001', name: 'Assembly Line A', status: 'active', workers: 8, alerts: 2 },
        { id: 'Z002', name: 'Warehouse B', status: 'active', workers: 12, alerts: 0 },
        { id: 'Z003', name: 'Quality Check', status: 'inactive', workers: 3, alerts: 1 },
      ];
      this.loading = false;
    }, 500);
  }

  trackByZoneId(index: number, zone: Zone): string {
    return zone.id;
  }
}
