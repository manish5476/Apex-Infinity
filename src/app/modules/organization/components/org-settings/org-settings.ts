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
    MasterDropdownComponent
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right" [baseZIndex]="5000"></p-toast>
    <p-confirmDialog [style]="{width: '450px'}" appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}"></p-confirmDialog>

    <div class="org-dashboard-container animate-fade-in">
      
      <!-- ════════ 1. PREMIUM HERO HEADER ════════ -->
      <header class="org-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="org-identity">
            <div class="org-avatar-massive">
              <span>{{ (organization()?.name || 'O')[0]  }}</span>
            </div>
            <div class="org-details">
              <h1 class="org-title">{{ organization()?.name || 'Loading Workspace...' }}</h1>
              @if (organization()) {
                <div class="meta-row">
                  <span class="id-badge"><i class="pi pi-fingerprint"></i> ID: {{ organization().uniqueShopId }}</span>
                  <span class="meta-item"><i class="pi pi-building"></i> {{ organization().branches?.length || 0 }} Branches</span>
                  <span class="meta-item status-active"><span class="pulse-dot"></span> Active ERP</span>
                </div>
              }
            </div>
          </div>

          <div class="header-actions">
            <button class="btn-primary" (click)="showInviteDialog.set(true)">
              <i class="pi pi-user-plus"></i> Invite Member
            </button>
          </div>
        </div>
      </header>

      <!-- ════════ 2. METRICS ROW ════════ -->
      @if (organization()) {
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-info">
              <span class="stat-label">Active Team</span>
              <span class="stat-value">{{ activeMembers().length }}</span>
            </div>
            <div class="stat-icon icon-primary"><i class="pi pi-users"></i></div>
          </div>

          <div class="stat-card">
            <div class="stat-info">
              <span class="stat-label">Pending Waitlist</span>
              <span class="stat-value">{{ pendingMembers().length }}</span>
            </div>
            <div class="stat-icon icon-warning"><i class="pi pi-clock"></i></div>
          </div>

          <div class="stat-card">
            <div class="stat-info">
              <span class="stat-label">Roles Configured</span>
              <span class="stat-value">{{ roles.length }}</span>
            </div>
            <div class="stat-icon icon-info"><i class="pi pi-shield"></i></div>
          </div>
        </section>
      }

      <!-- ════════ 3. MAIN WORKSPACE (TABS) ════════ -->
      <section class="workspace-card">
        <p-tabs [value]="activeTab()" (valueChange)="activeTab.set($event?.toString() || '0')">
          <p-tablist>
            <p-tab value="0"><i class="pi pi-users tab-icon"></i> Team Management</p-tab>
            <p-tab value="1"><i class="pi pi-cog tab-icon"></i> Organization Settings</p-tab>
            @if (isOwner()) {
              <p-tab value="2"><i class="pi pi-lock tab-icon text-error"></i> Danger Zone</p-tab>
            }
          </p-tablist>

          <p-tabpanels>
            
            <!-- ── TAB 0: TEAM MANAGEMENT ── -->
            <p-tabpanel value="0">
              <div class="panel-layout">
                
                <!-- Active Team Launcher -->
                <div class="team-launcher-card">
                  <div class="launcher-info">
                    <div class="icon-wrap"><i class="pi pi-users"></i></div>
                    <div>
                      <h3>Manage Active Team</h3>
                      <p>View, edit, and manage all {{ activeMembers().length }} active members across your organization.</p>
                    </div>
                  </div>
                  <button class="btn-outline" (click)="showUserListDialog.set(true)">
                    Open Team Directory <i class="pi pi-arrow-right"></i>
                  </button>
                </div>

                <!-- Pending Approvals -->
                @if (pendingMembers().length > 0) {
                  <div class="pending-section">
                    <div class="section-heading">
                      <h3>Pending Access Requests</h3>
                      <span class="badge-warn">{{ pendingMembers().length }} New</span>
                    </div>

                    <div class="pending-grid">
                      @for (p of pendingMembers(); track p._id) {
                        <div class="request-card">
                          <div class="req-header">
                            <div class="req-avatar">{{ p.name[0]  }}</div>
                            <div class="req-user">
                              <h4>{{ p.name }}</h4>
                              <p>{{ p.email }}</p>
                            </div>
                          </div>

                          <div class="req-body">
                            <div class="input-group">
                              <label>Assign Role</label>
                              <app-master-dropdown 
                                endpoint="roles" 
                                [(ngModel)]="selectedRoles[p._id]" 
                                placeholder="Select Role">
                              </app-master-dropdown>
                            </div>
                            <div class="input-group">
                              <label>Assign Branch</label>
                              <app-master-dropdown 
                                endpoint="branches" 
                                [(ngModel)]="selectedBranches[p._id]" 
                                placeholder="Select Branch">
                              </app-master-dropdown>
                            </div>
                          </div>

                          <div class="req-footer">
                            <button class="btn-ghost-danger" (click)="rejectMember(p._id)"><i class="pi pi-times"></i> Reject</button>
                            <button class="btn-success" (click)="approveMember(p._id)"><i class="pi pi-check"></i> Approve Access</button>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <div class="empty-state-subtle mt-4">
                    <i class="pi pi-check-circle"></i>
                    <p>No pending access requests. Your team is up to date.</p>
                  </div>
                }
              </div>
            </p-tabpanel>

            <!-- ── TAB 1: ORGANIZATION SETTINGS ── -->
            <p-tabpanel value="1">
              <div class="panel-layout">
                <div class="max-w-5xl"> <!-- Keeps forms readable on ultrawide -->
                  <form [formGroup]="orgForm" (ngSubmit)="updateOrgDetails()" class="premium-form">
                    <div class="form-header">
                      <h3>General Information</h3>
                      <p>Update your company's core identity and contact details.</p>
                    </div>

                    @if (successMessage()) {
                      <div class="alert-success">
                        <i class="pi pi-check-circle"></i> {{ successMessage() }}
                      </div>
                    }
                    @if (errorMessage()) {
                      <div class="alert-error">
                        <i class="pi pi-exclamation-triangle"></i> {{ errorMessage() }}
                        <button type="button" (click)="errorMessage.set(null)"><i class="pi pi-times"></i></button>
                      </div>
                    }

                    <div class="form-grid">
                      <div class="field-group span-2">
                        <label>Business Name</label>
                        <input type="text" class="premium-input" formControlName="name" />
                      </div>

                      <div class="field-group">
                        <label>GST / Tax Number</label>
                        <input type="text" class="premium-input" formControlName="gstNumber" placeholder="Optional" />
                      </div>

                      <div class="field-group">
                        <label>Primary Email</label>
                        <input type="email" class="premium-input" formControlName="primaryEmail" />
                      </div>

                      <div class="field-group">
                        <label>Contact Phone</label>
                        <input type="tel" class="premium-input" formControlName="primaryPhone" />
                      </div>
                    </div>

                    <div class="form-actions">
                      <button type="submit" class="btn-primary" [disabled]="isSaving()">
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
              <div class="panel-layout">
                <div class="max-w-5xl"> <!-- Keeps content readable on ultrawide -->
                  <div class="danger-zone-wrapper">
                    <div class="danger-header">
                      <i class="pi pi-shield"></i>
                      <div>
                        <h3>Administrative Actions</h3>
                        <p>Critical settings that affect the entire organization.</p>
                      </div>
                    </div>

                    <div class="danger-list">
                      <div class="danger-row">
                        <div class="danger-info">
                          <h4>Transfer Ownership</h4>
                          <p>Hand over full control. You will be downgraded to a regular Admin.</p>
                        </div>
                        <button class="btn-outline-warn" (click)="showTransferDialog.set(true)">Transfer</button>
                      </div>

                      <div class="danger-row">
                        <div class="danger-info">
                          <h4>Cancel Pending Transfer</h4>
                          <p>Revoke an active transfer invitation immediately.</p>
                        </div>
                        <button class="btn-outline" (click)="cancelTransfer()">Cancel Request</button>
                      </div>

                      <div class="danger-row is-destructive">
                        <div class="danger-info">
                          <h4>Delete Organization</h4>
                          <p>Permanently wipe all branches, users, and data. Irreversible.</p>
                        </div>
                        <button class="btn-danger" (click)="showDeleteDialog.set(true)">Delete Forever</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </p-tabpanel>

          </p-tabpanels>
        </p-tabs>
      </section>
    </div>

    <!-- ════════ IMMERSIVE USER LIST DIALOG ════════ -->
    <p-dialog [modal]="true" 
      [(visible)]="showUserListDialog" 
      [modal]="true" 
      [draggable]="false" 
      [resizable]="false"
      [style]="{ width: '95vw', height: '90vh' }"
      [contentStyle]="{ padding: '0', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }"
      [showHeader]="false"
      styleClass="premium-lightbox" appendTo="body" [blockScroll]="true" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}" [dismissableMask]="true">
      
      <div class="immersive-dialog-root">
        <div class="id-header">
          <div class="id-title">
            <div class="id-icon"><i class="pi pi-users"></i></div>
            <div>
              <h2>Team Directory</h2>
              <p>Manage access, roles, and status for all active members.</p>
            </div>
          </div>
          <button class="btn-close-immersive" (click)="showUserListDialog.set(false)" pTooltip="Close Directory" tooltipPosition="bottom">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="id-body">
          <!-- Main User Grid Component Injected Here -->
          <app-user-list></app-user-list>
        </div>
      </div>
    </p-dialog>

    <!-- ════════ INVITE DIALOG ════════ -->
    <p-dialog [modal]="true" header="Invite Team Member" [(visible)]="showInviteDialog" [modal]="true" [style]="{width: '480px'}" [draggable]="false" [resizable]="false" appendTo="body" [blockScroll]="true" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}" [dismissableMask]="true">
      <form [formGroup]="inviteForm" class="dialog-form mt-2">
        <div class="field-group">
          <label>Full Name</label>
          <input pInputText class="premium-input w-full" formControlName="name" placeholder="e.g. John Doe" />
        </div>
        <div class="field-group mt-3">
          <label>Email Address</label>
          <input pInputText class="premium-input w-full" formControlName="email" placeholder="e.g. john@company.com" />
        </div>
        <div class="field-group mt-3">
          <label>Temporary Password</label>
          <input pInputText type="password" class="premium-input w-full" formControlName="password" placeholder="Min 6 characters" />
        </div>
        <div class="grid grid-cols-2 gap-4 mt-3">
          <div class="field-group">
            <label>Role</label>
            <app-master-dropdown 
              endpoint="roles" 
              formControlName="role" 
              placeholder="Select Role">
            </app-master-dropdown>
          </div>
          <div class="field-group">
            <label>Branch</label>
            <app-master-dropdown 
              endpoint="branches" 
              formControlName="branchId" 
              placeholder="Select Branch">
            </app-master-dropdown>
          </div>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2 mt-4">
          <button class="btn-ghost" (click)="showInviteDialog.set(false)">Cancel</button>
          <button class="btn-primary" (click)="inviteUser()" [disabled]="isSaving()">
            @if(isSaving()) { <i class="pi pi-spin pi-spinner"></i> } @else { <i class="pi pi-send"></i> } Send Invite
          </button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- ════════ TRANSFER DIALOG ════════ -->
    <p-dialog [modal]="true" header="Transfer Ownership" [(visible)]="showTransferDialog" [modal]="true" [style]="{width: '500px'}" [draggable]="false" appendTo="body" [blockScroll]="true" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}" [dismissableMask]="true">
      <div class="dialog-content mt-2">
        <div class="alert-warn mb-4">
          <i class="pi pi-info-circle"></i>
          <p>Transferring ownership grants <b>Super Admin</b> privileges to the selected user. You will lose billing and deletion rights.</p>
        </div>
        <div class="field-group">
          <label>Select New Owner</label>
          <p-select [options]="activeMembers()" [ngModel]="selectedNewOwnerId()" (ngModelChange)="selectedNewOwnerId.set($event)" optionLabel="name" optionValue="_id" placeholder="Search team member..." styleClass="w-full" appendTo="body" [filter]="true">
            <ng-template let-member pTemplate="item">
              <div class="flex flex-col">
                <span class="font-semibold text-sm">{{ member.name }}</span>
                <span class="text-xs text-gray-500">{{ member.email }}</span>
              </div>
            </ng-template>
          </p-select>
        </div>
        <div class="field-group mt-4">
          <label>Confirm Organization Name</label>
          <input pInputText [ngModel]="transferConfirmName()" (ngModelChange)="transferConfirmName.set($event)" class="premium-input w-full" [placeholder]="'Type ' + organization()?.name + ' to confirm'" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2 mt-4">
          <button class="btn-ghost" (click)="showTransferDialog.set(false)">Cancel</button>
          <button class="btn-warning" [disabled]="transferConfirmName() !== organization()?.name || !selectedNewOwnerId()" (click)="transferOwnership()">
            <i class="pi pi-sync"></i> Transfer Control
          </button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- ════════ DELETE DIALOG ════════ -->
    <p-dialog [modal]="true" header="Delete Organization" [(visible)]="showDeleteDialog" [modal]="true" [style]="{width: '500px'}" [draggable]="false" appendTo="body" [blockScroll]="true" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}" [dismissableMask]="true">
      <div class="dialog-content mt-2">
        <div class="alert-error-critical mb-4">
          <i class="pi pi-exclamation-triangle"></i>
          <div>
            <h4>CRITICAL WARNING</h4>
            <p>You are about to permanently delete <strong>{{ organization()?.name }}</strong>. All branches, users, and resources will be irrevocably wiped. This cannot be undone.</p>
          </div>
        </div>
        <div class="field-group">
          <label>To confirm, type the organization name below:</label>
          <input pInputText [ngModel]="deleteConfirmName()" (ngModelChange)="deleteConfirmName.set($event)" class="premium-input w-full mt-1" [placeholder]="organization()?.name" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2 mt-4">
          <button class="btn-ghost" (click)="showDeleteDialog.set(false)">Cancel</button>
          <button class="btn-danger" [disabled]="deleteConfirmName() !== organization()?.name" (click)="deleteOrganization()">
            @if(isSaving()) { <i class="pi pi-spin pi-spinner"></i> } @else { <i class="pi pi-trash"></i> } Delete Forever
          </button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    /* ══════════════════════════════════════════════════════════
       ORG SETTINGS DASHBOARD - BILLION DOLLAR UI
    ══════════════════════════════════════════════════════════ */
    :host {
      display: block;
      background: var(--bg-secondary, #f8fafc);
      min-height: 100vh;
      font-family: var(--font-body);
    }

    .org-dashboard-container {
      width: 100%;
      margin: 0;
      padding: var(--spacing-2xl); /* Removes the 1400px boxed-in limit */
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
    }

    /* ── 1. HERO HEADER ────────────────────────────────────── */
    .org-hero {
      position: relative;
      width: 100%;
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-xl);
      border: var(--ui-border-width) solid var(--border-primary);
      padding: var(--spacing-3xl);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .hero-glow {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: var(--accent-gradient, linear-gradient(135deg, #4f46e5, #8b5cf6));
    }

    .hero-content {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-2xl);
      z-index: 1;
    }

    .org-identity {
      display: flex;
      align-items: center;
      gap: var(--spacing-2xl);
    }

    .org-avatar-massive {
      width: 80px; height: 80px;
      border-radius: 20px;
      background: color-mix(in srgb, var(--accent-primary) 10%, var(--bg-secondary));
      color: var(--accent-primary);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-heading);
      font-size: 36px;
      font-weight: var(--font-weight-bold);
      box-shadow: var(--shadow-md);
    }

    .org-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs) 0;
      letter-spacing: -0.02em;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }

    .id-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-secondary);
      padding: 4px 10px;
      border-radius: var(--ui-border-radius-pill);
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      font-weight: var(--font-weight-semibold);
    }

    .meta-item {
      display: flex; align-items: center; gap: 6px;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      font-weight: var(--font-weight-medium);
    }

    .status-active { color: var(--color-success-dark, #059669); }
    .pulse-dot {
      width: 8px; height: 8px;
      background: var(--color-success, #10b981);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* ── 2. METRICS ROW ────────────────────────────────────── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-xl);
      width: 100%;
    }

    .stat-card {
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-xl);
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-xs);
      transition: var(--transition-base);
      &:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); border-color: var(--border-secondary); }
    }

    .stat-info { display: flex; flex-direction: column; gap: 4px; }
    .stat-label { font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: var(--font-weight-medium); }
    .stat-value { font-family: var(--font-heading); font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--text-primary); }
    
    .stat-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .icon-primary { background: color-mix(in srgb, var(--accent-primary) 10%, transparent); color: var(--accent-primary); }
    .icon-warning { background: color-mix(in srgb, var(--color-warning, #f59e0b) 10%, transparent); color: var(--color-warning-dark, #d97706); }
    .icon-info    { background: color-mix(in srgb, var(--color-info, #3b82f6) 10%, transparent); color: var(--color-info-dark, #2563eb); }

    /* ── 3. WORKSPACE TABS & CONTENT ───────────────────────── */
    .workspace-card {
      width: 100%;
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
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
    
    .tab-icon { margin-right: 8px; font-size: 14px; opacity: 0.8; }
    .text-error { color: var(--color-error, #ef4444) !important; }

    .panel-layout { padding: var(--spacing-2xl); min-height: 400px; }
    
    /* ── TEAM LAUNCHER ── */
    .team-launcher-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      padding: var(--spacing-2xl);
      border-radius: var(--ui-border-radius-lg);
      margin-bottom: var(--spacing-3xl);
      box-shadow: var(--shadow-sm);
    }
    .launcher-info { display: flex; align-items: center; gap: var(--spacing-xl); }
    .launcher-info .icon-wrap {
      width: 56px; height: 56px; border-radius: 16px;
      background: var(--bg-secondary); border: 1px solid var(--border-secondary);
      display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--text-primary);
    }
    .launcher-info h3 { margin: 0 0 4px 0; font-size: var(--font-size-lg); color: var(--text-primary); font-weight: var(--font-weight-bold); }
    .launcher-info p { margin: 0; font-size: var(--font-size-sm); color: var(--text-secondary); }

    /* ── PENDING GRID ── */
    .section-heading { display: flex; align-items: center; gap: 12px; margin-bottom: var(--spacing-xl); }
    .section-heading h3 { margin: 0; font-family: var(--font-heading); font-size: var(--font-size-lg); color: var(--text-primary); }
    .badge-warn { background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent); color: var(--color-warning-dark, #d97706); padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: bold; }

    .pending-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--spacing-xl); }
    .request-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      display: flex; flex-direction: column; gap: var(--spacing-lg);
      box-shadow: var(--shadow-xs); transition: var(--transition-fast);
      &:hover { border-color: var(--border-primary); box-shadow: var(--shadow-sm); }
    }
    .req-header { display: flex; align-items: center; gap: 12px; }
    .req-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-secondary); border: 1px solid var(--border-secondary); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-secondary); }
    .req-user h4 { margin: 0; font-size: 14px; color: var(--text-primary); font-weight: 600; }
    .req-user p { margin: 0; font-size: 12px; color: var(--text-tertiary); }
    .req-body { display: flex; flex-direction: column; gap: 12px; background: var(--bg-secondary); padding: 12px; border-radius: 8px; border: 1px solid var(--border-secondary); }
    .req-footer { display: flex; gap: 8px; }
    .req-footer button { flex: 1; justify-content: center; }

    /* ── FORMS & INPUTS ── */
    .premium-form { display: flex; flex-direction: column; gap: var(--spacing-2xl); }
    .form-header h3 { margin: 0 0 4px 0; font-family: var(--font-heading); font-size: var(--font-size-xl); color: var(--text-primary); }
    .form-header p { margin: 0; font-size: var(--font-size-sm); color: var(--text-secondary); }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); }
    .span-2 { grid-column: span 2; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-group label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
    
    .premium-input {
      width: 100%; height: 40px; padding: 0 12px;
      font-family: var(--font-body); font-size: 14px;
      color: var(--text-primary); background: var(--bg-primary);
      border: 1px solid var(--border-primary); border-radius: 8px;
      transition: var(--transition-fast);
      &:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-primary) 15%, transparent); outline: none; }
    }
    
    /* ── DANGER ZONE ── */
    .danger-zone-wrapper { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); }
    .danger-header { display: flex; align-items: center; gap: 16px; padding: 24px; border-bottom: 1px solid var(--border-secondary); background: var(--bg-secondary); }
    .danger-header i { font-size: 24px; color: var(--text-tertiary); }
    .danger-header h3 { margin: 0; font-size: 18px; color: var(--text-primary); font-weight: 600; }
    .danger-header p { margin: 4px 0 0 0; font-size: 13px; color: var(--text-secondary); }
    
    .danger-list { display: flex; flex-direction: column; }
    .danger-row { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid var(--border-secondary); gap: 24px; }
    .danger-row:last-child { border-bottom: none; }
    .danger-info h4 { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .danger-info p { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
    .is-destructive { background: color-mix(in srgb, var(--color-error, #ef4444) 2%, transparent); }
    .is-destructive h4 { color: var(--color-error-dark, #dc2626); }

    /* ── BUTTONS ── */
    button { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-body); font-size: 13px; font-weight: 600; border-radius: 8px; padding: 10px 20px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
    .btn-primary { background: var(--accent-primary); color: #fff; box-shadow: 0 2px 4px color-mix(in srgb, var(--accent-primary) 30%, transparent); &:hover { background: var(--accent-hover); transform: translateY(-1px); } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-success { background: var(--color-success, #10b981); color: #fff; &:hover { background: var(--color-success-dark, #059669); } }
    .btn-danger { background: var(--color-error, #ef4444); color: #fff; &:hover { background: var(--color-error-dark, #dc2626); } }
    .btn-warning { background: var(--color-warning, #f59e0b); color: #fff; &:hover { background: var(--color-warning-dark, #d97706); } }
    .btn-outline { background: var(--bg-primary); border-color: var(--border-primary); color: var(--text-primary); &:hover { background: var(--bg-secondary); border-color: var(--border-secondary); } }
    .btn-outline-warn { background: transparent; border-color: var(--color-warning); color: var(--color-warning-dark); &:hover { background: var(--color-warning-bg); } }
    .btn-ghost { background: transparent; color: var(--text-secondary); &:hover { background: var(--bg-secondary); color: var(--text-primary); } }
    .btn-ghost-danger { background: transparent; color: var(--color-error); &:hover { background: var(--color-error-bg); } }

    /* ── ALERTS ── */
    .alert-success, .alert-error, .alert-warn, .alert-error-critical { display: flex; align-items: flex-start; gap: 12px; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.5; }
    .alert-success { background: var(--color-success-bg); color: var(--color-success-dark); border: 1px solid var(--color-success-border); }
    .alert-error { background: var(--color-error-bg); color: var(--color-error-dark); border: 1px solid var(--color-error-border); justify-content: space-between; }
    .alert-error button { background: transparent; border: none; color: inherit; opacity: 0.7; cursor: pointer; padding: 0; &:hover { opacity: 1; } }
    .alert-warn { background: var(--color-warning-bg); color: var(--color-warning-dark); border: 1px solid var(--color-warning-border); }
    .alert-error-critical { background: color-mix(in srgb, var(--color-error, #ef4444) 10%, transparent); border-left: 4px solid var(--color-error); color: var(--color-error-dark); h4 { margin: 0 0 4px 0; font-weight: 700; } p { margin: 0; font-size: 13px;} }

    .empty-state-subtle { display: flex; align-items: center; gap: 12px; padding: 24px; background: transparent; border: 1px dashed var(--border-primary); border-radius: 12px; color: var(--text-tertiary); i { font-size: 20px; } p { margin: 0; font-size: 14px; } }

    /* ── IMMERSIVE USER LIST DIALOG ────────────────────────── */
    ::ng-deep .premium-lightbox {
      border-radius: var(--ui-border-radius-xl) !important;
      overflow: hidden;
      box-shadow: var(--shadow-3xl) !important;
      border: 1px solid color-mix(in srgb, var(--border-primary) 80%, transparent) !important;
    }

    .immersive-dialog-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: var(--bg-primary);
    }

    .id-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-xl) var(--spacing-3xl);
      border-bottom: 1px solid var(--border-secondary);
      background: var(--bg-secondary);
      flex-shrink: 0;
    }

    .id-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
    }

    .id-icon {
      width: 48px; height: 48px;
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      color: var(--accent-primary);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }

    .id-title h2 { margin: 0 0 4px 0; font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: var(--text-primary); }
    .id-title p { margin: 0; font-size: 14px; color: var(--text-secondary); }

    .btn-close-immersive {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
      &:hover { background: var(--color-error-bg); color: var(--color-error); border-color: var(--color-error); transform: rotate(90deg); }
    }

    .id-body {
      flex: 1;
      padding: var(--spacing-xl) var(--spacing-3xl);
      background: var(--bg-primary);
      overflow-y: auto;
    }
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
// import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { forkJoin, Subject } from 'rxjs';
// import { finalize, takeUntil } from 'rxjs/operators';

// /* PrimeNG v18 Modules */
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { DialogModule } from 'primeng/dialog';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ConfirmationService } from 'primeng/api';
// import { TagModule } from 'primeng/tag';
// import { AvatarModule } from 'primeng/avatar';
// import { TabsModule } from 'primeng/tabs';
// import { SelectModule } from 'primeng/select';
// import { ToastModule } from 'primeng/toast';
// import { BadgeModule } from 'primeng/badge';
// import { DividerModule } from 'primeng/divider';
// import { TooltipModule } from 'primeng/tooltip';

// /* Custom Services & Components */
// import { AuthService } from '../../../auth/services/auth-service';
// import { OrganizationService } from '../../organization.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { UserListComponent } from '../../../user/user-list/user-list';

// @Component({
//   selector: 'app-org-settings',
//   standalone: true,
//   imports: [
//     ReactiveFormsModule,
//     RouterModule,
//     FormsModule,
//     UserListComponent,
//     ButtonModule,
//     InputTextModule,
//     DialogModule,
//     TabsModule,
//     ConfirmDialogModule,
//     TagModule,
//     AvatarModule,
//     SelectModule,
//     BadgeModule,
//     ToastModule,
//     DividerModule,
//     TooltipModule
//   ],
//   providers: [ConfirmationService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   templateUrl: './org-settings.html',
//   styleUrl: './org-settings.scss'
// })
// export class OrgSettingsComponent implements OnInit, OnDestroy {
//   private readonly destroy$ = new Subject<void>();
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
//   successMessage = signal<string | null>(null);
//   errorMessage = signal<string | null>(null);
//   activeTab = signal('0');

//   // Dialog visibility signals
//   showUserListDialog = signal(false); // NEW Immersive Dialog Signal
//   showInviteDialog = signal(false);
//   showTransferDialog = signal(false);
//   showDeleteDialog = signal(false);

//   // --- Data Signals ---
//   organization = signal<any>(null);
//   activeMembers = signal<any[]>([]);
//   pendingMembers = signal<any[]>([]);

//   // --- Computed State ---
//   isOwner = computed(() => {
//     const org = this.organization();
//     const user = this.authService.getCurrentUser();
//     if (!org || !user) return false;
//     const ownerId = org.owner?._id || org.owner;
//     return ownerId === user._id;
//   });

//   // --- Forms ---
//   orgForm!: FormGroup;
//   inviteForm!: FormGroup;

//   // Transfer Ownership state
//   selectedNewOwnerId = signal<string | null>(null);
//   transferConfirmName = signal<string>('');

//   // Delete Organization state
//   deleteConfirmName = signal<string>('');

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
//       .pipe(finalize(() => {
//         this.isLoading.set(false);
//         this.cdr.markForCheck();
//       }), takeUntil(this.destroy$))
//       .subscribe({
//         next: (res: any) => {
//           const orgData = res.org.data;
//           this.organization.set(orgData);
//           this.orgForm.patchValue(orgData);

//           // Filter approved members
//           const members = orgData.members || [];
//           this.activeMembers.set(members.filter((m: any) => m.status === 'approved' || !m.status));

//           // Load pending requests
//           this.pendingMembers.set(res.pending.data?.pendingMembers || []);
//         },
//         error: (err) => this.appMessage.handleHttpError(err)
//       });
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
//     if (this.orgForm.invalid) {
//       this.appMessage.showWarn('Validation Error: Please check the required fields.');
//       return;
//     }

//     this.isSaving.set(true);
//     this.successMessage.set(null);
//     this.errorMessage.set(null);

//     this.orgService.updateMyOrganization(this.orgForm.value)
//       .pipe(finalize(() => {
//         this.isSaving.set(false);
//         this.cdr.markForCheck();
//       }), takeUntil(this.destroy$))
//       .subscribe({
//         next: () => {
//           const msg = 'Organization details updated successfully.';
//           this.successMessage.set(msg);
//           this.appMessage.showSuccess(msg);
//         },
//         error: (err) => {
//           const msg = err.error?.message || 'Failed to update organization details. Please try again.';
//           this.errorMessage.set(msg);
//           this.appMessage.handleHttpError(err);
//         }
//       });
//   }

//   inviteUser() {
//     if (this.inviteForm.invalid) {
//       this.inviteForm.markAllAsTouched();
//       this.appMessage.showWarn('Validation Error: Please fill in all required fields for the invitation.');
//       return;
//     }

//     this.isSaving.set(true);
//     this.orgService.inviteUser(this.inviteForm.value)
//       .pipe(finalize(() => {
//         this.isSaving.set(false);
//         this.cdr.markForCheck();
//       }), takeUntil(this.destroy$))
//       .subscribe({
//         next: () => {
//           this.appMessage.showSuccess('Invitation sent successfully.');
//           this.showInviteDialog.set(false);
//           this.inviteForm.reset();
//           this.loadData();
//         },
//         error: (err) => this.appMessage.handleHttpError(err)
//       });
//   }

//   transferOwnership() {
//     const newOwnerId = this.selectedNewOwnerId();

//     if (!newOwnerId || this.transferConfirmName() !== this.organization()?.name) {
//       this.appMessage.showWarn('Transfer Error: Name confirmation does not match or no user selected.');
//       return;
//     }

//     this.isSaving.set(true);
//     this.orgService.forceTransferOwnership({ newOwnerId })
//       .pipe(finalize(() => {
//         this.isSaving.set(false);
//         this.cdr.markForCheck();
//       }), takeUntil(this.destroy$))
//       .subscribe({
//         next: (res: any) => {
//           this.appMessage.showSuccess(res.message || 'Ownership transferred successfully.');
//           this.showTransferDialog.set(false);
//           this.loadData();
//         },
//         error: (err) => this.appMessage.handleHttpError(err)
//       });
//   }

//   cancelTransfer() {
//     this.confirmationService.confirm({
//       message: 'Are you sure you want to cancel the pending ownership transfer request?',
//       header: 'Cancel Transfer Request',
//       icon: 'pi pi-exclamation-triangle',
//       accept: () => {
//         this.isSaving.set(true);
//         this.orgService.cancelOwnershipTransfer()
//           .pipe(finalize(() => {
//             this.isSaving.set(false);
//             this.cdr.markForCheck();
//           }), takeUntil(this.destroy$))
//           .subscribe({
//             next: (res: any) => {
//               this.appMessage.showSuccess(res.message || 'Ownership transfer request cancelled successfully.');
//             },
//             error: (err) => this.appMessage.handleHttpError(err)
//           });
//       }
//     });
//   }

//   approveMember(userId: string) {
//     const roleId = this.selectedRoles[userId];
//     const branchId = this.selectedBranches[userId];

//     if (!roleId || !branchId) {
//       this.appMessage.showWarn('Missing Info: Please assign a Role and Branch first.');
//       return;
//     }

//     this.orgService.approveMember({ userId, branchId, roleId }).pipe(takeUntil(this.destroy$)).subscribe({
//       next: () => {
//         this.appMessage.showSuccess('Member approved successfully.');
//         this.loadData();
//       },
//       error: (err) => this.appMessage.handleHttpError(err)
//     });
//   }

//   rejectMember(userId: string) {
//     this.confirmationService.confirm({
//       message: 'Are you sure you want to reject this access request?',
//       header: 'Confirm Rejection',
//       icon: 'pi pi-user-minus',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.orgService.rejectMember({ userId }).pipe(takeUntil(this.destroy$)).subscribe({
//           next: () => {
//             this.appMessage.showInfo('Request rejected.');
//             this.loadData();
//           },
//           error: (err) => this.appMessage.handleHttpError(err)
//         });
//       }
//     });
//   }

//   deleteOrganization() {
//     if (this.deleteConfirmName() !== this.organization()?.name) {
//       this.appMessage.showWarn('Validation Error: Organization name does not match.');
//       return;
//     }

//     this.isSaving.set(true);

//     this.orgService.deleteMyOrganization().pipe(
//       finalize(() => {
//         this.isSaving.set(false);
//         this.cdr.markForCheck();
//       }), takeUntil(this.destroy$)
//     ).subscribe({
//       next: () => {
//         this.showDeleteDialog.set(false);
//         this.appMessage.showInfo('Organization deleted successfully. Logging out...');
//         this.authService.logout();
//         this.router.navigate(['/']);
//       },
//       error: (err) => this.appMessage.handleHttpError(err)
//     });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }

// // import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';

// // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
// // import { Router, RouterModule } from '@angular/router';
// // import { forkJoin, Subject } from 'rxjs';
// // import { finalize, takeUntil } from 'rxjs/operators';

// // /* PrimeNG v18 Modules */
// // import { ButtonModule } from 'primeng/button';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { DialogModule } from 'primeng/dialog';
// // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // import { ConfirmationService } from 'primeng/api';
// // import { TagModule } from 'primeng/tag';
// // import { AvatarModule } from 'primeng/avatar';
// // import { TabsModule } from 'primeng/tabs';
// // import { SelectModule } from 'primeng/select';
// // import { ToastModule } from 'primeng/toast';
// // import { BadgeModule } from 'primeng/badge';
// // import { DividerModule } from 'primeng/divider';
// // import { TooltipModule } from 'primeng/tooltip';

// // /* Custom Services & Components - Update paths as needed */
// // import { AuthService } from '../../../auth/services/auth-service';
// // import { OrganizationService } from '../../organization.service';
// // import { MasterListService } from '../../../../core/services/master-list.service';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { UserListComponent } from '../../../user/user-list/user-list'; // Assuming this is the grid component

// // @Component({
// //   selector: 'app-org-settings',
// //   standalone: true,
// //   imports: [
// //     ReactiveFormsModule,
// //     RouterModule,
// //     FormsModule,
// //     UserListComponent,
// //     ButtonModule,
// //     InputTextModule,
// //     DialogModule,
// //     TabsModule,
// //     ConfirmDialogModule,
// //     TagModule,
// //     AvatarModule,
// //     SelectModule,
// //     BadgeModule,
// //     ToastModule,
// //     DividerModule,
// //     TooltipModule
// // ],
// //   providers: [ConfirmationService],
// //   templateUrl: './org-settings.html',
// //   styleUrl: './org-settings.scss',
// //   changeDetection: ChangeDetectionStrategy.OnPush
// // })
// // export class OrgSettingsComponent implements OnInit, OnDestroy {
// //     private readonly destroy$ = new Subject<void>();
// //   private orgService = inject(OrganizationService);
// //   private authService = inject(AuthService);
// //   private fb = inject(FormBuilder);
// //   private appMessage = inject(AppMessageService);
// //   private confirmationService = inject(ConfirmationService);
// //   private router = inject(Router);
// //   private masterList = inject(MasterListService);
// //   private cdr = inject(ChangeDetectorRef);

// //   // --- UI State Signals ---
// //   isLoading = signal(true);
// //   isSaving = signal(false);
// //   successMessage = signal<string | null>(null);
// //   errorMessage = signal<string | null>(null);
// //   activeTab = signal('0');

// //   // Dialog visibility signals
// //   showInviteDialog = signal(false);
// //   showTransferDialog = signal(false);
// //   showDeleteDialog = signal(false);

// //   // --- Data Signals ---
// //   organization = signal<any>(null);
// //   activeMembers = signal<any[]>([]);
// //   pendingMembers = signal<any[]>([]);

// //   // --- Computed State ---
// //   isOwner = computed(() => {
// //     const org = this.organization();
// //     const user = this.authService.getCurrentUser();
// //     if (!org || !user) return false;
// //     // Handle both populated object or ID string
// //     const ownerId = org.owner?._id || org.owner;
// //     return ownerId === user._id;
// //   });

// //   // --- Forms ---
// //   orgForm!: FormGroup;
// //   inviteForm!: FormGroup;

// //   // Transfer Ownership state
// //   selectedNewOwnerId = signal<string | null>(null);
// //   transferConfirmName = signal<string>('');

// //   // Delete Organization state
// //   deleteConfirmName = signal<string>('');

// //   // Track selections for pending user approvals
// //   selectedRoles: { [userId: string]: string } = {};
// //   selectedBranches: { [userId: string]: string } = {};

// //   ngOnInit() {
// //     this.initForms();
// //     this.loadData();
// //   }

// //   private initForms() {
// //     this.orgForm = this.fb.group({
// //       name: ['', Validators.required],
// //       primaryEmail: ['', [Validators.required, Validators.email]],
// //       primaryPhone: ['', Validators.required],
// //       gstNumber: [''],
// //     });

// //     this.inviteForm = this.fb.group({
// //       name: ['', Validators.required],
// //       email: ['', [Validators.required, Validators.email]],
// //       password: ['', [Validators.required, Validators.minLength(6)]],
// //       role: [null, Validators.required],
// //       branchId: [null, Validators.required]
// //     });
// //   }

// //   loadData() {
// //     this.isLoading.set(true);

// //     forkJoin({
// //       org: this.orgService.getMyOrganization(),
// //       pending: this.orgService.getPendingMembers()
// //     })
// //       .pipe(finalize(() => {
// //         this.isLoading.set(false);
// //         this.cdr.markForCheck();
// //       }), takeUntil(this.destroy$))
// //       .subscribe({
// //         next: (res: any) => {
// //           const orgData = res.org.data;
// //           this.organization.set(orgData);
// //           this.orgForm.patchValue(orgData);

// //           // Filter approved members
// //           const members = orgData.members || [];
// //           this.activeMembers.set(members.filter((m: any) => m.status === 'approved' || !m.status));

// //           // Load pending requests
// //           this.pendingMembers.set(res.pending.data?.pendingMembers || []);
// //         },
// //         // Removed the trailing context string
// //         error: (err) => this.appMessage.handleHttpError(err)
// //       });
// //   }

// //   // --- Helpers for Template ---
// //   get roles() { return this.masterList.roles(); }
// //   get branches() { return this.masterList.branches(); }

// //   getSelectedOwnerName(): string {
// //     const id = this.selectedNewOwnerId();
// //     if (!id) return '';
// //     return this.activeMembers().find(m => m._id === id)?.name || '';
// //   }

// //   // --- Actions ---

// //   updateOrgDetails() {
// //     if (this.orgForm.invalid) {
// //       this.appMessage.showWarn('Validation Error: Please check the required fields.');
// //       return;
// //     }

// //     this.isSaving.set(true);
// //     this.successMessage.set(null);
// //     this.errorMessage.set(null);

// //     this.orgService.updateMyOrganization(this.orgForm.value)
// //       .pipe(finalize(() => {
// //         this.isSaving.set(false);
// //         this.cdr.markForCheck();
// //       }), takeUntil(this.destroy$))
// //       .subscribe({
// //         next: () => {
// //           const msg = 'Organization details updated successfully.';
// //           this.successMessage.set(msg);
// //           this.appMessage.showSuccess(msg);
// //         },
// //         error: (err) => {
// //           const msg = err.error?.message || 'Failed to update organization details. Please try again.';
// //           this.errorMessage.set(msg);
// //           this.appMessage.handleHttpError(err);
// //         }
// //       });
// //   }

// //   inviteUser() {
// //     if (this.inviteForm.invalid) {
// //       this.inviteForm.markAllAsTouched();
// //       this.appMessage.showWarn('Validation Error: Please fill in all required fields for the invitation.');
// //       return;
// //     }

// //     this.isSaving.set(true);
// //     this.orgService.inviteUser(this.inviteForm.value)
// //       .pipe(finalize(() => {
// //         this.isSaving.set(false);
// //         this.cdr.markForCheck();
// //       }), takeUntil(this.destroy$))
// //       .subscribe({
// //         next: () => {
// //           this.appMessage.showSuccess('Invitation sent successfully.');
// //           this.showInviteDialog.set(false);
// //           this.inviteForm.reset();
// //           this.loadData();
// //         },
// //         error: (err) => this.appMessage.handleHttpError(err)
// //       });
// //   }

// //   transferOwnership() {
// //     const newOwnerId = this.selectedNewOwnerId();

// //     if (!newOwnerId || this.transferConfirmName() !== this.organization()?.name) {
// //       this.appMessage.showWarn('Transfer Error: Name confirmation does not match or no user selected.');
// //       return;
// //     }

// //     this.isSaving.set(true);
// //     // Based on the 'Transfer' UI behavior acting instantaneously here, we will use forceTransferOwnership.
// //     // If the workflow prefers email verification, use initiateOwnershipTransfer instead.
// //     this.orgService.forceTransferOwnership({ newOwnerId })
// //       .pipe(finalize(() => {
// //         this.isSaving.set(false);
// //         this.cdr.markForCheck();
// //       }), takeUntil(this.destroy$))
// //       .subscribe({
// //         next: (res: any) => {
// //           this.appMessage.showSuccess(res.message || 'Ownership transferred successfully.');
// //           this.showTransferDialog.set(false);
// //           this.loadData();
// //         },
// //         error: (err) => this.appMessage.handleHttpError(err)
// //       });
// //   }

// //   cancelTransfer() {
// //     this.confirmationService.confirm({
// //       message: 'Are you sure you want to cancel the pending ownership transfer request?',
// //       header: 'Cancel Transfer Request',
// //       icon: 'pi pi-exclamation-triangle',
// //       accept: () => {
// //         this.isSaving.set(true);
// //         this.orgService.cancelOwnershipTransfer()
// //           .pipe(finalize(() => {
// //             this.isSaving.set(false);
// //             this.cdr.markForCheck();
// //           }), takeUntil(this.destroy$))
// //           .subscribe({
// //             next: (res: any) => {
// //               this.appMessage.showSuccess(res.message || 'Ownership transfer request cancelled successfully.');
// //             },
// //             error: (err) => this.appMessage.handleHttpError(err)
// //           });
// //       }
// //     });
// //   }



// //   approveMember(userId: string) {
// //     const roleId = this.selectedRoles[userId];
// //     const branchId = this.selectedBranches[userId];

// //     if (!roleId || !branchId) {
// //       this.appMessage.showWarn('Missing Info: Please assign a Role and Branch first.');
// //       return;
// //     }

// //     this.orgService.approveMember({ userId, branchId, roleId }).pipe(takeUntil(this.destroy$)).subscribe({
// //       next: () => {
// //         this.appMessage.showSuccess('Member approved successfully.');
// //         this.loadData();
// //       },
// //       error: (err) => this.appMessage.handleHttpError(err)
// //     });
// //   }



// //   rejectMember(userId: string) {
// //     this.confirmationService.confirm({
// //       message: 'Are you sure you want to reject this access request?',
// //       header: 'Confirm Rejection',
// //       icon: 'pi pi-user-minus',
// //       acceptButtonStyleClass: 'p-button-danger',
// //       accept: () => {
// //         this.orgService.rejectMember({ userId }).pipe(takeUntil(this.destroy$)).subscribe({
// //           next: () => {
// //             this.appMessage.showInfo('Request rejected.');
// //             this.loadData();
// //           },
// //           error: (err) => this.appMessage.handleHttpError(err)
// //         });
// //       }
// //     });
// //   }

// //   deleteOrganization() {
// //     if (this.deleteConfirmName() !== this.organization()?.name) {
// //       this.appMessage.showWarn('Validation Error: Organization name does not match.');
// //       return;
// //     }

// //     this.isSaving.set(true);

// //     this.orgService.deleteMyOrganization().pipe(
// //       finalize(() => {
// //         this.isSaving.set(false);
// //         this.cdr.markForCheck();
// //       }), takeUntil(this.destroy$)
// //     ).subscribe({
// //       next: () => {
// //         this.showDeleteDialog.set(false);
// //         this.appMessage.showInfo('Organization deleted successfully. Logging out...');
// //         this.authService.logout();
// //         this.router.navigate(['/']);
// //       },
// //       error: (err) => this.appMessage.handleHttpError(err)
// //     });
// //   }

// //     ngOnDestroy(): void {
// //         this.destroy$.next();
// //         this.destroy$.complete();
// //     }
// // }