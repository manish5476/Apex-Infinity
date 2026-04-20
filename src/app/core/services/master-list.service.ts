import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { catchError, Observable, of, Subject, tap } from 'rxjs';
import { takeUntil } from "rxjs/operators";
import { ApiService } from './api';

// Enhanced interfaces
export interface MasterItem {
  _id: string;
  name: string;
  title?: string;
  customLabel?: string;
  [key: string]: any;
}

export interface MasterList {
  organizationId?: string;
  branches: MasterItem[];
  roles: MasterItem[];
  products: MasterItem[];
  customers: MasterItem[];
  suppliers: MasterItem[];
  users: MasterItem[];
  accounts: MasterItem[];
  emis: MasterItem[];
  masterData: any;
  masters?: any; // Generic masters
  recentInvoices?: MasterItem[];
  recentPurchases?: MasterItem[];
  recentSales?: MasterItem[];
  recentPayments?: MasterItem[];

  // Flattened from 'masters' object:
  category?: MasterItem[];
  brand?: MasterItem[];
  department?: MasterItem[];
  unit?: MasterItem[];
  taxes?: MasterItem[];
}

export interface FilterOptions {
  [key: string]: Array<{ value: string; label: string }>;
}

export interface QuickStats {
  customers: number;
  suppliers: number;
  products: number;
  invoices: number;
  payments: number;
  revenue: number;
  averageInvoiceValue: number;
  outstandingBalance: number;
  lowStockCount: number;
}

@Injectable({ providedIn: 'root' })
export class MasterListService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);

  // Main state signals
  private readonly _data = signal<MasterList | null>(null);
  private readonly _filterOptions = signal<{ [key: string]: FilterOptions }>({});
  private readonly _quickStats = signal<QuickStats | null>(null);
  private readonly _activeFilters = signal<{ [key: string]: any }>({});
  private readonly _specificLists = signal<{ [key: string]: any[] }>({});

  // --- Computed Signals (Read-only accessors) ---
  readonly data = computed(() => this._data());
  readonly filterOptions = computed(() => this._filterOptions());
  readonly quickStats = computed(() => this._quickStats());
  readonly activeFilters = computed(() => this._activeFilters());
  readonly specificLists = computed(() => this._specificLists());

  // Core Entities
  readonly masterData = computed(() => this._data()?.masterData ?? []);
  readonly branches = computed(() => this._data()?.branches ?? []);
  readonly roles = computed(() => this._data()?.roles ?? []);
  readonly users = computed(() => this._data()?.users ?? []);
  readonly customers = computed(() => this._data()?.customers ?? []);
  readonly suppliers = computed(() => this._data()?.suppliers ?? []);
  readonly products = computed(() => this._data()?.products ?? []);
  readonly accounts = computed(() => this._data()?.accounts ?? []);
  readonly emis = computed(() => this._data()?.emis ?? []);
  readonly recentInvoices = computed(() => this._data()?.recentInvoices ?? []);
  readonly recentPayments = computed(() => this._data()?.recentPayments ?? []);

  // Dynamic Masters (Flattened)
  readonly categories = computed(() => this._data()?.category ?? []);
  readonly brands = computed(() => this._data()?.brand ?? []);
  readonly department = computed(() => this._data()?.department ?? []);
  readonly units = computed(() => this._data()?.unit ?? []);
  readonly taxes = computed(() => this._data()?.taxes ?? []);

  // Enhanced entities with filtering
  readonly filteredCustomers = computed(() => this.applyFilters(this.customers(), 'customer'));
  readonly filteredProducts = computed(() => this.applyFilters(this.products(), 'product'));
  readonly filteredInvoices = computed(() => this.applyFilters(this.recentInvoices(), 'invoice'));

  constructor() {
    this.initFromCache();
  }

  /**
   * Load master list with optional filters
   */
  load(filters?: any): void {
    if (filters) {
      this._activeFilters.set(filters);
    }
    this.api.getMasterList(filters).pipe(
      catchError(err => {
        console.error('Failed to load master list', err);
        return of({ status: 'error', data: null });
      }), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res?.data) {
        const genericMasters = res.data.masters || {};
        const finalData: MasterList = {
          ...res.data,
          ...genericMasters
        };
        this.updateState(finalData);

        // Store metadata if available
        if (res.metadata) {
          localStorage.setItem('masterListMetadata', JSON.stringify(res.metadata));
        }
      }
    });
  }

  /**
   * Load filter options for a specific entity type
   */
  loadFilterOptions(type: string): void {
    this.api.getFilterOptions(type).pipe(
      catchError(err => {
        console.error(`Failed to load filter options for ${type}`, err);
        return of({ status: 'error', data: {} });
      }), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res?.data) {
        const currentOptions = this._filterOptions();
        this._filterOptions.set({
          ...currentOptions,
          [type]: res.data
        });
      }
    });
  }

  /**
   * Load quick stats
   */
  loadQuickStats(period: string = 'month'): void {
    this.api.getQuickStats(period).pipe(
      catchError(err => {
        console.error('Failed to load quick stats', err);
        return of({ status: 'error', data: null });
      }), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res?.data) {
        this._quickStats.set(res.data);
      }
    });
  }

  /**
   * Get entity details with related data
   */
  getEntityDetails(type: string, id: string): Observable<any> {
    return this.api.getEntityDetails(type, id).pipe(
      tap((res: any) => {
        if (res?.data?.entity) {
          // Update the specific entity in cache if needed
          this.updateEntityInCache(type, id, res.data.entity);
        }
      }),
      catchError(err => {
        console.error(`Failed to get ${type} details`, err);
        return of({ status: 'error', data: null });
      })
    );
  }

  /**
   * Load specific list with advanced filtering
   */
  loadSpecificList(type: string, filters?: any): Observable<any> {
    return this.api.getSpecificList(type, filters).pipe(
      tap((res: any) => {
        if (res?.data) {
          // Store the filtered list
          const currentLists = this._specificLists();
          this._specificLists.set({
            ...currentLists,
            [type]: res.data
          });

          // Store summary if available
          if (res.summary) {
            localStorage.setItem(`${type}Summary`, JSON.stringify(res.summary));
          }
        }
      }),
      catchError(err => {
        console.error(`Failed to load ${type} list`, err);
        return of({ status: 'error', data: [], summary: {} });
      })
    );
  }

  /**
   * Apply filters to a list of items
   */
  private applyFilters(items: any[], type: string): any[] {
    const filters = this._activeFilters();
    if (!filters || Object.keys(filters).length === 0) {
      return items;
    }

    return items.filter(item => {
      // Apply search filter
      if (filters['search']) {
        const searchTerm = filters['search'].toLowerCase();
        switch (type) {
          case 'customer':
            return (item.name?.toLowerCase().includes(searchTerm) ||
              item.phone?.includes(searchTerm) ||
              item.email?.toLowerCase().includes(searchTerm));
          case 'product':
            return (item.name?.toLowerCase().includes(searchTerm) ||
              item.sku?.toLowerCase().includes(searchTerm) ||
              item.category?.toLowerCase().includes(searchTerm));
          case 'invoice':
            return (item.invoiceNumber?.toLowerCase().includes(searchTerm) ||
              item.customerId?.name?.toLowerCase().includes(searchTerm));
          default:
            return item.name?.toLowerCase().includes(searchTerm);
        }
      }

      // Apply status filter
      if (filters['status'] && filters['status'] !== 'all') {
        if (type === 'product') {
          if (filters['status'] === 'inStock' && item.totalStock <= 0) return false;
          if (filters['status'] === 'lowStock' && (item.totalStock > 10 || item.totalStock <= 0)) return false;
        }
      }

      return true;
    });
  }

  /**
   * Export filtered data
   */
  exportData(type: string, filters: any, format: string = 'csv'): Observable<Blob> {
    return this.api.exportFilteredData({
      type,
      format,
      ...filters
    });
  }

  /**
   * Export full master list
   */
  exportMasterList(format: string = 'csv'): Observable<Blob> {
    return this.api.exportMasterList(format);
  }

  /**
   * Set active filters for a specific type
   */
  setFilters(type: string, filters: any): void {
    const currentFilters = this._activeFilters();
    this._activeFilters.set({
      ...currentFilters,
      [type]: filters
    });

    // Persist filters to localStorage
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(`${type}Filters`, JSON.stringify(filters));
      } catch { }
    }
  }

  /**
   * Clear filters for a specific type
   */
  clearFilters(type?: string): void {
    if (type) {
      const currentFilters = this._activeFilters();
      const { [type]: _, ...remainingFilters } = currentFilters;
      this._activeFilters.set(remainingFilters);

      // Remove from localStorage
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem(`${type}Filters`);
      }
    } else {
      this._activeFilters.set({});
      // Clear all filter-related storage
      if (isPlatformBrowser(this.platformId)) {
        Object.keys(localStorage).forEach(key => {
          if (key.endsWith('Filters')) {
            localStorage.removeItem(key);
          }
        });
      }
    }
  }

  /**
   * Get stored filters for a type
   */
  getStoredFilters(type: string): any {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const filters = localStorage.getItem(`${type}Filters`);
        return filters ? JSON.parse(filters) : {};
      } catch {
        return {};
      }
    }
    return {};
  }

  private updateState(data: MasterList): void {
    this._data.set(data);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('masterList', JSON.stringify(data));
      } catch { }
    }
  }

  private updateEntityInCache(type: string, id: string, entityData: any): void {
    const currentData = this._data();
    if (!currentData) return;

    // Update the entity in the appropriate array
    const typeKeyMap: { [key: string]: keyof MasterList } = {
      'customer': 'customers',
      'product': 'products',
      'invoice': 'recentInvoices',
      'payment': 'recentPayments',
      'supplier': 'suppliers',
      'user': 'users'
    };

    const key = typeKeyMap[type];
    if (key && currentData[key]) {
      const updatedArray = (currentData[key] as any[]).map(item =>
        item._id === id ? { ...item, ...entityData } : item
      );

      this._data.set({
        ...currentData,
        [key]: updatedArray
      });
    }
  }

  initFromCache(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Load master list
      const cache = localStorage.getItem('masterList');
      if (cache) {
        try {
          this._data.set(JSON.parse(cache));
        } catch (e) {
          console.error('Failed to parse master list cache', e);
          localStorage.removeItem('masterList');
        }
      }

      // Load quick stats
      const statsCache = localStorage.getItem('quickStats');
      if (statsCache) {
        try {
          this._quickStats.set(JSON.parse(statsCache));
        } catch { }
      }

      // Load filter options
      const optionsCache = localStorage.getItem('filterOptions');
      if (optionsCache) {
        try {
          this._filterOptions.set(JSON.parse(optionsCache));
        } catch { }
      }
    }
  }

  clear(): void {
    this._data.set(null);
    this._quickStats.set(null);
    this._filterOptions.set({});
    this._activeFilters.set({});
    this._specificLists.set({});

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('masterList');
      localStorage.removeItem('quickStats');
      localStorage.removeItem('filterOptions');
      Object.keys(localStorage).forEach(key => {
        if (key.endsWith('Filters') || key.endsWith('Summary')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  refresh(): void {
    this.load();
  }

  refreshSpecific(type: string): void {
    const filters = this._activeFilters()[type] || {};
    this.loadSpecificList(type, filters).pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
