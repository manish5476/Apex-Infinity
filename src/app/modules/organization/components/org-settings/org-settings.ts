import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

/* PrimeNG v18 Modules */
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

/* Custom Services & Components - Update paths as needed */
import { AuthService } from '../../../auth/services/auth-service';
import { OrganizationService } from '../../organization.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { UserListComponent } from '../../../user/user-list/user-list'; // Assuming this is the grid component

@Component({
  selector: 'app-org-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    UserListComponent,
    ButtonModule,
    InputTextModule,
    DialogModule,
    TabsModule,
    ConfirmDialogModule,
    TagModule,
    AvatarModule,
    SelectModule,
    BadgeModule,
    ToastModule,
    DividerModule,
    TooltipModule
  ],
  providers: [ConfirmationService],
  templateUrl: './org-settings.html',
  styleUrl: './org-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrgSettingsComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private appMessage = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private masterList = inject(MasterListService);
  private cdr = inject(ChangeDetectorRef);

  // --- UI State Signals ---
  isLoading = signal(true);
  isSaving = signal(false);
  activeTab = signal('0');
  
  // Dialog visibility signals
  showInviteDialog = signal(false);
  showTransferDialog = signal(false);

  // --- Data Signals ---
  organization = signal<any>(null);
  activeMembers = signal<any[]>([]);
  pendingMembers = signal<any[]>([]);
  
  // --- Computed State ---
  isOwner = computed(() => {
    const org = this.organization();
    const user = this.authService.getCurrentUser();
    if (!org || !user) return false;
    // Handle both populated object or ID string
    const ownerId = org.owner?._id || org.owner;
    return ownerId === user._id;
  });

  // --- Forms ---
  orgForm!: FormGroup;
  inviteForm!: FormGroup;
  
  // Transfer Ownership state
  selectedNewOwnerId = signal<string | null>(null);
  transferConfirmName = signal<string>('');

  // Track selections for pending user approvals
  selectedRoles: { [userId: string]: string } = {};
  selectedBranches: { [userId: string]: string } = {};

  ngOnInit() {
    this.initForms();
    this.loadData();
  }

  private initForms() {
    this.orgForm = this.fb.group({
      name: ['', Validators.required],
      primaryEmail: ['', [Validators.required, Validators.email]],
      primaryPhone: ['', Validators.required],
      gstNumber: [''],
    });

    this.inviteForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [null, Validators.required],
      branchId: [null, Validators.required]
    });
  }

  loadData() {
    this.isLoading.set(true);
    
    forkJoin({
      org: this.orgService.getMyOrganization(),
      pending: this.orgService.getPendingMembers()
    })
    .pipe(finalize(() => {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }))
    .subscribe({
      next: (res: any) => {
        const orgData = res.org.data;
        this.organization.set(orgData);
        this.orgForm.patchValue(orgData);

        // Filter approved members
        const members = orgData.members || [];
        this.activeMembers.set(members.filter((m: any) => m.status === 'approved' || !m.status));

        // Load pending requests
        this.pendingMembers.set(res.pending.data?.pendingMembers || []);
      },
      // Removed the trailing context string
      error: (err) => this.appMessage.handleHttpError(err) 
    });
  }

  // --- Helpers for Template ---
  get roles() { return this.masterList.roles(); }
  get branches() { return this.masterList.branches(); }

  getSelectedOwnerName(): string {
    const id = this.selectedNewOwnerId();
    if (!id) return '';
    return this.activeMembers().find(m => m._id === id)?.name || '';
  }

  // --- Actions ---

  updateOrgDetails() {
    if (this.orgForm.invalid) {
      this.appMessage.showWarn('Validation Error: Please check the required fields.');
      return;
    }
    
    this.isSaving.set(true);
    this.orgService.updateMyOrganization(this.orgForm.value)
      .pipe(finalize(() => {
        this.isSaving.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => this.appMessage.showSuccess('Organization details updated successfully.'),
        error: (err) => this.appMessage.handleHttpError(err)
      });
  }

  inviteUser() {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      this.appMessage.showWarn('Validation Error: Please fill in all required fields for the invitation.');
      return;
    }
    
    this.isSaving.set(true);
    this.orgService.inviteUser(this.inviteForm.value)
      .pipe(finalize(() => {
        this.isSaving.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.appMessage.showSuccess('Invitation sent successfully.');
          this.showInviteDialog.set(false);
          this.inviteForm.reset();
          this.loadData();
        },
        error: (err) => this.appMessage.handleHttpError(err)
      });
  }

  transferOwnership() {
    const newOwnerId = this.selectedNewOwnerId();
    
    if (!newOwnerId || this.transferConfirmName() !== this.organization()?.name) {
      this.appMessage.showWarn('Transfer Error: Name confirmation does not match or no user selected.');
      return;
    }

    this.isSaving.set(true);
    this.orgService.transferOwnership({ user: newOwnerId })
      .pipe(finalize(() => {
        this.isSaving.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: any) => {
          this.appMessage.showSuccess(res.message || 'Ownership transferred successfully.');
          this.showTransferDialog.set(false);
          this.loadData();
        },
        error: (err) => this.appMessage.handleHttpError(err)
      });
  }
  
  

  approveMember(userId: string) {
    const roleId = this.selectedRoles[userId];
    const branchId = this.selectedBranches[userId];

    if (!roleId || !branchId) {
      this.appMessage.showWarn('Missing Info: Please assign a Role and Branch first.');
      return;
    }

    this.orgService.approveMember({ userId, branchId, roleId }).subscribe({
      next: () => {
        this.appMessage.showSuccess('Member approved successfully.');
        this.loadData();
      },
      error: (err) => this.appMessage.handleHttpError(err)
    });
  }

  

  rejectMember(userId: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to reject this access request?',
      header: 'Confirm Rejection',
      icon: 'pi pi-user-minus',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.rejectMember({ userId }).subscribe({
          next: () => {
            this.appMessage.showInfo('Request rejected.');
            this.loadData();
          },
          error: (err) => this.appMessage.handleHttpError(err)
        });
      }
    });
  }

  deleteOrganization() {
    this.confirmationService.confirm({
      message: 'PERMANENT: This will delete the organization and all its data. Type your organization name to confirm.',
      header: 'CRITICAL ACTION',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.deleteOrganization(this.organization()._id).subscribe({
          next: () => {
            this.appMessage.showInfo('Organization deleted. Logging out...');
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          },
          error: (err) => this.appMessage.handleHttpError(err)
        });
      }
    });
  }
}

// export class OrgSettingsComponent implements OnInit {
//   private orgService = inject(OrganizationService);
//   private authService = inject(AuthService);
//   private fb = inject(FormBuilder);
//   private appMessage = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);
//   private router = inject(Router);
//   private masterList = inject(MasterListService);
//   private cdr = inject(ChangeDetectorRef);

//   // --- UI State Signals ---
//   isLoading = signal(true);
//   isSaving = signal(false);
//   activeTab = signal('0');
  
//   // Dialog visibility signals
//   showInviteDialog = signal(false);
//   showTransferDialog = signal(false);

//   // --- Data Signals ---
//   organization = signal<any>(null);
//   activeMembers = signal<any[]>([]);
//   pendingMembers = signal<any[]>([]);
  
//   // --- Computed State ---
//   isOwner = computed(() => {
//     const org = this.organization();
//     const user = this.authService.getCurrentUser();
//     if (!org || !user) return false;
//     // Handle both populated object or ID string
//     const ownerId = org.owner?._id || org.owner;
//     return ownerId === user._id;
//   });

//   // --- Forms ---
//   orgForm!: FormGroup;
//   inviteForm!: FormGroup;
  
//   // Transfer Ownership state
//   selectedNewOwnerId = signal<string | null>(null);
//   transferConfirmName = signal<string>('');

//   // Track selections for pending user approvals
//   selectedRoles: { [userId: string]: string } = {};
//   selectedBranches: { [userId: string]: string } = {};

//   ngOnInit() {
//     this.initForms();
//     this.loadData();
//   }

//   private initForms() {
//     this.orgForm = this.fb.group({
//       name: ['', Validators.required],
//       primaryEmail: ['', [Validators.required, Validators.email]],
//       primaryPhone: ['', Validators.required],
//       gstNumber: [''],
//     });

//     this.inviteForm = this.fb.group({
//       name: ['', Validators.required],
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(6)]],
//       role: [null, Validators.required],
//       branchId: [null, Validators.required]
//     });
//   }

//   loadData() {
//     this.isLoading.set(true);
    
//     forkJoin({
//       org: this.orgService.getMyOrganization(),
//       pending: this.orgService.getPendingMembers()
//     })
//     .pipe(finalize(() => {
//       this.isLoading.set(false);
//       this.cdr.markForCheck();
//     }))
//     .subscribe({
//       next: (res: any) => {
//         const orgData = res.org.data;
//         this.organization.set(orgData);
//         this.orgForm.patchValue(orgData);

//         // Filter approved members
//         const members = orgData.members || [];
//         this.activeMembers.set(members.filter((m: any) => m.status === 'approved' || !m.status));

//         // Load pending requests
//         this.pendingMembers.set(res.pending.data?.pendingMembers || []);
//       },
//       error: (err) => this.appMessage.handleHttpError(err, 'Organization Load')
//     });
//   }

//   // --- Helpers for Template ---
//   get roles() { return this.masterList.roles(); }
//   get branches() { return this.masterList.branches(); }

//   getSelectedOwnerName(): string {
//     const id = this.selectedNewOwnerId();
//     if (!id) return '';
//     return this.activeMembers().find(m => m._id === id)?.name || '';
//   }

//   // --- Actions ---

//   updateOrgDetails() {
//     if (this.orgForm.invalid) return;
//     this.isSaving.set(true);
//     this.orgService.updateMyOrganization(this.orgForm.value)
//       .pipe(finalize(() => {
//         this.isSaving.set(false);
//         this.cdr.markForCheck();
//       }))
//       .subscribe({
//         next: () => this.appMessage.showSuccess('Organization details updated successfully'),
//         error: (err) => this.appMessage.handleHttpError(err, 'Update Settings')
//       });
//   }

//   inviteUser() {
//     if (this.inviteForm.invalid) {
//       this.inviteForm.markAllAsTouched();
//       return;
//     }
    
//     this.isSaving.set(true);
//     this.orgService.inviteUser(this.inviteForm.value)
//       .pipe(finalize(() => {
//         this.isSaving.set(false);
//         this.cdr.markForCheck();
//       }))
//       .subscribe({
//         next: () => {
//           this.appMessage.showSuccess('Invitation sent successfully');
//           this.showInviteDialog.set(false);
//           this.inviteForm.reset();
//           this.loadData();
//         },
//         error: (err) => this.appMessage.handleHttpError(err, 'Invite User')
//       });
//   }

//   transferOwnership() {
//     const newOwnerId = this.selectedNewOwnerId();
//     // Validate name match
//     if (!newOwnerId || this.transferConfirmName() !== this.organization()?.name) return;

//     this.isSaving.set(true);
//     this.orgService.transferOwnership({ user: newOwnerId })
//       .pipe(finalize(() => {
//         this.isSaving.set(false);
//         this.cdr.markForCheck();
//       }))
//       .subscribe({
//         next: (res: any) => {
//           this.appMessage.showSuccess(res.message || 'Ownership transferred successfully');
//           this.showTransferDialog.set(false);
//           this.loadData();
//         },
//         error: (err) => this.appMessage.handleHttpError(err, 'Transfer Ownership')
//       });
//   }

//   approveMember(userId: string) {
//     const roleId = this.selectedRoles[userId];
//     const branchId = this.selectedBranches[userId];

//     if (!roleId || !branchId) {
//       this.appMessage.showWarn('Please assign a Role and Branch first');
//       return;
//     }

//     this.orgService.approveMember({ userId, branchId, roleId }).subscribe({
//       next: () => {
//         this.appMessage.showSuccess('Member approved successfully');
//         this.loadData();
//       },
//       error: (err) => this.appMessage.handleHttpError(err, 'Approval')
//     });
//   }

//   rejectMember(userId: string) {
//     this.confirmationService.confirm({
//       message: 'Are you sure you want to reject this access request?',
//       header: 'Confirm Rejection',
//       icon: 'pi pi-user-minus',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.orgService.rejectMember({ userId }).subscribe({
//           next: () => {
//             this.appMessage.showInfo('Request rejected');
//             this.loadData();
//           },
//           error: (err) => this.appMessage.handleHttpError(err, 'Reject Member')
//         });
//       }
//     });
//   }

//   deleteOrganization() {
//     this.confirmationService.confirm({
//       message: 'PERMANENT: This will delete the organization and all its data. Type your organization name to confirm.',
//       header: 'CRITICAL ACTION',
//       icon: 'pi pi-trash',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.orgService.deleteOrganization(this.organization()._id).subscribe({
//           next: () => {
//             this.appMessage.showInfo('Organization deleted. Logging out...');
//             this.authService.logout();
//             this.router.navigate(['/auth/login']);
//           },
//           error: (err) => this.appMessage.handleHttpError(err, 'Delete Organization')
//         });
//       }
//     });
//   }
// }