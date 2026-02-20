import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-designation-career-path',
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
            <h1 class="page-title">Career Path Mapping</h1>
            <p class="page-subtitle">Visualize vertical progression and lateral mobility options.</p>
          </div>
        </div>
        
        <div class="header-right">
          <button class="icon-btn" (click)="loadPathData()" title="Refresh" [class.spinning]="isLoading()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        
        <div class="grid-card filter-card card-anim-1" style="margin-bottom: var(--spacing-xl); padding: var(--spacing-md) var(--spacing-lg);">
          <div class="se-filter-bar" style="border: none; padding: 0; align-items: center;">
            
            <div class="se-filter-field" style="flex: 1; max-width: 500px;">
              <label for="designationSelect">Explore Career Path For:</label>
              <div class="select-wrapper w-full">
                <select id="designationSelect" [(ngModel)]="selectedDesignationId" (change)="loadPathData()" class="se-input w-full">
                  <option [ngValue]="null">-- Select a Role --</option>
                  @for (desig of designationOptions(); track desig._id) {
                    <option [value]="desig._id">{{ desig.title }} ({{ desig.code }})</option>
                  }
                </select>
              </div>
            </div>

            <div class="se-filter-actions" style="margin-left: auto;">
              <button class="btn btn-primary" (click)="loadPathData()" [disabled]="!selectedDesignationId || isLoading()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                Generate Map
              </button>
            </div>
            
          </div>
        </div>

        @if (isLoading()) {
          <div class="loading-state-box card-anim-2">
            <div class="spinner"></div>
            <p>Mapping career trajectories...</p>
          </div>
        } @else if (pathData()) {
          
          <div class="bento-grid">
            
            <div class="grid-card card-anim-2" style="border-color: var(--color-primary);">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                <h2 class="card-title">Base Designation</h2>
              </div>
              <div class="card-body flex-col current-role-box">
                <h3 class="role-huge-title">{{ pathData().current?.title }}</h3>
                <div class="role-code-badge">{{ pathData().current?.code }}</div>
                
                <div class="divider"></div>
                
                <div class="info-group">
                  <label>Job Family</label>
                  <span class="detail-text bold" style="text-transform: capitalize;">{{ pathData().current?.jobFamily || 'Unspecified' }}</span>
                </div>
                
                <div class="inner-grid-2 mt-2">
                  <div class="info-group">
                    <label>Level</label>
                    <span class="detail-text bold color-primary">Level {{ pathData().current?.level }}</span>
                  </div>
                  <div class="info-group">
                    <label>Grade</label>
                    <span class="detail-text bold">Grade {{ pathData().current?.grade }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid-card span-2 card-anim-3">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg></div>
                <h2 class="card-title">Vertical Progression (Promotions)</h2>
              </div>
              <div class="card-body">
                
                @if (pathData().careerPath && pathData().careerPath.length > 0) {
                  <div class="path-timeline">
                    
                    <div class="timeline-node active">
                      <div class="node-dot"></div>
                      <div class="node-content">
                        <span class="node-label">Current Role</span>
                        <h4 class="node-title">{{ pathData().current?.title }}</h4>
                        <span class="badge badge-outline">Lvl {{ pathData().current?.level }}</span>
                      </div>
                    </div>

                    @for (step of pathData().careerPath; track step._id; let i = $index) {
                      <div class="timeline-connector">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                        <div class="connector-label">
                           {{ step.promotionAfterYears ? step.promotionAfterYears + ' Yrs Required' : 'Eligible' }}
                        </div>
                      </div>

                      <div class="timeline-node future" (click)="selectNewDesignation(step._id)">
                        <div class="node-dot"></div>
                        <div class="node-content clickable-node">
                          <span class="node-label">Step {{ i + 1 }}</span>
                          <h4 class="node-title">{{ step.title }}</h4>
                          <div class="node-meta">
                            <span class="badge badge-neutral">Lvl {{ step.level }}</span>
                            <span class="secondary-text ml-1">{{ step.code }}</span>
                          </div>
                          <div class="hover-action">View Path</div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-state-inline">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    <p>Highest level reached or no further vertical path defined.</p>
                  </div>
                }

              </div>
            </div>

            <div class="grid-card span-3 card-anim-4">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20"></path><path d="M18 8l4 4-4 4"></path><path d="M6 16l-4-4 4-4"></path></svg></div>
                <h2 class="card-title">Lateral Mobility (Same Level/Grade)</h2>
              </div>
              <div class="card-body">
                
                @if (pathData().lateralMoves && pathData().lateralMoves.length > 0) {
                  <div class="lateral-grid">
                    @for (lateral of pathData().lateralMoves; track lateral._id) {
                      <div class="lateral-card" (click)="selectNewDesignation(lateral._id)">
                        <div class="lateral-header">
                          <h4 class="lateral-title">{{ lateral.title }}</h4>
                          <span class="badge badge-neutral">Grade {{ lateral.grade }}</span>
                        </div>
                        <div class="lateral-footer">
                          <span class="secondary-text">{{ lateral.code }}</span>
                          <span class="job-family-tag">{{ lateral.jobFamily || 'General' }}</span>
                        </div>
                        <div class="hover-action-lateral">Explore</div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-state-inline">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <p>No lateral moves configured for this specific grade and job family.</p>
                  </div>
                }

              </div>
            </div>

          </div>

        } @else if (!selectedDesignationId) {
          <div class="empty-state card-anim-2" style="height: 400px; background: var(--component-bg); border-radius: var(--ui-border-radius-lg); border: 1px dashed var(--border-secondary);">
            <p>Select a designation from the dropdown above to view its career roadmap.</p>
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
    .card-body.flex-col { display: flex; flex-direction: column; gap: var(--spacing-md); }
    
    /* Filters & Inputs */
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
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
    .icon-btn:hover { background: var(--component-surface-raised); color: var(--text-primary); }
    .icon-btn.spinning svg { animation: spin 1s linear infinite; }

    /* Info Groups */
    .info-group { display: flex; flex-direction: column; gap: 4px; }
    .info-group label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    .detail-text { font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; }
    .detail-text.bold { font-weight: var(--font-weight-semibold); }
    .color-primary { color: var(--color-primary); }
    .divider { height: 1px; background: var(--border-primary); margin: var(--spacing-sm) 0; }
    .mt-2 { margin-top: 8px; }
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }

    /* Current Role Styling */
    .current-role-box { align-items: center; text-align: center; padding: var(--spacing-lg) 0; }
    .role-huge-title { font-size: 1.5rem; font-family: var(--font-heading); font-weight: var(--font-weight-bold); margin: 0 0 8px 0; color: var(--text-primary); }
    .role-code-badge { background: var(--component-surface-raised); border: 1px solid var(--border-secondary); padding: 4px 12px; border-radius: 999px; font-family: var(--font-mono, monospace); font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--text-secondary); }

    /* Path Timeline (Vertical layout converted to flex rows if space allows) */
    .path-timeline { display: flex; align-items: flex-start; gap: 16px; overflow-x: auto; padding-bottom: 12px; }
    .timeline-node { display: flex; flex-direction: column; align-items: center; gap: 12px; flex: 1; min-width: 150px; position: relative; }
    .node-dot { width: 16px; height: 16px; border-radius: 50%; background: var(--border-secondary); z-index: 2; border: 3px solid var(--bg-primary); box-shadow: 0 0 0 1px var(--border-secondary); transition: all 0.2s; }
    .timeline-node.active .node-dot { background: var(--color-primary); box-shadow: 0 0 0 1px var(--color-primary); }
    .timeline-node.future .node-dot { background: var(--color-success); box-shadow: 0 0 0 1px var(--color-success); }
    
    .node-content { background: var(--component-surface-raised); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-md); text-align: center; width: 100%; box-sizing: border-box; position: relative; overflow: hidden; transition: all 0.2s; }
    .clickable-node { cursor: pointer; }
    .clickable-node:hover { border-color: var(--color-success); box-shadow: var(--shadow-sm); transform: translateY(-2px); }
    .clickable-node:hover .node-dot { transform: scale(1.2); }
    
    .node-label { font-size: 0.625rem; font-weight: var(--font-weight-bold); text-transform: uppercase; color: var(--text-tertiary); display: block; margin-bottom: 4px; }
    .node-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); margin: 0 0 8px 0; color: var(--text-primary); }
    .node-meta { display: flex; justify-content: center; align-items: center; gap: 6px; }
    
    .hover-action { position: absolute; bottom: 0; left: 0; width: 100%; background: var(--color-success); color: white; font-size: 0.625rem; font-weight: var(--font-weight-bold); text-transform: uppercase; padding: 4px 0; transform: translateY(100%); transition: transform 0.2s; }
    .clickable-node:hover .hover-action { transform: translateY(0); }

    .timeline-connector { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 14px; color: var(--text-tertiary); position: relative; flex-shrink: 0; width: 80px; }
    .timeline-connector svg { color: var(--border-secondary); transform: rotate(-90deg); margin-bottom: 4px; }
    .connector-label { font-size: 0.625rem; font-weight: var(--font-weight-medium); text-align: center; background: var(--bg-primary); padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border-primary); }

    /* Lateral Grid */
    .lateral-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--spacing-md); }
    .lateral-card { background: var(--component-surface-raised); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-md); cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
    .lateral-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); transform: translateY(-2px); }
    .lateral-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; }
    .lateral-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); margin: 0; color: var(--text-primary); flex: 1; }
    .lateral-footer { display: flex; justify-content: space-between; align-items: center; }
    .job-family-tag { font-size: 0.6875rem; color: var(--text-secondary); background: var(--border-primary); padding: 2px 8px; border-radius: 999px; text-transform: capitalize; }
    
    .hover-action-lateral { position: absolute; bottom: 0; left: 0; width: 100%; background: var(--color-primary); color: white; font-size: 0.625rem; font-weight: var(--font-weight-bold); text-transform: uppercase; padding: 4px 0; text-align: center; transform: translateY(100%); transition: transform 0.2s; }
    .lateral-card:hover .hover-action-lateral { transform: translateY(0); }

    /* Shared Elements */
    .badge { padding: 2px 8px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-semibold); }
    .badge-outline { border: 1px solid var(--border-primary); color: var(--text-secondary); }
    .badge-neutral { background: var(--border-secondary); color: var(--text-primary); }
    .secondary-text { color: var(--text-tertiary); font-size: 0.75rem; font-family: var(--font-mono, monospace); }
    .ml-1 { margin-left: 4px; }
    
    .empty-state { text-align: center; padding: 4rem 1rem !important; color: var(--text-tertiary); display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .empty-state-inline { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; color: var(--text-tertiary); text-align: center; gap: 12px; border: 1px dashed var(--border-secondary); border-radius: var(--ui-border-radius-lg); background: var(--bg-primary); }
    .loading-state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 4rem; color: var(--text-secondary); }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.3s ease-out both; }
    .card-anim-2 { animation: popIn 0.3s ease-out 0.05s both; }
    .card-anim-3 { animation: popIn 0.3s ease-out 0.1s both; }
    .card-anim-4 { animation: popIn 0.3s ease-out 0.15s both; }

    /* Responsive */
    @media (max-width: 1024px) {
      .path-timeline { flex-direction: column; align-items: stretch; }
      .timeline-node { flex-direction: row; text-align: left; }
      .node-content { display: flex; align-items: center; justify-content: space-between; }
      .timeline-connector { width: 100%; flex-direction: row; padding-top: 0; padding-left: 5px; height: 30px; justify-content: flex-start; }
      .timeline-connector svg { transform: rotate(0deg); }
    }
    @media (max-width: 768px) {
      .bento-grid { grid-template-columns: 1fr; }
      .span-2, .span-3 { grid-column: span 1; }
      .se-filter-bar { flex-direction: column; align-items: stretch; }
      .se-filter-field { max-width: 100% !important; }
      .node-content { flex-direction: column; align-items: flex-start; text-align: left; }
    }
  `]
})
export class DesignationCareerPathComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  // State
  designationOptions = signal<any[]>([]);
  selectedDesignationId: string | null = null;
  
  isLoading = signal(false);
  pathData = signal<any | null>(null);

  ngOnInit() {
    this.loadDesignationsDropdown();

    // Pick up ID from route if navigating directly here from a list
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.selectedDesignationId = id;
        this.loadPathData();
      }
    });
  }

  loadDesignationsDropdown() {
    this.hrmsService.getDesignations().subscribe({
      next: (res: any) => {
        const list = res?.data?.designations || res?.data?.data || [];
        this.designationOptions.set(list);
      }
    });
  }

  loadPathData() {
    if (!this.selectedDesignationId) return;

    this.isLoading.set(true);
    
    // API: /v1/hrms/designations/career-path/:id
    this.hrmsService.getCareerPath(this.selectedDesignationId).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res: any) => {
        // Matches JSON: { data: { current, careerPath, lateralMoves } }
        const data = res?.data || null;
        this.pathData.set(data);
      },
      error: () => {
        this.messageService.showError('Error', 'Failed to retrieve career path data.');
        this.pathData.set(null);
      }
    });
  }

  selectNewDesignation(newId: string) {
    // Dynamically update the view to explore the path of the clicked node
    this.selectedDesignationId = newId;
    this.loadPathData();
  }

  goBack() {
    this.router.navigate(['/hrms/designation/list']);
  }
}
