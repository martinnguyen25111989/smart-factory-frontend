import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  {
    path: '',
    loadComponent: () => import('./app.shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'sensors',   loadComponent: () => import('./pages/sensors/sensors').then(m => m.Sensors) },
      { path: 'alerts',    loadComponent: () => import('./pages/alerts/alerts').then(m => m.Alerts) },
      { path: 'workers',   loadComponent: () => import('./pages/workers/workers').then(m => m.Workers) },
      { path: 'zones',     loadComponent: () => import('./pages/zones/zones').then(m => m.Zones) },
      { path: 'reports',   loadComponent: () => import('./pages/reports/reports').then(m => m.Reports) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
