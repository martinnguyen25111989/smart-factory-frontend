import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkerService } from '../../core/services/api.services';
import { Zone, Shift } from '../../core/models/models';


@Component({
  selector: 'app-zones',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './zones.html',
  styleUrl: './zones.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Zones implements OnInit {
  private workerSvc = inject(WorkerService);
  private snack     = inject(MatSnackBar);
  private fb        = inject(FormBuilder);
  private cdr       = inject(ChangeDetectorRef);

  zones:  Zone[]  = [];
  shifts: Shift[] = [];
  showZoneDialog  = false;
  showShiftDialog = false;

  zoneForm  = this.fb.group({ name: ['', Validators.required], location: [''], description: [''] });
  shiftForm = this.fb.group({ name: ['', Validators.required], start_time: ['', Validators.required], end_time: ['', Validators.required] });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.workerSvc.zones().subscribe(z => { this.zones = z; this.cdr.markForCheck(); });
    this.workerSvc.shifts().subscribe(s => { this.shifts = s; this.cdr.markForCheck(); });
  }

  saveZone(): void {
    if (this.zoneForm.invalid) return;
    this.workerSvc.createZone(this.zoneForm.value).subscribe({
      next: () => { this.snack.open('✓ Zone created', '', { duration: 2000 }); this.showZoneDialog = false; this.cdr.markForCheck(); this.load(); },
      error: () => { this.snack.open('❌ Failed', '', { duration: 2000 }); this.cdr.markForCheck(); }
    });
  }

  saveShift(): void {
    if (this.shiftForm.invalid) return;
    const formValue = this.shiftForm.value as any;
    const payload = {
      ...formValue,
      start_time: formValue.start_time ? `${formValue.start_time}:00` : '',
      end_time: formValue.end_time ? `${formValue.end_time}:00` : ''
    };
    this.workerSvc.createShift(payload).subscribe({
      next: () => { this.snack.open('✓ Shift created', '', { duration: 2000 }); this.showShiftDialog = false; this.cdr.markForCheck(); this.load(); },
      error: () => { this.snack.open('❌ Failed', '', { duration: 2000 }); this.cdr.markForCheck(); }
    });
  }

  calcHours(start: string, end: string): number {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 1440;
    return Math.round(diff / 60);
  }

  shiftPercent(start: string, end: string): number {
    return Math.min(100, (this.calcHours(start, end) / 24) * 100);
  }
}