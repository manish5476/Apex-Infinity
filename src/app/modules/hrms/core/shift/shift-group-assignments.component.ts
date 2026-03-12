import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, map } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG Modules
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { DatePicker } from 'primeng/datepicker';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';
import { error } from 'console';

@Component({
  selector: 'app-shift-group-assignments',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    TabsModule, 
    TableModule, 
    CardModule, 
    ButtonModule, 
    DialogModule,
    DatePicker, 
    MultiSelectModule, 
    ToastModule, 
    TagModule,
    SkeletonModule, 
    AvatarModule, 
    TooltipModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="page-container fade-in">
      
      <header class="page-header flex-between flex-wrap gap-md mb-4xl slide-down">
        <div class="flex align-items-center gap-xl">
          <p-button 
            icon="pi pi-arrow-left" 
            [text]="true" 
            severity="secondary"
            size="large"
            (onClick)="onBack()" 
            pTooltip="Back to Groups">
          </p-button>
          
          <div class="header-titles flex-col gap-xs">
            <div class="flex align-items-center gap-md">
              <div class="icon-brand flex-center bg-primary-light text-primary border-radius-md">
                <i class="pi pi-users text-2xl"></i>
              </div>
              <h1 class="title font-heading text-3xl font-bold text-primary m-0">Rotation Assignments</h1>
            </div>
            <p class="subtitle text-secondary text-md m-0 max-w-prose">Manage personnel assigned to this rotation and generate their schedules.</p>
          </div>
        </div>

        <div class="header-actions">
          <p-button 
            label="Assign Personnel" 
            icon="pi pi-user-plus" 
            (onClick)="showAssignDialog()">
          </p-button>
        </div>
      </header>

      <p-card styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden p-0">
        <p-tabs value="0">
          <p-tablist>
            <p-tab value="0">
              <div class="flex align-items-center gap-sm font-medium px-md py-sm">
                <i class="pi pi-list"></i> Active Roster
              </div>
            </p-tab>
            <p-tab value="1">
              <div class="flex align-items-center gap-sm font-medium px-md py-sm">
                <i class="pi pi-calendar-plus"></i> Schedule Generator
              </div>
            </p-tab>
          </p-tablist>

          <p-tabpanels styleClass="p-0">
            
            <p-tabpanel value="0">
              <div class="panel-content p-xl">
                @if (isLoadingAssignments()) {
                  <div class="flex-col gap-md">
                    <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
                    <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
                    <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
                  </div>
                } @else {
                  <p-table 
                    [value]="assignments()" 
                    [paginator]="true" 
                    [rows]="10" 
                    responsiveLayout="scroll"
                    styleClass="p-datatable-sm w-full">
                    
                    <ng-template pTemplate="header">
                      <tr>
                        <th class="font-heading text-xs font-bold uppercase text-tertiary tracking-widest">Employee Details</th>
                        <th class="font-heading text-xs font-bold uppercase text-tertiary tracking-widest">Effective Period</th>
                        <th class="font-heading text-xs font-bold uppercase text-tertiary tracking-widest text-right">Status</th>
                        <th class="font-heading text-xs font-bold uppercase text-tertiary tracking-widest text-center" style="width: 5rem">Actions</th>
                      </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-assignment>
                      <tr>
                        <td>
                          <div class="flex align-items-center gap-md py-xs">
                            <p-avatar [label]="getInitials(assignment.userName)" shape="circle" size="large" styleClass="bg-secondary text-secondary"></p-avatar>
                            <div class="flex-col gap-xs">
                              <span class="font-bold text-primary">{{ assignment.userName }}</span>
                              <span class="badge-mono-sm w-max-content text-tertiary">{{ assignment.userId | slice:0:8 }}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="flex align-items-center gap-sm text-sm text-secondary font-medium">
                            <i class="pi pi-calendar"></i>
                            <span>{{ assignment.startDate | date:'mediumDate' }}</span>
                            <i class="pi pi-arrow-right text-xs text-tertiary"></i>
                            <span [class.text-tertiary]="!assignment.endDate">{{ (assignment.endDate | date:'mediumDate') || 'Ongoing' }}</span>
                          </div>
                        </td>
                        <td class="text-right">
                          <p-tag severity="success" value="Active"></p-tag>
                        </td>
                        <td class="text-center">
                          <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary"></p-button>
                        </td>
                      </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                      <tr>
                        <td colspan="4" class="text-center py-5xl">
                          <div class="flex-col flex-center text-center">
                            <div class="icon-circle-large mb-md flex-center bg-secondary border-secondary border-radius-full">
                              <i class="pi pi-users text-tertiary text-3xl"></i>
                            </div>
                            <h4 class="font-heading text-lg font-bold text-primary m-0 mb-xs">No personnel assigned</h4>
                            <p class="text-secondary m-0">This rotation group currently has no active members.</p>
                          </div>
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                }
              </div>
            </p-tabpanel>

            <p-tabpanel value="1">
              <div class="panel-content bg-secondary p-xl">
                
                <div class="generator-banner mb-4xl slide-down flex align-items-center gap-md">
                  <div class="icon-circle flex-center bg-primary text-white border-radius-md" style="width: 48px; height: 48px;">
                    <i class="pi pi-cog text-xl pi-spin-hover"></i>
                  </div>
                  <div class="flex-col gap-xs">
                    <h3 class="m-0 font-heading text-xl font-bold text-primary">Generate Rotation Schedule</h3>
                    <p class="m-0 text-sm text-secondary">Project the shift group rules into concrete daily schedules for your employees.</p>
                  </div>
                </div>

                <form [formGroup]="generateForm" (ngSubmit)="onGenerate()" class="glass-inset p-xl border-radius-lg mb-4xl">
                  <div class="grid-3">
                    <div class="input-group flex-col gap-xs">
                      <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Generation Start Date <span class="text-error">*</span></label>
                      <p-datepicker formControlName="startDate" [showIcon]="true" placeholder="Select Start" appendTo="body" styleClass="w-full"></p-datepicker>
                    </div>
                    <div class="input-group flex-col gap-xs">
                      <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Generation End Date <span class="text-error">*</span></label>
                      <p-datepicker formControlName="endDate" [showIcon]="true" placeholder="Select End" appendTo="body" styleClass="w-full"></p-datepicker>
                    </div>
                    <div class="input-group flex-col gap-xs">
                      <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Target Employees <span class="text-normal text-xs ml-1">(Optional)</span></label>
                      <p-multiSelect formControlName="userIds" [options]="mockUsers" optionLabel="name" optionValue="id" placeholder="All assigned users" display="chip" appendTo="body" styleClass="w-full"></p-multiSelect>
                    </div>
                  </div>
                  
                  <div class="form-actions mt-xl pt-xl border-top-subtle flex justify-content-end">
                    <p-button label="Generate Concrete Schedule" icon="pi pi-bolt" type="submit" [loading]="isGenerating()" [disabled]="generateForm.invalid"></p-button>
                  </div>
                </form>

                @if (generatedSchedule()) {
                  <div class="generated-results slide-down">
                    <h3 class="font-heading text-lg font-bold text-primary mb-md border-bottom-subtle pb-sm">Schedule Output Preview</h3>
                    
                    <div class="success-banner flex align-items-center gap-sm bg-success-light border-success-subtle border-radius-md p-md mb-xl text-success font-medium">
                      <i class="pi pi-check-circle text-xl"></i>
                      <span>Successfully generated <strong>14</strong> shift instances across <strong>2</strong> users.</span>
                    </div>
                    
                    <div class="mock-timeline flex-col gap-sm">
                      <div class="timeline-item bg-primary-light border-radius-md p-md flex-between border-1 border-solid border-primary">
                        <div class="flex-col gap-xs">
                          <span class="font-bold text-primary">Mukesh Singh</span>
                          <span class="text-xs font-mono text-secondary">12 Oct 2026</span>
                        </div>
                        <p-tag value="Morning Shift"></p-tag>
                      </div>
                      
                      <div class="timeline-item bg-primary border-radius-md p-md flex-between border-1 border-solid border-secondary">
                        <div class="flex-col gap-xs">
                          <span class="font-bold text-primary">Sarah Jenkins</span>
                          <span class="text-xs font-mono text-secondary">12 Oct 2026</span>
                        </div>
                        <p-tag value="Night Shift" severity="warn"></p-tag>
                      </div>
                      
                      <div class="text-center text-sm font-medium text-tertiary mt-md">... Preview limited. View full calendar in Schedule Board.</div>
                    </div>
                  </div>
                }

              </div>
            </p-tabpanel>

          </p-tabpanels>
        </p-tabs>
      </p-card>

    </div>

    <p-dialog 
      header="Assign to Shift Group" 
      [(visible)]="displayAssignDialog" 
      [modal]="true" 
      [style]="{ width: '500px' }"
      [draggable]="false"
      styleClass="glass-panel border-radius-xl">
      
      <p class="text-secondary text-sm line-height-relaxed mb-xl mt-0">Select employees to attach to this rotation pattern. Their shifts will be mapped based on the group's effective dates.</p>
      
      <form [formGroup]="assignForm" (ngSubmit)="onAssignSubmit()" class="flex-col gap-xl">
        <div class="input-group flex-col gap-xs">
          <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Select Employees <span class="text-error">*</span></label>
          <p-multiSelect 
            formControlName="userIds" 
            [options]="mockUsers" 
            optionLabel="name" 
            optionValue="id" 
            placeholder="Choose one or more users" 
            display="chip" 
            [filter]="true"
            appendTo="body"
            styleClass="w-full">
          </p-multiSelect>
        </div>
        
        <div class="grid-2">
          <div class="input-group flex-col gap-xs">
            <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Start Date <span class="text-error">*</span></label>
            <p-datepicker formControlName="startDate" [showIcon]="true" appendTo="body" styleClass="w-full"></p-datepicker>
          </div>
          <div class="input-group flex-col gap-xs">
            <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">End Date (Optional)</label>
            <p-datepicker formControlName="endDate" [showIcon]="true" appendTo="body" styleClass="w-full"></p-datepicker>
          </div>
        </div>
        
        <div class="flex justify-content-end gap-md mt-xl pt-xl border-top-subtle">
          <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="displayAssignDialog = false"></p-button>
          <p-button label="Confirm Assignment" icon="pi pi-check" type="submit" [loading]="isAssigning()" [disabled]="assignForm.invalid"></p-button>
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    /* ==========================================================================
       BASE & LAYOUT UTILITIES
       ========================================================================== */
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); min-height: 100vh; background-color: var(--bg-secondary); }
    
    .page-container { max-width: 1200px; margin: 0 auto; padding: var(--spacing-2xl) var(--spacing-xl); }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .flex-wrap { display: flex; flex-wrap: wrap; }
    .align-items-center { align-items: center; }
    .justify-content-end { justify-content: flex-end; }
    .flex-shrink-0 { flex-shrink: 0; }
    .w-full { width: 100%; }
    .w-max-content { width: max-content; }
    
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-xl); }

    /* Spacing */
    .m-0 { margin: 0; }
    .p-0 { padding: 0; }
    .mb-xs { margin-bottom: var(--spacing-xs); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-xl { margin-bottom: var(--spacing-xl); }
    .mb-4xl { margin-bottom: var(--spacing-4xl); }
    .mt-0 { margin-top: 0; }
    .mt-1 { margin-top: 4px; }
    .mt-md { margin-top: var(--spacing-md); }
    .mt-xl { margin-top: var(--spacing-xl); }
    .pb-sm { padding-bottom: var(--spacing-sm); }
    .pt-xl { padding-top: var(--spacing-xl); }
    .p-md { padding: var(--spacing-md); }
    .p-xl { padding: var(--spacing-xl); }
    .px-sm { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
    .px-md { padding-left: var(--spacing-md); padding-right: var(--spacing-md); }
    .py-xs { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
    .py-sm { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
    .py-5xl { padding-top: var(--spacing-5xl); padding-bottom: var(--spacing-5xl); }
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
    .text-md { font-size: var(--font-size-md); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-2xl { font-size: var(--font-size-2xl); }
    .text-3xl { font-size: var(--font-size-3xl); }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .uppercase { text-transform: uppercase; }
    .tracking-widest { letter-spacing: 0.05em; }
    .line-height-tight { line-height: var(--line-height-tight); }
    .line-height-relaxed { line-height: var(--line-height-relaxed); }
    .max-w-prose { max-width: 65ch; }
    .text-normal { text-transform: none; font-weight: normal; letter-spacing: normal; }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-success { color: var(--color-success, #16a34a); }
    .text-error { color: var(--color-error, #dc2626); }
    
    .bg-primary { background: var(--bg-primary); }
    .bg-secondary { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg); }
    .bg-success-light { background: color-mix(in srgb, var(--color-success) 15%, transparent); }

    /* Borders & Glassmorphism */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    .glass-inset { background: color-mix(in srgb, var(--bg-primary) 40%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); border: 1px solid var(--border-secondary); }
    
    .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .border-radius-xl { border-radius: var(--ui-border-radius-xl); }
    .border-radius-full { border-radius: 9999px; }
    
    .border-top-subtle { border-top: 1px solid var(--border-secondary); }
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    .border-success-subtle { border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent); }
    .border-1 { border-width: 1px; }
    .border-solid { border-style: solid; }
    .border-primary { border-color: var(--border-primary); }
    .border-secondary { border-color: var(--border-secondary); }
    .shadow-xl { box-shadow: var(--shadow-xl); }
    .overflow-hidden { overflow: hidden; }

    /* ==========================================================================
       COMPONENT SPECIFICS
       ========================================================================== */
    .icon-brand { width: 48px; height: 48px; border: 1px solid var(--color-primary); }
    .icon-circle-large { width: 64px; height: 64px; border: 1px solid var(--border-primary); }
    
    .badge-mono-sm { font-family: var(--font-mono); font-size: 11px; background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-primary); }

    .pi-spin-hover:hover { transform: rotate(180deg); transition: transform 0.5s ease; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }

    @media (max-width: 768px) {
      .header-actions { margin-top: var(--spacing-md); width: 100%; }
      .grid-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class ShiftGroupAssignmentsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  // State
  groupId: string = '';
  assignments = signal<any[]>([]);
  isLoadingAssignments = signal<boolean>(true);
  
  displayAssignDialog = false;
  isAssigning = signal<boolean>(false);
  assignForm!: FormGroup;

  isGenerating = signal<boolean>(false);
  generateForm!: FormGroup;
  generatedSchedule = signal<any | null>(null);

  // Mock users
  mockUsers = [
    { id: 'usr_1', name: 'Mukesh Singh' },
    { id: 'usr_2', name: 'Sarah Jenkins' },
    { id: 'usr_3', name: 'David Chen' }
  ];

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.groupId) {
      this.router.navigate(['/shift-groups']);
      return;
    }

    this.initForms();
    this.loadAssignments();
  }

  private initForms() {
    this.assignForm = this.fb.group({
      userIds: [[], Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [null]
    });

    this.generateForm = this.fb.group({
      startDate: [new Date(), Validators.required],
      endDate: [null, Validators.required],
      userIds: [[]]
    });
  }

  private loadAssignments() {
    this.isLoadingAssignments.set(true);
    this.hrmsService.getGroupAssignments(this.groupId).pipe(
      map(res => res?.data?.assignments || []),
      catchError((error) => {
        this.messageService.handleHttpError(error)
        return of([]);
      }),
      finalize(() => this.isLoadingAssignments.set(false))
    ).subscribe(data => {
      this.assignments.set(data);
    });
  }

  showAssignDialog() {
    this.assignForm.reset({ startDate: new Date() });
    this.displayAssignDialog = true;
  }

  onAssignSubmit() {
    if (this.assignForm.invalid) return;
    
    this.isAssigning.set(true);
    const payload = this.assignForm.value;

    this.hrmsService.assignGroupToUsers(this.groupId, payload).pipe(
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      finalize(() => this.isAssigning.set(false))
    ).subscribe((res:any) => {
      if (res) {
        this.messageService.showSuccess(res.message)
        this.displayAssignDialog = false;
        this.loadAssignments();
      }
    });
  }

  onGenerate() {
    if (this.generateForm.invalid) return;

    this.isGenerating.set(true);
    this.generatedSchedule.set(null);
    const payload = this.generateForm.value;

    this.hrmsService.generateRotationSchedule(this.groupId, payload).pipe(
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      finalize(() => this.isGenerating.set(false))
    ).subscribe((res:any) => {
      this.messageService.showSuccess(res.message)
      this.generatedSchedule.set({ status: 'success' });
    });
  }

  onBack() {
    this.router.navigate(['/shift-groups']);
  }

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}


// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { catchError, finalize, map } from 'rxjs/operators';
// import { of } from 'rxjs';

// // Services
// import { MessageService } from 'primeng/api';

// // PrimeNG Modules
// import { TabsModule } from 'primeng/tabs';
// import { TableModule } from 'primeng/table';
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { DialogModule } from 'primeng/dialog';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { ToastModule } from 'primeng/toast';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { AvatarModule } from 'primeng/avatar';
// import { TooltipModule } from 'primeng/tooltip';
// import { DatePickerModule } from 'primeng/datepicker';
// import { HRMSService } from '../../hrms.service';

// @Component({
//   selector: 'app-shift-group-assignments',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule,
//     TabsModule, TableModule, CardModule, ButtonModule, DialogModule,
//     DatePickerModule, MultiSelectModule, ToastModule, TagModule,
//     SkeletonModule, AvatarModule, TooltipModule
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast position="top-right"></p-toast>

//     <div class="page-wrapper fade-in">
      
//       <header class="dashboard-header slide-down mb-4">
//         <div class="header-left">
//           <p-button 
//             icon="pi pi-arrow-left" 
//             [text]="true" 
//             [rounded]="true" 
//             size="large"
//             styleClass="back-btn"
//             (onClick)="onBack()" 
//             pTooltip="Back to Groups">
//           </p-button>
//           <div class="header-titles">
//             <div class="title-row">
//               <div class="icon-brand bg-primary-light text-primary"><i class="pi pi-users"></i></div>
//               <h1 class="page-title">Rotation Assignments</h1>
//             </div>
//             <p class="page-subtitle mt-1">Manage personnel assigned to this rotation and generate their schedules.</p>
//           </div>
//         </div>
//         <div class="header-right">
//           <p-button 
//             label="Assign Personnel" 
//             icon="pi pi-user-plus" 
//             styleClass="p-button-primary"
//             (onClick)="showAssignDialog()">
//           </p-button>
//         </div>
//       </header>

//       <p-card styleClass="premium-card glass-card workspace-card">
//         <p-tabs value="0">
//           <p-tablist styleClass="hub-tablist">
//             <p-tab value="0">
//               <div class="tab-label"><i class="pi pi-list"></i> Active Roster</div>
//             </p-tab>
//             <p-tab value="1">
//               <div class="tab-label"><i class="pi pi-calendar-plus"></i> Schedule Generator</div>
//             </p-tab>
//           </p-tablist>

//           <p-tabpanels styleClass="hub-tabpanels p-0">
            
//             <p-tabpanel value="0">
//               <div class="panel-inner">
//                 @if (isLoadingAssignments()) {
//                   <div class="p-4 flex-col gap-3">
//                     <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
//                     <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
//                     <p-skeleton width="100%" height="4rem" borderRadius="8px"></p-skeleton>
//                   </div>
//                 } @else {
//                   <p-table 
//                     [value]="assignments()" 
//                     [paginator]="true" 
//                     [rows]="10" 
//                     responsiveLayout="scroll"
//                     styleClass="premium-table">
                    
//                     <ng-template pTemplate="header">
//                       <tr>
//                         <th>Employee Details</th>
//                         <th>Effective Period</th>
//                         <th class="text-right">Status</th>
//                         <th class="text-center" style="width: 5rem">Actions</th>
//                       </tr>
//                     </ng-template>

//                     <ng-template pTemplate="body" let-assignment>
//                       <tr class="table-row-hover">
//                         <td>
//                           <div class="flex-align gap-3">
//                             <p-avatar [label]="getInitials(assignment.userName)" shape="circle" size="large" [style]="{'background-color': 'var(--bg-secondary)', 'color': 'var(--text-secondary)'}"></p-avatar>
//                             <div class="flex-col gap-1">
//                               <span class="font-bold text-primary-color">{{ assignment.userName }}</span>
//                               <span class="badge-mono-sm w-max">{{ assignment.userId | slice:0:8 }}</span>
//                             </div>
//                           </div>
//                         </td>
//                         <td>
//                           <div class="flex-align gap-2 text-sm text-secondary">
//                             <i class="pi pi-calendar"></i>
//                             <span>{{ assignment.startDate | date:'mediumDate' }}</span>
//                             <i class="pi pi-arrow-right text-xs mx-1 text-tertiary"></i>
//                             <span [class.text-tertiary]="!assignment.endDate">{{ (assignment.endDate | date:'mediumDate') || 'Ongoing' }}</span>
//                           </div>
//                         </td>
//                         <td class="text-right">
//                           <p-tag severity="success" value="Active"></p-tag>
//                         </td>
//                         <td class="text-center">
//                           <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary"></p-button>
//                         </td>
//                       </tr>
//                     </ng-template>

//                     <ng-template pTemplate="emptymessage">
//                       <tr>
//                         <td colspan="4" class="text-center py-6">
//                           <div class="empty-glass-state">
//                             <div class="icon-circle-large mb-3"><i class="pi pi-users text-tertiary"></i></div>
//                             <h4 class="text-primary-color m-0 mb-1">No personnel assigned</h4>
//                             <p class="text-secondary m-0">This rotation group currently has no active members.</p>
//                           </div>
//                         </td>
//                       </tr>
//                     </ng-template>
//                   </p-table>
//                 }
//               </div>
//             </p-tabpanel>

//             <p-tabpanel value="1">
//               <div class="panel-inner bg-surface p-4">
                
//                 <div class="generator-banner mb-5 slide-down">
//                   <div class="flex-align gap-3">
//                     <div class="icon-circle bg-primary text-white"><i class="pi pi-cog pi-spin-hover"></i></div>
//                     <div class="flex-col">
//                       <h3 class="m-0 font-heading">Generate Rotation Schedule</h3>
//                       <p class="m-0 text-sm text-secondary">Project the shift group rules into concrete daily schedules for your employees.</p>
//                     </div>
//                   </div>
//                 </div>

//                 <form [formGroup]="generateForm" (ngSubmit)="onGenerate()" class="generator-form glass-card p-4 mb-5">
//                   <div class="grid-3">
//                     <div class="input-group">
//                       <label class="info-label">Generation Start Date <span class="text-error">*</span></label>
//                       <p-datepicker formControlName="startDate" [showIcon]="true" placeholder="Select Start" styleClass="w-full premium-calendar"></p-datepicker>
//                     </div>
//                     <div class="input-group">
//                       <label class="info-label">Generation End Date <span class="text-error">*</span></label>
//                       <p-datepicker formControlName="endDate" [showIcon]="true" placeholder="Select End" styleClass="w-full premium-calendar"></p-datepicker>
//                     </div>
//                     <div class="input-group">
//                       <label class="info-label">Target Employees <span class="text-tertiary text-normal">(Optional)</span></label>
//                       <p-multiSelect formControlName="userIds" [options]="mockUsers" optionLabel="name" optionValue="id" placeholder="All assigned users" display="chip" styleClass="w-full premium-dropdown"></p-multiSelect>
//                     </div>
//                   </div>
//                   <div class="form-actions mt-4 pt-4 border-top flex-align justify-end">
//                     <p-button label="Generate Concrete Schedule" icon="pi pi-bolt" type="submit" [loading]="isGenerating()" [disabled]="generateForm.invalid" styleClass="p-button-primary"></p-button>
//                   </div>
//                 </form>

//                 @if (generatedSchedule()) {
//                   <div class="generated-results slide-down">
//                     <h3 class="font-heading mb-3 border-bottom pb-2">Schedule Output Preview</h3>
//                     <div class="success-banner mb-3 flex-align gap-2">
//                       <i class="pi pi-check-circle text-success"></i>
//                       <span>Successfully generated <strong>14</strong> shift instances across <strong>2</strong> users.</span>
//                     </div>
                    
//                     <div class="mock-timeline">
//                       <div class="timeline-item bg-primary-light border-radius-md p-3 mb-2 flex-between">
//                         <div class="flex-col"><span class="font-bold text-primary">Mukesh Singh</span><span class="text-xs text-secondary">12 Oct 2026</span></div>
//                         <p-tag value="Morning Shift"></p-tag>
//                       </div>
//                       <div class="timeline-item bg-surface border-radius-md p-3 mb-2 flex-between">
//                         <div class="flex-col"><span class="font-bold">Sarah Jenkins</span><span class="text-xs text-secondary">12 Oct 2026</span></div>
//                         <p-tag value="Night Shift" severity="warn"></p-tag>
//                       </div>
//                       <div class="text-center text-sm text-tertiary mt-3">... Preview limited. View full calendar in Schedule Board.</div>
//                     </div>
//                   </div>
//                 }

//               </div>
//             </p-tabpanel>

//           </p-tabpanels>
//         </p-tabs>
//       </p-card>

//     </div>

//     <p-dialog 
//       header="Assign to Shift Group" 
//       [(visible)]="displayAssignDialog" 
//       [modal]="true" 
//       [style]="{ width: '500px' }"
//       [draggable]="false"
//       styleClass="premium-dialog">
      
//       <p class="text-secondary text-sm mb-4">Select employees to attach to this rotation pattern. Their shifts will be mapped based on the group's effective dates.</p>
      
//       <form [formGroup]="assignForm" (ngSubmit)="onAssignSubmit()" class="flex-col gap-4">
//         <div class="input-group">
//           <label class="info-label">Select Employees <span class="text-error">*</span></label>
//           <p-multiSelect 
//             formControlName="userIds" 
//             [options]="mockUsers" 
//             optionLabel="name" 
//             optionValue="id" 
//             placeholder="Choose one or more users" 
//             display="chip" 
//             [filter]="true"
//             styleClass="w-full premium-dropdown"
//             appendTo="body">
//           </p-multiSelect>
//         </div>
        
//         <div class="grid-2">
//           <div class="input-group">
//             <label class="info-label">Start Date <span class="text-error">*</span></label>
//             <p-datepicker formControlName="startDate" [showIcon]="true" appendTo="body" styleClass="w-full premium-calendar"></p-datepicker>
//           </div>
//           <div class="input-group">
//             <label class="info-label">End Date (Optional)</label>
//             <p-datepicker formControlName="endDate" [showIcon]="true" appendTo="body" styleClass="w-full premium-calendar"></p-datepicker>
//           </div>
//         </div>
        
//         <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top">
//           <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="displayAssignDialog = false"></p-button>
//           <p-button label="Confirm Assignment" icon="pi pi-check" type="submit" [loading]="isAssigning()" [disabled]="assignForm.invalid" styleClass="p-button-primary"></p-button>
//         </div>
//       </form>
//     </p-dialog>
//   `,
//   styles: [`
//     /* --------------------------------------------------------------------------
//        GLOBAL & VARIABLES
//        -------------------------------------------------------------------------- */
//     :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }

//     /* Utility */
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
//     .justify-end { justify-content: flex-end; }
    
//     .w-full { width: 100%; }
//     .w-max { width: max-content; }
    
//     .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
//     .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); }
    
//     .gap-1 { gap: var(--spacing-xs); }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
//     .gap-4 { gap: var(--spacing-lg); }
    
//     .m-0 { margin: 0; }
//     .mx-1 { margin-left: var(--spacing-xs); margin-right: var(--spacing-xs); }
//     .mb-1 { margin-bottom: var(--spacing-xs); }
//     .mb-2 { margin-bottom: var(--spacing-sm); }
//     .mb-3 { margin-bottom: var(--spacing-md); }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .mb-5 { margin-bottom: var(--spacing-2xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-3 { margin-top: var(--spacing-md); }
//     .mt-4 { margin-top: var(--spacing-xl); }
    
//     .p-0 { padding: 0 !important; }
//     .p-3 { padding: var(--spacing-lg); }
//     .p-4 { padding: var(--spacing-xl); }
//     .pt-4 { padding-top: var(--spacing-xl); }
//     .pb-2 { padding-bottom: var(--spacing-md); }
//     .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    
//     .bg-surface { background: var(--bg-secondary); }
//     .bg-primary { background: var(--color-primary); color: white; }
//     .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    
//     .border-top { border-top: 1px solid var(--border-primary); }
//     .border-bottom { border-bottom: 1px solid var(--border-primary); }
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }
    
//     .text-center { text-align: center; }
//     .text-right { text-align: right; }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-primary { color: var(--color-primary); }
//     .text-error { color: var(--color-error); }
//     .text-success { color: var(--color-success); }
//     .text-normal { text-transform: none; font-weight: normal; letter-spacing: normal; }
    
//     .font-medium { font-weight: var(--font-weight-medium); }
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-heading { font-family: var(--font-heading); }

//     /* --------------------------------------------------------------------------
//        HEADER & TABS
//        -------------------------------------------------------------------------- */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
//     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
//     ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; }
//     ::ng-deep .back-btn:hover { color: var(--color-primary) !important; background: var(--color-primary-bg) !important; border-color: var(--color-primary-border) !important; }
//     .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); border: 1px solid var(--color-primary-border); }
//     .header-titles { display: flex; flex-direction: column; }
//     .title-row { display: flex; align-items: center; gap: var(--spacing-md); }
//     .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; letter-spacing: -0.02em; }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

//     .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    
//     ::ng-deep .workspace-card .p-card-body { padding: 0; }
//     ::ng-deep .workspace-card .p-card-content { padding: 0; }

//     ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
//     ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-medium) !important; transition: var(--transition-base); }
//     ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }
//     .tab-label { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-md); }

//     /* --------------------------------------------------------------------------
//        TABLE & CONTENT
//        -------------------------------------------------------------------------- */
//     ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
//     ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-primary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
//     ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
//     ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

//     .badge-mono-sm { font-family: var(--font-mono); font-size: 11px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-primary); color: var(--text-secondary); }

//     .empty-glass-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
//     .icon-circle-large { width: 64px; height: 64px; border-radius: 50%; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; font-size: 2rem; border: 1px solid var(--border-primary); }
//     .icon-circle { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
//     .pi-spin-hover:hover { transform: rotate(180deg); transition: transform 0.5s ease; }

//     /* --------------------------------------------------------------------------
//        FORMS & INPUTS
//        -------------------------------------------------------------------------- */
//     .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
//     .info-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }

//     ::ng-deep .premium-dropdown .p-select,
//     ::ng-deep .premium-dropdown .p-multiselect,
//     ::ng-deep .premium-calendar .p-datepicker .p-inputtext { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); }
//     ::ng-deep .premium-dropdown .p-select:not(.p-disabled):hover,
//     ::ng-deep .premium-dropdown .p-multiselect:not(.p-disabled):hover,
//     ::ng-deep .premium-calendar .p-datepicker .p-inputtext:not(.p-disabled):hover { border-color: var(--color-primary); }

//     ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
//     ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }

//     .success-banner { padding: var(--spacing-md) var(--spacing-lg); background: var(--color-success-bg, #ecfdf5); border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent); border-radius: var(--ui-border-radius-md); color: var(--color-success-dark); font-size: var(--font-size-sm); }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }

//     @media (max-width: 768px) {
//       .grid-2, .grid-3 { grid-template-columns: 1fr; }
//       .header-right { margin-top: var(--spacing-md); }
//     }
//   `]
// })
// export class ShiftGroupAssignmentsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private fb = inject(FormBuilder);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   // State
//   groupId: string = '';
//   assignments = signal<any[]>([]);
//   isLoadingAssignments = signal<boolean>(true);
  
//   displayAssignDialog = false;
//   isAssigning = signal<boolean>(false);
//   assignForm!: FormGroup;

//   isGenerating = signal<boolean>(false);
//   generateForm!: FormGroup;
//   generatedSchedule = signal<any | null>(null);

//   // Mock users (Replace with user lookup API)
//   mockUsers = [
//     { id: 'usr_1', name: 'Mukesh Singh' },
//     { id: 'usr_2', name: 'Sarah Jenkins' },
//     { id: 'usr_3', name: 'David Chen' }
//   ];

//   ngOnInit() {
//     this.groupId = this.route.snapshot.paramMap.get('id') || '';
//     if (!this.groupId) {
//       this.router.navigate(['/shift-groups']);
//       return;
//     }

//     this.initForms();
//     this.loadAssignments();
//   }

//   private initForms() {
//     this.assignForm = this.fb.group({
//       userIds: [[], Validators.required],
//       startDate: [new Date(), Validators.required],
//       endDate: [null]
//     });

//     this.generateForm = this.fb.group({
//       startDate: [new Date(), Validators.required],
//       endDate: [null, Validators.required],
//       userIds: [[]] // Optional
//     });
//   }

//   // --- Assignments Tab ---
//   private loadAssignments() {
//     this.isLoadingAssignments.set(true);
//     this.hrmsService.getGroupAssignments(this.groupId).pipe(
//       map(res => res?.data?.assignments || []),
//       catchError(() => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not fetch active assignments.' });
//         return of([]);
//       }),
//       finalize(() => this.isLoadingAssignments.set(false))
//     ).subscribe(data => {
//       this.assignments.set(data);
//     });
//   }

//   showAssignDialog() {
//     this.assignForm.reset({ startDate: new Date() });
//     this.displayAssignDialog = true;
//   }

//   onAssignSubmit() {
//     if (this.assignForm.invalid) return;
    
//     this.isAssigning.set(true);
//     const payload = this.assignForm.value;

//     this.hrmsService.assignGroupToUsers(this.groupId, payload).pipe(
//       catchError(err => {
//         this.messageService.add({ severity: 'error', summary: 'Assignment Failed', detail: err.error?.message || 'Server error occurred.' });
//         return of(null);
//       }),
//       finalize(() => this.isAssigning.set(false))
//     ).subscribe(res => {
//       if (res) {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Users successfully assigned to shift group.' });
//         this.displayAssignDialog = false;
//         this.loadAssignments(); // Refresh table
//       }
//     });
//   }

//   // --- Schedule Generator Tab ---
//   onGenerate() {
//     if (this.generateForm.invalid) return;

//     this.isGenerating.set(true);
//     this.generatedSchedule.set(null);
//     const payload = this.generateForm.value;

//     this.hrmsService.generateRotationSchedule(this.groupId, payload).pipe(
//       catchError(err => {
//         this.messageService.add({ severity: 'error', summary: 'Generation Failed', detail: 'Could not process rotation schedule.' });
//         return of(null);
//       }),
//       finalize(() => this.isGenerating.set(false))
//     ).subscribe(res => {
//       // Mocking successful generation response for UI
//       this.messageService.add({ severity: 'success', summary: 'Generated', detail: 'Concrete schedules created successfully.' });
//       this.generatedSchedule.set({ status: 'success' }); // Triggers the UI mock preview
//     });
//   }

//   // --- Helpers ---
//   onBack() {
//     this.router.navigate(['/shift-groups']);
//   }

//   getInitials(name: string): string {
//     if (!name || name.trim() === '') return '?';
//     return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
//   }
// }