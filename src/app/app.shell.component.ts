import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    styleUrl: './app.scss',
  template: `
<div class="shell">

  <!-- Sidebar -->
  <aside class="sidebar">

    <!-- Logo -->
    <div class="logo">
      <div class="logo-icon">🏭</div>
      <div>
        <div class="logo-text">Smart Factory</div>
        <div class="logo-sub">PPE Alert System</div>
      </div>
    </div>

    <!-- Nav -->
    <nav>
      <div class="nav-label">Main</div>
      @for (item of navItems; track item.route) {
        <a class="nav-item"
           [routerLink]="item.route"
           routerLinkActive="active">
          <span class="nav-icon">{{item.icon}}</span>
          <span>{{item.label}}</span>
        </a>
      }
    </nav>

    <!-- User -->
    @if (auth.user$ | async; as user) {
      <div class="user-bar">
        <div class="avatar">{{user.full_name[0]}}</div>
        <div style="flex:1;min-width:0;overflow:hidden">
          <div class="user-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            {{user.full_name}}
          </div>
          <div class="user-role">{{user.role | titlecase}}</div>
        </div>
        <button class="logout-btn" (click)="auth.logout()" title="Logout">⎋</button>
      </div>
    }

  </aside>

  <!-- Content -->
  <main class="main">
    <router-outlet />
  </main>

</div>
  `
})
export class ShellComponent implements OnInit {
  auth = inject(AuthService);

  navItems: NavItem[] = [
    { label: 'Dashboard',    icon: '▦',  route: '/dashboard' },
    { label: 'Live Sensors', icon: '📡', route: '/sensors'   },
    { label: 'Alerts',       icon: '🔔', route: '/alerts'    },
    { label: 'Workers',      icon: '👷', route: '/workers'   },
    { label: 'Zones',        icon: '🗺', route: '/zones'     },
    { label: 'Reports',      icon: '📊', route: '/reports'   },
  ];

  ngOnInit(): void { this.auth.loadMe(); }
}