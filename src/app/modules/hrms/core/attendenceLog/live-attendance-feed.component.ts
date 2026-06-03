import { Component, OnInit, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { interval, of } from 'rxjs';
import { catchError, switchMap, startWith } from 'rxjs/operators';

// Services
import { MessageService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';

// PrimeNG Utilities (Kept only non-structural components)
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-live-attendance-feed',
  standalone: true,
  imports: [
    CommonModule, 
    SkeletonModule, 
    TooltipModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="crextio-theme-wrapper fade-in">
      
      <!-- Top Navigation / Header Area -->
      <header class="crextio-header mb-5 slide-down">
        <div class="flex-align gap-4">
          <!-- Custom Glowing Pulse Indicator -->
          <div class="live-pulse-wrapper flex-shrink-0">
            <div class="live-dot"></div>
            <div class="live-ping"></div>
          </div>
          
          <div class="header-titles">
            <h1 class="page-title">Live Feed</h1>
            <p class="page-subtitle text-secondary">Real-time organizational punches</p>
          </div>
        </div>
        
        <div class="header-controls hidden-mobile">
          <div class="time-pill">
            <i class="pi pi-clock text-muted"></i>
            <span class="font-mono">{{ currentTime() | date:'HH:mm:ss' }}</span>
          </div>
        </div>
      </header>

      @if (isLoading() && feedLogs().length === 0) {
        <div class="grid-layout p-4">
          <p-skeleton height="180px" borderRadius="24px"></p-skeleton>
          <p-skeleton height="180px" borderRadius="24px"></p-skeleton>
          <p-skeleton height="180px" borderRadius="24px"></p-skeleton>
          <p-skeleton height="180px" borderRadius="24px"></p-skeleton>
          <p-skeleton height="180px" borderRadius="24px"></p-skeleton>
        </div>
      } @else {
        
        <div class="grid-layout">
          @for (log of feedLogs(); track log._id; let i = $index) {
            
            <!-- Custom Theme Card -->
            <div class="crextio-card slide-down" [style.animation-delay]="(i * 0.05) + 's'">
              
              <!-- Card Header -->
              <div class="card-header flex-between border-bottom-dashed pb-3">
                <div class="status-pill" [ngClass]="'status-' + getTypeClass(log.type)">
                  <span class="status-dot"></span>
                  {{ formatType(log.type) }}
                </div>
                
                <div class="flex-col text-right">
                  <span class="font-bold font-mono text-main">{{ log.timestamp | date:'HH:mm:ss' }}</span>
                  <span class="text-xs text-muted">{{ log.timestamp | date:'dd MMM yyyy' }}</span>
                </div>
              </div>

              <!-- Card Body (User Info) -->
              <div class="card-body flex-align gap-4 py-4">
                <div class="user-avatar">
                  {{ getInitials(log.user?.name) }}
                </div>
                <div class="flex-col gap-1">
                  <span class="font-bold text-main name-truncate" [pTooltip]="log.user?.name">{{ log.user?.name || 'Unknown User' }}</span>
                  <span class="text-xs text-muted font-mono">{{ log.user?.employeeProfile?.employeeId || (log.user?._id | slice:0:8) }}</span>
                </div>
              </div>

              <!-- Card Footer (Meta Info) -->
              <div class="card-footer bg-light border-top-dashed pt-3 mt-auto flex-between text-xs text-muted">
                <span class="flex-align gap-2 capitalize">
                  <i class="pi text-main" [ngClass]="getSourceIcon(log.source)"></i> {{ log.source }}
                </span>
                
                @if (log.location?.geoJson?.coordinates) {
                  <span class="flex-align gap-2">
                    <i class="pi pi-map-marker"></i> 
                    Geo-Logged
                  </span>
                }
              </div>
            </div>
            
          }
        </div>

        @if (feedLogs().length === 0) {
          <div class="empty-state">
            <div class="spinner-ring mb-4"></div>
            <h3 class="font-bold text-main text-lg mb-2">Awaiting Punches</h3>
            <p class="text-secondary text-sm m-0">The live feed will update automatically when an employee clocks in or out.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    /* =========================================================
       THEME TOKENS 
       ========================================================= */
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background-color: #9AA3AD; /* Backdrop color outside the app */
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      
      /* Colors */
      --c-bg-app: #F5F6F8;
      --c-bg-card: #FFFFFF;
      --c-text-main: #1A1A1A;
      --c-text-muted: #8E8E93;
      --c-text-light: #BDBDBD;
      --c-accent-yellow: #FCDA68;
      --c-border: #E5E5EA;
      
      /* Status Colors */
      --c-status-green-bg: #E8F5E9;
      --c-status-green-dot: #4CAF50;
      --c-status-green-text: #2E7D32;
      
      --c-status-gray-bg: #F0F0F0;
      --c-status-gray-dot: #9E9E9E;
      --c-status-gray-text: #616161;
      
      --c-status-red-bg: #FFEBEE;
      --c-status-red-dot: #F44336;
      --c-status-red-text: #C62828;

      /* Radii & Spacing */
      --radius-app: 32px;
      --radius-card: 24px;
      --radius-pill: 50px;
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 16px;
      --spacing-lg: 24px;
      --spacing-xl: 32px;
    }

    /* =========================================================
       LAYOUT & UTILITIES 
       ========================================================= */
    .crextio-theme-wrapper {
      background: var(--c-bg-app);
      border-radius: var(--radius-app);
      padding: var(--spacing-xl);
      width: 100%; /* Fully spans the host container */
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
      min-height: 80vh;
    }

    /* Soft top-right gradient */
    .crextio-theme-wrapper::before {
      content: '';
      position: absolute;
      top: -100px;
      right: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(252,218,104,0.3) 0%, rgba(245,246,248,0) 70%);
      z-index: 0;
      pointer-events: none;
    }

    .flex-col { display: flex; flex-direction: column; }
    .flex-align { display: flex; align-items: center; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    
    /* Responsive grid expands automatically across full width */
    .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg); position: relative; z-index: 1; }
    
    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
    .gap-4 { gap: var(--spacing-md); }
    .py-4 { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
    .pt-3 { padding-top: 12px; }
    .pb-3 { padding-bottom: 12px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-4 { margin-bottom: var(--spacing-md); }
    .mb-5 { margin-bottom: var(--spacing-xl); }
    .m-0 { margin: 0; }
    .mt-auto { margin-top: auto; }
    .text-right { text-align: right; }
    
    .text-main { color: var(--c-text-main); }
    .text-muted { color: var(--c-text-muted); }
    .font-bold { font-weight: 600; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 0.5px; }
    .text-xs { font-size: 12px; }
    .text-sm { font-size: 14px; }
    .text-lg { font-size: 18px; }
    .capitalize { text-transform: capitalize; }
    
    .border-bottom-dashed { border-bottom: 1px dashed var(--c-border); }
    .border-top-dashed { border-top: 1px dashed var(--c-border); }

    /* =========================================================
       HEADER 
       ========================================================= */
    .crextio-header {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .page-title { font-size: 28px; font-weight: 400; color: var(--c-text-main); margin: 0 0 4px 0; letter-spacing: -0.02em; }
    .page-subtitle { margin: 0; font-size: 14px; }

    .time-pill {
      background: var(--c-bg-card);
      border: 1px dashed var(--c-border);
      padding: 10px 20px;
      border-radius: var(--radius-pill);
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--c-text-main);
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }

    /* Live Pulse */
    .live-pulse-wrapper { position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
    .live-dot { width: 12px; height: 12px; background-color: var(--c-status-red-dot); border-radius: 50%; z-index: 2; position: relative; }
    .live-ping { position: absolute; width: 12px; height: 12px; background-color: var(--c-status-red-dot); border-radius: 50%; animation: livePing 2s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: 1; }
    @keyframes livePing { 75%, 100% { transform: scale(3.5); opacity: 0; } }

    /* =========================================================
       CARDS 
       ========================================================= */
    .crextio-card {
      background: var(--c-bg-card);
      border-radius: var(--radius-card);
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      border: 1px solid transparent;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      transition: all 0.3s ease;
      height: 100%;
    }
    
    .crextio-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.06);
      border-color: var(--c-accent-yellow);
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--c-accent-yellow);
      color: var(--c-text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
    }

    .name-truncate { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

    /* Status Pills */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    
    .status-green { background: var(--c-status-green-bg); color: var(--c-status-green-text); }
    .status-green .status-dot { background: var(--c-status-green-dot); }
    
    .status-gray { background: var(--c-status-gray-bg); color: var(--c-status-gray-text); }
    .status-gray .status-dot { background: var(--c-status-gray-dot); }
    
    .status-red { background: var(--c-status-red-bg); color: var(--c-status-red-text); }
    .status-red .status-dot { background: var(--c-status-red-dot); }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: var(--c-bg-card);
      border-radius: var(--radius-card);
      border: 1px dashed var(--c-border);
      text-align: center;
      position: relative;
      z-index: 1;
    }
    
    .spinner-ring {
      width: 40px;
      height: 40px;
      border: 3px solid var(--c-border);
      border-top-color: var(--c-accent-yellow-dark, #D4B447);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Animations */
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s ease; }
    .slide-down { animation: slideDown 0.4s ease forwards; opacity: 0; }
    
    @media (max-width: 768px) {
      .hidden-mobile { display: none !important; }
      :host { padding: 1rem; }
    }
  `]
})
export class LiveAttendanceFeedComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private destroyRef = inject(DestroyRef);

  feedLogs = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  currentTime = signal<Date>(new Date());

  ngOnInit() {
    // 1. Clock Ticker
    interval(1000).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.currentTime.set(new Date()));

    // 2. Realtime Feed Polling (Every 10 seconds)
    interval(10000).pipe(
      startWith(0),
      switchMap(() => this.hrmsService.getRealtimeFeed(20).pipe(
        catchError(() => of({ data: { recent: [] } })) 
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((res: any) => {
      this.isLoading.set(false);
      // Safely extracting the recent logs from the JSON structure
      const logs = res?.data?.recent || res?.data?.logs || res?.data || [];
      this.feedLogs.set(Array.isArray(logs) ? logs : []);
    });
  }

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatType(type: string): string {
    return type?.replace('_', ' ') || 'Log';
  }

  getTypeClass(type: string): string {
    const normalizeType = (type || '').toLowerCase();
    if (normalizeType.includes('in') && !normalizeType.includes('remote')) return 'green';
    if (normalizeType.includes('out')) return 'gray';
    if (normalizeType.includes('remote_in') || normalizeType.includes('break')) return 'red'; // Highlighting remote punches
    return 'gray';
  }

  getSourceIcon(source: string): string {
    switch (source?.toLowerCase()) {
      case 'machine': 
      case 'biometric': 
      case 'rfid': return 'pi-server';
      case 'mobile': return 'pi-mobile';
      case 'web': return 'pi-desktop';
      case 'admin_manual': return 'pi-user-edit';
      default: return 'pi-cloud';
    }
  }
}
