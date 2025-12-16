import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { OrganizationService } from '../organization.service';

@Component({
  selector: 'app-accept-ownership',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ToastModule, ProgressSpinnerModule],
  providers: [MessageService],
  template: `
    <div class="accept-container">
      <p-toast></p-toast>
      
      <p-card styleClass="accept-card">
        <div class="content-wrapper">
          <div class="icon-circle">
            <i class="pi pi-shield text-3xl text-primary"></i>
          </div>
          
          <h2 class="title">Ownership Transfer</h2>
          
          @if (errorMessage()) {
            <div class="error-msg">
              <i class="pi pi-times-circle"></i>
              <span>{{ errorMessage() }}</span>
            </div>
            <button pButton label="Go to Dashboard" (click)="goToDashboard()" class="p-button-text"></button>
          } 
          @else if (isSuccess()) {
            <div class="success-msg">
              <i class="pi pi-check-circle"></i>
              <span>Transfer Complete! Redirecting...</span>
            </div>
          }
          @else {
            <p class="description">
              You have been nominated to become the <strong>Owner</strong> of this organization. 
              This will grant you full administrative control.
            </p>

            <div class="actions">
              <button pButton 
                label="Accept Ownership" 
                icon="pi pi-check" 
                class="p-button-success w-full" 
                [loading]="isLoading()" 
                (click)="handleTransfer('accept')">
              </button>
              
              <button pButton 
                label="Decline Request" 
                icon="pi pi-times" 
                class="p-button-outlined p-button-secondary w-full" 
                [disabled]="isLoading()" 
                (click)="handleTransfer('reject')">
              </button>
            </div>
          }
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .accept-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--surface-ground);
      padding: 1rem;
    }
    ::ng-deep .accept-card {
      width: 100%;
      max-width: 450px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .content-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.5rem;
    }
    .icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--primary-50);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color);
    }
    .title { margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .description { color: var(--text-color-secondary); line-height: 1.6; margin: 0; }
    .actions { width: 100%; display: flex; flex-direction: column; gap: 0.75rem; }
    .error-msg { color: var(--red-600); background: var(--red-50); padding: 1rem; border-radius: 6px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .success-msg { color: var(--green-600); background: var(--green-50); padding: 1rem; border-radius: 6px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
  `]
})
export class AcceptOwnershipComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orgService = inject(OrganizationService);
  private messageService = inject(MessageService);

  token = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  isSuccess = signal(false);

  ngOnInit() {
    // Capture token from URL
    this.token.set(this.route.snapshot.queryParams['token']);

    if (!this.token()) {
      this.errorMessage.set('Invalid or missing transfer token.');
    }
  }

  handleTransfer(action: 'accept' | 'reject') {
    this.isLoading.set(true);

    const payload = {
      token: this.token(),
      action: action
    };

    this.orgService.finalizaTransfer(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (action === 'accept') {
          this.isSuccess.set(true);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Ownership Transferred!' });
          // Redirect to dashboard after delay to let them see success message
          setTimeout(() => {
            // Full reload to ensure user permissions (Super Admin) update in the app
            window.location.href = '/dashboard'; 
          }, 1500);
        } else {
          this.messageService.add({ severity: 'info', summary: 'Rejected', detail: 'You declined the transfer.' });
          this.goToDashboard();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'The transfer link is invalid or expired.');
      }
    });
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { ButtonModule } from 'primeng/button';
// import { CardModule } from 'primeng/card';
// import { MessageService } from 'primeng/api';
// import { ToastModule } from 'primeng/toast';
// import { OrganizationService } from '../organization.service';

// @Component({
//   selector: 'app-accept-ownership',
//   standalone: true,
//   imports: [CommonModule, ButtonModule, CardModule, ToastModule],
//   providers: [MessageService],
//   template: `
//     <div class="h-screen w-full flex items-center justify-center bg-gray-50 p-4">
//       <p-toast></p-toast>
      
//       <p-card styleClass="w-full max-w-md shadow-lg text-center">
//         <div class="flex flex-col items-center gap-4">
//           <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
//             <i class="pi pi-shield text-2xl"></i>
//           </div>
          
//           <h2 class="text-xl font-bold m-0">Ownership Transfer Request</h2>
//           <p class="text-gray-600 m-0">
//             You have been nominated to become the new owner of the organization.
//           </p>

//           <div class="w-full h-px bg-gray-200 my-2"></div>

//           <div class="flex flex-col gap-3 w-full">
//             <button pButton 
//                     label="Accept Ownership" 
//                     class="p-button-success w-full" 
//                     icon="pi pi-check" 
//                     [loading]="isLoading()"
//                     (click)="handleAction('accept')">
//             </button>
            
//             <button pButton 
//                     label="Decline" 
//                     class="p-button-outlined p-button-secondary w-full" 
//                     [loading]="isLoading()"
//                     (click)="handleAction('reject')">
//             </button>
//           </div>
//         </div>
//       </p-card>
//     </div>
//   `
// })
// export class AcceptOwnershipComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private orgService = inject(OrganizationService);
//   private messageService = inject(MessageService);

//   token = signal<string>('');
//   isLoading = signal<boolean>(false);

//   ngOnInit() {
//     // 1. Capture the token from the URL (?token=xyz)
//     this.token.set(this.route.snapshot.queryParams['token']);

//     if (!this.token()) {
//       this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid link' });
//       setTimeout(() => this.router.navigate(['/']), 2000);
//     }
//   }

//   handleAction(action: 'accept' | 'reject') {
//     this.isLoading.set(true);

//     const payload = {
//       token: this.token(),
//       action: action
//     };

//     this.orgService.finalizaTransfer(payload).subscribe({
//       next: (res) => {
//         if (action === 'accept') {
//           this.messageService.add({ severity: 'success', summary: 'Success', detail: 'You are now the Owner!' });
//           // Force reload to update permissions/UI for the new owner
//           setTimeout(() => window.location.href = '/admin/dashboard', 1500);
//         } else {
//           this.messageService.add({ severity: 'info', summary: 'Declined', detail: 'Request rejected.' });
//           setTimeout(() => this.router.navigate(['/admin/dashboard']), 1500);
//         }
//       },
//       error: (err) => {
//         this.isLoading.set(false);
//         this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Action failed' });
//       }
//     });
//   }
// }