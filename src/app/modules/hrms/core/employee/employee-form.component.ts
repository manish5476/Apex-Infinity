import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { TabBarComponent, TabItem } from '@shared/ui/tabs/tab-bar.component';

import { AppMessageService } from '../../../../core/services/message.service';
import { MasterDropdownService } from '../../../../core/services/master-dropdown.service';
import { CreateEmployeeDto, Employee, HRMSService } from '../../hrms.service';

type AccountOption = 'no_user' | 'link_existing' | 'create_user';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    TooltipModule,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    TabBarComponent,
  ],
  template: `
    <app-page>
      <app-page-header
        [title]="isEditMode() ? 'Edit Employee Profile' : 'Onboard New Employee'"
        [subtitle]="isEditMode() ? 'Update organizational record and employment terms' : 'Register employee in HRMS domain with explicit identity separation'">
        <div header-right class="flex items-center gap-2">
          <p-button
            label="Cancel"
            [text]="true"
            severity="secondary"
            (onClick)="onCancel()">
          </p-button>
          <p-button
            [label]="isEditMode() ? 'Save Changes' : 'Complete Onboarding'"
            [icon]="isEditMode() ? 'pi pi-check' : 'pi pi-user-plus'"
            [loading]="isSaving()"
            (onClick)="onSubmit()">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <div class="max-w-5xl mx-auto flex flex-col gap-6">
          
          <!-- Navigation Tabs -->
          <app-tab-bar
            [tabs]="formTabs"
            [(activeTabId)]="activeTab">
          </app-tab-bar>

          <form [formGroup]="form" class="flex flex-col gap-6">

            <!-- ========================================== -->
            <!-- TAB 1: IDENTITY & LOGIN ACCESS             -->
            <!-- ========================================== -->
            @if (activeTab() === 'account') {
              <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-6 shadow-sm">
                <div>
                  <h3 class="text-base font-semibold text-[var(--text-primary)] m-0">Identity & System Login</h3>
                  <p class="text-xs text-[var(--text-secondary)] mt-1">
                    Apex Infinity strictly decouples Authentication Users from HRMS Employees. Choose how this employee accesses the system.
                  </p>
                </div>

                <!-- Account Mode Selector (Only on New, or if unlinked on edit) -->
                @if (!isEditMode() || !form.get('user')?.value) {
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Option 1: No Login -->
                    <div
                      (click)="setAccountOption('no_user')"
                      [class]="accountOption() === 'no_user'
                        ? 'border-[var(--primary-color)] bg-[var(--primary-light,#eff6ff)] dark:bg-blue-950/20'
                        : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-secondary)]'"
                      class="border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-2">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-sm text-[var(--text-primary)]">No Login Access</span>
                        <i [class]="accountOption() === 'no_user' ? 'pi pi-check-circle text-[var(--primary-color)]' : 'pi pi-circle text-[var(--text-muted)]'"></i>
                      </div>
                      <p class="text-xs text-[var(--text-secondary)] m-0">
                        Pure HR record. Ideal for contractors, field staff, and factory workers without software access.
                      </p>
                    </div>

                    <!-- Option 2: Link Existing User -->
                    <div
                      (click)="setAccountOption('link_existing')"
                      [class]="accountOption() === 'link_existing'
                        ? 'border-[var(--primary-color)] bg-[var(--primary-light,#eff6ff)] dark:bg-blue-950/20'
                        : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-secondary)]'"
                      class="border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-2">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-sm text-[var(--text-primary)]">Link Existing User</span>
                        <i [class]="accountOption() === 'link_existing' ? 'pi pi-check-circle text-[var(--primary-color)]' : 'pi pi-circle text-[var(--text-muted)]'"></i>
                      </div>
                      <p class="text-xs text-[var(--text-secondary)] m-0">
                        Connect to an existing login identity in your organization.
                      </p>
                    </div>

                    <!-- Option 3: Create New User -->
                    <div
                      (click)="setAccountOption('create_user')"
                      [class]="accountOption() === 'create_user'
                        ? 'border-[var(--primary-color)] bg-[var(--primary-light,#eff6ff)] dark:bg-blue-950/20'
                        : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-secondary)]'"
                      class="border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-2">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-sm text-[var(--text-primary)]">Create Login User</span>
                        <i [class]="accountOption() === 'create_user' ? 'pi pi-check-circle text-[var(--primary-color)]' : 'pi pi-circle text-[var(--text-muted)]'"></i>
                      </div>
                      <p class="text-xs text-[var(--text-secondary)] m-0">
                        Provision email login credentials and assign system roles on creation.
                      </p>
                    </div>
                  </div>
                } @else {
                    <div class="flex items-center gap-3">
                      <i class="pi pi-check-circle text-emerald-600 text-xl"></i>
                      <div>
                        <div class="font-semibold text-sm text-emerald-900 dark:text-emerald-100">Linked User Account Active</div>
                        <div class="text-xs text-emerald-700 dark:text-emerald-300">
                          This employee record is securely linked to <strong class="font-bold">{{ linkedUserInfo()?.name || 'User Account' }}</strong> ({{ linkedUserInfo()?.email || 'Login Active' }}).
                        </div>
                      </div>
                    </div>
                }

                <!-- Subform: Link Existing User -->
                @if (accountOption() === 'link_existing') {
                  <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col gap-3">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Select System User</label>
                    <p-select
                      [options]="userOptions()"
                      formControlName="user"
                      optionLabel="label"
                      optionValue="value"
                      [filter]="true"
                      filterBy="label"
                      placeholder="Search and select existing user..."
                      styleClass="w-full" />
                  </div>
                }

                <!-- Subform: Create New User -->
                @if (accountOption() === 'create_user') {
                  <div formGroupName="createUser" class="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col gap-4">
                    <div class="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <i class="pi pi-shield text-[var(--primary-color)]"></i>
                      New User Credentials
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-[var(--text-secondary)]">User Login Email *</label>
                        <input type="email" pInputText formControlName="email" placeholder="user@company.com" class="w-full" />
                      </div>
                      <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-[var(--text-secondary)]">Initial Password</label>
                        <input type="password" pInputText formControlName="password" placeholder="Leave blank to auto-generate" class="w-full" />
                      </div>
                      <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-[var(--text-secondary)]">Assigned System Role</label>
                        <p-select
                          [options]="roleOptions()"
                          formControlName="roleId"
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Select RBAC Role..."
                          styleClass="w-full" />
                      </div>
                    </div>
                  </div>
                }

                <!-- Canonical Employee Contact Fields -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">First Name *</label>
                    <input type="text" pInputText formControlName="firstName" placeholder="First Name" class="w-full" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Last Name</label>
                    <input type="text" pInputText formControlName="lastName" placeholder="Last Name" class="w-full" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Official Email</label>
                    <input type="email" pInputText formControlName="officialEmail" placeholder="employee@company.com" class="w-full" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Contact Phone</label>
                    <input type="text" pInputText formControlName="phone" placeholder="+91..." class="w-full" />
                  </div>
                </div>
              </div>
            }

            <!-- ========================================== -->
            <!-- TAB 2: EMPLOYMENT & ORGANIZATION           -->
            <!-- ========================================== -->
            @if (activeTab() === 'employment') {
              <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-6 shadow-sm">
                <div>
                  <h3 class="text-base font-semibold text-[var(--text-primary)] m-0">Employment & Organization</h3>
                  <p class="text-xs text-[var(--text-secondary)] mt-1">Designate organizational unit, reporting manager, and contract terms.</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Employee Code / ID</label>
                    <input type="text" pInputText formControlName="employeeId" placeholder="e.g. EMP-0010" class="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Department *</label>
                    <p-select
                      [options]="departmentOptions()"
                      formControlName="departmentId"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Department..."
                      styleClass="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Designation *</label>
                    <p-select
                      [options]="designationOptions()"
                      formControlName="designationId"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Designation..."
                      styleClass="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Branch</label>
                    <p-select
                      [options]="branchOptions()"
                      formControlName="branchId"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Branch..."
                      styleClass="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Reporting Manager</label>
                    <p-select
                      [options]="userOptions()"
                      formControlName="reportingManagerId"
                      optionLabel="label"
                      optionValue="value"
                      [filter]="true"
                      placeholder="Select Manager..."
                      styleClass="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Employment Type</label>
                    <p-select
                      [options]="employmentTypeOptions"
                      formControlName="employmentType"
                      optionLabel="label"
                      optionValue="value"
                      styleClass="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Work Mode</label>
                    <p-select
                      [options]="workModeOptions"
                      formControlName="workMode"
                      optionLabel="label"
                      optionValue="value"
                      styleClass="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</label>
                    <p-select
                      [options]="statusOptions"
                      formControlName="status"
                      optionLabel="label"
                      optionValue="value"
                      styleClass="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Date of Joining</label>
                    <input type="date" pInputText formControlName="dateOfJoining" class="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Probation End Date</label>
                    <input type="date" pInputText formControlName="probationEndDate" class="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Confirmation Date</label>
                    <input type="date" pInputText formControlName="confirmationDate" class="w-full" />
                  </div>
                </div>
              </div>
            }

            <!-- ========================================== -->
            <!-- TAB 3: ATTENDANCE & SHIFTS                 -->
            <!-- ========================================== -->
            @if (activeTab() === 'attendance') {
              <div formGroupName="attendanceConfig" class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-6 shadow-sm">
                <div>
                  <h3 class="text-base font-semibold text-[var(--text-primary)] m-0">Attendance & Shifts</h3>
                  <p class="text-xs text-[var(--text-secondary)] mt-1">Configure biometric device mapping, default shift rosters, and punch authorization.</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Biometric Machine ID</label>
                    <input type="text" pInputText formControlName="machineUserId" placeholder="e.g. 101" class="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Default Shift</label>
                    <p-select
                      [options]="shiftOptions()"
                      formControlName="shiftId"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Shift..."
                      styleClass="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Shift Group</label>
                    <p-select
                      [options]="shiftGroupOptions()"
                      formControlName="shiftGroupId"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Rotation Group..."
                      styleClass="w-full" />
                  </div>
                </div>

                <div class="border-t border-[var(--border-primary)] pt-4 flex flex-col gap-3">
                  <span class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Punch Permissions & Rules</span>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" formControlName="isAttendanceEnabled" class="rounded text-[var(--primary-color)]" />
                      <span class="text-sm text-[var(--text-primary)] font-medium">Track Daily Attendance</span>
                    </label>

                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" formControlName="allowWebPunch" class="rounded text-[var(--primary-color)]" />
                      <span class="text-sm text-[var(--text-primary)] font-medium">Allow Browser Web Punch</span>
                    </label>

                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" formControlName="allowMobilePunch" class="rounded text-[var(--primary-color)]" />
                      <span class="text-sm text-[var(--text-primary)] font-medium">Allow Mobile App Punch</span>
                    </label>
                  </div>
                </div>
              </div>
            }

            <!-- ========================================== -->
            <!-- TAB 4: COMPENSATION & BANK                 -->
            <!-- ========================================== -->
            @if (activeTab() === 'compensation') {
              <div formGroupName="compensation" class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-6 shadow-sm">
                <div>
                  <h3 class="text-base font-semibold text-[var(--text-primary)] m-0">Compensation & Bank Details</h3>
                  <p class="text-xs text-[var(--text-secondary)] mt-1">Payroll base figures and bank account details for salary disbursement.</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Annual CTC</label>
                    <input type="number" pInputText formControlName="ctcAnnual" placeholder="e.g. 1200000" class="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Pay Cycle</label>
                    <p-select
                      [options]="payCycleOptions"
                      formControlName="payCycle"
                      optionLabel="label"
                      optionValue="value"
                      styleClass="w-full" />
                  </div>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Currency</label>
                    <input type="text" pInputText formControlName="currency" placeholder="INR" class="w-full" />
                  </div>
                </div>

                <div formGroupName="bankDetails" class="border-t border-[var(--border-primary)] pt-4 flex flex-col gap-4">
                  <span class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Bank & Statutory Information</span>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-[var(--text-secondary)]">Bank Name</label>
                      <input type="text" pInputText formControlName="bankName" placeholder="e.g. HDFC Bank" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-[var(--text-secondary)]">Account Holder Name</label>
                      <input type="text" pInputText formControlName="accountName" placeholder="Name as per bank" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-[var(--text-secondary)]">Account Number</label>
                      <input type="text" pInputText formControlName="accountNumber" placeholder="Account Number" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-[var(--text-secondary)]">IFSC Code</label>
                      <input type="text" pInputText formControlName="ifscCode" placeholder="HDFC0001234" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-[var(--text-secondary)]">PAN Card Number</label>
                      <input type="text" pInputText formControlName="panCard" placeholder="ABCDE1234F" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-[var(--text-secondary)]">UAN Number (PF)</label>
                      <input type="text" pInputText formControlName="uanNumber" placeholder="UAN" class="w-full" />
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- ========================================== -->
            <!-- TAB 5: PERSONAL & EMERGENCY                -->
            <!-- ========================================== -->
            @if (activeTab() === 'personal') {
              <div class="flex flex-col gap-6">
                <!-- Personal Details -->
                <div formGroupName="personal" class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                  <div>
                    <h3 class="text-base font-semibold text-[var(--text-primary)] m-0">Personal Demographics</h3>
                    <p class="text-xs text-[var(--text-secondary)] mt-1">Standard HR demographic data.</p>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Date of Birth</label>
                      <input type="date" pInputText formControlName="dateOfBirth" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Gender</label>
                      <p-select
                        [options]="genderOptions"
                        formControlName="gender"
                        optionLabel="label"
                        optionValue="value"
                        styleClass="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Marital Status</label>
                      <p-select
                        [options]="maritalStatusOptions"
                        formControlName="maritalStatus"
                        optionLabel="label"
                        optionValue="value"
                        styleClass="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Blood Group</label>
                      <input type="text" pInputText formControlName="bloodGroup" placeholder="e.g. O+" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Personal Secondary Phone</label>
                      <input type="text" pInputText formControlName="secondaryPhone" placeholder="+91..." class="w-full" />
                    </div>
                  </div>
                </div>

                <!-- Emergency Contacts -->
                <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-base font-semibold text-[var(--text-primary)] m-0">Emergency Contacts</h3>
                      <p class="text-xs text-[var(--text-secondary)] mt-1">Next of kin or emergency reach-outs.</p>
                    </div>
                    <p-button
                      label="Add Contact"
                      icon="pi pi-plus"
                      [text]="true"
                      (onClick)="addEmergencyContact()">
                    </p-button>
                  </div>

                  <div formArrayName="emergencyContacts" class="flex flex-col gap-3">
                    @for (contact of emergencyContactsArray.controls; track $index) {
                      <div [formGroupName]="$index" class="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div class="flex flex-col gap-1">
                          <label class="text-xs font-medium text-[var(--text-secondary)]">Contact Name</label>
                          <input type="text" pInputText formControlName="name" placeholder="Name" class="w-full" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="text-xs font-medium text-[var(--text-secondary)]">Relationship</label>
                          <input type="text" pInputText formControlName="relationship" placeholder="e.g. Spouse, Parent" class="w-full" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="text-xs font-medium text-[var(--text-secondary)]">Phone Number</label>
                          <input type="text" pInputText formControlName="phone" placeholder="Phone" class="w-full" />
                        </div>
                        <div class="flex justify-end">
                          <p-button
                            icon="pi pi-trash"
                            severity="danger"
                            [text]="true"
                            (onClick)="removeEmergencyContact($index)">
                          </p-button>
                        </div>
                      </div>
                    }
                    @if (emergencyContactsArray.length === 0) {
                      <div class="text-xs text-[var(--text-muted)] italic py-2">No emergency contacts added yet.</div>
                    }
                  </div>
                </div>
              </div>
            }

          </form>
        </div>
      </app-page-content>
    </app-page>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
      height: 100%;
    }
  `]
})
export class EmployeeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly hrmsService = inject(HRMSService);
  private readonly masterDropdownService = inject(MasterDropdownService);
  private readonly messageService = inject(AppMessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);
  readonly activeTab = signal('account');
  readonly accountOption = signal<AccountOption>('no_user');
  readonly linkedUserInfo = signal<{ name: string; email: string } | null>(null);

  readonly formTabs: TabItem[] = [
    { id: 'account', label: 'Identity & Access', icon: 'pi pi-user' },
    { id: 'employment', label: 'Employment & Org', icon: 'pi pi-briefcase' },
    { id: 'attendance', label: 'Attendance & Shifts', icon: 'pi pi-clock' },
    { id: 'compensation', label: 'Compensation & Bank', icon: 'pi pi-dollar' },
    { id: 'personal', label: 'Personal & Emergency', icon: 'pi pi-heart' },
  ];

  readonly departmentOptions = signal<{ label: string; value: string }[]>([]);
  readonly designationOptions = signal<{ label: string; value: string }[]>([]);
  readonly branchOptions = signal<{ label: string; value: string }[]>([]);
  readonly userOptions = signal<{ label: string; value: string }[]>([]);
  readonly roleOptions = signal<{ label: string; value: string }[]>([]);
  readonly shiftOptions = signal<{ label: string; value: string }[]>([]);
  readonly shiftGroupOptions = signal<{ label: string; value: string }[]>([]);

  readonly employmentTypeOptions = [
    { label: 'Permanent', value: 'permanent' },
    { label: 'Contract', value: 'contract' },
    { label: 'Intern', value: 'intern' },
    { label: 'Probation', value: 'probation' },
    { label: 'Consultant', value: 'consultant' },
  ];

  readonly workModeOptions = [
    { label: 'Office', value: 'office' },
    { label: 'Remote', value: 'remote' },
    { label: 'Hybrid', value: 'hybrid' },
    { label: 'Field', value: 'field' },
  ];

  readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Probation', value: 'probation' },
    { label: 'Notice Period', value: 'notice_period' },
    { label: 'Relieved', value: 'relieved' },
    { label: 'Terminated', value: 'terminated' },
    { label: 'Inactive', value: 'inactive' },
  ];

  readonly payCycleOptions = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Daily', value: 'daily' },
  ];

  readonly genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'prefer_not_to_say' },
  ];

  readonly maritalStatusOptions = [
    { label: 'Single', value: 'single' },
    { label: 'Married', value: 'married' },
    { label: 'Divorced', value: 'divorced' },
    { label: 'Widowed', value: 'widowed' },
  ];

  readonly form = this.fb.group({
    user: [null as string | null],
    firstName: ['', [Validators.required]],
    lastName: [''],
    officialEmail: [''],
    phone: [''],
    employeeId: [''],
    departmentId: ['', [Validators.required]],
    designationId: ['', [Validators.required]],
    branchId: [null as string | null],
    reportingManagerId: [null as string | null],
    employmentType: ['permanent'],
    workMode: ['office'],
    status: ['active'],
    dateOfJoining: [new Date().toISOString().substring(0, 10)],
    probationEndDate: [null as string | null],
    confirmationDate: [null as string | null],

    createUser: this.fb.group({
      email: [''],
      password: [''],
      roleId: [null as string | null],
    }),

    attendanceConfig: this.fb.group({
      machineUserId: [''],
      shiftId: [null as string | null],
      shiftGroupId: [null as string | null],
      isAttendanceEnabled: [true],
      allowWebPunch: [false],
      allowMobilePunch: [true],
    }),

    compensation: this.fb.group({
      ctcAnnual: [null as number | null],
      payCycle: ['monthly'],
      currency: ['INR'],
      bankDetails: this.fb.group({
        bankName: [''],
        accountName: [''],
        accountNumber: [''],
        ifscCode: [''],
        panCard: [''],
        uanNumber: [''],
      }),
    }),

    personal: this.fb.group({
      dateOfBirth: [null as string | null],
      gender: ['prefer_not_to_say'],
      maritalStatus: ['single'],
      bloodGroup: [''],
      secondaryPhone: [''],
    }),

    emergencyContacts: this.fb.array<FormGroup>([]),
  });

  get emergencyContactsArray(): FormArray {
    return this.form.get('emergencyContacts') as FormArray;
  }

  private employeeIdParam: string | null = null;

  ngOnInit(): void {
    this.loadDropdownData();

    this.employeeIdParam = this.route.snapshot.paramMap.get('id');
    if (this.employeeIdParam && this.employeeIdParam !== 'new') {
      this.isEditMode.set(true);
      this.loadEmployeeData(this.employeeIdParam);
    }
  }

  setAccountOption(option: AccountOption): void {
    this.accountOption.set(option);
    if (option === 'no_user') {
      this.form.patchValue({ user: null });
    }
  }

  addEmergencyContact(initialData?: any): void {
    const contactGroup = this.fb.group({
      name: [initialData?.name || '', [Validators.required]],
      relationship: [initialData?.relationship || ''],
      phone: [initialData?.phone || '', [Validators.required]],
    });
    this.emergencyContactsArray.push(contactGroup);
  }

  removeEmergencyContact(index: number): void {
    this.emergencyContactsArray.removeAt(index);
  }

  private loadDropdownData(): void {
    this.masterDropdownService.getDropdownData('departments').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.departmentOptions.set((res.data || []).map(d => ({ label: d.label, value: d.value })));
    });

    this.masterDropdownService.getDropdownData('designations').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.designationOptions.set((res.data || []).map(d => ({ label: d.label, value: d.value })));
    });

    this.masterDropdownService.getDropdownData('branches').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.branchOptions.set((res.data || []).map(d => ({ label: d.label, value: d.value })));
    });

    this.masterDropdownService.getDropdownData('users').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.userOptions.set((res.data || []).map(d => ({ label: d.label, value: d.value })));
    });

    this.masterDropdownService.getDropdownData('roles').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.roleOptions.set((res.data || []).map(d => ({ label: d.label, value: d.value })));
    });

    this.masterDropdownService.getDropdownData('shifts').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.shiftOptions.set((res.data || []).map(d => ({ label: d.label, value: d.value })));
    });

    this.hrmsService.getShiftGroups().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      const groups = res?.data?.shiftGroups || [];
      this.shiftGroupOptions.set(groups.map((g: any) => ({ label: g.name, value: g._id })));
    });
  }

  private loadEmployeeData(id: string): void {
    this.hrmsService.getEmployee(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const emp = res.data?.employee;
        if (!emp) return;

        const userId = typeof emp.user === 'object' && emp.user !== null ? emp.user._id : (emp.user || null);
        if (typeof emp.user === 'object' && emp.user !== null) {
          this.linkedUserInfo.set({ name: emp.user.name || '', email: emp.user.email || '' });
        }
        const deptId = typeof emp.departmentId === 'object' && emp.departmentId !== null ? (emp.departmentId as any)._id : emp.departmentId;
        const desigId = typeof emp.designationId === 'object' && emp.designationId !== null ? (emp.designationId as any)._id : emp.designationId;
        const branchId = typeof emp.branchId === 'object' && emp.branchId !== null ? (emp.branchId as any)._id : emp.branchId;
        const mgrId = typeof emp.reportingManagerId === 'object' && emp.reportingManagerId !== null ? (emp.reportingManagerId as any)._id : emp.reportingManagerId;

        this.form.patchValue({
          user: userId,
          firstName: emp.firstName || '',
          lastName: emp.lastName || '',
          officialEmail: emp.officialEmail || '',
          phone: emp.phone || '',
          employeeId: emp.employeeId || '',
          departmentId: deptId || '',
          designationId: desigId || '',
          branchId: branchId || null,
          reportingManagerId: mgrId || null,
          employmentType: emp.employmentType || 'permanent',
          workMode: emp.workMode || 'office',
          status: emp.status || 'active',
          dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().substring(0, 10) : null,
          probationEndDate: emp.probationEndDate ? new Date(emp.probationEndDate).toISOString().substring(0, 10) : null,
          confirmationDate: emp.confirmationDate ? new Date(emp.confirmationDate).toISOString().substring(0, 10) : null,
          attendanceConfig: {
            machineUserId: emp.attendanceConfig?.machineUserId || '',
            shiftId: emp.attendanceConfig?.shiftId || null,
            shiftGroupId: emp.attendanceConfig?.shiftGroupId || null,
            isAttendanceEnabled: emp.attendanceConfig?.isAttendanceEnabled ?? true,
            allowWebPunch: emp.attendanceConfig?.allowWebPunch ?? false,
            allowMobilePunch: emp.attendanceConfig?.allowMobilePunch ?? true,
          },
          compensation: {
            ctcAnnual: emp.compensation?.ctcAnnual || null,
            payCycle: emp.compensation?.payCycle || 'monthly',
            currency: emp.compensation?.currency || 'INR',
            bankDetails: {
              bankName: emp.compensation?.bankDetails?.bankName || '',
              accountName: emp.compensation?.bankDetails?.accountName || '',
              accountNumber: emp.compensation?.bankDetails?.accountNumber || '',
              ifscCode: emp.compensation?.bankDetails?.ifscCode || '',
              panCard: emp.compensation?.bankDetails?.panCard || '',
              uanNumber: emp.compensation?.bankDetails?.uanNumber || '',
            },
          },
          personal: {
            dateOfBirth: emp.personal?.dateOfBirth ? new Date(emp.personal.dateOfBirth).toISOString().substring(0, 10) : null,
            gender: emp.personal?.gender || 'prefer_not_to_say',
            maritalStatus: emp.personal?.maritalStatus || 'single',
            bloodGroup: emp.personal?.bloodGroup || '',
            secondaryPhone: emp.personal?.secondaryPhone || '',
          },
        });

        if (emp.emergencyContacts && Array.isArray(emp.emergencyContacts)) {
          this.emergencyContactsArray.clear();
          emp.emergencyContacts.forEach(c => this.addEmergencyContact(c));
        }

        if (userId) {
          this.accountOption.set('link_existing');
        } else {
          this.accountOption.set('no_user');
        }
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.showError('Please check all required fields in the form.');
      if (this.form.get('firstName')?.invalid || this.form.get('departmentId')?.invalid || this.form.get('designationId')?.invalid) {
        this.activeTab.set(this.form.get('firstName')?.invalid ? 'account' : 'employment');
      }
      return;
    }

    this.isSaving.set(true);
    const formVal = this.form.value;

    const payload: any = {
      firstName: formVal.firstName,
      lastName: formVal.lastName || undefined,
      officialEmail: formVal.officialEmail || undefined,
      phone: formVal.phone || undefined,
      employeeId: formVal.employeeId || undefined,
      departmentId: formVal.departmentId,
      designationId: formVal.designationId,
      branchId: formVal.branchId || undefined,
      reportingManagerId: formVal.reportingManagerId || undefined,
      employmentType: formVal.employmentType,
      workMode: formVal.workMode,
      status: formVal.status,
      dateOfJoining: formVal.dateOfJoining || undefined,
      probationEndDate: formVal.probationEndDate || undefined,
      confirmationDate: formVal.confirmationDate || undefined,
      attendanceConfig: formVal.attendanceConfig,
      compensation: formVal.compensation,
      personal: formVal.personal,
      emergencyContacts: formVal.emergencyContacts,
    };

    // Account link / create logic
    if (this.accountOption() === 'link_existing' && formVal.user) {
      payload.user = formVal.user;
    } else if (this.accountOption() === 'no_user') {
      payload.user = null;
    } else if (this.accountOption() === 'create_user' && formVal.createUser?.email) {
      payload.createUser = {
        name: [formVal.firstName, formVal.lastName].filter(Boolean).join(' '),
        email: formVal.createUser.email,
        password: formVal.createUser.password || undefined,
        roleId: formVal.createUser.roleId || undefined,
      };
    }

    if (this.isEditMode() && this.employeeIdParam) {
      this.hrmsService.updateEmployee(this.employeeIdParam, payload).pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.messageService.showSuccess('Employee record updated successfully.');
          this.router.navigate(['/hrms/employees/workspace', this.employeeIdParam]);
        },
        error: err => this.messageService.handleHttpError(err),
      });
    } else {
      this.hrmsService.createEmployee(payload).pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: res => {
          this.messageService.showSuccess('Employee onboarded successfully.');
          const createdId = res.data?.employee?._id;
          if (createdId) {
            this.router.navigate(['/hrms/employees/workspace', createdId]);
          } else {
            this.router.navigate(['/hrms/employees/list']);
          }
        },
        error: err => this.messageService.handleHttpError(err),
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode() && this.employeeIdParam) {
      this.router.navigate(['/hrms/employees/workspace', this.employeeIdParam]);
    } else {
      this.router.navigate(['/hrms/employees/list']);
    }
  }
}
