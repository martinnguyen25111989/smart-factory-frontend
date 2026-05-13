import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
    imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
private auth    = inject(AuthService);
  private router  = inject(Router);
  private fb      = inject(FormBuilder);
  private snack   = inject(MatSnackBar);

  showPw  = false;
  loading = false;

  form = this.fb.group({
    email:    ['admin@factory.com', [Validators.required, Validators.email]],
    password: ['Admin@123', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { email, password } = this.form.value;
    console.log(this.form.value);
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.loading = false;
        this.snack.open('Invalid credentials', 'Close', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }
}
