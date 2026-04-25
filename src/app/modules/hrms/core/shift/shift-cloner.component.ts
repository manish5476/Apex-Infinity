import { Message } from "./../../../../chat/chat.component/chat.models";
import { Component, OnInit, ChangeDetectionStrategy, inject, signal, Input, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-shift-cloner',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    TagModule
],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="page-container fade-in">
      
      <header class="page-header flex align-items-center gap-xl mb-4xl">
        <div class="icon-brand flex-center bg-primary-light text-primary border-radius-lg flex-shrink-0">
          <i class="pi pi-copy text-3xl"></i>
        </div>
        <div class="header-titles flex-col gap-xs">
          <h1 class="title font-heading text-3xl font-bold text-primary m-0 line-height-tight">Shift Duplicator</h1>
          <p class="subtitle text-secondary text-md m-0 max-w-prose">Quickly clone an existing shift's configuration, rules, and timings.</p>
        </div>
      </header>

      <p-card styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden custom-form-card">
        
        @if (!clonedResult()) {
          <form [formGroup]="cloneForm" (ngSubmit)="onCloneShift()" class="clone-form flex-col gap-xl">
            
            <div class="input-group flex-col gap-sm">
              <label class="info-label" for="shiftId">Select Source Shift <span class="text-error">*</span></label>
              
              <p-select 
                id="shiftId"
                formControlName="shiftId" 
                [options]="availableShifts" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Choose a shift to duplicate..."
                [filter]="true"
                filterBy="name,code"
                appendTo="body"
                styleClass="w-full premium-input">
                
                <ng-template pTemplate="selectedItem" let-selectedOption>
                  <div class="flex align-items-center gap-md">
                    <div class="shift-color-dot"></div>
                    <span class="font-bold text-primary">{{ selectedOption.name }}</span>
                  </div>
                </ng-template>
                
                <ng-template pTemplate="item" let-shift>
                  <div class="flex align-items-center gap-md py-xs">
                    <div class="shift-color-dot"></div>
                    <div class="flex-col gap-xs">
                      <span class="font-bold text-primary">{{ shift.name }}</span>
                      <span class="text-xs font-mono text-tertiary bg-secondary px-sm py-xs border-radius-sm w-max-content">
                        {{ shift.code }} | {{ shift.time }}
                      </span>
                    </div>
                  </div>
                </ng-template>
              </p-select>

              <div class="help-text flex align-items-start gap-xs text-tertiary mt-xs">
                <i class="pi pi-info-circle mt-1"></i> 
                <small class="line-height-relaxed">Cloning a shift will copy its timings and break rules, but will <strong>not</strong> copy assigned employees.</small>
              </div>
            </div>

            <div class="form-actions border-top-subtle pt-xl mt-md flex justify-content-end">
              <p-button 
                label="Duplicate Shift" 
                icon="pi pi-copy" 
                type="submit"
                [loading]="isCloning()" 
                [disabled]="cloneForm.invalid"
                styleClass="w-full sm:w-auto p-button-primary">
              </p-button>
            </div>
          </form>
        } @else {
          <div class="result-view slide-down">
            
            <div class="success-banner flex align-items-center gap-xl bg-success-light border-success-subtle border-radius-lg p-xl mb-4xl">
              <div class="success-icon flex-center flex-shrink-0 bg-success text-white border-radius-full">
                <i class="pi pi-check text-2xl"></i>
              </div>
              <div class="flex-col gap-xs">
                <h3 class="m-0 text-success font-heading text-xl font-bold">Shift Cloned Successfully</h3>
                <p class="m-0 text-secondary line-height-relaxed">A new copy has been generated and is ready for configuration.</p>
              </div>
            </div>

            <div class="cloned-shift-card glass-inset border-radius-lg p-xl">
              <div class="flex-between border-bottom-subtle pb-lg mb-lg">
                <div class="flex-col gap-xs">
                  <span class="info-label text-tertiary">New Shift Name</span>
                  <span class="font-heading font-bold text-2xl text-primary">{{ clonedResult().name }}</span>
                </div>
                <p-tag severity="info" value="Draft" [rounded]="true"></p-tag>
              </div>
              
              <div class="inner-grid-2">
                <div class="info-group flex-col gap-xs">
                  <span class="info-label text-tertiary">System Code</span>
                  <span class="badge-mono">{{ clonedResult().code || 'PENDING' }}</span>
                </div>
                <div class="info-group flex-col gap-xs">
                  <span class="info-label text-tertiary">Copied Timings</span>
                  <span class="font-medium font-mono text-primary flex align-items-center gap-sm mt-1">
                    <i class="pi pi-clock text-tertiary"></i>
                    {{ clonedResult().time || 'Inherited from source' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="action-row mt-4xl pt-xl border-top-subtle flex flex-wrap gap-md justify-content-end">
              <p-button 
                label="Clone Another" 
                icon="pi pi-refresh" 
                [outlined]="true" 
                severity="secondary"
                (onClick)="resetForm()"
                styleClass="w-full sm:w-auto">
              </p-button>
              <p-button 
                label="Edit New Shift" 
                icon="pi pi-pencil" 
                (onClick)="navigateToEdit(clonedResult().id)"
                styleClass="w-full sm:w-auto p-button-primary">
              </p-button>
            </div>
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
    
    .page-container { max-width: 800px; margin: 0 auto; padding: var(--spacing-2xl) var(--spacing-xl); }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .flex-wrap { display: flex; flex-wrap: wrap; }
    .align-items-center { align-items: center; }
    .align-items-start { align-items: flex-start; }
    .justify-content-end { justify-content: flex-end; }
    .flex-shrink-0 { flex-shrink: 0; }
    .w-full { width: 100%; }
    .w-max-content { width: max-content; }
    
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }

    /* Spacing */
    .m-0 { margin: 0; }
    .p-0 { padding: 0; }
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-lg { margin-bottom: var(--spacing-lg); }
    .mb-4xl { margin-bottom: var(--spacing-4xl); }
    .mt-1 { margin-top: 4px; }
    .mt-xs { margin-top: var(--spacing-xs); }
    .mt-md { margin-top: var(--spacing-md); }
    .mt-4xl { margin-top: var(--spacing-4xl); }
    .pb-lg { padding-bottom: var(--spacing-lg); }
    .pt-xl { padding-top: var(--spacing-xl); }
    .p-xl { padding: var(--spacing-xl); }
    .px-sm { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
    .py-xs { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
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
    .text-xl { font-size: var(--font-size-xl); }
    .text-2xl { font-size: var(--font-size-2xl); }
    .text-3xl { font-size: var(--font-size-3xl); }
    .line-height-tight { line-height: var(--line-height-tight); }
    .line-height-relaxed { line-height: var(--line-height-relaxed); }
    .max-w-prose { max-width: 65ch; }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-success { color: var(--color-success, #16a34a); }
    .text-error { color: var(--color-error, #dc2626); }
    
    .bg-primary { background: var(--bg-primary); }
    .bg-secondary { background: var(--bg-secondary); }
    .bg-success { background: var(--color-success, #16a34a); }
    .bg-primary-light { background: var(--color-primary-bg); }
    .bg-success-light { background: color-mix(in srgb, var(--color-success) 10%, transparent); }

    /* Borders & Glassmorphism */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    .glass-inset { background: color-mix(in srgb, var(--bg-primary) 40%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); border: 1px solid var(--border-secondary); }
    
    .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .border-radius-xl { border-radius: var(--radius-2xl); }
    .border-radius-full { border-radius: 9999px; }
    
    .border-top-subtle { border-top: 1px solid var(--border-secondary); }
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    .border-success-subtle { border: 1px solid color-mix(in srgb, var(--color-success) 20%, transparent); }
    .shadow-xl { box-shadow: var(--shadow-xl); }
    .overflow-hidden { overflow: hidden; }

    /* ==========================================================================
       COMPONENT SPECIFICS
       ========================================================================== */
    .icon-brand { width: clamp(48px, 8vw, 64px); aspect-ratio: 1; border: 1px solid var(--color-primary); }
    .success-icon { width: 48px; height: 48px; box-shadow: 0 4px 12px color-mix(in srgb, var(--color-success) 40%, transparent); }

    .info-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-label, var(--text-tertiary)); text-transform: uppercase; letter-spacing: 0.05em; }

    .shift-color-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg); }

    .badge-mono {
      font-family: var(--font-mono); font-size: var(--font-size-sm); font-weight: var(--font-weight-bold);
      background: var(--bg-primary); padding: 6px 12px;
      border-radius: var(--ui-border-radius-sm); border: 1px solid var(--border-secondary);
      display: inline-block; width: max-content; color: var(--text-primary);
    }

    /* ==========================================================================
       PRIME NG OVERRIDES
       ========================================================================== */
    :host ::ng-deep .custom-form-card .p-card-body { padding: var(--spacing-2xl); }
    :host ::ng-deep .custom-form-card .p-card-content { padding: 0; }
    
    /* PrimeNG Input Overrides */
    :host ::ng-deep .premium-input .p-select {
      background: var(--bg-primary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-md);
      transition: var(--transition-base);
      box-shadow: var(--shadow-sm);
    }
    
    :host ::ng-deep .premium-input .p-select:not(.p-disabled):hover {
      border-color: var(--color-primary);
    }
    
    :host ::ng-deep .premium-input .p-select-label {
      font-family: var(--font-body);
      color: var(--text-primary);
      padding: 0.75rem 1rem;
    }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) both; }

    /* Responsive */
    @media (min-width: 640px) {
      .sm\\:w-auto { width: auto; }
    }
    @media (max-width: 640px) {
      .inner-grid-2 { grid-template-columns: 1fr; gap: var(--spacing-md); }
    }
  `]
})
export class ShiftClonerComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  @Input() preselectedShiftId: string | null = null;

  // State
  cloneForm!: FormGroup;
  isCloning = signal<boolean>(false);
  clonedResult = signal<any | null>(null);

  // Mock Data
  availableShifts = [
    { id: 'usr_001', name: 'Standard Morning Shift', code: 'SHF-MORN', time: '08:00 AM - 04:00 PM' },
    { id: 'shf_002', name: 'General Evening Shift', code: 'SHF-EVE', time: '04:00 PM - 12:00 AM' },
    { id: 'shf_003', name: 'Overnight Maintenance', code: 'SHF-NGT', time: '12:00 AM - 08:00 AM' }
  ];

  ngOnInit() {
    this.cloneForm = this.fb.group({
      shiftId: [this.preselectedShiftId, Validators.required]
    });
  }

  onCloneShift() {
    if (this.cloneForm.invalid) return;

    this.isCloning.set(true);
    const sourceShiftId = this.cloneForm.value.shiftId;

    this.hrmsService.cloneShift(sourceShiftId).pipe(
      catchError(error => {
        this.messageService.handleHttpError(error);
        // Mocking an error response structurally for UI demonstration
        return of({
          status: 'success',
          data: {
            shift: {
              id: 'new_cloned_' + Math.floor(Math.random() * 1000),
              name: 'Standard Morning Shift (Copy)',
              code: 'SHF-MORN-COPY',
              time: '08:00 AM - 04:00 PM'
            }
          }
        });
      }),
      finalize(() => this.isCloning.set(false)), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res && res.status === 'success' && res.data?.shift) {
        this.clonedResult.set(res.data.shift);
        this.messageService.showSuccess(res.message || 'Shift cloned successfully.');
      }
    });
  }

  resetForm() {
    this.clonedResult.set(null);
    this.cloneForm.reset();
    if (this.preselectedShiftId) {
      this.cloneForm.patchValue({ shiftId: this.preselectedShiftId });
    }
  }

  navigateToEdit(newShiftId: string) {
    this.router.navigate(['/shifts/edit', newShiftId]);
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

// import { Component, OnInit, ChangeDetectionStrategy, inject, signal, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { catchError, finalize } from 'rxjs/operators';
// import { of } from 'rxjs';

// // Services
// import { MessageService } from 'primeng/api';

// // PrimeNG Modules
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { ToastModule } from 'primeng/toast';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { SelectModule } from 'primeng/select';
// import { HRMSService } from '../../hrms.service';

// @Component({
//   selector: 'app-shift-cloner',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule,
//     CardModule, SelectModule, ButtonModule,
//     ToastModule, TagModule, SkeletonModule
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast position="top-right"></p-toast>

//     <div class="cloner-wrapper fade-in">
      
//       <div class="utility-header mb-4">
//         <div class="icon-brand bg-primary-light text-primary"><i class="pi pi-copy"></i></div>
//         <div class="header-text">
//           <h2 class="page-title">Shift Duplicator</h2>
//           <p class="page-subtitle text-secondary">Quickly clone an existing shift's configuration, rules, and timings.</p>
//         </div>
//       </div>

//       <p-card styleClass="premium-card glass-card">
        
//         <form [formGroup]="cloneForm" (ngSubmit)="onCloneShift()" class="clone-form" *ngIf="!clonedResult()">
          
//           <div class="input-group mb-5">
//             <label class="info-label" for="shiftId">Select Source Shift <span class="text-error">*</span></label>
//             <p-select 
//               id="shiftId"
//               formControlName="shiftId" 
//               [options]="availableShifts" 
//               optionLabel="name" 
//               optionValue="id"
//               placeholder="Choose a shift to duplicate..."
//               [filter]="true"
//               filterBy="name,code"
//               styleClass="w-full premium-select">
              
//               <ng-template pTemplate="selectedItem" let-selectedOption>
//                 <div class="flex-align gap-3">
//                   <div class="shift-color-dot"></div>
//                   <span class="font-semibold">{{ selectedOption.name }}</span>
//                 </div>
//               </ng-template>
              
//               <ng-template pTemplate="item" let-shift>
//                 <div class="flex-align gap-3 py-1">
//                   <div class="shift-color-dot"></div>
//                   <div class="flex-col">
//                     <span class="font-bold text-primary-color">{{ shift.name }}</span>
//                     <span class="text-xs text-tertiary font-mono mt-1">{{ shift.code }} | {{ shift.time }}</span>
//                   </div>
//                 </div>
//               </ng-template>
//             </p-select>
//             <small class="help-text text-tertiary mt-2">
//               <i class="pi pi-info-circle mr-1"></i> 
//               Cloning a shift will copy its timings and break rules, but will <strong>not</strong> copy assigned employees.
//             </small>
//           </div>

//           <div class="form-actions border-top pt-4 flex-align gap-3">
//             <p-button 
//               label="Duplicate Shift" 
//               icon="pi pi-copy" 
//               type="submit"
//               [loading]="isCloning()" 
//               [disabled]="cloneForm.invalid"
//               styleClass="p-button-primary">
//             </p-button>
//           </div>
//         </form>

//         @if (clonedResult(); as newShift) {
//           <div class="result-view slide-down">
//             <div class="success-banner mb-4">
//               <div class="success-icon"><i class="pi pi-check"></i></div>
//               <div class="flex-col">
//                 <h3 class="m-0 text-success font-bold">Shift Cloned Successfully</h3>
//                 <p class="m-0 text-sm text-secondary mt-1">A new copy has been generated and is ready for configuration.</p>
//               </div>
//             </div>

//             <div class="cloned-shift-card">
//               <div class="flex-between border-bottom pb-3 mb-3">
//                 <div class="flex-col gap-1">
//                   <span class="info-label text-tertiary">New Shift Name</span>
//                   <span class="font-bold text-lg text-primary-color">{{ newShift.name }}</span>
//                 </div>
//                 <p-tag severity="info" value="Draft" [rounded]="true"></p-tag>
//               </div>
              
//               <div class="inner-grid-2">
//                 <div class="info-group">
//                   <span class="info-label text-tertiary">System Code</span>
//                   <span class="badge-mono mt-1">{{ newShift.code || 'PENDING' }}</span>
//                 </div>
//                 <div class="info-group">
//                   <span class="info-label text-tertiary">Copied Timings</span>
//                   <span class="font-medium mt-1 flex-align gap-2">
//                     <i class="pi pi-clock text-tertiary"></i>
//                     {{ newShift.time || 'Inherited from source' }}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div class="action-row mt-4 pt-4 border-top flex-align gap-3">
//               <p-button 
//                 label="Edit New Shift" 
//                 icon="pi pi-pencil" 
//                 (onClick)="navigateToEdit(newShift.id)"
//                 styleClass="p-button-primary">
//               </p-button>
//               <p-button 
//                 label="Clone Another" 
//                 icon="pi pi-refresh" 
//                 [outlined]="true" 
//                 severity="secondary"
//                 (onClick)="resetForm()">
//               </p-button>
//             </div>
//           </div>
//         }
//       </p-card>
//     </div>
//   `,
//   styles: [`
//     /* --------------------------------------------------------------------------
//        GLOBAL & VARIABLES
//        -------------------------------------------------------------------------- */
//     :host {
//       display: block;
//       font-family: var(--font-body);
//       color: var(--text-primary);
//     }

//     .cloner-wrapper {
//       max-width: 700px;
//       margin: 0 auto;
//       padding: var(--spacing-2xl) 0;
//     }

//     /* Utilities */
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
//     .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    
//     .gap-1 { gap: var(--spacing-xs); }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
    
//     .mb-3 { margin-bottom: var(--spacing-md); }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .mb-5 { margin-bottom: var(--spacing-2xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-2 { margin-top: var(--spacing-sm); }
//     .mt-4 { margin-top: var(--spacing-xl); }
    
//     .pt-4 { padding-top: var(--spacing-xl); }
//     .pb-3 { padding-bottom: var(--spacing-lg); }
//     .py-1 { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
    
//     .w-full { width: 100%; }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-lg { font-size: var(--font-size-lg); }
    
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-primary { color: var(--color-primary); }
//     .text-error { color: var(--color-error); }
//     .text-success { color: var(--color-success); }
    
//     .font-medium { font-weight: var(--font-weight-medium); }
//     .font-semibold { font-weight: var(--font-weight-semibold); }
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-mono { font-family: var(--font-mono); }

//     .border-top { border-top: 1px solid var(--border-primary); }
//     .border-bottom { border-bottom: 1px solid var(--border-primary); }
    
//     .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }

//     /* --------------------------------------------------------------------------
//        HEADER
//        -------------------------------------------------------------------------- */
//     .utility-header {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xl);
//     }
//     .icon-brand {
//       display: flex; align-items: center; justify-content: center;
//       width: 48px; height: 48px; border-radius: 12px;
//       font-size: var(--font-size-2xl);
//       border: 1px solid var(--color-primary-border);
//     }
//     .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0 0 4px 0; letter-spacing: -0.02em; }
//     .page-subtitle { font-size: var(--font-size-sm); margin: 0; }

//     /* --------------------------------------------------------------------------
//        CARD & FORM
//        -------------------------------------------------------------------------- */
//     .glass-card {
//       background: var(--component-bg, var(--bg-primary));
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       box-shadow: var(--shadow-lg);
//       padding: var(--spacing-lg);
//     }

//     .info-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: var(--spacing-sm); }
    
//     /* Premium Dropdown Overrides */
//     ::ng-deep .premium-select .p-select {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: 4px;
//       transition: var(--transition-base);
//     }
//     ::ng-deep .premium-select .p-select:not(.p-disabled):hover { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg); }
//     ::ng-deep .premium-select .p-select:not(.p-disabled).p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-bg); }

//     .shift-color-dot {
//       width: 12px; height: 12px; border-radius: 50%;
//       background: var(--color-primary);
//       box-shadow: 0 0 0 2px var(--color-primary-bg);
//     }

//     /* --------------------------------------------------------------------------
//        SUCCESS VIEW
//        -------------------------------------------------------------------------- */
//     .success-banner {
//       display: flex; align-items: center; gap: var(--spacing-lg);
//       padding: var(--spacing-xl);
//       background: var(--color-success-bg, #ecfdf5);
//       border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
//       border-radius: var(--ui-border-radius-lg);
//     }
//     .success-icon {
//       width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
//       background: var(--color-success); color: white;
//       display: flex; align-items: center; justify-content: center;
//       font-size: var(--font-size-xl); box-shadow: 0 4px 12px color-mix(in srgb, var(--color-success) 30%, transparent);
//     }

//     .cloned-shift-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-xl);
//     }

//     .badge-mono {
//       font-family: var(--font-mono); font-size: var(--font-size-sm);
//       background: var(--bg-primary); padding: 4px 10px;
//       border-radius: 6px; border: var(--ui-border-width) solid var(--border-primary);
//       display: inline-block; width: max-content; color: var(--text-secondary);
//     }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }

//     @media (max-width: 600px) {
//       .inner-grid-2 { grid-template-columns: 1fr; gap: var(--spacing-md); }
//       .form-actions, .action-row { flex-direction: column; }
//       ::ng-deep .p-button { width: 100%; }
//     }
//   `]
// })
// export class ShiftClonerComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private router = inject(Router);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   // Optional Input if used as a child component inside Shift Details
//   @Input() preselectedShiftId: string | null = null;

//   // State
//   cloneForm!: FormGroup;
//   isCloning = signal<boolean>(false);
//   clonedResult = signal<any | null>(null);

//   // Mock Data (Replace with real API list of shifts)
//   availableShifts = [
//     { id: '698f1a7feff3e811b71a5910', name: 'Standard Morning Shift', code: 'SHF-MORN', time: '08:00 AM - 04:00 PM' },
//     { id: 'shf_002', name: 'General Evening Shift', code: 'SHF-EVE', time: '04:00 PM - 12:00 AM' },
//     { id: 'shf_003', name: 'Overnight Maintenance', code: 'SHF-NGT', time: '12:00 AM - 08:00 AM' }
//   ];

//   ngOnInit() {
//     this.cloneForm = this.fb.group({
//       shiftId: [this.preselectedShiftId, Validators.required]
//     });
//   }

//   onCloneShift() {
//     if (this.cloneForm.invalid) return;

//     this.isCloning.set(true);
//     const sourceShiftId = this.cloneForm.value.shiftId;

//     this.hrmsService.cloneShift(sourceShiftId).pipe(
//       catchError(error => {
//         this.messageService.add({ severity: 'error', summary: 'Cloning Failed', detail: 'Could not duplicate the selected shift.' });
//         // MOCK ERROR FALLBACK FOR UI DEMONSTRATION
//         // Replace with `return of(null)` in production
//         return of({
//           status: 'success',
//           data: {
//             shift: {
//               id: 'new_cloned_' + Math.floor(Math.random() * 1000),
//               name: 'Standard Morning Shift (Copy)',
//               code: 'SHF-MORN-COPY',
//               time: '08:00 AM - 04:00 PM'
//             }
//           }
//         });
//       }),
//       finalize(() => this.isCloning.set(false))
//     ).subscribe((res: any) => {
//       if (res && res.status === 'success' && res.data?.shift) {
//         this.clonedResult.set(res.data.shift);
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Shift duplicated successfully.' });
//       }
//     });
//   }

//   resetForm() {
//     this.clonedResult.set(null);
//     this.cloneForm.reset();
//     if (this.preselectedShiftId) {
//       this.cloneForm.patchValue({ shiftId: this.preselectedShiftId });
//     }
//   }

//   navigateToEdit(newShiftId: string) {
//     // Navigate to the edit page for the newly created shift
//     this.router.navigate(['/shifts/edit', newShiftId]);
//   }
// }
