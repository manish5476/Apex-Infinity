import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Services
import { HRMSService } from '../../../hrms.service';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-department-details',
  standalone: true,
  imports: [
    CommonModule, RouterModule, DatePipe,
    CardModule, ButtonModule, TagModule, DividerModule, 
    ConfirmDialogModule, ToastModule, SkeletonModule, 
    TooltipModule, ProgressBarModule, AvatarModule, TableModule
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>
    <p-confirmDialog styleClass="premium-confirm-dialog"></p-confirmDialog>

    <div class="page-wrapper fade-in">
      
      @if (isLoading()) {
        <div class="header-skeleton mb-4">
          <div class="flex-align gap-3">
            <p-skeleton shape="circle" size="3.5rem"></p-skeleton>
            <div class="flex-col gap-2">
              <p-skeleton width="15rem" height="2rem"></p-skeleton>
              <p-skeleton width="8rem" height="1rem"></p-skeleton>
            </div>
          </div>
          <p-skeleton width="8rem" height="2.5rem"></p-skeleton>
        </div>
        
        <div class="bento-grid">
          <div class="span-2"><p-skeleton height="100%" borderRadius="12px"></p-skeleton></div>
          <div><p-skeleton height="16rem" borderRadius="12px"></p-skeleton></div>
          <div><p-skeleton height="14rem" borderRadius="12px"></p-skeleton></div>
          <div><p-skeleton height="14rem" borderRadius="12px"></p-skeleton></div>
          <div><p-skeleton height="14rem" borderRadius="12px"></p-skeleton></div>
          <div class="span-3"><p-skeleton height="20rem" borderRadius="12px"></p-skeleton></div>
        </div>
      }

      @if (dept(); as data) {
        
        <header class="dashboard-header slide-down">
          <div class="header-left">
            <p-button 
              icon="pi pi-arrow-left" 
              [text]="true" 
              [rounded]="true" 
              size="large"
              styleClass="back-btn"
              (onClick)="onBack()" 
              pTooltip="Back to Directory" 
              tooltipPosition="bottom">
            </p-button>
            
            <div class="header-titles">
              <div class="title-row">
                <div class="icon-brand"><i class="pi pi-building"></i></div>
                <h1 class="page-title">{{ data.name }}</h1>
                <p-tag 
                  [severity]="data.isActive ? 'success' : 'danger'" 
                  [value]="data.isActive ? 'Active' : 'Inactive'"
                  styleClass="ml-2">
                </p-tag>
              </div>
              <div class="subtitle-row">
                <span class="badge-mono">{{ data.code }}</span>
                <span class="text-tertiary px-2">•</span>
                <span class="text-secondary">Established {{ (data.metadata?.establishedDate | date:'mediumDate' )|| 'N/A' }}</span>
              </div>
            </div>
          </div>
          
          <div class="header-right flex-align gap-3">
            <p-button 
              [icon]="data.isActive ? 'pi pi-ban' : 'pi pi-check-circle'" 
              [label]="data.isActive ? 'Deactivate' : 'Activate'" 
              [severity]="data.isActive ? 'danger' : 'success'"
              [outlined]="true"
              (onClick)="toggleStatus()">
            </p-button>
            
            <p-button 
              icon="pi pi-pencil" 
              label="Edit Details" 
              (onClick)="onEditDepartment()">
            </p-button>
          </div>
        </header>

        <main class="dashboard-content mt-5">
          <div class="bento-grid">
            
            <p-card header="Department Overview" styleClass="grid-card span-2 card-anim-1">
              <p class="text-secondary mb-4 description-text">
                {{ data.description || 'No detailed description has been provided for this department yet.' }}
              </p>
              
              <div class="inner-grid-2 mt-auto">
                <div class="info-group bg-surface p-3 border-radius-md">
                  <span class="info-label"><i class="pi pi-sitemap mr-1"></i> Organization ID</span>
                  <span class="info-value font-mono mt-1">{{ data.organizationId || 'Root Level' }}</span>
                </div>
                <div class="info-group bg-surface p-3 border-radius-md">
                  <span class="info-label"><i class="pi pi-map-marker mr-1"></i> Branch Location</span>
                  <span class="info-value mt-1">{{ data.branchId?.name || 'Unassigned' }}</span>
                </div>
              </div>
            </p-card>

            <p-card header="Leadership" styleClass="grid-card card-anim-2">
              <div class="flex-col gap-4">
                <div class="user-profile">
                  <p-avatar [label]="getInitials(data.headOfDepartment?.name)" size="large" shape="circle" [style]="{'background-color': 'var(--color-primary-bg)', 'color': 'var(--color-primary)'}"></p-avatar>
                  <div class="user-details">
                    <span class="info-label text-primary">Head of Department</span>
                    <span class="info-value font-bold">{{ data.headOfDepartment?.name || 'Unassigned' }}</span>
                    <a href="mailto:{{ data.headOfDepartment?.email }}" class="text-xs link-style" *ngIf="data.headOfDepartment?.email">{{ data.headOfDepartment?.email }}</a>
                  </div>
                </div>

                <div class="user-profile">
                  <p-avatar [label]="getInitials(data.assistantHOD?.name)" size="large" shape="circle" [style]="{'background-color': 'var(--bg-secondary)', 'color': 'var(--text-secondary)'}"></p-avatar>
                  <div class="user-details">
                    <span class="info-label">Assistant HOD</span>
                    <span class="info-value font-bold">{{ data.assistantHOD?.name || 'Unassigned' }}</span>
                    <a href="mailto:{{ data.assistantHOD?.email }}" class="text-xs link-style" *ngIf="data.assistantHOD?.email">{{ data.assistantHOD?.email }}</a>
                  </div>
                </div>
              </div>
            </p-card>

            <p-card header="Operations & Budget" styleClass="grid-card card-anim-3">
              <div class="flex-col gap-4">
                <div class="inner-grid-2">
                  <div class="info-group">
                    <span class="info-label">Cost Center</span>
                    <span class="badge-mono mt-1">{{ data.costCenter || 'N/A' }}</span>
                  </div>
                  <div class="info-group">
                    <span class="info-label">Budget Code</span>
                    <span class="badge-mono mt-1">{{ data.budgetCode || 'N/A' }}</span>
                  </div>
                </div>

                <div class="divider-subtle"></div>

                <div class="info-group">
                  <div class="flex-between mb-2">
                    <span class="info-label">Headcount Utilization</span>
                    <span class="info-label font-bold text-primary">{{ data.employeeCount || 0 }} / {{ data.maxStrength || 0 }}</span>
                  </div>
                  <p-progressBar 
                    [value]="getUtilization(data.employeeCount, data.maxStrength)" 
                    [showValue]="false" 
                    [style]="{'height': '6px'}"
                    [color]="getUtilizationColor(data.employeeCount, data.maxStrength)">
                  </p-progressBar>
                </div>
              </div>
            </p-card>

            <p-card header="Contact Information" styleClass="grid-card card-anim-4">
              <div class="flex-col gap-4">
                <div class="contact-item">
                  <div class="icon-wrapper bg-info-light text-info"><i class="pi pi-envelope"></i></div>
                  <div class="info-group">
                    <span class="info-label">Email Address</span>
                    <a href="mailto:{{ data.contactEmail }}" class="info-value link-style">{{ data.contactEmail || 'N/A' }}</a>
                  </div>
                </div>
                
                <div class="contact-item">
                  <div class="icon-wrapper bg-success-light text-success"><i class="pi pi-phone"></i></div>
                  <div class="info-group">
                    <span class="info-label">Phone Number</span>
                    <span class="info-value">{{ data.contactPhone || 'N/A' }}</span>
                  </div>
                </div>
                
                <div class="contact-item">
                  <div class="icon-wrapper bg-primary-light text-primary"><i class="pi pi-building"></i></div>
                  <div class="info-group">
                    <span class="info-label">Physical Location</span>
                    <span class="info-value">{{ data.location || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </p-card>

            <p-card header="System Metadata" styleClass="grid-card card-anim-5">
              <div class="flex-col gap-4">
                <div class="inner-grid-2">
                  <div class="info-group">
                    <span class="info-label">Division</span>
                    <span class="info-value font-medium">{{ data.metadata?.division || 'N/A' }}</span>
                  </div>
                  <div class="info-group">
                    <span class="info-label">Region</span>
                    <span class="info-value font-medium">{{ data.metadata?.region || 'N/A' }}</span>
                  </div>
                </div>

                <div class="divider-subtle"></div>
                
                <div class="inner-grid-2">
                  <div class="info-group">
                    <span class="info-label">Created By</span>
                    <span class="info-value text-sm flex-align gap-2">
                      <i class="pi pi-user-edit text-tertiary"></i>
                      {{ data.createdBy?.name || 'System' }}
                    </span>
                  </div>
                  <div class="info-group">
                    <span class="info-label">Last Updated</span>
                    <span class="info-value text-sm flex-align gap-2">
                      <i class="pi pi-clock text-tertiary"></i>
                      {{ (data.updatedAt | date:'mediumDate') || 'N/A' }}
                    </span>
                  </div>
                </div>
              </div>
            </p-card>

            <p-card header="Team Members & Workforce" styleClass="grid-card span-3 card-anim-6 table-card-override">
              @if (employees().length > 0) {
                <p-table 
                  [value]="employees()" 
                  [paginator]="true" 
                  [rows]="5" 
                  [rowsPerPageOptions]="[5, 10, 20]"
                  responsiveLayout="scroll"
                  styleClass="premium-table">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Employee Profile</th>
                      <th>System ID</th>
                      <th>Status</th>
                      <th class="text-right">Account State</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-emp>
                    <tr>
                      <td>
                        <div class="flex-align gap-3">
                          <p-avatar 
                            [image]="emp.avatar" 
                            [label]="!emp.avatar ? getInitials(emp.name) : ''" 
                            shape="circle" 
                            size="large"
                            [style]="{'background-color': 'var(--bg-secondary)', 'color': 'var(--text-secondary)'}">
                          </p-avatar>
                          <div class="flex-col gap-1">
                            <span class="font-bold text-primary-color">{{ emp.name }}</span>
                            <span class="text-xs text-secondary">{{ emp.email }}</span>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge-mono-sm">{{ emp._id | slice:0:8 }}...</span></td>
                      <td>
                        <p-tag 
                          [severity]="emp.status === 'approved' ? 'success' : (emp.status === 'pending' ? 'warn' : 'info')" 
                          [value]="emp.status | titlecase">
                        </p-tag>
                      </td>
                      <td class="text-right">
                        <div class="status-indicator-wrapper flex-align justify-end gap-2">
                          <span class="text-sm font-medium">{{ emp.isActive ? 'Active' : 'Suspended' }}</span>
                          <div class="status-dot" [class.active]="emp.isActive"></div>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              } @else {
                <div class="empty-glass-state py-5">
                  <div class="icon-circle-large mb-3"><i class="pi pi-users text-tertiary"></i></div>
                  <h3 class="text-primary-color m-0 mb-1">No Employees Found</h3>
                  <p class="text-secondary m-0">There are currently no active team members assigned to this department.</p>
                </div>
              }
            </p-card>

          </div>
        </main>
      }
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
    .justify-end { justify-content: flex-end; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .mb-2 { margin-bottom: var(--spacing-sm); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-lg); }
    .mb-5 { margin-bottom: var(--spacing-xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-5 { margin-top: var(--spacing-xl); }
    .mt-auto { margin-top: auto; }
    
    .p-3 { padding: var(--spacing-lg); }
    .py-5 { padding-top: var(--spacing-2xl); padding-bottom: var(--spacing-2xl); }
    .px-2 { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
    .ml-2 { margin-left: var(--spacing-sm); }

    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-semibold { font-weight: var(--font-weight-semibold); }
    .font-bold { font-weight: var(--font-weight-bold); }

    /* Colors */
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .bg-success-light { background: var(--color-success-bg, #ecfdf5); }
    .bg-info-light { background: var(--color-info-bg, #f0f9ff); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-info { color: var(--color-info); }

    .border-radius-md { border-radius: var(--ui-border-radius); }
    .divider-subtle { height: 1px; background: var(--border-primary); margin: 0; width: 100%; }

    /* --------------------------------------------------------------------------
       HEADER
       -------------------------------------------------------------------------- */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--component-bg, var(--bg-primary));
      padding: var(--spacing-xl) var(--spacing-2xl);
      border-radius: var(--ui-border-radius-xl);
      border: var(--ui-border-width) solid var(--border-primary);
      box-shadow: var(--shadow-sm);
    }
    .header-skeleton {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--bg-primary); padding: var(--spacing-2xl);
      border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary);
    }

    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-secondary) !important; border: none !important; }
    ::ng-deep .back-btn:hover { color: var(--color-primary) !important; background: var(--color-primary-bg) !important; }
    
    .header-titles { display: flex; flex-direction: column; gap: 4px; }
    .title-row { display: flex; align-items: center; gap: var(--spacing-sm); }
    
    .icon-brand {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 8px;
      background: var(--color-primary-bg); color: var(--color-primary);
      font-size: var(--font-size-md);
    }
    .page-title { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; color: var(--text-primary); letter-spacing: -0.02em; }
    .subtitle-row { display: flex; align-items: center; font-size: var(--font-size-sm); }

    /* --------------------------------------------------------------------------
       BENTO GRID & CARDS
       -------------------------------------------------------------------------- */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-2xl);
      align-items: stretch;
    }
    .span-2 { grid-column: span 2; }
    .span-3 { grid-column: span 3; }
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    
    ::ng-deep .grid-card .p-card {
      height: 100%;
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-xs);
      border: var(--ui-border-width) solid var(--border-primary);
      background: var(--component-bg, var(--bg-primary));
      transition: var(--transition-base);
    }
    ::ng-deep .grid-card .p-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-border, var(--border-secondary));
      transform: translateY(-2px);
    }
    ::ng-deep .grid-card .p-card-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); }
    ::ng-deep .grid-card .p-card-body { padding: var(--spacing-2xl); display: flex; flex-direction: column; height: 100%; }
    ::ng-deep .grid-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; }

    /* --------------------------------------------------------------------------
       TYPOGRAPHY & ELEMENTS
       -------------------------------------------------------------------------- */
    .description-text { line-height: 1.6; font-size: var(--font-size-md); }
    
    .info-group { display: flex; flex-direction: column; }
    .info-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: var(--font-size-md); color: var(--text-primary); font-weight: var(--font-weight-medium); }

    .badge-mono {
      font-family: var(--font-mono); font-size: var(--font-size-sm);
      background: var(--bg-secondary); padding: 4px 10px;
      border-radius: 6px; border: var(--ui-border-width) solid var(--border-primary);
      display: inline-block; width: max-content; color: var(--text-secondary);
    }
    .font-mono { font-family: var(--font-mono); }

    .link-style { color: var(--color-primary); text-decoration: none; transition: var(--transition-base); }
    .link-style:hover { text-decoration: underline; color: var(--color-primary-dark); }

    .user-profile {
      display: flex; align-items: center; gap: var(--spacing-lg);
      padding: var(--spacing-lg); border-radius: var(--ui-border-radius-lg);
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      transition: var(--transition-base);
    }
    .user-profile:hover { border-color: var(--color-primary-border); background: var(--bg-primary); }
    .user-details { display: flex; flex-direction: column; gap: 2px; }

    .contact-item { display: flex; align-items: center; gap: var(--spacing-lg); }
    .icon-wrapper {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }

    /* --------------------------------------------------------------------------
       PREMIUM TABLE OVERRIDES
       -------------------------------------------------------------------------- */
    ::ng-deep .table-card-override .p-card-body { padding: 0; }
    ::ng-deep .table-card-override .p-card-title { padding: var(--spacing-2xl) var(--spacing-2xl) 0 var(--spacing-2xl); }
    
    ::ng-deep .premium-table .p-datatable-header { display: none; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th {
      background: var(--bg-primary) !important;
      border-bottom: 2px solid var(--border-primary) !important;
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: var(--spacing-xl) var(--spacing-2xl);
    }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td {
      border-bottom: 1px solid var(--border-primary);
      padding: var(--spacing-lg) var(--spacing-2xl);
      color: var(--text-secondary);
      transition: background-color 0.2s;
    }
    ::ng-deep .premium-table .p-datatable-tbody > tr:hover > td { background: var(--bg-secondary) !important; }
    
    .badge-mono-sm {
      font-family: var(--font-mono); font-size: 12px;
      background: var(--bg-secondary); padding: 4px 8px;
      border-radius: 4px; border: 1px solid var(--border-primary);
    }

    .status-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--color-error); box-shadow: 0 0 0 3px var(--color-error-bg);
    }
    .status-dot.active {
      background: var(--color-success); box-shadow: 0 0 0 3px var(--color-success-bg);
    }

    .empty-glass-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; background: transparent;
    }
    .icon-circle-large {
      width: 64px; height: 64px; border-radius: 50%;
      background: var(--bg-secondary); display: flex; align-items: center; justify-content: center;
      font-size: 2rem; border: 1px solid var(--border-primary);
    }

    /* --------------------------------------------------------------------------
       ANIMATIONS
       -------------------------------------------------------------------------- */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .card-anim-1 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.1s both; }
    .card-anim-2 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.15s both; }
    .card-anim-3 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.2s both; }
    .card-anim-4 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.25s both; }
    .card-anim-5 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.3s both; }
    .card-anim-6 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.35s both; }

    /* Responsive */
    @media (max-width: 1200px) {
      .bento-grid { grid-template-columns: repeat(2, 1fr); }
      .span-2 { grid-column: span 2; }
      .span-3 { grid-column: span 2; } /* Adapt to 2 columns */
    }
    
    @media (max-width: 768px) {
      .page-wrapper { padding: var(--spacing-xl); }
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-xl); }
      .header-right { justify-content: flex-end; }
      .bento-grid { grid-template-columns: 1fr; }
      .span-2, .span-3 { grid-column: span 1; }
      .inner-grid-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class DepartmentDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(HRMSService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  deptId: string = '';
  
  // Signals
  dept = signal<any>(null);
  employees = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.deptId = this.route.snapshot.paramMap.get('id') || '';
    if (this.deptId) {
      this.loadDepartmentData();
    } else {
      this.router.navigate(['/departments/list']);
    }
  }

  // --- Data Loading ---
  loadDepartmentData() {
    this.isLoading.set(true);
    
    forkJoin({
      department: this.dataService.getDepartment(this.deptId).pipe(
        map((res: any) => res?.data?.data || res),
        catchError(() => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load department details.' });
          return of(null);
        })
      ),
      employeesData: this.dataService.getDepartmentEmployees(this.deptId).pipe(
        map((res: any) => res?.data?.employees || []),
        catchError(() => {
          this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Could not fetch employee roster.' });
          return of([]);
        })
      )
    }).subscribe(({ department, employeesData }) => {
      if (department) {
        this.dept.set(department);
      }
      this.employees.set(employeesData);
      this.isLoading.set(false);
    });
  }

  // --- Navigation ---
  onEditDepartment() {
    this.router.navigate(['/departments/edit', this.deptId]);
  }

  onBack() {
    this.router.navigate(['/departments/list']);
  }

  // --- Actions ---
  toggleStatus() {
    const currentDept = this.dept();
    if (!currentDept) return;

    const action = currentDept.isActive ? 'Deactivate' : 'Activate';

    this.confirmationService.confirm({
      message: `Are you sure you want to ${action.toLowerCase()} the ${currentDept.name} department?`,
      header: `${action} Department`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: currentDept.isActive ? 'p-button-danger' : 'p-button-success',
      accept: () => {
        // Implementation stub for actual API call
      }
    });
  }

  // --- Helpers ---
  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getUtilization(current: number, max: number): number {
    if (!max || max === 0) return 0;
    const ratio = (current / max) * 100;
    return Math.min(ratio, 100); 
  }

  getUtilizationColor(current: number, max: number): string {
    const utilization = this.getUtilization(current, max);
    if (utilization >= 100) return 'var(--color-error)'; 
    if (utilization > 85) return 'var(--color-warning)'; 
    return 'var(--color-success)'; 
  }
}

// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { catchError, map, of } from 'rxjs';

// // Services
// import { HRMSService } from '../../../hrms.service';
// import { MessageService, ConfirmationService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { DividerModule } from 'primeng/divider';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToastModule } from 'primeng/toast';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { AvatarModule } from 'primeng/avatar';

// @Component({
//   selector: 'app-department-details',
//   standalone: true,
//   imports: [
//     CommonModule, RouterModule, DatePipe,
//     CardModule, ButtonModule, TagModule, DividerModule, 
//     ConfirmDialogModule, ToastModule, SkeletonModule, 
//     TooltipModule, ProgressBarModule, AvatarModule
//   ],
//   providers: [MessageService, ConfirmationService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast></p-toast>
//     <p-confirmDialog></p-confirmDialog>

//     <div class="page-wrapper fade-in">
      
//       @if (isLoading()) {
//         <div class="header-skeleton mb-4">
//           <div class="flex-align gap-3">
//             <p-skeleton shape="circle" size="3rem"></p-skeleton>
//             <div>
//               <p-skeleton width="15rem" height="2rem" styleClass="mb-2"></p-skeleton>
//               <p-skeleton width="8rem" height="1rem"></p-skeleton>
//             </div>
//           </div>
//           <div class="flex-align gap-2">
//             <p-skeleton width="8rem" height="2.5rem"></p-skeleton>
//           </div>
//         </div>
        
//         <div class="bento-grid">
//           <div class="span-2"><p-skeleton height="15rem"></p-skeleton></div>
//           <div><p-skeleton height="15rem"></p-skeleton></div>
//           <div><p-skeleton height="12rem"></p-skeleton></div>
//           <div><p-skeleton height="12rem"></p-skeleton></div>
//           <div><p-skeleton height="12rem"></p-skeleton></div>
//         </div>
//       }

//       @if (dept(); as data) {
//         <header class="dashboard-header slide-down">
//           <div class="header-left">
//             <p-button 
//               icon="pi pi-arrow-left" 
//               [text]="true" 
//               [rounded]="true" 
//               size="large"
//               (onClick)="onBack()" 
//               pTooltip="Back to list" 
//               tooltipPosition="bottom">
//             </p-button>
            
//             <div class="header-titles">
//               <div class="title-row">
//                 <h1 class="page-title">{{ data.name }}</h1>
//                 <p-tag 
//                   [severity]="data.isActive ? 'success' : 'danger'" 
//                   [value]="data.isActive ? 'Active' : 'Inactive'">
//                 </p-tag>
//               </div>
//               <p class="page-subtitle">Department Code: <strong>{{ data.code }}</strong></p>
//             </div>
//           </div>
          
//           <div class="header-right">
//             <p-button 
//               [icon]="data.isActive ? 'pi pi-ban' : 'pi pi-check-circle'" 
//               [label]="data.isActive ? 'Deactivate' : 'Activate'" 
//               [severity]="data.isActive ? 'danger' : 'success'"
//               [outlined]="true"
//               (onClick)="toggleStatus()">
//             </p-button>
            
//             <p-button 
//               icon="pi pi-pencil" 
//               label="Edit Details" 
//               [outlined]="true"
//               (onClick)="onEditDepartment()">
//             </p-button>
//           </div>
//         </header>

//         <main class="dashboard-content mt-4">
//           <div class="bento-grid">
            
//             <p-card header="Overview" styleClass="grid-card span-2 card-anim-1">
//               <ng-template pTemplate="subtitle">
//                 <div class="text-secondary mb-3">{{ data.description || 'No description provided.' }}</div>
//               </ng-template>
              
//               <div class="inner-grid-2">
//                 <div class="info-group">
//                   <span class="info-label">Organization ID</span>
//                   <span class="info-value flex-align badge-mono">
//                     <i class="pi pi-sitemap text-tertiary mr-2"></i>
//                     {{ data.organizationId || 'None (Root)' }}
//                   </span>
//                 </div>
//                 <div class="info-group">
//                   <span class="info-label">Branch Location</span>
//                   <span class="info-value flex-align">
//                     <i class="pi pi-map-marker text-tertiary mr-2"></i>
//                     {{ data.branchId?.name || 'Unassigned' }}
//                   </span>
//                 </div>
//               </div>
//             </p-card>

//             <p-card header="Leadership" styleClass="grid-card card-anim-2">
//               <div class="flex-col gap-4">
//                 <div class="user-profile">
//                   <p-avatar [label]="getInitials(data.headOfDepartment?.name)" size="large" shape="circle" [style]="{'background-color': 'var(--color-info-bg)', 'color': 'var(--color-info-dark)'}"></p-avatar>
//                   <div class="user-details">
//                     <span class="info-label">Head of Department</span>
//                     <span class="info-value font-semibold">{{ data.headOfDepartment?.name || 'Unassigned' }}</span>
//                     <a href="mailto:{{ data.headOfDepartment?.email }}" class="text-xs link-style" *ngIf="data.headOfDepartment?.email">{{ data.headOfDepartment?.email }}</a>
//                   </div>
//                 </div>

//                 <div class="user-profile">
//                   <p-avatar [label]="getInitials(data.assistantHOD?.name)" size="large" shape="circle" [style]="{'background-color': 'var(--bg-secondary)', 'color': 'var(--text-secondary)'}"></p-avatar>
//                   <div class="user-details">
//                     <span class="info-label">Assistant HOD</span>
//                     <span class="info-value font-semibold">{{ data.assistantHOD?.name || 'Unassigned' }}</span>
//                     <a href="mailto:{{ data.assistantHOD?.email }}" class="text-xs link-style" *ngIf="data.assistantHOD?.email">{{ data.assistantHOD?.email }}</a>
//                   </div>
//                 </div>
//               </div>
//             </p-card>

//             <p-card header="Operations" styleClass="grid-card card-anim-3">
//               <div class="flex-col gap-3">
//                 <div class="inner-grid-2">
//                   <div class="info-group">
//                     <span class="info-label">Cost Center</span>
//                     <span class="info-value badge-mono">{{ data.costCenter || 'N/A' }}</span>
//                   </div>
//                   <div class="info-group">
//                     <span class="info-label">Budget Code</span>
//                     <span class="info-value badge-mono">{{ data.budgetCode || 'N/A' }}</span>
//                   </div>
//                 </div>

//                 <p-divider></p-divider>

//                 <div class="info-group">
//                   <div class="flex-between mb-2">
//                     <span class="info-label">Headcount Utilization</span>
//                     <span class="info-label font-bold">{{ data.employeeCount || 0 }} / {{ data.maxStrength || 0 }}</span>
//                   </div>
//                   <p-progressBar 
//                     [value]="getUtilization(data.employeeCount, data.maxStrength)" 
//                     [showValue]="false" 
//                     [style]="{'height': '8px'}"
//                     [color]="getUtilizationColor(data.employeeCount, data.maxStrength)">
//                   </p-progressBar>
//                 </div>
//               </div>
//             </p-card>

//             <p-card header="Contact Info" styleClass="grid-card card-anim-4">
//               <div class="flex-col gap-3">
//                 <div class="info-group">
//                   <span class="info-label">Email Address</span>
//                   <a href="mailto:{{ data.contactEmail }}" class="info-value link-style">
//                     <i class="pi pi-envelope mr-1 text-sm"></i> {{ data.contactEmail || 'N/A' }}
//                   </a>
//                 </div>
//                 <div class="info-group">
//                   <span class="info-label">Phone Number</span>
//                   <span class="info-value"><i class="pi pi-phone mr-1 text-sm"></i> {{ data.contactPhone || 'N/A' }}</span>
//                 </div>
//                 <div class="info-group">
//                   <span class="info-label">Physical Location</span>
//                   <span class="info-value"><i class="pi pi-building mr-1 text-sm"></i> {{ data.location || 'N/A' }}</span>
//                 </div>
//               </div>
//             </p-card>

//             <p-card header="Metadata" styleClass="grid-card card-anim-5">
//               <div class="flex-col gap-3">
//                 <div class="info-group">
//                   <span class="info-label">Date Established</span>
//                   <span class="info-value"><i class="pi pi-calendar mr-1 text-sm"></i> {{ (data.metadata?.establishedDate | date:'longDate' )|| 'N/A' }}</span>
//                 </div>
                
//                 <div class="inner-grid-2 mt-2">
//                   <div class="info-group">
//                     <span class="info-label">Division</span>
//                     <span class="info-value">{{ data.metadata?.division || 'N/A' }}</span>
//                   </div>
//                   <div class="info-group">
//                     <span class="info-label">Region</span>
//                     <span class="info-value">{{ data.metadata?.region || 'N/A' }}</span>
//                   </div>
//                 </div>

//                 <p-divider></p-divider>
                
//                 <div class="inner-grid-2">
//                   <div class="info-group">
//                     <span class="info-label">Created By</span>
//                     <span class="info-value text-sm">{{ data.createdBy?.name || 'System' }}</span>
//                   </div>
//                   <div class="info-group">
//                     <span class="info-label">Last Updated</span>
//                     <span class="info-value text-sm">{{ (data.updatedAt | date:'mediumDate') || 'N/A' }}</span>
//                   </div>
//                 </div>
//               </div>
//             </p-card>

//           </div>
//         </main>
//       }
//     </div>
//   `,
//   styles: [`
//     :host {
//       display: block;
//       width: 100%;
//       min-height: 100vh;
//       background-color: var(--bg-primary);
//       color: var(--text-primary);
//       font-family: var(--font-body);
//     }

//     .page-wrapper {
//       padding: var(--spacing-2xl) var(--spacing-3xl);
//       max-width: 1600px;
//       margin: 0 auto;
//     }

//     /* Header */
//     .dashboard-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       background: var(--component-bg, var(--bg-secondary));
//       padding: var(--spacing-xl) var(--spacing-2xl);
//       border-radius: var(--ui-border-radius-lg);
//       border: var(--ui-border-width) solid var(--border-primary);
//       box-shadow: var(--shadow-sm);
//       margin-bottom: var(--spacing-2xl);
//     }

//     .header-skeleton {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       background: var(--bg-secondary);
//       padding: var(--spacing-2xl);
//       border-radius: var(--ui-border-radius-lg);
//       border: var(--ui-border-width) solid var(--border-primary);
//     }

//     .header-left, .header-right {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xl);
//     }

//     .header-titles {
//       display: flex;
//       flex-direction: column;
//     }

//     .title-row {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-xs);
//     }

//     .page-title {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-semibold);
//       font-family: var(--font-heading);
//       margin: 0;
//       color: var(--text-primary);
//     }

//     .page-subtitle {
//       font-size: var(--font-size-md);
//       color: var(--text-secondary);
//       margin: 0;
//     }

//     /* Layout Grids */
//     .bento-grid {
//       display: grid;
//       grid-template-columns: repeat(3, 1fr);
//       gap: var(--spacing-2xl);
//       align-items: start;
//     }

//     .span-2 { grid-column: span 2; }
//     .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    
//     /* PrimeNG Overrides for Cards */
//     ::ng-deep .grid-card .p-card {
//       height: 100%;
//       border-radius: var(--ui-border-radius-lg);
//       box-shadow: var(--shadow-sm);
//       border: var(--ui-border-width) solid var(--border-primary);
//       background: var(--component-bg, var(--bg-secondary));
//       color: var(--text-primary);
//       transition: var(--transition-base);
//     }
//     ::ng-deep .grid-card .p-card:hover {
//       box-shadow: var(--shadow-md);
//       border-color: var(--component-border-focus, var(--border-secondary));
//     }
//     ::ng-deep .grid-card .p-card-title { 
//       font-size: var(--font-size-2xl); 
//       font-weight: var(--font-weight-semibold); 
//       font-family: var(--font-heading);
//     }
//     ::ng-deep .grid-card .p-card-body { padding: var(--spacing-2xl); }
//     ::ng-deep .grid-card .p-card-content { padding: 0; }

//     /* Utilities */
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
    
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
//     .gap-4 { gap: var(--spacing-lg); }
//     .mb-2 { margin-bottom: var(--spacing-md); }
//     .mb-3 { margin-bottom: var(--spacing-lg); }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .mt-2 { margin-top: var(--spacing-md); }
//     .mt-4 { margin-top: var(--spacing-xl); }
//     .mr-1 { margin-right: var(--spacing-xs); }
//     .mr-2 { margin-right: var(--spacing-md); }

//     .info-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
//     .info-label {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-semibold);
//       color: var(--text-label);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }
//     .info-value {
//       font-size: var(--font-size-md);
//       color: var(--text-primary);
//       font-weight: var(--font-weight-medium);
//     }

//     .text-secondary { color: var(--text-secondary); line-height: var(--line-height-relaxed); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .font-semibold { font-weight: var(--font-weight-semibold); }
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }

//     .badge-mono {
//       font-family: var(--font-mono);
//       font-size: var(--font-size-sm);
//       background: var(--bg-primary);
//       padding: var(--spacing-xs) var(--spacing-md);
//       border-radius: var(--ui-border-radius);
//       border: var(--ui-border-width) solid var(--border-primary);
//       display: inline-block;
//       width: max-content;
//     }

//     .link-style {
//       color: var(--color-primary);
//       text-decoration: none;
//       transition: var(--transition-colors);
//     }
//     .link-style:hover { 
//       text-decoration: underline; 
//       color: var(--color-primary-dark); 
//     }

//     /* Profiles */
//     .user-profile {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xl);
//       padding: var(--spacing-lg);
//       border-radius: var(--ui-border-radius);
//       background: var(--bg-primary);
//       border: var(--ui-border-width) solid var(--border-primary);
//     }
//     .user-details { display: flex; flex-direction: column; gap: 2px; }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
//     .fade-in { animation: fadeIn 0.3s cubic-bezier(0.23, 1, 0.32, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
//     .card-anim-1 { animation: popIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) 0.1s both; }
//     .card-anim-2 { animation: popIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) 0.15s both; }
//     .card-anim-3 { animation: popIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) 0.2s both; }
//     .card-anim-4 { animation: popIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) 0.25s both; }
//     .card-anim-5 { animation: popIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) 0.3s both; }

//     /* Responsive */
//     @media (max-width: 1200px) {
//       .bento-grid { grid-template-columns: repeat(2, 1fr); }
//       .span-2 { grid-column: span 2; }
//     }
    
//     @media (max-width: 768px) {
//       .page-wrapper { padding: var(--spacing-xl); }
//       .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-xl); }
//       .header-right { justify-content: flex-end; }
//       .bento-grid { grid-template-columns: 1fr; }
//       .span-2 { grid-column: span 1; }
//       .inner-grid-2 { grid-template-columns: 1fr; }
//     }
//   `]
// })
// export class DepartmentDetailsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private dataService = inject(HRMSService);
//   private messageService = inject(MessageService);
//   private confirmationService = inject(ConfirmationService);

//   deptId: string = '';
  
//   // Signals
//   dept = signal<any>(null);
//   isLoading = signal(true);

//   ngOnInit() {
//     this.deptId = this.route.snapshot.paramMap.get('id') || '';
//     if (this.deptId) {
//       this.loadDepartmentDetails();
//     } else {
//       this.router.navigate(['/departments/list']);
//     }
//   }

//   // --- Data Loading ---
//   loadDepartmentDetails() {
//     this.isLoading.set(true);
    
//     this.dataService.getDepartment(this.deptId).pipe(
//       // Maps to the exact nested JSON structure provided: res.data.data
//       map((res: any) => res?.data?.data || res),
//       catchError(err => {
//         this.isLoading.set(false);
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load department details.' });
//         return of(null);
//       })
//     ).subscribe((data) => {
//       if (data) {this.dept.set(data);       }
//       this.isLoading.set(false);
//     });
//   }

//   // --- Navigation ---
//   onEditDepartment() {
//     this.router.navigate(['/departments/edit', this.deptId]);
//   }

//   onBack() {
//     this.router.navigate(['/departments/list']);
//   }

//   // --- Actions ---
//   toggleStatus() {
//     const currentDept = this.dept();
//     if (!currentDept) return;

//     const action = currentDept.isActive ? 'Deactivate' : 'Activate';

//     this.confirmationService.confirm({
//       message: `Are you sure you want to ${action.toLowerCase()} the ${currentDept.name} department?`,
//       header: `${action} Department`,
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: currentDept.isActive ? 'p-button-danger' : 'p-button-success',
//       accept: () => {
//         // Adjust the service methods based on your actual HRMSService implementation.
//         // const req$ = currentDept.isActive 
//         //   ? this.dataService.deactivateDepartment(this.deptId) 
//         //   : this.dataService.activateDepartment(this.deptId);

//         // req$.subscribe({
//         //   next: () => {
//         //     this.messageService.add({ severity: 'success', summary: 'Success', detail: `Department ${action.toLowerCase()}d successfully.` });
//         //     this.dept.update(d => ({ ...d, isActive: !d.isActive }));
//         //   },
//         //   error: (err: any) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update status' })
//         // });
//       }
//     });
//   }

//   // --- Helpers ---
//   getInitials(name: string): string {
//     if (!name) return '?';
//     return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
//   }

//   getUtilization(current: number, max: number): number {
//     if (!max || max === 0) return 0;
//     const ratio = (current / max) * 100;
//     return Math.min(ratio, 100); 
//   }

//   getUtilizationColor(current: number, max: number): string {
//     const utilization = this.getUtilization(current, max);
//     // Adjusted to map directly to theme tokens
//     if (utilization >= 100) return 'var(--color-error)'; 
//     if (utilization > 85) return 'var(--color-warning)'; 
//     return 'var(--color-success)'; 
//   }
// }