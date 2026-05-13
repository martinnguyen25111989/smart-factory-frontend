# PPE Alert System - Frontend

A complete Angular 21+ frontend for the PPE (Personal Protective Equipment) Alert System with real-time monitoring, worker management, and safety reporting.

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts              # Route protection with JWT validation
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts        # HTTP interceptor for JWT tokens & refresh
│   │   └── services/
│   │       ├── auth.service.ts            # Authentication & user management
│   │       ├── alert.service.ts           # Alert management + WebSocket
│   │       ├── worker.service.ts          # Worker CRUD operations
│   │       ├── zone.service.ts            # Zone management
│   │       └── report.service.ts          # Report generation & analytics
│   ├── pages/
│   │   ├── login/                         # Login page
│   │   ├── dashboard/                     # Real-time dashboard
│   │   ├── sensors-realtime/              # WebSocket live feed
│   │   ├── workers/                       # Worker management
│   │   ├── alerts/                        # Alert management
│   │   ├── reports/                       # Reports & analytics
│   │   └── zone-management/               # Zone configuration
│   ├── app.ts                             # Root component with navigation
│   ├── app.routes.ts                      # Route configuration
│   ├── app.config.ts                      # App configuration
│   ├── app.html                           # Root template
│   └── app.scss                           # Root styles
├── main.ts                                # Bootstrap entry point
├── index.html                             # HTML template
└── styles.scss                            # Global styles
```

## Features

### ✅ Authentication & Security
- **JWT-based Login**: Secure username/password authentication
- **Token Management**: Automatic token refresh with interceptor
- **Route Guards**: Protected routes with auth validation
- **Automatic Logout**: Session timeout and error handling

### 📊 Dashboard
- Real-time alert statistics
- Worker and zone overview
- Active alerts feed
- Alert severity distribution
- Status indicators

### 🔴 Real-Time Sensors
- WebSocket connection for live alerts
- Auto-reconnection with exponential backoff
- Alert acknowledgment and resolution
- Real-time message counter
- Connection status indicator

### 👷 Worker Management
- CRUD operations for workers
- Department and role assignment
- Zone assignments
- Worker status tracking (Active, Inactive, On Leave)
- PPE assignment management
- Search and filter

### ⚠️ Alert Management
- Alert filtering by status and severity
- Search functionality
- Bulk actions (acknowledge, resolve, delete)
- Color-coded severity levels
- Full alert history
- Real-time updates

### 📍 Zone Management
- Zone CRUD with location coordinates
- Risk level classification (Low, Medium, High, Critical)
- Required PPE configuration
- Worker assignment to zones
- Zone status tracking
- Search and filter

### 📈 Reports & Analytics
- Report generation with date range
- Multiple report types:
  - Alert Summary
  - Worker Performance
  - Zone Safety
  - Incident Analysis
- Key metrics display
- Top incident zones and workers
- Export to PDF and CSV
- Trend analysis

## Services

### AuthService
Manages user authentication and session:
```typescript
login(credentials)           // User login
logout()                     // User logout
getToken()                   // Get stored JWT token
isLoggedIn()                 // Check auth status
getCurrentUser()             // Get current user data
refreshToken()               // Refresh JWT token
```

### AlertService
Handles alert management and WebSocket:
```typescript
getAlerts()                  // Fetch all alerts
getAlertById(id)             // Fetch single alert
getAlertStats()              // Get statistics
createAlert(alert)           // Create new alert
updateAlertStatus(id, status) // Update status
resolveAlert(id)             // Mark as resolved
acknowledgeAlert(id)         // Mark as acknowledged
getRealtimeAlerts()          // WebSocket stream
```

### WorkerService
Worker management operations:
```typescript
getWorkers()                 // Fetch all workers
getWorkerById(id)            // Get single worker
createWorker(worker)         // Create new worker
updateWorker(id, data)       // Update worker
deleteWorker(id)             // Delete worker
getWorkerStats()             // Get statistics
assignPPE(workerId, peeId)   // Assign PPE
unassignPPE(workerId, peeId) // Remove PPE
```

### ZoneService
Zone management operations:
```typescript
getZones()                   // Fetch all zones
getZoneById(id)              // Get single zone
createZone(zone)             // Create new zone
updateZone(id, data)         // Update zone
deleteZone(id)               // Delete zone
getZoneStats()               // Get statistics
assignWorkerToZone()         // Assign worker
removeWorkerFromZone()       // Remove worker
```

### ReportService
Report generation and analytics:
```typescript
getReports()                 // Fetch all reports
generateReport(config)       // Generate new report
getReportMetrics()           // Get key metrics
getAlertTrendData()          // Chart data for trends
getAlertTypeDistribution()   // Alert type breakdown
getSeverityDistribution()    // Severity breakdown
exportReportPDF(id)          // Export as PDF
exportReportCSV(id)          // Export as CSV
```

## Technology Stack

- **Framework**: Angular 21+
- **Language**: TypeScript 5.9+
- **Styling**: SCSS
- **HTTP Client**: HttpClientModule
- **Forms**: ReactiveFormsModule + FormsModule
- **Routing**: Angular Router
- **Real-time**: RxJS WebSocket
- **State Management**: Signals & Observables

## Key Angular 21+ Features Used

✅ **Standalone Components** - All components are standalone (no NgModules)
✅ **Modern Control Flow** - Using @if, @for, @switch instead of *ngIf, *ngFor
✅ **Signals** - Reactive state management with signals
✅ **Typed Forms** - Strongly typed reactive forms
✅ **Dependency Injection** - Using inject() function
✅ **Route Guards** - Functional guard implementation
✅ **HTTP Interceptors** - Request/response transformation
✅ **ChangeDetectionStrategy.OnPush** - Optional optimization ready

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm 10+

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`

### Build for Production
```bash
npm run build
```

Output will be in `dist/`

### Testing
```bash
npm test
```

## Environment Configuration

Update API endpoints in services:
- `AuthService`: `http://localhost:8002/api/auth`
- `AlertService`: `http://localhost:8001/api/alerts` + WebSocket `ws://localhost:8001/ws/alerts`
- `WorkerService`: `http://localhost:8002/api/workers`
- `ZoneService`: `http://localhost:8002/api/zones`
- `ReportService`: `http://localhost:8003/api/reports`

## Navigation Routes

| Route | Component | Auth Required |
|-------|-----------|---|
| `/login` | LoginComponent | ❌ |
| `/dashboard` | DashboardComponent | ✅ |
| `/sensors` | SensorsRealtimeComponent | ✅ |
| `/workers` | WorkersComponent | ✅ |
| `/alerts` | AlertsComponent | ✅ |
| `/zones` | ZoneManagementComponent | ✅ |
| `/reports` | ReportsComponent | ✅ |

## Authentication Flow

1. **Login**: User submits credentials
2. **Token Received**: Server returns JWT token
3. **Token Storage**: Token stored in localStorage
4. **Interceptor**: JWT automatically added to requests
5. **Auto-Refresh**: Interceptor refreshes expired tokens
6. **Logout**: Token cleared, user redirected to login

## WebSocket Connection

The alert service maintains WebSocket connection for real-time updates:

```typescript
// Subscribe to real-time alerts
alertService.getRealtimeAlerts().subscribe(alert => {
  // Handle new alert
});

// Automatic reconnection with exponential backoff
// Max 5 reconnection attempts
// Base delay: 3 seconds
```

## Styling & Design System

- **Color Palette**: Blue/Purple gradient primary, complementary alerts
- **Spacing**: 8px base unit
- **Typography**: System fonts for performance
- **Responsive**: Mobile-first, breakpoints at 768px, 1024px
- **Accessibility**: WCAG AA compliant, focus indicators

## Error Handling

- **HTTP Errors**: Caught by interceptor, 401 triggers refresh
- **Network Errors**: User feedback with retry options
- **Form Validation**: Real-time validation with error messages
- **WebSocket**: Automatic reconnection with status indicator

## Performance Optimizations

- ✅ OnPush change detection strategy (components ready)
- ✅ TrackBy functions in lists
- ✅ Lazy loading in routing (configurable)
- ✅ HTTP request caching (BehaviorSubject)
- ✅ Unsubscribe handling with takeUntilDestroyed

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Development Guidelines

### Creating New Components
```bash
ng generate component features/my-component
```

### Creating New Services
```bash
ng generate service core/services/my-service
```

### Code Style
- Follow Angular style guide
- Use strict TypeScript
- Proper error handling
- Components under 200 lines
- Services focused on single responsibility

## Deployment

### Docker
```dockerfile
FROM node:18 as builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### Environment Variables
Create `.env.production`:
```
API_URL=https://api.production.com
WS_URL=wss://api.production.com
```

## Troubleshooting

### Login Issues
- Check backend API is running on http://localhost:3000
- Verify credentials in demo data
- Check CORS configuration

### WebSocket Connection Failed
- Ensure WebSocket URL is correct
- Check firewall settings
- Verify CORS WebSocket headers

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Angular cache: `ng cache clean`
- Check TypeScript version compatibility

## Contributing

1. Follow Angular best practices
2. Use standalone components
3. Add proper TypeScript types
4. Include error handling
5. Test on multiple browsers
6. Update documentation

## License

MIT License - PPE Alert System

## Support

For issues or questions:
1. Check documentation
2. Review error messages
3. Check browser console for errors
4. Verify API connection
5. Contact development team
