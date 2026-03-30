import { Injectable, computed, inject } from '@angular/core';
import { PermissionService } from '../auth/services/permission.service';
import { PERMISSIONS } from '../auth/permissions.constants';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  /** Permissions required to see this item (any match = visible) */
  permissions?: string[];
  /** If true, item is shown to owners/superadmins only */
  adminOnly?: boolean;
  /** If true, item is shown to owners only */
  ownerOnly?: boolean;
  badge?: string | number;
  dividerAfter?: boolean;
}

/**
 * NavigationService — builds the sidebar nav dynamically based on
 * the current user's permissions.
 *
 * Usage in sidebar component:
 *   readonly navItems = inject(NavigationService).visibleNavItems;
 *
 * In template:
 *   @for (item of navItems(); track item.route) { ... }
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly permSvc = inject(PermissionService);

  /** Full nav definition (source of truth) */
  private readonly ALL_NAV_ITEMS: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'grid_view',
      route: '/dashboard',
      permissions: [PERMISSIONS.DASHBOARD.VIEW],
    },
    {
      label: 'HR',
      icon: 'people',
      children: [
        {
          label: 'Attendance',
          icon: 'schedule',
          route: '/hr/attendance',
          permissions: [PERMISSIONS.ATTENDANCE.READ, PERMISSIONS.ATTENDANCE.MANAGE],
        },
        {
          label: 'Leave',
          icon: 'event_busy',
          route: '/hr/leave',
          permissions: [PERMISSIONS.LEAVE.READ, PERMISSIONS.LEAVE.REQUEST, PERMISSIONS.LEAVE.APPROVE],
        },
        {
          label: 'Shifts',
          icon: 'swap_horiz',
          route: '/hr/shifts',
          permissions: [PERMISSIONS.SHIFT.READ],
        },
        {
          label: 'Holidays',
          icon: 'celebration',
          route: '/hr/holidays',
          permissions: [PERMISSIONS.HOLIDAY.READ],
        },
      ],
    },
    {
      label: 'Finance',
      icon: 'account_balance',
      children: [
        {
          label: 'Invoices',
          icon: 'receipt_long',
          route: '/finance/invoices',
          permissions: [PERMISSIONS.INVOICE.READ],
        },
        {
          label: 'Payments',
          icon: 'payments',
          route: '/finance/payments',
          permissions: [PERMISSIONS.PAYMENT.READ],
        },
        {
          label: 'Ledger',
          icon: 'book',
          route: '/finance/ledger',
          permissions: [PERMISSIONS.LEDGER.READ],
        },
        {
          label: 'EMI / Loans',
          icon: 'credit_card',
          route: '/finance/emi',
          permissions: [PERMISSIONS.EMI.READ],
        },
      ],
    },
    {
      label: 'Inventory',
      icon: 'inventory_2',
      children: [
        {
          label: 'Products',
          icon: 'category',
          route: '/inventory/products',
          permissions: [PERMISSIONS.PRODUCT.READ],
        },
        {
          label: 'Suppliers',
          icon: 'local_shipping',
          route: '/inventory/suppliers',
          permissions: [PERMISSIONS.SUPPLIER.READ],
        },
        {
          label: 'Stock',
          icon: 'warehouse',
          route: '/inventory/stock',
          permissions: [PERMISSIONS.STOCK.READ],
        },
      ],
    },
    {
      label: 'Sales',
      icon: 'point_of_sale',
      route: '/sales',
      permissions: [PERMISSIONS.SALES.VIEW, PERMISSIONS.SALES.MANAGE],
    },
    {
      label: 'Purchases',
      icon: 'shopping_cart',
      route: '/purchases',
      permissions: [PERMISSIONS.PURCHASE.READ],
    },
    {
      label: 'Customers',
      icon: 'person_pin',
      route: '/customers',
      permissions: [PERMISSIONS.CUSTOMER.READ],
    },
    {
      label: 'Analytics',
      icon: 'insights',
      route: '/analytics',
      permissions: [PERMISSIONS.ANALYTICS.READ],
      dividerAfter: true,
    },
    {
      label: 'Reports',
      icon: 'summarize',
      route: '/reports',
      permissions: [
        PERMISSIONS.REPORT.PROFIT,
        PERMISSIONS.REPORT.SALES,
        PERMISSIONS.REPORT.TAX,
        PERMISSIONS.REPORT.OUTSTANDING,
      ],
    },
    {
      label: 'Organization',
      icon: 'corporate_fare',
      adminOnly: true,
      children: [
        {
          label: 'Users',
          icon: 'manage_accounts',
          route: '/organization/users',
          permissions: [PERMISSIONS.USER.READ],
        },
        {
          label: 'Roles',
          icon: 'admin_panel_settings',
          route: '/organization/roles',
          permissions: [PERMISSIONS.ROLE.MANAGE],
        },
        {
          label: 'Branches',
          icon: 'store',
          route: '/organization/branches',
          permissions: [PERMISSIONS.BRANCH.READ],
        },
        {
          label: 'Departments',
          icon: 'account_tree',
          route: '/organization/departments',
          permissions: [PERMISSIONS.DEPARTMENT.READ],
        },
      ],
    },
    {
      label: 'System',
      icon: 'settings',
      ownerOnly: true,
      children: [
        { label: 'Logs',       icon: 'terminal',   route: '/system/logs' },
        { label: 'Automation', icon: 'bolt',        route: '/system/automation' },
      ],
    },
  ];

  /**
   * Computed signal — automatically re-evaluates when permissions change.
   * Returns only the nav items the current user can see.
   */
  readonly visibleNavItems = computed(() => {
    // Accessing permissions signal makes this reactive
    this.permSvc.permissions();
    return this._filterNavItems(this.ALL_NAV_ITEMS);
  });

  private _filterNavItems(items: NavItem[]): NavItem[] {
    return items
      .filter(item => this._isVisible(item))
      .map(item => ({
        ...item,
        children: item.children
          ? this._filterNavItems(item.children)
          : undefined,
      }))
      // Remove parent groups that ended up with no children
      .filter(item => !item.children || item.children.length > 0);
  }

  private _isVisible(item: NavItem): boolean {
    if (item.ownerOnly && !this.permSvc.isOwner()) return false;
    if (item.adminOnly && !this.permSvc.isSuperAdmin()) return false;
    if (item.permissions?.length) {
      return this.permSvc.hasAnyPermission(item.permissions);
    }
    // If no permissions defined and it has children, visibility determined by children
    return true;
  }
}
