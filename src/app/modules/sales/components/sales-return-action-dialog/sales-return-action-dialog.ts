import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { finalize, takeUntil } from 'rxjs/operators';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

// Services
import { SalesReturnService, RejectSalesReturnPayload } from '../../../../core/services/sales.return.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { Subject } from "rxjs";

@Component({
  selector: 'app-sales-return-action-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule
],
  template: `
    <div class="action-dialog-wrapper">
      
      <!-- Header -->
      <div class="dialog-header">
        <div class="icon-circle" [class.is-approve]="actionType === 'approve'" [class.is-reject]="actionType === 'reject'">
          @if (actionType === 'approve') {
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          }
        </div>
        <div class="header-text">
          <h2 class="title">{{ actionType === 'approve' ? 'Approve Return' : 'Reject Return' }}</h2>
          <p class="subtitle">
            Confirming action for Return <strong class="badge-highlight">{{ returnNumber }}</strong>
          </p>
        </div>
      </div>

      <!-- Body -->
      <div class="dialog-body">
        
        @if (actionType === 'approve') {
          <!-- Approval Confirmation Box Context -->
          <div class="approval-confirmation animate-fade-in mb-4">
            <div class="info-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <p class="confirmation-text">
              Are you sure you want to approve this sales return? This action will finalize the return process and update the inventory and accounts accordingly.
            </p>
          </div>
        }

        <!-- Action Form (Now used for both Approve and Reject) -->
        <form [formGroup]="actionForm" class="reason-form animate-fade-in">
          <label class="input-label">
            {{ actionType === 'approve' ? 'Reason for Approval' : 'Reason for Rejection' }} <span class="text-error">*</span>
          </label>
          <textarea 
            formControlName="reason" 
            rows="4" 
            class="modern-textarea"
            [class.focus-approve]="actionType === 'approve'"
            [class.focus-reject]="actionType === 'reject'"
            [placeholder]="actionType === 'approve' ? 'Please provide notes for approving this return...' : 'Please provide a brief explanation for rejecting this return...'"
          ></textarea>
          
          @if (actionForm.get('reason')?.invalid && actionForm.get('reason')?.touched) {
            <div class="error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ actionType === 'approve' ? 'Approval' : 'Rejection' }} reason is required.
            </div>
          }
        </form>
      </div>

      <!-- Footer Actions -->
      <div class="dialog-footer">
        <button type="button" class="btn-cancel" (click)="cancel()">
          Cancel
        </button>
        <button 
          type="button" 
          class="btn-confirm" 
          [class.btn-success]="actionType === 'approve'" 
          [class.btn-danger]="actionType === 'reject'"
          [disabled]="isSubmitting() || actionForm.invalid"
          (click)="confirm()"
        >
          @if (isSubmitting()) {
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Processing...
          } @else {
            {{ actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection' }}
          }
        </button>
      </div>

    </div>
  `,
  styles: [`
    /* ==========================================================================
       PURE TOKEN UI - ACTION DIALOG
       ========================================================================== */

    .action-dialog-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3xl);
      padding: var(--spacing-xl);
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    /* --- Header --- */
    .dialog-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
      padding-bottom: var(--spacing-2xl);
      border-bottom: var(--ui-border-width) solid var(--component-divider);
    }

    .icon-circle {
      width: 52px;
      height: 52px;
      border-radius: var(--ui-border-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #ffffff;
      box-shadow: var(--elevation-1);
    }

    .is-approve {
      background: var(--color-success);
      box-shadow: 0 4px 16px var(--color-success-bg);
    }

    .is-reject {
      background: var(--color-error);
      box-shadow: 0 4px 16px var(--color-error-bg);
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .title {
      margin: 0;
      font-family: var(--font-heading);
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.01em;
    }

    .subtitle {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .badge-highlight {
      color: var(--text-primary);
      background: var(--bg-ternary);
      padding: 0 var(--spacing-sm);
      border-radius: var(--ui-border-radius-sm);
      border: var(--ui-border-width) solid var(--component-divider);
      font-family: var(--font-mono);
    }

    /* --- Body --- */
    .dialog-body {
      display: flex;
      flex-direction: column;
      min-height: 120px;
    }

    .reason-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }
    
    .mb-4 {
      margin-bottom: var(--spacing-xl);
    }

    .input-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .text-error {
      color: var(--color-error);
    }

    .modern-textarea {
      width: 100%;
      background: var(--bg-ternary);
      border: var(--ui-border-width) solid var(--component-border);
      color: var(--text-primary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-lg);
      font-size: var(--font-size-sm);
      font-family: var(--font-body);
      transition: var(--transition-base);
      resize: none;
      outline: none;
    }

    .modern-textarea.focus-approve:focus {
      border-color: var(--color-success);
      box-shadow: 0 0 0 var(--focus-ring-width) var(--color-success-bg);
    }

    .modern-textarea.focus-reject:focus {
      border-color: var(--color-error); 
      box-shadow: 0 0 0 var(--focus-ring-width) var(--color-error-bg);
    }

    .modern-textarea::placeholder {
      color: var(--text-muted);
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--color-error);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      background: var(--color-error-bg);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--ui-border-radius-sm);
    }

    .approval-confirmation {
      display: flex;
      gap: var(--spacing-lg);
      background: var(--color-info-bg);
      border: var(--ui-border-width) solid var(--color-info-border);
      padding: var(--spacing-xl);
      border-radius: var(--ui-border-radius-lg);
      color: var(--color-info-light);
    }

    .info-icon {
      flex-shrink: 0;
      color: var(--color-info);
    }

    .confirmation-text {
      margin: 0;
      font-size: var(--font-size-sm);
      line-height: var(--line-height-relaxed);
    }

    /* --- Footer --- */
    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-md);
      padding-top: var(--spacing-2xl);
      border-top: var(--ui-border-width) solid var(--component-divider);
    }

    .btn-cancel {
      background: transparent;
      color: var(--text-secondary);
      border: none;
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-md) var(--spacing-xl);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: var(--transition-fast);
    }

    .btn-cancel:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .btn-confirm {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      border: none;
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-md) var(--spacing-2xl);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      color: #ffffff;
      cursor: pointer;
      box-shadow: var(--elevation-1);
      transition: var(--transition-base);
    }

    .btn-success { background: var(--color-success); }
    .btn-success:not(:disabled):hover { background: var(--color-success-dark); box-shadow: var(--elevation-2); transform: translateY(-1px); }
    
    .btn-danger { background: var(--color-error); }
    .btn-danger:not(:disabled):hover { background: var(--color-error-dark); box-shadow: var(--elevation-2); transform: translateY(-1px); }

    .btn-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* --- Utilities --- */
    .spinner {
      width: 16px;
      height: 16px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SalesReturnActionDialogComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private fb = inject(FormBuilder);
  private salesReturnService = inject(SalesReturnService);
  private messageService = inject(AppMessageService);

  // States
  isSubmitting = signal(false);
  actionType: 'approve' | 'reject' = 'approve';
  returnId: string = '';
  returnNumber: string = '';
  
  actionForm: FormGroup;

  constructor() {
    this.actionForm = this.fb.group({
      reason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const data = this.config.data;
    if (data) {
      this.actionType = data.actionType || 'approve';
      this.returnId = data.returnId;
      this.returnNumber = data.returnNumber;
    } else {
      this.ref.close();
    }
  }

  confirm(): void {
    if (this.actionForm.invalid) {
      this.actionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    if (this.actionType === 'approve') {
      const payload = { reason: this.actionForm.value.reason };
      
      // Update this service call if your backend specifically requires a different payload key for approvals
      this.salesReturnService.approveReturn(this.returnId, payload)
        .pipe(finalize(() => this.isSubmitting.set(false)), takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.showSuccess(`Return ${this.returnNumber} approved successfully`);
            this.ref.close(true);
          },
          error: (err: any) => this.messageService.handleHttpError(err)
        });
    } else {
      const payload: RejectSalesReturnPayload = {
        rejectionReason: this.actionForm.value.reason
      };
      
      this.salesReturnService.rejectReturn(this.returnId, payload)
        .pipe(finalize(() => this.isSubmitting.set(false)), takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.showSuccess(`Return ${this.returnNumber} rejected`);
            this.ref.close(true);
          },
          error: (err: any) => this.messageService.handleHttpError(err)
        });
    }
  }

  cancel(): void {
    this.ref.close();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
// import { finalize } from 'rxjs/operators';
// import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

// // Services
// import { SalesReturnService, RejectSalesReturnPayload } from '../../../../core/services/sales.return.service';
// import { AppMessageService } from '../../../../core/services/message.service';

// @Component({
//   selector: 'app-sales-return-action-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     FormsModule
//   ],
//   template: `
//     <div class="action-dialog-wrapper">
      
//       <!-- Header -->
//       <div class="dialog-header">
//         <div class="icon-circle" [class.is-approve]="actionType === 'approve'" [class.is-reject]="actionType === 'reject'">
//           @if (actionType === 'approve') {
//             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
//           } @else {
//             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
//           }
//         </div>
//         <div class="header-text">
//           <h2 class="title">{{ actionType === 'approve' ? 'Approve Return' : 'Reject Return' }}</h2>
//           <p class="subtitle">
//             Confirming action for Return <strong class="badge-highlight">{{ returnNumber }}</strong>
//           </p>
//         </div>
//       </div>

//       <!-- Body -->
//       <div class="dialog-body">
//         @if (actionType === 'reject') {
//           <!-- Rejection Form -->
//           <form [formGroup]="actionForm" class="rejection-form animate-fade-in">
//             <label class="input-label">
//               Reason for Rejection <span class="text-error">*</span>
//             </label>
//             <textarea 
//               formControlName="rejectionReason" 
//               rows="4" 
//               class="modern-textarea" 
//               placeholder="Please provide a brief explanation for rejecting this return..."
//             ></textarea>
            
//             @if (actionForm.get('rejectionReason')?.invalid && actionForm.get('rejectionReason')?.touched) {
//               <div class="error-message">
//                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
//                 Rejection reason is required.
//               </div>
//             }
//           </form>
//         } @else {
//           <!-- Approval Confirmation Box -->
//           <div class="approval-confirmation animate-fade-in">
//             <div class="info-icon">
//               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
//             </div>
//             <p class="confirmation-text">
//               Are you sure you want to approve this sales return? This action will finalize the return process and update the inventory and accounts accordingly.
//             </p>
//           </div>
//         }
//       </div>

//       <!-- Footer Actions -->
//       <div class="dialog-footer">
//         <button type="button" class="btn-cancel" (click)="cancel()">
//           Cancel
//         </button>
//         <button 
//           type="button" 
//           class="btn-confirm" 
//           [class.btn-success]="actionType === 'approve'" 
//           [class.btn-danger]="actionType === 'reject'"
//           [disabled]="isSubmitting() || (actionType === 'reject' && actionForm.invalid)"
//           (click)="confirm()"
//         >
//           @if (isSubmitting()) {
//             <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
//             Processing...
//           } @else {
//             {{ actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection' }}
//           }
//         </button>
//       </div>

//     </div>
//   `,
//   styles: [`
//     /* ==========================================================================
//        PURE TOKEN UI - ACTION DIALOG
//        ========================================================================== */

//     .action-dialog-wrapper {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-3xl);
//       padding: var(--spacing-xl);
//       font-family: var(--font-body);
//       color: var(--text-primary);
//     }

//     /* --- Header --- */
//     .dialog-header {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xl);
//       padding-bottom: var(--spacing-2xl);
//       border-bottom: var(--ui-border-width) solid var(--component-divider);
//     }

//     .icon-circle {
//       width: 52px;
//       height: 52px;
//       border-radius: var(--ui-border-radius-lg);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       flex-shrink: 0;
//       color: #ffffff;
//       box-shadow: var(--elevation-1);
//     }

//     .is-approve {
//       background: var(--color-success);
//       box-shadow: 0 4px 16px var(--color-success-bg);
//     }

//     .is-reject {
//       background: var(--color-error);
//       box-shadow: 0 4px 16px var(--color-error-bg);
//     }

//     .header-text {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//     }

//     .title {
//       margin: 0;
//       font-family: var(--font-heading);
//       font-size: var(--font-size-2xl);
//       font-weight: var(--font-weight-bold);
//       letter-spacing: -0.01em;
//     }

//     .subtitle {
//       margin: 0;
//       font-size: var(--font-size-sm);
//       color: var(--text-secondary);
//     }

//     .badge-highlight {
//       color: var(--text-primary);
//       background: var(--bg-ternary);
//       padding: 0 var(--spacing-sm);
//       border-radius: var(--ui-border-radius-sm);
//       border: var(--ui-border-width) solid var(--component-divider);
//       font-family: var(--font-mono);
//     }

//     /* --- Body --- */
//     .dialog-body {
//       display: flex;
//       flex-direction: column;
//       min-height: 120px;
//     }

//     .rejection-form {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-md);
//     }

//     .input-label {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-secondary);
//     }

//     .text-error {
//       color: var(--color-error);
//     }

//     .modern-textarea {
//       width: 100%;
//       background: var(--bg-ternary);
//       border: var(--ui-border-width) solid var(--component-border);
//       color: var(--text-primary);
//       border-radius: var(--ui-border-radius);
//       padding: var(--spacing-lg);
//       font-size: var(--font-size-sm);
//       font-family: var(--font-body);
//       transition: var(--transition-base);
//       resize: none;
//       outline: none;
//     }

//     .modern-textarea:focus {
//       border-color: var(--color-error); /* Highlights red since it's a rejection field */
//       box-shadow: 0 0 0 var(--focus-ring-width) var(--color-error-bg);
//     }

//     .modern-textarea::placeholder {
//       color: var(--text-muted);
//     }

//     .error-message {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       color: var(--color-error);
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-semibold);
//       background: var(--color-error-bg);
//       padding: var(--spacing-sm) var(--spacing-md);
//       border-radius: var(--ui-border-radius-sm);
//     }

//     .approval-confirmation {
//       display: flex;
//       gap: var(--spacing-lg);
//       background: var(--color-info-bg);
//       border: var(--ui-border-width) solid var(--color-info-border);
//       padding: var(--spacing-xl);
//       border-radius: var(--ui-border-radius-lg);
//       color: var(--color-info-light);
//     }

//     .info-icon {
//       flex-shrink: 0;
//       color: var(--color-info);
//     }

//     .confirmation-text {
//       margin: 0;
//       font-size: var(--font-size-sm);
//       line-height: var(--line-height-relaxed);
//     }

//     /* --- Footer --- */
//     .dialog-footer {
//       display: flex;
//       align-items: center;
//       justify-content: flex-end;
//       gap: var(--spacing-md);
//       padding-top: var(--spacing-2xl);
//       border-top: var(--ui-border-width) solid var(--component-divider);
//     }

//     .btn-cancel {
//       background: transparent;
//       color: var(--text-secondary);
//       border: none;
//       border-radius: var(--ui-border-radius);
//       padding: var(--spacing-md) var(--spacing-xl);
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-semibold);
//       cursor: pointer;
//       transition: var(--transition-fast);
//     }

//     .btn-cancel:hover {
//       background: var(--bg-hover);
//       color: var(--text-primary);
//     }

//     .btn-confirm {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       border: none;
//       border-radius: var(--ui-border-radius);
//       padding: var(--spacing-md) var(--spacing-2xl);
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-bold);
//       color: #ffffff;
//       cursor: pointer;
//       box-shadow: var(--elevation-1);
//       transition: var(--transition-base);
//     }

//     .btn-success { background: var(--color-success); }
//     .btn-success:not(:disabled):hover { background: var(--color-success-dark); box-shadow: var(--elevation-2); transform: translateY(-1px); }
    
//     .btn-danger { background: var(--color-error); }
//     .btn-danger:not(:disabled):hover { background: var(--color-error-dark); box-shadow: var(--elevation-2); transform: translateY(-1px); }

//     .btn-confirm:disabled {
//       opacity: 0.5;
//       cursor: not-allowed;
//       transform: none;
//     }

//     /* --- Utilities --- */
//     .spinner {
//       width: 16px;
//       height: 16px;
//       animation: spin 1s linear infinite;
//     }
//     @keyframes spin { to { transform: rotate(360deg); } }
    
//     .animate-fade-in {
//       animation: fadeIn 0.3s ease-out forwards;
//     }
//     @keyframes fadeIn {
//       from { opacity: 0; transform: translateY(5px); }
//       to { opacity: 1; transform: translateY(0); }
//     }
//   `]
// })
// export class SalesReturnActionDialogComponent implements OnInit {
//   private config = inject(DynamicDialogConfig);
//   private ref = inject(DynamicDialogRef);
//   private fb = inject(FormBuilder);
//   private salesReturnService = inject(SalesReturnService);
//   private messageService = inject(AppMessageService);

//   // States
//   isSubmitting = signal(false);
//   actionType: 'approve' | 'reject' = 'approve';
//   returnId: string = '';
//   returnNumber: string = '';
  
//   actionForm: FormGroup;

//   constructor() {
//     this.actionForm = this.fb.group({
//       rejectionReason: ['', Validators.required]
//     });
//   }

//   ngOnInit(): void {
//     const data = this.config.data;
//     if (data) {
//       this.actionType = data.actionType || 'approve';
//       this.returnId = data.returnId;
//       this.returnNumber = data.returnNumber;

//       // If approving, remove the requirement for a rejection reason
//       if (this.actionType === 'approve') {
//         this.actionForm.get('rejectionReason')?.clearValidators();
//         this.actionForm.get('rejectionReason')?.updateValueAndValidity();
//       }
//     } else {
//       this.ref.close();
//     }
//   }

//   confirm(): void {
//     if (this.actionType === 'reject' && this.actionForm.invalid) {
//       this.actionForm.markAllAsTouched();
//       return;
//     }

//     this.isSubmitting.set(true);

//     if (this.actionType === 'approve') {
//       this.salesReturnService.approveReturn(this.returnId)
//         .pipe(finalize(() => this.isSubmitting.set(false)))
//         .subscribe({
//           next: () => {
//             this.messageService.showSuccess(`Return ${this.returnNumber} approved successfully`);
//             this.ref.close(true);
//           },
//           error: (err: any) => this.messageService.handleHttpError(err)
//         });
//     } else {
//       const payload: RejectSalesReturnPayload = {
//         rejectionReason: this.actionForm.value.rejectionReason
//       };
      
//       this.salesReturnService.rejectReturn(this.returnId, payload)
//         .pipe(finalize(() => this.isSubmitting.set(false)))
//         .subscribe({
//           next: () => {
//             this.messageService.showSuccess(`Return ${this.returnNumber} rejected`);
//             this.ref.close(true);
//           },
//           error: (err: any) => this.messageService.handleHttpError(err)
//         });
//     }
//   }

//   cancel(): void {
//     this.ref.close();
//   }
// }
// // import { Component, OnInit, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
// // import { finalize } from 'rxjs/operators';
// // import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

// // // PrimeNG
// // import { ButtonModule } from 'primeng/button';
// // import { TextareaModule } from 'primeng/textarea';

// // // Services
// // import { SalesReturnService, RejectSalesReturnPayload } from '@core/services/sales.return.service';
// // import { AppMessageService } from '@core/services/message.service';

// // @Component({
// //   selector: 'app-sales-return-action-dialog',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     ReactiveFormsModule,
// //     FormsModule,
// //     ButtonModule,
// //     TextareaModule
// //   ],
// //   templateUrl: './sales-return-action-dialog.html',
// //   styleUrl: './sales-return-action-dialog.scss'
// // })
// // export class SalesReturnActionDialogComponent implements OnInit {
// //   private config = inject(DynamicDialogConfig);
// //   private ref = inject(DynamicDialogRef);
// //   private fb = inject(FormBuilder);
// //   private salesReturnService = inject(SalesReturnService);
// //   private messageService = inject(AppMessageService);

// //   // States
// //   isSubmitting = signal(false);
// //   actionType: 'approve' | 'reject' = 'approve';
// //   returnId: string = '';
// //   returnNumber: string = '';
  
// //   actionForm: FormGroup;

// //   constructor() {
// //     this.actionForm = this.fb.group({
// //       rejectionReason: ['', Validators.required]
// //     });
// //   }

// //   ngOnInit(): void {
// //     const data = this.config.data;
// //     if (data) {
// //       this.actionType = data.actionType || 'approve';
// //       this.returnId = data.returnId;
// //       this.returnNumber = data.returnNumber;

// //       if (this.actionType === 'approve') {
// //         this.actionForm.get('rejectionReason')?.clearValidators();
// //         this.actionForm.get('rejectionReason')?.updateValueAndValidity();
// //       }
// //     } else {
// //       this.ref.close();
// //     }
// //   }

// //   confirm(): void {
// //     if (this.actionType === 'reject' && this.actionForm.invalid) {
// //       this.actionForm.markAllAsTouched();
// //       return;
// //     }

// //     this.isSubmitting.set(true);

// //     if (this.actionType === 'approve') {
// //       this.salesReturnService.approveReturn(this.returnId)
// //         .pipe(finalize(() => this.isSubmitting.set(false)))
// //         .subscribe({
// //           next: () => {
// //             this.messageService.showSuccess(`Return ${this.returnNumber} approved successfully`);
// //             this.ref.close(true);
// //           },
// //           error: (err) => this.messageService.handleHttpError(err)
// //         });
// //     } else {
// //       const payload: RejectSalesReturnPayload = {
// //         rejectionReason: this.actionForm.value.rejectionReason
// //       };
// //       this.salesReturnService.rejectReturn(this.returnId, payload)
// //         .pipe(finalize(() => this.isSubmitting.set(false)))
// //         .subscribe({
// //           next: () => {
// //             this.messageService.showSuccess(`Return ${this.returnNumber} rejected`);
// //             this.ref.close(true);
// //           },
// //           error: (err) => this.messageService.handleHttpError(err)
// //         });
// //     }
// //   }

// //   cancel(): void {
// //     this.ref.close();
// //   }
// // }
