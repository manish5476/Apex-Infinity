import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subject } from 'rxjs';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-designation-promotion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 class="page-title">Promotion Eligibility</h1>
            <p class="page-subtitle">Identify employees ready for the next step in their career path.</p>
          </div>
        </div>
        
        <div class="header-right">
          <button class="icon-btn" (click)="loadEligibilityData()" title="Refresh" [class.spinning]="isLoading()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        
        <div class="grid-card filter-card card-anim-1" style="margin-bottom: var(--spacing-xl); padding: var(--spacing-md) var(--spacing-lg);">
          <div class="se-filter-bar" style="border: none; padding: 0;">
            
            <div class="se-filter-field" style="flex: 1; max-width: 400px;">
              <label for="designationSelect">Target Baseline Role</label>
              <div class="select-wrapper w-full">
                <select id="designationSelect" [(ngModel)]="selectedDesignationId" (change)="loadEligibilityData()" class="se-input w-full">
                  <option [ngValue]="null">-- Select a Designation --</option>
                  @for (desig of designationOptions(); track desig._id) {
                    <option [value]="desig._id">{{ desig.title }} ({{ desig.code }})</option>
                  }
                </select>
              </div>
            </div>

            <div class="se-filter-field" style="width: 150px;">
              <label for="yearsFilter">Min. Years in Role</label>
              <input id="yearsFilter" type="number" [(ngModel)]="filterYears" min="0" step="0.5" class="se-input w-full" />
            </div>

            <div class="se-filter-actions" style="margin-left: auto;">
              <button class="btn btn-primary" (click)="loadEligibilityData()" [disabled]="!selectedDesignationId || isLoading()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Check Eligibility
              </button>
            </div>
            
          </div>
        </div>

        @if (isLoading()) {
          <div class="loading-state-box card-anim-2">
            <div class="spinner"></div>
            <p>Analyzing employee tenure and career paths...</p>
          </div>
        } @else if (currentData()) {
          <div class="bento-grid">
            
            <div class="grid-card span-2 card-anim-2">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg></div>
                <h2 class="card-title">Career Progression Path</h2>
              </div>
              
              <div class="card-body path-container">
                
                <div class="role-box current">
                  <div class="role-label">Current Designation</div>
                  <h3 class="role-title">{{ currentData().currentDesignation?.title }}</h3>
                  <div class="role-meta">
                    <span class="badge badge-outline">Lvl {{ currentData().currentDesignation?.level }}</span>
                    <span class="badge badge-neutral">Grade {{ currentData().currentDesignation?.grade }}</span>
                    <span class="secondary-text ml-2">{{ currentData().currentDesignation?.code }}</span>
                  </div>
                </div>

                <div class="path-arrow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>

                <div class="role-box next" [class.empty]="!currentData().nextDesignation">
                  <div class="role-label">Target Designation</div>
                  @if (currentData().nextDesignation) {
                    <h3 class="role-title">{{ currentData().nextDesignation.title }}</h3>
                    <div class="role-meta">
                      <span class="badge badge-outline">Lvl {{ currentData().nextDesignation.level }}</span>
                      <span class="badge badge-neutral">Grade {{ currentData().nextDesignation.grade }}</span>
                    </div>
                  } @else {
                    <h3 class="role-title empty-text">No target defined</h3>
                    <p class="secondary-text m-0">This role has no standard next step in the hierarchy.</p>
                  }
                </div>

              </div>
            </div>

            <div class="grid-card card-anim-3 stat-card">
              <div class="card-body stat-body">
                <div class="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg></div>
                <div class="stat-value">{{ currentData().eligibleCount || 0 }}</div>
                <div class="stat-label">Eligible Employees</div>
                <div class="stat-context">Based on {{ filterYears }} year(s) tenure requirement</div>
              </div>
            </div>

            <div class="grid-card span-3 card-anim-4 table-card">
              <div class="card-header" style="padding: var(--spacing-lg) var(--spacing-lg) 0 var(--spacing-lg); border: none;">
                <h2 class="card-title">Eligible Candidates</h2>
              </div>
              
              <div class="table-container">
                <table class="se-table">
                  <thead>
                    <tr>
                      <th>Employee Info</th>
                      <th>Current Tenure</th>
                      <th>Department</th>
                      <th>Performance / Status</th>
                      <th class="actions-col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (!currentData().employees || currentData().employees.length === 0) {
                      <tr>
                        <td colspan="5" class="empty-state">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                          <p>No employees currently meet the {{ filterYears }} year tenure requirement for this role.</p>
                        </td>
                      </tr>
                    }

                    @for (emp of currentData().employees; track emp._id) {
                      <tr>
                        <td>
                          <div class="primary-text">{{ emp.name || 'Unknown Employee' }}</div>
                          <div class="secondary-text">{{ emp.employeeId || emp.email || 'ID Not Available' }}</div>
                        </td>
                        <td>
                          <div class="primary-text">{{ emp.tenureYears || filterYears }}+ Years</div>
                        </td>
                        <td>
                          <div class="secondary-text">{{ emp.department?.name || 'Unassigned' }}</div>
                        </td>
                        <td>
                          <span class="status-badge success">Ready for Review</span>
                        </td>
                        <td class="actions-col">
                          <button class="btn btn-outline btn-sm" [disabled]="!currentData().nextDesignation" title="Initiate Promotion">
                            Initiate
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        } @else if (!selectedDesignationId) {
          <div class="empty-state card-anim-2" style="height: 400px; background: var(--component-bg); border-radius: var(--ui-border-radius-lg); border: 1px dashed var(--border-secondary);">
            <p>Select a baseline designation and click "Check Eligibility" to view candidates.</p>
          </div>
        }

      </main>
    </div>
  `,
  styles: [`
    /* Standard Layout */
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0 0 2px 0; line-height: 1.2; }
    .page-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }
    
    .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); }
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); max-width: 1400px; margin: 0 auto; }
    .span-2 { grid-column: span 2; }
    .span-3 { grid-column: span 3; }
    
    .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); padding: var(--spacing-lg); display: flex; flex-direction: column; }
    .card-header { display: flex; align-items: center; gap: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border-primary); margin-bottom: var(--spacing-md); }
    .card-icon { color: var(--color-primary); display: flex; align-items: center; }
    .card-title { font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 0; color: var(--text-primary); }
    
    /* Filter Bar */
    .filter-card { max-width: 1400px; margin: 0 auto; }
    .se-filter-bar { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--spacing-lg); }
    .se-filter-field { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .se-filter-field label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    .se-input { background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: 0.4rem 0.6rem; font-size: var(--font-size-sm); color: var(--text-primary); height: 38px; box-sizing: border-box; outline: none; transition: all 0.2s; }
    .se-input:focus { border-color: var(--color-primary); }
    .w-full { width: 100%; }
    .select-wrapper { position: relative; } select.se-input { appearance: none; padding-right: 2rem; cursor: pointer; }
    
    /* Buttons */
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-fast); border: var(--ui-border-width) solid transparent; height: 38px; }
    .btn-sm { height: 32px; padding: 0.25rem 0.75rem; font-size: 0.75rem; }
    .btn-outline { background: var(--component-bg); border-color: var(--border-secondary); color: var(--text-primary); }
    .btn-outline:hover:not(:disabled) { background: var(--component-surface-raised); border-color: var(--border-primary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn-primary:disabled, .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
    .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
    .icon-btn:hover { background: var(--component-surface-raised); color: var(--text-primary); }
    .icon-btn.spinning svg { animation: spin 1s linear infinite; }

    /* Path UI */
    .path-container { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-xl); padding: var(--spacing-md) 0; }
    .role-box { flex: 1; border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-xl); background: var(--bg-primary); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .role-box.current { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 3%, transparent); }
    .role-box.next { border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 3%, transparent); }
    .role-box.next.empty { border-color: var(--border-secondary); background: var(--bg-secondary); }
    
    .path-arrow { color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; }
    .role-label { font-size: 0.6875rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); }
    .role-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--text-primary); margin: 0; }
    .role-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center; }
    .empty-text { color: var(--text-tertiary); font-style: italic; }
    .ml-2 { margin-left: 8px; }

    /* Stat Card */
    .stat-card { justify-content: center; background: color-mix(in srgb, var(--color-primary) 5%, transparent); border-color: color-mix(in srgb, var(--color-primary) 20%, transparent); }
    .stat-body { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; }
    .stat-icon { color: var(--color-primary); background: var(--bg-primary); padding: 12px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent); display: inline-flex; }
    .stat-value { font-size: 3rem; font-family: var(--font-heading); font-weight: var(--font-weight-bold); color: var(--text-primary); line-height: 1; }
    .stat-label { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--text-primary); }
    .stat-context { font-size: var(--font-size-xs); color: var(--text-secondary); }

    /* Table */
    .table-card { padding: 0; overflow: hidden; }
    .table-container { width: 100%; overflow-x: auto; }
    .se-table { width: 100%; border-collapse: collapse; text-align: left; font-size: var(--font-size-sm); }
    .se-table th { padding: 14px 16px; background: var(--component-surface-raised); color: var(--text-secondary); font-weight: var(--font-weight-semibold); text-transform: uppercase; letter-spacing: 0.03em; font-size: 0.6875rem; border-bottom: 1px solid var(--border-primary); }
    .se-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-secondary); vertical-align: middle; }
    .se-table tr:hover td { background: color-mix(in srgb, var(--component-surface-raised) 50%, transparent); }
    .se-table tr:last-child td { border-bottom: none; }
    .primary-text { font-weight: var(--font-weight-bold); color: var(--text-primary); margin-bottom: 2px; }
    .secondary-text { color: var(--text-tertiary); font-size: 0.75rem; }
    .actions-col { text-align: right; width: 100px; }

    .badge { padding: 2px 8px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-semibold); }
    .badge-outline { border: 1px solid var(--border-primary); color: var(--text-secondary); }
    .badge-neutral { background: var(--border-secondary); color: var(--text-primary); }
    .status-badge { display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge.success { background: #ecfdf5; color: #15803d; border: 1px solid #bbf7d0; }

    /* States */
    .empty-state { text-align: center; padding: 4rem 1rem !important; color: var(--text-tertiary); display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .loading-state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 4rem; color: var(--text-secondary); }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.3s ease-out both; }
    .card-anim-2 { animation: popIn 0.3s ease-out 0.05s both; }
    .card-anim-3 { animation: popIn 0.3s ease-out 0.1s both; }
    .card-anim-4 { animation: popIn 0.3s ease-out 0.15s both; }

    @media (max-width: 1024px) {
      .path-container { flex-direction: column; gap: var(--spacing-md); }
      .path-arrow svg { transform: rotate(90deg); }
      .role-box { width: 100%; box-sizing: border-box; }
    }
    @media (max-width: 768px) {
      .bento-grid { grid-template-columns: 1fr; }
      .span-2, .span-3 { grid-column: span 1; }
      .se-filter-bar { flex-direction: column; align-items: stretch; }
      .se-filter-field { max-width: 100% !important; width: 100% !important; }
    }
  `]
})
export class DesignationPromotionComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  // Filter State
  designationOptions = signal<any[]>([]);
  selectedDesignationId: string | null = null;
  filterYears: number = 2; // Default to 2 years based on your API defaults

  // Data State
  isLoading = signal(false);
  currentData = signal<any | null>(null);

  ngOnInit() {
    this.loadDesignationsDropdown();

    // Check if a designation ID was passed in the route (e.g. from the list page)
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.selectedDesignationId = id;
        this.loadEligibilityData();
      }
    });
  }

  loadDesignationsDropdown() {
    this.hrmsService.getDesignations().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const list = res?.data?.designations || res?.data?.data || [];
        this.designationOptions.set(list);
      }
    });
  }

  loadEligibilityData() {
    if (!this.selectedDesignationId) {
      this.messageService.showError( 'Please select a designation first.');
      return;
    }

    this.isLoading.set(true);
    
    // Calls API: /v1/hrms/designations/promotion-eligible?designationId=...&years=...
    this.hrmsService.getPromotionEligible(this.selectedDesignationId, this.filterYears).pipe(
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        // Matches your JSON exactly: res.data containing currentDesignation, nextDesignation, etc.
        const data = res?.data || null;
        this.currentData.set(data);
      },
      error: (err) => {
        this.messageService.handleHttpError(err)
        this.currentData.set(null);
      }
    });
  }

  goBack() {
    // Navigates back to the main list. Adjust route if needed based on your structure.
    this.router.navigate(['/hrms/designation/list']);
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
