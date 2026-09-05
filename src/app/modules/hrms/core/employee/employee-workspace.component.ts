import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';

import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { TabBarComponent, TabItem } from '@shared/ui/tabs/tab-bar.component';

import { AppMessageService } from '../../../../core/services/message.service';
import {
  CompanyAsset,
  DeactivateEmployeeDto,
  EmployeeDocument,
  EmployeeWorkspace360,
  HRMSService,
  InviteUserDto,
} from '../../hrms.service';

@Component({
  selector: 'app-employee-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    ProgressBarModule,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    TabBarComponent,
  ],
  template: `
    <app-page>
      @if (workspace(); as ws) {
        <app-page-header
          [title]="employeeName()"
          [subtitle]="(ws.employee.employeeId || '') + ' • ' + designationTitle() + ' • ' + departmentName()">
          <div header-left class="flex items-center gap-3">
            <p-button
              icon="pi pi-arrow-left"
              [text]="true"
              severity="secondary"
              pTooltip="Back to Directory"
              (onClick)="goBack()">
            </p-button>
          </div>

          <div header-right class="flex items-center gap-2 flex-wrap">
            <p-button
              label="Edit Record"
              icon="pi pi-pencil"
              severity="secondary"
              (onClick)="editEmployee()">
            </p-button>

            @if (!ws.employee.user) {
              <p-button
                label="Provision User Login"
                icon="pi pi-user-plus"
                (onClick)="openInviteDialog()">
              </p-button>
            }

            <p-button
              label="Offboard"
              icon="pi pi-user-minus"
              severity="danger"
              [text]="true"
              (onClick)="openDeactivateDialog()">
            </p-button>
          </div>
        </app-page-header>

        <app-page-content [padded]="true">
          <div class="max-w-6xl mx-auto flex flex-col gap-6">

            <!-- Executive Identity Header Banner -->
            <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--primary-color)] to-indigo-500 text-white font-bold text-2xl flex items-center justify-center shadow-md shrink-0">
                  {{ employeeName().charAt(0).toUpperCase() }}
                </div>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h2 class="text-xl font-bold text-[var(--text-primary)] m-0">{{ employeeName() }}</h2>
                    <span [class]="statusBadgeClass(ws.employee.status)" class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                      {{ ws.employee.status }}
                    </span>
                    @if (ws.employee.user) {
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Login Active
                      </span>
                    } @else {
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        No Login Access
                      </span>
                    }
                  </div>
                  <div class="flex items-center gap-4 text-xs text-[var(--text-secondary)] flex-wrap">
                    <span><i class="pi pi-envelope mr-1 text-[var(--text-muted)]"></i>{{ officialEmail() }}</span>
                    @if (contactPhone()) {
                      <span><i class="pi pi-phone mr-1 text-[var(--text-muted)]"></i>{{ contactPhone() }}</span>
                    }
                    <span><i class="pi pi-map-pin mr-1 text-[var(--text-muted)]"></i>{{ branchName() }}</span>
                    <span><i class="pi pi-calendar mr-1 text-[var(--text-muted)]"></i>Joined {{ joiningDateFormatted() }}</span>
                  </div>
                </div>
              </div>

              <!-- Key Metrics Bar -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
                <!-- Today Attendance -->
                <div class="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col min-w-[100px]">
                  <span class="text-[11px] text-[var(--text-secondary)] font-medium">Today Status</span>
                  <span class="text-sm font-bold text-[var(--text-primary)] capitalize">{{ todayStatus() }}</span>
                </div>

                <!-- Service Years -->
                <div class="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col min-w-[100px]">
                  <span class="text-[11px] text-[var(--text-secondary)] font-medium">Tenure</span>
                  <span class="text-sm font-bold text-[var(--text-primary)]">{{ ws.employee.serviceYears || 0 }} Yrs</span>
                </div>

                <!-- Leaves Remaining -->
                <div class="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col min-w-[100px]">
                  <span class="text-[11px] text-[var(--text-secondary)] font-medium">Leaves Left</span>
                  <span class="text-sm font-bold text-[var(--text-primary)]">{{ totalLeavesAvailable() }} Days</span>
                </div>

                <!-- Assigned Assets -->
                <div class="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col min-w-[100px]">
                  <span class="text-[11px] text-[var(--text-secondary)] font-medium">Assets</span>
                  <span class="text-sm font-bold text-[var(--text-primary)]">{{ (ws.assignedAssets || []).length }} Items</span>
                </div>
              </div>
            </div>

            <!-- Cockpit Workspace Navigation Tabs -->
            <app-tab-bar
              [tabs]="workspaceTabs"
              [(activeTabId)]="activeTab">
            </app-tab-bar>

            <!-- ========================================== -->
            <!-- TAB 1: OVERVIEW & PROFILE                  -->
            <!-- ========================================== -->
            @if (activeTab() === 'overview') {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Organization Profile -->
                <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                  <h3 class="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider m-0">Organizational Assignment</h3>
                  
                  <div class="flex flex-col gap-3 text-sm divide-y divide-[var(--border-primary)]">
                    <div class="flex justify-between py-2">
                      <span class="text-[var(--text-secondary)]">Department</span>
                      <span class="font-semibold text-[var(--text-primary)]">{{ departmentName() }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-[var(--text-secondary)]">Designation</span>
                      <span class="font-semibold text-[var(--text-primary)]">{{ designationTitle() }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-[var(--text-secondary)]">Branch / Location</span>
                      <span class="font-semibold text-[var(--text-primary)]">{{ branchName() }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-[var(--text-secondary)]">Reporting Manager</span>
                      <span class="font-semibold text-[var(--text-primary)]">{{ reportingManagerName() }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-[var(--text-secondary)]">Employment Type</span>
                      <span class="font-semibold text-[var(--text-primary)] capitalize">{{ ws.employee.employmentType || 'Permanent' }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-[var(--text-secondary)]">Work Mode</span>
                      <span class="font-semibold text-[var(--text-primary)] capitalize">{{ ws.employee.workMode || 'Office' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Personal Demographics -->
                <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                  <h3 class="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider m-0">Personal Demographics</h3>
                  
                  <div class="flex flex-col gap-3 text-sm divide-y divide-[var(--border-primary)]">
                    <div class="flex justify-between py-2">
                      <span class="text-[var(--text-secondary)]">Date of Birth</span>
                      <span class="font-semibold text-[var(--text-primary)]">{{ formatDate(ws.employee.personal?.dateOfBirth) }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-[var(--text-secondary)]">Gender</span>
                      <span class="font-semibold text-[var(--text-primary)] capitalize">{{ ws.employee.personal?.gender || '—' }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-[var(--text-secondary)]">Marital Status</span>
                      <span class="font-semibold text-[var(--text-primary)] capitalize">{{ ws.employee.personal?.maritalStatus || '—' }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-[var(--text-secondary)]">Blood Group</span>
                      <span class="font-semibold text-[var(--text-primary)]">{{ ws.employee.personal?.bloodGroup || '—' }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-[var(--text-secondary)]">Personal Secondary Phone</span>
                      <span class="font-semibold text-[var(--text-primary)]">{{ ws.employee.personal?.secondaryPhone || '—' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Emergency Contacts -->
                <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-4 shadow-sm md:col-span-2">
                  <h3 class="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider m-0">Emergency Contacts</h3>
                  
                  @if (ws.employee.emergencyContacts && ws.employee.emergencyContacts.length > 0) {
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      @for (c of ws.employee.emergencyContacts; track $index) {
                        <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col gap-1">
                          <span class="font-bold text-sm text-[var(--text-primary)]">{{ c.name }}</span>
                          <span class="text-xs text-[var(--text-secondary)] font-medium">{{ c.relationship || 'Emergency Reach' }}</span>
                          <span class="text-xs text-[var(--primary-color)] font-mono mt-1">{{ c.phone }}</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="text-xs text-[var(--text-muted)] italic m-0">No emergency contacts registered.</p>
                  }
                </div>
              </div>
            }

            <!-- ========================================== -->
            <!-- TAB 2: ATTENDANCE & SHIFTS                 -->
            <!-- ========================================== -->
            @if (activeTab() === 'attendance') {
              <div class="flex flex-col gap-6">
                <!-- Shift and Punch Config -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-5 shadow-sm flex flex-col gap-2">
                    <span class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Assigned Shift</span>
                    <span class="text-lg font-bold text-[var(--text-primary)]">{{ shiftName() }}</span>
                    <span class="text-xs text-[var(--text-muted)]">Configured Roster Template</span>
                  </div>

                  <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-5 shadow-sm flex flex-col gap-2">
                    <span class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Biometric Device ID</span>
                    <span class="text-lg font-bold text-[var(--text-primary)] font-mono">{{ ws.employee.attendanceConfig?.machineUserId || 'Not Assigned' }}</span>
                    <span class="text-xs text-[var(--text-muted)]">Hardware Mapping</span>
                  </div>

                  <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-5 shadow-sm flex flex-col gap-2">
                    <span class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Punch Permissions</span>
                    <div class="flex items-center gap-2 pt-1">
                      <span [class]="ws.employee.attendanceConfig?.allowWebPunch ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'" class="px-2 py-0.5 rounded text-[11px] font-semibold">Web</span>
                      <span [class]="ws.employee.attendanceConfig?.allowMobilePunch ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'" class="px-2 py-0.5 rounded text-[11px] font-semibold">Mobile</span>
                      <span [class]="ws.employee.attendanceConfig?.enforceGeoFence ? 'bg-blue-100 text-blue-800' : 'bg-zinc-100 text-zinc-500'" class="px-2 py-0.5 rounded text-[11px] font-semibold">Geofenced</span>
                    </div>
                  </div>
                </div>

                <!-- Recent Raw Punches -->
                <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                  <h3 class="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider m-0">Recent Punch Activity (Last 10 Logs)</h3>
                  
                  @if (ws.recentPunches && ws.recentPunches.length > 0) {
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr class="border-b border-[var(--border-primary)] text-xs text-[var(--text-secondary)] uppercase">
                            <th class="py-2.5 px-3">Timestamp</th>
                            <th class="py-2.5 px-3">Punch Type</th>
                            <th class="py-2.5 px-3">Source Device</th>
                            <th class="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-[var(--border-primary)] text-xs">
                          @for (punch of ws.recentPunches; track $index) {
                            <tr>
                              <td class="py-2.5 px-3 font-mono font-medium">{{ formatDateTime(punch.timestamp) }}</td>
                              <td class="py-2.5 px-3 capitalize font-semibold">{{ punch.punchType || 'In' }}</td>
                              <td class="py-2.5 px-3 text-[var(--text-secondary)]">{{ punch.source || 'Biometric' }}</td>
                              <td class="py-2.5 px-3">
                                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Verified</span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <p class="text-xs text-[var(--text-muted)] italic m-0">No recent punch logs available for this employee.</p>
                  }
                </div>
              </div>
            }

            <!-- ========================================== -->
            <!-- TAB 3: LEAVE BALANCES                      -->
            <!-- ========================================== -->
            @if (activeTab() === 'leaves') {
              <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-6 shadow-sm">
                <div>
                  <h3 class="text-base font-semibold text-[var(--text-primary)] m-0">Leave Portfolio & Entitlements</h3>
                  <p class="text-xs text-[var(--text-secondary)] mt-1">Current year leave quotas, consumption, and available balance.</p>
                </div>

                @if (ws.leaveBalances && ws.leaveBalances.length > 0) {
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    @for (b of ws.leaveBalances; track $index) {
                      <div class="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col gap-3">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-sm text-[var(--text-primary)] capitalize">{{ b.leaveType }} Leave</span>
                          <span class="text-xs font-bold text-[var(--primary-color)]">{{ b.remaining || 0 }} Available</span>
                        </div>

                        <p-progressBar
                          [value]="calculateLeavePercent(b.used || 0, b.allocated || 0)"
                          [showValue]="false"
                          styleClass="h-2 rounded-full">
                        </p-progressBar>

                        <div class="flex justify-between text-xs text-[var(--text-secondary)] pt-1">
                          <span>Allocated: <strong>{{ b.allocated || 0 }}</strong></span>
                          <span>Used: <strong>{{ b.used || 0 }}</strong></span>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-xs text-[var(--text-muted)] italic m-0">No active leave quota records found.</p>
                }
              </div>
            }

            <!-- ========================================== -->
            <!-- TAB 4: COMPANY ASSETS & EQUIPMENT          -->
            <!-- ========================================== -->
            @if (activeTab() === 'assets') {
              <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-base font-semibold text-[var(--text-primary)] m-0">Assigned Company Equipment</h3>
                    <p class="text-xs text-[var(--text-secondary)] mt-1">Laptops, peripherals, and assets in custody.</p>
                  </div>
                  <p-button
                    label="Assign Equipment"
                    icon="pi pi-plus"
                    size="small"
                    (onClick)="openAssignAssetDialog()">
                  </p-button>
                </div>

                @if (ws.assignedAssets && ws.assignedAssets.length > 0) {
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr class="border-b border-[var(--border-primary)] text-xs text-[var(--text-secondary)] uppercase">
                          <th class="py-2.5 px-3">Asset Tag</th>
                          <th class="py-2.5 px-3">Item Name</th>
                          <th class="py-2.5 px-3">Category</th>
                          <th class="py-2.5 px-3">Serial No</th>
                          <th class="py-2.5 px-3">Assigned Date</th>
                          <th class="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-[var(--border-primary)] text-xs">
                        @for (asset of ws.assignedAssets; track asset._id) {
                          <tr>
                            <td class="py-3 px-3 font-mono font-bold text-[var(--primary-color)]">{{ asset.assetTag }}</td>
                            <td class="py-3 px-3 font-semibold text-[var(--text-primary)]">{{ asset.name }}</td>
                            <td class="py-3 px-3 capitalize text-[var(--text-secondary)]">{{ asset.category }}</td>
                            <td class="py-3 px-3 font-mono text-[var(--text-secondary)]">{{ asset.serialNumber || '—' }}</td>
                            <td class="py-3 px-3">{{ formatDate(asset.assignedTo?.assignedAt) }}</td>
                            <td class="py-3 px-3 text-right">
                              <p-button
                                label="Return"
                                icon="pi pi-undo"
                                size="small"
                                severity="secondary"
                                [text]="true"
                                (onClick)="returnAsset(asset._id)">
                              </p-button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <p class="text-xs text-[var(--text-muted)] italic m-0">No company assets assigned to this employee.</p>
                }
              </div>
            }

            <!-- ========================================== -->
            <!-- TAB 5: COMPLIANCE DOCUMENTS                -->
            <!-- ========================================== -->
            @if (activeTab() === 'documents') {
              <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-base font-semibold text-[var(--text-primary)] m-0">Employee Compliance Documents</h3>
                    <p class="text-xs text-[var(--text-secondary)] mt-1">Identity proofs, statutory documents, and contracts.</p>
                  </div>
                  <p-button
                    label="Upload Document"
                    icon="pi pi-upload"
                    size="small"
                    (onClick)="openUploadDocDialog()">
                  </p-button>
                </div>

                @if (ws.documents && ws.documents.length > 0) {
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    @for (doc of ws.documents; track doc._id) {
                      <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col justify-between gap-3">
                        <div class="flex flex-col gap-1">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{{ doc.documentType }}</span>
                            <span [class]="docStatusClass(doc.status)" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              {{ doc.status }}
                            </span>
                          </div>
                          <span class="font-bold text-sm text-[var(--text-primary)] mt-1">{{ doc.title }}</span>
                          @if (doc.documentNumber) {
                            <span class="text-xs text-[var(--text-secondary)] font-mono">No: {{ doc.documentNumber }}</span>
                          }
                        </div>

                        <div class="flex items-center justify-between pt-2 border-t border-[var(--border-primary)]">
                          <a [href]="doc.fileUrl" target="_blank" class="text-xs text-[var(--primary-color)] hover:underline flex items-center gap-1 font-medium">
                            <i class="pi pi-external-link text-xs"></i> View File
                          </a>
                          @if (doc.status === 'pending') {
                            <p-button
                              label="Verify"
                              icon="pi pi-check"
                              size="small"
                              [text]="true"
                              (onClick)="verifyDoc(doc._id)">
                            </p-button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-xs text-[var(--text-muted)] italic m-0">No documents uploaded for this employee.</p>
                }
              </div>
            }

            <!-- ========================================== -->
            <!-- TAB 6: COMPENSATION (CONFIDENTIAL)         -->
            <!-- ========================================== -->
            @if (activeTab() === 'compensation') {
              <div class="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col gap-6 shadow-sm">
                <div>
                  <h3 class="text-base font-semibold text-[var(--text-primary)] m-0">Confidential Compensation & Bank Account</h3>
                  <p class="text-xs text-[var(--text-secondary)] mt-1">Restricted to HR Executives and authorized administrators.</p>
                </div>

                @if (ws.isConfidentialViewer) {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col gap-3">
                      <span class="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Salary Terms</span>
                      <div class="flex justify-between py-1 text-sm border-b border-[var(--border-primary)]">
                        <span class="text-[var(--text-secondary)]">Annual CTC</span>
                        <span class="font-bold text-[var(--text-primary)] font-mono">{{ ws.employee.compensation?.ctcAnnual ? (ws.employee.compensation?.ctcAnnual | currency:ws.employee.compensation?.currency || 'INR') : '—' }}</span>
                      </div>
                      <div class="flex justify-between py-1 text-sm border-b border-[var(--border-primary)]">
                        <span class="text-[var(--text-secondary)]">Pay Cycle</span>
                        <span class="font-semibold text-[var(--text-primary)] capitalize">{{ ws.employee.compensation?.payCycle || 'Monthly' }}</span>
                      </div>
                    </div>

                    <div class="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col gap-3">
                      <span class="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Bank & Statutory</span>
                      <div class="flex justify-between py-1 text-sm border-b border-[var(--border-primary)]">
                        <span class="text-[var(--text-secondary)]">Bank Name</span>
                        <span class="font-semibold text-[var(--text-primary)]">{{ ws.employee.compensation?.bankDetails?.bankName || '—' }}</span>
                      </div>
                      <div class="flex justify-between py-1 text-sm border-b border-[var(--border-primary)]">
                        <span class="text-[var(--text-secondary)]">Account Holder</span>
                        <span class="font-semibold text-[var(--text-primary)]">{{ ws.employee.compensation?.bankDetails?.accountName || '—' }}</span>
                      </div>
                      <div class="flex justify-between py-1 text-sm border-b border-[var(--border-primary)]">
                        <span class="text-[var(--text-secondary)]">UAN Number</span>
                        <span class="font-semibold text-[var(--text-primary)] font-mono">{{ ws.employee.compensation?.bankDetails?.uanNumber || '—' }}</span>
                      </div>
                    </div>
                  </div>
                } @else {
                  <div class="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                    <i class="pi pi-lock text-2xl text-[var(--text-muted)]"></i>
                    <span>You do not have permission to view confidential compensation data for this employee.</span>
                  </div>
                }
              </div>
            }

          </div>
        </app-page-content>
      } @else if (isLoading()) {
        <app-page-content [padded]="true">
          <div class="flex items-center justify-center p-12 text-sm text-[var(--text-secondary)]">
            <i class="pi pi-spin pi-spinner mr-2 text-lg text-[var(--primary-color)]"></i>
            Loading Employee Workspace 360...
          </div>
        </app-page-content>
      }
    </app-page>

    <!-- Provision / Invite User Dialog -->
    <p-dialog
      header="Provision Login Credentials"
      [(visible)]="showInviteDialog"
      [modal]="true"
      [style]="{ width: '440px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="flex flex-col gap-4 py-2">
        <p class="text-sm text-[var(--text-secondary)] m-0">
          Link system access to <strong class="text-[var(--text-primary)]">{{ employeeName() }}</strong>.
        </p>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Full Name</label>
          <input type="text" pInputText [(ngModel)]="inviteForm.name" class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Login Email</label>
          <input type="email" pInputText [(ngModel)]="inviteForm.email" class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Phone</label>
          <input type="text" pInputText [(ngModel)]="inviteForm.phone" class="w-full" />
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showInviteDialog.set(false)"></p-button>
          <p-button label="Provision & Link" icon="pi pi-send" [loading]="isProcessingAction()" (onClick)="submitInvite()"></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Assign Asset Dialog -->
    <p-dialog
      header="Assign Company Equipment"
      [(visible)]="showAssignAssetDialog"
      [modal]="true"
      [style]="{ width: '480px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Select Available Equipment</label>
          <p-select
            [options]="availableAssetOptions()"
            [(ngModel)]="assignAssetPayload.assetId"
            optionLabel="label"
            optionValue="value"
            placeholder="Choose equipment..."
            styleClass="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Notes / Remarks</label>
          <textarea
            pInputText
            [(ngModel)]="assignAssetPayload.notes"
            placeholder="Handover condition, serial check, etc."
            rows="2"
            class="w-full"></textarea>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showAssignAssetDialog.set(false)"></p-button>
          <p-button label="Assign Asset" icon="pi pi-check" [loading]="isProcessingAction()" (onClick)="submitAssignAsset()"></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Upload Document Dialog -->
    <p-dialog
      header="Upload Compliance Document"
      [(visible)]="showUploadDocDialog"
      [modal]="true"
      [style]="{ width: '480px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Document Type</label>
          <p-select
            [options]="docTypeOptions"
            [(ngModel)]="uploadDocPayload.documentType"
            optionLabel="label"
            optionValue="value"
            styleClass="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Document Title</label>
          <input type="text" pInputText [(ngModel)]="uploadDocPayload.title" placeholder="e.g. Aadhaar Card Front" class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Document Number (Optional)</label>
          <input type="text" pInputText [(ngModel)]="uploadDocPayload.documentNumber" placeholder="Identification number" class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">File URL</label>
          <input type="text" pInputText [(ngModel)]="uploadDocPayload.fileUrl" placeholder="https://..." class="w-full" />
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showUploadDocDialog.set(false)"></p-button>
          <p-button label="Upload Document" icon="pi pi-upload" [loading]="isProcessingAction()" (onClick)="submitUploadDoc()"></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Deactivate Dialog -->
    <p-dialog
      header="Offboard Employee"
      [(visible)]="showDeactivateDialog"
      [modal]="true"
      [style]="{ width: '480px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="flex flex-col gap-4 py-2">
        <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
          This will set the employee status to inactive and prompt return of company property.
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Date of Exit</label>
          <input type="date" pInputText [(ngModel)]="deactivatePayload.dateOfExit" class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Exit Reason</label>
          <textarea pInputText [(ngModel)]="deactivatePayload.exitReason" rows="2" class="w-full" placeholder="Reason..."></textarea>
        </div>

        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" [(ngModel)]="deactivatePayload.disableLoginAccess" class="rounded text-[var(--primary-color)]" />
          <span class="text-sm font-medium text-[var(--text-primary)]">Disable user login account</span>
        </label>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showDeactivateDialog.set(false)"></p-button>
          <p-button label="Confirm Offboarding" icon="pi pi-user-minus" severity="danger" [loading]="isProcessingAction()" (onClick)="submitDeactivate()"></p-button>
        </div>
      </ng-template>
    </p-dialog>
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
export class EmployeeWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hrmsService = inject(HRMSService);
  private readonly messageService = inject(AppMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly isProcessingAction = signal(false);
  readonly workspace = signal<EmployeeWorkspace360 | null>(null);
  readonly activeTab = signal('overview');

  readonly showInviteDialog = signal(false);
  readonly showAssignAssetDialog = signal(false);
  readonly showUploadDocDialog = signal(false);
  readonly showDeactivateDialog = signal(false);

  readonly availableAssetOptions = signal<{ label: string; value: string }[]>([]);

  readonly workspaceTabs: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: 'pi pi-user' },
    { id: 'attendance', label: 'Attendance & Punches', icon: 'pi pi-clock' },
    { id: 'leaves', label: 'Leave Portfolio', icon: 'pi pi-calendar-minus' },
    { id: 'assets', label: 'Equipment & Assets', icon: 'pi pi-desktop' },
    { id: 'documents', label: 'Compliance Documents', icon: 'pi pi-file' },
    { id: 'compensation', label: 'Compensation & Bank', icon: 'pi pi-lock' },
  ];

  readonly docTypeOptions = [
    { label: 'Aadhaar Card', value: 'aadhar' },
    { label: 'PAN Card', value: 'pan' },
    { label: 'Passport', value: 'passport' },
    { label: 'Voter ID', value: 'voter_id' },
    { label: 'Driving License', value: 'driving_license' },
    { label: 'Offer Letter', value: 'offer_letter' },
    { label: 'Appointment Letter', value: 'appointment_letter' },
    { label: 'Relieving Letter', value: 'relieving_letter' },
    { label: 'Education Certificate', value: 'education_certificate' },
    { label: 'NDA', value: 'nda' },
    { label: 'Other', value: 'other' },
  ];

  inviteForm: InviteUserDto = { name: '', email: '', phone: '' };
  assignAssetPayload = { assetId: '', notes: '' };
  uploadDocPayload = { documentType: 'aadhar', title: '', documentNumber: '', fileUrl: '' };
  deactivatePayload: DeactivateEmployeeDto = {
    dateOfExit: new Date().toISOString().substring(0, 10),
    exitReason: '',
    disableLoginAccess: true,
  };

  private employeeId: string | null = null;

  readonly employeeName = computed(() => {
    const emp = this.workspace()?.employee;
    if (!emp) return 'Employee Profile';
    const userName = typeof emp.user === 'object' && emp.user ? (emp.user as any).name : null;
    return emp.displayName || [emp.firstName, emp.lastName].filter(Boolean).join(' ') || userName || emp.employeeId || 'Employee';
  });

  readonly departmentName = computed(() => {
    const emp = this.workspace()?.employee;
    if (typeof emp?.departmentId === 'object' && emp.departmentId) return (emp.departmentId as any).name;
    return 'General Department';
  });

  readonly designationTitle = computed(() => {
    const emp = this.workspace()?.employee;
    if (typeof emp?.designationId === 'object' && emp.designationId) return (emp.designationId as any).title;
    return 'Staff Member';
  });

  readonly branchName = computed(() => {
    const emp = this.workspace()?.employee;
    if (typeof emp?.branchId === 'object' && emp.branchId) return (emp.branchId as any).name;
    return 'Main HQ';
  });

  readonly reportingManagerName = computed(() => {
    const emp = this.workspace()?.employee;
    if (typeof emp?.reportingManagerId === 'object' && emp.reportingManagerId) {
      return (emp.reportingManagerId as any).name || (emp.reportingManagerId as any).email;
    }
    return 'Executive Management';
  });

  readonly officialEmail = computed(() => {
    const emp = this.workspace()?.employee;
    return emp?.officialEmail || (typeof emp?.user === 'object' && emp?.user ? emp.user.email : null) || 'Not Configured';
  });

  readonly contactPhone = computed(() => {
    const emp = this.workspace()?.employee;
    return emp?.phone || (typeof emp?.user === 'object' && emp?.user ? emp.user.phone : null) || '';
  });

  readonly todayStatus = computed(() => {
    const att = this.workspace()?.todayAttendance;
    return att?.status || 'No Punches';
  });

  readonly shiftName = computed(() => {
    const shift = this.workspace()?.employee?.attendanceConfig?.shiftId;
    if (typeof shift === 'object' && shift) return (shift as any).name;
    return 'Standard Shift';
  });

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.loadWorkspace(this.employeeId);
    }
  }

  loadWorkspace(id: string): void {
    this.isLoading.set(true);
    this.hrmsService.getEmployeeWorkspace(id).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        this.workspace.set(res.data);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  goBack(): void {
    this.router.navigate(['/hrms/employees/list']);
  }

  editEmployee(): void {
    if (this.employeeId) {
      this.router.navigate(['/hrms/employees/edit', this.employeeId]);
    }
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '—';
    try {
      return new Date(dateVal).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  }

  formatDateTime(dateVal: any): string {
    if (!dateVal) return '—';
    try {
      return new Date(dateVal).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return '—';
    }
  }

  joiningDateFormatted(): string {
    return this.formatDate(this.workspace()?.employee?.dateOfJoining);
  }

  totalLeavesAvailable(): number {
    const balances = this.workspace()?.leaveBalances || [];
    return balances.reduce((sum, b) => sum + (b.remaining || 0), 0);
  }

  calculateLeavePercent(used: number, allocated: number): number {
    if (!allocated || allocated <= 0) return 0;
    return Math.min(100, Math.round((used / allocated) * 100));
  }

  statusBadgeClass(status?: string): string {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'probation': return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case 'notice_period': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
      case 'relieved':
      case 'terminated':
      case 'inactive': return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
    }
  }

  docStatusClass(status?: string): string {
    switch (status) {
      case 'verified': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-rose-100 text-rose-800';
      case 'expired': return 'bg-amber-100 text-amber-800';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  }

  // --- Modal actions ---

  openInviteDialog(): void {
    const emp = this.workspace()?.employee;
    this.inviteForm = {
      name: this.employeeName(),
      email: emp?.officialEmail || '',
      phone: emp?.phone || '',
    };
    this.showInviteDialog.set(true);
  }

  submitInvite(): void {
    if (!this.employeeId) return;
    this.isProcessingAction.set(true);
    this.hrmsService.inviteUserForEmployee(this.employeeId, this.inviteForm).pipe(
      finalize(() => this.isProcessingAction.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        this.messageService.showSuccess(res.message || 'User account linked successfully.');
        this.showInviteDialog.set(false);
        this.loadWorkspace(this.employeeId!);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  openAssignAssetDialog(): void {
    this.hrmsService.getCompanyAssets({ status: 'available' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      const assets = res.data?.assets || [];
      this.availableAssetOptions.set(assets.map(a => ({
        label: `${a.assetTag} — ${a.name} (${a.category})`,
        value: a._id
      })));
      this.assignAssetPayload = { assetId: '', notes: '' };
      this.showAssignAssetDialog.set(true);
    });
  }

  submitAssignAsset(): void {
    if (!this.employeeId || !this.assignAssetPayload.assetId) {
      this.messageService.showError('Please select an asset to assign.');
      return;
    }
    this.isProcessingAction.set(true);
    this.hrmsService.assignCompanyAsset(this.assignAssetPayload.assetId, {
      employeeId: this.employeeId,
      notes: this.assignAssetPayload.notes,
    }).pipe(
      finalize(() => this.isProcessingAction.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Equipment assigned successfully.');
        this.showAssignAssetDialog.set(false);
        this.loadWorkspace(this.employeeId!);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  returnAsset(assetId: string): void {
    if (!confirm('Are you sure you want to mark this equipment as returned?')) return;
    this.hrmsService.returnCompanyAsset(assetId, { notes: 'Returned via workspace cockpit' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Equipment returned to inventory.');
        this.loadWorkspace(this.employeeId!);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  openUploadDocDialog(): void {
    this.uploadDocPayload = { documentType: 'aadhar', title: '', documentNumber: '', fileUrl: '' };
    this.showUploadDocDialog.set(true);
  }

  submitUploadDoc(): void {
    if (!this.employeeId || !this.uploadDocPayload.title || !this.uploadDocPayload.fileUrl) {
      this.messageService.showError('Title and file URL are required.');
      return;
    }
    this.isProcessingAction.set(true);
    this.hrmsService.uploadEmployeeDocument({
      employeeId: this.employeeId,
      documentType: this.uploadDocPayload.documentType as any,
      title: this.uploadDocPayload.title,
      documentNumber: this.uploadDocPayload.documentNumber,
      fileUrl: this.uploadDocPayload.fileUrl,
    }).pipe(
      finalize(() => this.isProcessingAction.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Document uploaded successfully.');
        this.showUploadDocDialog.set(false);
        this.loadWorkspace(this.employeeId!);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  verifyDoc(docId: string): void {
    this.hrmsService.verifyEmployeeDocument(docId, { status: 'verified' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Document verified.');
        this.loadWorkspace(this.employeeId!);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  openDeactivateDialog(): void {
    this.deactivatePayload = {
      dateOfExit: new Date().toISOString().substring(0, 10),
      exitReason: '',
      disableLoginAccess: true,
    };
    this.showDeactivateDialog.set(true);
  }

  submitDeactivate(): void {
    if (!this.employeeId) return;
    this.isProcessingAction.set(true);
    this.hrmsService.deactivateEmployee(this.employeeId, this.deactivatePayload).pipe(
      finalize(() => this.isProcessingAction.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        this.messageService.showSuccess(res.message || 'Employee offboarded successfully.');
        this.showDeactivateDialog.set(false);
        this.loadWorkspace(this.employeeId!);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }
}
