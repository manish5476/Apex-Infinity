import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { of, catchError, map, finalize } from 'rxjs';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-designation-details',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          
          @if (designation(); as desig) {
            <div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <h1 class="page-title">{{ desig.title }}</h1>
                <span class="status-badge" [class.active]="desig.isActive" [class.inactive]="!desig.isActive">
                  {{ desig.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p class="page-subtitle">{{ desig.code }} • {{ desig.jobFamily || 'Unspecified Family' }}</p>
            </div>
          } @else if (!isLoading()) {
            <div>
              <h1 class="page-title">Designation Not Found</h1>
            </div>
          }
        </div>
        
        <div class="header-right">
          <button type="button" class="btn btn-outline" (click)="goBack()">Close</button>
          @if (designation()) {
            <button type="button" class="btn btn-primary" (click)="editDesignation()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Edit Role
            </button>
          }
        </div>
      </header>

      <main class="dashboard-content">
        
        @if (isLoading()) {
          <div class="loading-state-full">
            <div class="spinner"></div>
            <p>Loading Designation Details...</p>
          </div>
        } 
        
        @if (designation(); as desig) {
          <div class="bento-grid">
            
            <div class="grid-card span-2 card-anim-1">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                <h2 class="card-title">Role Overview</h2>
              </div>
              <div class="card-body">
                <div class="info-group" style="margin-bottom: var(--spacing-lg);">
                  <label>Description</label>
                  <p class="detail-text">{{ desig.description || 'No description provided.' }}</p>
                </div>

                <div class="inner-grid-3">
                  <div class="info-group">
                    <label>Job Code</label>
                    <div class="badge-neutral-lg">{{ desig.code }}</div>
                  </div>
                  <div class="info-group">
                    <label>Job Family</label>
                    <p class="detail-text bold">{{ desig.jobFamily || 'N/A' }}</p>
                  </div>
                  <div class="info-group">
                    <label>Experience Required</label>
                    <p class="detail-text bold">{{ desig.experienceRequired ? desig.experienceRequired + ' Years' : 'N/A' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid-card card-anim-2">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg></div>
                <h2 class="card-title">Hierarchy</h2>
              </div>
              <div class="card-body flex-col">
                <div class="hierarchy-badges">
                  <div class="h-badge level">Level {{ desig.level }}</div>
                  <div class="h-badge grade">Grade {{ desig.grade }}</div>
                </div>

                <div class="divider"></div>

                <div class="info-group">
                  <label>Career Path (Next Role)</label>
                  <p class="detail-text bold color-primary">
                    {{ desig.nextDesignation?.title || desig.nextDesignation || 'Top Level / Unspecified' }}
                  </p>
                </div>
                <div class="info-group">
                  <label>Promotion Eligibility</label>
                  <p class="detail-text">{{ desig.promotionAfterYears ? desig.promotionAfterYears + ' Years' : 'N/A' }}</p>
                </div>
              </div>
            </div>

            <div class="grid-card span-2 card-anim-3">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                <h2 class="card-title">Requirements</h2>
              </div>
              <div class="card-body inner-grid-2">
                
                <div class="list-section">
                  <label>Key Responsibilities</label>
                  @if (desig.responsibilities && desig.responsibilities.length > 0) {
                    <ul class="styled-list">
                      @for (item of desig.responsibilities; track item) {
                        <li>{{ item }}</li>
                      }
                    </ul>
                  } @else {
                    <p class="empty-text">No responsibilities listed.</p>
                  }
                </div>

                <div class="list-section">
                  <label>Qualifications</label>
                  @if (desig.qualifications && desig.qualifications.length > 0) {
                    <ul class="styled-list">
                      @for (item of desig.qualifications; track item) {
                        <li>{{ item }}</li>
                      }
                    </ul>
                  } @else {
                    <p class="empty-text">No qualifications listed.</p>
                  }
                </div>

              </div>
            </div>

            <div class="grid-card card-anim-4">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
                <h2 class="card-title">Attributes & Compensation</h2>
              </div>
              <div class="card-body flex-col">
                
                <div class="info-group">
                  <label>Salary Band ({{ desig.salaryBand?.currency || 'INR' }})</label>
                  @if (desig.salaryBand?.min || desig.salaryBand?.max) {
                    <p class="detail-text bold salary-text">
                      {{ desig.salaryBand.min | number }} - {{ desig.salaryBand.max | number }}
                    </p>
                  } @else {
                    <p class="detail-text">Not configured</p>
                  }
                </div>

                <div class="divider"></div>

                <div class="tags-container">
                  @if (desig.metadata?.isManager) { <span class="tag tag-blue">Managerial Role</span> }
                  @if (desig.metadata?.isExecutive) { <span class="tag tag-purple">Executive Level</span> }
                  @if (desig.metadata?.requiresApproval) { <span class="tag tag-orange">Requires Approval</span> }
                  
                  @if (!desig.metadata?.isManager && !desig.metadata?.isExecutive && !desig.metadata?.requiresApproval) {
                    <span class="detail-text">Standard Role Attributes</span>
                  }
                </div>

                <div class="divider"></div>
                
                <div class="info-group">
                  <label>Reports To</label>
                  @if (desig.reportsTo && desig.reportsTo.length > 0) {
                    <div class="tags-container mt-1">
                      @for (report of desig.reportsTo; track report) {
                        <span class="tag tag-gray">{{ report.title || report }}</span>
                      }
                    </div>
                  } @else {
                    <p class="detail-text">No direct reporting lines mapped.</p>
                  }
                </div>

              </div>
            </div>

          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       BASE THEME & LAYOUT
       ========================================================================== */
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    
    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
    .icon-btn:hover { background: var(--component-surface-raised); color: var(--text-primary); }
    
    .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0; line-height: 1.2; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 4px 0 0 0; }
    
    /* Buttons */
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-fast); border: var(--ui-border-width) solid transparent; }
    .btn-outline { background: var(--component-bg); border-color: var(--border-secondary); color: var(--text-primary); }
    .btn-outline:hover { background: var(--component-surface-raised); border-color: var(--border-primary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:hover { background: var(--color-primary-dark); }

    /* Main Content Grid */
    .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); position: relative; }
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); align-items: start; max-width: 1600px; margin: 0 auto; }
    .span-2 { grid-column: span 2; }
    
    .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); padding: var(--spacing-lg); display: flex; flex-direction: column; }
    .card-header { display: flex; align-items: center; gap: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border-primary); margin-bottom: var(--spacing-md); }
    .card-icon { color: var(--color-primary); display: flex; align-items: center; }
    .card-title { font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 0; color: var(--text-primary); }
    
    .card-body.flex-col { display: flex; flex-direction: column; gap: var(--spacing-md); }
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    .inner-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); }

    /* Detail Typography & Elements */
    .info-group { display: flex; flex-direction: column; gap: 6px; }
    .info-group label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    
    .detail-text { font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; line-height: 1.5; }
    .detail-text.bold { font-weight: var(--font-weight-semibold); }
    .color-primary { color: var(--color-primary); }
    .empty-text { font-size: var(--font-size-sm); color: var(--text-tertiary); font-style: italic; margin: 0; }
    
    .salary-text { font-family: var(--font-mono, monospace); font-size: 1rem; color: var(--text-primary); }
    .divider { height: 1px; background: var(--border-primary); margin: var(--spacing-xs) 0; }
    .mt-1 { margin-top: 4px; }

    /* Badges & Tags */
    .status-badge { display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge.active { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); }
    .status-badge.inactive { background: color-mix(in srgb, var(--text-tertiary) 15%, transparent); color: var(--text-tertiary); }
    
    .badge-neutral-lg { display: inline-flex; align-items: center; justify-content: center; background: var(--bg-secondary); color: var(--text-primary); padding: 4px 12px; border-radius: 6px; font-family: var(--font-mono, monospace); font-size: var(--font-size-sm); border: 1px solid var(--border-secondary); width: fit-content; }

    .hierarchy-badges { display: flex; gap: var(--spacing-sm); }
    .h-badge { padding: 6px 12px; border-radius: 6px; font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); border: 1px solid; }
    .h-badge.level { background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary); border-color: color-mix(in srgb, var(--color-primary) 20%, transparent); }
    .h-badge.grade { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--border-secondary); }

    .tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag { padding: 4px 10px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-semibold); border: 1px solid transparent; }
    .tag-blue { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .tag-purple { background: #faf5ff; color: #7e22ce; border-color: #e9d5ff; }
    .tag-orange { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
    .tag-gray { background: var(--bg-secondary); color: var(--text-secondary); border-color: var(--border-secondary); }

    /* Lists */
    .list-section { display: flex; flex-direction: column; gap: 8px; }
    .styled-list { margin: 0; padding-left: 20px; color: var(--text-primary); font-size: var(--font-size-sm); line-height: 1.6; }
    .styled-list li { margin-bottom: 6px; }
    .styled-list li::marker { color: var(--color-primary); }

    /* Loading State */
    .loading-state-full { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-primary); gap: 12px; color: var(--text-secondary); z-index: 10; font-size: var(--font-size-sm); }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.4s ease-out 0.05s both; } 
    .card-anim-2 { animation: popIn 0.4s ease-out 0.1s both; } 
    .card-anim-3 { animation: popIn 0.4s ease-out 0.15s both; } 
    .card-anim-4 { animation: popIn 0.4s ease-out 0.2s both; }
    
    /* Responsive Grid */
    @media (max-width: 1024px) {
      .bento-grid { grid-template-columns: repeat(2, 1fr); }
      .span-2 { grid-column: span 2; }
    }
    @media (max-width: 768px) {
      .bento-grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
      .inner-grid-2, .inner-grid-3 { grid-template-columns: 1fr; }
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-md); }
      .header-right { justify-content: flex-end; }
    }
  `]
})
export class DesignationDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  // Using signals for reactive state
  designation = signal<any | null>(null);
  isLoading = signal(true);
  desigId: string | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.desigId = params.get('id');
      if (this.desigId) {
        this.loadDesignationDetails();
      } else {
        this.isLoading.set(false);
        this.messageService.showError('Error', 'Invalid designation ID.');
        this.goBack();
      }
    });
  }

  private loadDesignationDetails() {
    this.isLoading.set(true);
    
    this.hrmsService.getDesignation(this.desigId!).pipe(
      map((res: any) => res?.data?.designation || res?.data || res),
      catchError(err => {
        this.messageService.showError('Error', 'Failed to load designation details.');
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(data => {
      if (data) {
        this.designation.set(data);
      } else {
        // Fallback if data is null after catchError
        this.designation.set(null);
      }
    });
  }

  editDesignation() {
    if (this.desigId) {
      this.router.navigate(['/hrms/designation/edit', this.desigId]);
    }
  }

  goBack() {
    this.router.navigate(['/hrms/designation/list']);
  }
}