import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, TokenResponse, Worker } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private readonly BASE = 'http://localhost:8002';
  private _user$ = new BehaviorSubject<Worker | null>(null);
  user$ = this._user$.asObservable();

  login(body: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.BASE}/api/auth/login`, body).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        this.loadMe();
      })
    );
  }

  loadMe(): void {
    this.http.get<Worker>(`${this.BASE}/api/auth/me`).subscribe({
      next: u => this._user$.next(u),
      error: () => this.logout()
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    this._user$.next(null);
    this.router.navigate(['/login']);
  }

  get token(): string | null { return localStorage.getItem('token'); }
  get isLoggedIn(): boolean  { return !!this.token; }
  get currentUser(): Worker | null { return this._user$.value; }
}
