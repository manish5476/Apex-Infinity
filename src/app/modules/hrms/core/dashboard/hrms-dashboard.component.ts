import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DepartmentListComponent } from '../department/department-list/department-list';
import { DesignationListComponent } from '../designation/designation-list.component';
import { EmployeeListComponent } from '../employee/employee-list/employee-list.component';
import { LeaveBalanceAdminComponent } from '../leaveBalance/leave-balance-admin.component';
import { AdminDailyAttendanceComponent } from '../attendence/admin-daily-attendance.component';
import { LeaveAdminHubComponent } from '../leave/leave-admin-hub.component';

@Component({
  selector: 'app-hrms-dashboard',
  standalone: true,
  imports: [
    FormsModule, 
    DepartmentListComponent, 
    DesignationListComponent, 
    EmployeeListComponent,
    LeaveBalanceAdminComponent,
    AdminDailyAttendanceComponent,
    LeaveAdminHubComponent
  ],
  template: `
<div class="hrms-dashboard-container">
  <div class="dashboard-header">
    <div class="header-content">
      <h1>HRMS Directory Hub</h1>
      <p>Manage your organizational structure, workforce, and configurations from one place.</p>
    </div>
  </div>

  <div class="category-tabs-wrapper">
    <div class="category-tabs">
      @for (tab of tabs; track tab) {
        <div class="tab-item" [class.active]="activeTab() === tab" (click)="setTab(tab)">
          {{ tab }}
        </div>
      }
    </div>
  </div>

  <div class="tab-content-container">
    @if (activeTab() === 'Locations') {
      <div class="placeholder-tab">
        <i class="pi pi-map-marker"></i>
        <h2>Locations & Branches</h2>
        <p>Manage physical office locations and geo-fences.</p>
        <button class="apex-btn apex-btn--primary mt-4">Add Location</button>
      </div>
    }
    @if (activeTab() === 'Departments') {
      <app-department-list></app-department-list>
    }
    @if (activeTab() === 'Designations') {
      <app-designation-list></app-designation-list>
    }
    @if (activeTab() === 'Leave Rules') {
      <app-leave-balance-admin></app-leave-balance-admin>
    }
    @if (activeTab() === 'Employees') {
      <app-employee-list></app-employee-list>
    }
    @if (activeTab() === 'Daily Attendance') {
      <app-admin-daily-attendance></app-admin-daily-attendance>
    }
    @if (activeTab() === 'Leave Requests') {
      <app-leave-admin-hub></app-leave-admin-hub>
    }
    @if (activeTab() === 'Monthly Payroll') {
      <div class="placeholder-tab">
        <i class="pi pi-money-bill"></i>
        <h2>Payroll Processing</h2>
        <p>Run monthly payroll, generate payslips, and manage salary structures.</p>
        <button class="apex-btn apex-btn--primary mt-4">Run Payroll</button>
      </div>
    }
  </div>
</div>
  `,
  styles: `
.hrms-dashboard-container {
  padding: var(--spacing-2xl) var(--spacing-xl);
  width: 100%;
  height: 100vh;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-body);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-shrink: 0;
  
  .header-content {
    h1 {
      font-family: var(--font-heading);
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.02em;
      margin-bottom: var(--spacing-xs);
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: var(--text-secondary);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-normal);
      margin: 0;
    }
  }
}

.category-tabs-wrapper {
  width: 100%;
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.category-tabs {
  display: inline-flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs);
  background: var(--bg-primary);
  border-radius: var(--ui-border-radius-pill);
  border: var(--ui-border-width) solid var(--border-secondary);
  flex-shrink: 0;
  white-space: nowrap;

  .tab-item {
    padding: var(--spacing-sm) var(--spacing-xl);
    border-radius: var(--ui-border-radius-pill);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: var(--transition-base);

    &:hover {
      color: var(--text-primary);
      background: var(--component-bg-hover);
    }

    &.active {
      background: var(--accent-primary);
      color: white;
      box-shadow: var(--shadow-md);
    }
  }
}

.placeholder-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--bg-primary);
  text-align: center;
  padding: var(--spacing-4xl);

  i {
    font-size: 4rem;
    color: var(--text-tertiary);
    margin-bottom: var(--spacing-lg);
  }

  h2 {
    font-family: var(--font-heading);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  p {
    color: var(--text-secondary);
    margin: 0;
  }
}

.tab-content-container {
  flex: 1;
  background: var(--bg-primary);
  border-radius: var(--ui-border-radius-xl);
  border: var(--ui-border-width) solid var(--border-primary);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  position: relative;
  
  ::ng-deep > * {
    display: block;
    height: 100%;
    width: 100%;
  }
  
  ::ng-deep .list-page-container,
  ::ng-deep .apex-page {
    height: 100% !important;
    padding: 0 !important;
  }
}
  `
})
export class HrmsDashboardComponent {
  activeTab = signal('Departments');
  tabs = [
    'Locations',
    'Departments', 
    'Designations', 
    'Leave Rules', 
    'Employees', 
    'Daily Attendance',
    'Leave Requests',
    'Monthly Payroll'
  ];

  setTab(tab: string) {
    this.activeTab.set(tab);
  }
}
