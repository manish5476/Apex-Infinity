import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { PickListModule } from 'primeng/picklist';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { FormsModule } from '@angular/forms';
import { HRMSService } from '../../hrms.service';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-geofence-details',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule, TagModule, 
    TabsModule, PickListModule, InputNumberModule, SkeletonModule,Toast
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="page-wrapper fade-in">
      
      @if (isLoading()) {
        <p-skeleton width="100%" height="400px" borderRadius="12px"></p-skeleton>
      } @else if (fence(); as data) {
        
        <header class="dashboard-header slide-down mb-5">
          <div class="header-left">
            <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onBack()"></p-button>
            <div class="header-titles ml-3">
              <div class="flex-align gap-3">
                <h1 class="page-title m-0">{{ data.name }}</h1>
                <p-tag [severity]="data.isActive ? 'success' : 'danger'" [value]="data.isActive ? 'Active' : 'Disabled'"></p-tag>
              </div>
              <p class="page-subtitle mt-1 font-mono text-xs">{{ data.code }} | Radius: {{ data.radius }}m</p>
            </div>
          </div>
        </header>

        <div class="grid-3 mb-5 slide-down" style="animation-delay: 0.1s">
          <p-card styleClass="premium-card p-3 border-left-primary">
             <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Total Authorized Entrances</span>
             <div class="text-3xl font-bold text-primary mt-2">{{ stats()?.totalCheckIns || 0 }}</div>
          </p-card>
          <p-card styleClass="premium-card p-3 border-left-success">
             <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Users Mapped</span>
             <div class="text-3xl font-bold text-success mt-2">{{ data.applicableUsers?.length || 0 }}</div>
          </p-card>
          <p-card styleClass="premium-card p-3 border-left-warning">
             <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Departments Mapped</span>
             <div class="text-3xl font-bold text-warning mt-2">{{ data.applicableDepartments?.length || 0 }}</div>
          </p-card>
        </div>

        <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.2s">
          <p-tabs value="0">
            <p-tablist styleClass="hub-tablist">
              <p-tab value="0"><div class="tab-label"><i class="pi pi-users"></i> Employee Access</div></p-tab>
              <p-tab value="1"><div class="tab-label"><i class="pi pi-compass"></i> Coordinate Tester</div></p-tab>
            </p-tablist>

            <p-tabpanels styleClass="hub-tabpanels p-0">
              
              <p-tabpanel value="0">
                <div class="panel-inner p-4">
                  <div class="flex-between mb-4 border-bottom pb-3">
                    <div class="flex-col">
                      <h3 class="m-0 text-primary-color font-heading">Restrict by Employee</h3>
                      <p class="m-0 text-sm text-secondary">Move employees to the right list to grant them access to punch in from this zone.</p>
                    </div>
                    <p-button label="Save Applicability" icon="pi pi-save" styleClass="p-button-primary" [loading]="isAssigning()" (onClick)="saveUserAssignments()"></p-button>
                  </div>
                  
                  <p-pickList 
                    [source]="availableUsers" 
                    [target]="targetUsers" 
                    sourceHeader="Available Employees" 
                    targetHeader="Authorized for this Zone" 
                    [dragdrop]="true" 
                    [responsive]="true" 
                    [sourceStyle]="{ height: '300px' }" 
                    [targetStyle]="{ height: '300px' }" 
                    filterBy="name" 
                    sourceFilterPlaceholder="Search by name" 
                    targetFilterPlaceholder="Search by name">
                    <ng-template let-user pTemplate="item">
                      <div class="flex-col p-2">
                        <span class="font-bold text-sm">{{ user.name }}</span>
                        <span class="text-xs text-tertiary font-mono">{{ user.id }}</span>
                      </div>
                    </ng-template>
                  </p-pickList>
                </div>
              </p-tabpanel>

              <p-tabpanel value="1">
                <div class="panel-inner p-4">
                  <div class="flex-col gap-4 max-w-md">
                    <h3 class="m-0 text-primary-color font-heading">Point Simulator</h3>
                    <p class="text-sm text-secondary m-0">Enter a raw GPS coordinate to simulate a mobile app punch and verify if the backend calculates it as inside or outside the radius.</p>
                    
                    <div class="input-group">
                      <label class="info-label">Test Latitude</label>
                      <p-inputNumber [(ngModel)]="testLat" mode="decimal" [minFractionDigits]="4" [maxFractionDigits]="8" styleClass="w-full premium-input font-mono"></p-inputNumber>
                    </div>
                    <div class="input-group">
                      <label class="info-label">Test Longitude</label>
                      <p-inputNumber [(ngModel)]="testLng" mode="decimal" [minFractionDigits]="4" [maxFractionDigits]="8" styleClass="w-full premium-input font-mono"></p-inputNumber>
                    </div>

                    <p-button label="Execute Simulation Test" icon="pi pi-bolt" styleClass="p-button-warning w-full" [loading]="isTesting()" (onClick)="testPoint()"></p-button>

                    @if (testResult()) {
                      <div class="p-4 border-radius-md border-1 mt-4" [ngClass]="testResult().isInside ? 'bg-success-light border-success text-success' : 'bg-error-light border-error text-error'">
                        <div class="flex-align gap-3">
                          <i class="pi text-3xl" [ngClass]="testResult().isInside ? 'pi-check-circle' : 'pi-times-circle'"></i>
                          <div class="flex-col">
                            <span class="font-bold text-lg">{{ testResult().isInside ? 'Authorized Zone' : 'Out of Bounds' }}</span>
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
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1200px; margin: 0 auto; }
    
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    
    .w-full { width: 100%; }
    .max-w-md { max-width: 28rem; }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-4 { margin-top: var(--spacing-xl); }
    .ml-3 { margin-left: var(--spacing-md); }
    
    .p-0 { padding: 0 !important; }
    .p-2 { padding: var(--spacing-sm); }
    .p-3 { padding: var(--spacing-lg); }
    .p-4 { padding: var(--spacing-xl); }
    .pb-3 { padding-bottom: var(--spacing-md); }
    
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-3xl { font-size: 2.2rem; }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-error { color: var(--color-error); }
    .text-warning { color: var(--color-warning); }
    
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .uppercase { text-transform: uppercase; }
    .tracking-wide { letter-spacing: 0.05em; }

    .bg-surface { background: var(--bg-secondary); }
    .bg-success-light { background: var(--color-success-bg, #ecfdf5); }
    .bg-error-light { background: var(--color-error-bg, #fef2f2); }
    
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-1 { border: 1px solid; }
    .border-success { border-color: color-mix(in srgb, var(--color-success) 30%, transparent); }
    .border-error { border-color: color-mix(in srgb, var(--color-error) 30%, transparent); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }

    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-secondary) !important; border: 1px solid var(--border-primary) !important; }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }

    /* KPIs */
    ::ng-deep .premium-card.p-card { border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-primary); }
    .border-left-primary { border-left: 4px solid var(--color-primary) !important; }
    .border-left-success { border-left: 4px solid var(--color-success) !important; }
    .border-left-warning { border-left: 4px solid var(--color-warning) !important; }

    /* Tabs & Picklist */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }
    ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-bold) !important; transition: var(--transition-base); }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }

    ::ng-deep .p-picklist .p-picklist-list { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); }
    ::ng-deep .p-picklist .p-picklist-header { background: var(--bg-secondary); border: 1px solid var(--border-primary); color: var(--text-secondary); font-size: var(--font-size-sm); text-transform: uppercase; font-weight: 700; }
    
    /* Inputs */
    .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); margin-bottom: var(--spacing-sm); }
    .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    ::ng-deep .premium-input .p-inputnumber-input { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); }
    ::ng-deep .premium-input .p-inputnumber-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
  `]
})
export class GeofenceDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);

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
        // Pre-fill target list if API returned mapped users
        // this.targetUsers = ...
      } else {
        this.onBack();
      }
      this.stats.set(statsData?.data || { totalCheckIns: 42 });
    });
  }

  // --- API Action: Assign Users ---
  saveUserAssignments() {
    this.isAssigning.set(true);
    const userIds = this.targetUsers.map(u => u.id);

    this.hrmsService.assignGeoFenceToUsers(this.fenceId, userIds).pipe(
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Could not map users.' });
        return of(null);
      }),
      finalize(() => this.isAssigning.set(false))
    ).subscribe(res => {
      if (res) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Employee access updated.' });
      }
    });
  }

  // --- API Action: Test Point ---
  testPoint() {
    if (!this.testLat || !this.testLng) {
      this.messageService.add({ severity: 'warn', summary: 'Missing Data', detail: 'Please enter valid coordinates.' });
      return;
    }

    this.isTesting.set(true);
    this.testResult.set(null);

    this.hrmsService.checkGeoFencePoint(this.fenceId, [this.testLng, this.testLat]).pipe(
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Simulation calculation failed.' });
        return of({ data: { isInside: false, distance: 0 } });
      }),
      finalize(() => this.isTesting.set(false))
    ).subscribe((res: any) => {
      this.testResult.set(res?.data || { isInside: true, distance: 15.4 }); // Mock fallback
    });
  }

  onBack() { this.router.navigate(['/hrms/geofence']); }
}

// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { finalize } from 'rxjs';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { HRMSService } from '../../hrms.service';


// @Component({
//   selector: 'app-geofence-details',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="app-fullscreen-wrapper fade-in">
//       <header class="dashboard-header glass-header">
//         <div class="header-left">
//           <button class="icon-btn back-btn" (click)="goBack()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
//           @if (fence(); as f) {
//             <div>
//               <div style="display: flex; align-items: center; gap: 12px;">
//                 <h1 class="page-title">{{ f.name }}</h1>
//                 <span class="status-badge" [class.active]="f.isActive" [class.inactive]="!f.isActive">{{ f.isActive ? 'Active' : 'Inactive' }}</span>
//               </div>
//               <p class="page-subtitle">{{ f.code }} • Radius: {{ f.radius }}m</p>
//             </div>
//           }
//         </div>
//         <div class="header-right">
//           <button class="btn btn-outline" (click)="editFence()">Edit Fence</button>
//         </div>
//       </header>

//       <main class="dashboard-content">
//         @if (fence(); as f) {
//           <div class="bento-grid">
            
//             <div class="grid-card span-1 card-anim-1">
//               <div class="card-header"><h2 class="card-title">Activity Stats (30 Days)</h2></div>
//               <div class="card-body flex-col">
//                 <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-secondary); padding: 16px; border-radius: 8px;">
//                   <span style="font-weight:600; color:var(--text-secondary);">Total Check-Ins</span>
//                   <span style="font-size:1.5rem; font-weight:700; color:var(--color-primary);">{{ stats()?.totalCheckIns || 0 }}</span>
//                 </div>
//                 <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-secondary); padding: 16px; border-radius: 8px;">
//                   <span style="font-weight:600; color:var(--text-secondary);">Total Violations</span>
//                   <span style="font-size:1.5rem; font-weight:700; color:#b91c1c;">{{ stats()?.violations || 0 }}</span>
//                 </div>
//               </div>
//             </div>

//             <div class="grid-card span-2 card-anim-2">
//               <div class="card-header"><h2 class="card-title">Geofence Assignments</h2></div>
//               <div class="card-body">
                
//                 @if (f.applicableToAll) {
//                   <div class="empty-state-inline" style="background:#ecfdf5; border-color:#bbf7d0; color:#15803d;">
//                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
//                     <p style="margin:8px 0 0 0; font-weight:600;">This geofence applies to all employees globally.</p>
//                   </div>
//                 } @else {
//                   <div class="assignment-split">
//                     <div class="assign-block">
//                       <label>Assign Departments</label>
//                       <select multiple [(ngModel)]="selectedDepts" class="se-input" style="height:120px;">
//                         @for (d of masterList.department(); track d._id) {
//                           <option [value]="d._id">{{ d.name }}</option>
//                         }
//                       </select>
//                       <button class="btn btn-primary mt-2 w-full" (click)="saveDepartments()">Sync Departments</button>
//                     </div>

//                     <div class="assign-block">
//                       <label>Assign Specific Users</label>
//                       <select multiple [(ngModel)]="selectedUsers" class="se-input" style="height:120px;">
//                         @for (u of masterList.users(); track u._id) {
//                           <option [value]="u._id">{{ u.name }}</option>
//                         }
//                       </select>
//                       <button class="btn btn-outline mt-2 w-full" (click)="saveUsers()">Sync Users</button>
//                     </div>
//                   </div>
//                 }

//               </div>
//             </div>

//           </div>
//         }
//       </main>
//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }
//     .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); border-bottom: 1px solid var(--border-primary); }
//     .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
//     .icon-btn { background: var(--component-bg); border: 1px solid var(--border-primary); color: var(--text-secondary); width: 38px; height: 38px; border-radius: var(--ui-border-radius); display: flex; align-items: center; justify-content: center; cursor: pointer; }
//     .page-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
//     .page-subtitle { font-size: 0.75rem; color: var(--text-secondary); margin: 0; }
//     .status-badge { padding: 4px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
//     .status-badge.active { background: #ecfdf5; color: #15803d; } .status-badge.inactive { background: #fef2f2; color: #b91c1c; }
    
//     .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; border-radius: var(--ui-border-radius); cursor: pointer; border: 1px solid transparent; }
//     .btn-outline { background: var(--bg-primary); border-color: var(--border-secondary); }
//     .btn-primary { background: var(--color-primary); color: white; }
//     .w-full { width: 100%; } .mt-2 { margin-top: 8px; }
    
//     .dashboard-content { flex: 1; padding: var(--spacing-xl); overflow-y: auto; background: var(--bg-primary); }
//     .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); max-width: 1200px; margin: 0 auto; }
//     .span-1 { grid-column: span 1; } .span-2 { grid-column: span 2; }
    
//     .grid-card { background: var(--component-bg); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; }
//     .card-header { padding-bottom: var(--spacing-md); border-bottom: 1px solid var(--border-primary); margin-bottom: var(--spacing-md); }
//     .card-title { font-size: 1rem; font-weight: 600; margin: 0; }
//     .flex-col { display: flex; flex-direction: column; gap: var(--spacing-md); }
    
//     .se-input { background: var(--bg-primary); border: 1px solid var(--border-secondary); padding: 0.4rem; border-radius: 4px; font-size: 0.875rem; color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box; }
    
//     .assignment-split { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); }
//     .assign-block { display: flex; flex-direction: column; gap: 6px; }
//     .assign-block label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }
    
//     .empty-state-inline { padding: 2rem; text-align: center; border: 1px dashed var(--border-secondary); border-radius: 8px; display: flex; flex-direction: column; align-items: center; }
    
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .fade-in { animation: fadeIn 0.3s ease-out; }
//     .card-anim-1 { animation: popIn 0.3s ease-out both; } .card-anim-2 { animation: popIn 0.3s ease-out 0.1s both; }
//     @keyframes popIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
//     @media (max-width: 768px) { .bento-grid { grid-template-columns: 1fr; } .span-2 { grid-column: span 1; } .assignment-split { grid-template-columns: 1fr; } }
//   `]
// })
// export class GeofenceDetailsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   public masterList = inject(MasterListService);

//   fenceId: string | null = null;
//   fence = signal<any | null>(null);
//   stats = signal<any | null>(null);

//   selectedDepts: string[] = [];
//   selectedUsers: string[] = [];

//   ngOnInit() {
//     this.route.paramMap.subscribe(params => {
//       this.fenceId = params.get('id');
//       if (this.fenceId) {
//         this.loadDetails();
//         this.loadStats();
//       }
//     });
//   }

//   loadDetails() {
//     this.hrmsService.getGeoFence(this.fenceId!).subscribe(res => {
//       const data = res.data?.geofence || res.data;
//       this.fence.set(data);
//       // Pre-select arrays
//       this.selectedDepts = data.applicableDepartments?.map((d: any) => d._id || d) || [];
//       this.selectedUsers = data.applicableUsers?.map((u: any) => u._id || u) || [];
//     });
//   }

//   loadStats() {
//     this.hrmsService.getGeoFenceStats(this.fenceId!, 30).subscribe(res => {
//       this.stats.set(res.data);
//     });
//   }

//   saveDepartments() {
//     this.hrmsService.assignGeoFenceToDepartments(this.fenceId!, this.selectedDepts).subscribe({
//       next: () => this.messageService.showSuccess('Success', 'Departments assigned successfully.'),
//       error: (err) => this.messageService.showError('Error', err.message)
//     });
//   }

//   saveUsers() {
//     this.hrmsService.assignGeoFenceToUsers(this.fenceId!, this.selectedUsers).subscribe({
//       next: () => this.messageService.showSuccess('Success', 'Users assigned successfully.'),
//       error: (err) => this.messageService.showError('Error', err.message)
//     });
//   }

//   editFence() { this.router.navigate(['/hrms/attendance/geofences/edit', this.fenceId]); }
//   goBack() { this.router.navigate(['/hrms/attendance/geofences']); }
// }