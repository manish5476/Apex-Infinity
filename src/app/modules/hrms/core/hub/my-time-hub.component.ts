import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EntityCardComponent } from '../../../../projectLayout/create-dashboard/entity-card/entity-card';
import { PermissionService } from '@core/auth/services/permission.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

interface HubAction {
  title: string;
  icon: string;
  description: string;
  createRoute?: string[];
  openDialog?: boolean;
  dialogComponent?: any;
  category: string;
  permissions?: string[];
}

@Component({
  selector: 'app-my-time-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, EntityCardComponent],
  providers: [DialogService],
  template: `
<div class="create-dashboard-container">
  <div class="dashboard-header">
    <div class="header-content">
      <h1>My Time Hub</h1>
      <p>Manage your attendance, timesheet, leaves, and requests all in one place.</p>
    </div>

    <div class="search-bar">
      <i class="pi pi-search"></i>
      <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
        placeholder="Search for 'Clock', 'Leave', etc..." />
    </div>
  </div>

  <div class="category-tabs">
    @for (cat of categories; track cat) {
      <div class="tab-item" [class.active]="activeCategory() === cat"
        (click)="setCategory(cat)">
        {{ cat }}
      </div>
    }
  </div>

  <div class="grid-container">
    @for (action of filteredActions(); track action) {
      <app-entity-card [title]="action.title" [icon]="action.icon"
        [description]="action.description" [createRoute]="action.createRoute!"
        (click)="handleActionClick($event, action)">
      </app-entity-card>
    }

    @if (filteredActions().length === 0) {
      <div class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>No actions found matching your criteria.</p>
      </div>
    }
  </div>
</div>
  `,
  styles: [`
.create-dashboard-container {
  padding: var(--spacing-3xl) var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body);

  /* --- Header Section --- */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-4xl);
    gap: var(--spacing-2xl);

    .header-content {
      h1 {
        font-family: var(--font-heading);
        font-size: var(--font-size-4xl);
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
      }
    }

    .search-bar {
      position: relative;
      flex: 1;
      max-width: 420px;

      i {
        position: absolute;
        left: var(--spacing-lg);
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-tertiary);
        font-size: var(--font-size-lg);
        transition: var(--transition-fast);
      }

      input {
        width: 100%;
        padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-lg) 3rem;
        border: var(--ui-border-width) solid var(--border-primary);
        border-radius: var(--ui-border-radius);
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: var(--font-size-base);
        transition: var(--transition-base);
        box-shadow: var(--shadow-sm);

        &::placeholder {
          color: var(--text-tertiary);
        }

        &:focus {
          outline: none;
          border-color: var(--accent-primary);
          background: var(--bg-primary);
          box-shadow: 0 0 0 var(--focus-outline-width) var(--accent-focus);

          +i {
            color: var(--accent-primary);
          }
        }
      }
    }
  }

  /* --- Category Tabs --- */
  .category-tabs {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-3xl);
    padding: var(--spacing-xs);
    background: var(--bg-secondary);
    border-radius: var(--ui-border-radius-pill);
    width: fit-content;
    border: var(--ui-border-width) solid var(--border-secondary);

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

  /* --- Grid Layout --- */
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--spacing-2xl);

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: var(--spacing-5xl);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg);
      border: 2px dashed var(--border-secondary);

      i {
        font-size: 4rem;
        color: var(--text-tertiary);
        margin-bottom: var(--spacing-lg);
      }

      p {
        font-size: var(--font-size-lg);
        color: var(--text-secondary);
      }
    }
  }

  @media (max-width: 768px) {
    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;

      .search-bar {
        max-width: 100%;
      }
    }

    .category-tabs {
      width: 100%;
      overflow-x: auto;
      border-radius: var(--ui-border-radius);
    }
  }
}
  `]
})
export class MyTimeHubComponent {
  private permService = inject(PermissionService);
  private dialogService = inject(DialogService);
  private router = inject(Router);

  searchQuery = signal('');
  activeCategory = signal('All');

  categories = ['All', 'Attendance', 'Leave & Time Off', 'Manager Approvals'];

  private allActions: HubAction[] = [
    {
      title: 'Web Clock',
      icon: 'pi pi-clock',
      description: 'Check in or out for the day using the web clock.',
      createRoute: ['/hrms/attendance/my-clock'],
      category: 'Attendance'
    },
    {
      title: 'My Timesheet',
      icon: 'pi pi-file',
      description: 'View your daily attendance and total working hours.',
      createRoute: ['/hrms/daily-attendance/my-timesheet'],
      category: 'Attendance'
    },
    {
      title: 'Request Regularization',
      icon: 'pi pi-calendar-plus',
      description: 'Apply for missed punches or attendance correction.',
      openDialog: true,
      category: 'Attendance'
    },
    {
      title: 'My Requests History',
      icon: 'pi pi-history',
      description: 'View the status of your past regularization requests.',
      createRoute: ['/hrms/attendance-requests/my-requests'],
      category: 'Attendance'
    },
    {
      title: 'Leave Center',
      icon: 'pi pi-calendar-minus',
      description: 'View your leave balances and request history.',
      createRoute: ['/hrms/leave/hub'],
      category: 'Leave & Time Off'
    },
    {
      title: 'Apply for Leave',
      icon: 'pi pi-plane',
      description: 'Submit a new leave request (Sick, Casual, Earned).',
      openDialog: true,
      category: 'Leave & Time Off'
    },
    {
      title: 'Pending Regularizations',
      icon: 'pi pi-check-square',
      description: 'Review and approve team attendance regularization requests.',
      createRoute: ['/hrms/attendance-requests/approvals'],
      category: 'Manager Approvals',
      permissions: [PERMISSIONS.USER.READ] // Any minimal manager permission, or we can filter conditionally later
    },
    {
      title: 'Pending Leaves',
      icon: 'pi pi-inbox',
      description: 'Review and approve team leave requests.',
      createRoute: ['/hrms/leave/hub'],
      category: 'Manager Approvals',
      permissions: [PERMISSIONS.USER.READ]
    }
  ];

  filteredActions = computed(() => {
    // 1. Filter by permissions
    let actions = this.allActions.filter(action => {
      if (!action.permissions) return true;
      return this.permService.check(action.permissions);
    });

    // 2. Filter by category
    const cat = this.activeCategory();
    if (cat !== 'All') {
      actions = actions.filter(a => a.category === cat);
    }

    // 3. Filter by search query
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      actions = actions.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }

    return actions;
  });

  setCategory(cat: string) {
    this.activeCategory.set(cat);
  }

  handleActionClick(event: Event, action: HubAction) {
    if (action.openDialog) {
      event.preventDefault();
      event.stopPropagation();
      if (action.title === 'Apply for Leave') {
        import('../leave/leave-form.component').then(m => {
          this.dialogService.open(m.LeaveFormComponent, {
            header: 'Apply for Leave',
            width: '600px',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true
          });
        });
      } else if (action.title === 'Request Regularization') {
        import('../attendence/requests/attendance-request-form.component').then(m => {
          this.dialogService.open(m.AttendanceRequestFormComponent, {
            header: 'New Regularization Request',
            width: '600px',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            maximizable: true
          });
        });
      }
    } else if (action.createRoute) {
      this.router.navigate(action.createRoute);
    }
  }
}
