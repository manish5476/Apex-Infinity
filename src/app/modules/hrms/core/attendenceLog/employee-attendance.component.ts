import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
// import { HRMSService } from '../../../hrms.service';
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TimelineModule } from 'primeng/timeline';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [
    CommonModule, CardModule, ButtonModule, TimelineModule, 
    SkeletonModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="page-wrapper fade-in">
      <header class="dashboard-header slide-down mb-5">
        <div class="header-left">
          <div class="icon-brand bg-primary-light text-primary"><i class="pi pi-clock"></i></div>
          <div class="header-titles">
            <h1 class="page-title">Time & Attendance</h1>
            <p class="page-subtitle">Record your daily attendance and track your working hours.</p>
          </div>
        </div>
      </header>

      <div class="grid-layout">
        
        <div class="flex-col gap-4">
          <p-card styleClass="premium-card glass-card text-center slide-down" styleClass="animation-delay: 0.1s">
            
            <div class="clock-display mb-4">
              <span class="time-text text-primary-color">{{ currentTime() | date:'HH:mm:ss' }}</span>
              <span class="date-text text-secondary">{{ currentTime() | date:'EEEE, dd MMMM yyyy' }}</span>
            </div>

            <div class="status-indicator mb-5 flex-center">
              @if (currentStatus() === 'in') {
                <div class="pulse-ring active"></div>
                <span class="font-bold text-success mt-2">Currently Clocked In</span>
                <span class="text-sm text-tertiary">Since {{ lastPunchTime() | date:'HH:mm' }}</span>
              } @else if (currentStatus() === 'break') {
                <div class="pulse-ring break"></div>
                <span class="font-bold text-warning mt-2">On Break</span>
              } @else {
                <div class="pulse-ring inactive"></div>
                <span class="font-bold text-secondary mt-2">Currently Clocked Out</span>
              }
            </div>

            <div class="punch-actions grid-2 gap-3">
              @if (currentStatus() === 'out') {
                <p-button label="Punch In" icon="pi pi-sign-in" styleClass="p-button-success w-full p-button-lg shadow-md" [loading]="isPunching()" (onClick)="performPunch('in')"></p-button>
              } @else {
                <p-button label="Punch Out" icon="pi pi-sign-out" styleClass="p-button-danger w-full p-button-lg shadow-md" [loading]="isPunching()" (onClick)="performPunch('out')"></p-button>
              }
              
              @if (currentStatus() === 'in') {
                <p-button label="Start Break" icon="pi pi-coffee" styleClass="p-button-warning w-full p-button-lg" [loading]="isPunching()" [outlined]="true" (onClick)="performPunch('break_start')"></p-button>
              } @else if (currentStatus() === 'break') {
                <p-button label="End Break" icon="pi pi-play" styleClass="p-button-warning w-full p-button-lg" [loading]="isPunching()" [outlined]="true" (onClick)="performPunch('break_end')"></p-button>
              } @else {
                <p-button label="Remote In" icon="pi pi-globe" styleClass="p-button-secondary w-full p-button-lg" [loading]="isPunching()" [outlined]="true" (onClick)="performPunch('remote_in')"></p-button>
              }
            </div>
            
            <div class="location-status mt-4 text-xs text-tertiary flex-align justify-center gap-2">
              <i class="pi" [ngClass]="hasLocation() ? 'pi-map-marker text-success' : 'pi-compass pi-spin'"></i>
              {{ hasLocation() ? 'Location Acquired' : 'Acquiring Location...' }}
            </div>
          </p-card>

          <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.15s">
            <div class="grid-2 text-center">
              <div class="flex-col p-3 border-right">
                <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Total Hours</span>
                <span class="text-3xl font-bold text-primary mt-1">{{ summaryStats()?.totalHours || '0.0' }}<span class="text-sm text-secondary font-normal">h</span></span>
              </div>
              <div class="flex-col p-3">
                <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Break Time</span>
                <span class="text-3xl font-bold text-warning mt-1">{{ summaryStats()?.breakHours || '0.0' }}<span class="text-sm text-secondary font-normal">h</span></span>
              </div>
            </div>
          </p-card>
        </div>

        <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.2s">
          <h3 class="font-heading m-0 mb-4 text-primary-color flex-align gap-2 border-bottom pb-3">
            <i class="pi pi-list text-primary"></i> Today's Activity Log
          </h3>
          
          @if (isLoadingLogs()) {
            <div class="flex-col gap-4 mt-4">
              <p-skeleton height="4rem"></p-skeleton>
              <p-skeleton height="4rem"></p-skeleton>
            </div>
          } @else {
            <p-timeline [value]="myLogs()" styleClass="customized-timeline mt-4">
              <ng-template pTemplate="marker" let-log>
                <span class="custom-marker p-shadow-2" [ngClass]="getMarkerClass(log.type)">
                  <i [ngClass]="getLogIcon(log.type)"></i>
                </span>
              </ng-template>
              <ng-template pTemplate="content" let-log>
                <div class="p-3 bg-surface border-radius-md mb-3 border-1 surface-border">
                  <div class="flex-between mb-1">
                    <span class="font-bold text-primary-color capitalize">{{ formatType(log.type) }}</span>
                    <span class="font-mono text-sm text-secondary font-bold">{{ log.timestamp | date:'HH:mm:ss' }}</span>
                  </div>
                  <div class="flex-align gap-3 text-xs text-tertiary mt-2">
                    <span class="flex-align gap-1"><i class="pi pi-desktop"></i> {{ log.source | titlecase }}</span>
                    <span *ngIf="log.location?.address" class="flex-align gap-1 truncate w-10rem" [pTooltip]="log.location.address"><i class="pi pi-map-marker"></i> {{ log.location.address }}</span>
                    <p-tag *ngIf="log.processingStatus === 'flagged'" severity="danger" value="Flagged" styleClass="text-xs px-2 py-0"></p-tag>
                  </div>
                </div>
              </ng-template>
            </p-timeline>
            
            @if (myLogs().length === 0) {
              <div class="text-center text-secondary py-5">
                <i class="pi pi-inbox text-4xl mb-3 text-tertiary"></i>
                <p class="m-0">No punches recorded today.</p>
              </div>
            }
          }
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1200px; margin: 0 auto; }
    
    .grid-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--spacing-2xl); align-items: start; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
    
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .flex-center { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .justify-center { justify-content: center; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mb-1 { margin-bottom: var(--spacing-xs); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-4 { margin-top: var(--spacing-xl); }
    
    .p-3 { padding: var(--spacing-lg); }
    .py-5 { padding-top: var(--spacing-2xl); padding-bottom: var(--spacing-2xl); }
    .pb-3 { padding-bottom: var(--spacing-md); }
    .px-2 { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
    .py-0 { padding-top: 0; padding-bottom: 0; }
    
    .w-full { width: 100%; }
    .w-10rem { width: 10rem; }
    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-right { border-right: 1px solid var(--border-primary); }
    .border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    
    .text-center { text-align: center; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-3xl { font-size: var(--font-size-3xl); }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-warning { color: var(--color-warning); }
    
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-normal { font-weight: normal; }
    .font-mono { font-family: var(--font-mono); }
    .font-heading { font-family: var(--font-heading); }
    .uppercase { text-transform: uppercase; }
    .capitalize { text-transform: capitalize; }
    .tracking-wide { letter-spacing: 0.05em; }

    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); border: 1px solid var(--color-primary-border); }
    .header-titles { display: flex; flex-direction: column; }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

    /* Cards */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .premium-card .p-card-body { padding: var(--spacing-2xl); }
    ::ng-deep .premium-card .p-card-content { padding: 0; }

    /* Clock & Pulse */
    .clock-display { display: flex; flex-direction: column; align-items: center; }
    .time-text { font-family: var(--font-mono); font-size: 3.5rem; font-weight: 700; line-height: 1; letter-spacing: -2px; }
    
    .pulse-ring { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; }
    .pulse-ring::before { content: ''; position: absolute; width: 100%; height: 100%; border-radius: 50%; animation: pulse 2s infinite; }
    .pulse-ring.active { background: var(--color-success); box-shadow: 0 0 0 4px var(--color-success-bg); }
    .pulse-ring.active::before { border: 2px solid var(--color-success); }
    .pulse-ring.break { background: var(--color-warning); box-shadow: 0 0 0 4px #fff7ed; }
    .pulse-ring.break::before { border: 2px solid var(--color-warning); }
    .pulse-ring.inactive { background: var(--border-primary); }

    @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }

    /* Timeline */
    ::ng-deep .customized-timeline .p-timeline-event-opposite { display: none; }
    ::ng-deep .customized-timeline .p-timeline-event-content { padding-left: 1.5rem; padding-bottom: 0.5rem; }
    .custom-marker { display: flex; width: 2.5rem; height: 2.5rem; align-items: center; justify-content: center; color: #ffffff; border-radius: 50%; z-index: 1; font-size: 1rem; border: 2px solid var(--bg-primary); }
    .marker-in { background-color: var(--color-success); }
    .marker-out { background-color: var(--color-error); }
    .marker-break { background-color: var(--color-warning); }
    .marker-remote { background-color: var(--color-primary); }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 900px) { .grid-layout { grid-template-columns: 1fr; } }
  `]
})
export class EmployeeAttendanceComponent implements OnInit, OnDestroy {
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);

  // State
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
    // Assuming API returns today's logs by default
    this.hrmsService.getMyLogs().pipe(
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load your punch history.' });
        return of({ data: { logs: [], summary: {} } });
      }),
      finalize(() => this.isLoadingLogs.set(false))
    ).subscribe((res: any) => {
      const logs = res?.data?.logs || [];
      this.myLogs.set(logs);
      this.summaryStats.set(res?.data?.summary || { totalHours: '0.0', breakHours: '0.0' });

      // Determine current status based on the most recent log
      if (logs.length > 0) {
        const latest = logs[0]; // Assuming descending order
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
      organizationId: '698f1a7feff3e811b71a590f' // Usually injected via Auth interceptor
    };

    if (this.currentLocation) {
      payload.location = this.currentLocation;
    }

    this.hrmsService.createAttendanceLog(payload).pipe(
      catchError(err => {
        this.messageService.add({ severity: 'error', summary: 'Punch Failed', detail: err.error?.message || 'Network error.' });
        return of(null);
      }),
      finalize(() => this.isPunching.set(false))
    ).subscribe(res => {
      if (res) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Successfully punched ${this.formatType(type)}.` });
        this.loadMyLogs(); // Refresh timeline and status
      }
    });
  }

  // --- UI Helpers ---
  formatType(type: string): string {
    return type.replace('_', ' ');
  }

  getMarkerClass(type: string): string {
    if (type.includes('in')) return 'marker-in';
    if (type.includes('out')) return 'marker-out';
    if (type.includes('break')) return 'marker-break';
    return 'marker-remote';
  }

  getLogIcon(type: string): string {
    if (type.includes('in')) return 'pi-sign-in';
    if (type.includes('out')) return 'pi-sign-out';
    if (type.includes('break')) return 'pi-coffee';
    return 'pi-check';
  }
}