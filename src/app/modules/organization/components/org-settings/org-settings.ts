import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

/* PrimeNG */
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { TabsModule } from 'primeng/tabs';
import { Divider } from 'primeng/divider';

/* Services */
import { AuthService } from '../../../auth/services/auth-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { OrganizationService } from '../../organization.service';

@Component({
  selector: 'app-org-settings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,

    // PrimeNG
    ButtonModule, InputTextModule, TableModule, DialogModule,
    TabsModule, ConfirmDialogModule, TagModule, TimelineModule,
    AvatarModule, MenuModule, Divider
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './org-settings.html',
  styleUrl: './org-settings.scss',
})
export class OrgSettingsComponent implements OnInit {
  /* Services */
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  public common = inject(CommonMethodService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  /* Signals */
  activeTab = signal(1);         // 👈 Added for new <p-tabs> API
  isLoading = signal(true);
  isSaving = signal(false);

  currentUserId = this.authService.getCurrentUser()?._id;

  /* Data */
  organization: any = null;
  pendingMembers = signal<any[]>([]);
  activeMembers = signal<any[]>([]);
  activityLogs = signal<any[]>([]);

  availableRoles: any[] = [];
  availableBranches: any[] = [];

  /* Forms */
  orgForm!: FormGroup;
  inviteForm!: FormGroup;
  transferForm!: FormGroup;

  /* Dialogs */
  showInviteDialog = false;
  showTransferDialog = false;

  ngOnInit() {
    this.initForms();
    this.loadDashboardData();
  }

  // ------------------------------------------------------
  // INIT FORMS
  // ------------------------------------------------------
  initForms() {
    this.orgForm = this.fb.group({
      name: ['', Validators.required],
      primaryEmail: ['', [Validators.required, Validators.email]],
      primaryPhone: ['', Validators.required],
      gstNumber: [''],
    });

    this.inviteForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: [null, Validators.required],
      branchId: [null, Validators.required],
    });

    this.transferForm = this.fb.group({
      newOwnerId: [null, Validators.required],
      confirmName: ['', Validators.required],
    });
  }

  // ------------------------------------------------------
  // LOAD DASHBOARD DATA
  // ------------------------------------------------------
  loadDashboardData() {
    this.isLoading.set(true);

    forkJoin({
      org: this.orgService.getMyOrganization(),
      pending: this.orgService.getPendingMembers(),
      logs: this.orgService.getActivityLog(),
    }).subscribe({
      next: (res: any) => {
        /* Organization */
        this.organization = res.org.data || res.org.data.data;
        this.orgForm.patchValue(this.organization);

        if (this.organization.members) {
          this.activeMembers.set(
            this.organization.members.filter((m: any) => m.status !== 'pending')
          );
        }

        /* Pending */
        this.pendingMembers.set(res.pending.data?.pendingMembers || []);

        /* Logs */
        this.activityLogs.set(res.logs.data?.logs || []);

        /* Dropdowns */
        this.availableBranches = this.organization.branches || [];

        this.isLoading.set(false);
      },
      error: (err) => {
        this.common.createErrorHandler('Load Organization')(err).subscribe();
        this.isLoading.set(false);
      },
    });
  }

  // ------------------------------------------------------
  // UPDATE GENERAL ORG SETTINGS
  // ------------------------------------------------------
  updateOrgDetails() {
    if (this.orgForm.invalid) return;

    this.isSaving.set(true);
    this.orgService.updateMyOrganization(this.orgForm.value).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Organization profile updated.',
        });
        this.isSaving.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error.message,
        });
        this.isSaving.set(false);
      },
    });
  }

  // ------------------------------------------------------
  // TEAM MANAGEMENT
  // ------------------------------------------------------
  openInviteDialog() {
    this.inviteForm.reset();
    this.showInviteDialog = true;
  }

  sendInvite() {
    if (this.inviteForm.invalid) return;

    this.isSaving.set(true);

    this.orgService.inviteUser(this.inviteForm.value).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Invited',
          detail: 'Invitation email sent.',
        });

        this.showInviteDialog = false;
        this.loadDashboardData();
        this.isSaving.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: err.error.message,
        });
        this.isSaving.set(false);
      },
    });
  }

  approveMember(userId: string) {
    const payload = {
      userId,
      roleId: 'DEFAULT_ROLE_ID', // Replace when role dropdown exists
      branchId: this.organization.branches[0]?._id,
    };

    this.orgService.approveMember(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Approved',
          detail: 'User added successfully.',
        });
        this.loadDashboardData();
      },
      error: (err) =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error.message,
        }),
    });
  }

  removeMember(member: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to remove ${member.name}?`,
      header: 'Remove Member',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.removeMember(member._id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'info',
              summary: 'Removed',
              detail: 'Member removed.',
            });
            this.loadDashboardData();
          },
          error: (err) =>
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error.message,
            }),
        });
      },
    });
  }

  // ------------------------------------------------------
  // DANGER ZONE — TRANSFER OWNERSHIP
  // ------------------------------------------------------
  onTransferOwnership() {
    if (this.transferForm.invalid) return;

    this.confirmationService.confirm({
      message: 'Are you sure? You will lose Owner privileges.',
      header: 'Transfer Ownership',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService
          .transferOwnership({
            newOwnerId: this.transferForm.value.newOwnerId,
          })
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Transferred',
                detail: 'Ownership transferred successfully.',
              });

              this.showTransferDialog = false;
              window.location.reload();
            },
            error: (err) =>
              this.messageService.add({
                severity: 'error',
                summary: 'Failed',
                detail: err.error.message,
              }),
          });
      },
    });
  }

  // ------------------------------------------------------
  // DELETE ORG
  // ------------------------------------------------------
  deleteOrganization() {
    this.confirmationService.confirm({
      message: 'This cannot be undone. All data will be deleted.',
      header: 'DELETE ORGANIZATION',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.deleteOrganization(this.organization._id).subscribe({
          next: () => {
            this.authService.logout();
            this.router.navigate(['/auth/signup']);
          },
          error: (err) =>
            this.messageService.add({
              severity: 'error',
              summary: 'Failed',
              detail: err.error.message,
            }),
        });
      },
    });
  }

  // ------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------
  isOwner(): boolean {
    return this.organization?.owner?._id === this.currentUserId;
  }
}

// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { forkJoin } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { TableModule } from 'primeng/table';
// import { DialogModule } from 'primeng/dialog';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ConfirmationService, MessageService } from 'primeng/api';
// import { TagModule } from 'primeng/tag';
// import { TimelineModule } from 'primeng/timeline';
// import { AvatarModule } from 'primeng/avatar';
// import { MenuModule } from 'primeng/menu';
// import { TabsModule } from 'primeng/tabs';
// // Services
// import { AuthService } from '../../../auth/services/auth-service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';
// import { Select } from 'primeng/select';
// import { Tabs } from 'primeng/tabs';
// import { OrganizationService } from '../../organization.service';
// import { Divider } from "primeng/divider";

// @Component({
//   selector: 'app-org-settings',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule,
//      TableModule, DialogModule, TabsModule,
//     ConfirmDialogModule, TagModule, TimelineModule, AvatarModule, MenuModule,
//     Divider
// ],
//   providers: [ConfirmationService],
//   templateUrl: './org-settings.html',
//   styleUrl: './org-settings.scss'
// })
// export class OrgSettingsComponent implements OnInit {
//   // Services
//   private orgService = inject(OrganizationService);
//   private authService = inject(AuthService); // To check current user ID
//   public common = inject(CommonMethodService);
//   private fb = inject(FormBuilder);
//   private messageService = inject(MessageService);
//   private confirmationService = inject(ConfirmationService);
//   private router = inject(Router);

//   // State Signals
//   isLoading = signal(true);
//   isSaving = signal(false);
//   currentUserId = this.authService.getCurrentUser()?._id;

//   // Data
//   organization: any = null;
//   pendingMembers = signal<any[]>([]);
//   activeMembers = signal<any[]>([]); // Derived from org.members
//   activityLogs = signal<any[]>([]);
  
//   // Dropdown Data
//   availableRoles: any[] = []; // Need to fetch roles
//   availableBranches: any[] = []; // Need to fetch branches

//   // Forms
//   orgForm!: FormGroup;
//   inviteForm!: FormGroup;
//   transferForm!: FormGroup;

//   // Dialogs Visibility
//   showInviteDialog = false;
//   showApprovalDialog = false;
//   showTransferDialog = false;
  
//   selectedMemberForApproval: any = null;

//   ngOnInit() {
//     this.initForms();
//     this.loadDashboardData();
//   }

//   initForms() {
//     this.orgForm = this.fb.group({
//       name: ['', Validators.required],
//       primaryEmail: ['', [Validators.required, Validators.email]],
//       primaryPhone: ['', Validators.required],
//       gstNumber: [''],
//       // Address nested if needed, simplified here
//     });

//     this.inviteForm = this.fb.group({
//       name: ['', Validators.required],
//       email: ['', [Validators.required, Validators.email]],
//       role: [null, Validators.required], // Role ID
//       branchId: [null, Validators.required]
//     });

//     this.transferForm = this.fb.group({
//       newOwnerId: [null, Validators.required],
//       confirmName: ['', Validators.required] // Type "CONFIRM" or user name
//     });
//   }

//   loadDashboardData() {
//     this.isLoading.set(true);
    
//     // ForkJoin to get Org Details, Pending List, Logs, Roles/Branches (if endpoints exist)
//     forkJoin({
//       org: this.orgService.getMyOrganization(),
//       pending: this.orgService.getPendingMembers(),
//       logs: this.orgService.getActivityLog(),
//       // Assuming you have role/branch services or endpoints
//       // roles: this.roleService.getRoles(), 
//       // branches: this.branchService.getBranches()
//     }).subscribe({
//       next: (res: any) => {
//         // 1. Organization Data
//         this.organization = res.org.data || res.org.data.data; // Handle factory vs custom response
//         this.orgForm.patchValue(this.organization);
        
//         // Split members into Active lists
//         if (this.organization.members) {
//           this.activeMembers.set(this.organization.members.filter((m: any) => m.status !== 'pending'));
//         }

//         // 2. Pending Data
//         this.pendingMembers.set(res.pending.data?.pendingMembers || []);

//         // 3. Logs
//         this.activityLogs.set(res.logs.data?.logs || []);

//         // 4. Populate Dropdowns (Mocking here if API missing, replace with real data)
//         this.availableBranches = this.organization.branches || [];
//         // this.availableRoles = ... fetch from API

//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         this.common.createErrorHandler('Load Organization')(err).subscribe();
//         this.isLoading.set(false);
//       }
//     });
//   }

//   // ==================================================
//   // 1. GENERAL SETTINGS
//   // ==================================================
//   updateOrgDetails() {
//     if (this.orgForm.invalid) return;
//     this.isSaving.set(true);
    
//     this.orgService.updateMyOrganization(this.orgForm.value).subscribe({
//       next: () => {
//         this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Organization profile updated.' });
//         this.isSaving.set(false);
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error.message });
//         this.isSaving.set(false);
//       }
//     });
//   }

//   // ==================================================
//   // 2. TEAM MANAGEMENT (Invite, Approve, Remove)
//   // ==================================================
  
//   openInviteDialog() {
//     this.inviteForm.reset();
//     this.showInviteDialog = true;
//   }

//   sendInvite() {
//     if (this.inviteForm.invalid) return;
//     this.isSaving.set(true);

//     this.orgService.inviteUser(this.inviteForm.value).subscribe({
//       next: () => {
//         this.messageService.add({ severity: 'success', summary: 'Invited', detail: 'Invitation email sent.' });
//         this.showInviteDialog = false;
//         this.loadDashboardData(); // Refresh lists
//         this.isSaving.set(false);
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error.message });
//         this.isSaving.set(false);
//       }
//     });
//   }

//   approveMember(userId: string) {
//     // In a real app, open a dialog to confirm Role/Branch assignment
//     // For this example, we assume defaults or pass hardcoded for simplicity
//     // OR use the approvalForm logic from previous chat
    
//     const payload = {
//       userId: userId,
//       roleId: 'DEFAULT_ROLE_ID', // Replace with actual selection
//       branchId: this.organization.branches[0]?._id // Default to main branch
//     };

//     this.orgService.approveMember(payload).subscribe({
//       next: () => {
//         this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'User joined the organization.' });
//         this.loadDashboardData();
//       },
//       error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error.message })
//     });
//   }

//   removeMember(member: any) {
//     this.confirmationService.confirm({
//       message: `Are you sure you want to remove ${member.name}? They will lose access immediately.`,
//       header: 'Remove Member',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.orgService.removeMember(member._id).subscribe({
//           next: () => {
//             this.messageService.add({ severity: 'info', summary: 'Removed', detail: 'Member access revoked.' });
//             this.loadDashboardData();
//           },
//           error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error.message })
//         });
//       }
//     });
//   }

//   // ==================================================
//   // 3. DANGER ZONE (Transfer, Delete)
//   // ==================================================

//   onTransferOwnership() {
//     if (this.transferForm.invalid) return;
    
//     this.confirmationService.confirm({
//       message: 'This action is irreversible. You will lose Owner privileges immediately.',
//       header: 'Transfer Ownership?',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.orgService.transferOwnership({ newOwnerId: this.transferForm.value.newOwnerId }).subscribe({
//           next: () => {
//             this.messageService.add({ severity: 'success', summary: 'Transferred', detail: 'Ownership transferred successfully.' });
//             this.showTransferDialog = false;
//             window.location.reload(); // Force reload to update permissions
//           },
//           error: (err) => this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error.message })
//         });
//       }
//     });
//   }

//   deleteOrganization() {
//     this.confirmationService.confirm({
//       message: 'This will permanently delete your organization and all data. This cannot be undone.',
//       header: 'DELETE ORGANIZATION',
//       icon: 'pi pi-trash',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.orgService.deleteOrganization(this.organization._id).subscribe({
//           next: () => {
//             this.authService.logout();
//             this.router.navigate(['/auth/signup']);
//           },
//           error: (err:any) => this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error.message })
//         });
//       }
//     });
//   }

//   // Helper
//   isOwner(): boolean {
//     return this.organization?.owner?._id === this.currentUserId;
//   }
// }