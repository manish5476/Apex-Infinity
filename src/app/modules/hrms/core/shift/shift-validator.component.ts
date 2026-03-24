import { Message } from "./../../../../chat/chat.component/chat.models";

import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';

import { HRMSService } from '../../hrms.service';
import { AppMessageService } from "@core/services/message.service";

@Component({
  selector: 'app-shift-validator',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    CardModule, 
    SelectModule, 
    DatePicker, 
    ButtonModule,
    TagModule, 
    ToastModule, 
    DividerModule, 
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast  appendTo="body"position="top-right"></p-toast>

    <div class="page-container fade-in">
      
      <header class="page-header flex align-items-center gap-xl mb-4xl">
        <div class="icon-brand flex-center bg-primary-light text-primary border-radius-lg flex-shrink-0">
          <i class="pi pi-calendar-clock text-3xl"></i>
        </div>
        <div class="header-titles flex-col gap-xs">
          <h1 class="title font-heading text-3xl font-bold text-primary m-0 line-height-tight">Shift Validator</h1>
          <p class="subtitle text-secondary text-md m-0 max-w-prose">Pre-check shift assignments for scheduling conflicts or HR rule violations.</p>
        </div>
      </header>

      <p-card  appendTo="body"styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden custom-form-card">
        <form [formGroup]="validationForm" (ngSubmit)="runValidation()" class="validation-form flex-col gap-3xl">
          
          <div class="form-grid">
            <div class="input-group flex-col gap-xs">
              <label class="info-label" for="userId">Employee <span class="text-error">*</span></label>
              <p-select  appendTo="body"
                id="userId"
                formControlName="userId" 
                [options]="mockEmployees" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Select an Employee"
                [filter]="true"
                filterBy="name,code"
                styleClass="w-full premium-input">
                <ng-template pTemplate="selectedItem" let-selectedOption>
                  <div class="flex align-items-center gap-sm">
                    <i class="pi pi-user text-primary"></i>
                    <span class="font-medium">{{ selectedOption.name }}</span>
                  </div>
                </ng-template>
                <ng-template pTemplate="item" let-employee>
                  <div class="flex align-items-center gap-md">
                    <div class="avatar-circle flex-center bg-secondary text-secondary border-radius-full">
                      <i class="pi pi-user"></i>
                    </div>
                    <div class="flex-col">
                      <span class="font-bold text-primary">{{ employee.name }}</span>
                      <span class="text-xs font-mono text-tertiary">{{ employee.code }}</span>
                    </div>
                  </div>
                </ng-template>
              </p-select>
            </div>

            <div class="input-group flex-col gap-xs">
              <label class="info-label" for="shiftId">Target Shift <span class="text-error">*</span></label>
              <p-select  appendTo="body"
                id="shiftId"
                formControlName="shiftId" 
                [options]="mockShifts" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Select a Shift"
                styleClass="w-full premium-input"
                [filter]="true"
                filterBy="name">

                <ng-template pTemplate="item" let-shift>
                  <div class="flex-col gap-xs">
                    <span class="font-bold text-primary">{{ shift.name }}</span>
                    <span class="text-xs font-mono text-secondary bg-secondary px-sm py-xs border-radius-sm w-max-content">
                      <i class="pi pi-clock mr-1 text-tertiary"></i>{{ shift.time }}
                    </span>
                  </div>
                </ng-template>
              </p-select>
            </div>

            <div class="input-group flex-col gap-xs">
              <label class="info-label" for="date">Effective Date <span class="text-tertiary text-normal text-xs ml-1">(Optional)</span></label>
              <p-datepicker  appendTo="body"
                id="date"
                formControlName="date" 
                [showIcon]="true" 
                placeholder="Select Date"
                dateFormat="dd/mm/yy"
                styleClass="w-full premium-input">
              </p-datepicker>
            </div>
          </div>

          <div class="form-actions flex flex-wrap align-items-center justify-content-end gap-md pt-xl border-top-subtle">
            <p-button  appendTo="body"
              label="Reset" 
              icon="pi pi-refresh" 
              [outlined]="true" 
              severity="secondary"
              (onClick)="resetForm()"
              [disabled]="isValidating()"
              styleClass="w-full sm:w-auto">
            </p-button>
            <p-button  appendTo="body"
              label="Run Validation" 
              icon="pi pi-check-square" 
              [loading]="isValidating()" 
              [disabled]="validationForm.invalid"
              type="submit"
              styleClass="w-full sm:w-auto">
            </p-button>
          </div>
        </form>

        @if (validationResult(); as result) {
          <div class="result-container mt-4xl slide-down">
            <h3 class="font-heading text-lg font-bold text-primary mb-lg pb-sm border-bottom-subtle">Validation Report</h3>
            
            @if (result.isValid) {
              <div class="result-box glass-inset success-box flex align-items-start gap-xl p-xl border-radius-lg">
                <div class="result-icon flex-center flex-shrink-0 bg-success-light text-success border-radius-full">
                  <i class="pi pi-check-circle text-2xl"></i>
                </div>
                <div class="result-content flex-col gap-xs">
                  <h4 class="text-success m-0 font-heading text-xl font-bold">Assignment Valid</h4>
                  <p class="m-0 text-secondary line-height-relaxed max-w-prose">No scheduling conflicts or rule violations detected. The employee can be safely assigned to this shift.</p>
                </div>
              </div>
            } @else {
              <div class="result-box glass-inset error-box flex align-items-start gap-xl p-xl border-radius-lg">
                <div class="result-icon flex-center flex-shrink-0 bg-error-light text-error border-radius-full">
                  <i class="pi pi-exclamation-triangle text-2xl"></i>
                </div>
                <div class="result-content flex-col w-full">
                  <h4 class="text-error m-0 mb-sm font-heading text-xl font-bold">Validation Failed</h4>
                  <p class="m-0 text-secondary mb-lg">The system detected the following conflicts preventing this assignment:</p>
                  
                  <ul class="conflict-list flex-col gap-sm p-0 m-0 list-none">
                    @for (conflict of result.conflicts; track conflict) {
                      <li class="flex align-items-start gap-md p-md bg-primary border-radius-md border-error-subtle">
                        <i class="pi pi-times-circle text-error mt-1"></i>
                        <span class="text-primary font-medium line-height-relaxed">{{ conflict }}</span>
                      </li>
                    }
                  </ul>
                </div>
              </div>
            }
          </div>
        }
      </p-card>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       BASE & LAYOUT UTILITIES
       ========================================================================== */
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    
    .page-container { max-width: 1000px; margin: 0 auto; padding: var(--spacing-2xl) var(--spacing-xl); }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .flex-wrap { display: flex; flex-wrap: wrap; }
    .align-items-center { align-items: center; }
    .align-items-start { align-items: flex-start; }
    .justify-content-end { justify-content: flex-end; }
    .flex-shrink-0 { flex-shrink: 0; }
    .w-full { width: 100%; }
    .w-max-content { width: max-content; }
    
    /* Spacing */
    .m-0 { margin: 0; }
    .p-0 { padding: 0; }
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-lg { margin-bottom: var(--spacing-lg); }
    .mb-4xl { margin-bottom: var(--spacing-4xl); }
    .mt-1 { margin-top: 4px; }
    .mt-4xl { margin-top: var(--spacing-4xl); }
    .pb-sm { padding-bottom: var(--spacing-sm); }
    .pt-xl { padding-top: var(--spacing-xl); }
    .p-md { padding: var(--spacing-md); }
    .p-xl { padding: var(--spacing-xl); }
    .px-sm { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
    .py-xs { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
    .gap-xs { gap: var(--spacing-xs); }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-md { gap: var(--spacing-md); }
    .gap-xl { gap: var(--spacing-xl); }
    .gap-3xl { gap: var(--spacing-3xl); }

    /* Typography & Colors */
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-md { font-size: var(--font-size-md); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-2xl { font-size: var(--font-size-2xl); }
    .text-3xl { font-size: var(--font-size-3xl); }
    .line-height-tight { line-height: var(--line-height-tight); }
    .line-height-relaxed { line-height: var(--line-height-relaxed); }
    .max-w-prose { max-width: 65ch; }
    .list-none { list-style: none; }
    .text-normal { text-transform: none; letter-spacing: normal; }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-success { color: var(--color-success, #16a34a); }
    .text-error { color: var(--color-error, #dc2626); }
    
    .bg-primary { background: var(--bg-primary); }
    .bg-secondary { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg); }
    .bg-success-light { background: color-mix(in srgb, var(--color-success) 15%, transparent); }
    .bg-error-light { background: color-mix(in srgb, var(--color-error) 15%, transparent); }

    /* Borders & Glassmorphism */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    .glass-inset { background: color-mix(in srgb, var(--bg-primary) 40%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
    .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .border-radius-xl { border-radius: var(--radius-2xl); }
    .border-radius-full { border-radius: 9999px; }
    .border-top-subtle { border-top: 1px solid var(--border-secondary); }
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    .border-error-subtle { border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent); }
    .shadow-xl { box-shadow: var(--shadow-xl); }
    .overflow-hidden { overflow: hidden; }

    /* ==========================================================================
       COMPONENT SPECIFICS
       ========================================================================== */
    .icon-brand { width: clamp(48px, 8vw, 64px); aspect-ratio: 1; border: 1px solid var(--color-primary); }
    .avatar-circle { width: 32px; height: 32px; border: 1px solid var(--border-secondary); }

    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-xl); }
    
    .info-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-label, var(--text-tertiary)); text-transform: uppercase; letter-spacing: 0.05em; }

    /* Results Area */
    .success-box { border-left: 4px solid var(--color-success); border-top: 1px solid var(--border-secondary); border-right: 1px solid var(--border-secondary); border-bottom: 1px solid var(--border-secondary); }
    .error-box { border-left: 4px solid var(--color-error); border-top: 1px solid var(--border-secondary); border-right: 1px solid var(--border-secondary); border-bottom: 1px solid var(--border-secondary); }
    .result-icon { width: 48px; height: 48px; }

    /* ==========================================================================
       PRIME NG OVERRIDES
       ========================================================================== */
    :host ::ng-deep .custom-form-card .p-card-body { padding: var(--spacing-2xl); }
    
    /* PrimeNG v18 <p-select> appendTo="body" and <p-datepicker> appendTo="body" Input overrides */
    :host ::ng-deep .premium-input .p-select,
    :host ::ng-deep .premium-input .p-datepicker-input {
      background: var(--bg-primary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-md);
      transition: var(--transition-base);
      box-shadow: var(--shadow-sm);
    }
    
    :host ::ng-deep .premium-input .p-select:not(.p-disabled):hover,
    :host ::ng-deep .premium-input .p-datepicker-input:not(.p-disabled):hover {
      border-color: var(--color-primary);
    }
    
    :host ::ng-deep .premium-input .p-select-label {
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }

    /* Responsive */
    @media (min-width: 640px) {
      .sm\\:w-auto { width: auto; }
    }
  `]
})
export class ShiftValidatorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  // State
  validationForm!: FormGroup;
  isValidating = signal<boolean>(false);
  validationResult = signal<any | null>(null);

  // Mock Data
  mockEmployees = [
    { id: 'usr_001', name: 'Mukesh Singh', code: 'EMP-001' },
    { id: 'usr_002', name: 'Sarah Jenkins', code: 'EMP-002' },
    { id: 'usr_003', name: 'David Chen', code: 'EMP-003' }
  ];

  mockShifts = [
    { id: 'shf_morning', name: 'Morning Shift', time: '08:00 AM - 04:00 PM' },
    { id: 'shf_evening', name: 'Evening Shift', time: '04:00 PM - 12:00 AM' },
    { id: 'shf_night', name: 'Night Shift', time: '12:00 AM - 08:00 AM' }
  ];

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.validationForm = this.fb.group({
      userId: [null, Validators.required],
      shiftId: [null, Validators.required],
      date: [null]
    });
  }

  runValidation() {
    if (this.validationForm.invalid) return;

    this.isValidating.set(true);
    this.validationResult.set(null);

    const formData = this.validationForm.value;
    const payload = {
      shiftId: formData.shiftId,
      userId: formData.userId,
      ...(formData.date && { date: formData.date })
    };

    this.hrmsService.validateShiftAssignment(payload).pipe(
      catchError(error => {
        this.messageService.handleHttpError(error)
        // Demonstrating structural error UI
        return of({
          status: 'error',
          data: { 
            isValid: false, 
            conflicts: [
              'Employee already assigned to an overlapping shift (06:00 AM - 02:00 PM).', 
              'Assignment exceeds maximum allowed 40 hours per week threshold.'
            ] 
          }
        });
      }),
      finalize(() => this.isValidating.set(false))
    ).subscribe((response: any) => {
      if (response?.status === 'success' || response?.isValid === true) {
        this.validationResult.set({ isValid: true, conflicts: [] });
        this.messageService.showSuccess(response.Message)
      } else {
        this.validationResult.set(response?.data || response);
      }
    });
  }

  resetForm() {
    this.validationForm.reset();
    this.validationResult.set(null);
  }
}



// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { catchError, finalize } from 'rxjs/operators';
// import { of } from 'rxjs';

// // Services
// import { MessageService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { ToastModule } from 'primeng/toast';
// import { DividerModule } from 'primeng/divider';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { SelectModule } from 'primeng/select';
// import { DatePicker } from 'primeng/datepicker';

// import { HRMSService } from '../../hrms.service';

// @Component({
//   selector: 'app-shift-validator',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ReactiveFormsModule,
//     CardModule, 
//     SelectModule, 
//     DatePicker, 
//     ButtonModule,
//     TagModule, 
//     ToastModule, 
//     DividerModule, 
//     ProgressSpinnerModule
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast  appendTo="body"position="top-right"></p-toast>

//     <div class="page-container fade-in">
      
//       <header class="page-header flex align-items-center gap-xl mb-4xl">
//         <div class="icon-brand flex-center bg-primary-light text-primary border-radius-lg flex-shrink-0">
//           <i class="pi pi-calendar-clock text-3xl"></i>
//         </div>
//         <div class="header-titles flex-col gap-xs">
//           <h1 class="title font-heading text-3xl font-bold text-primary m-0 line-height-tight">Shift Validator</h1>
//           <p class="subtitle text-secondary text-md m-0 max-w-prose">Pre-check shift assignments for scheduling conflicts or HR rule violations.</p>
//         </div>
//       </header>

//       <p-card  appendTo="body"styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden custom-form-card">
//         <form [formGroup]="validationForm" (ngSubmit)="runValidation()" class="validation-form flex-col gap-3xl">
          
//           <div class="form-grid">
//             <div class="input-group flex-col gap-xs">
//               <label class="info-label" for="userId">Employee <span class="text-error">*</span></label>
//               <p-select  appendTo="body"
//                 id="userId"
//                 formControlName="userId" 
//                 [options]="mockEmployees" 
//                 optionLabel="name" 
//                 optionValue="id"
//                 placeholder="Select an Employee"
//                 [filter]="true"
//                 filterBy="name,code"
//                 styleClass="w-full premium-input">
//                 <ng-template pTemplate="selectedItem" let-selectedOption>
//                   <div class="flex align-items-center gap-sm">
//                     <i class="pi pi-user text-primary"></i>
//                     <span class="font-medium">{{ selectedOption.name }}</span>
//                   </div>
//                 </ng-template>
//                 <ng-template pTemplate="item" let-employee>
//                   <div class="flex align-items-center gap-md">
//                     <div class="avatar-circle flex-center bg-secondary text-secondary border-radius-full">
//                       <i class="pi pi-user"></i>
//                     </div>
//                     <div class="flex-col">
//                       <span class="font-bold text-primary">{{ employee.name }}</span>
//                       <span class="text-xs font-mono text-tertiary">{{ employee.code }}</span>
//                     </div>
//                   </div>
//                 </ng-template>
//               </p-select>
//             </div>

//             <div class="input-group flex-col gap-xs">
//               <label class="info-label" for="shiftId">Target Shift <span class="text-error">*</span></label>
//               <p-select  appendTo="body"
//                 id="shiftId"
//                 formControlName="shiftId" 
//                 [options]="mockShifts" 
//                 optionLabel="name" 
//                 optionValue="id"
//                 placeholder="Select a Shift"
//                 styleClass="w-full premium-input">
//                 <ng-template pTemplate="item" let-shift>
//                   <div class="flex-col gap-xs">
//                     <span class="font-bold text-primary">{{ shift.name }}</span>
//                     <span class="text-xs font-mono text-secondary bg-secondary px-sm py-xs border-radius-sm w-max-content">
//                       <i class="pi pi-clock mr-1 text-tertiary"></i>{{ shift.time }}
//                     </span>
//                   </div>
//                 </ng-template>
//               </p-select>
//             </div>

//             <div class="input-group flex-col gap-xs">
//               <label class="info-label" for="date">Effective Date <span class="text-tertiary text-normal text-xs ml-1">(Optional)</span></label>
//               <p-datepicker  appendTo="body"
//                 id="date"
//                 formControlName="date" 
//                 [showIcon]="true" 
//                 placeholder="Select Date"
//                 dateFormat="dd/mm/yy"
//                 styleClass="w-full premium-input">
//               </p-datepicker>
//             </div>
//           </div>

//           <div class="form-actions flex flex-wrap align-items-center justify-content-end gap-md pt-xl border-top-subtle">
//             <p-button  appendTo="body"
//               label="Reset" 
//               icon="pi pi-refresh" 
//               [outlined]="true" 
//               severity="secondary"
//               (onClick)="resetForm()"
//               [disabled]="isValidating()"
//               styleClass="w-full sm:w-auto">
//             </p-button>
//             <p-button  appendTo="body"
//               label="Run Validation" 
//               icon="pi pi-check-square" 
//               [loading]="isValidating()" 
//               [disabled]="validationForm.invalid"
//               type="submit"
//               styleClass="w-full sm:w-auto">
//             </p-button>
//           </div>
//         </form>

//         @if (validationResult(); as result) {
//           <div class="result-container mt-4xl slide-down">
//             <h3 class="font-heading text-lg font-bold text-primary mb-lg pb-sm border-bottom-subtle">Validation Report</h3>
            
//             @if (result.isValid) {
//               <div class="result-box glass-inset success-box flex align-items-start gap-xl p-xl border-radius-lg">
//                 <div class="result-icon flex-center flex-shrink-0 bg-success-light text-success border-radius-full">
//                   <i class="pi pi-check-circle text-2xl"></i>
//                 </div>
//                 <div class="result-content flex-col gap-xs">
//                   <h4 class="text-success m-0 font-heading text-xl font-bold">Assignment Valid</h4>
//                   <p class="m-0 text-secondary line-height-relaxed max-w-prose">No scheduling conflicts or rule violations detected. The employee can be safely assigned to this shift.</p>
//                 </div>
//               </div>
//             } @else {
//               <div class="result-box glass-inset error-box flex align-items-start gap-xl p-xl border-radius-lg">
//                 <div class="result-icon flex-center flex-shrink-0 bg-error-light text-error border-radius-full">
//                   <i class="pi pi-exclamation-triangle text-2xl"></i>
//                 </div>
//                 <div class="result-content flex-col w-full">
//                   <h4 class="text-error m-0 mb-sm font-heading text-xl font-bold">Validation Failed</h4>
//                   <p class="m-0 text-secondary mb-lg">The system detected the following conflicts preventing this assignment:</p>
                  
//                   <ul class="conflict-list flex-col gap-sm p-0 m-0 list-none">
//                     @for (conflict of result.conflicts; track conflict) {
//                       <li class="flex align-items-start gap-md p-md bg-primary border-radius-md border-error-subtle">
//                         <i class="pi pi-times-circle text-error mt-1"></i>
//                         <span class="text-primary font-medium line-height-relaxed">{{ conflict }}</span>
//                       </li>
//                     }
//                   </ul>
//                 </div>
//               </div>
//             }
//           </div>
//         }
//       </p-card>
//     </div>
//   `,
//   styles: [`
//     /* ==========================================================================
//        BASE & LAYOUT UTILITIES
//        ========================================================================== */
//     :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    
//     .page-container { max-width: 1000px; margin: 0 auto; padding: var(--spacing-2xl) var(--spacing-xl); }
    
//     .flex { display: flex; }
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-center { display: flex; align-items: center; justify-content: center; }
//     .flex-wrap { display: flex; flex-wrap: wrap; }
//     .align-items-center { align-items: center; }
//     .align-items-start { align-items: flex-start; }
//     .justify-content-end { justify-content: flex-end; }
//     .flex-shrink-0 { flex-shrink: 0; }
//     .w-full { width: 100%; }
//     .w-max-content { width: max-content; }
    
//     /* Spacing */
//     .m-0 { margin: 0; }
//     .p-0 { padding: 0; }
//     .mb-sm { margin-bottom: var(--spacing-sm); }
//     .mb-lg { margin-bottom: var(--spacing-lg); }
//     .mb-4xl { margin-bottom: var(--spacing-4xl); }
//     .mt-1 { margin-top: 4px; }
//     .mt-4xl { margin-top: var(--spacing-4xl); }
//     .pb-sm { padding-bottom: var(--spacing-sm); }
//     .pt-xl { padding-top: var(--spacing-xl); }
//     .p-md { padding: var(--spacing-md); }
//     .p-xl { padding: var(--spacing-xl); }
//     .px-sm { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
//     .py-xs { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
//     .gap-xs { gap: var(--spacing-xs); }
//     .gap-sm { gap: var(--spacing-sm); }
//     .gap-md { gap: var(--spacing-md); }
//     .gap-xl { gap: var(--spacing-xl); }
//     .gap-3xl { gap: var(--spacing-3xl); }

//     /* Typography & Colors */
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .font-medium { font-weight: var(--font-weight-medium); }
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-md { font-size: var(--font-size-md); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-xl { font-size: var(--font-size-xl); }
//     .text-2xl { font-size: var(--font-size-2xl); }
//     .text-3xl { font-size: var(--font-size-3xl); }
//     .line-height-tight { line-height: var(--line-height-tight); }
//     .line-height-relaxed { line-height: var(--line-height-relaxed); }
//     .max-w-prose { max-width: 65ch; }
//     .list-none { list-style: none; }
//     .text-normal { text-transform: none; letter-spacing: normal; }

//     .text-primary { color: var(--text-primary); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-success { color: var(--color-success, #16a34a); }
//     .text-error { color: var(--color-error, #dc2626); }
    
//     .bg-primary { background: var(--bg-primary); }
//     .bg-secondary { background: var(--bg-secondary); }
//     .bg-primary-light { background: var(--color-primary-bg); }
//     .bg-success-light { background: color-mix(in srgb, var(--color-success) 15%, transparent); }
//     .bg-error-light { background: color-mix(in srgb, var(--color-error) 15%, transparent); }

//     /* Borders & Glassmorphism */
//     .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
//     .glass-inset { background: color-mix(in srgb, var(--bg-primary) 40%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
//     .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }
//     .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
//     .border-radius-xl { border-radius: var(--radius-2xl); }
//     .border-radius-full { border-radius: 9999px; }
//     .border-top-subtle { border-top: 1px solid var(--border-secondary); }
//     .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
//     .border-error-subtle { border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent); }
//     .shadow-xl { box-shadow: var(--shadow-xl); }
//     .overflow-hidden { overflow: hidden; }

//     /* ==========================================================================
//        COMPONENT SPECIFICS
//        ========================================================================== */
//     .icon-brand { width: clamp(48px, 8vw, 64px); aspect-ratio: 1; border: 1px solid var(--color-primary); }
//     .avatar-circle { width: 32px; height: 32px; border: 1px solid var(--border-secondary); }

//     .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-xl); }
    
//     .info-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-label, var(--text-tertiary)); text-transform: uppercase; letter-spacing: 0.05em; }

//     /* Results Area */
//     .success-box { border-left: 4px solid var(--color-success); border-top: 1px solid var(--border-secondary); border-right: 1px solid var(--border-secondary); border-bottom: 1px solid var(--border-secondary); }
//     .error-box { border-left: 4px solid var(--color-error); border-top: 1px solid var(--border-secondary); border-right: 1px solid var(--border-secondary); border-bottom: 1px solid var(--border-secondary); }
//     .result-icon { width: 48px; height: 48px; }

//     /* ==========================================================================
//        PRIME NG OVERRIDES
//        ========================================================================== */
//     :host ::ng-deep .custom-form-card .p-card-body { padding: var(--spacing-2xl); }
    
//     /* PrimeNG v18 <p-select> appendTo="body" and <p-datepicker> appendTo="body" Input overrides */
//     :host ::ng-deep .premium-input .p-select,
//     :host ::ng-deep .premium-input .p-datepicker-input {
//       background: var(--bg-primary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-md);
//       transition: var(--transition-base);
//       box-shadow: var(--shadow-sm);
//     }
    
//     :host ::ng-deep .premium-input .p-select:not(.p-disabled):hover,
//     :host ::ng-deep .premium-input .p-datepicker-input:not(.p-disabled):hover {
//       border-color: var(--color-primary);
//     }
    
//     :host ::ng-deep .premium-input .p-select-label {
//       font-family: var(--font-body);
//       color: var(--text-primary);
//     }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }

//     /* Responsive */
//     @media (min-width: 640px) {
//       .sm\\:w-auto { width: auto; }
//     }
//   `]
// })
// export class ShiftValidatorComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   // State
//   validationForm!: FormGroup;
//   isValidating = signal<boolean>(false);
//   validationResult = signal<any | null>(null);

//   // Mock Data
//   mockEmployees = [
//     { id: 'usr_001', name: 'Mukesh Singh', code: 'EMP-001' },
//     { id: 'usr_002', name: 'Sarah Jenkins', code: 'EMP-002' },
//     { id: 'usr_003', name: 'David Chen', code: 'EMP-003' }
//   ];

//   mockShifts = [
//     { id: 'shf_morning', name: 'Morning Shift', time: '08:00 AM - 04:00 PM' },
//     { id: 'shf_evening', name: 'Evening Shift', time: '04:00 PM - 12:00 AM' },
//     { id: 'shf_night', name: 'Night Shift', time: '12:00 AM - 08:00 AM' }
//   ];

//   ngOnInit() {
//     this.initForm();
//   }

//   private initForm() {
//     this.validationForm = this.fb.group({
//       userId: [null, Validators.required],
//       shiftId: [null, Validators.required],
//       date: [null]
//     });
//   }

//   runValidation() {
//     if (this.validationForm.invalid) return;

//     this.isValidating.set(true);
//     this.validationResult.set(null);

//     const formData = this.validationForm.value;
//     const payload = {
//       shiftId: formData.shiftId,
//       userId: formData.userId,
//       ...(formData.date && { date: formData.date })
//     };

//     this.hrmsService.validateShiftAssignment(payload).pipe(
//       catchError(error => {
//         this.messageService.add({ severity: 'error', summary: 'Server Error', detail: 'Could not complete validation check.' });
//         // Demonstrating structural error UI
//         return of({
//           status: 'error',
//           data: { 
//             isValid: false, 
//             conflicts: [
//               'Employee already assigned to an overlapping shift (06:00 AM - 02:00 PM).', 
//               'Assignment exceeds maximum allowed 40 hours per week threshold.'
//             ] 
//           }
//         });
//       }),
//       finalize(() => this.isValidating.set(false))
//     ).subscribe((response: any) => {
//       if (response?.status === 'success' || response?.isValid === true) {
//         this.validationResult.set({ isValid: true, conflicts: [] });
//         this.messageService.add({ severity: 'success', summary: 'Check Complete', detail: 'Validation completed successfully.' });
//       } else {
//         this.validationResult.set(response?.data || response);
//       }
//     });
//   }

//   resetForm() {
//     this.validationForm.reset();
//     this.validationResult.set(null);
//   }
// }

// // import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// // import { catchError, finalize } from 'rxjs/operators';
// // import { of } from 'rxjs';

// // // Services
// // import { MessageService } from 'primeng/api';

// // // PrimeNG
// // import { CardModule } from 'primeng/card';
// // import { ButtonModule } from 'primeng/button';
// // import { TagModule } from 'primeng/tag';
// // import { ToastModule } from 'primeng/toast';
// // import { DividerModule } from 'primeng/divider';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { SelectModule } from 'primeng/select';
// // import { DatePicker } from 'primeng/datepicker';
// // import { HRMSService } from '../../hrms.service';

// // @Component({
// //   selector: 'app-shift-validator',
// //   standalone: true,
// //   imports: [
// //     CommonModule, ReactiveFormsModule,
// //     CardModule, SelectModule, DatePicker, ButtonModule,
// //     TagModule, ToastModule, DividerModule, ProgressSpinnerModule
// //   ],
// //   providers: [MessageService],
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   template: `
// //     <p-toast  appendTo="body"position="top-right"></p-toast>

// //     <div class="validator-wrapper fade-in">
// //       <div class="validator-header mb-4">
// //         <div class="icon-brand"><i class="pi pi-datepicker-clock"></i></div>
// //         <div>
// //           <h2 class="page-title">Shift Assignment Validator</h2>
// //           <p class="page-subtitle text-secondary">Pre-check shift assignments for scheduling conflicts or rule violations.</p>
// //         </div>
// //       </div>

// //       <p-card  appendTo="body"styleClass="premium-card glass-card">
// //         <form [formGroup]="validationForm" (ngSubmit)="runValidation()" class="validation-form">
// //           <div class="form-grid">
            
// //             <div class="input-group">
// //               <label class="info-label" for="userId">Employee <span class="text-error">*</span></label>
// //               <p-select  appendTo="body"
// //                 id="userId"
// //                 formControlName="userId" 
// //                 [options]="mockEmployees" 
// //                 optionLabel="name" 
// //                 optionValue="id"
// //                 placeholder="Select an Employee"
// //                 [filter]="true"
// //                 filterBy="name"
// //                 styleClass="w-full premium-select">
// //                 <ng-template pTemplate="selectedItem" let-selectedOption>
// //                   <div class="flex-align gap-2">
// //                     <i class="pi pi-user text-tertiary"></i>
// //                     <span>{{ selectedOption.name }}</span>
// //                   </div>
// //                 </ng-template>
// //                 <ng-template pTemplate="item" let-employee>
// //                   <div class="flex-align gap-2">
// //                     <i class="pi pi-user text-tertiary"></i>
// //                     <div>
// //                       <div class="font-medium">{{ employee.name }}</div>
// //                       <div class="text-xs text-tertiary">{{ employee.code }}</div>
// //                     </div>
// //                   </div>
// //                 </ng-template>
// //               </p-select>
// //             </div>

// //             <div class="input-group">
// //               <label class="info-label" for="shiftId">Target Shift <span class="text-error">*</span></label>
// //               <p-select  appendTo="body"
// //                 id="shiftId"
// //                 formControlName="shiftId" 
// //                 [options]="mockShifts" 
// //                 optionLabel="name" 
// //                 optionValue="id"
// //                 placeholder="Select a Shift"
// //                 styleClass="w-full premium-select">
// //                 <ng-template pTemplate="item" let-shift>
// //                   <div class="flex-col">
// //                     <span class="font-medium">{{ shift.name }}</span>
// //                     <span class="text-xs text-tertiary">{{ shift.time }}</span>
// //                   </div>
// //                 </ng-template>
// //               </p-select>
// //             </div>

// //             <div class="input-group">
// //               <label class="info-label" for="date">Effective Date <span class="text-tertiary text-xs text-normal">(Optional)</span></label>
// //               <p-datepicker  appendTo="body"
// //                 id="date"
// //                 formControlName="date" 
// //                 [showIcon]="true" 
// //                 placeholder="Select Date"
// //                 dateFormat="dd/mm/yy"
// //                 styleClass="w-full premium-datepicker">
// //               </p-datepicker>
// //             </div>

// //           </div>

// //           <div class="form-actions mt-4 pt-4 border-top">
// //             <p-button  appendTo="body"
// //               label="Run Validation" 
// //               icon="pi pi-check-square" 
// //               [loading]="isValidating()" 
// //               [disabled]="validationForm.invalid"
// //               type="submit"
// //               styleClass="w-full md:w-auto p-button-primary">
// //             </p-button>
// //             <p-button  appendTo="body"
// //               label="Reset" 
// //               icon="pi pi-refresh" 
// //               [outlined]="true" 
// //               severity="secondary"
// //               (onClick)="resetForm()"
// //               [disabled]="isValidating()"
// //               styleClass="w-full md:w-auto ml-0 md:ml-3 mt-3 md:mt-0">
// //             </p-button>
// //           </div>
// //         </form>

// //         @if (validationResult(); as result) {
// //           <div class="result-container mt-5 slide-down">
// //             <h3 class="result-title">Validation Report</h3>
            
// //             @if (result.isValid) {
// //               <div class="result-box success-box">
// //                 <div class="result-icon bg-success-light text-success"><i class="pi pi-check-circle"></i></div>
// //                 <div class="result-content">
// //                   <h4 class="text-success m-0 mb-1 font-bold">Assignment Valid</h4>
// //                   <p class="m-0 text-secondary text-sm">No scheduling conflicts or rule violations detected. The employee can be safely assigned to this shift.</p>
// //                 </div>
// //               </div>
// //             } @else {
// //               <div class="result-box error-box">
// //                 <div class="result-icon bg-error-light text-error"><i class="pi pi-exclamation-triangle"></i></div>
// //                 <div class="result-content">
// //                   <h4 class="text-error m-0 mb-2 font-bold">Validation Failed</h4>
// //                   <p class="m-0 text-secondary text-sm mb-3">The system detected the following conflicts preventing this assignment:</p>
                  
// //                   <ul class="conflict-list">
// //                     @for (conflict of result.conflicts; track conflict) {
// //                       <li>
// //                         <i class="pi pi-times-circle text-error mt-1"></i>
// //                         <span>{{ conflict }}</span>
// //                       </li>
// //                     }
// //                   </ul>
// //                 </div>
// //               </div>
// //             }
// //           </div>
// //         }
// //       </p-card>
// //     </div>
// //   `,
// //   styles: [`
// //     :host {
// //       display: block;
// //       font-family: var(--font-body);
// //       color: var(--text-primary);
// //     }

// //     .validator-wrapper {
// //       max-width: 900px;
// //       margin: 0 auto;
// //       padding: var(--spacing-2xl) 0;
// //     }

// //     /* Header */
// //     .validator-header {
// //       display: flex;
// //       align-items: center;
// //       gap: var(--spacing-xl);
// //     }
// //     .icon-brand {
// //       width: 48px; height: 48px;
// //       border-radius: var(--ui-border-radius-lg);
// //       background: var(--color-primary-bg);
// //       color: var(--color-primary);
// //       display: flex; align-items: center; justify-content: center;
// //       font-size: var(--font-size-2xl);
// //     }
// //     .page-title {
// //       margin: 0 0 4px 0;
// //       font-size: var(--font-size-2xl);
// //       font-weight: var(--font-weight-bold);
// //       font-family: var(--font-heading);
// //     }

// //     /* Form Layout */
// //     .form-grid {
// //       display: grid;
// //       grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
// //       gap: var(--spacing-xl);
// //     }
// //     .input-group {
// //       display: flex;
// //       flex-direction: column;
// //       gap: var(--spacing-xs);
// //     }
// //     .info-label {
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-semibold);
// //       color: var(--text-label);
// //       text-transform: uppercase;
// //       letter-spacing: 0.05em;
// //     }
// //     .border-top {
// //       border-top: 1px solid var(--border-primary);
// //     }

// //     /* Overrides for Inputs to match Premium theme */
// //     ::ng-deep .premium-select .p-select,
// //     ::ng-deep .premium-datepicker .p-datepicker .p-inputtext {
// //       background: var(--bg-primary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-md);
// //       transition: var(--transition-base);
// //     }
// //     ::ng-deep .premium-select .p-select:not(.p-disabled):hover,
// //     ::ng-deep .premium-datepicker .p-datepicker .p-inputtext:not(.p-disabled):hover {
// //       border-color: var(--color-primary);
// //     }

// //     /* Results Area */
// //     .result-title {
// //       font-family: var(--font-heading);
// //       font-size: var(--font-size-lg);
// //       font-weight: var(--font-weight-bold);
// //       margin: 0 0 var(--spacing-lg) 0;
// //       padding-top: var(--spacing-xl);
// //       border-top: 1px dashed var(--border-secondary);
// //     }

// //     .result-box {
// //       display: flex;
// //       gap: var(--spacing-xl);
// //       padding: var(--spacing-xl);
// //       border-radius: var(--ui-border-radius-lg);
// //       border: 1px solid var(--border-primary);
// //       background: var(--bg-primary);
// //     }
// //     .success-box { border-left: 4px solid var(--color-success); }
// //     .error-box { border-left: 4px solid var(--color-error); }

// //     .result-icon {
// //       width: 40px; height: 40px; flex-shrink: 0;
// //       border-radius: 50%;
// //       display: flex; align-items: center; justify-content: center;
// //       font-size: var(--font-size-xl);
// //     }
// //     .bg-success-light { background: var(--color-success-bg, #ecfdf5); }
// //     .bg-error-light { background: var(--color-error-bg, #fef2f2); }

// //     .conflict-list {
// //       list-style: none;
// //       padding: 0; margin: 0;
// //       display: flex; flex-direction: column; gap: var(--spacing-md);
// //     }
// //     .conflict-list li {
// //       display: flex; align-items: flex-start; gap: var(--spacing-sm);
// //       font-size: var(--font-size-sm); color: var(--text-primary);
// //       background: var(--bg-secondary); padding: var(--spacing-md);
// //       border-radius: var(--ui-border-radius-md);
// //       border: 1px solid var(--border-primary);
// //     }

// //     /* Utility */
// //     .glass-card { background: var(--component-bg, var(--bg-secondary)); border: 1px solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); }
// //     .text-error { color: var(--color-error); }
// //     .text-success { color: var(--color-success); }
// //     .text-tertiary { color: var(--text-tertiary); }
// //     .text-secondary { color: var(--text-secondary); }
// //     .text-normal { text-transform: none; letter-spacing: normal; }
// //     .w-full { width: 100%; }
// //     .flex-align { display: flex; align-items: center; }
// //     .flex-col { display: flex; flex-direction: column; }
// //     .gap-2 { gap: var(--spacing-sm); }
// //     .mb-1 { margin-bottom: var(--spacing-xs); }
// //     .mb-2 { margin-bottom: var(--spacing-sm); }
// //     .mb-3 { margin-bottom: var(--spacing-md); }
// //     .mb-4 { margin-bottom: var(--spacing-xl); }
// //     .mt-1 { margin-top: var(--spacing-xs); }
// //     .mt-4 { margin-top: var(--spacing-xl); }
// //     .mt-5 { margin-top: var(--spacing-2xl); }
// //     .pt-4 { padding-top: var(--spacing-xl); }
    
// //     /* Animations */
// //     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// //     @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
// //     .fade-in { animation: fadeIn 0.3s cubic-bezier(0.2, 0.9, 0.2, 1); }
// //     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
// //   `]
// // })
// // export class ShiftValidatorComponent implements OnInit {
// //   private fb = inject(FormBuilder);
// //   private hrmsService = inject(HRMSService);
// //   private messageService = inject(AppMessageService);

// //   // State
// //   validationForm!: FormGroup;
// //   isValidating = signal<boolean>(false);
// //   validationResult = signal<any | null>(null);

// //   // Mock Data (Replace with real API calls if available)
// //   mockEmployees = [
// //     { id: '698f1a7feff3e811b71a5910', name: 'Mukesh Singh', code: 'EMP-001' },
// //     { id: 'usr_002', name: 'Sarah Jenkins', code: 'EMP-002' },
// //     { id: 'usr_003', name: 'David Chen', code: 'EMP-003' }
// //   ];

// //   mockShifts = [
// //     { id: 'shf_morning', name: 'Morning Shift', time: '08:00 AM - 04:00 PM' },
// //     { id: 'shf_evening', name: 'Evening Shift', time: '04:00 PM - 12:00 AM' },
// //     { id: 'shf_night', name: 'Night Shift', time: '12:00 AM - 08:00 AM' }
// //   ];

// //   ngOnInit() {
// //     this.initForm();
// //   }

// //   private initForm() {
// //     this.validationForm = this.fb.group({
// //       userId: [null, Validators.required],
// //       shiftId: [null, Validators.required],
// //       date: [null]
// //     });
// //   }

// //   runValidation() {
// //     if (this.validationForm.invalid) return;

// //     this.isValidating.set(true);
// //     this.validationResult.set(null);

// //     const formData = this.validationForm.value;

// //     // Formatting the date if it exists before sending to API
// //     const payload = {
// //       shiftId: formData.shiftId,
// //       userId: formData.userId,
// //       ...(formData.date && { date: formData.date })
// //     };

// //     this.hrmsService.validateShiftAssignment(payload).pipe(
// //       catchError(error => {
// //         this.messageService.add({ severity: 'error', summary: 'Server Error', detail: 'Could not complete validation check.' });
// //         // Mocking an error response structurally for UI demonstration
// //         return of({
// //           status: 'error',
// //           data: { isValid: false, conflicts: ['Employee already assigned to an overlapping shift.', 'Exceeds maximum allowed 40 hours per week.'] }
// //         });
// //       }),
// //       finalize(() => this.isValidating.set(false))
// //     ).subscribe((response: any) => {
// //       // Assuming successful response structure maps closely to this
// //       // If the API just returns success with no conflicts array, we manually map it.
// //       if (response.status === 'success') {
// //         this.validationResult.set({ isValid: true, conflicts: [] });
// //         this.messageService.add({ severity: 'success', summary: 'Check Complete', detail: 'Validation completed successfully.' });
// //       } else {
// //         this.validationResult.set(response.data);
// //       }
// //     });
// //   }

// //   resetForm() {
// //     this.validationForm.reset();
// //     this.validationResult.set(null);
// //   }
// // }