import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, TokenResponse, Worker } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http       = inject(HttpClient);
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  private readonly BASE = 'http://localhost:8002';
  private _user$ = new BehaviorSubject<Worker | null>(null);
  user$ = this._user$.asObservable();

  login(body: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.BASE}/api/auth/login`, body).pipe(
      tap(res => {
        if (this.isBrowser) localStorage.setItem('token', res.access_token);
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
    if (this.isBrowser) localStorage.removeItem('token');
    this._user$.next(null);
    this.router.navigate(['/login']);
  }

  get token(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  get isLoggedIn(): boolean  { return !!this.token; }
  get currentUser(): Worker | null { return this._user$.value; }
}