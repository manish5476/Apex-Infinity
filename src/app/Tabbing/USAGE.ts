// // ─────────────────────────────────────────────────────────────────────────────
// // PROGRAMMATIC API USAGE GUIDE
// // TabService — all public methods with examples
// // ─────────────────────────────────────────────────────────────────────────────


// // ══════════════════════════════════════════════════════════════════════════════
// // 1. INJECT THE SERVICE
// // ══════════════════════════════════════════════════════════════════════════════

// import { inject } from '@angular/core';
// import { TabService, OpenTabOptions } from './tabs';

// @Component({ ... })
// export class AnyComponent {
//   private tabs = inject(TabService);
// }


// // ══════════════════════════════════════════════════════════════════════════════
// // 2. OPEN A TAB  (most common operation)
// // ══════════════════════════════════════════════════════════════════════════════

// // Basic open
// this.tabs.openTab('/customers', 'Customers');

// // With icon + data payload
// this.tabs.openTab(
//   '/customers/42',
//   'Acme Corp',
//   {
//     icon: 'pi pi-user',
//     data: { customerId: 42, fromInvoice: true },
//   },
//   { queryParams: { filter: 'active' } }
// );

// // Pin the tab (cannot be closed by user)
// this.tabs.openTab('/dashboard', 'Dashboard', { pinned: true });

// // Force replace an existing tab with new data
// this.tabs.openTab('/customers/42', 'Acme Corp', { replace: true, data: { fresh: true } });


// // ══════════════════════════════════════════════════════════════════════════════
// // 3. READ TAB STATE (signals — use in templates directly)
// // ══════════════════════════════════════════════════════════════════════════════

// // In a component template:
// //   {{ tabs.activeTab()?.label }}
// //   @for (tab of tabs.tabs(); track tab.id) { ... }

// // In TypeScript:
// const active = this.tabs.activeTab();     // TabMeta | null
// const all    = this.tabs.tabs();          // TabMeta[]
// const count  = this.tabs.tabCount();      // number
// const isActive = this.tabs.isActive(id); // boolean

// // As RxJS observable (for legacy code or switchMap chains):
// this.tabs.activeTab$.pipe(
//   switchMap(tab => this.api.getData(tab?.data?.['customerId']))
// ).subscribe(...);


// // ══════════════════════════════════════════════════════════════════════════════
// // 4. CLOSE / MANAGE TABS
// // ══════════════════════════════════════════════════════════════════════════════

// this.tabs.closeTab(id);                    // close one tab
// this.tabs.closeOtherTabs(id);             // close everything except id
// this.tabs.closeTabsToRight(id);           // close all tabs after id
// this.tabs.closeAllTabs();                  // close all non-pinned


// // ══════════════════════════════════════════════════════════════════════════════
// // 5. UPDATE A TAB PROGRAMMATICALLY
// // ══════════════════════════════════════════════════════════════════════════════

// // Update label after data loads (e.g. once you know the customer name)
// this.customerService.get(id).subscribe(customer => {
//   this.tabs.updateTab(tabId, {
//     label:   customer.name,
//     loading: false,
//   });
// });

// // Merge new data into tab without navigation
// this.tabs.updateTab(tabId, {
//   data: { ...existingData, invoiceCount: 5 }
// });

// // Toggle pin
// this.tabs.togglePin(tabId);


// // ══════════════════════════════════════════════════════════════════════════════
// // 6. DRAG-AND-DROP REORDER (handled internally by TabStripComponent)
// //    Can also be called programmatically:
// // ══════════════════════════════════════════════════════════════════════════════

// this.tabs.moveTab(fromIndex, toIndex);


// // ══════════════════════════════════════════════════════════════════════════════
// // 7. PASS DATA BETWEEN PAGES WITHOUT URL PARAMS
// //    e.g. open invoice detail from customer list with pre-loaded data
// // ══════════════════════════════════════════════════════════════════════════════

// // In CustomerListComponent:
// openInvoice(invoice: Invoice): void {
//   this.tabs.openTab(
//     `/invoices/${invoice.id}`,
//     `Invoice #${invoice.number}`,
//     {
//       icon: 'pi pi-file-pdf',
//       data: {
//         invoice,          // full object — survives tab switches
//         openedFrom: 'customer-list',
//       },
//     }
//   );
// }

// // In InvoiceDetailComponent:
// ngOnInit(): void {
//   const tab = this.tabs.activeTab();
//   const preloaded = tab?.data?.['invoice'] as Invoice | undefined;

//   if (preloaded) {
//     this.invoice = preloaded;   // no HTTP call needed!
//   } else {
//     this.load(this.route.snapshot.params['id']);
//   }
// }


// // ══════════════════════════════════════════════════════════════════════════════
// // 8. ROUTE DATA → AUTOMATIC TAB (via TabRouterGuard)
// //    No TabService call needed — just navigate normally:
// // ══════════════════════════════════════════════════════════════════════════════

// // In a component or service:
// this.router.navigate(['/customers', 42]);
// // → TabRouterGuard fires → tab 'Customer' opens automatically
// // → If already open, it's activated (no duplicate)


// // ══════════════════════════════════════════════════════════════════════════════
// // 9. SESSION RESTORE
// //    Tabs are persisted to sessionStorage automatically.
// //    On page refresh they are rehydrated and the router syncs the active one.
// //    No extra code needed.
// // ══════════════════════════════════════════════════════════════════════════════


// // ══════════════════════════════════════════════════════════════════════════════
// // 10. OPT OUT A ROUTE FROM TAB CACHING
// //     Add reuseTab: false to route data:
// // ══════════════════════════════════════════════════════════════════════════════
// //   data: { reuseTab: false }
// //   → Component is destroyed & recreated on every activation (no caching)
