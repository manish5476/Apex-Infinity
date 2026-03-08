import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
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
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-shift-assignments',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
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

    <div class="page-wrapper fade-in">
      
      <header class="dashboard-header slide-down mb-4">
        <div class="header-left">
          <p-button 
            icon="pi pi-arrow-left" 
            [text]="true" 
            [rounded]="true" 
            size="large"
            styleClass="back-btn"
            (onClick)="onBack()" 
            pTooltip="Back to Shifts" 
            tooltipPosition="bottom">
          </p-button>
          
          <div class="header-titles">
            <div class="title-row">
              <div class="icon-brand bg-primary-light text-primary"><i class="pi pi-users"></i></div>
              <h1 class="page-title">Shift Roster</h1>
            </div>
            <p class="page-subtitle mt-1">Manage and view all employees assigned to this specific shift.</p>
          </div>
        </div>

        <div class="header-right">
          <p-button 
            label="Assign Employee" 
            icon="pi pi-plus" 
            styleClass="p-button-primary"
            (onClick)="onAssignNew()">
          </p-button>
        </div>
      </header>

      <p-card styleClass="premium-card glass-card table-card-override">
        
        @if (isLoading()) {
          <div class="p-4">
            <div class="flex-between mb-4">
              <p-skeleton width="200px" height="2.5rem" borderRadius="8px"></p-skeleton>
              <p-skeleton width="150px" height="2.5rem" borderRadius="8px"></p-skeleton>
            </div>
            <div class="flex-col gap-3">
              <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
              <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
              <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
              <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
            </div>
          </div>
        } @else {
          
          @if (assignedUsers().length > 0) {
            <p-table 
              #dt
              [value]="assignedUsers()" 
              [paginator]="true" 
              [rows]="10" 
              [rowsPerPageOptions]="[10, 25, 50]"
              [globalFilterFields]="['name', 'email', 'code']"
              responsiveLayout="scroll"
              styleClass="premium-table">
              
              <ng-template pTemplate="caption">
                <div class="table-toolbar">
                  <h3 class="m-0 font-bold flex-align gap-2">
                    Assigned Personnel 
                    <p-tag severity="info" [value]="assignedUsers().length.toString()" [rounded]="true"></p-tag>
                  </h3>
                  
                  <p-iconField iconPosition="left">
                    <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                    <input 
                      type="text" 
                      pInputText 
                      placeholder="Search employees..." 
                      (input)="dt.filterGlobal($any($event.target).value, 'contains')" 
                      class="premium-search-input" />
                  </p-iconField>
                </div>
              </ng-template>

              <ng-template pTemplate="header">
                <tr>
                  <th>Employee Profile</th>
                  <th>Employee ID</th>
                  <th>Designation / Role</th>
                  <th>Contact Email</th>
                  <th class="text-right">Assignment Status</th>
                  <th class="text-center" style="width: 5rem">Actions</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-user>
                <tr class="table-row-hover">
                  <td>
                    <div class="flex-align gap-3">
                      <p-avatar 
                        [image]="user.avatar" 
                        [label]="!user.avatar ? getInitials(user.name) : ''" 
                        shape="circle" 
                        size="large"
                        [style]="{'background-color': 'var(--color-primary-bg)', 'color': 'var(--color-primary)', 'font-weight': '600'}">
                      </p-avatar>
                      <div class="flex-col gap-1">
                        <span class="font-bold text-primary-color">{{ user.name || 'Unknown Employee' }}</span>
                        <span class="text-xs text-secondary">Joined {{ (user.joinDate | date:'MMM yyyy') || 'N/A' }}</span>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge-mono-sm">{{ user.code || user.id || 'N/A' }}</span></td>
                  <td>
                    <span class="font-medium text-secondary">{{ user.designation || user.role || 'Staff Member' }}</span>
                  </td>
                  <td>
                    <a href="mailto:{{ user.email }}" class="link-style text-sm flex-align gap-2" *ngIf="user.email">
                      <i class="pi pi-envelope"></i> {{ user.email }}
                    </a>
                    <span *ngIf="!user.email" class="text-tertiary text-sm">Not provided</span>
                  </td>
                  <td class="text-right">
                    <p-tag 
                      [severity]="user.isActive ? 'success' : 'warn'" 
                      [value]="user.isActive ? 'Active Assignment' : 'Suspended'">
                    </p-tag>
                  </td>
                  <td class="text-center">
                    <p-button 
                      icon="pi pi-ellipsis-v" 
                      [text]="true" 
                      [rounded]="true" 
                      severity="secondary"
                      pTooltip="Manage Assignment"
                      tooltipPosition="left">
                    </p-button>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6" class="text-center py-5">
                    <div class="empty-glass-state">
                      <i class="pi pi-search text-tertiary text-4xl mb-3"></i>
                      <h4 class="m-0 mb-1 text-primary-color">No results found</h4>
                      <p class="m-0 text-secondary">Try adjusting your search criteria.</p>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>

          } @else {
            <div class="empty-glass-state py-6">
              <div class="icon-circle-large mb-4"><i class="pi pi-user-plus text-primary"></i></div>
              <h2 class="text-primary-color m-0 mb-2 font-heading">No Employees Assigned</h2>
              <p class="text-secondary m-0 mb-4 max-w-md text-center">There are currently no team members scheduled for this shift. Add employees to build out this roster.</p>
              <p-button 
                label="Assign First Employee" 
                icon="pi pi-plus" 
                (onClick)="onAssignNew()">
              </p-button>
            </div>
          }
        }
      </p-card>
    </div>
  `,
  styles: [`
    /* --------------------------------------------------------------------------
       GLOBAL & VARIABLES
       -------------------------------------------------------------------------- */
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-body);
    }

    .page-wrapper {
      padding: var(--spacing-2xl) var(--spacing-3xl);
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Helpers */
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    
    .mb-1 { margin-bottom: var(--spacing-xs); }
    .mb-2 { margin-bottom: var(--spacing-sm); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    
    .p-4 { padding: var(--spacing-xl); }
    .py-5 { padding-top: var(--spacing-2xl); padding-bottom: var(--spacing-2xl); }
    .py-6 { padding-top: var(--spacing-3xl); padding-bottom: var(--spacing-3xl); }
    
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-heading { font-family: var(--font-heading); }
    
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .max-w-md { max-width: 28rem; }

    /* --------------------------------------------------------------------------
       HEADER
       -------------------------------------------------------------------------- */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--component-bg, var(--bg-secondary));
      padding: var(--spacing-xl) var(--spacing-2xl);
      border-radius: var(--ui-border-radius-xl);
      border: var(--ui-border-width) solid var(--border-primary);
      box-shadow: var(--shadow-sm);
    }
    
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; }
    ::ng-deep .back-btn:hover { color: var(--color-primary) !important; background: var(--color-primary-bg) !important; border-color: var(--color-primary-border) !important; }
    
    .header-titles { display: flex; flex-direction: column; }
    .title-row { display: flex; align-items: center; gap: var(--spacing-md); }
    
    .icon-brand {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 10px;
      font-size: var(--font-size-xl);
    }
    .page-title { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; color: var(--text-primary); letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

    /* --------------------------------------------------------------------------
       CARD & TABLE
       -------------------------------------------------------------------------- */
    .glass-card {
      background: var(--component-bg, var(--bg-primary));
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }
    
    ::ng-deep .table-card-override .p-card-body { padding: 0; }
    ::ng-deep .table-card-override .p-card-content { padding: 0; }

    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-xl) var(--spacing-2xl);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-primary);
    }

    ::ng-deep .premium-search-input {
      background: var(--bg-primary) !important;
      border: 1px solid var(--border-primary) !important;
      border-radius: var(--ui-border-radius-lg) !important;
      min-width: 250px;
    }
    ::ng-deep .premium-search-input:focus { border-color: var(--color-primary) !important; box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th {
      background: var(--bg-primary) !important;
      border-bottom: 2px solid var(--border-primary) !important;
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: var(--spacing-lg) var(--spacing-2xl);
    }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td {
      border-bottom: 1px solid var(--border-primary);
      padding: var(--spacing-md) var(--spacing-2xl);
      color: var(--text-secondary);
      transition: background-color 0.2s;
    }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }
    
    /* Elements */
    .badge-mono-sm {
      font-family: var(--font-mono); font-size: 12px;
      background: var(--bg-secondary); padding: 4px 8px;
      border-radius: 4px; border: 1px solid var(--border-primary);
      color: var(--text-secondary);
    }

    .link-style { color: var(--text-secondary); text-decoration: none; transition: var(--transition-base); }
    .link-style:hover { color: var(--color-primary); }

    /* Empty States */
    .empty-glass-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; background: transparent;
    }
    .icon-circle-large {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--color-primary-bg); display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem; border: 1px solid var(--color-primary-border);
    }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); }

    /* Responsive */
    @media (max-width: 768px) {
      .page-wrapper { padding: var(--spacing-xl); }
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-xl); }
      .header-right { justify-content: flex-start; }
      .table-toolbar { flex-direction: column; align-items: flex-start; gap: var(--spacing-md); }
      ::ng-deep .premium-search-input { width: 100%; }
    }
  `]
})
export class ShiftAssignmentsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);

  // State
  shiftId: string = '';
  isLoading = signal<boolean>(true);
  assignedUsers = signal<any[]>([]);

  ngOnInit() {
    // Attempt to grab shift ID from URL route params
    this.shiftId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.shiftId) {
      this.loadAssignments();
    } else {
      // Fallback/Error state if accessed without ID
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid shift identifier.' });
      this.router.navigate(['/shifts']);
    }
  }

  private loadAssignments() {
    this.isLoading.set(true);

    this.hrmsService.getShiftAssignments(this.shiftId).pipe(
      map(res => res?.data?.users || []),
      catchError(error => {
        this.messageService.add({ severity: 'error', summary: 'Network Error', detail: 'Failed to load shift assignments.' });
        return of([]);
      })
    ).subscribe((users: any[]) => {
      this.assignedUsers.set(users);
      this.isLoading.set(false);
    });
  }

  // --- Helpers & Actions ---

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  onBack() {
    this.router.navigate(['/shifts']); // Adjust route as needed
  }

  onAssignNew() {
    // Stub for opening an assignment modal or routing to a form
    this.messageService.add({ severity: 'info', summary: 'Action Triggered', detail: 'Assign new employee modal would open here.' });
  }
}