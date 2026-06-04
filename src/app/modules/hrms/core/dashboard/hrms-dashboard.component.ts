import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DepartmentListComponent } from '../department/department-list/department-list';
import { DesignationListComponent } from '../designation/designation-list.component';
import { EmployeeListComponent } from '../employee/employee-list/employee-list.component';
import { ShiftListComponent } from '../shift/shift-list.component';

@Component({
  selector: 'app-hrms-dashboard',
  standalone: true,
  imports: [FormsModule, DepartmentListComponent, DesignationListComponent, EmployeeListComponent, ShiftListComponent],
  template: `
<div class="hrms-dashboard-container">
  <div class="dashboard-header">
    <div class="header-content">
      <h1>HRMS Directory Hub</h1>
      <p>Manage your organizational structure, workforce, and configurations from one place.</p>
    </div>
  </div>

  <div class="category-tabs">
    @for (tab of tabs; track tab) {
      <div class="tab-item" [class.active]="activeTab() === tab" (click)="setTab(tab)">
        {{ tab }}
      </div>
    }
  </div>

  <div class="tab-content-container">
    @if (activeTab() === 'Departments') {
      <app-department-list></app-department-list>
    }
    @if (activeTab() === 'Designations') {
      <app-designation-list></app-designation-list>
    }
    @if (activeTab() === 'Employees') {
      <app-employee-list></app-employee-list>
    }
    @if (activeTab() === 'Shifts') {
      <app-shift-list></app-shift-list>
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

.category-tabs {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-xs);
  background: var(--bg-primary);
  border-radius: var(--ui-border-radius-pill);
  width: fit-content;
  border: var(--ui-border-width) solid var(--border-secondary);
  flex-shrink: 0;

  .tab-item {
    padding: var(--spacing-sm) var(--spacing-xl);
    border-radius: var(--ui-border-radius-pill);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: var(--transition-base);
    white-space: nowrap;

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
  
  ::ng-deep .list-page-container {
    height: 100% !important;
    padding: 0 !important;
  }
  
  ::ng-deep .apex-page {
    height: 100% !important;
  }
}
  `
})
export class HrmsDashboardComponent {
  activeTab = signal('Departments');
  tabs = ['Departments', 'Designations', 'Employees', 'Shifts'];

  setTab(tab: string) {
    this.activeTab.set(tab);
  }
}
