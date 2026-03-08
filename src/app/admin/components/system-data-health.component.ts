import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-system-data-health',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, ProgressSpinnerModule],
  template: `
    <div class="health-container">

      <div class="header-section">
        <div>
          <h2 class="page-title">Data Health Diagnostics</h2>
          <p class="page-subtitle">
            Real-time monitoring of database consistency and synchronization integrity
          </p>
        </div>
        <p-button label="Run Full Audit" icon="pi pi-shield" severity="secondary" [outlined]="true" size="small" (onClick)="loadData()"></p-button>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="content-grid">
          
          <div class="side-column">
            
            <div class="score-card">
              <p class="score-label">Overall Integrity</p>
              
              <div class="score-circle">
                 <svg class="progress-ring" viewBox="0 0 160 160">
                   <circle cx="80" cy="80" r="72" class="ring-track" />
                   <circle cx="80" cy="80" r="72" 
                     class="ring-value"
                     [ngClass]="getScoreClass()"
                     stroke-dasharray="452.3"
                     [attr.stroke-dashoffset]="452.3 - (452.3 * (healthData()?.score || 0) / 100)"
                   />
                 </svg>
                 <div class="score-text">
                    <span class="score-number">{{ healthData()?.score }}%</span>
                    <span class="score-status" [ngClass]="getScoreClass()">{{ getScoreStatus() }}</span>
                 </div>
              </div>

              <div class="checks-bar-container">
                 <div class="checks-header">
                    <span class="checks-label">Checks Passed</span>
                    <span class="checks-value">{{ getHealthyCount() }}/{{ healthData()?.checks?.length }}</span>
                 </div>
                 <div class="progress-track">
                    <div class="progress-fill" 
                         [ngClass]="getScoreClass()"
                         [style.width.%]="(getHealthyCount() / (healthData()?.checks?.length || 1)) * 100"></div>
                 </div>
              </div>
            </div>

            <div class="log-card">
               <div class="log-content">
                 <p class="log-label">Audit Timestamp</p>
                 <h3 class="log-time">{{ meta()?.timestamp | date:'medium' }}</h3>
                 <p class="log-desc">
                   Response Latency: <strong>{{ meta()?.responseTime || '0ms' }}</strong>
                 </p>
               </div>
            </div>
          </div>

          <div class="main-column">
            
            <div class="diagnostics-card">
               <h3 class="card-title mb-md">Consistency Diagnostics</h3>
               
               <div class="diagnostics-list">
                 @for (item of healthData()?.checks; track item.check) {
                   <div class="diagnostic-item" [ngClass]="item.status">
                      <div class="item-left">
                        <div class="status-icon-box">
                          <i class="pi" 
                             [ngClass]="item.status === 'healthy' ? 'pi-check-circle' : 'pi-exclamation-triangle'"></i>
                        </div>
                        <div>
                          <p class="check-name">{{ item.check }}</p>
                          <p class="check-detail">{{ item.details }}</p>
                        </div>
                      </div>
                      <span class="status-badge">{{ item.status }}</span>
                   </div>
                 }
               </div>
            </div>

            <div class="roadmap-card">
               <div class="roadmap-header mb-md">
                 <i class="pi pi-sparkles roadmap-icon"></i>
                 <h4 class="roadmap-title">Optimization Roadmap</h4>
               </div>
               
               <div class="roadmap-grid">
                 @for (rec of healthData()?.recommendations; track rec) {
                   <div class="roadmap-item">
                     <i class="pi pi-arrow-right rec-arrow"></i>
                     <p class="rec-text">{{ rec }}</p>
                   </div>
                 }
               </div>
            </div>

          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Running Data Integrity Checks...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; }

    .health-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    /* HEADER */
    .header-section {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      font-family: var(--font-heading);
      letter-spacing: -0.01em;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    /* CONTENT GRID */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
    @media(min-width: 1024px) {
      .content-grid { grid-template-columns: 1fr 2fr; }
    }

    /* SIDE COLUMN */
    .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

    /* SCORE CARD */
    .score-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .score-label {
      font-size: var(--font-size-xs);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-label);
      margin-bottom: var(--spacing-xl);
    }

    .score-circle { position: relative; width: 160px; height: 160px; margin-bottom: var(--spacing-xl); }

    .progress-ring { transform: rotate(-90deg); width: 100%; height: 100%; }
    
    .ring-track {
      fill: transparent;
      stroke: var(--bg-ternary);
      stroke-width: 10;
    }

    .ring-value {
      fill: transparent;
      stroke-width: 10;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s ease-in-out;
    }
    /* Dynamic stroke colors based on class */
    .ring-value.success { stroke: var(--color-success); }
    .ring-value.warning { stroke: var(--color-warning); }
    .ring-value.error { stroke: var(--color-error); }

    .score-text {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .score-number {
      font-size: var(--font-size-4xl);
      font-weight: 900;
      color: var(--text-primary);
      font-family: var(--font-heading);
      line-height: 1;
    }

    .score-status {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .score-status.success { color: var(--color-success); }
    .score-status.warning { color: var(--color-warning); }
    .score-status.error { color: var(--color-error); }

    .checks-bar-container {
      width: 100%;
      padding: var(--spacing-md);
      background: var(--bg-ternary);
      border-radius: var(--ui-border-radius);
    }

    .checks-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .checks-label { font-size: var(--font-size-xs); color: var(--text-tertiary); }
    .checks-value { font-weight: bold; color: var(--text-primary); font-variant-numeric: tabular-nums; }

    .progress-track {
      width: 100%;
      height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 99px;
      overflow: hidden;
    }
    .progress-fill.success { background: var(--color-success); height: 100%; }
    .progress-fill.warning { background: var(--color-warning); height: 100%; }
    .progress-fill.error { background: var(--color-error); height: 100%; }

    /* LOG CARD (Gradient) */
    .log-card {
      background: var(--accent-gradient);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
      box-shadow: var(--shadow-sm);
      color: #ffffff;
    }

    .log-label {
      font-size: var(--font-size-xs);
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.8;
      margin: 0 0 4px 0;
    }

    .log-time { font-size: var(--font-size-md); font-weight: bold; margin: 0; }

    .log-desc {
      font-size: 10px;
      margin-top: var(--spacing-md);
      opacity: 0.9;
      line-height: 1.4;
    }

    /* MAIN COLUMN */
    .main-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

    /* DIAGNOSTICS CARD */
    .diagnostics-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-xl);
    }

    .card-title {
      font-size: var(--font-size-sm);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-primary);
      margin: 0;
    }
    .mb-md { margin-bottom: var(--spacing-md); }

    .diagnostics-list { display: flex; flex-direction: column; gap: var(--spacing-md); }

    .diagnostic-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--spacing-md);
      background: var(--bg-ternary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      transition: background 0.2s;
    }
    .diagnostic-item:hover { background: var(--component-bg-hover); }

    .item-left { display: flex; gap: var(--spacing-md); }

    .status-icon-box {
      width: 2.5rem; height: 2.5rem;
      border-radius: var(--ui-border-radius);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    
    /* Dynamic Icon Colors */
    .diagnostic-item.healthy .status-icon-box { background: var(--color-success-bg); color: var(--color-success); }
    .diagnostic-item.warning .status-icon-box { background: var(--color-warning-bg); color: var(--color-warning); }
    .diagnostic-item.error .status-icon-box { background: var(--color-error-bg); color: var(--color-error); }

    .check-name { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); margin: 0 0 2px 0; }
    .check-detail { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }

    .status-badge {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      color: #000; /* Contrast against colored badge */
    }
    .diagnostic-item.healthy .status-badge { background: var(--color-success); color: var(--color-success-dark); }
    .diagnostic-item.warning .status-badge { background: var(--color-warning); color: var(--text-primary); }
    .diagnostic-item.error .status-badge { background: var(--color-error); color: #fff; }

    /* ROADMAP CARD */
    .roadmap-card {
      padding: var(--spacing-xl);
      border: 1px dashed var(--accent-secondary);
      background: var(--accent-focus); /* Low opacity accent bg */
      border-radius: var(--ui-border-radius-xl);
    }

    .roadmap-header { display: flex; items-align: center; gap: var(--spacing-sm); }
    .roadmap-icon { color: var(--accent-primary); }
    .roadmap-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary); margin: 0; }

    .roadmap-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }
    
    .roadmap-item {
      display: flex; align-items: center; gap: var(--spacing-md);
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      cursor: default;
      transition: border-color 0.2s;
    }
    .roadmap-item:hover { border-color: var(--accent-secondary); }

    .rec-arrow { font-size: 10px; color: var(--accent-primary); }
    .rec-text { font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.4; margin: 0; }

    /* LOADER */
    .loader-container {
      height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }
    .loader-text {
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `]
})
export class SystemDataHealthComponent implements OnInit {
  healthData = signal<any>(null);
  meta = signal<any>(null);
  loading = signal<boolean>(true);

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getDataHealth().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.healthData.set(res.data);
          this.meta.set(res.meta);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getHealthyCount(): number {
    const checks = this.healthData()?.checks || [];
    return checks.filter((c: any) => c.status === 'healthy').length;
  }

  // Returns CSS Class for styling (success, warning, error)
  getScoreClass(): string {
    const score = this.healthData()?.score || 0;
    if (score >= 90) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  }

  getScoreStatus(): string {
    const score = this.healthData()?.score || 0;
    if (score >= 90) return 'Optimized';
    if (score >= 50) return 'Attention Needed';
    return 'Critical Failure';
  }
}