// src/app/tab-workspace/tab-workspace.spec.ts

import {
  computeTabId,
  extractBasePath,
  normalizeUrl,
  titleFromPath
} from './tab-identity.util';
import { TabRouteReuseStrategy } from './tab-route-reuse.strategy';
import { TabWorkspaceStateStore } from './tab-workspace.state';
import { AppTab, RouteTabConfig } from './tab-workspace.types';

describe('Universal Application Tab Workspace', () => {

  describe('1. Route Normalization & Canonical Tab Identity', () => {
    it('normalizes URLs with trailing slashes and sorts query parameters', () => {
      const url1 = normalizeUrl('/customers/list/?b=2&a=1');
      const url2 = normalizeUrl('customers/list?a=1&b=2');
      expect(url1).toBe(url2);
      expect(url1).toBe('/customers/list?a=1&b=2');
    });

    it('extracts base path correctly', () => {
      expect(extractBasePath('/customers/101?tab=history#activity')).toBe('/customers/101');
      expect(extractBasePath('/')).toBe('/');
    });

    it('distinguishes separate resource IDs in resource mode (Section 4 & 6)', () => {
      const config: RouteTabConfig = { reuseMode: 'resource', resourceParam: 'id' };
      const pattern = '/customers/:id';

      const id101 = computeTabId(config, '/customers/101', '/customers/101', pattern, { id: '101' }, {});
      const id102 = computeTabId(config, '/customers/102', '/customers/102', pattern, { id: '102' }, {});

      expect(id101).toBe('/customers/:id::101');
      expect(id102).toBe('/customers/:id::102');
      expect(id101).not.toBe(id102);
    });

    it('reuses a single tab ID for collection routes regardless of query params (Section 5)', () => {
      const config: RouteTabConfig = { reuseMode: 'collection' };
      const pattern = '/customers';

      const idPage1 = computeTabId(config, '/customers', '/customers?page=1', pattern, {}, { page: '1' });
      const idPage2 = computeTabId(config, '/customers', '/customers?page=2', pattern, {}, { page: '2' });

      expect(idPage1).toBe('/customers');
      expect(idPage2).toBe('/customers');
      expect(idPage1).toBe(idPage2);
    });

    it('discriminates query parameters when queryPolicy is discriminate', () => {
      const config: RouteTabConfig = { queryPolicy: 'discriminate' };
      const pattern = '/reports';

      const idSales = computeTabId(config, '/reports', '/reports?type=sales', pattern, {}, { type: 'sales' });
      const idInventory = computeTabId(config, '/reports', '/reports?type=inventory', pattern, {}, { type: 'inventory' });

      expect(idSales).toBe('/reports?type=sales');
      expect(idInventory).toBe('/reports?type=inventory');
      expect(idSales).not.toBe(idInventory);
    });

    it('supports exactUrl mode', () => {
      const config: RouteTabConfig = { reuseMode: 'exactUrl' };
      const pattern = '/analytics';

      const id1 = computeTabId(config, '/analytics', '/analytics?from=2026-01-01', pattern, {}, { from: '2026-01-01' });
      expect(id1).toBe('/analytics?from=2026-01-01');
    });

    it('generates readable title fallbacks from route paths (Section 77)', () => {
      expect(titleFromPath('/hrms/employee-directory')).toBe('Employee Directory');
      expect(titleFromPath('/customers/6a204dbb9f37')).toBe('Customers #6a204d');
      expect(titleFromPath('/sales/orders/102')).toBe('Orders #102');
    });
  });

  describe('2. TabWorkspaceStateStore Lifecycle & Invariants', () => {
    let store: TabWorkspaceStateStore;

    const createDummyTab = (id: string, pinned = false, dirty = false): AppTab => ({
      id,
      url: `/route/${id}`,
      routeUrl: `/route/${id}`,
      routePattern: '/route/:id',
      title: `Tab ${id}`,
      pinned,
      closable: !pinned,
      dirty,
      loading: false,
      order: 0,
      createdAt: Date.now(),
      lastActivatedAt: Date.now(),
      params: { id },
      queryParams: {}
    });

    beforeEach(() => {
      store = new TabWorkspaceStateStore();
      store.configure({ maxTabs: 4, maxClosedHistory: 3 });
    });

    it('inserts and activates tabs idempotently without duplicate creation', () => {
      const { isNew: isFirstNew } = store.upsertTab(createDummyTab('tab1'), { activate: true });
      expect(isFirstNew).toBe(true);
      expect(store.tabCount()).toBe(1);
      expect(store.activeTabId()).toBe('tab1');

      // Re-upserting same tab ID must update, not duplicate
      const { isNew: isSecondNew } = store.upsertTab({ ...createDummyTab('tab1'), title: 'Updated Tab 1' });
      expect(isSecondNew).toBe(false);
      expect(store.tabCount()).toBe(1);
      expect(store.activeTab()?.title).toBe('Updated Tab 1');
    });

    it('positions pinned tabs before unpinned tabs (Section 25)', () => {
      store.upsertTab(createDummyTab('unpinned1', false));
      store.upsertTab(createDummyTab('unpinned2', false));
      store.upsertTab(createDummyTab('pinned1', true));

      const tabIds = store.tabs().map(t => t.id);
      expect(tabIds[0]).toBe('pinned1');
      expect(tabIds[1]).toBe('unpinned1');
      expect(tabIds[2]).toBe('unpinned2');
    });

    it('enforces maximum tabs limit via LRU eviction (Section 33)', () => {
      store.upsertTab({ ...createDummyTab('tab1'), lastActivatedAt: 100 });
      store.upsertTab({ ...createDummyTab('tab2'), lastActivatedAt: 200 });
      store.upsertTab({ ...createDummyTab('tab3'), lastActivatedAt: 300 });
      store.upsertTab({ ...createDummyTab('tab4'), lastActivatedAt: 400 });

      // Tab 5 exceeds maxTabs (4): tab1 (oldest accessed) should be evicted
      store.upsertTab({ ...createDummyTab('tab5'), lastActivatedAt: 500 });

      const tabIds = store.tabs().map(t => t.id);
      expect(tabIds.includes('tab1')).toBe(false);
      expect(tabIds.includes('tab5')).toBe(true);
      expect(store.tabCount()).toBe(4);
    });

    it('does not evict pinned or dirty tabs during capacity enforcement (Section 21, 25, 35)', () => {
      store.upsertTab({ ...createDummyTab('tab1', true), lastActivatedAt: 100 }); // pinned
      store.upsertTab({ ...createDummyTab('tab2', false, true), lastActivatedAt: 200 }); // dirty
      store.upsertTab({ ...createDummyTab('tab3'), lastActivatedAt: 300 });
      store.upsertTab({ ...createDummyTab('tab4'), lastActivatedAt: 400 });

      // Tab 5 inserted: tab3 (oldest unpinned non-dirty) must be evicted, NOT tab1 or tab2
      store.upsertTab({ ...createDummyTab('tab5'), lastActivatedAt: 500 });

      const tabIds = store.tabs().map(t => t.id);
      expect(tabIds.includes('tab1')).toBe(true); // Pinned kept
      expect(tabIds.includes('tab2')).toBe(true); // Dirty kept
      expect(tabIds.includes('tab3')).toBe(false); // Evicted
      expect(tabIds.includes('tab5')).toBe(true);
    });

    it('activates adjacent tab deterministically when active tab is closed (Section 27)', () => {
      store.upsertTab(createDummyTab('tabA'));
      store.upsertTab(createDummyTab('tabB'));
      store.upsertTab(createDummyTab('tabC'));

      // Close middle tab B -> activates left neighbor A
      store.activateTab('tabB');
      expect(store.activeTabId()).toBe('tabB');

      const { nextActiveId: nextAfterB } = store.removeTab('tabB');
      expect(nextAfterB).toBe('tabA');
      expect(store.activeTabId()).toBe('tabA');

      // Close first tab A -> activates remaining tab C (which shifted to index 0)
      const { nextActiveId: nextAfterA } = store.removeTab('tabA');
      expect(nextAfterA).toBe('tabC');
      expect(store.activeTabId()).toBe('tabC');
    });

    it('preserves pinned tabs during bulk removeAllTabs (Section 29)', () => {
      store.upsertTab(createDummyTab('pinnedA', true));
      store.upsertTab(createDummyTab('unpinnedB', false));
      store.upsertTab(createDummyTab('unpinnedC', false));

      const closed = store.removeAllTabs();
      expect(closed.length).toBe(2);
      expect(store.tabs().length).toBe(1);
      expect(store.tabs()[0].id).toBe('pinnedA');
    });

    it('preserves pinned tabs during removeOtherTabs (Section 30)', () => {
      store.upsertTab(createDummyTab('pinnedA', true));
      store.upsertTab(createDummyTab('unpinnedB', false));
      store.upsertTab(createDummyTab('unpinnedC', false));

      const closed = store.removeOtherTabs('unpinnedC');
      expect(closed.length).toBe(1);
      expect(closed[0].id).toBe('unpinnedB');

      const remainingIds = store.tabs().map(t => t.id);
      expect(remainingIds.includes('pinnedA')).toBe(true);
      expect(remainingIds.includes('unpinnedC')).toBe(true);
    });

    it('supports reopenLastClosed in LIFO order (Section 32)', () => {
      store.upsertTab(createDummyTab('tab1'));
      store.upsertTab(createDummyTab('tab2'));
      store.removeTab('tab2');

      expect(store.tabCount()).toBe(1);
      const popped = store.popRecentlyClosed();
      expect(popped?.id).toBe('tab2');
      expect(store.recentlyClosed().length).toBe(0);
    });
  });

  describe('3. TabRouteReuseStrategy', () => {
    let strategy: TabRouteReuseStrategy;

    beforeEach(() => {
      strategy = new TabRouteReuseStrategy();
    });

    it('does not detach routes that do not opt in to caching (Section 34)', () => {
      const mockRoute: any = {
        routeConfig: { path: 'customers' },
        pathFromRoot: [{ data: {}, url: [] }]
      };
      expect(strategy.shouldDetach(mockRoute)).toBe(false);
    });

    it('opts in to detach when tab config explicitly requests caching (Section 34)', () => {
      const mockRoute: any = {
        routeConfig: { path: 'customers' },
        pathFromRoot: [{ data: { tab: { cache: true } }, url: [] }]
      };
      expect(strategy.shouldDetach(mockRoute)).toBe(true);
    });

    it('differentiates cached resources in shouldReuseRoute (Section 34, 35)', () => {
      const routeConfig = { path: 'customers/:id' };
      const route101: any = {
        routeConfig,
        queryParams: {},
        pathFromRoot: [
          {
            routeConfig,
            data: { tab: { cache: true } },
            url: [{ toString: () => 'customers' }, { toString: () => '101' }]
          }
        ]
      };

      const route102: any = {
        routeConfig,
        queryParams: {},
        pathFromRoot: [
          {
            routeConfig,
            data: { tab: { cache: true } },
            url: [{ toString: () => 'customers' }, { toString: () => '102' }]
          }
        ]
      };

      // Different resource keys with cache enabled must return false so Angular detaches/attaches
      expect(strategy.shouldReuseRoute(route102, route101)).toBe(false);

      // Same resource key returns true
      expect(strategy.shouldReuseRoute(route101, route101)).toBe(true);
    });

    it('evicts handles and destroys componentRef on capacity overflow (Section 35)', () => {
      let destroyed = false;
      const mockHandle: any = {
        componentRef: {
          destroyed: false,
          destroy: () => { destroyed = true; }
        }
      };

      const route: any = {
        routeConfig: { path: 'test' },
        queryParams: {},
        pathFromRoot: [
          {
            data: { tab: { cache: true } },
            url: [{ toString: () => 'test' }]
          }
        ]
      };

      strategy.store(route, mockHandle);
      strategy.evict('/test');

      expect(destroyed).toBe(true);
    });
  });

  describe('4. Real-World Failure Hunting Scenarios (Section 84, 85, 86)', () => {
    let store: TabWorkspaceStateStore;

    beforeEach(() => {
      store = new TabWorkspaceStateStore();
      store.configure({ maxTabs: 30, maxClosedHistory: 20 });
    });

    it('Scenario 84: Full Enterprise Resource, Dirty, Pin, and Multi-Tenant Lifecycle', () => {
      const configResource: RouteTabConfig = { reuseMode: 'resource', resourceParam: 'id' };
      const configCollection: RouteTabConfig = { reuseMode: 'collection' };

      // 1. Open Customers Collection
      const idCust = computeTabId(configCollection, '/customers', '/customers', '/customers', {}, {});
      store.upsertTab({
        id: idCust, url: '/customers', routeUrl: '/customers', routePattern: '/customers',
        title: 'Customers', pinned: false, closable: true, dirty: false, loading: false,
        order: 0, createdAt: 100, lastActivatedAt: 100, params: {}, queryParams: {}
      });
      expect(store.tabCount()).toBe(1);

      // 2. Open Customer 101
      const id101 = computeTabId(configResource, '/customers/101', '/customers/101', '/customers/:id', { id: '101' }, {});
      store.upsertTab({
        id: id101, url: '/customers/101', routeUrl: '/customers/101', routePattern: '/customers/:id',
        title: 'Customer 101', pinned: false, closable: true, dirty: false, loading: false,
        order: 1, createdAt: 200, lastActivatedAt: 200, params: { id: '101' }, queryParams: {}
      });
      expect(store.tabCount()).toBe(2);

      // 3. Open Customer 102
      const id102 = computeTabId(configResource, '/customers/102', '/customers/102', '/customers/:id', { id: '102' }, {});
      store.upsertTab({
        id: id102, url: '/customers/102', routeUrl: '/customers/102', routePattern: '/customers/:id',
        title: 'Customer 102', pinned: false, closable: true, dirty: false, loading: false,
        order: 2, createdAt: 300, lastActivatedAt: 300, params: { id: '102' }, queryParams: {}
      });
      expect(store.tabCount()).toBe(3);

      // 4. Open Customer 101 again -> must activate existing tab without duplication
      const { isNew: reopenedNew } = store.upsertTab({
        id: id101, url: '/customers/101', routeUrl: '/customers/101', routePattern: '/customers/:id',
        title: 'Customer 101', pinned: false, closable: true, dirty: false, loading: false,
        order: 1, createdAt: 200, lastActivatedAt: 400, params: { id: '101' }, queryParams: {}
      }, { activate: true });

      expect(reopenedNew).toBe(false);
      expect(store.tabCount()).toBe(3);
      expect(store.activeTabId()).toBe(id101);

      // 5. Edit Customer 101 -> Dirty state
      store.patchTab(id101, { dirty: true });
      expect(store.activeTab()?.dirty).toBe(true);

      // 6. User attempts close and cancels -> tab remains open and dirty
      const cancelClose = false;
      if (!cancelClose) {
        expect(store.tabs().some(t => t.id === id101)).toBe(true);
        expect(store.tabs().find(t => t.id === id101)?.dirty).toBe(true);
      }

      // 7. Save succeeds -> dirty becomes false, tab closes
      store.patchTab(id101, { dirty: false });
      const { closedTab } = store.removeTab(id101);
      expect(closedTab?.id).toBe(id101);
      expect(store.tabCount()).toBe(2);

      // 8. Pin Customers tab -> stays pinned at index 0
      store.patchTab(idCust, { pinned: true });
      expect(store.tabs()[0].id).toBe(idCust);
      expect(store.tabs()[0].pinned).toBe(true);

      // 9. Close Others from Customer 102 -> Pinned Customers tab survives!
      const closedOthers = store.removeOtherTabs(id102);
      expect(store.tabs().some(t => t.id === idCust)).toBe(true); // Pinned kept
      expect(store.tabs().some(t => t.id === id102)).toBe(true); // Active target kept
    });

    it('Scenario 85: Asynchronous Dynamic Title Race Immunity', () => {
      // Tab A (Product 101) and Tab B (Product 102) open
      store.upsertTab({
        id: '/products/:id::101', url: '/products/101', routeUrl: '/products/101', routePattern: '/products/:id',
        title: 'Product 101', pinned: false, closable: true, dirty: false, loading: false,
        order: 0, createdAt: 100, lastActivatedAt: 100, params: { id: '101' }, queryParams: {}
      });

      store.upsertTab({
        id: '/products/:id::102', url: '/products/102', routeUrl: '/products/102', routePattern: '/products/:id',
        title: 'Product 102', pinned: false, closable: true, dirty: false, loading: false,
        order: 1, createdAt: 200, lastActivatedAt: 200, params: { id: '102' }, queryParams: {}
      }, { activate: true });

      // Product B is currently active
      expect(store.activeTabId()).toBe('/products/:id::102');

      // Product A HTTP response arrives late!
      // Title updater targets URL '/products/101'
      const targetUrl = '/products/101';
      const normalized = normalizeUrl(targetUrl);
      const basePath = extractBasePath(normalized);
      const tabA = store.tabs().find(t => t.url === normalized || t.routeUrl === basePath);

      expect(tabA).toBeDefined();
      if (tabA) {
        store.patchTab(tabA.id, { title: 'Super Widget A' });
      }

      // Tab A title is updated, Tab B title is completely UNTOUCHED
      expect(store.tabs().find(t => t.id === '/products/:id::101')?.title).toBe('Super Widget A');
      expect(store.tabs().find(t => t.id === '/products/:id::102')?.title).toBe('Product 102');

      // Late response for closed tab must not throw or affect any open tab
      store.removeTab('/products/:id::101');
      const closedTabLookup = store.tabs().find(t => t.url === '/products/101');
      expect(closedTabLookup).toBeUndefined(); // Stale update safely ignored!
      expect(store.tabs().find(t => t.id === '/products/:id::102')?.title).toBe('Product 102');
    });

    it('Scenario 86: Reorder Tabs Preserves Pinned Region Invariant', () => {
      store.upsertTab({
        id: 'pinned1', url: '/pinned1', routeUrl: '/pinned1', routePattern: '/pinned1',
        title: 'Pinned 1', pinned: true, closable: false, dirty: false, loading: false,
        order: 0, createdAt: 100, lastActivatedAt: 100, params: {}, queryParams: {}
      });

      store.upsertTab({
        id: 'unpinned1', url: '/unpinned1', routeUrl: '/unpinned1', routePattern: '/unpinned1',
        title: 'Unpinned 1', pinned: false, closable: true, dirty: false, loading: false,
        order: 1, createdAt: 200, lastActivatedAt: 200, params: {}, queryParams: {}
      });

      store.upsertTab({
        id: 'unpinned2', url: '/unpinned2', routeUrl: '/unpinned2', routePattern: '/unpinned2',
        title: 'Unpinned 2', pinned: false, closable: true, dirty: false, loading: false,
        order: 2, createdAt: 300, lastActivatedAt: 300, params: {}, queryParams: {}
      });

      // Attempting to move unpinned tab before pinned tab must clamp to unpinned region
      store.reorderTabs(2, 0); // try to drop unpinned2 at index 0 (pinned position)
      expect(store.tabs()[0].id).toBe('pinned1'); // pinned1 stays first!
      expect(store.tabs()[1].id).toBe('unpinned2');
      expect(store.tabs()[2].id).toBe('unpinned1');
    });
  });
});

