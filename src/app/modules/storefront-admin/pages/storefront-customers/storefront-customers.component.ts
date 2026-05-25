import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { catchError, of } from 'rxjs';
import { AppSharedGrid } from '../../../shared/AgGrid/grid/app-shared-grid/app-shared-grid';
import { GridColDef } from '../../../shared/AgGrid/grid/grid.types';

export interface CustomerDetail {
  customer?: any;
  carts?: any[];
  orders?: any[];
  addresses?: any[];
  wishlist?: any[];
  [key: string]: any;
}

@Component({
  selector: 'app-storefront-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
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
  readonly selected = signal<any | null>(null);
  readonly detail = signal<CustomerDetail | null>(null);

  // Filter Signal States
  readonly search = signal('');
  readonly guestOnly = signal(false);
  readonly unconvertedOnly = signal(false);

  readonly columns: GridColDef[] = [
    {
      headerName: 'Customer',
      field: 'displayName',
      flex: 1.5,
      minWidth: 200,
      cellConfig: { type: 'avatar' }
    },
    {
      headerName: 'Email',
      field: 'email',
      flex: 1.2,
      minWidth: 180,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Orders',
      field: 'orderCount',
      flex: 0.8,
      minWidth: 100,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Total Spent',
      field: 'totalSpent',
      flex: 1,
      minWidth: 120,
      cellConfig: { type: 'currency', currencyCode: 'INR' }
    },
    {
      headerName: 'CRM Status',
      field: 'crmStatus',
      flex: 1,
      minWidth: 130,
      cellConfig: {
        type: 'badge',
        badgeMap: { linked: 'success', pending: 'warning' }
      }
    },
    {
      headerName: 'Last Seen',
      field: 'lastSeenAt',
      flex: 1,
      minWidth: 140,
      cellConfig: { type: 'datetime' }
    }
  ];

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
      limit: 50
    }).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Unable to load storefront customers.');
        return of({ data: [] });
      })
    ).subscribe((res: any) => {
      const mapped = (res?.data ?? []).map((c: any) => ({
        ...c,
        displayName: this.getDisplayName(c),
        crmStatus: c.convertedToMainCustomer ? 'linked' : 'pending'
      }));
      this.customers.set(mapped);
      this.loading.set(false);
    });
  }

  onGridEvent(event: any): void {
    if (event.type === 'selectionChanged') {
      const selectedCustomer = event.rows[0];
      if (selectedCustomer) {
        this.open(selectedCustomer);
      } else {
        this.closePanel();
      }
    }
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
    this.load();
  }

  toggleUnconverted(): void {
    this.unconvertedOnly.set(!this.unconvertedOnly());
    this.load();
  }
}