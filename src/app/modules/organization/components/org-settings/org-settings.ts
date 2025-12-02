import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

/* PrimeNG v18 Modules */
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select'; // v18 Dropdown replacement
import { BadgeModule } from 'primeng/badge';

/* Services */
import { AuthService } from '../../../auth/services/auth-service';
import { OrganizationService } from '../../organization.service';

@Component({
  selector: 'app-org-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    // PrimeNG
    ButtonModule,
    InputTextModule,
    TableModule,
    DialogModule,
    TabsModule,
    ConfirmDialogModule,
    TagModule,
    TimelineModule,
    AvatarModule,
    DividerModule,
    TooltipModule,
    SelectModule,
    BadgeModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './org-settings.html',
  styleUrl: './org-settings.scss',
})
export class OrgSettingsComponent implements OnInit {
  // Dependencies
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  // Signals
  isLoading = signal(true);
  isSaving = signal(false);
  activeTabValue = signal('0'); // Default to first tab

  // Data Signals
  organization = signal<any>(null);
  activeMembers = signal<any[]>([]);
  pendingMembers = signal<any[]>([]);
  activityLogs = signal<any[]>([]);

  // Computed
  isOwner = computed(() => {
    const org = this.organization();
    const currentUser = this.authService.getCurrentUser(); // Assuming this gets stored user
    return org?.owner?._id === currentUser?._id;
  });

  // Forms
  orgForm!: FormGroup;
  inviteForm!: FormGroup;
  transferForm!: FormGroup;

  // Dialog State
  showInviteDialog = false;
  showTransferDialog = false;

  // Mock Data for Dropdowns (Replace with API calls if needed)
  availableRoles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Member', value: 'member' }
  ];

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
      role: [null, Validators.required],
      branchId: [null] // Optional logic based on your needs
    });

    this.transferForm = this.fb.group({
      newOwnerId: [null, Validators.required],
      confirmName: ['', Validators.required]
    });
  }

  loadData() {
     // this.isLoading.set(true);

    // ForkJoin to get Org Data, Pending Members, and Logs
    forkJoin({
      org: this.orgService.getMyOrganization(),
      pending: this.orgService.getPendingMembers(),
      logs: this.orgService.getActivityLog()
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          // 1. Handle Organization & Active Members
          // Backend returns { status: 'success', data: { ...orgObject } } based on your controller
          const orgData = res.org.data;
          this.organization.set(orgData);

          // Populate Form
          this.orgForm.patchValue({
            name: orgData.name,
            primaryEmail: orgData.primaryEmail,
            primaryPhone: orgData.primaryPhone,
            gstNumber: orgData.gstNumber
          });

          // Filter Members (The populate logic in controller returns all members)
          if (orgData.members) {
            // Filter out pending or inactive if needed, though controller seems to return approved
            this.activeMembers.set(orgData.members.filter((m: any) => m.status === 'approved'));
          }

          // 2. Handle Pending Requests
          // Controller returns { data: { pendingMembers: [] } }
          this.pendingMembers.set(res.pending.data?.pendingMembers || []);

          // 3. Handle Logs
          // Controller returns { data: { logs: [] } }
          this.activityLogs.set(res.logs.data?.logs || []);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load organization data.' });
          console.error(err);
        }
      });
  }

  // --- ACTIONS ---

  updateOrgDetails() {
    if (this.orgForm.invalid) return;
    // this.isSaving.set(true);

    this.orgService.updateMyOrganization(this.orgForm.value)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Organization details saved.' }),
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Update failed' })
      });
  }

  inviteUser() {
    if (this.inviteForm.invalid) return;
    // this.isSaving.set(true);
    const payload = {
      ...this.inviteForm.value,
      branchId: this.organization().mainBranch // Default to main branch if not selected
    };

    this.orgService.inviteUser(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Invited', detail: 'Invitation sent successfully.' });
          this.showInviteDialog = false;
          this.inviteForm.reset();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
      });
  }

  approveMember(userId: string) {
    // We need a Role ID and Branch ID. 
    // Since UI doesn't allow selecting them in the pending list yet, we pick defaults.
    // In a real app, open a dialog to select role/branch before confirming.
    const defaultBranchId = this.organization().mainBranch;
    // Assuming we have a default role or pick the first one available in the system
    // For now, we mock it or use a known ID from your backend example
    const defaultRoleId = "690ee7892000b64c86cadd04";

    this.orgService.approveMember({ userId, branchId: defaultBranchId, roleId: defaultRoleId }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Member has been added.' });
        this.loadData(); // Reload to move from pending to active
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
    });
  }

  removeMember(memberId: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to remove this member? They will lose access immediately.',
      header: 'Revoke Access',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.removeMember(memberId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Removed', detail: 'Member removed successfully.' });
            this.loadData();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
        });
      }
    });
  }

  transferOwnership() {
    if (this.transferForm.invalid) return;

    this.confirmationService.confirm({
      message: 'This action is irreversible. You will become a regular admin.',
      header: 'Transfer Ownership',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.transferOwnership(this.transferForm.value.newOwnerId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Transferred', detail: 'Ownership updated.' });
            window.location.reload(); // Force reload to reflect permissions
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
        });
      }
    });
  }

  deleteOrganization() {
    let id: any
    this.confirmationService.confirm({
      message: 'This will permanently delete the organization and all associated data. This cannot be undone.',
      header: 'DELETE ORGANIZATION',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orgService.deleteOrganization(id).subscribe({
          next: () => {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
        });
      }
    });
  }

  // --- HELPERS ---
  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'ORG';
  }
}