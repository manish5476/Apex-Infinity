import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Services
import { MessageService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { PickListModule } from 'primeng/picklist';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-geofence-details',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    CardModule, 
    ButtonModule, 
    TagModule, 
    TabsModule, 
    PickListModule, 
    InputNumberModule, 
    SkeletonModule,
    ToastModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="page-container fade-in">
      
      @if (isLoading()) {
        <div class="flex-col gap-xl">
          <p-skeleton width="100%" height="100px" borderRadius="16px"></p-skeleton>
          <div class="grid-3">
            <p-skeleton height="120px" borderRadius="16px"></p-skeleton>
            <p-skeleton height="120px" borderRadius="16px"></p-skeleton>
            <p-skeleton height="120px" borderRadius="16px"></p-skeleton>
          </div>
          <p-skeleton width="100%" height="400px" borderRadius="16px"></p-skeleton>
        </div>
      } @else if (fence(); as data) {
        
        <header class="page-header flex-between flex-wrap gap-md mb-4xl slide-down">
          <div class="flex align-items-center gap-xl">
            <p-button 
              icon="pi pi-arrow-left" 
              [text]="true" 
              [rounded]="true" 
              size="large" 
              severity="secondary" 
              (onClick)="onBack()">
            </p-button>
            <div class="header-titles flex-col gap-xs">
              <div class="flex align-items-center gap-md">
                <h1 class="title font-heading text-3xl font-bold text-primary m-0 line-height-tight">{{ data.name }}</h1>
                <p-tag [severity]="data.isActive ? 'success' : 'danger'" [value]="data.isActive ? 'Active' : 'Disabled'"></p-tag>
              </div>
              <p class="subtitle text-secondary font-mono text-sm m-0">{{ data.code }} | Radius: {{ data.radius }}m</p>
            </div>
          </div>
        </header>

        <div class="grid-3 mb-4xl slide-down" style="animation-delay: 0.1s">
          <div class="kpi-card glass-inset p-xl border-radius-lg manish-border-1 border-solid border-secondary border-left-primary">
             <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Total Authorized Entrances</span>
             <div class="text-4xl font-heading font-bold text-primary mt-sm line-height-none">{{ stats()?.totalCheckIns || 0 }}</div>
          </div>
          <div class="kpi-card glass-inset p-xl border-radius-lg manish-border-1 border-solid border-secondary border-left-success">
             <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Users Mapped</span>
             <div class="text-4xl font-heading font-bold text-success mt-sm line-height-none">{{ data.applicableUsers?.length || 0 }}</div>
          </div>
          <div class="kpi-card glass-inset p-xl border-radius-lg manish-border-1 border-solid border-secondary border-left-warning">
             <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Departments Mapped</span>
             <div class="text-4xl font-heading font-bold color-warning mt-sm line-height-none">{{ data.applicableDepartments?.length || 0 }}</div>
          </div>
        </div>

        <p-card styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden p-0 slide-down" styleClass="animation-delay: 0.2s">
          <p-tabs value="0">
            <p-tablist>
              <p-tab value="0">
                <div class="flex align-items-center gap-sm font-medium px-md py-sm">
                  <i class="pi pi-users"></i> Employee Access
                </div>
              </p-tab>
              <p-tab value="1">
                <div class="flex align-items-center gap-sm font-medium px-md py-sm">
                  <i class="pi pi-compass"></i> Coordinate Tester
                </div>
              </p-tab>
            </p-tablist>

            <p-tabpanels styleClass="p-0">
              
              <p-tabpanel value="0">
                <div class="panel-content p-xl flex-col h-full">
                  <div class="flex-between flex-wrap gap-md mb-xl border-bottom-subtle pb-md">
                    <div class="flex-col gap-xs">
                      <h3 class="m-0 text-primary font-heading text-xl font-bold">Restrict by Employee</h3>
                      <p class="m-0 text-sm text-secondary">Move employees to the right list to grant them access to punch in from this zone.</p>
                    </div>
                    <p-button label="Save Applicability" icon="pi pi-save" styleClass="p-button-primary" [loading]="isAssigning()" (onClick)="saveUserAssignments()"></p-button>
                  </div>
                  
                  <div class="picklist-wrapper border-radius-lg overflow-hidden manish-border-1 border-solid border-secondary">
                    <p-pickList 
                      [source]="availableUsers" 
                      [target]="targetUsers" 
                      sourceHeader="Available Employees" 
                      targetHeader="Authorized for this Zone" 
                      [dragdrop]="true" 
                      [responsive]="true" 
                      [sourceStyle]="{ height: '400px' }" 
                      [targetStyle]="{ height: '400px' }" 
                      filterBy="name" 
                      sourceFilterPlaceholder="Search by name" 
                      targetFilterPlaceholder="Search by name"
                      styleClass="w-full">
                      <ng-template let-user pTemplate="item">
                        <div class="flex-col p-sm border-bottom-subtle">
                          <span class="font-bold text-sm text-primary">{{ user.name }}</span>
                          <span class="text-xs text-tertiary font-mono mt-1">{{ user.id }}</span>
                        </div>
                      </ng-template>
                    </p-pickList>
                  </div>
                </div>
              </p-tabpanel>

              <p-tabpanel value="1">
                <div class="panel-content p-xl bg-secondary h-full">
                  <div class="flex-col gap-xl max-w-md">
                    
                    <div class="flex-col gap-xs">
                      <h3 class="m-0 text-primary font-heading text-xl font-bold">Point Simulator</h3>
                      <p class="text-sm text-secondary m-0 line-height-relaxed">Enter a raw GPS coordinate to simulate a mobile app punch and verify if the backend calculates it as inside or outside the radius.</p>
                    </div>
                    
                    <div class="glass-inset p-xl border-radius-lg manish-border-1 border-solid border-secondary flex-col gap-md">
                      <div class="input-group flex-col gap-xs">
                        <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Test Latitude</label>
                        <p-inputNumber 
                          [(ngModel)]="testLat" 
                          mode="decimal" 
                          [minFractionDigits]="4" 
                          [maxFractionDigits]="8" 
                          styleClass="w-full"
                          inputStyleClass="w-full bg-primary border-secondary border-radius-md px-md py-sm font-mono text-primary transition-colors">
                        </p-inputNumber>
                      </div>
                      
                      <div class="input-group flex-col gap-xs">
                        <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Test Longitude</label>
                        <p-inputNumber 
                          [(ngModel)]="testLng" 
                          mode="decimal" 
                          [minFractionDigits]="4" 
                          [maxFractionDigits]="8" 
                          styleClass="w-full"
                          inputStyleClass="w-full bg-primary border-secondary border-radius-md px-md py-sm font-mono text-primary transition-colors">
                        </p-inputNumber>
                      </div>

                      <p-button label="Execute Simulation Test" icon="pi pi-bolt" severity="warn" styleClass="w-full mt-sm" [loading]="isTesting()" (onClick)="testPoint()"></p-button>
                    </div>

                    @if (testResult()) {
                      <div class="p-xl border-radius-lg manish-border-1 border-solid slide-down" 
                           [ngClass]="testResult().isInside ? 'bg-success-light border-success text-success' : 'bg-error-light border-error text-error'">
                        <div class="flex align-items-center gap-md">
                          <i class="pi text-4xl" [ngClass]="testResult().isInside ? 'pi-check-circle' : 'pi-times-circle'"></i>
                          <div class="flex-col gap-xs">
                            <span class="font-heading font-bold text-xl line-height-none">{{ testResult().isInside ? 'Authorized Zone' : 'Out of Bounds' }}</span>
                            <span class="text-sm font-medium">Distance from center: {{ testResult().distance | number:'1.0-1' }} meters</span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </p-card>
      }
    </div>
  `,
  styles: [`
    /* ==========================================================================
       BASE & LAYOUT UTILITIES
       ========================================================================== */
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); min-height: 100vh; background-color: var(--bg-secondary); }
    
    .page-container { max-width: 1400px; margin: 0 auto; padding: var(--spacing-2xl) var(--spacing-xl); }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .align-items-center { align-items: center; }
    .flex-wrap { display: flex; flex-wrap: wrap; }
    
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-xl); }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .max-w-md { max-width: 32rem; }

    /* Spacing */
    .m-0 { margin: 0 !important; }
    .p-0 { padding: 0 !important; }
    .mb-xs { margin-bottom: var(--spacing-xs); }
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-xl { margin-bottom: var(--spacing-xl); }
    .mb-4xl { margin-bottom: var(--spacing-4xl); }
    .mt-1 { margin-top: 4px; }
    .mt-sm { margin-top: var(--spacing-sm); }
    
    .p-sm { padding: var(--spacing-sm); }
    .p-md { padding: var(--spacing-md); }
    .p-xl { padding: var(--spacing-xl); }
    .px-md { padding-left: var(--spacing-md); padding-right: var(--spacing-md); }
    .py-sm { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
    .pb-md { padding-bottom: var(--spacing-md); }
    
    .gap-xs { gap: var(--spacing-xs); }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-md { gap: var(--spacing-md); }
    .gap-xl { gap: var(--spacing-xl); }

    /* Typography & Colors */
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    
    .text-xs { font-size: var(--font-size-xs); }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-3xl { font-size: var(--font-size-3xl); }
    .text-4xl { font-size: 2.5rem; }
    
    .uppercase { text-transform: uppercase; }
    .tracking-widest { letter-spacing: 0.05em; }
    .line-height-none { line-height: 1; }
    .line-height-tight { line-height: var(--line-height-tight); }
    .line-height-relaxed { line-height: var(--line-height-relaxed); }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-success { color: var(--color-success, #16a34a); }
    .text-error { color: var(--color-error, #dc2626); }
    .color-warning { color: var(--color-warning, #d97706); }
    
    .bg-primary { background: var(--bg-primary); }
    .bg-secondary { background: var(--bg-secondary); }
    .bg-success-light { background: color-mix(in srgb, var(--color-success) 15%, transparent); }
    .bg-error-light { background: color-mix(in srgb, var(--color-error) 15%, transparent); }

    /* Borders & Glassmorphism */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    .glass-inset { background: color-mix(in srgb, var(--bg-primary) 40%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
    
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .border-radius-xl { border-radius: var(--radius-2xl); }
    
    .border-top-subtle { border-top: 1px solid var(--border-secondary); }
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    .manish-border-1 { border-width: 1px; }
    .border-solid { border-style: solid; }
    .border-primary { border-color: var(--border-primary); }
    .border-secondary { border-color: var(--border-secondary); }
    .border-success { border-color: var(--color-success); }
    .border-error { border-color: var(--color-error); }
    
    .border-left-primary { border-left-width: 4px; border-left-color: var(--color-primary); border-left-style: solid; }
    .border-left-success { border-left-width: 4px; border-left-color: var(--color-success); border-left-style: solid; }
    .border-left-warning { border-left-width: 4px; border-left-color: var(--color-warning); border-left-style: solid; }
    
    .shadow-xl { box-shadow: var(--shadow-xl); }
    .overflow-hidden { overflow: hidden; }

    /* Interactive Inputs (Utilizing inputStyleClass instead of ng-deep) */
    .transition-colors { transition: border-color 0.2s ease, box-shadow 0.2s ease; outline: none; }
    .transition-colors:focus { border-color: var(--color-primary) !important; box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 768px) {
      .page-container { padding: var(--spacing-xl) var(--spacing-md); }
      .page-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-xl); }
    }
  `]
})
export class GeofenceDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  fenceId: string = '';
  fence = signal<any>(null);
  stats = signal<any>(null);
  isLoading = signal(true);

  // Assignments
  isAssigning = signal(false);
  availableUsers: any[] = [{ id: 'usr_1', name: 'John Doe' }, { id: 'usr_2', name: 'Sarah Jenkins' }]; // Mock
  targetUsers: any[] = [];

  // Testing Tool
  isTesting = signal(false);
  testLat: number | null = null;
  testLng: number | null = null;
  testResult = signal<any>(null);

  ngOnInit() {
    this.fenceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.fenceId) {
      this.loadData();
    } else {
      this.onBack();
    }
  }

  loadData() {
    this.isLoading.set(true);
    forkJoin({
      fenceData: this.hrmsService.getGeoFence(this.fenceId).pipe(catchError(() => of(null))),
      statsData: this.hrmsService.getGeoFenceStats(this.fenceId).pipe(catchError(() => of(null)))
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ fenceData, statsData }) => {
      if (fenceData?.data?.geofence) {
        this.fence.set(fenceData.data.geofence);
      } else {
        this.onBack();
      }
      this.stats.set(statsData?.data || { totalCheckIns: 42 });
    });
  }

  saveUserAssignments() {
    this.isAssigning.set(true);
    const userIds = this.targetUsers.map(u => u.id);

    this.hrmsService.assignGeoFenceToUsers(this.fenceId, userIds).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      finalize(() => this.isAssigning.set(false))
    ).subscribe((res:any) => {
      if (res) {
        this.messageService.showSuccess(res.message || 'Users Assigned')
      }
    });
  }

  testPoint() {
    if (!this.testLat || !this.testLng) {
      this.messageService.showWarn('Please enter valid coordinates.');
      return;
    }

    this.isTesting.set(true);
    this.testResult.set(null);

    this.hrmsService.checkGeoFencePoint(this.fenceId, [this.testLng, this.testLat]).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err)
        return of({ data: { isInside: false, distance: 0 } });
      }),
      finalize(() => this.isTesting.set(false))
    ).subscribe((res: any) => {
      this.testResult.set(res?.data || { isInside: true, distance: 15.4 });
    });
  }

  onBack() { 
    this.router.navigate(['/hrms/geofence']); 
  }
}

// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { catchError, finalize, forkJoin, of } from 'rxjs';

// // Services
// import { MessageService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { TabsModule } from 'primeng/tabs';
// import { PickListModule } from 'primeng/picklist';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SkeletonModule } from 'primeng/skeleton';
// import { FormsModule } from '@angular/forms';
// import { HRMSService } from '../../hrms.service';
// import { Toast } from 'primeng/toast';
// import { AppMessageService } from '@core/services/message.service';

// @Component({
//   selector: 'app-geofence-details',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, CardModule, ButtonModule, TagModule, 
//     TabsModule, PickListModule, InputNumberModule, SkeletonModule,Toast
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast position="top-right"></p-toast>

//     <div class="page-wrapper fade-in">
      
//       @if (isLoading()) {
//         <p-skeleton width="100%" height="400px" borderRadius="12px"></p-skeleton>
//       } @else if (fence(); as data) {
        
//         <header class="dashboard-header slide-down mb-5">
//           <div class="header-left">
//             <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onBack()"></p-button>
//             <div class="header-titles ml-3">
//               <div class="flex-align gap-3">
//                 <h1 class="page-title m-0">{{ data.name }}</h1>
//                 <p-tag [severity]="data.isActive ? 'success' : 'danger'" [value]="data.isActive ? 'Active' : 'Disabled'"></p-tag>
//               </div>
//               <p class="page-subtitle mt-1 font-mono text-xs">{{ data.code }} | Radius: {{ data.radius }}m</p>
//             </div>
//           </div>
//         </header>

//         <div class="grid-3 mb-5 slide-down" style="animation-delay: 0.1s">
//           <p-card styleClass="premium-card p-3 border-left-primary">
//              <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Total Authorized Entrances</span>
//              <div class="text-3xl font-bold text-primary mt-2">{{ stats()?.totalCheckIns || 0 }}</div>
//           </p-card>
//           <p-card styleClass="premium-card p-3 border-left-success">
//              <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Users Mapped</span>
//              <div class="text-3xl font-bold text-success mt-2">{{ data.applicableUsers?.length || 0 }}</div>
//           </p-card>
//           <p-card styleClass="premium-card p-3 border-left-warning">
//              <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Departments Mapped</span>
//              <div class="text-3xl font-bold text-warning mt-2">{{ data.applicableDepartments?.length || 0 }}</div>
//           </p-card>
//         </div>

//         <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.2s">
//           <p-tabs value="0">
//             <p-tablist styleClass="hub-tablist">
//               <p-tab value="0"><div class="tab-label"><i class="pi pi-users"></i> Employee Access</div></p-tab>
//               <p-tab value="1"><div class="tab-label"><i class="pi pi-compass"></i> Coordinate Tester</div></p-tab>
//             </p-tablist>

//             <p-tabpanels styleClass="hub-tabpanels p-0">
              
//               <p-tabpanel value="0">
//                 <div class="panel-inner p-4">
//                   <div class="flex-between mb-4 border-bottom pb-3">
//                     <div class="flex-col">
//                       <h3 class="m-0 text-primary-color font-heading">Restrict by Employee</h3>
//                       <p class="m-0 text-sm text-secondary">Move employees to the right list to grant them access to punch in from this zone.</p>
//                     </div>
//                     <p-button label="Save Applicability" icon="pi pi-save" styleClass="p-button-primary" [loading]="isAssigning()" (onClick)="saveUserAssignments()"></p-button>
//                   </div>
                  
//                   <p-pickList 
//                     [source]="availableUsers" 
//                     [target]="targetUsers" 
//                     sourceHeader="Available Employees" 
//                     targetHeader="Authorized for this Zone" 
//                     [dragdrop]="true" 
//                     [responsive]="true" 
//                     [sourceStyle]="{ height: '300px' }" 
//                     [targetStyle]="{ height: '300px' }" 
//                     filterBy="name" 
//                     sourceFilterPlaceholder="Search by name" 
//                     targetFilterPlaceholder="Search by name">
//                     <ng-template let-user pTemplate="item">
//                       <div class="flex-col p-2">
//                         <span class="font-bold text-sm">{{ user.name }}</span>
//                         <span class="text-xs text-tertiary font-mono">{{ user.id }}</span>
//                       </div>
//                     </ng-template>
//                   </p-pickList>
//                 </div>
//               </p-tabpanel>

//               <p-tabpanel value="1">
//                 <div class="panel-inner p-4">
//                   <div class="flex-col gap-4 max-w-md">
//                     <h3 class="m-0 text-primary-color font-heading">Point Simulator</h3>
//                     <p class="text-sm text-secondary m-0">Enter a raw GPS coordinate to simulate a mobile app punch and verify if the backend calculates it as inside or outside the radius.</p>
                    
//                     <div class="input-group">
//                       <label class="info-label">Test Latitude</label>
//                       <p-inputNumber [(ngModel)]="testLat" mode="decimal" [minFractionDigits]="4" [maxFractionDigits]="8" styleClass="w-full premium-input font-mono"></p-inputNumber>
//                     </div>
//                     <div class="input-group">
//                       <label class="info-label">Test Longitude</label>
//                       <p-inputNumber [(ngModel)]="testLng" mode="decimal" [minFractionDigits]="4" [maxFractionDigits]="8" styleClass="w-full premium-input font-mono"></p-inputNumber>
//                     </div>

//                     <p-button label="Execute Simulation Test" icon="pi pi-bolt" styleClass="p-button-warning w-full" [loading]="isTesting()" (onClick)="testPoint()"></p-button>

//                     @if (testResult()) {
//                       <div class="p-4 border-radius-md manish-border-1 mt-4" [ngClass]="testResult().isInside ? 'bg-success-light border-success text-success' : 'bg-error-light border-error text-error'">
//                         <div class="flex-align gap-3">
//                           <i class="pi text-3xl" [ngClass]="testResult().isInside ? 'pi-check-circle' : 'pi-times-circle'"></i>
//                           <div class="flex-col">
//                             <span class="font-bold text-lg">{{ testResult().isInside ? 'Authorized Zone' : 'Out of Bounds' }}</span>
//                             <span class="text-sm font-medium">Distance from center: {{ testResult().distance | number:'1.0-1' }} meters</span>
//                           </div>
//                         </div>
//                       </div>
//                     }
//                   </div>
//                 </div>
//               </p-tabpanel>

//             </p-tabpanels>
//           </p-tabs>
//         </p-card>
//       }
//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1200px; margin: 0 auto; }
    
//     .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); }
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
    
//     .w-full { width: 100%; }
//     .max-w-md { max-width: 28rem; }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
//     .gap-4 { gap: var(--spacing-lg); }
    
//     .m-0 { margin: 0; }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .mb-5 { margin-bottom: var(--spacing-2xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-2 { margin-top: var(--spacing-sm); }
//     .mt-4 { margin-top: var(--spacing-xl); }
//     .ml-3 { margin-left: var(--spacing-md); }
    
//     .p-0 { padding: 0 !important; }
//     .p-2 { padding: var(--spacing-sm); }
//     .p-3 { padding: var(--spacing-lg); }
//     .p-4 { padding: var(--spacing-xl); }
//     .pb-3 { padding-bottom: var(--spacing-md); }
    
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-3xl { font-size: 2.2rem; }
    
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-primary { color: var(--color-primary); }
//     .text-success { color: var(--color-success); }
//     .text-error { color: var(--color-error); }
//     .text-warning { color: var(--color-warning); }
    
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-medium { font-weight: var(--font-weight-medium); }
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .uppercase { text-transform: uppercase; }
//     .tracking-wide { letter-spacing: 0.05em; }

//     .bg-surface { background: var(--bg-secondary); }
//     .bg-success-light { background: var(--color-success-bg, #ecfdf5); }
//     .bg-error-light { background: var(--color-error-bg, #fef2f2); }
    
//     .border-bottom { border-bottom: 1px solid var(--border-primary); }
//     .manish-border-1 { border: 1px solid; }
//     .border-success { border-color: color-mix(in srgb, var(--color-success) 30%, transparent); }
//     .border-error { border-color: color-mix(in srgb, var(--color-error) 30%, transparent); }
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }

//     /* Header */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
//     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
//     ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-secondary) !important; border: 1px solid var(--border-primary) !important; }
//     .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }

//     /* KPIs */
//     ::ng-deep .premium-card.p-card { border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-primary); }
//     .border-left-primary { border-left: 4px solid var(--color-primary) !important; }
//     .border-left-success { border-left: 4px solid var(--color-success) !important; }
//     .border-left-warning { border-left: 4px solid var(--color-warning) !important; }

//     /* Tabs & Picklist */
//     .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
//     ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }
//     ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
//     ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-bold) !important; transition: var(--transition-base); }
//     ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }

//     ::ng-deep .p-picklist .p-picklist-list { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); }
//     ::ng-deep .p-picklist .p-picklist-header { background: var(--bg-secondary); border: 1px solid var(--border-primary); color: var(--text-secondary); font-size: var(--font-size-sm); text-transform: uppercase; font-weight: 700; }
    
//     /* Inputs */
//     .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); margin-bottom: var(--spacing-sm); }
//     .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
//     ::ng-deep .premium-input .p-inputnumber-input { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); }
//     ::ng-deep .premium-input .p-inputnumber-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
//   `]
// })
// export class GeofenceDetailsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   fenceId: string = '';
//   fence = signal<any>(null);
//   stats = signal<any>(null);
//   isLoading = signal(true);

//   // Assignments
//   isAssigning = signal(false);
//   availableUsers: any[] = [{ id: 'usr_1', name: 'John Doe' }, { id: 'usr_2', name: 'Sarah Jenkins' }]; // Mock
//   targetUsers: any[] = [];

//   // Testing Tool
//   isTesting = signal(false);
//   testLat: number | null = null;
//   testLng: number | null = null;
//   testResult = signal<any>(null);

//   ngOnInit() {
//     this.fenceId = this.route.snapshot.paramMap.get('id') || '';
//     if (this.fenceId) {
//       this.loadData();
//     } else {
//       this.onBack();
//     }
//   }

//   loadData() {
//     this.isLoading.set(true);
//     forkJoin({
//       fenceData: this.hrmsService.getGeoFence(this.fenceId).pipe(catchError(() => of(null))),
//       statsData: this.hrmsService.getGeoFenceStats(this.fenceId).pipe(catchError(() => of(null)))
//     }).pipe(
//       finalize(() => this.isLoading.set(false))
//     ).subscribe(({ fenceData, statsData }) => {
//       if (fenceData?.data?.geofence) {
//         this.fence.set(fenceData.data.geofence);
//         // Pre-fill target list if API returned mapped users
//         // this.targetUsers = ...
//       } else {
//         this.onBack();
//       }
//       this.stats.set(statsData?.data || { totalCheckIns: 42 });
//     });
//   }

//   // --- API Action: Assign Users ---
//   saveUserAssignments() {
//     this.isAssigning.set(true);
//     const userIds = this.targetUsers.map(u => u.id);

//     this.hrmsService.assignGeoFenceToUsers(this.fenceId, userIds).pipe(
//       catchError((err) => {
//         this.messageService.handleHttpError(err)
//         return of(null);
//       }),
//       finalize(() => this.isAssigning.set(false))
//     ).subscribe((res:any) => {
//       if (res) {
//         this.messageService.showSuccess(res.message)
//       }
//     });
//   }

//   // --- API Action: Test Point ---
//   testPoint() {
//     if (!this.testLat || !this.testLng) {
//       this.messageService.showWarn( 'Please enter valid coordinates.' );
//       return;
//     }

//     this.isTesting.set(true);
//     this.testResult.set(null);

//     this.hrmsService.checkGeoFencePoint(this.fenceId, [this.testLng, this.testLat]).pipe(
//       catchError((err) => {
//         this.messageService.handleHttpError(err)
//         return of({ data: { isInside: false, distance: 0 } });
//       }),
//       finalize(() => this.isTesting.set(false))
//     ).subscribe((res: any) => {
//       this.testResult.set(res?.data || { isInside: true, distance: 15.4 }); // Mock fallback
//     });
//   }

//   onBack() { this.router.navigate(['/hrms/geofence']); }
// }
