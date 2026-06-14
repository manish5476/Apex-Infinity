import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, map, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-shift-assignments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    TagModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="page-container fade-in">
      
      <header class="glass-header slide-down">
        <div class="bg-glow pointer-events-none"></div>

        <div class="header-left">
          <p-button 
            icon="pi pi-arrow-left" 
            [text]="true" 
            [rounded]="true"
            severity="secondary"
            size="large"
            (onClick)="onBack()" 
            pTooltip="Back to Shifts" 
            tooltipPosition="bottom"
            styleClass="btn-back">
          </p-button>
          
          <div class="header-title-group">
            <div class="icon-brand">
              <i class="pi pi-users"></i>
            </div>
            <div class="title-text">
              <h1>Shift Roster</h1>
              <p>Manage and view all employees assigned to this specific shift.</p>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <p-button 
            label="Assign Employee" 
            icon="pi pi-plus" 
            (onClick)="onAssignNew()"
            styleClass="btn-primary">
          </p-button>
        </div>
      </header>

      <p-card styleClass="bento-card">
        
        @if (isLoading()) {
          <div class="loading-state">
            <div class="loading-header">
              <p-skeleton width="200px" height="2.5rem" borderRadius="var(--ui-border-radius)"></p-skeleton>
              <p-skeleton width="250px" height="2.5rem" borderRadius="var(--ui-border-radius)"></p-skeleton>
            </div>
            <div class="loading-body">
              <p-skeleton width="100%" height="4.5rem" borderRadius="var(--ui-border-radius)"></p-skeleton>
              <p-skeleton width="100%" height="4.5rem" borderRadius="var(--ui-border-radius)"></p-skeleton>
              <p-skeleton width="100%" height="4.5rem" borderRadius="var(--ui-border-radius)"></p-skeleton>
            </div>
          </div>
        } @else {
          
          @if (assignedUsers().length > 0) {
            
            <div class="roster-toolbar">
              <h3>
                Assigned Personnel 
                <p-tag severity="info" [value]="assignedUsers().length.toString()" [rounded]="true"></p-tag>
              </h3>
              
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input 
                  type="text" 
                  pInputText 
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  placeholder="Search employees..." 
                  class="premium-input" />
              </p-iconField>
            </div>

            <div class="roster-list-container">
              
              <div class="roster-grid-header">
                <div>Employee Profile</div>
                <div>ID</div>
                <div>Role</div>
                <div>Email</div>
                <div class="text-right">Status</div>
                <div></div>
              </div>

              @for (user of filteredUsers(); track user.id) {
                <div class="roster-grid-row card-anim-1">
                  
                  <div class="user-profile">
                    <p-avatar 
                      [image]="user.avatar" 
                      [label]="!user.avatar ? getInitials(user.name) : ''" 
                      shape="circle" 
                      size="large"
                      styleClass="avatar-custom">
                    </p-avatar>
                    <div class="user-meta">
                      <span class="user-name">{{ user.name || 'Unknown Employee' }}</span>
                      <span class="user-joined">Joined {{ (user.joinDate | date:'MMM yyyy') || 'N/A' }}</span>
                    </div>
                  </div>

                  <div class="user-id">
                    <span class="badge-mono-sm">{{ user.code || user.id || 'N/A' }}</span>
                  </div>

                  <div class="user-role" [pTooltip]="user.designation" tooltipPosition="top">
                    {{ user.designation || user.role || 'Staff Member' }}
                  </div>

                  <div class="user-email">
                    @if (user.email) {
                      <a href="mailto:{{ user.email }}" class="link-style">
                        <i class="pi pi-envelope"></i> {{ user.email }}
                      </a>
                    } @else {
                      <span class="text-muted italic">Not provided</span>
                    }
                  </div>

                  <div class="user-status">
                    <p-tag 
                      [severity]="user.isActive ? 'success' : 'warn'" 
                      [value]="user.isActive ? 'Active' : 'Suspended'">
                    </p-tag>
                  </div>

                  <div class="user-actions">
                    <p-button 
                      icon="pi pi-ellipsis-v" 
                      [text]="true" 
                      [rounded]="true" 
                      severity="secondary"
                      pTooltip="Manage Assignment"
                      tooltipPosition="left">
                    </p-button>
                  </div>
                </div>
              }

              @if (filteredUsers().length === 0) {
                <div class="empty-state">
                  <!-- <i class="pi pi-search"></i> -->
                  <h4>No results found</h4>
                  <p>Try adjusting your search criteria.</p>
                </div>
              }
            </div>

          } @else {
            <div class="empty-state-global">
              <div class="icon-circle-large">
                <i class="pi pi-user-plus"></i>
              </div>
              <h2>No Employees Assigned</h2>
              <p>There are currently no team members scheduled for this shift. Add employees to build out this roster.</p>
              <p-button 
                label="Assign First Employee" 
                icon="pi pi-plus" 
                (onClick)="onAssignNew()"
                styleClass="btn-primary">
              </p-button>
            </div>
          }
        }
      </p-card>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       HOST & LAYOUT
       ========================================================================== */
    :host { 
      display: block; 
      font-family: var(--font-body); 
      color: var(--text-primary);
      width: 100%;
      height: 100%;
    }

    .page-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      padding: var(--spacing-xl);
      gap: var(--spacing-xl);
      box-sizing: border-box;
    }

    /* ==========================================================================
       HEADER
       ========================================================================== */
    .glass-header {
      position: relative;
      overflow: hidden;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--glass-bg-c);
      backdrop-filter: blur(var(--glass-blur-c));
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--elevation-1);
    }

    .bg-glow {
      position: absolute;
      top: -50px; 
      left: -50px;
      width: 200px; 
      height: 200px;
      background: radial-gradient(circle, var(--color-primary-bg) 0%, transparent 70%);
      border-radius: 50%;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
      z-index: var(--z-dropdown);
    }

    .header-title-group {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .icon-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--color-primary-bg);
      color: var(--color-primary);
      border-radius: var(--ui-border-radius);
      border: var(--ui-border-width) solid var(--color-primary-border);
      font-size: var(--font-size-2xl);
    }

    .title-text h1 {
      margin: 0;
      font-family: var(--font-heading);
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      line-height: var(--line-height-tight);
    }

    .title-text p {
      margin: var(--spacing-xs) 0 0 0;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    /* ==========================================================================
       BENTO CARD & PRIMENG OVERRIDES
       ========================================================================== */
    :host ::ng-deep .bento-card.p-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--component-bg);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--elevation-2);
      overflow: hidden;
    }
    :host ::ng-deep .bento-card .p-card-body,
    :host ::ng-deep .bento-card .p-card-content {
      padding: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    /* ==========================================================================
       LOADING STATE
       ========================================================================== */
    .loading-state {
      padding: var(--spacing-xl);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }
    .loading-header {
      display: flex;
      justify-content: space-between;
      width: 100%;
    }
    .loading-body {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    /* ==========================================================================
       TOOLBAR & SEARCH
       ========================================================================== */
    .roster-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-md);
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--component-surface-raised);
      border-bottom: var(--ui-border-width) solid var(--border-tertiary);
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
    }

    .roster-toolbar h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    :host ::ng-deep .premium-input.p-inputtext {
      width: 100%;
      min-width: 280px;
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      padding-left: 2.5rem; /* Space for icon */
      transition: var(--transition-base);
    }
    :host ::ng-deep .premium-input.p-inputtext:hover { border-color: var(--color-primary); }
    :host ::ng-deep .premium-input.p-inputtext:focus { 
      border-color: var(--color-primary); 
      box-shadow: 0 0 0 var(--focus-ring-width) var(--accent-focus); 
    }

    /* ==========================================================================
       ROSTER LIST (CSS GRID)
       ========================================================================== */
    .roster-list-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-md) var(--spacing-xl);
      gap: var(--spacing-sm);
    }

    /* Desktop Grid Setup */
    .roster-grid-header {
      display: none;
    }

    @media (min-width: 1024px) {
      .roster-grid-header {
        display: grid;
        grid-template-columns: 2.5fr 1fr 1.5fr 2fr 100px 60px;
        gap: var(--spacing-md);
        padding: var(--spacing-sm) var(--spacing-lg);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-tertiary);
      }
    }

    .roster-grid-row {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      transition: var(--transition-base);
    }

    @media (min-width: 1024px) {
      .roster-grid-row {
        display: grid;
        grid-template-columns: 2.5fr 1fr 1.5fr 2fr 100px 60px;
        align-items: center;
        flex-direction: row;
        gap: var(--spacing-md);
      }
    }

    .roster-grid-row:hover {
      border-color: var(--color-primary-border);
      transform: translateY(-2px);
      box-shadow: var(--elevation-1);
    }

    /* Row Content Elements */
    .user-profile {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    :host ::ng-deep .avatar-custom {
      background: var(--color-primary-bg);
      color: var(--color-primary);
      font-weight: var(--font-weight-bold);
      border: var(--ui-border-width) solid var(--color-primary-border);
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-name {
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-md);
      color: var(--text-primary);
    }

    .user-joined {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      font-weight: var(--font-weight-medium);
    }

    .badge-mono-sm {
      display: inline-flex;
      align-items: center;
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      background: var(--bg-secondary);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--ui-border-radius-sm);
      border: var(--ui-border-width) solid var(--border-tertiary);
      color: var(--text-secondary);
    }

    .user-role {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email .link-style {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      text-decoration: none;
      transition: var(--transition-base);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-email .link-style:hover {
      color: var(--color-primary);
    }

    .user-status {
      display: flex;
      justify-content: flex-start;
    }
    @media (min-width: 1024px) {
      .user-status { justify-content: flex-end; }
    }

    :host ::ng-deep .user-status .p-tag {
      font-size: 0.65rem;
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .user-actions {
      display: flex;
      justify-content: flex-end;
      opacity: 1; /* Always visible on mobile */
      transition: opacity var(--transition-fast);
    }
    
    @media (min-width: 1024px) {
      .user-actions { 
        justify-content: center;
        opacity: 0; /* Hidden until hover on desktop */
      }
      .roster-grid-row:hover .user-actions { opacity: 1; }
    }

    /* ==========================================================================
       EMPTY STATES
       ========================================================================== */
    .empty-state, .empty-state-global {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .empty-state {
      padding: var(--spacing-5xl) 0;
      color: var(--text-tertiary);
    }
    .empty-state i { font-size: 2.5rem; margin-bottom: var(--spacing-md); }
    .empty-state h4 { margin: 0 0 var(--spacing-xs) 0; font-family: var(--font-heading); color: var(--text-primary); }
    .empty-state p { margin: 0; font-size: var(--font-size-sm); }

    .empty-state-global {
      flex: 1;
      padding: var(--spacing-5xl);
    }
    .icon-circle-large {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      background: var(--component-surface-raised);
      border: var(--ui-border-width) solid var(--border-tertiary);
      border-radius: var(--ui-border-radius-pill);
      margin-bottom: var(--spacing-xl);
      box-shadow: var(--elevation-1);
    }
    .icon-circle-large i { font-size: 2.5rem; color: var(--color-primary); }
    .empty-state-global h2 { 
      margin: 0 0 var(--spacing-sm) 0; 
      font-family: var(--font-heading); 
      font-size: var(--font-size-2xl); 
    }
    .empty-state-global p { 
      margin: 0 0 var(--spacing-xl) 0; 
      max-width: 50ch; 
      color: var(--text-secondary); 
      line-height: var(--line-height-relaxed); 
    }

    /* ==========================================================================
       BUTTON OVERRIDES & UTILS
       ========================================================================== */
    :host ::ng-deep .btn-primary { box-shadow: var(--elevation-1); transition: var(--transition-base); }
    :host ::ng-deep .btn-primary:hover { box-shadow: var(--elevation-2); transform: translateY(-1px); }
    
    :host ::ng-deep .btn-back.p-button { 
      background: var(--component-surface-raised); 
      border: var(--ui-border-width) solid var(--border-secondary); 
      box-shadow: var(--elevation-1); 
    }
    :host ::ng-deep .btn-back.p-button:hover { background: var(--bg-secondary); }

    .text-muted { color: var(--text-tertiary); }
    .italic { font-style: italic; }
    .text-right { text-align: right; }
    .pointer-events-none { pointer-events: none; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(5px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .card-anim-1 { animation: popIn 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) both; }

  `]
})
export class ShiftAssignmentsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  // State Signals
  shiftId = signal<string>('');
  isLoading = signal<boolean>(true);
  assignedUsers = signal<any[]>([]);
  searchQuery = signal<string>('');

  // Computed Signal for local filtering
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const users = this.assignedUsers();

    if (!query) return users;

    return users.filter(user =>
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.code && user.code.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.shiftId.set(id);
      this.loadAssignments();
    } else {
      this.messageService.showError('Invalid shift identifier.');
      this.router.navigate(['/shifts']);
    }
  }

  private loadAssignments() {
    this.isLoading.set(true);

    this.hrmsService.getShiftAssignments(this.shiftId()).pipe(
      map(res => res?.data?.users || []),
      catchError(error => {
        this.messageService.handleHttpError(error)
        return of([]);
      }),
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe((users: any[]) => {
      this.assignedUsers.set(users);
    });
  }

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  onBack() {
    this.router.navigate(['/shifts']);
  }

  onAssignNew() {
    this.messageService.showInfo('Assign new employee modal would open here.');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
// import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { catchError, map, finalize, takeUntil } from 'rxjs/operators';
// import { of, Subject } from 'rxjs';

// // Services
// import { MessageService } from 'primeng/api';
// import { HRMSService } from '../../hrms.service';

// // PrimeNG Modules
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { AvatarModule } from 'primeng/avatar';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { ToastModule } from 'primeng/toast';
// import { TooltipModule } from 'primeng/tooltip';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { AppMessageService } from '@core/services/message.service';

// @Component({
//   selector: 'app-shift-assignments',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     CardModule,
//     ButtonModule,
//     InputTextModule,
//     AvatarModule,
//     TagModule,
//     SkeletonModule,
//     ToastModule,
//     TooltipModule,
//     IconFieldModule,
//     InputIconModule
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast position="top-right"></p-toast>

//     <div class="page-container fade-in flex-col w-full h-full p-xl max-w-7xl mx-auto gap-xl">
      
//       <header class="glass-panel rounded-lg p-lg flex-between flex-wrap gap-lg border-primary relative overflow-hidden slide-down">
//         <div class="bg-glow absolute pointer-events-none"></div>

//         <div class="flex items-center gap-lg z-10">
//           <p-button 
//             icon="pi pi-arrow-left" 
//             [text]="true" 
//             [rounded]="true"
//             severity="secondary"
//             size="large"
//             (onClick)="onBack()" 
//             pTooltip="Back to Shifts" 
//             tooltipPosition="bottom"
//             styleClass="bg-surface hover:bg-secondary transition-base border-secondary shadow-xs">
//           </p-button>
          
//           <div class="flex items-center gap-md">
//             <div class="icon-brand flex items-center justify-center bg-primary-light text-primary rounded-md w-12 h-12 flex-shrink-0 border-primary-light shadow-sm">
//               <i class="pi pi-users text-2xl"></i>
//             </div>
//             <div class="flex-col">
//               <h1 class="page-title font-heading text-2xl font-bold text-primary m-0 leading-tight">Shift Roster</h1>
//               <p class="subtitle text-secondary text-sm m-0 mt-1">Manage and view all employees assigned to this specific shift.</p>
//             </div>
//           </div>
//         </div>

//         <div class="header-actions z-10">
//           <p-button 
//             label="Assign Employee" 
//             icon="pi pi-plus" 
//             (onClick)="onAssignNew()"
//             styleClass="shadow-sm transition-base">
//           </p-button>
//         </div>
//       </header>

//       <p-card styleClass="bento-card glass-panel shadow-lg relative overflow-hidden flex-1 flex-col">
        
//         @if (isLoading()) {
//           <div class="p-xl flex-col gap-xl">
//             <div class="flex-between w-full">
//               <p-skeleton width="200px" height="2.5rem" borderRadius="8px"></p-skeleton>
//               <p-skeleton width="250px" height="2.5rem" borderRadius="8px"></p-skeleton>
//             </div>
//             <div class="flex-col gap-md w-full">
//               <p-skeleton width="100%" height="4.5rem" borderRadius="8px"></p-skeleton>
//               <p-skeleton width="100%" height="4.5rem" borderRadius="8px"></p-skeleton>
//               <p-skeleton width="100%" height="4.5rem" borderRadius="8px"></p-skeleton>
//             </div>
//           </div>
//         } @else {
          
//           @if (assignedUsers().length > 0) {
            
//             <div class="flex-between flex-wrap gap-md px-xl py-lg bg-surface border-bottom sticky top-0 z-10">
//               <h3 class="m-0 font-bold flex items-center gap-sm text-lg text-primary font-heading">
//                 Assigned Personnel 
//                 <p-tag severity="info" [value]="assignedUsers().length.toString()" [rounded]="true" styleClass="px-2 shadow-xs"></p-tag>
//               </h3>
              
//               <p-iconField iconPosition="left">
//                 <p-inputIcon styleClass="pi pi-search text-tertiary"></p-inputIcon>
//                 <input 
//                   type="text" 
//                   pInputText 
//                   [ngModel]="searchQuery()"
//                   (ngModelChange)="searchQuery.set($event)"
//                   placeholder="Search employees..." 
//                   class="w-full sm:w-20rem premium-input shadow-xs" />
//               </p-iconField>
//             </div>

//             <div class="flex-col w-full px-xl py-md gap-sm overflow-y-auto flex-1">
              
//               <div class="hidden md:flex items-center px-lg py-sm mb-xs text-xs font-bold uppercase tracking-wide text-tertiary">
//                 <div class="flex-1 min-w-[250px]">Employee Profile</div>
//                 <div class="w-[120px] ml-md">ID</div>
//                 <div class="w-[180px] ml-md">Role</div>
//                 <div class="w-[200px] ml-md">Email</div>
//                 <div class="w-[100px] ml-md text-right">Status</div>
//                 <div class="w-[60px] ml-md text-center"></div>
//               </div>

//               @for (user of filteredUsers(); track user.id) {
//                 <div class="flex flex-col md:flex-row md:items-center p-lg bg-primary border-secondary rounded-lg hover-border-accent transition-all shadow-xs group card-anim-1">
                  
//                   <div class="flex items-center gap-md flex-1 min-w-[250px]">
//                     <p-avatar 
//                       [image]="user.avatar" 
//                       [label]="!user.avatar ? getInitials(user.name) : ''" 
//                       shape="circle" 
//                       size="large"
//                       styleClass="bg-primary-light text-primary font-bold shadow-sm border-primary">
//                     </p-avatar>
//                     <div class="flex-col gap-xs">
//                       <span class="font-bold text-primary">{{ user.name || 'Unknown Employee' }}</span>
//                       <span class="text-xs text-secondary font-medium">Joined {{ (user.joinDate | date:'MMM yyyy') || 'N/A' }}</span>
//                     </div>
//                   </div>

//                   <div class="w-[120px] ml-0 md:ml-md mt-sm md:mt-0 flex items-center">
//                     <span class="badge-mono-sm">{{ user.code || user.id || 'N/A' }}</span>
//                   </div>

//                   <div class="w-[180px] ml-0 md:ml-md mt-sm md:mt-0 flex items-center">
//                     <span class="font-medium text-secondary text-sm truncate pr-2" [pTooltip]="user.designation" tooltipPosition="top">
//                       {{ user.designation || user.role || 'Staff Member' }}
//                     </span>
//                   </div>

//                   <div class="w-[200px] ml-0 md:ml-md mt-sm md:mt-0 flex items-center">
//                     @if (user.email) {
//                       <a href="mailto:{{ user.email }}" class="link-style text-sm flex items-center gap-xs text-secondary truncate pr-2">
//                         <i class="pi pi-envelope text-xs"></i> {{ user.email }}
//                       </a>
//                     } @else {
//                       <span class="text-tertiary text-sm italic">Not provided</span>
//                     }
//                   </div>

//                   <div class="w-[100px] ml-0 md:ml-md mt-sm md:mt-0 flex items-center md:justify-end">
//                     <p-tag 
//                       [severity]="user.isActive ? 'success' : 'warn'" 
//                       [value]="user.isActive ? 'Active' : 'Suspended'"
//                       styleClass="shadow-xs text-[0.65rem] font-bold uppercase tracking-wide">
//                     </p-tag>
//                   </div>

//                   <div class="w-[60px] ml-0 md:ml-md mt-sm md:mt-0 flex items-center justify-end md:justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
//                     <p-button 
//                       icon="pi pi-ellipsis-v" 
//                       [text]="true" 
//                       [rounded]="true" 
//                       severity="secondary"
//                       pTooltip="Manage Assignment"
//                       tooltipPosition="left">
//                     </p-button>
//                   </div>
//                 </div>
//               }

//               @if (filteredUsers().length === 0) {
//                 <div class="empty-state flex-col items-center justify-center text-center py-5xl">
//                   <i class="pi pi-search text-tertiary text-4xl mb-md"></i>
//                   <h4 class="font-heading text-lg font-bold text-primary m-0 mb-xs">No results found</h4>
//                   <p class="text-secondary text-sm m-0">Try adjusting your search criteria.</p>
//                 </div>
//               }
//             </div>

//           } @else {
//             <div class="empty-state flex-col items-center justify-center text-center flex-1 py-5xl w-full">
//               <div class="icon-circle-large flex items-center justify-center bg-surface border-secondary rounded-full mb-xl shadow-sm">
//                 <i class="pi pi-user-plus text-primary text-3xl"></i>
//               </div>
//               <h2 class="font-heading text-2xl font-bold text-primary m-0 mb-sm">No Employees Assigned</h2>
//               <p class="text-secondary text-sm m-0 mb-xl max-w-[50ch] leading-relaxed">There are currently no team members scheduled for this shift. Add employees to build out this roster.</p>
//               <p-button 
//                 label="Assign First Employee" 
//                 icon="pi pi-plus" 
//                 (onClick)="onAssignNew()"
//                 styleClass="shadow-sm transition-base">
//               </p-button>
//             </div>
//           }
//         }
//       </p-card>
//     </div>
//   `,
//   styles: [`
//     :host { 
//       display: block; 
//       font-family: var(--font-body); 
//       color: var(--text-primary); 
//     }
//     .flex { display: flex; }
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .items-center { align-items: center; }
//     .justify-center { justify-content: center; }
//     .justify-end { justify-content: flex-end; }
//     .flex-wrap { flex-wrap: wrap; }
//     .flex-1 { flex: 1; }
//     .flex-shrink-0 { flex-shrink: 0; }
//     .w-full { width: 100%; }
//     .h-full { height: 100%; }
//     .max-w-7xl { max-width: 1280px; }
//     .mx-auto { margin-left: auto; margin-right: auto; }
//     .relative { position: relative; }
//     .absolute { position: absolute; }
//     .sticky { position: sticky; }
//     .top-0 { top: 0; }
//     .z-10 { z-index: 10; }
//     .overflow-hidden { overflow: hidden; }
//     .overflow-y-auto { overflow-y: auto; }
//     .pointer-events-none { pointer-events: none; }
//     .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
//     .min-w-\\[250px\\] { min-width: 250px; }
//     .w-\\[120px\\] { width: 120px; }
//     .w-\\[180px\\] { width: 180px; }
//     .w-\\[200px\\] { width: 200px; }
//     .w-\\[100px\\] { width: 100px; }
//     .w-\\[60px\\] { width: 60px; }
//     .gap-xs { gap: var(--spacing-xs); }
//     .gap-sm { gap: var(--spacing-sm); }
//     .gap-md { gap: var(--spacing-md); }
//     .gap-lg { gap: var(--spacing-lg); }
//     .gap-xl { gap: var(--spacing-xl); }
//     .p-md { padding: var(--spacing-md); }
//     .p-lg { padding: var(--spacing-lg); }
//     .p-xl { padding: var(--spacing-xl); }
//     .px-lg { padding-left: var(--spacing-lg); padding-right: var(--spacing-lg); }
//     .px-xl { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
//     .py-sm { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
//     .py-md { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
//     .py-lg { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }
//     .py-5xl { padding-top: var(--spacing-5xl); padding-bottom: var(--spacing-5xl); }
//     .m-0 { margin: 0; }
//     .mt-1 { margin-top: 0.25rem; }
//     .mt-sm { margin-top: var(--spacing-sm); }
//     .mb-xs { margin-bottom: var(--spacing-xs); }
//     .mb-sm { margin-bottom: var(--spacing-sm); }
//     .mb-md { margin-bottom: var(--spacing-md); }
//     .mb-xl { margin-bottom: var(--spacing-xl); }
//     .ml-md { margin-left: var(--spacing-md); }
//     .ml-0 { margin-left: 0; }
//     .text-primary { color: var(--text-primary); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-accent { color: var(--color-primary); }
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .font-medium { font-weight: var(--font-weight-medium); }
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-\\[0\\.65rem\\] { font-size: 0.65rem; }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-2xl { font-size: var(--font-size-2xl); }
//     .text-4xl { font-size: 2.25rem; }    
//     .text-center { text-align: center; }
//     .text-right { text-align: right; }
//     .uppercase { text-transform: uppercase; }
//     .tracking-wide { letter-spacing: 0.05em; }
//     .leading-tight { line-height: var(--line-height-tight); }
//     .leading-relaxed { line-height: var(--line-height-relaxed); }
//     .italic { font-style: italic; }
//     .max-w-\\[50ch\\] { max-width: 50ch; }
//     .bg-primary { background: var(--bg-primary); }
//     .bg-surface { background: var(--component-surface-raised); }
//     .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
//     .border-primary { border: var(--ui-border-width) solid var(--border-primary); }
//     .border-secondary { border: var(--ui-border-width) solid var(--border-secondary); }
//     .border-primary-light { border: var(--ui-border-width) solid color-mix(in srgb, var(--color-primary) 30%, transparent); }
//     .border-bottom { border-bottom: var(--ui-border-width) solid var(--border-primary); }
//     .rounded-md { border-radius: var(--ui-border-radius-md, 8px); }
//     .rounded-lg { border-radius: var(--ui-border-radius-lg); }
//     .rounded-full { border-radius: 9999px; }
//     .shadow-xs { box-shadow: var(--shadow-xs); }
//     .shadow-sm { box-shadow: var(--shadow-sm); }
//     .shadow-lg { box-shadow: var(--shadow-lg); }
//     .opacity-0 { opacity: 0; }
//     .opacity-100 { opacity: 1; }
//     .transition-all { transition: all var(--transition-base); }
//     .transition-opacity { transition: opacity var(--transition-base); }
//     .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); }
    
//     .bg-glow {
//       top: -30px; left: -30px;
//       width: 150px; height: 150px;
//       background: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 12%, transparent) 0%, transparent 70%);
//       border-radius: 50%;
//     }
//     .icon-circle-large { width: 72px; height: 72px; }
//     .badge-mono-sm {
//       display: inline-flex; align-items: center; box-sizing: border-box; line-height: 1;
//       font-family: var(--font-mono); font-size: 11px;
//       background: var(--bg-secondary); padding: 4px 8px;
//       border-radius: var(--ui-border-radius-sm, 4px); border: 1px solid var(--border-secondary);
//       color: var(--text-secondary); white-space: nowrap;
//     }

//     .hover-border-accent:hover { border-color: color-mix(in srgb, var(--color-primary) 40%, transparent); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
//     .group:hover .group-hover\\:opacity-100 { opacity: 1; }
//     .link-style { text-decoration: none; transition: var(--transition-base); }
//     .link-style:hover { color: var(--color-primary); }

//     :host ::ng-deep .bento-card.p-card {
//       background: var(--component-bg);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       display: flex; flex-direction: column;
//     }
//     :host ::ng-deep .bento-card .p-card-body { padding: 0; flex: 1; display: flex; flex-direction: column; min-height: 0; }
//     :host ::ng-deep .bento-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; min-height: 0; }

//     /* Premium Input Overrides */
//     :host ::ng-deep .premium-input.p-inputtext {
//       background: var(--bg-primary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       transition: var(--transition-base);
//       height: 40px;
//       box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
//     }
//     :host ::ng-deep .premium-input.p-inputtext:hover { border-color: var(--color-primary); }
//     :host ::ng-deep .premium-input.p-inputtext:focus { border-color: var(--color-primary); box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color); outline: none; }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(5px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .card-anim-1 { animation: popIn 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) both; }

//     /* Responsive */
//     .hidden { display: none; }
//     @media (min-width: 768px) {
//       .md\\:flex { display: flex; }
//       .md\\:flex-row { flex-direction: row; }
//       .md\\:items-center { align-items: center; }
//       .md\\:justify-center { justify-content: center; }
//       .md\\:justify-end { justify-content: flex-end; }
//       .md\\:ml-md { margin-left: var(--spacing-md); }
//       .md\\:mt-0 { margin-top: 0; }
//       .md\\:opacity-0 { opacity: 0; }
//       .sm\\:w-20rem { width: 20rem; }
//     }
//   `]
// })
// export class ShiftAssignmentsComponent implements OnInit, OnDestroy {
//   private readonly destroy$ = new Subject<void>();
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   shiftId = signal<string>('');
//   isLoading = signal<boolean>(true);
//   assignedUsers = signal<any[]>([]);
//   searchQuery = signal<string>('');
//   filteredUsers = computed(() => {
//     const query = this.searchQuery().toLowerCase().trim();
//     const users = this.assignedUsers();
//     if (!query) return users;
//     return users.filter(user =>
//       (user.name && user.name.toLowerCase().includes(query)) ||
//       (user.code && user.code.toLowerCase().includes(query)) ||
//       (user.email && user.email.toLowerCase().includes(query))
//     );
//   });

//   ngOnInit() {
//     const id = this.route.snapshot.paramMap.get('id');

//     if (id) {
//       this.shiftId.set(id);
//       this.loadAssignments();
//     } else {
//       this.messageService.showError('Invalid shift identifier.');
//       this.router.navigate(['/shifts']);
//     }
//   }

//   private loadAssignments() {
//     this.isLoading.set(true);

//     this.hrmsService.getShiftAssignments(this.shiftId()).pipe(
//       map(res => res?.data?.users || []),
//       catchError(error => {
//         this.messageService.handleHttpError(error)
//         return of([]);
//       }),
//       finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
//     ).subscribe((users: any[]) => {
//       this.assignedUsers.set(users);
//     });
//   }

//   getInitials(name: string): string {
//     if (!name || name.trim() === '') return '?';
//     return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
//   }

//   onBack() {
//     this.router.navigate(['/shifts']);
//   }

//   onAssignNew() {
//     this.messageService.showInfo('Assign new employee modal would open here.');
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }