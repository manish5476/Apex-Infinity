import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, map, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';
import { HRMSService } from '../../hrms.service';

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
import { AppMessageService } from '@core/services/message.service';

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

    <div class="page-container fade-in flex-col w-full h-full p-xl max-w-7xl mx-auto gap-xl">
      
      <header class="glass-panel rounded-lg p-lg flex-between flex-wrap gap-lg border-primary relative overflow-hidden slide-down">
        <div class="bg-glow absolute pointer-events-none"></div>

        <div class="flex items-center gap-lg z-10">
          <p-button 
            icon="pi pi-arrow-left" 
            [text]="true" 
            [rounded]="true"
            severity="secondary"
            size="large"
            (onClick)="onBack()" 
            pTooltip="Back to Shifts" 
            tooltipPosition="bottom"
            styleClass="bg-surface hover:bg-secondary transition-base border-secondary shadow-xs">
          </p-button>
          
          <div class="flex items-center gap-md">
            <div class="icon-brand flex items-center justify-center bg-primary-light text-primary rounded-md w-12 h-12 flex-shrink-0 border-primary-light shadow-sm">
              <i class="pi pi-users text-2xl"></i>
            </div>
            <div class="flex-col">
              <h1 class="page-title font-heading text-2xl font-bold text-primary m-0 leading-tight">Shift Roster</h1>
              <p class="subtitle text-secondary text-sm m-0 mt-1">Manage and view all employees assigned to this specific shift.</p>
            </div>
          </div>
        </div>

        <div class="header-actions z-10">
          <p-button 
            label="Assign Employee" 
            icon="pi pi-plus" 
            (onClick)="onAssignNew()"
            styleClass="shadow-sm transition-base">
          </p-button>
        </div>
      </header>

      <p-card styleClass="bento-card glass-panel shadow-lg relative overflow-hidden flex-1 flex-col">
        
        @if (isLoading()) {
          <div class="p-xl flex-col gap-xl">
            <div class="flex-between w-full">
              <p-skeleton width="200px" height="2.5rem" borderRadius="8px"></p-skeleton>
              <p-skeleton width="250px" height="2.5rem" borderRadius="8px"></p-skeleton>
            </div>
            <div class="flex-col gap-md w-full">
              <p-skeleton width="100%" height="4.5rem" borderRadius="8px"></p-skeleton>
              <p-skeleton width="100%" height="4.5rem" borderRadius="8px"></p-skeleton>
              <p-skeleton width="100%" height="4.5rem" borderRadius="8px"></p-skeleton>
            </div>
          </div>
        } @else {
          
          @if (assignedUsers().length > 0) {
            
            <div class="flex-between flex-wrap gap-md px-xl py-lg bg-surface border-bottom sticky top-0 z-10">
              <h3 class="m-0 font-bold flex items-center gap-sm text-lg text-primary font-heading">
                Assigned Personnel 
                <p-tag severity="info" [value]="assignedUsers().length.toString()" [rounded]="true" styleClass="px-2 shadow-xs"></p-tag>
              </h3>
              
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search text-tertiary"></p-inputIcon>
                <input 
                  type="text" 
                  pInputText 
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  placeholder="Search employees..." 
                  class="w-full sm:w-20rem premium-input shadow-xs" />
              </p-iconField>
            </div>

            <div class="flex-col w-full px-xl py-md gap-sm overflow-y-auto flex-1">
              
              <div class="hidden md:flex items-center px-lg py-sm mb-xs text-xs font-bold uppercase tracking-wide text-tertiary">
                <div class="flex-1 min-w-[250px]">Employee Profile</div>
                <div class="w-[120px] ml-md">ID</div>
                <div class="w-[180px] ml-md">Role</div>
                <div class="w-[200px] ml-md">Email</div>
                <div class="w-[100px] ml-md text-right">Status</div>
                <div class="w-[60px] ml-md text-center"></div>
              </div>

              @for (user of filteredUsers(); track user.id) {
                <div class="flex flex-col md:flex-row md:items-center p-lg bg-primary border-secondary rounded-lg hover-border-accent transition-all shadow-xs group card-anim-1">
                  
                  <div class="flex items-center gap-md flex-1 min-w-[250px]">
                    <p-avatar 
                      [image]="user.avatar" 
                      [label]="!user.avatar ? getInitials(user.name) : ''" 
                      shape="circle" 
                      size="large"
                      styleClass="bg-primary-light text-primary font-bold shadow-sm border-primary">
                    </p-avatar>
                    <div class="flex-col gap-xs">
                      <span class="font-bold text-primary">{{ user.name || 'Unknown Employee' }}</span>
                      <span class="text-xs text-secondary font-medium">Joined {{ (user.joinDate | date:'MMM yyyy') || 'N/A' }}</span>
                    </div>
                  </div>

                  <div class="w-[120px] ml-0 md:ml-md mt-sm md:mt-0 flex items-center">
                    <span class="badge-mono-sm">{{ user.code || user.id || 'N/A' }}</span>
                  </div>

                  <div class="w-[180px] ml-0 md:ml-md mt-sm md:mt-0 flex items-center">
                    <span class="font-medium text-secondary text-sm truncate pr-2" [pTooltip]="user.designation" tooltipPosition="top">
                      {{ user.designation || user.role || 'Staff Member' }}
                    </span>
                  </div>

                  <div class="w-[200px] ml-0 md:ml-md mt-sm md:mt-0 flex items-center">
                    @if (user.email) {
                      <a href="mailto:{{ user.email }}" class="link-style text-sm flex items-center gap-xs text-secondary truncate pr-2">
                        <i class="pi pi-envelope text-xs"></i> {{ user.email }}
                      </a>
                    } @else {
                      <span class="text-tertiary text-sm italic">Not provided</span>
                    }
                  </div>

                  <div class="w-[100px] ml-0 md:ml-md mt-sm md:mt-0 flex items-center md:justify-end">
                    <p-tag 
                      [severity]="user.isActive ? 'success' : 'warn'" 
                      [value]="user.isActive ? 'Active' : 'Suspended'"
                      styleClass="shadow-xs text-[0.65rem] font-bold uppercase tracking-wide">
                    </p-tag>
                  </div>

                  <div class="w-[60px] ml-0 md:ml-md mt-sm md:mt-0 flex items-center justify-end md:justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
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
                <div class="empty-state flex-col items-center justify-center text-center py-5xl">
                  <i class="pi pi-search text-tertiary text-4xl mb-md"></i>
                  <h4 class="font-heading text-lg font-bold text-primary m-0 mb-xs">No results found</h4>
                  <p class="text-secondary text-sm m-0">Try adjusting your search criteria.</p>
                </div>
              }
            </div>

          } @else {
            <div class="empty-state flex-col items-center justify-center text-center flex-1 py-5xl w-full">
              <div class="icon-circle-large flex items-center justify-center bg-surface border-secondary rounded-full mb-xl shadow-sm">
                <i class="pi pi-user-plus text-primary text-3xl"></i>
              </div>
              <h2 class="font-heading text-2xl font-bold text-primary m-0 mb-sm">No Employees Assigned</h2>
              <p class="text-secondary text-sm m-0 mb-xl max-w-[50ch] leading-relaxed">There are currently no team members scheduled for this shift. Add employees to build out this roster.</p>
              <p-button 
                label="Assign First Employee" 
                icon="pi pi-plus" 
                (onClick)="onAssignNew()"
                styleClass="shadow-sm transition-base">
              </p-button>
            </div>
          }
        }
      </p-card>
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
    }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-end { justify-content: flex-end; }
    .flex-wrap { flex-wrap: wrap; }
    .flex-1 { flex: 1; }
    .flex-shrink-0 { flex-shrink: 0; }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .max-w-7xl { max-width: 1280px; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .relative { position: relative; }
    .absolute { position: absolute; }
    .sticky { position: sticky; }
    .top-0 { top: 0; }
    .z-10 { z-index: 10; }
    .overflow-hidden { overflow: hidden; }
    .overflow-y-auto { overflow-y: auto; }
    .pointer-events-none { pointer-events: none; }
    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Fixed Width Columns for List */
    .min-w-\\[250px\\] { min-width: 250px; }
    .w-\\[120px\\] { width: 120px; }
    .w-\\[180px\\] { width: 180px; }
    .w-\\[200px\\] { width: 200px; }
    .w-\\[100px\\] { width: 100px; }
    .w-\\[60px\\] { width: 60px; }
    
    /* Spacing */
    .gap-xs { gap: var(--spacing-xs); }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-md { gap: var(--spacing-md); }
    .gap-lg { gap: var(--spacing-lg); }
    .gap-xl { gap: var(--spacing-xl); }
    
    .p-md { padding: var(--spacing-md); }
    .p-lg { padding: var(--spacing-lg); }
    .p-xl { padding: var(--spacing-xl); }
    .px-lg { padding-left: var(--spacing-lg); padding-right: var(--spacing-lg); }
    .px-xl { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
    .py-sm { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
    .py-md { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
    .py-lg { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }
    .py-5xl { padding-top: var(--spacing-5xl); padding-bottom: var(--spacing-5xl); }
    
    .m-0 { margin: 0; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-sm { margin-top: var(--spacing-sm); }
    .mb-xs { margin-bottom: var(--spacing-xs); }
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-xl { margin-bottom: var(--spacing-xl); }
    .ml-md { margin-left: var(--spacing-md); }
    .ml-0 { margin-left: 0; }

    /* Typography */
    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-accent { color: var(--color-primary); }
    
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    
    .text-xs { font-size: var(--font-size-xs); }
    .text-\\[0\\.65rem\\] { font-size: 0.65rem; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-2xl { font-size: var(--font-size-2xl); }
    .text-4xl { font-size: 2.25rem; }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .uppercase { text-transform: uppercase; }
    .tracking-wide { letter-spacing: 0.05em; }
    .leading-tight { line-height: var(--line-height-tight); }
    .leading-relaxed { line-height: var(--line-height-relaxed); }
    .italic { font-style: italic; }
    .max-w-\\[50ch\\] { max-width: 50ch; }

    /* Backgrounds & Borders */
    .bg-primary { background: var(--bg-primary); }
    .bg-surface { background: var(--component-surface-raised); }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    
    .border-primary { border: var(--ui-border-width) solid var(--border-primary); }
    .border-secondary { border: var(--ui-border-width) solid var(--border-secondary); }
    .border-primary-light { border: var(--ui-border-width) solid color-mix(in srgb, var(--color-primary) 30%, transparent); }
    .border-bottom { border-bottom: var(--ui-border-width) solid var(--border-primary); }
    
    .rounded-md { border-radius: var(--ui-border-radius-md, 8px); }
    .rounded-lg { border-radius: var(--ui-border-radius-lg); }
    .rounded-full { border-radius: 9999px; }
    
    .shadow-xs { box-shadow: var(--shadow-xs); }
    .shadow-sm { box-shadow: var(--shadow-sm); }
    .shadow-lg { box-shadow: var(--shadow-lg); }
    
    .opacity-0 { opacity: 0; }
    .opacity-100 { opacity: 1; }
    .transition-all { transition: all var(--transition-base); }
    .transition-opacity { transition: opacity var(--transition-base); }

    /* Component specific classes */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); }
    
    .bg-glow {
      top: -30px; left: -30px;
      width: 150px; height: 150px;
      background: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 12%, transparent) 0%, transparent 70%);
      border-radius: 50%;
    }

    .icon-circle-large { width: 72px; height: 72px; }

    .badge-mono-sm {
      display: inline-flex; align-items: center; box-sizing: border-box; line-height: 1;
      font-family: var(--font-mono); font-size: 11px;
      background: var(--bg-secondary); padding: 4px 8px;
      border-radius: var(--ui-border-radius-sm, 4px); border: 1px solid var(--border-secondary);
      color: var(--text-secondary); white-space: nowrap;
    }

    /* Interactive States */
    .hover-border-accent:hover { border-color: color-mix(in srgb, var(--color-primary) 40%, transparent); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
    .group:hover .group-hover\\:opacity-100 { opacity: 1; }
    
    .link-style { text-decoration: none; transition: var(--transition-base); }
    .link-style:hover { color: var(--color-primary); }

    /* ---------------------------------------------------------
       PRIMENG OVERRIDES 
       --------------------------------------------------------- */
    :host ::ng-deep .bento-card.p-card {
      background: var(--component-bg);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      display: flex; flex-direction: column;
    }
    :host ::ng-deep .bento-card .p-card-body { padding: 0; flex: 1; display: flex; flex-direction: column; min-height: 0; }
    :host ::ng-deep .bento-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; min-height: 0; }

    /* Premium Input Overrides */
    :host ::ng-deep .premium-input.p-inputtext {
      background: var(--bg-primary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      transition: var(--transition-base);
      height: 40px;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
    }
    :host ::ng-deep .premium-input.p-inputtext:hover { border-color: var(--color-primary); }
    :host ::ng-deep .premium-input.p-inputtext:focus { border-color: var(--color-primary); box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color); outline: none; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(5px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .card-anim-1 { animation: popIn 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) both; }

    /* Responsive */
    .hidden { display: none; }
    @media (min-width: 768px) {
      .md\\:flex { display: flex; }
      .md\\:flex-row { flex-direction: row; }
      .md\\:items-center { align-items: center; }
      .md\\:justify-center { justify-content: center; }
      .md\\:justify-end { justify-content: flex-end; }
      .md\\:ml-md { margin-left: var(--spacing-md); }
      .md\\:mt-0 { margin-top: 0; }
      .md\\:opacity-0 { opacity: 0; }
      .sm\\:w-20rem { width: 20rem; }
    }
  `]
})
export class ShiftAssignmentsComponent implements OnInit {
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
      finalize(() => this.isLoading.set(false))
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
    this.messageService.showInfo( 'Assign new employee modal would open here.');
  }
}
// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { catchError, map } from 'rxjs/operators';
// import { of } from 'rxjs';

// // Services
// import { MessageService } from 'primeng/api';

// // PrimeNG Modules
// import { TableModule } from 'primeng/table';
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
// import { HRMSService } from '../../hrms.service';

// @Component({
//   selector: 'app-shift-assignments',
//   standalone: true,
//   imports: [
//     CommonModule,
//     TableModule,
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

//     <div class="page-container fade-in">
      
//       <header class="page-header flex-between flex-wrap gap-md mb-4xl slide-down">
//         <div class="flex align-items-center gap-xl">
//           <p-button 
//             icon="pi pi-arrow-left" 
//             [text]="true" 
//             severity="secondary"
//             size="large"
//             (onClick)="onBack()" 
//             pTooltip="Back to Shifts" 
//             tooltipPosition="bottom">
//           </p-button>
          
//           <div class="header-titles flex-col gap-xs">
//             <div class="flex align-items-center gap-md">
//               <div class="icon-brand flex-center bg-primary-light text-primary border-radius-md">
//                 <i class="pi pi-users text-2xl"></i>
//               </div>
//               <h1 class="title font-heading text-3xl font-bold text-primary m-0">Shift Roster</h1>
//             </div>
//             <p class="subtitle text-secondary text-md m-0 max-w-prose">Manage and view all employees assigned to this specific shift.</p>
//           </div>
//         </div>

//         <div class="header-actions">
//           <p-button 
//             label="Assign Employee" 
//             icon="pi pi-plus" 
//             (onClick)="onAssignNew()">
//           </p-button>
//         </div>
//       </header>

//       <p-card styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden p-0">
        
//         @if (isLoading()) {
//           <div class="p-xl">
//             <div class="flex-between mb-xl">
//               <p-skeleton width="200px" height="2.5rem" borderRadius="8px"></p-skeleton>
//               <p-skeleton width="150px" height="2.5rem" borderRadius="8px"></p-skeleton>
//             </div>
//             <div class="flex-col gap-md">
//               <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
//               <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
//               <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
//             </div>
//           </div>
//         } @else {
          
//           @if (assignedUsers().length > 0) {
//             <p-table 
//               #dt
//               [value]="assignedUsers()" 
//               [paginator]="true" 
//               [rows]="10" 
//               [rowsPerPageOptions]="[10, 25, 50]"
//               [globalFilterFields]="['name', 'email', 'code']"
//               responsiveLayout="scroll"
//               styleClass="w-full">
              
//               <ng-template pTemplate="caption">
//                 <div class="flex-between flex-wrap gap-md px-xl py-lg bg-secondary border-bottom-subtle">
//                   <h3 class="m-0 font-bold flex align-items-center gap-sm text-lg text-primary">
//                     Assigned Personnel 
//                     <p-tag severity="info" [value]="assignedUsers().length.toString()" [rounded]="true"></p-tag>
//                   </h3>
                  
//                   <p-iconField iconPosition="left">
//                     <p-inputIcon styleClass="pi pi-search text-tertiary"></p-inputIcon>
//                     <input 
//                       type="text" 
//                       pInputText 
//                       placeholder="Search employees..." 
//                       (input)="dt.filterGlobal($any($event.target).value, 'contains')" 
//                       class="w-full sm:w-20rem" />
//                   </p-iconField>
//                 </div>
//               </ng-template>

//               <ng-template pTemplate="header">
//                 <tr>
//                   <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary">Employee Profile</th>
//                   <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary">Employee ID</th>
//                   <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary">Designation / Role</th>
//                   <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary">Contact Email</th>
//                   <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary text-right">Assignment Status</th>
//                   <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary text-center" style="width: 5rem">Actions</th>
//                 </tr>
//               </ng-template>

//               <ng-template pTemplate="body" let-user>
//                 <tr class="hover-bg-secondary transition-colors">
//                   <td class="px-xl py-md border-bottom-subtle">
//                     <div class="flex align-items-center gap-md">
//                       <p-avatar 
//                         [image]="user.avatar" 
//                         [label]="!user.avatar ? getInitials(user.name) : ''" 
//                         shape="circle" 
//                         size="large"
//                         styleClass="bg-primary-light text-primary font-bold">
//                       </p-avatar>
//                       <div class="flex-col gap-xs">
//                         <span class="font-bold text-primary">{{ user.name || 'Unknown Employee' }}</span>
//                         <span class="text-xs text-secondary">Joined {{ (user.joinDate | date:'MMM yyyy') || 'N/A' }}</span>
//                       </div>
//                     </div>
//                   </td>
//                   <td class="px-xl py-md border-bottom-subtle">
//                     <span class="badge-mono-sm">{{ user.code || user.id || 'N/A' }}</span>
//                   </td>
//                   <td class="px-xl py-md border-bottom-subtle">
//                     <span class="font-medium text-secondary">{{ user.designation || user.role || 'Staff Member' }}</span>
//                   </td>
//                   <td class="px-xl py-md border-bottom-subtle">
//                     <a href="mailto:{{ user.email }}" class="link-style text-sm flex align-items-center gap-sm text-secondary" *ngIf="user.email">
//                       <i class="pi pi-envelope"></i> {{ user.email }}
//                     </a>
//                     <span *ngIf="!user.email" class="text-tertiary text-sm">Not provided</span>
//                   </td>
//                   <td class="px-xl py-md border-bottom-subtle text-right">
//                     <p-tag 
//                       [severity]="user.isActive ? 'success' : 'warn'" 
//                       [value]="user.isActive ? 'Active' : 'Suspended'">
//                     </p-tag>
//                   </td>
//                   <td class="px-xl py-md border-bottom-subtle text-center">
//                     <p-button 
//                       icon="pi pi-ellipsis-v" 
//                       [text]="true" 
//                       [rounded]="true" 
//                       severity="secondary"
//                       pTooltip="Manage Assignment"
//                       tooltipPosition="left">
//                     </p-button>
//                   </td>
//                 </tr>
//               </ng-template>

//               <ng-template pTemplate="emptymessage">
//                 <tr>
//                   <td colspan="6" class="text-center py-5xl">
//                     <div class="empty-state flex-col flex-center">
//                       <i class="pi pi-search text-tertiary text-4xl mb-md"></i>
//                       <h4 class="font-heading text-lg font-bold text-primary m-0 mb-xs">No results found</h4>
//                       <p class="text-secondary m-0">Try adjusting your search criteria.</p>
//                     </div>
//                   </td>
//                 </tr>
//               </ng-template>
//             </p-table>

//           } @else {
//             <div class="empty-state flex-col flex-center text-center py-5xl">
//               <div class="icon-circle-large flex-center bg-secondary border-secondary border-radius-full mb-xl">
//                 <i class="pi pi-user-plus text-primary text-3xl"></i>
//               </div>
//               <h2 class="font-heading text-2xl font-bold text-primary m-0 mb-sm">No Employees Assigned</h2>
//               <p class="text-secondary m-0 mb-xl max-w-prose line-height-relaxed">There are currently no team members scheduled for this shift. Add employees to build out this roster.</p>
//               <p-button 
//                 label="Assign First Employee" 
//                 icon="pi pi-plus" 
//                 (onClick)="onAssignNew()">
//               </p-button>
//             </div>
//           }
//         }
//       </p-card>
//     </div>
//   `,
//   styles: [`
//     /* ==========================================================================
//        BASE & LAYOUT UTILITIES
//        ========================================================================== */
//     :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    
//     .page-container { max-width: 1400px; margin: 0 auto; padding: var(--spacing-2xl) var(--spacing-xl); }
    
//     .flex { display: flex; }
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-center { display: flex; align-items: center; justify-content: center; }
//     .flex-wrap { display: flex; flex-wrap: wrap; }
//     .align-items-center { align-items: center; }
    
//     .w-full { width: 100%; }

//     /* Spacing */
//     .m-0 { margin: 0; }
//     .p-0 { padding: 0 !important; }
//     .mb-xs { margin-bottom: var(--spacing-xs); }
//     .mb-sm { margin-bottom: var(--spacing-sm); }
//     .mb-md { margin-bottom: var(--spacing-md); }
//     .mb-xl { margin-bottom: var(--spacing-xl); }
//     .mb-4xl { margin-bottom: var(--spacing-4xl); }
    
//     .py-md { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
//     .py-lg { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }
//     .py-5xl { padding-top: var(--spacing-5xl); padding-bottom: var(--spacing-5xl); }
//     .px-xl { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
//     .p-xl { padding: var(--spacing-xl); }
    
//     .gap-xs { gap: var(--spacing-xs); }
//     .gap-sm { gap: var(--spacing-sm); }
//     .gap-md { gap: var(--spacing-md); }
//     .gap-xl { gap: var(--spacing-xl); }

//     /* Typography & Colors */
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .font-medium { font-weight: var(--font-weight-medium); }
//     .font-bold { font-weight: var(--font-weight-bold); }
    
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-md { font-size: var(--font-size-md); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-2xl { font-size: var(--font-size-2xl); }
//     .text-3xl { font-size: var(--font-size-3xl); }
//     .text-4xl { font-size: 2.25rem; }
    
//     .text-center { text-align: center; }
//     .text-right { text-align: right; }
//     .uppercase { text-transform: uppercase; }
//     .tracking-widest { letter-spacing: 0.05em; }
//     .line-height-relaxed { line-height: var(--line-height-relaxed); }
//     .max-w-prose { max-width: 65ch; }

//     .text-primary { color: var(--text-primary); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
    
//     .bg-primary { background: var(--bg-primary); }
//     .bg-secondary { background: var(--bg-secondary); }
//     .bg-primary-light { background: var(--color-primary-bg); }

//     /* Borders & Structural Elements */
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }
//     .border-radius-xl { border-radius: var(--ui-border-radius-xl); }
//     .border-radius-full { border-radius: 9999px; }
    
//     .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
//     .border-bottom-primary { border-bottom: 2px solid var(--border-primary); }
//     .border-secondary { border: 1px solid var(--border-secondary); }
//     .shadow-xl { box-shadow: var(--shadow-xl); }
//     .overflow-hidden { overflow: hidden; }

//     /* Component specific classes */
//     .icon-brand { width: 48px; height: 48px; border: 1px solid var(--color-primary); }
//     .icon-circle-large { width: 72px; height: 72px; }
//     .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    
//     .badge-mono-sm {
//       font-family: var(--font-mono); font-size: 11px;
//       background: var(--bg-secondary); padding: 4px 8px;
//       border-radius: 4px; border: 1px solid var(--border-secondary);
//       color: var(--text-secondary); white-space: nowrap;
//     }

//     /* Interactive States (No ng-deep required) */
//     .hover-bg-secondary:hover { background-color: var(--bg-secondary) !important; cursor: pointer; }
//     .transition-colors { transition: background-color 0.2s ease; }
//     .link-style { text-decoration: none; transition: var(--transition-base); }
//     .link-style:hover { color: var(--color-primary) !important; }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }

//     /* Responsive */
//     @media (min-width: 640px) {
//       .sm\\:w-20rem { width: 20rem; }
//     }
//     @media (max-width: 768px) {
//       .page-container { padding: var(--spacing-xl); }
//       .header-actions { margin-top: var(--spacing-md); width: 100%; }
//     }
//   `]
// })
// export class ShiftAssignmentsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   // State
//   shiftId: string = '';
//   isLoading = signal<boolean>(true);
//   assignedUsers = signal<any[]>([]);

//   ngOnInit() {
//     this.shiftId = this.route.snapshot.paramMap.get('id') || '';
    
//     if (this.shiftId) {
//       this.loadAssignments();
//     } else {
//       this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid shift identifier.' });
//       this.router.navigate(['/shifts']);
//     }
//   }

//   private loadAssignments() {
//     this.isLoading.set(true);

//     this.hrmsService.getShiftAssignments(this.shiftId).pipe(
//       map(res => res?.data?.users || []),
//       catchError(error => {
//         this.messageService.add({ severity: 'error', summary: 'Network Error', detail: 'Failed to load shift assignments.' });
//         return of([]);
//       })
//     ).subscribe((users: any[]) => {
//       this.assignedUsers.set(users);
//       this.isLoading.set(false);
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
//     this.messageService.add({ severity: 'info', summary: 'Action Triggered', detail: 'Assign new employee modal would open here.' });
//   }
// }

// // import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, Router } from '@angular/router';
// // import { catchError, map } from 'rxjs/operators';
// // import { of } from 'rxjs';

// // // Services
// // import { MessageService } from 'primeng/api';

// // // PrimeNG Modules
// // import { TableModule } from 'primeng/table';
// // import { CardModule } from 'primeng/card';
// // import { ButtonModule } from 'primeng/button';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { AvatarModule } from 'primeng/avatar';
// // import { TagModule } from 'primeng/tag';
// // import { SkeletonModule } from 'primeng/skeleton';
// // import { ToastModule } from 'primeng/toast';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { IconFieldModule } from 'primeng/iconfield';
// // import { InputIconModule } from 'primeng/inputicon';
// // import { HRMSService } from '../../hrms.service';

// // @Component({
// //   selector: 'app-shift-assignments',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     TableModule,
// //     CardModule,
// //     ButtonModule,
// //     InputTextModule,
// //     AvatarModule,
// //     TagModule,
// //     SkeletonModule,
// //     ToastModule,
// //     TooltipModule,
// //     IconFieldModule,
// //     InputIconModule
// //   ],
// //   providers: [MessageService],
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   template: `
// //     <p-toast position="top-right"></p-toast>

// //     <div class="page-wrapper fade-in">
      
// //       <header class="dashboard-header slide-down mb-4">
// //         <div class="header-left">
// //           <p-button 
// //             icon="pi pi-arrow-left" 
// //             [text]="true" 
// //             [rounded]="true" 
// //             size="large"
// //             styleClass="back-btn"
// //             (onClick)="onBack()" 
// //             pTooltip="Back to Shifts" 
// //             tooltipPosition="bottom">
// //           </p-button>
          
// //           <div class="header-titles">
// //             <div class="title-row">
// //               <div class="icon-brand bg-primary-light text-primary"><i class="pi pi-users"></i></div>
// //               <h1 class="page-title">Shift Roster</h1>
// //             </div>
// //             <p class="page-subtitle mt-1">Manage and view all employees assigned to this specific shift.</p>
// //           </div>
// //         </div>

// //         <div class="header-right">
// //           <p-button 
// //             label="Assign Employee" 
// //             icon="pi pi-plus" 
// //             styleClass="p-button-primary"
// //             (onClick)="onAssignNew()">
// //           </p-button>
// //         </div>
// //       </header>

// //       <p-card styleClass="premium-card glass-card table-card-override">
        
// //         @if (isLoading()) {
// //           <div class="p-4">
// //             <div class="flex-between mb-4">
// //               <p-skeleton width="200px" height="2.5rem" borderRadius="8px"></p-skeleton>
// //               <p-skeleton width="150px" height="2.5rem" borderRadius="8px"></p-skeleton>
// //             </div>
// //             <div class="flex-col gap-3">
// //               <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
// //               <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
// //               <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
// //               <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
// //             </div>
// //           </div>
// //         } @else {
          
// //           @if (assignedUsers().length > 0) {
// //             <p-table 
// //               #dt
// //               [value]="assignedUsers()" 
// //               [paginator]="true" 
// //               [rows]="10" 
// //               [rowsPerPageOptions]="[10, 25, 50]"
// //               [globalFilterFields]="['name', 'email', 'code']"
// //               responsiveLayout="scroll"
// //               styleClass="premium-table">
              
// //               <ng-template pTemplate="caption">
// //                 <div class="table-toolbar">
// //                   <h3 class="m-0 font-bold flex-align gap-2">
// //                     Assigned Personnel 
// //                     <p-tag severity="info" [value]="assignedUsers().length.toString()" [rounded]="true"></p-tag>
// //                   </h3>
                  
// //                   <p-iconField iconPosition="left">
// //                     <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
// //                     <input 
// //                       type="text" 
// //                       pInputText 
// //                       placeholder="Search employees..." 
// //                       (input)="dt.filterGlobal($any($event.target).value, 'contains')" 
// //                       class="premium-search-input" />
// //                   </p-iconField>
// //                 </div>
// //               </ng-template>

// //               <ng-template pTemplate="header">
// //                 <tr>
// //                   <th>Employee Profile</th>
// //                   <th>Employee ID</th>
// //                   <th>Designation / Role</th>
// //                   <th>Contact Email</th>
// //                   <th class="text-right">Assignment Status</th>
// //                   <th class="text-center" style="width: 5rem">Actions</th>
// //                 </tr>
// //               </ng-template>

// //               <ng-template pTemplate="body" let-user>
// //                 <tr class="table-row-hover">
// //                   <td>
// //                     <div class="flex-align gap-3">
// //                       <p-avatar 
// //                         [image]="user.avatar" 
// //                         [label]="!user.avatar ? getInitials(user.name) : ''" 
// //                         shape="circle" 
// //                         size="large"
// //                         [style]="{'background-color': 'var(--color-primary-bg)', 'color': 'var(--color-primary)', 'font-weight': '600'}">
// //                       </p-avatar>
// //                       <div class="flex-col gap-1">
// //                         <span class="font-bold text-primary-color">{{ user.name || 'Unknown Employee' }}</span>
// //                         <span class="text-xs text-secondary">Joined {{ (user.joinDate | date:'MMM yyyy') || 'N/A' }}</span>
// //                       </div>
// //                     </div>
// //                   </td>
// //                   <td><span class="badge-mono-sm">{{ user.code || user.id || 'N/A' }}</span></td>
// //                   <td>
// //                     <span class="font-medium text-secondary">{{ user.designation || user.role || 'Staff Member' }}</span>
// //                   </td>
// //                   <td>
// //                     <a href="mailto:{{ user.email }}" class="link-style text-sm flex-align gap-2" *ngIf="user.email">
// //                       <i class="pi pi-envelope"></i> {{ user.email }}
// //                     </a>
// //                     <span *ngIf="!user.email" class="text-tertiary text-sm">Not provided</span>
// //                   </td>
// //                   <td class="text-right">
// //                     <p-tag 
// //                       [severity]="user.isActive ? 'success' : 'warn'" 
// //                       [value]="user.isActive ? 'Active Assignment' : 'Suspended'">
// //                     </p-tag>
// //                   </td>
// //                   <td class="text-center">
// //                     <p-button 
// //                       icon="pi pi-ellipsis-v" 
// //                       [text]="true" 
// //                       [rounded]="true" 
// //                       severity="secondary"
// //                       pTooltip="Manage Assignment"
// //                       tooltipPosition="left">
// //                     </p-button>
// //                   </td>
// //                 </tr>
// //               </ng-template>

// //               <ng-template pTemplate="emptymessage">
// //                 <tr>
// //                   <td colspan="6" class="text-center py-5">
// //                     <div class="empty-glass-state">
// //                       <i class="pi pi-search text-tertiary text-4xl mb-3"></i>
// //                       <h4 class="m-0 mb-1 text-primary-color">No results found</h4>
// //                       <p class="m-0 text-secondary">Try adjusting your search criteria.</p>
// //                     </div>
// //                   </td>
// //                 </tr>
// //               </ng-template>
// //             </p-table>

// //           } @else {
// //             <div class="empty-glass-state py-6">
// //               <div class="icon-circle-large mb-4"><i class="pi pi-user-plus text-primary"></i></div>
// //               <h2 class="text-primary-color m-0 mb-2 font-heading">No Employees Assigned</h2>
// //               <p class="text-secondary m-0 mb-4 max-w-md text-center">There are currently no team members scheduled for this shift. Add employees to build out this roster.</p>
// //               <p-button 
// //                 label="Assign First Employee" 
// //                 icon="pi pi-plus" 
// //                 (onClick)="onAssignNew()">
// //               </p-button>
// //             </div>
// //           }
// //         }
// //       </p-card>
// //     </div>
// //   `,
// //   styles: [`
// //     /* --------------------------------------------------------------------------
// //        GLOBAL & VARIABLES
// //        -------------------------------------------------------------------------- */
// //     :host {
// //       display: block;
// //       width: 100%;
// //       min-height: 100vh;
// //       background-color: var(--bg-primary);
// //       color: var(--text-primary);
// //       font-family: var(--font-body);
// //     }

// //     .page-wrapper {
// //       padding: var(--spacing-2xl) var(--spacing-3xl);
// //       max-width: 1600px;
// //       margin: 0 auto;
// //     }

// //     /* Helpers */
// //     .flex-col { display: flex; flex-direction: column; }
// //     .flex-between { display: flex; justify-content: space-between; align-items: center; }
// //     .flex-align { display: flex; align-items: center; }
    
// //     .gap-1 { gap: var(--spacing-xs); }
// //     .gap-2 { gap: var(--spacing-sm); }
// //     .gap-3 { gap: var(--spacing-md); }
    
// //     .mb-1 { margin-bottom: var(--spacing-xs); }
// //     .mb-2 { margin-bottom: var(--spacing-sm); }
// //     .mb-3 { margin-bottom: var(--spacing-md); }
// //     .mb-4 { margin-bottom: var(--spacing-xl); }
// //     .mt-1 { margin-top: var(--spacing-xs); }
    
// //     .p-4 { padding: var(--spacing-xl); }
// //     .py-5 { padding-top: var(--spacing-2xl); padding-bottom: var(--spacing-2xl); }
// //     .py-6 { padding-top: var(--spacing-3xl); padding-bottom: var(--spacing-3xl); }
    
// //     .text-right { text-align: right; }
// //     .text-center { text-align: center; }
// //     .text-sm { font-size: var(--font-size-sm); }
// //     .text-xs { font-size: var(--font-size-xs); }
// //     .text-secondary { color: var(--text-secondary); }
// //     .text-tertiary { color: var(--text-tertiary); }
// //     .text-primary-color { color: var(--text-primary); }
// //     .text-primary { color: var(--color-primary); }
    
// //     .font-medium { font-weight: var(--font-weight-medium); }
// //     .font-bold { font-weight: var(--font-weight-bold); }
// //     .font-heading { font-family: var(--font-heading); }
    
// //     .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
// //     .max-w-md { max-width: 28rem; }

// //     /* --------------------------------------------------------------------------
// //        HEADER
// //        -------------------------------------------------------------------------- */
// //     .dashboard-header {
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       background: var(--component-bg, var(--bg-secondary));
// //       padding: var(--spacing-xl) var(--spacing-2xl);
// //       border-radius: var(--ui-border-radius-xl);
// //       border: var(--ui-border-width) solid var(--border-primary);
// //       box-shadow: var(--shadow-sm);
// //     }
    
// //     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
// //     ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; }
// //     ::ng-deep .back-btn:hover { color: var(--color-primary) !important; background: var(--color-primary-bg) !important; border-color: var(--color-primary-border) !important; }
    
// //     .header-titles { display: flex; flex-direction: column; }
// //     .title-row { display: flex; align-items: center; gap: var(--spacing-md); }
    
// //     .icon-brand {
// //       display: flex; align-items: center; justify-content: center;
// //       width: 40px; height: 40px; border-radius: 10px;
// //       font-size: var(--font-size-xl);
// //     }
// //     .page-title { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; color: var(--text-primary); letter-spacing: -0.02em; }
// //     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

// //     /* --------------------------------------------------------------------------
// //        CARD & TABLE
// //        -------------------------------------------------------------------------- */
// //     .glass-card {
// //       background: var(--component-bg, var(--bg-primary));
// //       border: var(--ui-border-width) solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       box-shadow: var(--shadow-md);
// //       overflow: hidden;
// //     }
    
// //     ::ng-deep .table-card-override .p-card-body { padding: 0; }
// //     ::ng-deep .table-card-override .p-card-content { padding: 0; }

// //     .table-toolbar {
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       padding: var(--spacing-xl) var(--spacing-2xl);
// //       background: var(--bg-secondary);
// //       border-bottom: 1px solid var(--border-primary);
// //     }

// //     ::ng-deep .premium-search-input {
// //       background: var(--bg-primary) !important;
// //       border: 1px solid var(--border-primary) !important;
// //       border-radius: var(--ui-border-radius-lg) !important;
// //       min-width: 250px;
// //     }
// //     ::ng-deep .premium-search-input:focus { border-color: var(--color-primary) !important; box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

// //     ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
// //     ::ng-deep .premium-table .p-datatable-thead > tr > th {
// //       background: var(--bg-primary) !important;
// //       border-bottom: 2px solid var(--border-primary) !important;
// //       color: var(--text-tertiary);
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-bold);
// //       text-transform: uppercase;
// //       letter-spacing: 0.05em;
// //       padding: var(--spacing-lg) var(--spacing-2xl);
// //     }
// //     ::ng-deep .premium-table .p-datatable-tbody > tr > td {
// //       border-bottom: 1px solid var(--border-primary);
// //       padding: var(--spacing-md) var(--spacing-2xl);
// //       color: var(--text-secondary);
// //       transition: background-color 0.2s;
// //     }
// //     ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }
    
// //     /* Elements */
// //     .badge-mono-sm {
// //       font-family: var(--font-mono); font-size: 12px;
// //       background: var(--bg-secondary); padding: 4px 8px;
// //       border-radius: 4px; border: 1px solid var(--border-primary);
// //       color: var(--text-secondary);
// //     }

// //     .link-style { color: var(--text-secondary); text-decoration: none; transition: var(--transition-base); }
// //     .link-style:hover { color: var(--color-primary); }

// //     /* Empty States */
// //     .empty-glass-state {
// //       display: flex; flex-direction: column; align-items: center; justify-content: center;
// //       text-align: center; background: transparent;
// //     }
// //     .icon-circle-large {
// //       width: 72px; height: 72px; border-radius: 50%;
// //       background: var(--color-primary-bg); display: flex; align-items: center; justify-content: center;
// //       font-size: 2.5rem; border: 1px solid var(--color-primary-border);
// //     }

// //     /* Animations */
// //     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// //     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
// //     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
// //     .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); }

// //     /* Responsive */
// //     @media (max-width: 768px) {
// //       .page-wrapper { padding: var(--spacing-xl); }
// //       .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-xl); }
// //       .header-right { justify-content: flex-start; }
// //       .table-toolbar { flex-direction: column; align-items: flex-start; gap: var(--spacing-md); }
// //       ::ng-deep .premium-search-input { width: 100%; }
// //     }
// //   `]
// // })
// // export class ShiftAssignmentsComponent implements OnInit {
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private hrmsService = inject(HRMSService);
// //   private messageService = inject(AppMessageService);

// //   // State
// //   shiftId: string = '';
// //   isLoading = signal<boolean>(true);
// //   assignedUsers = signal<any[]>([]);

// //   ngOnInit() {
// //     // Attempt to grab shift ID from URL route params
// //     this.shiftId = this.route.snapshot.paramMap.get('id') || '';
    
// //     if (this.shiftId) {
// //       this.loadAssignments();
// //     } else {
// //       // Fallback/Error state if accessed without ID
// //       this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid shift identifier.' });
// //       this.router.navigate(['/shifts']);
// //     }
// //   }

// //   private loadAssignments() {
// //     this.isLoading.set(true);

// //     this.hrmsService.getShiftAssignments(this.shiftId).pipe(
// //       map(res => res?.data?.users || []),
// //       catchError(error => {
// //         this.messageService.add({ severity: 'error', summary: 'Network Error', detail: 'Failed to load shift assignments.' });
// //         return of([]);
// //       })
// //     ).subscribe((users: any[]) => {
// //       this.assignedUsers.set(users);
// //       this.isLoading.set(false);
// //     });
// //   }

// //   // --- Helpers & Actions ---

// //   getInitials(name: string): string {
// //     if (!name || name.trim() === '') return '?';
// //     return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
// //   }

// //   onBack() {
// //     this.router.navigate(['/shifts']); // Adjust route as needed
// //   }

// //   onAssignNew() {
// //     // Stub for opening an assignment modal or routing to a form
// //     this.messageService.add({ severity: 'info', summary: 'Action Triggered', detail: 'Assign new employee modal would open here.' });
// //   }
// // }