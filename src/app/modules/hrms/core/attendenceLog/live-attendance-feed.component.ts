
import { Component, OnInit, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { interval, of } from 'rxjs';
import { catchError, switchMap, startWith } from 'rxjs/operators';

// Services
import { MessageService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-live-attendance-feed',
  standalone: true,
  imports: [
    CommonModule, 
    CardModule, 
    AvatarModule, 
    TagModule, 
    SkeletonModule, 
    TooltipModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container fade-in">
      
      <header class="page-header flex-between flex-wrap gap-md mb-4xl slide-down">
        <div class="flex align-items-center gap-xl">
          <div class="live-indicator-wrapper flex-center flex-shrink-0">
            <div class="live-dot"></div>
            <div class="live-ping"></div>
          </div>
          
          <div class="header-titles flex-col gap-xs">
            <h1 class="title font-heading text-3xl font-bold text-primary m-0 line-height-tight">Live Attendance Feed</h1>
            <p class="subtitle text-secondary text-md m-0 max-w-prose">Real-time monitoring of organizational punches and machine logs.</p>
          </div>
        </div>
        
        <div class="header-actions">
          <div class="glass-inset px-xl py-sm border-radius-lg flex align-items-center gap-sm manish-border-1 border-solid border-secondary shadow-sm">
            <i class="pi pi-clock text-tertiary text-xl"></i>
            <span class="font-mono font-bold text-lg text-primary tracking-widest">{{ currentTime() | date:'HH:mm:ss' }}</span>
          </div>
        </div>
      </header>

      @if (isLoading() && feedLogs().length === 0) {
        <div class="grid-layout">
          <p-skeleton height="160px" borderRadius="16px"></p-skeleton>
          <p-skeleton height="160px" borderRadius="16px"></p-skeleton>
          <p-skeleton height="160px" borderRadius="16px"></p-skeleton>
          <p-skeleton height="160px" borderRadius="16px"></p-skeleton>
        </div>
      } @else {
        <div class="grid-layout">
          @for (log of feedLogs(); track log._id; let i = $index) {
            
            <p-card styleClass="glass-panel border-radius-xl shadow-sm hover-lift transition-transform h-full flex-col slide-down" [style.animation-delay]="(i * 0.05) + 's'">
              <div class="flex-col h-full gap-md">
                
                <div class="flex-between align-items-start border-bottom-subtle pb-sm">
                  <p-tag [severity]="getTypeSeverity(log.type)" [rounded]="true">
                    <div class="flex align-items-center gap-xs px-1">
                      <i class="pi text-xs" [ngClass]="getTypeIcon(log.type)"></i>
                      <span class="uppercase font-bold tracking-widest text-xs">{{ formatType(log.type) }}</span>
                    </div>
                  </p-tag>
                  <div class="flex-col text-right">
                    <span class="font-mono text-sm font-bold text-primary">{{ log.timestamp | date:'HH:mm:ss' }}</span>
                    <span class="font-mono text-xs text-tertiary mt-1">{{ log.timestamp | date:'dd MMM yyyy' }}</span>
                  </div>
                </div>

                <div class="flex align-items-center gap-md py-xs">
                  <p-avatar 
                    [label]="getInitials(log.user?.name)" 
                    shape="circle" 
                    size="large" 
                    styleClass="bg-primary-light text-primary font-bold manish-border-1 border-solid border-primary">
                  </p-avatar>
                  <div class="flex-col gap-xs">
                    <span class="font-bold text-lg text-primary line-height-none">{{ log.user?.name || 'Unknown User' }}</span>
                    <span class="text-xs font-mono text-secondary">{{ log.user?.employeeProfile?.employeeId || log.user?._id | slice:0:8 }}</span>
                  </div>
                </div>

                <div class="flex-between text-xs text-secondary bg-secondary px-sm py-xs border-radius-sm mt-auto manish-border-1 border-solid border-secondary">
                  <span class="flex align-items-center gap-xs capitalize font-medium">
                    <i class="pi text-tertiary" [ngClass]="getSourceIcon(log.source)"></i> {{ log.source }}
                  </span>
                  
                  @if (log.location?.address) {
                    <span class="flex align-items-center gap-xs truncate max-w-10rem" [pTooltip]="log.location.address" tooltipPosition="top">
                      <i class="pi pi-map-marker text-tertiary"></i> {{ log.location.address }}
                    </span>
                  }
                  
                  @if (log.biometricData?.confidence) {
                    <span class="flex align-items-center gap-xs text-success font-bold">
                      <i class="pi pi-verified"></i> {{ log.biometricData.confidence }}%
                    </span>
                  }
                </div>
                
              </div>
            </p-card>
            
          }
        </div>

        @if (feedLogs().length === 0) {
          <div class="empty-state flex-col flex-center text-center py-5xl my-4xl glass-inset border-radius-xl manish-border-1 border-solid border-secondary">
            <i class="pi pi-spinner pi-spin text-5xl text-tertiary mb-md opacity-50"></i>
            <h3 class="font-heading text-2xl font-bold text-primary m-0 mb-xs">Awaiting Punches...</h3>
            <p class="text-secondary m-0 max-w-prose">The live feed will update automatically when an employee clocks in or out.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    /* ==========================================================================
       BASE & LAYOUT UTILITIES
       ========================================================================== */
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); min-height: 100vh; background-color: var(--bg-secondary); }
    
    .page-container { max-width: 1600px; margin: 0 auto; padding: var(--spacing-2xl) var(--spacing-xl); }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .flex-wrap { display: flex; flex-wrap: wrap; }
    .align-items-center { align-items: center; }
    .align-items-start { align-items: flex-start; }
    .flex-shrink-0 { flex-shrink: 0; }
    
    .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-xl); }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .max-w-10rem { max-width: 10rem; }
    .max-w-prose { max-width: 65ch; }

    /* Spacing */
    .m-0 { margin: 0 !important; }
    .p-0 { padding: 0 !important; }
    .mb-xs { margin-bottom: var(--spacing-xs); }
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-4xl { margin-bottom: var(--spacing-4xl); }
    .my-4xl { margin-top: var(--spacing-4xl); margin-bottom: var(--spacing-4xl); }
    .mt-1 { margin-top: 4px; }
    .mt-auto { margin-top: auto; }
    
    .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
    .px-sm { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
    .px-xl { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
    .py-xs { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
    .py-sm { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
    .py-5xl { padding-top: var(--spacing-5xl); padding-bottom: var(--spacing-5xl); }
    .pb-sm { padding-bottom: var(--spacing-sm); }
    
    .gap-xs { gap: var(--spacing-xs); }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-md { gap: var(--spacing-md); }
    .gap-xl { gap: var(--spacing-xl); }

    /* Typography & Colors */
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    
    .text-xs { font-size: var(--font-size-xs); }
    .text-sm { font-size: var(--font-size-sm); }
    .text-md { font-size: var(--font-size-md); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-3xl { font-size: var(--font-size-3xl); }
    .text-5xl { font-size: 3rem; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    .uppercase { text-transform: uppercase; }
    .capitalize { text-transform: capitalize; }
    .tracking-widest { letter-spacing: 0.05em; }
    .line-height-none { line-height: 1; }
    .line-height-tight { line-height: var(--line-height-tight); }
    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-success { color: var(--color-success, #16a34a); }
    
    .bg-secondary { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg); }

    /* Borders & Glassmorphism */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    .glass-inset { background: color-mix(in srgb, var(--bg-primary) 40%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
    
    .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .border-radius-xl { border-radius: var(--radius-2xl); }
    .border-radius-full { border-radius: 9999px; }
    
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    .manish-border-1 { border-width: 1px; }
    .border-solid { border-style: solid; }
    .border-primary { border-color: var(--border-primary); }
    .border-secondary { border-color: var(--border-secondary); }
    
    .shadow-sm { box-shadow: var(--shadow-sm); }
    .shadow-xl { box-shadow: var(--shadow-xl); }
    .overflow-hidden { overflow: hidden; }

    /* Interactive States (No ng-deep needed) */
    .transition-transform { transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 0.3s, border-color 0.3s; }
    .hover-lift:hover { transform: translateY(-4px); box-shadow: var(--shadow-xl); border-color: var(--color-primary); }

    /* ==========================================================================
       COMPONENT SPECIFICS
       ========================================================================== */
    .live-indicator-wrapper { position: relative; width: 48px; height: 48px; }
    .live-dot { width: 16px; height: 16px; background-color: var(--color-error); border-radius: 50%; z-index: 2; position: relative; }
    .live-ping { position: absolute; width: 100%; height: 100%; background-color: var(--color-error); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: 1; opacity: 0.7; }
    @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 768px) {
      .page-container { padding: var(--spacing-xl) var(--spacing-md); }
      .page-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-xl); }
    }
  `]
})
export class LiveAttendanceFeedComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private destroyRef = inject(DestroyRef); // Modern Cleanup

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

  // --- UI Helpers ---
  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatType(type: string): string {
    return type?.replace('_', ' ') || 'Log';
  }

  getTypeSeverity(type: string): 'success' | 'danger' | 'warn' | 'info' {
    if (type?.includes('in')) return 'success';
    if (type?.includes('out')) return 'danger';
    if (type?.includes('break')) return 'warn';
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

// import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { interval, Subscription, of } from 'rxjs';
// import { catchError, switchMap, startWith } from 'rxjs/operators';

// // Services
// // import { HRMSService } from '../../../hrms.service';
// import { MessageService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { AvatarModule } from 'primeng/avatar';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TooltipModule } from 'primeng/tooltip';
// import { HRMSService } from '../../hrms.service';
// import { AppMessageService } from '@core/services/message.service';
// // import { HRMSService } from '../hrms.service';

// @Component({
//   selector: 'app-live-attendance-feed',
//   standalone: true,
//   imports: [CommonModule, CardModule, AvatarModule, TagModule, SkeletonModule, TooltipModule],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="page-wrapper fade-in">
      
//       <header class="dashboard-header slide-down mb-5">
//         <div class="header-left">
//           <div class="live-indicator-wrapper">
//             <div class="live-dot"></div>
//             <div class="live-ping"></div>
//           </div>
//           <div class="header-titles ml-3">
//             <h1 class="page-title m-0">Live Attendance Feed</h1>
//             <p class="page-subtitle text-secondary mt-1">Real-time monitoring of organizational punches and machine logs.</p>
//           </div>
//         </div>
//         <div class="header-right">
//           <div class="bg-surface p-2 border-radius-md flex-align gap-2 px-3 manish-border-1 surface-border">
//             <i class="pi pi-clock text-tertiary"></i>
//             <span class="font-mono font-bold">{{ currentTime | date:'HH:mm:ss' }}</span>
//           </div>
//         </div>
//       </header>

//       @if (isLoading() && feedLogs().length === 0) {
//         <div class="grid-layout">
//           <p-skeleton height="120px" borderRadius="12px"></p-skeleton>
//           <p-skeleton height="120px" borderRadius="12px"></p-skeleton>
//           <p-skeleton height="120px" borderRadius="12px"></p-skeleton>
//           <p-skeleton height="120px" borderRadius="12px"></p-skeleton>
//         </div>
//       } @else {
        
//         <div class="grid-layout">
//           @for (log of feedLogs(); track log._id; let i = $index) {
//             <p-card styleClass="premium-card feed-card slide-down" [style.animation-delay]="(i * 0.05) + 's'">
//               <div class="feed-content">
                
//                 <div class="flex-between mb-3">
//                   <p-tag [severity]="getTypeSeverity(log.type)" styleClass="type-tag">
//                     <div class="flex-align gap-2">
//                       <i class="pi" [ngClass]="getTypeIcon(log.type)"></i>
//                       <span class="uppercase font-bold tracking-wide">{{ formatType(log.type) }}</span>
//                     </div>
//                   </p-tag>
//                   <span class="font-mono text-sm font-bold text-secondary">{{ log.timestamp | date:'HH:mm:ss' }}</span>
//                 </div>

//                 <div class="flex-align gap-3 mb-3">
//                   <p-avatar [label]="getInitials(log.user?.name)" shape="circle" size="xlarge" [style]="{'background-color': 'var(--bg-secondary)', 'color': 'var(--text-primary)', 'border': '2px solid var(--border-primary)'}"></p-avatar>
//                   <div class="flex-col">
//                     <span class="font-bold text-lg text-primary-color m-0 leading-tight">{{ log.user?.name || 'Unknown User' }}</span>
//                     <span class="text-sm text-secondary">{{ log.user?.employeeProfile?.designation || 'Employee' }}</span>
//                   </div>
//                 </div>

//                 <div class="flex-between text-xs text-tertiary border-top pt-2 mt-auto">
//                   <span class="flex-align gap-1"><i class="pi" [ngClass]="getSourceIcon(log.source)"></i> {{ log.source | titlecase }}</span>
//                   <span *ngIf="log.location?.address" class="flex-align gap-1 truncate w-10rem" [pTooltip]="log.location?.address"><i class="pi pi-map-marker"></i> {{ log.location.address }}</span>
//                   <span *ngIf="log.biometricData?.confidence" class="flex-align gap-1 text-success"><i class="pi pi-verified"></i> {{ log.biometricData.confidence }}% Match</span>
//                 </div>
                
//               </div>
//             </p-card>
//           }
//         </div>

//         @if (feedLogs().length === 0) {
//           <div class="empty-state">
//             <i class="pi pi-spinner pi-spin text-4xl text-tertiary mb-3"></i>
//             <h3 class="text-primary-color m-0">Awaiting Punches...</h3>
//             <p class="text-secondary">The live feed will update automatically when an employee clocks in or out.</p>
//           </div>
//         }
//       }
//     </div>
//   `,
//   styles: [`
//     :host { display: block; font-family: var(--font-body); min-height: 100vh; background: var(--bg-primary); }
//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1600px; margin: 0 auto; }
    
//     .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-xl); }
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
    
//     .gap-1 { gap: var(--spacing-xs); }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
//     .mb-3 { margin-bottom: var(--spacing-md); }
//     .mb-5 { margin-bottom: var(--spacing-2xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-auto { margin-top: auto; }
//     .pt-2 { padding-top: var(--spacing-sm); }
//     .p-2 { padding: var(--spacing-sm); }
//     .px-3 { padding-left: var(--spacing-lg); padding-right: var(--spacing-lg); }
//     .ml-3 { margin-left: var(--spacing-md); }
    
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-4xl { font-size: 2.5rem; }
    
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-success { color: var(--color-success); }
    
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-mono { font-family: var(--font-mono); }
//     .uppercase { text-transform: uppercase; }
//     .tracking-wide { letter-spacing: 0.05em; }
//     .leading-tight { line-height: 1.2; }
//     .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
//     .w-10rem { max-width: 10rem; }
    
//     .border-top { border-top: 1px solid var(--border-primary); }
//     .manish-border-1 { border: 1px solid; }
//     .surface-border { border-color: var(--border-primary); }
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }
//     .bg-surface { background: var(--bg-secondary); }

//     /* Header & Live Indicator */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
//     .header-left { display: flex; align-items: center; }
//     .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
    
//     .live-indicator-wrapper { position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
//     .live-dot { width: 12px; height: 12px; background-color: var(--color-error); border-radius: 50%; z-index: 2; }
//     .live-ping { position: absolute; width: 100%; height: 100%; background-color: var(--color-error); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: 1; opacity: 0.7; }
//     @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }

//     /* Cards */
//     ::ng-deep .feed-card.p-card { border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); border: 1px solid var(--border-primary); background: var(--bg-primary); transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 0.3s; height: 100%; }
//     ::ng-deep .feed-card.p-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-xl); border-color: var(--color-primary-border); }
//     ::ng-deep .feed-card .p-card-body { padding: var(--spacing-xl); height: 100%; }
//     ::ng-deep .feed-card .p-card-content { padding: 0; height: 100%; }
//     .feed-content { display: flex; flex-direction: column; height: 100%; }

//     ::ng-deep .type-tag { font-size: 10px; padding: 4px 10px; border-radius: 20px; }

//     .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-5xl) 0; text-align: center; }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

//     @media (max-width: 768px) {
//       .dashboard-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-xl); }
//     }
//   `]
// })
// export class LiveAttendanceFeedComponent implements OnInit, OnDestroy {
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   feedLogs = signal<any[]>([]);
//   isLoading = signal<boolean>(true);
//   currentTime: Date = new Date();
  
//   private clockSub!: Subscription;
//   private feedSub!: Subscription;

//   ngOnInit() {
//     // 1. Clock Ticker
//     this.clockSub = interval(1000).subscribe(() => this.currentTime = new Date());

//     // 2. Realtime Feed Polling (Every 10 seconds)
//     this.feedSub = interval(10000).pipe(
//       startWith(0), // Trigger immediately on load
//       switchMap(() => this.hrmsService.getRealtimeFeed(20).pipe(
//         catchError(() => {
//           // Silent catch to prevent polling from dying on a single network error
//           return of({ data: null }); 
//         })
//       ))
//     ).subscribe((res: any) => {
//       this.isLoading.set(false);
//       if (res?.data) {
//         // Assume API returns an array directly, or adapt based on actual response
//         this.feedLogs.set(Array.isArray(res.data) ? res.data : res.data.logs || []);
//       }
//     });
//   }

//   ngOnDestroy() {
//     if (this.clockSub) this.clockSub.unsubscribe();
//     if (this.feedSub) this.feedSub.unsubscribe();
//   }

//   // --- UI Helpers ---
//   getInitials(name: string): string {
//     if (!name || name.trim() === '') return '?';
//     return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
//   }

//   formatType(type: string): string {
//     return type?.replace('_', ' ') || 'Log';
//   }

//   getTypeSeverity(type: string): any {
//     if (type?.includes('in')) return 'success';
//     if (type?.includes('out')) return 'danger';
//     if (type?.includes('break')) return 'warning';
//     return 'info';
//   }

//   getTypeIcon(type: string): string {
//     if (type?.includes('in')) return 'pi-sign-in';
//     if (type?.includes('out')) return 'pi-sign-out';
//     if (type?.includes('break')) return 'pi-coffee';
//     return 'pi-circle';
//   }

//   getSourceIcon(source: string): string {
//     switch (source) {
//       case 'machine': case 'biometric': case 'rfid': return 'pi-server';
//       case 'mobile': return 'pi-mobile';
//       case 'web': return 'pi-desktop';
//       case 'admin_manual': return 'pi-user-edit';
//       default: return 'pi-cloud';
//     }
//   }
// }
// import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { interval, Subscription, of } from 'rxjs';
// import { catchError, switchMap, startWith } from 'rxjs/operators';

// // Services
// import { MessageService } from 'primeng/api';
// import { AppMessageService } from '@core/services/message.service';
// import { HRMSService } from '../../hrms.service';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { AvatarModule } from 'primeng/avatar';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TooltipModule } from 'primeng/tooltip';

// @Component({
//   selector: 'app-live-attendance-feed',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     CardModule, 
//     AvatarModule, 
//     TagModule, 
//     SkeletonModule, 
//     TooltipModule
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="page-wrapper fade-in flex-col w-full h-full p-xl max-w-7xl mx-auto gap-xl overflow-y-auto">
      
//       <header class="glass-panel rounded-lg p-lg flex-between flex-wrap gap-lg border-primary relative overflow-hidden flex-shrink-0 slide-down">
//         <div class="bg-glow absolute pointer-events-none"></div>

//         <div class="flex items-center gap-lg z-10">
//           <div class="live-indicator-wrapper bg-surface border-secondary rounded-md shadow-xs flex items-center justify-center">
//             <div class="live-dot shadow-sm"></div>
//             <div class="live-ping"></div>
//           </div>
          
//           <div class="flex-col">
//             <h1 class="page-title font-heading text-2xl font-bold text-primary m-0 leading-tight">Live Attendance Feed</h1>
//             <p class="page-subtitle text-secondary text-sm m-0 mt-xs">Real-time monitoring of organizational punches and machine logs.</p>
//           </div>
//         </div>
        
//         <div class="header-right z-10">
//           <div class="bg-surface p-md rounded-md flex items-center gap-sm border-secondary shadow-xs transition-base hover-border-accent">
//             <i class="pi pi-clock text-accent"></i>
//             <span class="font-mono font-bold text-primary text-lg leading-none tracking-tight">{{ currentTime() | date:'HH:mm:ss' }}</span>
//           </div>
//         </div>
//       </header>

//       <div class="flex-1 w-full">
//         @if (isLoading() && feedLogs().length === 0) {
//           <div class="bento-grid grid gap-xl">
//             <p-skeleton height="140px" borderRadius="16px"></p-skeleton>
//             <p-skeleton height="140px" borderRadius="16px"></p-skeleton>
//             <p-skeleton height="140px" borderRadius="16px"></p-skeleton>
//             <p-skeleton height="140px" borderRadius="16px"></p-skeleton>
//           </div>
//         } @else {
          
//           <div class="bento-grid grid gap-xl">
//             @for (log of feedLogs(); track log._id; let i = $index) {
              
//               <p-card styleClass="bento-card glass-panel feed-card shadow-sm card-anim-pop flex-col" [style.animation-delay]="(i * 0.05) + 's'">
                
//                 <div class="flex-between mb-md border-bottom pb-sm">
//                   <div style="display: inline-flex; align-items: center; box-sizing: border-box; line-height: 1;">
//                     <p-tag [severity]="getTypeSeverity(log.type)" styleClass="text-[0.65rem] font-bold tracking-wide shadow-xs px-2">
//                       <div class="flex items-center gap-xs">
//                         <i class="pi text-[0.65rem]" [ngClass]="getTypeIcon(log.type)"></i>
//                         <span class="uppercase">{{ formatType(log.type) }}</span>
//                       </div>
//                     </p-tag>
//                   </div>
//                   <span class="font-mono text-sm font-bold text-secondary bg-surface px-sm py-xs rounded border-secondary shadow-xs">
//                     {{ log.timestamp | date:'HH:mm:ss' }}
//                   </span>
//                 </div>

//                 <div class="flex items-center gap-md mb-lg flex-1">
//                   <p-avatar 
//                     [label]="getInitials(log.user?.name)" 
//                     shape="circle" 
//                     size="xlarge" 
//                     styleClass="bg-primary-light text-primary font-bold border-primary shadow-sm text-xl">
//                   </p-avatar>
//                   <div class="flex-col gap-xs flex-1 overflow-hidden">
//                     <span class="font-heading font-bold text-lg text-primary m-0 leading-tight truncate" [pTooltip]="log.user?.name" tooltipPosition="top">
//                       {{ log.user?.name || 'Unknown User' }}
//                     </span>
//                     <span class="text-xs font-medium text-tertiary truncate">
//                       {{ log.user?.employeeProfile?.designation || 'Employee' }}
//                     </span>
//                   </div>
//                 </div>

//                 <div class="flex-between flex-wrap gap-sm text-xs font-semibold text-tertiary border-top pt-sm mt-auto">
//                   <span class="flex items-center gap-xs capitalize">
//                     <i class="pi text-[0.65rem]" [ngClass]="getSourceIcon(log.source)"></i> {{ log.source }}
//                   </span>
                  
//                   @if (log.location?.address) {
//                     <span class="flex items-center gap-xs truncate max-w-[150px]" [pTooltip]="log.location.address" tooltipPosition="top">
//                       <i class="pi pi-map-marker text-[0.65rem]"></i> {{ log.location.address }}
//                     </span>
//                   }
                  
//                   @if (log.biometricData?.confidence) {
//                     <span class="flex items-center gap-xs text-success">
//                       <i class="pi pi-verified text-[0.65rem]"></i> {{ log.biometricData.confidence }}% Match
//                     </span>
//                   }
//                 </div>
                
//               </p-card>
//             }
//           </div>

//           @if (feedLogs().length === 0) {
//             <div class="empty-state flex-col items-center justify-center text-center py-5xl text-tertiary h-full">
//               <i class="pi pi-spinner pi-spin text-5xl mb-md opacity-50"></i>
//               <h3 class="font-heading text-xl font-bold text-primary m-0 mb-xs">Awaiting Punches...</h3>
//               <p class="text-sm font-medium m-0 max-w-[40ch]">The live feed will update automatically when an employee clocks in or out.</p>
//             </div>
//           }
//         }
//       </div>
//     </div>
//   `,
//   styles: [`
//     /* ==========================================================================
//        HOST & LAYOUT UTILITIES
//        ========================================================================== */
//     :host { 
//       display: block; 
//       font-family: var(--font-body); 
//       color: var(--text-primary); 
//       height: 100vh;
//       overflow: hidden;
//     }
    
//     .flex { display: flex; }
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .items-center { align-items: center; }
//     .justify-center { justify-content: center; }
//     .flex-wrap { flex-wrap: wrap; }
//     .flex-1 { flex: 1; }
//     .flex-shrink-0 { flex-shrink: 0; }
    
//     .w-full { width: 100%; }
//     .h-full { height: 100%; }
//     .w-12 { width: 3rem; }
//     .h-12 { height: 3rem; }
//     .max-w-7xl { max-width: 1280px; }
//     .max-w-\\[150px\\] { max-width: 150px; }
//     .max-w-\\[40ch\\] { max-width: 40ch; }
//     .mx-auto { margin-left: auto; margin-right: auto; }
    
//     .relative { position: relative; }
//     .absolute { position: absolute; }
//     .z-10 { z-index: 10; }
//     .overflow-hidden { overflow: hidden; }
//     .overflow-y-auto { overflow-y: auto; }
//     .pointer-events-none { pointer-events: none; }
//     .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

//     /* Grid Layouts */
//     .grid { display: grid; }
//     .bento-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }

//     /* Spacing */
//     .gap-xs { gap: var(--spacing-xs); }
//     .gap-sm { gap: var(--spacing-sm); }
//     .gap-md { gap: var(--spacing-md); }
//     .gap-lg { gap: var(--spacing-lg); }
//     .gap-xl { gap: var(--spacing-xl); }
    
//     .p-0 { padding: 0; }
//     .p-md { padding: var(--spacing-md); }
//     .p-lg { padding: var(--spacing-lg); }
//     .p-xl { padding: var(--spacing-xl); }
    
//     .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
//     .px-sm { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
//     .py-xs { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
//     .pb-sm { padding-bottom: var(--spacing-sm); }
//     .pt-sm { padding-top: var(--spacing-sm); }
//     .py-5xl { padding-top: var(--spacing-5xl); padding-bottom: var(--spacing-5xl); }
    
//     .m-0 { margin: 0 !important; }
//     .mt-xs { margin-top: var(--spacing-xs); }
//     .mt-auto { margin-top: auto; }
//     .mb-xs { margin-bottom: var(--spacing-xs); }
//     .mb-sm { margin-bottom: var(--spacing-sm); }
//     .mb-md { margin-bottom: var(--spacing-md); }
//     .mb-lg { margin-bottom: var(--spacing-lg); }

//     /* Typography */
//     .text-primary { color: var(--text-primary); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-accent { color: var(--color-primary); }
//     .text-success { color: var(--color-success); }
//     .text-white { color: #ffffff; }
    
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .font-medium { font-weight: var(--font-weight-medium); }
//     .font-semibold { font-weight: var(--font-weight-semibold); }
//     .font-bold { font-weight: var(--font-weight-bold); }
    
//     .text-\\[0\\.65rem\\] { font-size: 0.65rem; }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-xl { font-size: var(--font-size-xl); }
//     .text-2xl { font-size: var(--font-size-2xl); }
//     .text-5xl { font-size: 3rem; }
    
//     .text-center { text-align: center; }
//     .uppercase { text-transform: uppercase; }
//     .capitalize { text-transform: capitalize; }
//     .tracking-wide { letter-spacing: 0.05em; }
//     .tracking-tight { letter-spacing: -0.05em; }
//     .leading-none { line-height: 1; }
//     .leading-tight { line-height: var(--line-height-tight); }

//     /* Backgrounds & Borders */
//     .bg-primary { background: var(--bg-primary); }
//     .bg-surface { background: var(--component-surface-raised); }
//     .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    
//     .border-primary { border: var(--ui-border-width) solid var(--border-primary); }
//     .border-secondary { border: var(--ui-border-width) solid var(--border-secondary); }
//     .border-bottom { border-bottom: var(--ui-border-width) solid var(--border-primary); }
//     .border-top { border-top: var(--ui-border-width) solid var(--border-primary); }
    
//     .rounded { border-radius: var(--ui-border-radius); }
//     .rounded-md { border-radius: var(--ui-border-radius-md, 8px); }
//     .rounded-lg { border-radius: var(--ui-border-radius-lg); }
    
//     .shadow-xs { box-shadow: var(--shadow-xs); }
//     .shadow-sm { box-shadow: var(--shadow-sm); }
    
//     .transition-base { transition: var(--transition-base); }
//     .hover-border-accent:hover { border-color: color-mix(in srgb, var(--color-primary) 40%, transparent); box-shadow: var(--shadow-sm); }

//     /* Component specific classes */
//     .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    
//     .bg-glow {
//       top: -30px; left: -30px;
//       width: 150px; height: 150px;
//       background: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 12%, transparent) 0%, transparent 70%);
//       border-radius: 50%;
//     }

//     /* Live Recording Indicator */
//     .live-indicator-wrapper { position: relative; width: 48px; height: 48px; }
//     .live-dot { width: 14px; height: 14px; background-color: var(--color-error); border-radius: 50%; z-index: 2; }
//     .live-ping { position: absolute; width: 14px; height: 14px; background-color: var(--color-error); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: 1; opacity: 0.7; }
//     @keyframes ping { 75%, 100% { transform: scale(3.5); opacity: 0; } }

//     /* ---------------------------------------------------------
//        PRIMENG OVERRIDES (BENTO CARDS)
//        --------------------------------------------------------- */
//     :host ::ng-deep .bento-card.p-card {
//       background: var(--component-bg);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       display: flex; flex-direction: column; min-height: 180px;
//       transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 0.3s, border-color 0.3s;
//     }
//     :host ::ng-deep .bento-card.p-card:hover {
//       transform: translateY(-4px); 
//       box-shadow: var(--shadow-md); 
//       border-color: var(--color-primary); 
//     }
//     :host ::ng-deep .bento-card .p-card-body { padding: var(--spacing-xl); flex: 1; display: flex; flex-direction: column; min-height: 0; }
//     :host ::ng-deep .bento-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; min-height: 0; }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
//     .card-anim-pop { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) both; }

//     /* Responsive */
//     @media (max-width: 640px) { 
//       .bento-grid { grid-template-columns: 1fr; } 
//     }
//   `]
// })
// export class LiveAttendanceFeedComponent implements OnInit, OnDestroy {
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   // State Signals
//   feedLogs = signal<any[]>([]);
//   isLoading = signal<boolean>(true);
//   currentTime = signal<Date>(new Date());
  
//   private clockSub!: Subscription;
//   private feedSub!: Subscription;

//   ngOnInit() {
//     // 1. Reactive Clock Ticker (Signal Updates)
//     this.clockSub = interval(1000).subscribe(() => this.currentTime.set(new Date()));

//     // 2. Realtime Feed Polling (Every 10 seconds)
//     this.feedSub = interval(10000).pipe(
//       startWith(0), // Trigger immediately on load
//       switchMap(() => this.hrmsService.getRealtimeFeed(20).pipe(
//         catchError(() => {
//           // Silent catch to prevent polling from dying on a single network error
//           return of({ data: null }); 
//         })
//       ))
//     ).subscribe((res: any) => {
//       this.isLoading.set(false);
//       if (res?.data) {
//         // Adapt based on expected API response structure
//         this.feedLogs.set(Array.isArray(res.data) ? res.data : res.data.logs || []);
//       }
//     });
//   }

//   ngOnDestroy() {
//     if (this.clockSub) this.clockSub.unsubscribe();
//     if (this.feedSub) this.feedSub.unsubscribe();
//   }

//   // --- UI Helpers ---
//   getInitials(name: string): string {
//     if (!name || name.trim() === '') return '?';
//     return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
//   }

//   formatType(type: string): string {
//     return type?.replace('_', ' ') || 'Log';
//   }

//   getTypeSeverity(type: string): any {
//     if (type?.includes('in')) return 'success';
//     if (type?.includes('out')) return 'danger';
//     if (type?.includes('break')) return 'warn';
//     return 'info';
//   }

//   getTypeIcon(type: string): string {
//     if (type?.includes('in')) return 'pi-sign-in';
//     if (type?.includes('out')) return 'pi-sign-out';
//     if (type?.includes('break')) return 'pi-coffee';
//     return 'pi-circle';
//   }

//   getSourceIcon(source: string): string {
//     switch (source?.toLowerCase()) {
//       case 'machine': case 'biometric': case 'rfid': return 'pi-server';
//       case 'mobile': return 'pi-mobile';
//       case 'web': return 'pi-desktop';
//       case 'admin_manual': return 'pi-user-edit';
//       default: return 'pi-cloud';
//     }
//   }
// }
