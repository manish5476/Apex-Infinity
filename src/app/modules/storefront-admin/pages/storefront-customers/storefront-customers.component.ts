import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { catchError, of } from 'rxjs';
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';
import { EmptyStateComponent } from "@shared/ui/feedback/empty-state/empty-state.component";
import { GridPageState } from '@shared/ui/grid/grid-types';
import { GridPaginationComponent } from '@shared/ui/grid/components/grid-pagination.component';

export interface CustomerDetail {
  customer?: any;
  carts?: any[];
  orders?: any[];
  addresses?: any[];
  wishlist?: any[];
  [key: string]: any;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    SearchFilterComponent,
    GridPaginationComponent,
    EmptyStateComponent
  ],
  templateUrl: './storefront-customers.component.html',
  styleUrls: ['./storefront-customers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorefrontCustomersComponent implements OnInit {
  private readonly adminService = inject(StorefrontAdminService);

  readonly loading = signal(false);
  readonly converting = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly customers = signal<any[]>([]);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(25);
  readonly selected = signal<any | null>(null);
  readonly detail = signal<CustomerDetail | null>(null);

  // Filter Signal States
  readonly search = signal('');
  readonly guestOnly = signal(false);
  readonly unconvertedOnly = signal(false);

  readonly hasActiveFilters = computed(() => !!this.search() || this.guestOnly() || this.unconvertedOnly());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getStorefrontCustomers({
      search: this.search() || undefined,
      guest: this.guestOnly() ? true : undefined,
      converted: this.unconvertedOnly() ? false : undefined,
      page: this.currentPage(),
      limit: this.pageSize()
    }).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Unable to load storefront customers.');
        return of({ data: [], pagination: { total: 0 } });
      })
    ).subscribe((res: any) => {
      const mapped = (res?.data ?? []).map((c: any) => ({
        ...c,
        displayName: this.getDisplayName(c),
        crmStatus: c.convertedToMainCustomer ? 'linked' : 'pending'
      }));
      this.customers.set(mapped);
      this.total.set(res?.pagination?.total ?? res?.total ?? mapped.length);
      this.loading.set(false);
    });
  }

  onSearchChange(term: string): void {
    this.search.set(term);
    this.currentPage.set(1);
    this.load();
  }

  onPageChange(state: GridPageState): void {
    this.currentPage.set(state.page + 1);
    this.load();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.load();
  }

  clearFilters(): void {
    this.search.set('');
    this.guestOnly.set(false);
    this.unconvertedOnly.set(false);
    this.currentPage.set(1);
    this.load();
  }

  open(customer: any): void {
    this.selected.set(customer);
    this.detail.set(null);
    this.adminService.getStorefrontCustomer(customer._id ?? customer.id).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Unable to load customer details.');
        return of(null);
      })
    ).subscribe((res: any) => {
      this.detail.set(res?.data ?? res);
    });
  }

  closePanel(): void {
    this.selected.set(null);
    this.detail.set(null);
  }

  convert(customer: any): void {
    const id = customer?._id ?? customer?.id;
    if (!id || customer.convertedToMainCustomer) return;

    this.converting.set(id);
    this.adminService.convertStorefrontCustomerToCrm(id).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Conversion operation failed.');
        return of(null);
      })
    ).subscribe(res => {
      this.converting.set(null);
      if (!res) return;
      this.load();

      const currentDetail = this.detail();
      if (currentDetail) {
        if (currentDetail.customer) {
          currentDetail.customer.convertedToMainCustomer = true;
          this.detail.set({ ...currentDetail });
        } else {
          this.detail.set({ ...currentDetail, convertedToMainCustomer: true });
        }
      }
    });
  }

  private getDisplayName(customer: any): string {
    return [customer.firstName, customer.lastName].filter(Boolean).join(' ')
      || customer.email
      || customer.phone
      || 'Guest shopper';
  }

  toggleGuest(): void {
    this.guestOnly.set(!this.guestOnly());
    this.currentPage.set(1);
    this.load();
  }

  toggleUnconverted(): void {
    this.unconvertedOnly.set(!this.unconvertedOnly());
    this.currentPage.set(1);
    this.load();
  }
}