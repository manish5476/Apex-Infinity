import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription, of } from 'rxjs';
import { catchError, switchMap, startWith } from 'rxjs/operators';

// Services
// import { HRMSService } from '../../../hrms.service';
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { HRMSService } from '../../hrms.service';
// import { HRMSService } from '../hrms.service';

@Component({
  selector: 'app-live-attendance-feed',
  standalone: true,
  imports: [CommonModule, CardModule, AvatarModule, TagModule, SkeletonModule, TooltipModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper fade-in">
      
      <header class="dashboard-header slide-down mb-5">
        <div class="header-left">
          <div class="live-indicator-wrapper">
            <div class="live-dot"></div>
            <div class="live-ping"></div>
          </div>
          <div class="header-titles ml-3">
            <h1 class="page-title m-0">Live Attendance Feed</h1>
            <p class="page-subtitle text-secondary mt-1">Real-time monitoring of organizational punches and machine logs.</p>
          </div>
        </div>
        <div class="header-right">
          <div class="bg-surface p-2 border-radius-md flex-align gap-2 px-3 border-1 surface-border">
            <i class="pi pi-clock text-tertiary"></i>
            <span class="font-mono font-bold">{{ currentTime | date:'HH:mm:ss' }}</span>
          </div>
        </div>
      </header>

      @if (isLoading() && feedLogs().length === 0) {
        <div class="grid-layout">
          <p-skeleton height="120px" borderRadius="12px"></p-skeleton>
          <p-skeleton height="120px" borderRadius="12px"></p-skeleton>
          <p-skeleton height="120px" borderRadius="12px"></p-skeleton>
          <p-skeleton height="120px" borderRadius="12px"></p-skeleton>
        </div>
      } @else {
        
        <div class="grid-layout">
          @for (log of feedLogs(); track log._id; let i = $index) {
            <p-card styleClass="premium-card feed-card slide-down" [style.animation-delay]="(i * 0.05) + 's'">
              <div class="feed-content">
                
                <div class="flex-between mb-3">
                  <p-tag [severity]="getTypeSeverity(log.type)" styleClass="type-tag">
                    <div class="flex-align gap-2">
                      <i class="pi" [ngClass]="getTypeIcon(log.type)"></i>
                      <span class="uppercase font-bold tracking-wide">{{ formatType(log.type) }}</span>
                    </div>
                  </p-tag>
                  <span class="font-mono text-sm font-bold text-secondary">{{ log.timestamp | date:'HH:mm:ss' }}</span>
                </div>

                <div class="flex-align gap-3 mb-3">
                  <p-avatar [label]="getInitials(log.user?.name)" shape="circle" size="xlarge" [style]="{'background-color': 'var(--bg-secondary)', 'color': 'var(--text-primary)', 'border': '2px solid var(--border-primary)'}"></p-avatar>
                  <div class="flex-col">
                    <span class="font-bold text-lg text-primary-color m-0 leading-tight">{{ log.user?.name || 'Unknown User' }}</span>
                    <span class="text-sm text-secondary">{{ log.user?.employeeProfile?.designation || 'Employee' }}</span>
                  </div>
                </div>

                <div class="flex-between text-xs text-tertiary border-top pt-2 mt-auto">
                  <span class="flex-align gap-1"><i class="pi" [ngClass]="getSourceIcon(log.source)"></i> {{ log.source | titlecase }}</span>
                  <span *ngIf="log.location?.address" class="flex-align gap-1 truncate w-10rem" [pTooltip]="log.location?.address"><i class="pi pi-map-marker"></i> {{ log.location.address }}</span>
                  <span *ngIf="log.biometricData?.confidence" class="flex-align gap-1 text-success"><i class="pi pi-verified"></i> {{ log.biometricData.confidence }}% Match</span>
                </div>
                
              </div>
            </p-card>
          }
        </div>

        @if (feedLogs().length === 0) {
          <div class="empty-state">
            <i class="pi pi-spinner pi-spin text-4xl text-tertiary mb-3"></i>
            <h3 class="text-primary-color m-0">Awaiting Punches...</h3>
            <p class="text-secondary">The live feed will update automatically when an employee clocks in or out.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-body); min-height: 100vh; background: var(--bg-primary); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1600px; margin: 0 auto; }
    
    .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-xl); }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-auto { margin-top: auto; }
    .pt-2 { padding-top: var(--spacing-sm); }
    .p-2 { padding: var(--spacing-sm); }
    .px-3 { padding-left: var(--spacing-lg); padding-right: var(--spacing-lg); }
    .ml-3 { margin-left: var(--spacing-md); }
    
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-4xl { font-size: 2.5rem; }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-success { color: var(--color-success); }
    
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-mono { font-family: var(--font-mono); }
    .uppercase { text-transform: uppercase; }
    .tracking-wide { letter-spacing: 0.05em; }
    .leading-tight { line-height: 1.2; }
    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .w-10rem { max-width: 10rem; }
    
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .bg-surface { background: var(--bg-secondary); }

    /* Header & Live Indicator */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
    
    .live-indicator-wrapper { position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    .live-dot { width: 12px; height: 12px; background-color: var(--color-error); border-radius: 50%; z-index: 2; }
    .live-ping { position: absolute; width: 100%; height: 100%; background-color: var(--color-error); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: 1; opacity: 0.7; }
    @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }

    /* Cards */
    ::ng-deep .feed-card.p-card { border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-md); border: 1px solid var(--border-primary); background: var(--bg-primary); transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 0.3s; height: 100%; }
    ::ng-deep .feed-card.p-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-xl); border-color: var(--color-primary-border); }
    ::ng-deep .feed-card .p-card-body { padding: var(--spacing-xl); height: 100%; }
    ::ng-deep .feed-card .p-card-content { padding: 0; height: 100%; }
    .feed-content { display: flex; flex-direction: column; height: 100%; }

    ::ng-deep .type-tag { font-size: 10px; padding: 4px 10px; border-radius: 20px; }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-5xl) 0; text-align: center; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 768px) {
      .dashboard-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-xl); }
    }
  `]
})
export class LiveAttendanceFeedComponent implements OnInit, OnDestroy {
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);

  feedLogs = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  currentTime: Date = new Date();
  
  private clockSub!: Subscription;
  private feedSub!: Subscription;

  ngOnInit() {
    // 1. Clock Ticker
    this.clockSub = interval(1000).subscribe(() => this.currentTime = new Date());

    // 2. Realtime Feed Polling (Every 10 seconds)
    this.feedSub = interval(10000).pipe(
      startWith(0), // Trigger immediately on load
      switchMap(() => this.hrmsService.getRealtimeFeed(20).pipe(
        catchError(() => {
          // Silent catch to prevent polling from dying on a single network error
          return of({ data: null }); 
        })
      ))
    ).subscribe((res: any) => {
      this.isLoading.set(false);
      if (res?.data) {
        // Assume API returns an array directly, or adapt based on actual response
        this.feedLogs.set(Array.isArray(res.data) ? res.data : res.data.logs || []);
      }
    });
  }

  ngOnDestroy() {
    if (this.clockSub) this.clockSub.unsubscribe();
    if (this.feedSub) this.feedSub.unsubscribe();
  }

  // --- UI Helpers ---
  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatType(type: string): string {
    return type?.replace('_', ' ') || 'Log';
  }

  getTypeSeverity(type: string): any {
    if (type?.includes('in')) return 'success';
    if (type?.includes('out')) return 'danger';
    if (type?.includes('break')) return 'warning';
    return 'info';
  }

  getTypeIcon(type: string): string {
    if (type?.includes('in')) return 'pi-sign-in';
    if (type?.includes('out')) return 'pi-sign-out';
    if (type?.includes('break')) return 'pi-coffee';
    return 'pi-circle';
  }

  getSourceIcon(source: string): string {
    switch (source) {
      case 'machine': case 'biometric': case 'rfid': return 'pi-server';
      case 'mobile': return 'pi-mobile';
      case 'web': return 'pi-desktop';
      case 'admin_manual': return 'pi-user-edit';
      default: return 'pi-cloud';
    }
  }
}