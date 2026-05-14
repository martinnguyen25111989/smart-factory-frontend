import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule} from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkerService } from '../../core/services/api.services';
import { Worker, Zone, Shift } from '../../core/models/models';

@Component({
  selector: 'app-workers',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './workers.html',
  styleUrl: './workers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Workers implements OnInit {
  private workerSvc = inject(WorkerService);
  private snack     = inject(MatSnackBar);
  private fb        = inject(FormBuilder);
  private cdr       = inject(ChangeDetectorRef);

  workers:    Worker[] = [];
  zones:      Zone[]   = [];
  shifts:     Shift[]  = [];
  loading     = false;
  showDialog  = false;
  editMode    = false;
  editId      = '';

  form = this.fb.group({
    employee_id: ['', Validators.required],
    full_name:   ['', Validators.required],
    email:       ['', [Validators.required, Validators.email]],
    password:    [''],
    role:        ['worker', Validators.required],
    zone_id:     [''],
    shift_id:    ['']
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.workerSvc.list().subscribe({
      next: w => { this.workers = w; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
    this.workerSvc.zones().subscribe(z => { this.zones = z; this.cdr.markForCheck(); });
    this.workerSvc.shifts().subscribe(s => { this.shifts = s; this.cdr.markForCheck(); });
  }

  openCreate(): void {
    this.editMode = false; this.editId = '';
    this.form.reset({ role: 'worker' });
    this.form.get('password')?.setValidators(Validators.required);
    this.form.get('password')?.updateValueAndValidity();
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  openEdit(w: Worker): void {
    this.editMode = true; this.editId = w.id;
    this.form.patchValue({ employee_id: w.employee_id, full_name: w.full_name, email: w.email, role: w.role, zone_id: w.zone_id || '', shift_id: w.shift_id || '' });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  closeDialog(): void { this.showDialog = false; this.cdr.markForCheck(); }

  save(): void {
    const v = this.form.value as any;
    const obs = this.editMode ? this.workerSvc.update(this.editId, v) : this.workerSvc.create(v);
    obs.subscribe({
      next: () => {
        this.snack.open(this.editMode ? '✓ Worker updated' : '✓ Worker created', '', { duration: 2000 });
        this.closeDialog(); this.load();
        this.cdr.markForCheck();
      },
      error: () => { this.snack.open('❌ Operation failed', '', { duration: 2000 }); this.cdr.markForCheck(); }
    });
  }

  deactivate(w: Worker): void {
    this.workerSvc.delete(w.id).subscribe({
      next: () => { this.snack.open('Worker deactivated', '', { duration: 2000 }); this.load(); this.cdr.markForCheck(); },
      error: () => { this.snack.open('❌ Failed', '', { duration: 2000 }); this.cdr.markForCheck(); }
    });
  }

  zoneName(id: string | null): string { return this.zones.find(z => z.id === id)?.name || '—'; }
  shiftName(id: string | null): string { return this.shifts.find(s => s.id === id)?.name || '—'; }
}