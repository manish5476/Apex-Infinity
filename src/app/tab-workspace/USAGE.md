# Universal Application Tab Workspace (Developer Guide)

The **ApplicationTabWorkspace** module provides enterprise-grade, browser-like multi-tab workspace capabilities for Apex Infinity applications.

## Architecture

```text
Angular Router
      ↓
App Tab Manager
      ↓
Tab Workspace Store
      ↓
Route / Component State
```

The Angular Router remains the canonical navigation authority. The Tab Workspace coordinates with the Angular Router rather than replacing it.

---

## 1. Inject the Service

```typescript
import { Component, inject } from '@angular/core';
import { TabWorkspaceService } from '@app/tab-workspace'; // or from '@app/Tabbing'

@Component({ ... })
export class MyComponent {
  private readonly tabs = inject(TabWorkspaceService);
}
```

---

## 2. Declarative Route Configuration

In your routes configuration (e.g. `customer.routes.ts`, `hrms.routes.ts`), configure tab behavior via route `data`:

```typescript
export const CUSTOMER_ROUTES: Routes = [
  // Collection Route (e.g. Customers List)
  // Reuses a single tab even when page query params change (?page=2)
  {
    path: '',
    component: CustomerListComponent,
    data: {
      tab: {
        title: 'Customers',
        icon: 'pi pi-users',
        reuseMode: 'collection',
        closable: true,
        pinned: false
      }
    }
  },

  // Resource Route (e.g. Individual Customer 360)
  // Opens distinct tabs per customer ID (/customers/101 vs /customers/102)
  {
    path: ':id',
    component: CustomerDetailComponent,
    data: {
      tab: {
        title: 'Customer Details',
        icon: 'pi pi-user',
        reuseMode: 'resource',
        resourceParam: 'id',
        closable: true
      }
    }
  }
];
```

---

## 3. Safe Dynamic Tab Titles (Anti-Race Condition)

When a component loads asynchronous data, update the tab title using the **canonical route URL** instead of whatever tab happens to be currently active:

```typescript
// Inside CustomerDetailComponent
this.customerService.getCustomer(this.customerId).subscribe(customer => {
  this.customer = customer;

  // ✅ SAFE: Updates ONLY the tab that matches this customer's route URL
  this.tabWorkspace.updateTitleForUrl(this.router.url, customer.name);
});
```

---

## 4. Dirty-State Protection (Unsaved Changes)

To protect against accidental tab closures when a user has edited a form:

```typescript
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { TabWorkspaceService, TabDirtyStateProvider } from '@app/tab-workspace';

@Component({ ... })
export class InvoiceEditComponent implements OnInit, OnDestroy, TabDirtyStateProvider {
  private readonly tabWorkspace = inject(TabWorkspaceService);
  private unregisterDirty?: () => void;

  isDirty = false;

  ngOnInit(): void {
    this.unregisterDirty = this.tabWorkspace.registerDirtyProvider(this);
  }

  ngOnDestroy(): void {
    this.unregisterDirty?.();
  }

  isTabDirty(): boolean {
    return this.isDirty;
  }

  onTabDiscard(): void {
    // Revert draft changes or reset form
  }
}
```

---

## 5. Programmatic Tab Control

```typescript
// Open or activate a route
await this.tabs.open('/orders/555');

// Close a specific tab
await this.tabs.close('tab-id');

// Close current active tab
await this.tabs.closeCurrent();

// Close other tabs
await this.tabs.closeOthers();

// Pin or unpin a tab
this.tabs.togglePin('tab-id');

// Reopen recently closed tab
await this.tabs.reopenClosed();
```

---

## 6. Multi-Tenant Safety

Persistence is automatically scoped per authenticated tenant:
`apex_ws_v3_${userId}_${organizationId}`.

When a user logs out, `AuthService` clears the active workspace state. Organization switching switches tenant namespaces automatically, preventing cross-tenant information leakage.
