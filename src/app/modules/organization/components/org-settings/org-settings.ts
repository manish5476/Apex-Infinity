import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

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

/* Custom Services & Components */
import { AuthService } from '../../../auth/services/auth-service';
import { OrganizationService } from '../../organization.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { AppMessageService } from '../../../../core/services/message.service';
import { UserListComponent } from '../../../user/user-list/user-list';
import { MasterDropdownService } from '../../../../core/services/master-dropdown.service';
import { PageComponent } from '../../../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../../../shared/ui/layout/page-content/page-content.component';
import { CardComponent } from '../../../../shared/ui/data/card/card.component';
import { StatCardComponent } from '../../../../shared/ui/data/stat-card.component';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';
@Component({
  selector: 'app-org-settings',
  standalone: true,
  imports: [
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
    TooltipModule,
    MasterDropdownComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    CardComponent,
    StatCardComponent,
    DialogComponent
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right" [baseZIndex]="5000"></p-toast>
    <p-confirmDialog [style]="{width: '450px'}" appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}"></p-confirmDialog>

    <app-page>
      
      <!-- ════════ 1. PREMIUM HERO HEADER ════════ -->
      <app-page-header [title]="organization()?.name || 'Loading Workspace...'" subtitle="Active ERP Workspace">
        <div header-left class="flex items-center gap-4 mb-2">
          <div class="w-16 h-16 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--accent-primary)] flex items-center justify-center text-3xl font-bold shadow-sm">
            {{ (organization()?.name || 'O')[0] }}
          </div>
          <div class="flex flex-col gap-1 mt-1">
             @if (organization()) {
               <div class="flex items-center gap-3">
                 <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-xs font-mono text-[var(--text-secondary)] font-medium"><i class="pi pi-fingerprint"></i> ID: {{ organization().uniqueShopId }}</span>
                 <span class="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5"><i class="pi pi-building"></i> {{ organization().branches?.length || 0 }} Branches</span>
                 <span class="text-sm font-medium text-[var(--color-success)] flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse"></span> Active ERP</span>
               </div>
             }
          </div>
        </div>

        <button class="flex items-center justify-center gap-2 h-10 px-4 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-medium shadow-sm transition-all duration-200 hover:brightness-105 hover:-translate-y-[1px]" (click)="showInviteDialog.set(true)">
          <i class="pi pi-user-plus"></i> Invite Member
        </button>
      </app-page-header>

      <app-page-content class="flex flex-col gap-6 p-6">
        
        <!-- ════════ 2. METRICS ROW ════════ -->
        @if (organization()) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <app-stat-card 
              label="Active Team" 
              [value]="activeMembers().length"
              icon="pi pi-users"
              variant="primary">
            </app-stat-card>

            <app-stat-card 
              label="Pending Waitlist" 
              [value]="pendingMembers().length"
              icon="pi pi-clock"
              variant="warning">
            </app-stat-card>

            <app-stat-card 
              label="Roles Configured" 
              [value]="roles.length"
              icon="pi pi-shield"
              variant="info">
            </app-stat-card>
          </div>
        }

        <!-- ════════ 3. MAIN WORKSPACE (TABS) ════════ -->
        <app-card>
          <p-tabs [value]="activeTab()" (valueChange)="activeTab.set($event?.toString() || '0')">
            <p-tablist>
              <p-tab value="0"><i class="pi pi-users mr-2 opacity-80"></i> Team Management</p-tab>
              <p-tab value="1"><i class="pi pi-cog mr-2 opacity-80"></i> Organization Settings</p-tab>
              @if (isOwner()) {
                <p-tab value="2"><i class="pi pi-lock mr-2 text-[var(--color-error)]"></i> Danger Zone</p-tab>
              }
            </p-tablist>

            <p-tabpanels>
              <!-- ── TAB 0: TEAM MANAGEMENT ── -->
              <p-tabpanel value="0">
                <div class="p-6 md:p-8 min-h-[400px]">
                  <!-- Active Team Launcher -->
                  <div class="flex items-center justify-between bg-[var(--bg-primary)] border border-[var(--border-primary)] p-6 rounded-xl shadow-sm mb-8">
                    <div class="flex items-center gap-6">
                      <div class="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] flex items-center justify-center text-2xl text-[var(--text-primary)]"><i class="pi pi-users"></i></div>
                      <div>
                        <h3 class="m-0 mb-1 text-lg font-bold text-[var(--text-primary)]">Manage Active Team</h3>
                        <p class="m-0 text-sm text-[var(--text-secondary)]">View, edit, and manage all {{ activeMembers().length }} active members across your organization.</p>
                      </div>
                    </div>
                    <button class="flex items-center justify-center gap-2 h-10 px-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]" (click)="showUserListDialog.set(true)">
                      Open Team Directory <i class="pi pi-arrow-right"></i>
                    </button>
                  </div>

                  <!-- Pending Approvals -->
                  @if (pendingMembers().length > 0) {
                    <div class="mb-6 flex items-center gap-3">
                      <h3 class="m-0 text-lg font-bold text-[var(--text-primary)] font-heading">Pending Access Requests</h3>
                      <span class="bg-amber-500/15 text-amber-700 dark:text-amber-500 px-2.5 py-1 rounded-full text-[11px] font-bold">{{ pendingMembers().length }} New</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      @for (p of pendingMembers(); track p._id) {
                        <app-card [padding]="'md'" class="flex flex-col transition-all hover:border-[var(--border-primary)] hover:shadow-sm">
                          <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] flex items-center justify-center font-bold text-[var(--text-secondary)]">{{ p.name[0] }}</div>
                            <div>
                              <h4 class="m-0 text-sm font-semibold text-[var(--text-primary)]">{{ p.name }}</h4>
                              <p class="m-0 text-xs text-[var(--text-tertiary)]">{{ p.email }}</p>
                            </div>
                          </div>

                          <div class="flex flex-col gap-3 bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-secondary)] mb-4">
                            <div class="flex flex-col gap-1.5">
                              <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Assign Role</label>
                              <app-master-dropdown endpoint="roles" [(ngModel)]="selectedRoles[p._id]" placeholder="Select Role"></app-master-dropdown>
                            </div>
                            <div class="flex flex-col gap-1.5">
                              <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Assign Branch</label>
                              <app-master-dropdown endpoint="branches" [(ngModel)]="selectedBranches[p._id]" placeholder="Select Branch"></app-master-dropdown>
                            </div>
                          </div>

                          <div class="flex gap-2">
                            <button class="flex-1 flex items-center justify-center gap-2 h-9 px-3 bg-transparent text-[var(--color-error)] rounded-lg text-sm font-medium hover:bg-[var(--color-error-bg)] transition-all" (click)="rejectMember(p._id)"><i class="pi pi-times"></i> Reject</button>
                            <button class="flex-1 flex items-center justify-center gap-2 h-9 px-3 bg-[var(--color-success)] text-white rounded-lg text-sm font-medium hover:brightness-105 transition-all" (click)="approveMember(p._id)"><i class="pi pi-check"></i> Approve Access</button>
                          </div>
                        </app-card>
                      }
                    </div>
                  } @else {
                    <div class="flex items-center gap-3 p-6 mt-4 border border-dashed border-[var(--border-primary)] rounded-xl text-[var(--text-tertiary)] bg-transparent">
                      <i class="pi pi-check-circle text-xl"></i>
                      <p class="m-0 text-sm">No pending access requests. Your team is up to date.</p>
                    </div>
                  }
                </div>
              </p-tabpanel>

              <!-- ── TAB 1: ORGANIZATION SETTINGS ── -->
              <p-tabpanel value="1">
                <div class="p-6 md:p-8 min-h-[400px]">
                  <div class="max-w-4xl">
                    <form [formGroup]="orgForm" (ngSubmit)="updateOrgDetails()" class="flex flex-col gap-8">
                      <div>
                        <h3 class="m-0 mb-1 text-xl font-bold font-heading text-[var(--text-primary)]">General Information</h3>
                        <p class="m-0 text-sm text-[var(--text-secondary)]">Update your company's core identity and contact details.</p>
                      </div>

                      @if (successMessage()) {
                        <div class="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-success-bg)] text-[var(--color-success-dark)] border border-green-500/20 text-sm">
                          <i class="pi pi-check-circle mt-0.5"></i> {{ successMessage() }}
                        </div>
                      }
                      @if (errorMessage()) {
                        <div class="flex items-start justify-between gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error-dark)] border border-red-500/20 text-sm">
                          <div class="flex gap-3"><i class="pi pi-exclamation-triangle mt-0.5"></i> {{ errorMessage() }}</div>
                          <button type="button" class="opacity-70 hover:opacity-100" (click)="errorMessage.set(null)"><i class="pi pi-times"></i></button>
                        </div>
                      }

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col gap-1.5 md:col-span-2">
                          <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Business Name</label>
                          <input type="text" class="h-10 px-3 w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 transition-all" formControlName="name" />
                        </div>

                        <div class="flex flex-col gap-1.5">
                          <label class="text-[13px] font-semibold text-[var(--text-secondary)]">GST / Tax Number</label>
                          <input type="text" class="h-10 px-3 w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 transition-all" formControlName="gstNumber" placeholder="Optional" />
                        </div>

                        <div class="flex flex-col gap-1.5">
                          <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Primary Email</label>
                          <input type="email" class="h-10 px-3 w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 transition-all" formControlName="primaryEmail" />
                        </div>

                        <div class="flex flex-col gap-1.5">
                          <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Contact Phone</label>
                          <input type="tel" class="h-10 px-3 w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 transition-all" formControlName="primaryPhone" />
                        </div>
                      </div>

                      <div>
                        <button type="submit" class="flex items-center justify-center gap-2 h-10 px-5 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-medium shadow-sm transition-all duration-200 hover:brightness-105 hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed" [disabled]="isSaving()">
                          @if (isSaving()) {
                            <i class="pi pi-spin pi-spinner"></i> Saving Changes...
                          } @else {
                            <i class="pi pi-save"></i> Save Configuration
                          }
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </p-tabpanel>

              <!-- ── TAB 2: DANGER ZONE ── -->
              <p-tabpanel value="2">
                <div class="p-6 md:p-8 min-h-[400px]">
                  <div class="max-w-4xl">
                    <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-sm">
                      <div class="flex items-center gap-4 p-6 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
                        <i class="pi pi-shield text-2xl text-[var(--text-tertiary)]"></i>
                        <div>
                          <h3 class="m-0 text-lg font-semibold text-[var(--text-primary)]">Administrative Actions</h3>
                          <p class="m-0 mt-1 text-[13px] text-[var(--text-secondary)]">Critical settings that affect the entire organization.</p>
                        </div>
                      </div>

                      <div class="flex flex-col">
                        <div class="flex items-center justify-between gap-6 p-6 border-b border-[var(--border-secondary)]">
                          <div>
                            <h4 class="m-0 mb-1 text-sm font-semibold text-[var(--text-primary)]">Transfer Ownership</h4>
                            <p class="m-0 text-[13px] text-[var(--text-secondary)] leading-relaxed">Hand over full control. You will be downgraded to a regular Admin.</p>
                          </div>
                          <button class="flex items-center justify-center h-10 px-4 bg-transparent border border-[var(--color-warning)] text-[var(--color-warning-dark)] rounded-lg text-sm font-medium transition-all hover:bg-[var(--color-warning-bg)]" (click)="showTransferDialog.set(true)">Transfer</button>
                        </div>

                        <div class="flex items-center justify-between gap-6 p-6 border-b border-[var(--border-secondary)]">
                          <div>
                            <h4 class="m-0 mb-1 text-sm font-semibold text-[var(--text-primary)]">Cancel Pending Transfer</h4>
                            <p class="m-0 text-[13px] text-[var(--text-secondary)] leading-relaxed">Revoke an active transfer invitation immediately.</p>
                          </div>
                          <button class="flex items-center justify-center h-10 px-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg text-sm font-medium transition-all hover:bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]" (click)="cancelTransfer()">Cancel Request</button>
                        </div>

                        <div class="flex items-center justify-between gap-6 p-6 bg-[var(--color-error-bg)]/30">
                          <div>
                            <h4 class="m-0 mb-1 text-sm font-semibold text-[var(--color-error-dark)]">Delete Organization</h4>
                            <p class="m-0 text-[13px] text-[var(--text-secondary)] leading-relaxed">Permanently wipe all branches, users, and data. Irreversible.</p>
                          </div>
                          <button class="flex items-center justify-center h-10 px-4 bg-[var(--color-error)] text-white rounded-lg text-sm font-medium transition-all hover:bg-red-700" (click)="showDeleteDialog.set(true)">Delete Forever</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </app-card>
      </app-page-content>
    </app-page>

    <!-- ════════ DIALOGS ════════ -->
    <app-dialog [(visible)]="showUserListDialog" title="Team Directory" subtitle="Manage access, roles, and status for all active members." size="full" [showFooter]="false">
      <app-user-list></app-user-list>
    </app-dialog>

    <app-dialog [(visible)]="showInviteDialog" title="Invite Team Member" size="md" submitLabel="Send Invite" (submit)="inviteUser()" [loading]="isSaving()">
      <form [formGroup]="inviteForm" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Full Name</label>
          <input type="text" class="h-10 px-3 w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 transition-all" formControlName="name" placeholder="e.g. John Doe" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Email Address</label>
          <input type="email" class="h-10 px-3 w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 transition-all" formControlName="email" placeholder="e.g. john@company.com" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Temporary Password</label>
          <input type="password" class="h-10 px-3 w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 transition-all" formControlName="password" placeholder="Min 6 characters" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Role</label>
            <app-master-dropdown endpoint="roles" formControlName="role" placeholder="Select Role"></app-master-dropdown>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Branch</label>
            <app-master-dropdown endpoint="branches" formControlName="branchId" placeholder="Select Branch"></app-master-dropdown>
          </div>
        </div>
      </form>
    </app-dialog>

    <app-dialog [(visible)]="showTransferDialog" title="Transfer Ownership" size="md" submitLabel="Transfer Control" submitSeverity="warn" (submit)="transferOwnership()" [loading]="isSaving()">
      <div class="flex flex-col gap-4">
        <div class="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-warning-bg)] text-[var(--color-warning-dark)] border border-[var(--color-warning)]/20 text-sm">
          <i class="pi pi-info-circle mt-0.5"></i>
          <p class="m-0 leading-relaxed">Transferring ownership grants <b>Super Admin</b> privileges to the selected user. You will lose billing and deletion rights.</p>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Select New Owner</label>
          <p-select [options]="activeMembers()" [ngModel]="selectedNewOwnerId()" (ngModelChange)="selectedNewOwnerId.set($event)" optionLabel="name" optionValue="_id" placeholder="Search team member..." styleClass="w-full" appendTo="body" [filter]="true">
            <ng-template let-member pTemplate="item">
              <div class="flex flex-col">
                <span class="font-semibold text-sm">{{ member.name }}</span>
                <span class="text-xs text-[var(--text-tertiary)]">{{ member.email }}</span>
              </div>
            </ng-template>
          </p-select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-[var(--text-secondary)]">Confirm Organization Name</label>
          <input type="text" [ngModel]="transferConfirmName()" (ngModelChange)="transferConfirmName.set($event)" class="h-10 px-3 w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 transition-all" [placeholder]="'Type ' + organization()?.name + ' to confirm'" />
        </div>
      </div>
    </app-dialog>

    <app-dialog [(visible)]="showDeleteDialog" title="Delete Organization" size="md" submitLabel="Delete Forever" submitSeverity="danger" (submit)="deleteOrganization()" [loading]="isSaving()">
      <div class="flex flex-col gap-4">
        <div class="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error-dark)] border-l-4 border-[var(--color-error)] text-sm">
          <i class="pi pi-exclamation-triangle mt-0.5"></i>
          <div>
            <h4 class="m-0 mb-1 font-bold">CRITICAL WARNING</h4>
            <p class="m-0 leading-relaxed">You are about to permanently delete <strong>{{ organization()?.name }}</strong>. All branches, users, and resources will be irrevocably wiped. This cannot be undone.</p>
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-[var(--text-secondary)]">To confirm, type the organization name below:</label>
          <input type="text" [ngModel]="deleteConfirmName()" (ngModelChange)="deleteConfirmName.set($event)" class="h-10 px-3 w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/15 transition-all" [placeholder]="organization()?.name" />
        </div>
      </div>
    </app-dialog>
  `,
  styles: [`
    :host {
      display: block;
      background: var(--bg-secondary, #f8fafc);
      min-height: 100vh;
      font-family: var(--font-body);
    }

    ::ng-deep .p-tabs .p-tablist {
      background: var(--bg-primary) !important;
      padding: 0 var(--spacing-xl);
      border-bottom: 1px solid var(--border-primary);
    }
    ::ng-deep .p-tab {
      padding: var(--spacing-lg) var(--spacing-xl) !important;
      font-family: var(--font-heading);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold) !important;
      color: var(--text-secondary) !important;
      border: none !important;
      border-bottom: 2px solid transparent !important;
      background: transparent !important;
    }
    ::ng-deep .p-tab-active {
      color: var(--accent-primary) !important;
      border-bottom-color: var(--accent-primary) !important;
    }
    ::ng-deep .p-tabpanels { padding: 0 !important; background: var(--bg-secondary) !important; }
  `]
})
export class OrgSettingsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private appMessage = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private dropdownService = inject(MasterDropdownService);
  private cdr = inject(ChangeDetectorRef);

  // --- UI State Signals ---
  isLoading = signal(true);
  isSaving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  activeTab = signal('0');

  // Dialog visibility signals
  showUserListDialog = signal(false); // NEW Immersive Dialog Signal
  showInviteDialog = signal(false);
  showTransferDialog = signal(false);
  showDeleteDialog = signal(false);

  // --- Data Signals ---
  organization = signal<any>(null);
  activeMembers = signal<any[]>([]);
  pendingMembers = signal<any[]>([]);
  roleList = signal<any[]>([]);
  branchList = signal<any[]>([]);

  // --- Computed State ---
  isOwner = computed(() => {
    const org = this.organization();
    const user = this.authService.getCurrentUser();
    if (!org || !user) return false;
    const ownerId = org.owner?._id || org.owner;
    return ownerId === user._id;
  });

  // --- Forms ---
  orgForm!: FormGroup;
  inviteForm!: FormGroup;

  // Transfer Ownership state
  selectedNewOwnerId = signal<string | null>(null);
  transferConfirmName = signal<string>('');

  // Delete Organization state
  deleteConfirmName = signal<string>('');

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
      pending: this.orgService.getPendingMembers(),
      roles: this.dropdownService.getDropdownData('roles'),
      branches: this.dropdownService.getDropdownData('branches')
    })
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }), takeUntil(this.destroy$))
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

          // Load master data for metrics
          this.roleList.set(res.roles.data || []);
          this.branchList.set(res.branches.data || []);
        },
        error: (err) => this.appMessage.handleHttpError(err)
      });
  }

  // --- Helpers for Template ---
  get roles() { return this.roleList(); }
  get branches() { return this.branchList(); }

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
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.orgService.updateMyOrganization(this.orgForm.value)
      .pipe(finalize(() => {
        this.isSaving.set(false);
        this.cdr.markForCheck();
      }), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const msg = 'Organization details updated successfully.';
          this.successMessage.set(msg);
          this.appMessage.showSuccess(msg);
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to update organization details. Please try again.';
          this.errorMessage.set(msg);
          this.appMessage.handleHttpError(err);
        }
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
      }), takeUntil(this.destroy$))
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
    this.orgService.forceTransferOwnership({ newOwnerId })
      .pipe(finalize(() => {
        this.isSaving.set(false);
        this.cdr.markForCheck();
      }), takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.appMessage.showSuccess(res.message || 'Ownership transferred successfully.');
          this.showTransferDialog.set(false);
          this.loadData();
        },
        error: (err) => this.appMessage.handleHttpError(err)
      });
  }

  cancelTransfer() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to cancel the pending ownership transfer request?',
      header: 'Cancel Transfer Request',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.isSaving.set(true);
        this.orgService.cancelOwnershipTransfer()
          .pipe(finalize(() => {
            this.isSaving.set(false);
            this.cdr.markForCheck();
          }), takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => {
              this.appMessage.showSuccess(res.message || 'Ownership transfer request cancelled successfully.');
            },
            error: (err) => this.appMessage.handleHttpError(err)
          });
      }
    });
  }

  approveMember(userId: string) {
    const roleId = this.selectedRoles[userId];
    const branchId = this.selectedBranches[userId];

    if (!roleId || !branchId) {
      this.appMessage.showWarn('Missing Info: Please assign a Role and Branch first.');
      return;
    }

    this.orgService.approveMember({ userId, branchId, roleId }).pipe(takeUntil(this.destroy$)).subscribe({
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
        this.orgService.rejectMember({ userId }).pipe(takeUntil(this.destroy$)).subscribe({
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
    if (this.deleteConfirmName() !== this.organization()?.name) {
      this.appMessage.showWarn('Validation Error: Organization name does not match.');
      return;
    }

    this.isSaving.set(true);

    this.orgService.deleteMyOrganization().pipe(
      finalize(() => {
        this.isSaving.set(false);
        this.cdr.markForCheck();
      }), takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.showDeleteDialog.set(false);
        this.appMessage.showInfo('Organization deleted successfully. Logging out...');
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: (err) => this.appMessage.handleHttpError(err)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}