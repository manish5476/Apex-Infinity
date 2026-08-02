import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';

// Services
import { HRMSService } from '../../../hrms.service';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-department-details',
  standalone: true,
  imports: [
    CommonModule, RouterModule, DatePipe,
    ButtonModule, TagModule, ConfirmDialogModule,
    ToastModule, SkeletonModule, TooltipModule,
    ProgressBarModule, AvatarModule, DataGridComponent
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>
    <p-confirmDialog styleClass="premium-confirm-dialog" appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}"></p-confirmDialog>
    
    <div class="page-wrapper fade-in">
    
      <!-- ════════ LOADING SKELETON ════════ -->
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
          <div class="premium-card span-2"><p-skeleton height="16rem" borderRadius="16px"></p-skeleton></div>
          <div class="premium-card"><p-skeleton height="16rem" borderRadius="16px"></p-skeleton></div>
          <div class="premium-card"><p-skeleton height="14rem" borderRadius="16px"></p-skeleton></div>
          <div class="premium-card"><p-skeleton height="14rem" borderRadius="16px"></p-skeleton></div>
          <div class="premium-card"><p-skeleton height="14rem" borderRadius="16px"></p-skeleton></div>
          <div class="premium-card span-3"><p-skeleton height="24rem" borderRadius="16px"></p-skeleton></div>
        </div>
      }
    
      <!-- ════════ MAIN CONTENT ════════ -->
      @if (dept(); as data) {
    
        <header class="dashboard-header slide-down">
          <div class="header-left">
            <button class="btn-ghost icon-only" (click)="onBack()" pTooltip="Back to Directory" tooltipPosition="bottom">
              <i class="pi pi-arrow-left"></i>
            </button>
    
            <div class="title-section">
              <div class="icon-box"><i class="pi pi-building"></i></div>
              <div class="text-content">
                <div class="flex-align gap-3">
                  <h1 class="page-title">{{ data.name }}</h1>
                  <span class="status-badge" [class.active]="data.isActive">
                    {{ data.isActive ? 'ACTIVE' : 'INACTIVE' }}
                  </span>
                </div>
                <div class="subtitle-row">
                  <span class="badge-mono-sm">{{ data.code }}</span>
                  <span class="dot-divider">•</span>
                  <span>Established {{ (data.metadata?.establishedDate | date:'mediumDate' )|| 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>
    
          <div class="header-right">
            <button class="btn-outline" [class.danger]="data.isActive" [class.success]="!data.isActive" (click)="toggleStatus()">
              <i [class]="data.isActive ? 'pi pi-ban' : 'pi pi-check-circle'"></i>
              {{ data.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button class="btn-primary" (click)="onEditDepartment()">
              <i class="pi pi-pencil"></i> Edit Details
            </button>
          </div>
        </header>
    
        <main class="dashboard-content mt-5">
          <div class="bento-grid">
    
            <!-- ── 1. OVERVIEW (Span 2) ── -->
            <div class="premium-card span-2 card-anim-1">
              <div class="card-header">
                <h3>Department Overview</h3>
              </div>
              <div class="card-body flex-col h-full">
                <p class="description-text mb-4">
                  {{ data.description || 'No detailed description has been provided for this department yet.' }}
                </p>
                <div class="inner-grid-2 mt-auto">
                  <div class="info-group bg-surface p-4 border-radius-lg border-subtle">
                    <span class="info-label"><i class="pi pi-sitemap mr-1"></i> Organization ID</span>
                    <span class="badge-mono mt-2">{{ data.organizationId || 'Root Level' }}</span>
                  </div>
                  <div class="info-group bg-surface p-4 border-radius-lg border-subtle">
                    <span class="info-label"><i class="pi pi-map-marker mr-1"></i> Branch Location</span>
                    <span class="info-value font-semibold mt-2">{{ data.branchId?.name || 'Unassigned' }}</span>
                  </div>
                </div>
              </div>
            </div>
    
            <!-- ── 2. LEADERSHIP ── -->
            <div class="premium-card card-anim-2">
              <div class="card-header">
                <h3>Leadership</h3>
              </div>
              <div class="card-body flex-col gap-4">
                <div class="user-profile shadow-sm">
                  <div class="avatar bg-primary-light text-primary">
                    {{ getInitials(data.headOfDepartment?.name) }}
                  </div>
                  <div class="user-details">
                    <span class="info-label text-primary">Head of Department</span>
                    <span class="info-value font-bold">{{ data.headOfDepartment?.name || 'Unassigned' }}</span>
                    @if (data.headOfDepartment?.email) {
                      <a href="mailto:{{ data.headOfDepartment?.email }}" class="text-xs link-style">{{ data.headOfDepartment?.email }}</a>
                    }
                  </div>
                </div>
    
                <div class="user-profile shadow-sm">
                  <div class="avatar bg-secondary text-secondary">
                    {{ getInitials(data.assistantHOD?.name) }}
                  </div>
                  <div class="user-details">
                    <span class="info-label">Assistant HOD</span>
                    <span class="info-value font-bold">{{ data.assistantHOD?.name || 'Unassigned' }}</span>
                    @if (data.assistantHOD?.email) {
                      <a href="mailto:{{ data.assistantHOD?.email }}" class="text-xs link-style">{{ data.assistantHOD?.email }}</a>
                    }
                  </div>
                </div>
              </div>
            </div>
    
            <!-- ── 3. OPS & BUDGET ── -->
            <div class="premium-card card-anim-3">
              <div class="card-header">
                <h3>Operations & Budget</h3>
              </div>
              <div class="card-body flex-col gap-4">
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
                    [style]="{'height': '8px', 'border-radius': '99px', 'background': 'var(--bg-secondary)'}"
                    [color]="getUtilizationColor(data.employeeCount, data.maxStrength)">
                  </p-progressBar>
                </div>
              </div>
            </div>
    
            <!-- ── 4. CONTACT INFO ── -->
            <div class="premium-card card-anim-4">
              <div class="card-header">
                <h3>Contact Information</h3>
              </div>
              <div class="card-body flex-col gap-4">
                <div class="contact-item">
                  <div class="icon-wrapper bg-info-light text-info"><i class="pi pi-envelope"></i></div>
                  <div class="info-group">
                    <span class="info-label">Email Address</span>
                    <a href="mailto:{{ data.contactEmail }}" class="info-value link-style font-medium mt-1">{{ data.contactEmail || 'N/A' }}</a>
                  </div>
                </div>
    
                <div class="contact-item">
                  <div class="icon-wrapper bg-success-light text-success"><i class="pi pi-phone"></i></div>
                  <div class="info-group">
                    <span class="info-label">Phone Number</span>
                    <span class="info-value font-medium mt-1">{{ data.contactPhone || 'N/A' }}</span>
                  </div>
                </div>
    
                <div class="contact-item">
                  <div class="icon-wrapper bg-primary-light text-primary"><i class="pi pi-building"></i></div>
                  <div class="info-group">
                    <span class="info-label">Physical Location</span>
                    <span class="info-value font-medium mt-1">{{ data.location || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </div>
    
            <!-- ── 5. METADATA ── -->
            <div class="premium-card card-anim-5">
              <div class="card-header">
                <h3>System Metadata</h3>
              </div>
              <div class="card-body flex-col gap-4">
                <div class="inner-grid-2">
                  <div class="info-group">
                    <span class="info-label">Division</span>
                    <span class="info-value font-medium mt-1">{{ data.metadata?.division || 'N/A' }}</span>
                  </div>
                  <div class="info-group">
                    <span class="info-label">Region</span>
                    <span class="info-value font-medium mt-1">{{ data.metadata?.region || 'N/A' }}</span>
                  </div>
                </div>
    
                <div class="divider-subtle"></div>
    
                <div class="inner-grid-2">
                  <div class="info-group">
                    <span class="info-label">Created By</span>
                    <span class="info-value text-sm flex-align gap-2 mt-1">
                      <i class="pi pi-user-edit text-tertiary"></i>
                      {{ data.createdBy?.name || 'System' }}
                    </span>
                  </div>
                  <div class="info-group">
                    <span class="info-label">Last Updated</span>
                    <span class="info-value text-sm flex-align gap-2 mt-1">
                      <i class="pi pi-clock text-tertiary"></i>
                      {{ (data.updatedAt | date:'mediumDate') || 'N/A' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
    
            <!-- ── 6. GRID ── -->
            <div class="premium-card span-3 card-anim-6">
              <div class="card-header">
                <h3>Team Members & Workforce</h3>
              </div>
              <div class="card-body p-0 flex-1 flex-col min-h-[400px]">
                @if (employees().length > 0) {
                  <div class="list-grid-wrapper">
                    <app-data-grid [viewOnly]="true" [pagination]="true" [enableExport]="true"
                      [columns]="gridColumns"
                      [data]="employees()"
                      class="full-size-grid">
                    </app-data-grid>
                  </div>
                } @else {
                  <div class="empty-glass-state h-full">
                    <div class="icon-circle-large mb-3"><i class="pi pi-users text-tertiary"></i></div>
                    <h3 class="text-primary-color m-0 mb-2 font-bold">No Employees Found</h3>
                    <p class="text-secondary m-0">There are currently no active team members assigned to this department.</p>
                  </div>
                }
              </div>
            </div>
    
          </div>
        </main>
      }
    </div>
    `,
  styles: [`
    /* ══════════════════════════════════════════════════════
       THEME TOKENS & FULL-WIDTH LAYOUT
    ══════════════════════════════════════════════════════ */
    :host {
      display: block; 
      width: 100%; 
      min-height: 100vh;
      background-color: var(--bg-secondary); 
      color: var(--text-primary);
      font-family: var(--font-body);
    }

    .page-wrapper { 
      padding: var(--spacing-2xl); 
      width: 100%; /* True Full Width */
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
    }

    /* Helpers */
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    .h-full { height: 100%; }
    .min-h-\\[400px\\] { min-height: 400px; }
    .flex-1 { flex: 1; }
    
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .mb-2 { margin-bottom: var(--spacing-sm); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-lg); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-5 { margin-top: var(--spacing-xl); }
    .mt-auto { margin-top: auto; }
    
    .p-0 { padding: 0 !important; }
    .p-4 { padding: var(--spacing-lg); }
    
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary { color: var(--color-primary); }
    .text-primary-color { color: var(--text-primary); }
    
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-semibold { font-weight: var(--font-weight-semibold); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-mono { font-family: var(--font-mono); }

    /* Colors */
    .bg-surface { background: var(--bg-secondary); } /* Slightly offset from primary card */
    .bg-primary-light { background: color-mix(in srgb, var(--accent-primary) 12%, transparent); }
    .bg-success-light { background: color-mix(in srgb, var(--color-success) 12%, transparent); }
    .bg-info-light { background: color-mix(in srgb, var(--color-info) 12%, transparent); }
    .bg-secondary { background: var(--bg-secondary); }
    
    .text-success { color: var(--color-success); }
    .text-info { color: var(--color-info); }

    .border-radius-md { border-radius: var(--ui-border-radius); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .border-subtle { border: var(--ui-border-width) solid var(--border-secondary); }
    .divider-subtle { height: 1px; background: var(--border-secondary); margin: 0; width: 100%; }

    /* ── HEADER ────────────────────────────────────────── */
    .dashboard-header {
      display: flex; justify-content: space-between; align-items: center;
      flex-shrink: 0;
    }
    
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    
    .title-section { display: flex; align-items: center; gap: var(--spacing-lg); }
    .icon-box {
      width: 56px; height: 56px; border-radius: var(--ui-border-radius);
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent); 
      border: 1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; color: var(--accent-primary); 
    }

    .page-title { 
      font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); 
      font-family: var(--font-heading); margin: 0; 
      letter-spacing: -0.02em; color: var(--text-primary);
    }
    
    .subtitle-row { 
      display: flex; align-items: center; gap: var(--spacing-sm);
      font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: 4px; 
    }
    .dot-divider { color: var(--border-primary); }

    .status-badge {
      padding: 4px 12px; border-radius: var(--ui-border-radius-pill);
      font-size: 11px; font-weight: var(--font-weight-bold);
      letter-spacing: 0.05em; border: var(--ui-border-width) solid transparent;
      background: color-mix(in srgb, var(--color-error) 10%, transparent);
      color: var(--color-error-dark, var(--color-error));
      border-color: color-mix(in srgb, var(--color-error) 20%, transparent);
    }
    .status-badge.active {
      background: color-mix(in srgb, var(--color-success) 10%, transparent);
      color: var(--color-success-dark, var(--color-success));
      border-color: color-mix(in srgb, var(--color-success) 20%, transparent);
    }

    /* ── BUTTONS ───────────────────────────────────────── */
    .header-right { display: flex; align-items: center; gap: var(--spacing-md); }

    button {
      display: inline-flex; align-items: center; justify-content: center; gap: var(--spacing-sm);
      height: 40px; padding: 0 var(--spacing-xl); font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);
      border-radius: var(--ui-border-radius-sm); cursor: pointer; transition: var(--transition-base); border: none;
      font-family: var(--font-body); outline: none;
    }
    
    button i { font-size: 14px; }
    
    .btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid transparent; }
    .btn-ghost:hover { background: var(--bg-primary); color: var(--text-primary); border-color: var(--border-secondary); }
    .btn-ghost.icon-only { width: 44px; height: 44px; padding: 0; border-radius: var(--ui-border-radius); border: 1px solid var(--border-secondary); background: var(--bg-primary); }
    .btn-ghost.icon-only:hover { transform: scale(1.05); }

    .btn-outline { background: var(--bg-primary); border: 1px solid var(--border-primary); color: var(--text-primary); }
    .btn-outline.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); border-color: var(--color-error); color: var(--color-error); }
    .btn-outline.success:hover { background: color-mix(in srgb, var(--color-success) 10%, transparent); border-color: var(--color-success); color: var(--color-success); }

    .btn-primary { background: var(--accent-primary); color: #ffffff; box-shadow: 0 2px 4px color-mix(in srgb, var(--accent-primary) 20%, transparent); }
    .btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 4px 6px color-mix(in srgb, var(--accent-primary) 30%, transparent); }

    /* ── BENTO GRID & CARDS ────────────────────────────── */
    .bento-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: var(--spacing-2xl); 
      align-items: stretch; 
    }
    .span-2 { grid-column: span 2; }
    .span-3 { grid-column: span 3; }
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    
    .premium-card {
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); 
      box-shadow: var(--shadow-sm);
      display: flex; flex-direction: column;
      overflow: hidden; 
      transition: var(--transition-base);
    }
    .premium-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--border-secondary);
      transform: translateY(-2px);
    }

    .card-header {
      padding: var(--spacing-xl) var(--spacing-2xl);
      border-bottom: 1px solid var(--border-secondary);
      background: var(--bg-secondary);
    }
    .card-header h3 { 
      margin: 0; font-family: var(--font-heading); 
      font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); 
      color: var(--text-primary); 
    }

    .card-body { padding: var(--spacing-2xl); display: flex; flex-direction: column; }

    /* ── TYPOGRAPHY & ELEMENTS ─────────────────────────── */
    .description-text { line-height: var(--line-height-relaxed); font-size: var(--font-size-md); color: var(--text-secondary); margin: 0; }
    
    .info-group { display: flex; flex-direction: column; }
    .info-label { font-size: 11px; font-weight: var(--font-weight-bold); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: var(--font-size-md); color: var(--text-primary); }

    .badge-mono {
      font-family: var(--font-mono); font-size: var(--font-size-sm); background: var(--bg-primary);
      padding: 6px 12px; border-radius: var(--ui-border-radius-sm); border: 1px solid var(--border-secondary);
      display: inline-block; width: max-content; color: var(--text-secondary); font-weight: var(--font-weight-semibold);
    }
    .badge-mono-sm {
      font-family: var(--font-mono); font-size: 11px; background: var(--bg-primary);
      padding: 4px 10px; border-radius: var(--ui-border-radius-sm); border: 1px solid var(--border-secondary);
      color: var(--text-secondary); font-weight: var(--font-weight-bold); letter-spacing: 0.05em;
    }

    .link-style { color: var(--accent-primary); text-decoration: none; transition: var(--transition-fast); }
    .link-style:hover { text-decoration: underline; color: var(--accent-hover); }

    .user-profile {
      display: flex; align-items: center; gap: var(--spacing-lg); padding: var(--spacing-lg);
      border-radius: var(--ui-border-radius-lg); background: var(--bg-primary);
      border: 1px solid var(--border-secondary); transition: var(--transition-base);
    }
    .user-profile:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-xs); }
    .user-details { display: flex; flex-direction: column; gap: 2px; }
    
    .avatar {
      width: 48px; height: 48px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-lg); font-weight: var(--font-weight-bold);
    }

    .contact-item { display: flex; align-items: center; gap: var(--spacing-lg); }
    .icon-wrapper { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }

    /* ── AG GRID CONTAINER ─────────────────────────────── */
    .list-grid-wrapper {
      flex: 1; width: 100%; height: 100%;
      display: flex; flex-direction: column;
    }
    app-ag-share-grid { height: 100%; width: 100%; display: block; }
    
    ::ng-deep .list-grid-wrapper .ag-root-wrapper {
      border: none !important;
      border-radius: 0 0 var(--ui-border-radius-xl) var(--ui-border-radius-xl) !important;
    }

    /* Empty States */
    .empty-glass-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: var(--bg-secondary); border-radius: 0 0 var(--ui-border-radius-xl) var(--ui-border-radius-xl); }
    .icon-circle-large {
      width: 80px; height: 80px; border-radius: 50%; background: var(--bg-primary);
      display: flex; align-items: center; justify-content: center; font-size: 32px; border: 1px solid var(--border-primary);
      box-shadow: var(--shadow-sm);
    }

    /* ── ANIMATIONS ────────────────────────────────────── */
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
    @media (max-width: 1200px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } .span-2 { grid-column: span 2; } .span-3 { grid-column: span 2; } }
    @media (max-width: 768px) { 
      .page-wrapper { padding: var(--spacing-lg); } 
      .dashboard-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-xl); } 
      .header-right { width: 100%; justify-content: flex-end; } 
      .bento-grid { grid-template-columns: 1fr; } 
      .span-2, .span-3 { grid-column: span 1; } 
      .inner-grid-2 { grid-template-columns: 1fr; } 
    }
  `]
})
export class DepartmentDetailsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  deptId: string = '';

  // Signals
  dept = signal<any>(null);
  employees = signal<any[]>([]);
  isLoading = signal(true);
  gridColumns: GridColumn[] = [
    {
      field: 'profile',
      header: 'EMPLOYEE PROFILE',
      flex: 2,
      minWidth: '250px',
      formatter: (_val: any, emp: any) => {
        const name = emp.name || 'Unknown';
        const email = emp.email || 'No email provided';
        const avatar = emp.avatar;

        // Extract initials manually to map directly into HTML
        const initials = name !== 'Unknown'
          ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
          : '?';

        // Render Image or Initials Circle (Sleek 32px size for grid rows)
        const avatarHtml = avatar
          ? `<img src="${avatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-secondary);" />`
          : `<div style="width: 36px; height: 36px; border-radius: 50%; background: color-mix(in srgb, var(--accent-primary) 12%, transparent); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; border: 1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent);">${initials}</div>`;

        return `
          <div style="height: 100%; display: flex; align-items: center; gap: 12px;">
            ${avatarHtml}
            <div style="display: flex; flex-direction: column; justify-content: center; line-height: 1.2;">
              <span style="font-weight: 600; color: var(--text-primary); font-size: 13px;">${name}</span>
              <span style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">${email}</span>
            </div>
          </div>
        `;
      }
    },
    {
      header: 'SYSTEM ID',
      field: '_id',
      width: '130px',
      formatter: (val: any) => `
        <div style="height: 100%; display: flex; align-items: center;">
          <span style="font-family: var(--font-mono); font-size: 10px; font-weight: 600; background: var(--bg-secondary); padding: 4px 8px; border-radius: var(--ui-border-radius-sm); border: var(--ui-border-width) solid var(--border-secondary); color: var(--text-secondary); line-height: 1; letter-spacing: 0.5px;">
            ${val ? val.toString().slice(0, 8).toUpperCase() : 'N/A'}
          </span>
        </div>
      `
    },
    {
      header: 'APPROVAL',
      field: 'status',
      width: '140px',
      formatter: (val: any) => {
        const statusStr = (val || 'unknown').toLowerCase();

        // Default (Info/Blue)
        let bg = 'color-mix(in srgb, var(--color-info) 10%, transparent)';
        let color = 'var(--color-info-dark, var(--color-info))';
        let border = 'color-mix(in srgb, var(--color-info) 20%, transparent)';

        if (statusStr === 'approved' || statusStr === 'active') {
          bg = 'color-mix(in srgb, var(--color-success) 10%, transparent)';
          color = 'var(--color-success-dark, var(--color-success))';
          border = 'color-mix(in srgb, var(--color-success) 20%, transparent)';
        } else if (statusStr === 'pending') {
          bg = 'color-mix(in srgb, var(--color-warning) 10%, transparent)';
          color = 'var(--color-warning-dark, var(--color-warning))';
          border = 'color-mix(in srgb, var(--color-warning) 20%, transparent)';
        }

        return `
          <div style="height: 100%; display: flex; align-items: center;">
            <span style="background: ${bg}; color: ${color}; padding: 4px 10px; border-radius: var(--ui-border-radius-pill); font-size: 10px; font-weight: 700; border: var(--ui-border-width) solid ${border}; line-height: 1; letter-spacing: 0.05em; text-transform: uppercase;">
              ${statusStr}
            </span>
          </div>
        `;
      }
    },
    {
      header: 'ACCOUNT STATE',
      field: 'isActive',
      width: '160px',
      pinned: 'right',
      formatter: (val: any) => {
        const isActive = val;

        const color = isActive ? 'var(--color-success-dark, #059669)' : 'var(--color-error-dark, #dc2626)';
        const bg = isActive ? 'color-mix(in srgb, var(--color-success) 10%, transparent)' : 'color-mix(in srgb, var(--color-error) 10%, transparent)';
        const border = isActive ? 'color-mix(in srgb, var(--color-success) 20%, transparent)' : 'color-mix(in srgb, var(--color-error) 20%, transparent)';
        const text = isActive ? 'ACTIVE' : 'SUSPENDED';

        return `
          <div style="height: 100%; display: flex; align-items: center; justify-content: flex-end;">
            <span style="background: ${bg}; color: ${color}; padding: 4px 12px; border-radius: var(--ui-border-radius-pill); font-size: 10px; font-weight: 700; border: var(--ui-border-width) solid ${border}; line-height: 1; letter-spacing: 0.05em;">
              ${text}
            </span>
          </div>
        `;
      }
    }
  ];

  ngOnInit() {
    this.deptId = this.route.snapshot.paramMap.get('id') || '';
    if (this.deptId) {
      this.loadDepartmentData();
    } else {
      this.router.navigate(['/hrms/department/list']);
    }
  }

  // --- Data Loading ---
  loadDepartmentData() {
    this.isLoading.set(true);

    forkJoin({
      department: this.dataService.getDepartment(this.deptId).pipe(
        map((res: any) => res?.data?.data || res),
        catchError((err) => {
          this.messageService.handleHttpError(err)
          return of(null);
        })
      ),
      employeesData: this.dataService.getDepartmentEmployees(this.deptId).pipe(
        map((res: any) => res?.data?.employees || []),
        catchError((err) => {
          this.messageService.handleHttpError(err)
          return of([]);
        })
      )
    }).pipe(takeUntil(this.destroy$)).subscribe(({ department, employeesData }) => {
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
    this.router.navigate(['/hrms/department/list']);
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
