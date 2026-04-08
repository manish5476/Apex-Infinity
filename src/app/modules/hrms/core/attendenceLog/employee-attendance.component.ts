import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TimelineModule } from 'primeng/timeline';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [
    CommonModule, 
    CardModule, 
    ButtonModule, 
    TimelineModule, 
    SkeletonModule, 
    TagModule, 
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="page-wrapper fade-in flex-col w-full h-full p-xl max-w-6xl mx-auto gap-xl overflow-y-auto">
      
      <header class="glass-panel rounded-lg p-lg flex items-center gap-lg border-primary relative overflow-hidden flex-shrink-0 slide-down">
        <div class="bg-glow absolute pointer-events-none"></div>

        <div class="icon-brand flex items-center justify-center bg-primary text-white rounded-md w-12 h-12 flex-shrink-0 shadow-md z-10">
          <i class="pi pi-clock text-2xl"></i>
        </div>
        <div class="flex-col z-10">
          <h1 class="page-title font-heading text-2xl font-bold text-primary m-0 leading-tight">Time & Attendance</h1>
          <p class="page-subtitle text-secondary text-sm m-0 mt-xs">Record your daily attendance and track your working hours.</p>
        </div>
      </header>

      <div class="bento-grid w-full pb-xl">
        
        <div class="flex-col gap-xl span-1">
          
          <p-card styleClass="bento-card glass-panel text-center shadow-lg relative overflow-hidden card-anim-1">
            
            <div class="clock-display flex-col items-center justify-center mb-xl mt-md">
              <span class="time-text font-mono text-5xl font-bold text-primary leading-none tracking-tight">
                {{ currentTime() | date:'HH:mm:ss' }}
              </span>
              <span class="date-text text-sm font-medium text-secondary mt-sm uppercase tracking-wide">
                {{ currentTime() | date:'EEEE, dd MMM yyyy' }}
              </span>
            </div>

            <div class="status-indicator flex-col items-center justify-center mb-xl">
              @if (currentStatus() === 'in') {
                <div class="pulse-ring active shadow-sm"></div>
                <span class="font-bold text-success mt-md text-sm uppercase tracking-wide">Currently Clocked In</span>
                <span class="text-xs text-tertiary mt-xs font-mono">Since {{ lastPunchTime() | date:'HH:mm' }}</span>
              } @else if (currentStatus() === 'break') {
                <div class="pulse-ring break shadow-sm"></div>
                <span class="font-bold text-warning mt-md text-sm uppercase tracking-wide">On Break</span>
              } @else {
                <div class="pulse-ring inactive shadow-sm"></div>
                <span class="font-bold text-secondary mt-md text-sm uppercase tracking-wide">Currently Clocked Out</span>
              }
            </div>

            <div class="punch-actions flex-col gap-sm w-full">
              @if (currentStatus() === 'out') {
                <p-button 
                  label="Punch In" 
                  icon="pi pi-sign-in" 
                  severity="success" 
                  styleClass="w-full shadow-md py-sm text-lg font-bold" 
                  [loading]="isPunching()" 
                  (onClick)="performPunch('in')">
                </p-button>
              } @else {
                <p-button 
                  label="Punch Out" 
                  icon="pi pi-sign-out" 
                  severity="danger" 
                  styleClass="w-full shadow-md py-sm text-lg font-bold" 
                  [loading]="isPunching()" 
                  (onClick)="performPunch('out')">
                </p-button>
              }
              
              <div class="grid grid-cols-2 gap-sm w-full mt-xs">
                @if (currentStatus() === 'in') {
                  <p-button label="Start Break" icon="pi pi-coffee" severity="warn" [outlined]="true" styleClass="w-full col-span-2" [loading]="isPunching()" (onClick)="performPunch('break_start')"></p-button>
                } @else if (currentStatus() === 'break') {
                  <p-button label="End Break" icon="pi pi-play" severity="warn" [outlined]="true" styleClass="w-full col-span-2" [loading]="isPunching()" (onClick)="performPunch('break_end')"></p-button>
                } @else {
                  <p-button label="Remote In" icon="pi pi-globe" severity="secondary" [outlined]="true" styleClass="w-full col-span-2" [loading]="isPunching()" (onClick)="performPunch('remote_in')"></p-button>
                }
              </div>
            </div>
            
            <div class="location-status mt-lg text-xs font-semibold flex items-center justify-center gap-xs" [ngClass]="hasLocation() ? 'text-success' : 'text-tertiary'">
              <i class="pi" [ngClass]="hasLocation() ? 'pi-map-marker' : 'pi-compass pi-spin'"></i>
              {{ hasLocation() ? 'Location Acquired' : 'Acquiring Location...' }}
            </div>
          </p-card>

          <p-card styleClass="bento-card glass-panel shadow-sm card-anim-2">
            <div class="grid grid-cols-2 text-center w-full">
              <div class="flex-col p-sm border-right">
                <span class="text-[0.65rem] text-tertiary uppercase font-bold tracking-wide">Total Hours</span>
                <div class="flex items-baseline justify-center gap-xs mt-1">
                  <span class="text-3xl font-bold font-heading text-primary leading-none">{{ summaryStats()?.totalHours || '0.0' }}</span>
                  <span class="text-xs text-secondary font-medium">h</span>
                </div>
              </div>
              <div class="flex-col p-sm">
                <span class="text-[0.65rem] text-tertiary uppercase font-bold tracking-wide">Break Time</span>
                <div class="flex items-baseline justify-center gap-xs mt-1">
                  <span class="text-3xl font-bold font-heading text-warning leading-none">{{ summaryStats()?.breakHours || '0.0' }}</span>
                  <span class="text-xs text-secondary font-medium">h</span>
                </div>
              </div>
            </div>
          </p-card>

        </div>

        <p-card styleClass="bento-card glass-panel shadow-lg relative overflow-hidden span-2 card-anim-3 flex-col">
          
          <ng-template pTemplate="header">
            <div class="card-header-custom flex items-center gap-sm border-bottom pb-md text-primary">
              <i class="pi pi-list text-xl text-accent"></i>
              <h3 class="font-heading font-bold text-lg m-0">Today's Activity Log</h3>
            </div>
          </ng-template>
          
          <div class="flex-1 overflow-y-auto mt-md pr-sm">
            @if (isLoadingLogs()) {
              <div class="flex-col gap-lg mt-md w-full">
                <p-skeleton height="5rem" borderRadius="12px"></p-skeleton>
                <p-skeleton height="5rem" borderRadius="12px"></p-skeleton>
                <p-skeleton height="5rem" borderRadius="12px"></p-skeleton>
              </div>
            } @else {
              
              <p-timeline [value]="myLogs()" styleClass="customized-timeline w-full">
                <ng-template pTemplate="marker" let-log>
                  <div class="custom-marker shadow-sm flex items-center justify-center text-white rounded-full w-10 h-10 border-2 border-primary z-10" [ngClass]="getMarkerClass(log.type)">
                    <i [ngClass]="getLogIcon(log.type)"></i>
                  </div>
                </ng-template>
                
                <ng-template pTemplate="content" let-log>
                  <div class="p-lg bg-surface border-secondary rounded-lg mb-lg shadow-xs hover-border-accent transition-base">
                    <div class="flex-between mb-sm flex-wrap gap-sm">
                      <span class="font-bold text-primary text-md uppercase tracking-wide">{{ formatType(log.type) }}</span>
                      <span class="font-mono text-sm text-secondary font-bold bg-primary px-sm py-xs rounded border-secondary shadow-xs">{{ log.timestamp | date:'HH:mm:ss' }}</span>
                    </div>
                    
                    <div class="flex items-center flex-wrap gap-md text-xs text-secondary mt-md font-medium">
                      <span class="flex items-center gap-xs capitalize"><i class="pi pi-desktop text-tertiary"></i> {{ log.source }}</span>
                      
                      @if (log.location?.address) {
                        <span class="flex items-center gap-xs truncate max-w-[200px]" [pTooltip]="log.location.address" tooltipPosition="top">
                          <i class="pi pi-map-marker text-tertiary"></i> {{ log.location.address }}
                        </span>
                      }
                      
                      @if (log.processingStatus === 'flagged') {
                        <div style="display: inline-flex; align-items: center; box-sizing: border-box; line-height: 1;">
                          <p-tag severity="danger" value="FLAGGED" styleClass="text-[0.65rem] font-bold tracking-wide shadow-xs px-2"></p-tag>
                        </div>
                      }
                    </div>
                  </div>
                </ng-template>
              </p-timeline>
              
              @if (myLogs().length === 0) {
                <div class="empty-state flex-col items-center justify-center text-center py-5xl text-tertiary h-full">
                  <i class="pi pi-inbox text-5xl mb-md opacity-50"></i>
                  <h4 class="font-heading text-lg font-bold text-primary m-0 mb-xs">No Activity</h4>
                  <p class="m-0 text-sm font-medium">No punches recorded today.</p>
                </div>
              }
            }
          </div>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       HOST & LAYOUT UTILITIES
       ========================================================================== */
    :host { 
      display: block; 
      font-family: var(--font-body); 
      color: var(--text-primary); 
      height: 100vh;
      overflow: hidden;
    }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .items-center { align-items: center; }
    .items-baseline { align-items: baseline; }
    .justify-center { justify-content: center; }
    .flex-wrap { flex-wrap: wrap; }
    .flex-1 { flex: 1; }
    .flex-shrink-0 { flex-shrink: 0; }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .w-10 { width: 2.5rem; }
    .h-10 { height: 2.5rem; }
    .w-12 { width: 3rem; }
    .h-12 { height: 3rem; }
    
    .max-w-6xl { max-width: 1152px; }
    .max-w-\\[200px\\] { max-width: 200px; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    
    .relative { position: relative; }
    .absolute { position: absolute; }
    .z-10 { z-index: 10; }
    .overflow-hidden { overflow: hidden; }
    .overflow-y-auto { overflow-y: auto; }
    .pointer-events-none { pointer-events: none; }
    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Grid Layouts */
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .col-span-2 { grid-column: span 2; }
    
    .bento-grid { 
      display: grid; 
      grid-template-columns: 1fr 1.5fr; /* Asymmetric split */
      gap: var(--spacing-xl); 
      align-items: start; 
    }
    .span-1 { grid-column: span 1; }
    .span-2 { grid-column: span 1; } /* Defined as 2nd col below in media queries */

    /* Spacing */
    .gap-xs { gap: var(--spacing-xs); }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-md { gap: var(--spacing-md); }
    .gap-lg { gap: var(--spacing-lg); }
    .gap-xl { gap: var(--spacing-xl); }
    
    .p-0 { padding: 0; }
    .p-sm { padding: var(--spacing-sm); }
    .p-md { padding: var(--spacing-md); }
    .p-lg { padding: var(--spacing-lg); }
    .p-xl { padding: var(--spacing-xl); }
    
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .px-sm { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
    .py-xs { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
    .py-sm { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
    .pb-md { padding-bottom: var(--spacing-md); }
    .pb-xl { padding-bottom: var(--spacing-xl); }
    .pr-sm { padding-right: var(--spacing-sm); }
    .py-5xl { padding-top: var(--spacing-5xl); padding-bottom: var(--spacing-5xl); }
    
    .m-0 { margin: 0 !important; }
    .mt-xs { margin-top: var(--spacing-xs); }
    .mt-sm { margin-top: var(--spacing-sm); }
    .mt-md { margin-top: var(--spacing-md); }
    .mt-lg { margin-top: var(--spacing-lg); }
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-lg { margin-bottom: var(--spacing-lg); }
    .mb-xl { margin-bottom: var(--spacing-xl); }

    /* Typography */
    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-accent { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-warning { color: var(--color-warning); }
    .text-white { color: #ffffff; }
    
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-semibold { font-weight: var(--font-weight-semibold); }
    .font-bold { font-weight: var(--font-weight-bold); }
    
    .text-\\[0\\.65rem\\] { font-size: 0.65rem; }
    .text-xs { font-size: var(--font-size-xs); }
    .text-sm { font-size: var(--font-size-sm); }
    .text-md { font-size: var(--font-size-md); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-2xl { font-size: var(--font-size-2xl); }
    .text-3xl { font-size: var(--font-size-3xl); }
    .text-5xl { font-size: 3rem; }
    
    .text-center { text-align: center; }
    .uppercase { text-transform: uppercase; }
    .capitalize { text-transform: capitalize; }
    .tracking-wide { letter-spacing: 0.05em; }
    .tracking-tight { letter-spacing: -0.05em; }
    .leading-none { line-height: 1; }
    .leading-tight { line-height: var(--line-height-tight); }

    /* Backgrounds & Borders */
    .bg-primary { background: var(--bg-primary); }
    .bg-surface { background: var(--component-surface-raised); }
    
    .border-primary { border: var(--ui-border-width) solid var(--border-primary); }
    .border-secondary { border: var(--ui-border-width) solid var(--border-secondary); }
    .border-bottom { border-bottom: var(--ui-border-width) solid var(--border-primary); }
    .border-right { border-right: var(--ui-border-width) solid var(--border-primary); }
    .border-2 { border-width: 2px; border-style: solid; }
    
    .rounded { border-radius: var(--ui-border-radius); }
    .rounded-md { border-radius: var(--ui-border-radius-md, 8px); }
    .rounded-lg { border-radius: var(--ui-border-radius-lg); }
    .rounded-full { border-radius: 9999px; }
    
    .shadow-xs { box-shadow: var(--shadow-xs); }
    .shadow-sm { box-shadow: var(--shadow-sm); }
    .shadow-md { box-shadow: var(--shadow-md); }
    .shadow-lg { box-shadow: var(--shadow-lg); }
    
    .transition-base { transition: var(--transition-base); }
    .hover-border-accent:hover { border-color: color-mix(in srgb, var(--color-primary) 40%, transparent); transform: translateY(-1px); box-shadow: var(--shadow-sm); }

    /* Component specific classes */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    
    .bg-glow {
      top: -30px; left: -30px;
      width: 150px; height: 150px;
      background: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 12%, transparent) 0%, transparent 70%);
      border-radius: 50%;
    }

    /* Pulse Ring Animation */
    .pulse-ring { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; }
    .pulse-ring::before { content: ''; position: absolute; width: 100%; height: 100%; border-radius: 50%; animation: pulse 2.5s infinite cubic-bezier(0.2, 0.8, 0.2, 1); }
    .pulse-ring.active { background: var(--color-success); box-shadow: 0 0 0 6px var(--color-success-bg); }
    .pulse-ring.active::before { border: 2px solid var(--color-success); }
    .pulse-ring.break { background: var(--color-warning); box-shadow: 0 0 0 6px var(--color-warning-bg); }
    .pulse-ring.break::before { border: 2px solid var(--color-warning); }
    .pulse-ring.inactive { background: var(--border-secondary); }
    .pulse-ring.inactive::before { display: none; }

    @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }

    /* Timeline Styling Overrides */
    :host ::ng-deep .customized-timeline .p-timeline-event-opposite { display: none; }
    :host ::ng-deep .customized-timeline .p-timeline-event-content { padding-left: 1.5rem; padding-bottom: 0.5rem; }
    :host ::ng-deep .customized-timeline .p-timeline-event-separator { margin-left: 10px; }
    
    .marker-in { background-color: var(--color-success); border-color: var(--color-success-bg); }
    .marker-out { background-color: var(--color-error); border-color: var(--color-error-bg); }
    .marker-break { background-color: var(--color-warning); border-color: var(--color-warning-bg); }
    .marker-remote { background-color: var(--color-primary); border-color: var(--color-primary-bg); }

    /* ---------------------------------------------------------
       PRIMENG OVERRIDES (BENTO CARDS)
       --------------------------------------------------------- */
    :host ::ng-deep .bento-card.p-card {
      background: var(--component-bg);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--radius-2xl);
      display: flex; flex-direction: column; min-height: 0;
    }
    :host ::ng-deep .bento-card .p-card-body { padding: var(--spacing-xl); flex: 1; display: flex; flex-direction: column; min-height: 0; }
    :host ::ng-deep .bento-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; min-height: 0; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
    .card-anim-1 { animation: popIn 0.35s cubic-bezier(0.2, 0.9, 0.2, 1) 0.05s both; }
    .card-anim-2 { animation: popIn 0.35s cubic-bezier(0.2, 0.9, 0.2, 1) 0.1s both; }
    .card-anim-3 { animation: popIn 0.35s cubic-bezier(0.2, 0.9, 0.2, 1) 0.15s both; }

    /* Responsive */
    @media (max-width: 900px) { 
      .bento-grid { grid-template-columns: 1fr; } 
    }
  `]
})
export class EmployeeAttendanceComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  // State Signals
  currentTime = signal<Date>(new Date());
  currentStatus = signal<'in' | 'out' | 'break'>('out');
  lastPunchTime = signal<Date | null>(null);
  
  isPunching = signal<boolean>(false);
  isLoadingLogs = signal<boolean>(true);
  myLogs = signal<any[]>([]);
  summaryStats = signal<any>(null);
  
  // Geolocation
  hasLocation = signal<boolean>(false);
  currentLocation: any = null;

  private clockInterval: any;

  ngOnInit() {
    this.startClock();
    this.fetchLocation();
    this.loadMyLogs();
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
      this.destroy$.next();
      this.destroy$.complete();
  }

  private startClock() {
    this.clockInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  private fetchLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.hasLocation.set(true);
          this.currentLocation = {
            type: 'Point',
            coordinates: [position.coords.longitude, position.coords.latitude],
            accuracy: position.coords.accuracy
          };
        },
        (error) => {
          this.hasLocation.set(false);
          console.warn('Geolocation error:', error);
        }
      );
    }
  }

  loadMyLogs() {
    this.isLoadingLogs.set(true);
    
    this.hrmsService.getMyLogs().pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err);
        return of({ data: { logs: [], summary: {} } });
      }),
      finalize(() => this.isLoadingLogs.set(false)), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      const logs = res?.data?.logs || [];
      this.myLogs.set(logs);
      this.summaryStats.set(res?.data?.summary || { totalHours: '0.0', breakHours: '0.0' });

      if (logs.length > 0) {
        const latest = logs[0]; 
        this.lastPunchTime.set(new Date(latest.timestamp));
        if (latest.type === 'in' || latest.type === 'remote_in' || latest.type === 'break_end') {
          this.currentStatus.set('in');
        } else if (latest.type === 'break_start') {
          this.currentStatus.set('break');
        } else {
          this.currentStatus.set('out');
        }
      }
    });
  }

  performPunch(type: string) {
    this.isPunching.set(true);
    
    const payload: any = {
      source: 'web',
      timestamp: new Date(),
      type: type,
      organizationId: '698f1a7feff3e811b71a590f' 
    };

    if (this.currentLocation) {
      payload.location = this.currentLocation;
    }

    this.hrmsService.createAttendanceLog(payload).pipe(
      catchError(err => {
        this.messageService.handleHttpError(err);
        return of(null);
      }),
      finalize(() => this.isPunching.set(false)), takeUntil(this.destroy$)
    ).subscribe((res:any) => {
      if (res) {
        this.messageService.showSuccess(res.message);
        this.loadMyLogs(); 
      }
    });
  }

  // --- UI Helpers ---
  formatType(type: string): string {
    return type?.replace('_', ' ') || 'Unknown';
  }

  getMarkerClass(type: string): string {
    if (type?.includes('in')) return 'marker-in';
    if (type?.includes('out')) return 'marker-out';
    if (type?.includes('break')) return 'marker-break';
    return 'marker-remote';
  }

  getLogIcon(type: string): string {
    if (type?.includes('in')) return 'pi-sign-in';
    if (type?.includes('out')) return 'pi-sign-out';
    if (type?.includes('break')) return 'pi-coffee';
    return 'pi-check';
  }
}
// import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { catchError, finalize } from 'rxjs/operators';
// import { of } from 'rxjs';

// // Services
// // import { HRMSService } from '../../../hrms.service';
// import { MessageService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { TimelineModule } from 'primeng/timeline';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TagModule } from 'primeng/tag';
// import { ToastModule } from 'primeng/toast';
// import { HRMSService } from '../../hrms.service';
// import { Tooltip } from 'primeng/tooltip';
// import { AppMessageService } from '@core/services/message.service';

// @Component({
//   selector: 'app-employee-attendance',
//   standalone: true,
//   imports: [
//     CommonModule, CardModule, ButtonModule, TimelineModule, 
//     SkeletonModule, TagModule, ToastModule,Tooltip,
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast position="top-right"></p-toast>

//     <div class="page-wrapper fade-in">
//       <header class="dashboard-header slide-down mb-5">
//         <div class="header-left">
//           <div class="icon-brand bg-primary-light text-primary"><i class="pi pi-clock"></i></div>
//           <div class="header-titles">
//             <h1 class="page-title">Time & Attendance</h1>
//             <p class="page-subtitle">Record your daily attendance and track your working hours.</p>
//           </div>
//         </div>
//       </header>

//       <div class="grid-layout">
        
//         <div class="flex-col gap-4">
//           <p-card styleClass="premium-card glass-card text-center slide-down" styleClass="animation-delay: 0.1s">
            
//             <div class="clock-display mb-4">
//               <span class="time-text text-primary-color">{{ currentTime() | date:'HH:mm:ss' }}</span>
//               <span class="date-text text-secondary">{{ currentTime() | date:'EEEE, dd MMMM yyyy' }}</span>
//             </div>

//             <div class="status-indicator mb-5 flex-center">
//               @if (currentStatus() === 'in') {
//                 <div class="pulse-ring active"></div>
//                 <span class="font-bold text-success mt-2">Currently Clocked In</span>
//                 <span class="text-sm text-tertiary">Since {{ lastPunchTime() | date:'HH:mm' }}</span>
//               } @else if (currentStatus() === 'break') {
//                 <div class="pulse-ring break"></div>
//                 <span class="font-bold text-warning mt-2">On Break</span>
//               } @else {
//                 <div class="pulse-ring inactive"></div>
//                 <span class="font-bold text-secondary mt-2">Currently Clocked Out</span>
//               }
//             </div>

//             <div class="punch-actions grid-2 gap-3">
//               @if (currentStatus() === 'out') {
//                 <p-button label="Punch In" icon="pi pi-sign-in" styleClass="p-button-success w-full p-button-lg shadow-md" [loading]="isPunching()" (onClick)="performPunch('in')"></p-button>
//               } @else {
//                 <p-button label="Punch Out" icon="pi pi-sign-out" styleClass="p-button-danger w-full p-button-lg shadow-md" [loading]="isPunching()" (onClick)="performPunch('out')"></p-button>
//               }
              
//               @if (currentStatus() === 'in') {
//                 <p-button label="Start Break" icon="pi pi-coffee" styleClass="p-button-warning w-full p-button-lg" [loading]="isPunching()" [outlined]="true" (onClick)="performPunch('break_start')"></p-button>
//               } @else if (currentStatus() === 'break') {
//                 <p-button label="End Break" icon="pi pi-play" styleClass="p-button-warning w-full p-button-lg" [loading]="isPunching()" [outlined]="true" (onClick)="performPunch('break_end')"></p-button>
//               } @else {
//                 <p-button label="Remote In" icon="pi pi-globe" styleClass="p-button-secondary w-full p-button-lg" [loading]="isPunching()" [outlined]="true" (onClick)="performPunch('remote_in')"></p-button>
//               }
//             </div>
            
//             <div class="location-status mt-4 text-xs text-tertiary flex-align justify-center gap-2">
//               <i class="pi" [ngClass]="hasLocation() ? 'pi-map-marker text-success' : 'pi-compass pi-spin'"></i>
//               {{ hasLocation() ? 'Location Acquired' : 'Acquiring Location...' }}
//             </div>
//           </p-card>

//           <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.15s">
//             <div class="grid-2 text-center">
//               <div class="flex-col p-3 border-right">
//                 <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Total Hours</span>
//                 <span class="text-3xl font-bold text-primary mt-1">{{ summaryStats()?.totalHours || '0.0' }}<span class="text-sm text-secondary font-normal">h</span></span>
//               </div>
//               <div class="flex-col p-3">
//                 <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Break Time</span>
//                 <span class="text-3xl font-bold text-warning mt-1">{{ summaryStats()?.breakHours || '0.0' }}<span class="text-sm text-secondary font-normal">h</span></span>
//               </div>
//             </div>
//           </p-card>
//         </div>

//         <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.2s">
//           <h3 class="font-heading m-0 mb-4 text-primary-color flex-align gap-2 border-bottom pb-3">
//             <i class="pi pi-list text-primary"></i> Today's Activity Log
//           </h3>
          
//           @if (isLoadingLogs()) {
//             <div class="flex-col gap-4 mt-4">
//               <p-skeleton height="4rem"></p-skeleton>
//               <p-skeleton height="4rem"></p-skeleton>
//             </div>
//           } @else {
//             <p-timeline [value]="myLogs()" styleClass="customized-timeline mt-4">
//               <ng-template pTemplate="marker" let-log>
//                 <span class="custom-marker p-shadow-2" [ngClass]="getMarkerClass(log.type)">
//                   <i [ngClass]="getLogIcon(log.type)"></i>
//                 </span>
//               </ng-template>
//               <ng-template pTemplate="content" let-log>
//                 <div class="p-3 bg-surface border-radius-md mb-3 manish-border-1 surface-border">
//                   <div class="flex-between mb-1">
//                     <span class="font-bold text-primary-color capitalize">{{ formatType(log.type) }}</span>
//                     <span class="font-mono text-sm text-secondary font-bold">{{ log.timestamp | date:'HH:mm:ss' }}</span>
//                   </div>
//                   <div class="flex-align gap-3 text-xs text-tertiary mt-2">
//                     <span class="flex-align gap-1"><i class="pi pi-desktop"></i> {{ log.source | titlecase }}</span>
//                     <span *ngIf="log.location?.address" class="flex-align gap-1 truncate w-10rem" [pTooltip]="log.location.address"><i class="pi pi-map-marker"></i> {{ log.location.address }}</span>
//                     <p-tag *ngIf="log.processingStatus === 'flagged'" severity="danger" value="Flagged" styleClass="text-xs px-2 py-0"></p-tag>
//                   </div>
//                 </div>
//               </ng-template>
//             </p-timeline>
            
//             @if (myLogs().length === 0) {
//               <div class="text-center text-secondary py-5">
//                 <i class="pi pi-inbox text-4xl mb-3 text-tertiary"></i>
//                 <p class="m-0">No punches recorded today.</p>
//               </div>
//             }
//           }
//         </p-card>
//       </div>
//     </div>
//   `,
//   styles: [`
//     :host { display: block; font-family: var(--font-body); }
//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1200px; margin: 0 auto; }
    
//     .grid-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--spacing-2xl); align-items: start; }
//     .grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
    
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
//     .flex-center { display: flex; flex-direction: column; align-items: center; justify-content: center; }
//     .justify-center { justify-content: center; }
    
//     .gap-1 { gap: var(--spacing-xs); }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
//     .gap-4 { gap: var(--spacing-lg); }
    
//     .m-0 { margin: 0; }
//     .mb-1 { margin-bottom: var(--spacing-xs); }
//     .mb-3 { margin-bottom: var(--spacing-md); }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .mb-5 { margin-bottom: var(--spacing-2xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-2 { margin-top: var(--spacing-sm); }
//     .mt-4 { margin-top: var(--spacing-xl); }
    
//     .p-3 { padding: var(--spacing-lg); }
//     .py-5 { padding-top: var(--spacing-2xl); padding-bottom: var(--spacing-2xl); }
//     .pb-3 { padding-bottom: var(--spacing-md); }
//     .px-2 { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
//     .py-0 { padding-top: 0; padding-bottom: 0; }
    
//     .w-full { width: 100%; }
//     .w-10rem { width: 10rem; }
//     .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
//     .bg-surface { background: var(--bg-secondary); }
//     .bg-primary-light { background: var(--color-primary-bg); }
//     .border-bottom { border-bottom: 1px solid var(--border-primary); }
//     .border-right { border-right: 1px solid var(--border-primary); }
//     .manish-border-1 { border: 1px solid; }
//     .surface-border { border-color: var(--border-primary); }
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }
    
//     .text-center { text-align: center; }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-3xl { font-size: var(--font-size-3xl); }
    
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-primary { color: var(--color-primary); }
//     .text-success { color: var(--color-success); }
//     .text-warning { color: var(--color-warning); }
    
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-normal { font-weight: normal; }
//     .font-mono { font-family: var(--font-mono); }
//     .font-heading { font-family: var(--font-heading); }
//     .uppercase { text-transform: uppercase; }
//     .capitalize { text-transform: capitalize; }
//     .tracking-wide { letter-spacing: 0.05em; }

//     /* Header */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
//     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
//     .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); border: 1px solid var(--color-primary-border); }
//     .header-titles { display: flex; flex-direction: column; }
//     .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; letter-spacing: -0.02em; }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

//     /* Cards */
//     .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
//     ::ng-deep .premium-card .p-card-body { padding: var(--spacing-2xl); }
//     ::ng-deep .premium-card .p-card-content { padding: 0; }

//     /* Clock & Pulse */
//     .clock-display { display: flex; flex-direction: column; align-items: center; }
//     .time-text { font-family: var(--font-mono); font-size: 3.5rem; font-weight: 700; line-height: 1; letter-spacing: -2px; }
    
//     .pulse-ring { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; }
//     .pulse-ring::before { content: ''; position: absolute; width: 100%; height: 100%; border-radius: 50%; animation: pulse 2s infinite; }
//     .pulse-ring.active { background: var(--color-success); box-shadow: 0 0 0 4px var(--color-success-bg); }
//     .pulse-ring.active::before { border: 2px solid var(--color-success); }
//     .pulse-ring.break { background: var(--color-warning); box-shadow: 0 0 0 4px #fff7ed; }
//     .pulse-ring.break::before { border: 2px solid var(--color-warning); }
//     .pulse-ring.inactive { background: var(--border-primary); }

//     @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }

//     /* Timeline */
//     ::ng-deep .customized-timeline .p-timeline-event-opposite { display: none; }
//     ::ng-deep .customized-timeline .p-timeline-event-content { padding-left: 1.5rem; padding-bottom: 0.5rem; }
//     .custom-marker { display: flex; width: 2.5rem; height: 2.5rem; align-items: center; justify-content: center; color: #ffffff; border-radius: 50%; z-index: 1; font-size: 1rem; border: 2px solid var(--bg-primary); }
//     .marker-in { background-color: var(--color-success); }
//     .marker-out { background-color: var(--color-error); }
//     .marker-break { background-color: var(--color-warning); }
//     .marker-remote { background-color: var(--color-primary); }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

//     @media (max-width: 900px) { .grid-layout { grid-template-columns: 1fr; } }
//   `]
// })
// export class EmployeeAttendanceComponent implements OnInit, OnDestroy {
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   // State
//   currentTime = signal<Date>(new Date());
//   currentStatus = signal<'in' | 'out' | 'break'>('out');
//   lastPunchTime = signal<Date | null>(null);
  
//   isPunching = signal<boolean>(false);
//   isLoadingLogs = signal<boolean>(true);
//   myLogs = signal<any[]>([]);
//   summaryStats = signal<any>(null);
  
//   // Geolocation
//   hasLocation = signal<boolean>(false);
//   currentLocation: any = null;

//   private clockInterval: any;

//   ngOnInit() {
//     this.startClock();
//     this.fetchLocation();
//     this.loadMyLogs();
//   }

//   ngOnDestroy() {
//     if (this.clockInterval) clearInterval(this.clockInterval);
//   }

//   private startClock() {
//     this.clockInterval = setInterval(() => {
//       this.currentTime.set(new Date());
//     }, 1000);
//   }

//   private fetchLocation() {
//     if ('geolocation' in navigator) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           this.hasLocation.set(true);
//           this.currentLocation = {
//             type: 'Point',
//             coordinates: [position.coords.longitude, position.coords.latitude],
//             accuracy: position.coords.accuracy
//           };
//         },
//         (error) => {
//           this.hasLocation.set(false);
//           console.warn('Geolocation error:', error);
//         }
//       );
//     }
//   }

//   loadMyLogs() {
//     this.isLoadingLogs.set(true);
//     // Assuming API returns today's logs by default
//     this.hrmsService.getMyLogs().pipe(
//       catchError((err) => {
//         this.messageService.handleHttpError(err)
//         return of({ data: { logs: [], summary: {} } });
//       }),
//       finalize(() => this.isLoadingLogs.set(false))
//     ).subscribe((res: any) => {
//       const logs = res?.data?.logs || [];
//       this.myLogs.set(logs);
//       this.summaryStats.set(res?.data?.summary || { totalHours: '0.0', breakHours: '0.0' });

//       // Determine current status based on the most recent log
//       if (logs.length > 0) {
//         const latest = logs[0]; // Assuming descending order
//         this.lastPunchTime.set(new Date(latest.timestamp));
//         if (latest.type === 'in' || latest.type === 'remote_in' || latest.type === 'break_end') {
//           this.currentStatus.set('in');
//         } else if (latest.type === 'break_start') {
//           this.currentStatus.set('break');
//         } else {
//           this.currentStatus.set('out');
//         }
//       }
//     });
//   }

//   performPunch(type: string) {
//     this.isPunching.set(true);
    
//     const payload: any = {
//       source: 'web',
//       timestamp: new Date(),
//       type: type,
//       organizationId: '698f1a7feff3e811b71a590f' // Usually injected via Auth interceptor
//     };

//     if (this.currentLocation) {
//       payload.location = this.currentLocation;
//     }

//     this.hrmsService.createAttendanceLog(payload).pipe(
//       catchError(err => {
//         this.messageService.handleHttpError(err)
//         return of(null);
//       }),
//       finalize(() => this.isPunching.set(false))
//     ).subscribe((res:any) => {
//       if (res) {
//         this.messageService.showSuccess(res.message)
//         this.loadMyLogs(); // Refresh timeline and status
//       }
//     });
//   }

//   // --- UI Helpers ---
//   formatType(type: string): string {
//     return type.replace('_', ' ');
//   }

//   getMarkerClass(type: string): string {
//     if (type.includes('in')) return 'marker-in';
//     if (type.includes('out')) return 'marker-out';
//     if (type.includes('break')) return 'marker-break';
//     return 'marker-remote';
//   }

//   getLogIcon(type: string): string {
//     if (type.includes('in')) return 'pi-sign-in';
//     if (type.includes('out')) return 'pi-sign-out';
//     if (type.includes('break')) return 'pi-coffee';
//     return 'pi-check';
//   }
// }