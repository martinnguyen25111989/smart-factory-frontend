import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../core/services/api.services';

interface Worker {
  id: string;
  name: string;
  status: string;
}

@Component({
  selector: 'app-workers',
  imports: [CommonModule],
  templateUrl: './workers.html',
  styleUrl: './workers.css',
})
export class Workers implements OnInit {
  private alertSvc = inject(AlertService);

  workers: Worker[] = [];
  loading = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    // Simulate loading workers
    setTimeout(() => {
      this.workers = [
        { id: 'W001', name: 'John Doe', status: 'active' },
        { id: 'W002', name: 'Jane Smith', status: 'active' },
        { id: 'W003', name: 'Mike Johnson', status: 'inactive' },
      ];
      this.loading = false;
    }, 500);
  }

  trackByWorkerId(index: number, worker: Worker): string {
    return worker.id;
  }
}
