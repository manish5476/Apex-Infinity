import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { of, catchError, map, finalize, Subject } from 'rxjs';

// Services
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-designation-details',
  standalone: true,
  imports: [CommonModule, DecimalPipe, CardModule, SkeletonModule, TagModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper fade-in">
      
      @if (isLoading()) {
        <div class="header-skeleton mb-5">
          <div class="flex-align gap-4">
            <p-skeleton shape="circle" size="4rem"></p-skeleton>
            <div class="flex-col gap-2">
              <p-skeleton width="18rem" height="2.5rem"></p-skeleton>
              <p-skeleton width="10rem" height="1.2rem"></p-skeleton>
            </div>
          </div>
          <p-skeleton width="10rem" height="3rem"></p-skeleton>
        </div>
        
        <div class="bento-grid">
          <div class="span-2"><p-skeleton height="16rem" borderRadius="16px"></p-skeleton></div>
          <div><p-skeleton height="16rem" borderRadius="16px"></p-skeleton></div>
          <div class="span-2"><p-skeleton height="20rem" borderRadius="16px"></p-skeleton></div>
          <div><p-skeleton height="20rem" borderRadius="16px"></p-skeleton></div>
        </div>
      }

      @if (designation(); as desig) {
        
        <header class="dashboard-header slide-down mb-4">
          <div class="header-left">
            <button class="icon-btn" (click)="goBack()" pTooltip="Back to Designations" tooltipPosition="bottom">
              <i class="pi pi-arrow-left"></i>
            </button>
            
            <div class="header-titles">
              <div class="title-row">
                <div class="icon-brand"><i class="pi pi-id-card"></i></div>
                <h1 class="page-title">{{ desig.title }}</h1>
                <p-tag 
                  [severity]="desig.isActive ? 'success' : 'danger'" 
                  [value]="desig.isActive ? 'Active' : 'Inactive'"
                  [rounded]="true"
                  styleClass="status-badge ml-3">
                </p-tag>
              </div>
              <div class="subtitle-row mt-1">
                <span class="badge-mono">{{ desig.code }}</span>
                <span class="text-tertiary px-3">•</span>
                <span class="text-secondary font-medium">Family: {{ desig.jobFamily || 'Unspecified' }}</span>
              </div>
            </div>
          </div>
          
          <div class="header-right flex-align gap-3">
            <button type="button" class="btn-outline" (click)="goBack()">Close</button>
            <button type="button" class="btn-primary" (click)="editDesignation()">
              <i class="pi pi-pencil"></i> Edit Role
            </button>
          </div>
        </header>

        <main class="dashboard-content">
          <div class="bento-grid">
            
            <p-card styleClass="grid-card span-2 card-anim-1">
              <ng-template pTemplate="header">
                <div class="card-header-custom">
                  <i class="pi pi-info-circle text-primary"></i>
                  <h2>Role Overview</h2>
                </div>
              </ng-template>
              
              <div class="flex-col h-full">
                <div class="mb-4">
                  <span class="data-label mb-2 block">Description</span>
                  <p class="description-text">{{ desig.description || 'No detailed description has been provided for this role yet.' }}</p>
                </div>

                <div class="data-grid-3 mt-auto">
                  <div class="data-box">
                    <span class="data-label">Job Code</span>
                    <span class="data-value font-mono">{{ desig.code }}</span>
                  </div>
                  <div class="data-box">
                    <span class="data-label">Job Family</span>
                    <span class="data-value">{{ desig.jobFamily || 'N/A' }}</span>
                  </div>
                  <div class="data-box">
                    <span class="data-label">Experience Required</span>
                    <span class="data-value">{{ desig.experienceRequired ? desig.experienceRequired + ' Years' : 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </p-card>

            <p-card styleClass="grid-card card-anim-2">
              <ng-template pTemplate="header">
                <div class="card-header-custom">
                  <i class="pi pi-sitemap text-primary"></i>
                  <h2>Hierarchy</h2>
                </div>
              </ng-template>
              
              <div class="flex-col gap-4">
                <div class="data-grid-2">
                  <div class="data-box bg-primary-light border-primary-light">
                    <span class="data-label text-primary">Level</span>
                    <span class="data-value text-primary font-bold text-lg">Lvl {{ desig.level || 0 }}</span>
                  </div>
                  <div class="data-box">
                    <span class="data-label">Grade</span>
                    <span class="data-value font-bold text-lg">{{ desig.grade || '-' }}</span>
                  </div>
                </div>

                <div class="divider"></div>

                <div class="data-box bg-transparent p-0">
                  <span class="data-label">Career Path (Next Role)</span>
                  <span class="data-value color-primary font-bold mt-1">
                    {{ desig.nextDesignation?.title || desig.nextDesignation || 'Top Level / Unspecified' }}
                  </span>
                </div>
                <div class="data-box bg-transparent p-0">
                  <span class="data-label">Promotion Eligibility</span>
                  <span class="data-value mt-1">{{ desig.promotionAfterYears ? desig.promotionAfterYears + ' Years' : 'N/A' }}</span>
                </div>
              </div>
            </p-card>

            <p-card styleClass="grid-card span-2 card-anim-3">
              <ng-template pTemplate="header">
                <div class="card-header-custom">
                  <i class="pi pi-list-check text-primary"></i>
                  <h2>Role Requirements</h2>
                </div>
              </ng-template>
              
              <div class="inner-grid-2 gap-4">
                <div class="list-wrapper">
                  <span class="data-label mb-3 block">Key Responsibilities</span>
                  @if (desig.responsibilities && desig.responsibilities.length > 0) {
                    <ul class="styled-list">
                      @for (item of desig.responsibilities; track item) {
                        <li>{{ item }}</li>
                      }
                    </ul>
                  } @else {
                    <div class="empty-list-state">
                      <i class="pi pi-clipboard"></i>
                      <p>No responsibilities listed.</p>
                    </div>
                  }
                </div>

                <div class="list-wrapper border-left-mobile">
                  <span class="data-label mb-3 block">Qualifications</span>
                  @if (desig.qualifications && desig.qualifications.length > 0) {
                    <ul class="styled-list">
                      @for (item of desig.qualifications; track item) {
                        <li>{{ item }}</li>
                      }
                    </ul>
                  } @else {
                    <div class="empty-list-state">
                      <i class="pi pi-verified"></i>
                      <p>No qualifications listed.</p>
                    </div>
                  }
                </div>
              </div>
            </p-card>

            <p-card styleClass="grid-card card-anim-4">
              <ng-template pTemplate="header">
                <div class="card-header-custom">
                  <i class="pi pi-wallet text-primary"></i>
                  <h2>Attributes & Comp</h2>
                </div>
              </ng-template>
              
              <div class="flex-col gap-4">
                <div class="data-box">
                  <span class="data-label">Salary Band ({{ desig.salaryBand?.currency || 'INR' }})</span>
                  @if (desig.salaryBand?.min || desig.salaryBand?.max) {
                    <span class="data-value font-mono mt-1 text-lg">
                      {{ desig.salaryBand.min | number }} - {{ desig.salaryBand.max | number }}
                    </span>
                  } @else {
                    <span class="data-value mt-1 text-tertiary">Not configured</span>
                  }
                </div>

                <div class="divider"></div>

                <div class="data-box bg-transparent p-0">
                  <span class="data-label mb-2 block">System Attributes</span>
                  <div class="tags-container">
                    @if (desig.metadata?.isManager) { <span class="tag tag-blue">Managerial Role</span> }
                    @if (desig.metadata?.isExecutive) { <span class="tag tag-purple">Executive Level</span> }
                    @if (desig.metadata?.requiresApproval) { <span class="tag tag-orange">Requires Approval</span> }
                    
                    @if (!desig.metadata?.isManager && !desig.metadata?.isExecutive && !desig.metadata?.requiresApproval) {
                      <span class="tag tag-gray">Standard Role</span>
                    }
                  </div>
                </div>

                <div class="divider"></div>
                
                <div class="data-box bg-transparent p-0">
                  <span class="data-label mb-2 block">Reports To</span>
                  @if (desig.reportsTo && desig.reportsTo.length > 0) {
                    <div class="tags-container">
                      @for (report of desig.reportsTo; track report) {
                        <span class="tag tag-gray"><i class="pi pi-user mr-1"></i> {{ report.title || report }}</span>
                      }
                    </div>
                  } @else {
                    <span class="data-value text-tertiary">No direct reporting lines mapped.</span>
                  }
                </div>
              </div>
            </p-card>

          </div>
        </main>
      }
    </div>
  `,
  styles: [`
    /* --------------------------------------------------------------------------
       GLOBAL & UTILITIES
       -------------------------------------------------------------------------- */
    :host {
      display: block; width: 100%; min-height: 100vh;
      background-color: var(--bg-primary); color: var(--text-primary);
      font-family: var(--font-body);
    }

    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1600px; margin: 0 auto; }

    .flex-col { display: flex; flex-direction: column; }
    .flex-align { display: flex; align-items: center; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .h-full { height: 100%; }
    .block { display: block; }
    
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .mb-2 { margin-bottom: var(--spacing-sm); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-lg); }
    .mb-5 { margin-bottom: var(--spacing-xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-4 { margin-top: var(--spacing-lg); }
    .mt-auto { margin-top: auto; }
    .mr-1 { margin-right: 4px; }
    
    .p-0 { padding: 0 !important; }
    .px-3 { padding-left: var(--spacing-md); padding-right: var(--spacing-md); }
    .ml-3 { margin-left: var(--spacing-md); }

    .text-sm { font-size: var(--font-size-sm); }
    .text-lg { font-size: 16px; }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary { color: var(--color-primary); }
    .font-medium { font-weight: 500; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: var(--font-mono); }

    .bg-surface { background: var(--bg-secondary); }
    .bg-transparent { background: transparent !important; }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .border-primary-light { border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important; }
    
    .divider { height: 1px; background: var(--border-secondary); width: 100%; margin: var(--spacing-sm) 0; }

    /* --------------------------------------------------------------------------
       BUTTONS & HEADER
       -------------------------------------------------------------------------- */
    .icon-btn {
      width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--border-secondary);
      background: var(--bg-primary); color: var(--text-secondary); cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 16px;
      transition: all 0.2s ease;
    }
    .icon-btn:hover { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--text-tertiary); }

    .btn-primary {
      height: 40px; padding: 0 20px; border-radius: 8px; border: none;
      background: var(--color-primary); color: white; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 8px; font-size: 14px; transition: all 0.2s;
    }
    .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: var(--shadow-sm); }

    .btn-outline {
      height: 40px; padding: 0 20px; border-radius: 8px; border: 1px solid var(--border-secondary);
      background: var(--bg-primary); color: var(--text-primary); font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 8px; font-size: 14px; transition: all 0.2s;
    }
    .btn-outline:hover { background: var(--bg-secondary); }

    .dashboard-header {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--bg-primary); padding: var(--spacing-xl) var(--spacing-2xl);
      border-radius: 16px; border: 1px solid var(--border-secondary);
      box-shadow: var(--shadow-sm); margin-bottom: var(--spacing-2xl);
    }
    .header-skeleton {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--bg-primary); padding: var(--spacing-2xl);
      border-radius: 16px; border: 1px solid var(--border-secondary);
    }

    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .title-row { display: flex; align-items: center; gap: var(--spacing-md); }
    .icon-brand {
      width: 44px; height: 44px; border-radius: 12px; background: var(--color-primary-bg);
      color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 20px;
    }
    .page-title { font-size: 24px; font-weight: 800; margin: 0; color: var(--text-primary); letter-spacing: -0.5px; }
    
    ::ng-deep .status-badge .p-tag { padding: 4px 12px; font-size: 12px; letter-spacing: 0.5px; font-weight: 700; }

    /* --------------------------------------------------------------------------
       BENTO GRID & PRIME-NG CARD OVERRIDES
       -------------------------------------------------------------------------- */
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-2xl); align-items: stretch; }
    .span-2 { grid-column: span 2; }
    
    ::ng-deep .grid-card .p-card {
      height: 100%; border-radius: 16px; box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-secondary); background: var(--bg-primary); 
      display: flex; flex-direction: column; transition: all 0.2s ease; overflow: hidden;
    }
    ::ng-deep .grid-card .p-card:hover {
      box-shadow: var(--shadow-md); border-color: var(--color-primary-light, var(--border-primary)); transform: translateY(-2px);
    }
    
    /* Injecting our Custom Header styling into PrimeNG's header template */
    ::ng-deep .grid-card .p-card-header { padding: 0; }
    .card-header-custom {
      padding: var(--spacing-xl) var(--spacing-2xl); background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-secondary); display: flex; align-items: center; gap: 12px;
    }
    .card-header-custom h2 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary); }
    .card-header-custom i { font-size: 18px; }

    /* Forcing the body and content to fill space naturally */
    ::ng-deep .grid-card .p-card-body { padding: var(--spacing-2xl); flex: 1; display: flex; flex-direction: column; }
    ::ng-deep .grid-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; }

    /* --------------------------------------------------------------------------
       DATA DISPLAY COMPONENTS
       -------------------------------------------------------------------------- */
    .data-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-lg); }
    .data-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); }
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }

    .data-box {
      background: var(--bg-secondary); padding: var(--spacing-md) var(--spacing-lg);
      border-radius: 12px; border: 1px solid var(--border-secondary);
      display: flex; flex-direction: column; gap: 4px;
    }
    .data-label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
    .data-value { font-size: 14px; font-weight: 600; color: var(--text-primary); word-break: break-word; }

    .description-text { font-size: 14px; line-height: 1.6; color: var(--text-secondary); margin: 0; }

    .badge-mono {
      font-family: var(--font-mono); font-size: 12px; background: var(--bg-secondary);
      padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-secondary);
      display: inline-block; width: max-content; color: var(--text-secondary); font-weight: 600;
    }

    /* Tags */
    .tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid transparent; letter-spacing: 0.5px; text-transform: uppercase; }
    
    .tag-blue { background: color-mix(in srgb, var(--theme-info, #3b82f6) 10%, transparent); color: var(--theme-info, #3b82f6); border-color: color-mix(in srgb, var(--theme-info) 25%, transparent); }
    .tag-purple { background: color-mix(in srgb, #8b5cf6 10%, transparent); color: #8b5cf6; border-color: color-mix(in srgb, #8b5cf6 25%, transparent); }
    .tag-orange { background: color-mix(in srgb, var(--theme-warning, #f59e0b) 10%, transparent); color: var(--theme-warning, #f59e0b); border-color: color-mix(in srgb, var(--theme-warning) 25%, transparent); }
    .tag-gray { background: var(--bg-secondary); color: var(--text-secondary); border-color: var(--border-secondary); }

    /* Lists */
    .styled-list { margin: 0; padding-left: 20px; color: var(--text-primary); font-size: 14px; line-height: 1.6; }
    .styled-list li { margin-bottom: 8px; }
    .styled-list li::marker { color: var(--color-primary); }
    
    .empty-list-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: var(--bg-secondary); border-radius: 12px; border: 1px dashed var(--border-secondary); color: var(--text-tertiary); text-align: center; }
    .empty-list-state i { font-size: 24px; margin-bottom: 8px; }
    .empty-list-state p { margin: 0; font-size: 13px; }

    /* --------------------------------------------------------------------------
       ANIMATIONS
       -------------------------------------------------------------------------- */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
    .fade-in { animation: fadeIn 0.4s ease; }
    .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .card-anim-1 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.1s both; }
    .card-anim-2 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.15s both; }
    .card-anim-3 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.2s both; }
    .card-anim-4 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.25s both; }

    /* Responsive */
    @media (min-width: 769px) {
      .border-left-mobile { border-left: 1px solid var(--border-secondary); padding-left: var(--spacing-xl); }
    }
    @media (max-width: 1200px) {
      .bento-grid { grid-template-columns: repeat(2, 1fr); }
      .span-2 { grid-column: span 2; }
      .data-grid-3 { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 768px) { 
      .page-wrapper { padding: var(--spacing-lg); }
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-lg); }
      .header-right { justify-content: flex-end; }
      .bento-grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
      .data-grid-2, .data-grid-3, .inner-grid-2 { grid-template-columns: 1fr; }
      .border-left-mobile { border-top: 1px solid var(--border-secondary); padding-top: var(--spacing-lg); margin-top: var(--spacing-sm); }
    }
    .card-header-custom {
      padding: var(--spacing-xl) var(--spacing-2xl); 
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-secondary); 
      display: flex; 
      align-items: center; 
      gap: 12px;
      
      /* 👉 ADD THESE TO CURVE THE TOP EDGES */
      border-top-left-radius: var(--ui-border-radius-xl);
      border-top-right-radius: var(--ui-border-radius-xl);
    }
  `]
})
export class DesignationDetailsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  designation = signal<any | null>(null);
  isLoading = signal(true);
  desigId: string | null = null;

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.desigId = params.get('id');
      if (this.desigId) {
        this.loadDesignationDetails();
      } else {
        this.isLoading.set(false);
        this.messageService.showError('Invalid designation ID.');
        this.goBack();
      }
    });
  }

  private loadDesignationDetails() {
    this.isLoading.set(true);
    
    this.hrmsService.getDesignation(this.desigId!).pipe(
      map((res: any) => res?.data?.designation || res?.data || res),
      catchError(err => {
        this.messageService.handleHttpError(err);
        return of(null);
      }),
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe(data => {
      this.designation.set(data || null);
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

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule, DecimalPipe } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { of, catchError, map, finalize } from 'rxjs';

// // Services
// import { AppMessageService } from '../../../../core/services/message.service';
// import { HRMSService } from '../../hrms.service';

// // PrimeNG
// import { SkeletonModule } from 'primeng/skeleton';
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';

// @Component({
//   selector: 'app-designation-details',
//   standalone: true,
//   imports: [CommonModule, DecimalPipe, SkeletonModule, TagModule, TooltipModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="page-wrapper fade-in">
      
//       @if (isLoading()) {
//         <div class="header-skeleton mb-5">
//           <div class="flex-align gap-4">
//             <p-skeleton shape="circle" size="4rem"></p-skeleton>
//             <div class="flex-col gap-2">
//               <p-skeleton width="18rem" height="2.5rem"></p-skeleton>
//               <p-skeleton width="10rem" height="1.2rem"></p-skeleton>
//             </div>
//           </div>
//           <p-skeleton width="10rem" height="3rem"></p-skeleton>
//         </div>
        
//         <div class="bento-grid">
//           <div class="span-2"><p-skeleton height="16rem" borderRadius="16px"></p-skeleton></div>
//           <div><p-skeleton height="16rem" borderRadius="16px"></p-skeleton></div>
//           <div class="span-2"><p-skeleton height="20rem" borderRadius="16px"></p-skeleton></div>
//           <div><p-skeleton height="20rem" borderRadius="16px"></p-skeleton></div>
//         </div>
//       }

//       @if (designation(); as desig) {
        
//         <header class="dashboard-header slide-down mb-4">
//           <div class="header-left">
//             <button class="icon-btn" (click)="goBack()" pTooltip="Back to Designations" tooltipPosition="bottom">
//               <i class="pi pi-arrow-left"></i>
//             </button>
            
//             <div class="header-titles">
//               <div class="title-row">
//                 <div class="icon-brand"><i class="pi pi-id-card"></i></div>
//                 <h1 class="page-title">{{ desig.title }}</h1>
//                 <p-tag 
//                   [severity]="desig.isActive ? 'success' : 'danger'" 
//                   [value]="desig.isActive ? 'Active' : 'Inactive'"
//                   [rounded]="true"
//                   styleClass="status-badge ml-3">
//                 </p-tag>
//               </div>
//               <div class="subtitle-row mt-1">
//                 <span class="badge-mono">{{ desig.code }}</span>
//                 <span class="text-tertiary px-3">•</span>
//                 <span class="text-secondary font-medium">Family: {{ desig.jobFamily || 'Unspecified' }}</span>
//               </div>
//             </div>
//           </div>
          
//           <div class="header-right flex-align gap-3">
//             <button type="button" class="btn-outline" (click)="goBack()">Close</button>
//             <button type="button" class="btn-primary" (click)="editDesignation()">
//               <i class="pi pi-pencil"></i> Edit Role
//             </button>
//           </div>
//         </header>

//         <main class="dashboard-content">
//           <div class="bento-grid">
            
//             <section class="content-section span-2 card-anim-1">
//               <div class="section-header">
//                 <i class="pi pi-info-circle text-primary"></i>
//                 <h2>Role Overview</h2>
//               </div>
//               <div class="section-body flex-col h-full">
//                 <div class="mb-4">
//                   <span class="data-label mb-2 block">Description</span>
//                   <p class="description-text">{{ desig.description || 'No detailed description has been provided for this role yet.' }}</p>
//                 </div>

//                 <div class="data-grid-3 mt-auto">
//                   <div class="data-box">
//                     <span class="data-label">Job Code</span>
//                     <span class="data-value font-mono">{{ desig.code }}</span>
//                   </div>
//                   <div class="data-box">
//                     <span class="data-label">Job Family</span>
//                     <span class="data-value">{{ desig.jobFamily || 'N/A' }}</span>
//                   </div>
//                   <div class="data-box">
//                     <span class="data-label">Experience Required</span>
//                     <span class="data-value">{{ desig.experienceRequired ? desig.experienceRequired + ' Years' : 'N/A' }}</span>
//                   </div>
//                 </div>
//               </div>
//             </section>

//             <section class="content-section card-anim-2">
//               <div class="section-header">
//                 <i class="pi pi-sitemap text-primary"></i>
//                 <h2>Hierarchy</h2>
//               </div>
//               <div class="section-body flex-col gap-4">
//                 <div class="data-grid-2">
//                   <div class="data-box bg-primary-light border-primary-light">
//                     <span class="data-label text-primary">Level</span>
//                     <span class="data-value text-primary font-bold text-lg">Lvl {{ desig.level || 0 }}</span>
//                   </div>
//                   <div class="data-box">
//                     <span class="data-label">Grade</span>
//                     <span class="data-value font-bold text-lg">{{ desig.grade || '-' }}</span>
//                   </div>
//                 </div>

//                 <div class="divider"></div>

//                 <div class="data-box bg-transparent p-0">
//                   <span class="data-label">Career Path (Next Role)</span>
//                   <span class="data-value color-primary font-bold mt-1">
//                     {{ desig.nextDesignation?.title || desig.nextDesignation || 'Top Level / Unspecified' }}
//                   </span>
//                 </div>
//                 <div class="data-box bg-transparent p-0">
//                   <span class="data-label">Promotion Eligibility</span>
//                   <span class="data-value mt-1">{{ desig.promotionAfterYears ? desig.promotionAfterYears + ' Years' : 'N/A' }}</span>
//                 </div>
//               </div>
//             </section>

//             <section class="content-section span-2 card-anim-3">
//               <div class="section-header">
//                 <i class="pi pi-list-check text-primary"></i>
//                 <h2>Role Requirements</h2>
//               </div>
//               <div class="section-body inner-grid-2 gap-4">
                
//                 <div class="list-wrapper">
//                   <span class="data-label mb-3 block">Key Responsibilities</span>
//                   @if (desig.responsibilities && desig.responsibilities.length > 0) {
//                     <ul class="styled-list">
//                       @for (item of desig.responsibilities; track item) {
//                         <li>{{ item }}</li>
//                       }
//                     </ul>
//                   } @else {
//                     <div class="empty-list-state">
//                       <i class="pi pi-clipboard"></i>
//                       <p>No responsibilities listed.</p>
//                     </div>
//                   }
//                 </div>

//                 <div class="list-wrapper border-left-mobile">
//                   <span class="data-label mb-3 block">Qualifications</span>
//                   @if (desig.qualifications && desig.qualifications.length > 0) {
//                     <ul class="styled-list">
//                       @for (item of desig.qualifications; track item) {
//                         <li>{{ item }}</li>
//                       }
//                     </ul>
//                   } @else {
//                     <div class="empty-list-state">
//                       <i class="pi pi-verified"></i>
//                       <p>No qualifications listed.</p>
//                     </div>
//                   }
//                 </div>

//               </div>
//             </section>

//             <section class="content-section card-anim-4">
//               <div class="section-header">
//                 <i class="pi pi-wallet text-primary"></i>
//                 <h2>Attributes & Comp</h2>
//               </div>
//               <div class="section-body flex-col gap-4">
                
//                 <div class="data-box">
//                   <span class="data-label">Salary Band ({{ desig.salaryBand?.currency || 'INR' }})</span>
//                   @if (desig.salaryBand?.min || desig.salaryBand?.max) {
//                     <span class="data-value font-mono mt-1 text-lg">
//                       {{ desig.salaryBand.min | number }} - {{ desig.salaryBand.max | number }}
//                     </span>
//                   } @else {
//                     <span class="data-value mt-1 text-tertiary">Not configured</span>
//                   }
//                 </div>

//                 <div class="divider"></div>

//                 <div class="data-box bg-transparent p-0">
//                   <span class="data-label mb-2 block">System Attributes</span>
//                   <div class="tags-container">
//                     @if (desig.metadata?.isManager) { <span class="tag tag-blue">Managerial Role</span> }
//                     @if (desig.metadata?.isExecutive) { <span class="tag tag-purple">Executive Level</span> }
//                     @if (desig.metadata?.requiresApproval) { <span class="tag tag-orange">Requires Approval</span> }
                    
//                     @if (!desig.metadata?.isManager && !desig.metadata?.isExecutive && !desig.metadata?.requiresApproval) {
//                       <span class="tag tag-gray">Standard Role</span>
//                     }
//                   </div>
//                 </div>

//                 <div class="divider"></div>
                
//                 <div class="data-box bg-transparent p-0">
//                   <span class="data-label mb-2 block">Reports To</span>
//                   @if (desig.reportsTo && desig.reportsTo.length > 0) {
//                     <div class="tags-container">
//                       @for (report of desig.reportsTo; track report) {
//                         <span class="tag tag-gray"><i class="pi pi-user mr-1"></i> {{ report.title || report }}</span>
//                       }
//                     </div>
//                   } @else {
//                     <span class="data-value text-tertiary">No direct reporting lines mapped.</span>
//                   }
//                 </div>

//               </div>
//             </section>

//           </div>
//         </main>
//       }
//     </div>
//   `,
//   styles: [`
//     /* --------------------------------------------------------------------------
//        GLOBAL & UTILITIES
//        -------------------------------------------------------------------------- */
//     :host {
//       display: block; width: 100%; min-height: 100vh;
//       background-color: var(--bg-primary); color: var(--text-primary);
//       font-family: var(--font-body);
//     }

//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1600px; margin: 0 auto; }

//     .flex-col { display: flex; flex-direction: column; }
//     .flex-align { display: flex; align-items: center; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .h-full { height: 100%; }
//     .block { display: block; }
    
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
//     .gap-4 { gap: var(--spacing-lg); }
    
//     .mb-2 { margin-bottom: var(--spacing-sm); }
//     .mb-3 { margin-bottom: var(--spacing-md); }
//     .mb-4 { margin-bottom: var(--spacing-lg); }
//     .mb-5 { margin-bottom: var(--spacing-xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-4 { margin-top: var(--spacing-lg); }
//     .mt-auto { margin-top: auto; }
//     .mr-1 { margin-right: 4px; }
    
//     .p-0 { padding: 0 !important; }
//     .px-3 { padding-left: var(--spacing-md); padding-right: var(--spacing-md); }
//     .ml-3 { margin-left: var(--spacing-md); }

//     .text-sm { font-size: var(--font-size-sm); }
//     .text-lg { font-size: 16px; }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary { color: var(--color-primary); }
//     .font-medium { font-weight: 500; }
//     .font-bold { font-weight: 700; }
//     .font-mono { font-family: var(--font-mono); }

//     .bg-surface { background: var(--bg-secondary); }
//     .bg-transparent { background: transparent !important; }
//     .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
//     .border-primary-light { border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important; }
    
//     .divider { height: 1px; background: var(--border-secondary); width: 100%; margin: var(--spacing-sm) 0; }

//     /* --------------------------------------------------------------------------
//        BUTTONS & HEADER
//        -------------------------------------------------------------------------- */
//     .icon-btn {
//       width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--border-secondary);
//       background: var(--bg-primary); color: var(--text-secondary); cursor: pointer;
//       display: flex; align-items: center; justify-content: center; font-size: 16px;
//       transition: all 0.2s ease;
//     }
//     .icon-btn:hover { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--text-tertiary); }

//     .btn-primary {
//       height: 40px; padding: 0 20px; border-radius: 8px; border: none;
//       background: var(--color-primary); color: white; font-weight: 600; cursor: pointer;
//       display: flex; align-items: center; gap: 8px; font-size: 14px; transition: all 0.2s;
//     }
//     .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }

//     .btn-outline {
//       height: 40px; padding: 0 20px; border-radius: 8px; border: 1px solid var(--border-secondary);
//       background: var(--bg-primary); color: var(--text-primary); font-weight: 600; cursor: pointer;
//       display: flex; align-items: center; gap: 8px; font-size: 14px; transition: all 0.2s;
//     }
//     .btn-outline:hover { background: var(--bg-secondary); }

//     .dashboard-header {
//       display: flex; justify-content: space-between; align-items: center;
//       background: var(--bg-primary); padding: var(--spacing-xl) var(--spacing-2xl);
//       border-radius: 16px; border: 1px solid var(--border-secondary);
//       box-shadow: var(--shadow-sm); margin-bottom: var(--spacing-2xl);
//     }
//     .header-skeleton {
//       display: flex; justify-content: space-between; align-items: center;
//       background: var(--bg-primary); padding: var(--spacing-2xl);
//       border-radius: 16px; border: 1px solid var(--border-secondary);
//     }

//     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
//     .title-row { display: flex; align-items: center; gap: var(--spacing-md); }
//     .icon-brand {
//       width: 44px; height: 44px; border-radius: 12px; background: var(--color-primary-bg);
//       color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 20px;
//     }
//     .page-title { font-size: 24px; font-weight: 800; margin: 0; color: var(--text-primary); letter-spacing: -0.5px; }
    
//     ::ng-deep .status-badge .p-tag { padding: 4px 12px; font-size: 12px; letter-spacing: 0.5px; font-weight: 700; }

//     /* --------------------------------------------------------------------------
//        BENTO GRID & SECTIONS
//        -------------------------------------------------------------------------- */
//     .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-2xl); align-items: stretch; }
//     .span-2 { grid-column: span 2; }
    
//     .content-section {
//       background: var(--bg-primary); border: 1px solid var(--border-secondary);
//       border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-sm);
//       display: flex; flex-direction: column;
//     }

//     .section-header {
//       padding: var(--spacing-xl) var(--spacing-2xl); background: var(--bg-secondary);
//       border-bottom: 1px solid var(--border-secondary); display: flex; align-items: center; gap: 12px;
//     }
//     .section-header h2 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary); }
//     .section-header i { font-size: 18px; }

//     .section-body { padding: var(--spacing-2xl); flex: 1; }

//     /* --------------------------------------------------------------------------
//        DATA DISPLAY COMPONENTS
//        -------------------------------------------------------------------------- */
//     .data-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); }
//     .data-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-lg); }
//     .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }

//     .data-box {
//       background: var(--bg-secondary); padding: var(--spacing-md) var(--spacing-lg);
//       border-radius: 12px; border: 1px solid var(--border-secondary);
//       display: flex; flex-direction: column; gap: 4px;
//     }
//     .data-label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
//     .data-value { font-size: 14px; font-weight: 600; color: var(--text-primary); word-break: break-word; }

//     .description-text { font-size: 14px; line-height: 1.6; color: var(--text-secondary); margin: 0; }

//     .badge-mono {
//       font-family: var(--font-mono); font-size: 12px; background: var(--bg-secondary);
//       padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-secondary);
//       display: inline-block; width: max-content; color: var(--text-secondary); font-weight: 600;
//     }

//     /* Tags */
//     .tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
//     .tag { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid transparent; letter-spacing: 0.5px; text-transform: uppercase; }
    
//     .tag-blue { background: color-mix(in srgb, var(--theme-info, #3b82f6) 10%, transparent); color: var(--theme-info, #3b82f6); border-color: color-mix(in srgb, var(--theme-info) 25%, transparent); }
//     .tag-purple { background: color-mix(in srgb, #8b5cf6 10%, transparent); color: #8b5cf6; border-color: color-mix(in srgb, #8b5cf6 25%, transparent); }
//     .tag-orange { background: color-mix(in srgb, var(--theme-warning, #f59e0b) 10%, transparent); color: var(--theme-warning, #f59e0b); border-color: color-mix(in srgb, var(--theme-warning) 25%, transparent); }
//     .tag-gray { background: var(--bg-secondary); color: var(--text-secondary); border-color: var(--border-secondary); }

//     /* Lists */
//     .styled-list { margin: 0; padding-left: 20px; color: var(--text-primary); font-size: 14px; line-height: 1.6; }
//     .styled-list li { margin-bottom: 8px; }
//     .styled-list li::marker { color: var(--color-primary); }
    
//     .empty-list-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: var(--bg-secondary); border-radius: 12px; border: 1px dashed var(--border-secondary); color: var(--text-tertiary); text-align: center; }
//     .empty-list-state i { font-size: 24px; margin-bottom: 8px; }
//     .empty-list-state p { margin: 0; font-size: 13px; }

//     /* --------------------------------------------------------------------------
//        ANIMATIONS
//        -------------------------------------------------------------------------- */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
//     .fade-in { animation: fadeIn 0.4s ease; }
//     .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .card-anim-1 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.1s both; }
//     .card-anim-2 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.15s both; }
//     .card-anim-3 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.2s both; }
//     .card-anim-4 { animation: popIn 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) 0.25s both; }

//     /* Responsive */
//     @media (min-width: 769px) {
//       .border-left-mobile { border-left: 1px solid var(--border-secondary); padding-left: var(--spacing-xl); }
//     }
//     @media (max-width: 1200px) {
//       .bento-grid { grid-template-columns: repeat(2, 1fr); }
//       .span-2 { grid-column: span 2; }
//       .data-grid-3 { grid-template-columns: 1fr 1fr; }
//     }
//     @media (max-width: 768px) { 
//       .page-wrapper { padding: var(--spacing-lg); }
//       .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-lg); }
//       .header-right { justify-content: flex-end; }
//       .bento-grid { grid-template-columns: 1fr; }
//       .span-2 { grid-column: span 1; }
//       .data-grid-2, .data-grid-3, .inner-grid-2 { grid-template-columns: 1fr; }
//       .border-left-mobile { border-top: 1px solid var(--border-secondary); padding-top: var(--spacing-lg); margin-top: var(--spacing-sm); }
//     }
//   `]
// })
// export class DesignationDetailsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   designation = signal<any | null>(null);
//   isLoading = signal(true);
//   desigId: string | null = null;

//   ngOnInit() {
//     this.route.paramMap.subscribe(params => {
//       this.desigId = params.get('id');
//       if (this.desigId) {
//         this.loadDesignationDetails();
//       } else {
//         this.isLoading.set(false);
//         this.messageService.showError('Invalid designation ID.');
//         this.goBack();
//       }
//     });
//   }

//   private loadDesignationDetails() {
//     this.isLoading.set(true);
    
//     this.hrmsService.getDesignation(this.desigId!).pipe(
//       map((res: any) => res?.data?.designation || res?.data || res),
//       catchError(err => {
//         this.messageService.handleHttpError(err);
//         return of(null);
//       }),
//       finalize(() => this.isLoading.set(false))
//     ).subscribe(data => {
//       this.designation.set(data || null);
//     });
//   }

//   editDesignation() {
//     if (this.desigId) {
//       this.router.navigate(['/hrms/designation/edit', this.desigId]);
//     }
//   }

//   goBack() {
//     this.router.navigate(['/hrms/designation/list']);
//   }
// }
// // import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, Router } from '@angular/router';
// // import { of, catchError, map, finalize } from 'rxjs';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { HRMSService } from '../../hrms.service';

// // @Component({
// //   selector: 'app-designation-details',
// //   standalone: true,
// //   imports: [CommonModule],
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   template: `
// //     <div class="app-fullscreen-wrapper fade-in">
      
// //       <header class="dashboard-header glass-header">
// //         <div class="header-left">
// //           <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
// //             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
// //           </button>
          
// //           @if (designation(); as desig) {
// //             <div>
// //               <div style="display: flex; align-items: center; gap: 12px;">
// //                 <h1 class="page-title">{{ desig.title }}</h1>
// //                 <span class="status-badge" [class.active]="desig.isActive" [class.inactive]="!desig.isActive">
// //                   {{ desig.isActive ? 'Active' : 'Inactive' }}
// //                 </span>
// //               </div>
// //               <p class="page-subtitle">{{ desig.code }} • {{ desig.jobFamily || 'Unspecified Family' }}</p>
// //             </div>
// //           } @else if (!isLoading()) {
// //             <div>
// //               <h1 class="page-title">Designation Not Found</h1>
// //             </div>
// //           }
// //         </div>
        
// //         <div class="header-right">
// //           <button type="button" class="btn btn-outline" (click)="goBack()">Close</button>
// //           @if (designation()) {
// //             <button type="button" class="btn btn-primary" (click)="editDesignation()">
// //               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
// //               Edit Role
// //             </button>
// //           }
// //         </div>
// //       </header>

// //       <main class="dashboard-content">
        
// //         @if (isLoading()) {
// //           <div class="loading-state-full">
// //             <div class="spinner"></div>
// //             <p>Loading Designation Details...</p>
// //           </div>
// //         } 
        
// //         @if (designation(); as desig) {
// //           <div class="bento-grid">
            
// //             <div class="grid-card span-2 card-anim-1">
// //               <div class="card-header">
// //                 <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
// //                 <h2 class="card-title">Role Overview</h2>
// //               </div>
// //               <div class="card-body">
// //                 <div class="info-group" style="margin-bottom: var(--spacing-lg);">
// //                   <label>Description</label>
// //                   <p class="detail-text">{{ desig.description || 'No description provided.' }}</p>
// //                 </div>

// //                 <div class="inner-grid-3">
// //                   <div class="info-group">
// //                     <label>Job Code</label>
// //                     <div class="badge-neutral-lg">{{ desig.code }}</div>
// //                   </div>
// //                   <div class="info-group">
// //                     <label>Job Family</label>
// //                     <p class="detail-text bold">{{ desig.jobFamily || 'N/A' }}</p>
// //                   </div>
// //                   <div class="info-group">
// //                     <label>Experience Required</label>
// //                     <p class="detail-text bold">{{ desig.experienceRequired ? desig.experienceRequired + ' Years' : 'N/A' }}</p>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>

// //             <div class="grid-card card-anim-2">
// //               <div class="card-header">
// //                 <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg></div>
// //                 <h2 class="card-title">Hierarchy</h2>
// //               </div>
// //               <div class="card-body flex-col">
// //                 <div class="hierarchy-badges">
// //                   <div class="h-badge level">Level {{ desig.level }}</div>
// //                   <div class="h-badge grade">Grade {{ desig.grade }}</div>
// //                 </div>

// //                 <div class="divider"></div>

// //                 <div class="info-group">
// //                   <label>Career Path (Next Role)</label>
// //                   <p class="detail-text bold color-primary">
// //                     {{ desig.nextDesignation?.title || desig.nextDesignation || 'Top Level / Unspecified' }}
// //                   </p>
// //                 </div>
// //                 <div class="info-group">
// //                   <label>Promotion Eligibility</label>
// //                   <p class="detail-text">{{ desig.promotionAfterYears ? desig.promotionAfterYears + ' Years' : 'N/A' }}</p>
// //                 </div>
// //               </div>
// //             </div>

// //             <div class="grid-card span-2 card-anim-3">
// //               <div class="card-header">
// //                 <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
// //                 <h2 class="card-title">Requirements</h2>
// //               </div>
// //               <div class="card-body inner-grid-2">
                
// //                 <div class="list-section">
// //                   <label>Key Responsibilities</label>
// //                   @if (desig.responsibilities && desig.responsibilities.length > 0) {
// //                     <ul class="styled-list">
// //                       @for (item of desig.responsibilities; track item) {
// //                         <li>{{ item }}</li>
// //                       }
// //                     </ul>
// //                   } @else {
// //                     <p class="empty-text">No responsibilities listed.</p>
// //                   }
// //                 </div>

// //                 <div class="list-section">
// //                   <label>Qualifications</label>
// //                   @if (desig.qualifications && desig.qualifications.length > 0) {
// //                     <ul class="styled-list">
// //                       @for (item of desig.qualifications; track item) {
// //                         <li>{{ item }}</li>
// //                       }
// //                     </ul>
// //                   } @else {
// //                     <p class="empty-text">No qualifications listed.</p>
// //                   }
// //                 </div>

// //               </div>
// //             </div>

// //             <div class="grid-card card-anim-4">
// //               <div class="card-header">
// //                 <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
// //                 <h2 class="card-title">Attributes & Compensation</h2>
// //               </div>
// //               <div class="card-body flex-col">
                
// //                 <div class="info-group">
// //                   <label>Salary Band ({{ desig.salaryBand?.currency || 'INR' }})</label>
// //                   @if (desig.salaryBand?.min || desig.salaryBand?.max) {
// //                     <p class="detail-text bold salary-text">
// //                       {{ desig.salaryBand.min | number }} - {{ desig.salaryBand.max | number }}
// //                     </p>
// //                   } @else {
// //                     <p class="detail-text">Not configured</p>
// //                   }
// //                 </div>

// //                 <div class="divider"></div>

// //                 <div class="tags-container">
// //                   @if (desig.metadata?.isManager) { <span class="tag tag-blue">Managerial Role</span> }
// //                   @if (desig.metadata?.isExecutive) { <span class="tag tag-purple">Executive Level</span> }
// //                   @if (desig.metadata?.requiresApproval) { <span class="tag tag-orange">Requires Approval</span> }
                  
// //                   @if (!desig.metadata?.isManager && !desig.metadata?.isExecutive && !desig.metadata?.requiresApproval) {
// //                     <span class="detail-text">Standard Role Attributes</span>
// //                   }
// //                 </div>

// //                 <div class="divider"></div>
                
// //                 <div class="info-group">
// //                   <label>Reports To</label>
// //                   @if (desig.reportsTo && desig.reportsTo.length > 0) {
// //                     <div class="tags-container mt-1">
// //                       @for (report of desig.reportsTo; track report) {
// //                         <span class="tag tag-gray">{{ report.title || report }}</span>
// //                       }
// //                     </div>
// //                   } @else {
// //                     <p class="detail-text">No direct reporting lines mapped.</p>
// //                   }
// //                 </div>

// //               </div>
// //             </div>

// //           </div>
// //         }
// //       </main>
// //     </div>
// //   `,
// //   styles: [`
// //     /* ==========================================================================
// //        BASE THEME & LAYOUT
// //        ========================================================================== */
// //     :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
// //     .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    
// //     /* Header */
// //     .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
// //     .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
// //     .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
// //     .icon-btn:hover { background: var(--component-surface-raised); color: var(--text-primary); }
    
// //     .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0; line-height: 1.2; }
// //     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 4px 0 0 0; }
    
// //     /* Buttons */
// //     .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-fast); border: var(--ui-border-width) solid transparent; }
// //     .btn-outline { background: var(--component-bg); border-color: var(--border-secondary); color: var(--text-primary); }
// //     .btn-outline:hover { background: var(--component-surface-raised); border-color: var(--border-primary); }
// //     .btn-primary { background: var(--color-primary); color: #ffffff; }
// //     .btn-primary:hover { background: var(--color-primary-dark); }

// //     /* Main Content Grid */
// //     .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); position: relative; }
// //     .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); align-items: start; max-width: 1600px; margin: 0 auto; }
// //     .span-2 { grid-column: span 2; }
    
// //     .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); padding: var(--spacing-lg); display: flex; flex-direction: column; }
// //     .card-header { display: flex; align-items: center; gap: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border-primary); margin-bottom: var(--spacing-md); }
// //     .card-icon { color: var(--color-primary); display: flex; align-items: center; }
// //     .card-title { font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 0; color: var(--text-primary); }
    
// //     .card-body.flex-col { display: flex; flex-direction: column; gap: var(--spacing-md); }
// //     .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
// //     .inner-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); }

// //     /* Detail Typography & Elements */
// //     .info-group { display: flex; flex-direction: column; gap: 6px; }
// //     .info-group label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    
// //     .detail-text { font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; line-height: 1.5; }
// //     .detail-text.bold { font-weight: var(--font-weight-semibold); }
// //     .color-primary { color: var(--color-primary); }
// //     .empty-text { font-size: var(--font-size-sm); color: var(--text-tertiary); font-style: italic; margin: 0; }
    
// //     .salary-text { font-family: var(--font-mono, monospace); font-size: 1rem; color: var(--text-primary); }
// //     .divider { height: 1px; background: var(--border-primary); margin: var(--spacing-xs) 0; }
// //     .mt-1 { margin-top: 4px; }

// //     /* Badges & Tags */
// //     .status-badge { display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.5px; }
// //     .status-badge.active { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); }
// //     .status-badge.inactive { background: color-mix(in srgb, var(--text-tertiary) 15%, transparent); color: var(--text-tertiary); }
    
// //     .badge-neutral-lg { display: inline-flex; align-items: center; justify-content: center; background: var(--bg-secondary); color: var(--text-primary); padding: 4px 12px; border-radius: 6px; font-family: var(--font-mono, monospace); font-size: var(--font-size-sm); border: 1px solid var(--border-secondary); width: fit-content; }

// //     .hierarchy-badges { display: flex; gap: var(--spacing-sm); }
// //     .h-badge { padding: 6px 12px; border-radius: 6px; font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); border: 1px solid; }
// //     .h-badge.level { background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary); border-color: color-mix(in srgb, var(--color-primary) 20%, transparent); }
// //     .h-badge.grade { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--border-secondary); }

// //     .tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
// //     .tag { padding: 4px 10px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-semibold); border: 1px solid transparent; }
// //     .tag-blue { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
// //     .tag-purple { background: #faf5ff; color: #7e22ce; border-color: #e9d5ff; }
// //     .tag-orange { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
// //     .tag-gray { background: var(--bg-secondary); color: var(--text-secondary); border-color: var(--border-secondary); }

// //     /* Lists */
// //     .list-section { display: flex; flex-direction: column; gap: 8px; }
// //     .styled-list { margin: 0; padding-left: 20px; color: var(--text-primary); font-size: var(--font-size-sm); line-height: 1.6; }
// //     .styled-list li { margin-bottom: 6px; }
// //     .styled-list li::marker { color: var(--color-primary); }

// //     /* Loading State */
// //     .loading-state-full { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-primary); gap: 12px; color: var(--text-secondary); z-index: 10; font-size: var(--font-size-sm); }
    
// //     @keyframes spin { to { transform: rotate(360deg); } }
// //     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// //     @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
// //     .fade-in { animation: fadeIn 0.3s ease-out; }
// //     .card-anim-1 { animation: popIn 0.4s ease-out 0.05s both; } 
// //     .card-anim-2 { animation: popIn 0.4s ease-out 0.1s both; } 
// //     .card-anim-3 { animation: popIn 0.4s ease-out 0.15s both; } 
// //     .card-anim-4 { animation: popIn 0.4s ease-out 0.2s both; }
    
// //     /* Responsive Grid */
// //     @media (max-width: 1024px) {
// //       .bento-grid { grid-template-columns: repeat(2, 1fr); }
// //       .span-2 { grid-column: span 2; }
// //     }
// //     @media (max-width: 768px) {
// //       .bento-grid { grid-template-columns: 1fr; }
// //       .span-2 { grid-column: span 1; }
// //       .inner-grid-2, .inner-grid-3 { grid-template-columns: 1fr; }
// //       .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-md); }
// //       .header-right { justify-content: flex-end; }
// //     }
// //   `]
// // })
// // export class DesignationDetailsComponent implements OnInit {
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private hrmsService = inject(HRMSService);
// //   private messageService = inject(AppMessageService);

// //   // Using signals for reactive state
// //   designation = signal<any | null>(null);
// //   isLoading = signal(true);
// //   desigId: string | null = null;

// //   ngOnInit() {
// //     this.route.paramMap.subscribe(params => {
// //       this.desigId = params.get('id');
// //       if (this.desigId) {
// //         this.loadDesignationDetails();
// //       } else {
// //         this.isLoading.set(false);
// //         this.messageService.showError('Invalid designation ID.');
// //         this.goBack();
// //       }
// //     });
// //   }

// //   private loadDesignationDetails() {
// //     this.isLoading.set(true);
    
// //     this.hrmsService.getDesignation(this.desigId!).pipe(
// //       map((res: any) => res?.data?.designation || res?.data || res),
// //       catchError(err => {
// //         this.messageService.handleHttpError(err)
// //         return of(null);
// //       }),
// //       finalize(() => this.isLoading.set(false))
// //     ).subscribe(data => {
// //       if (data) {
// //         this.designation.set(data);
// //       } else {
// //         // Fallback if data is null after catchError
// //         this.designation.set(null);
// //       }
// //     });
// //   }

// //   editDesignation() {
// //     if (this.desigId) {
// //       this.router.navigate(['/hrms/designation/edit', this.desigId]);
// //     }
// //   }

// //   goBack() {
// //     this.router.navigate(['/hrms/designation/list']);
// //   }
// // }