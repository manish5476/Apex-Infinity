import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { catchError, of } from 'rxjs';

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
  readonly detail = signal<any | null>(null);
  readonly search = signal('');
  readonly guestOnly = signal(false);
  readonly unconvertedOnly = signal(false);

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
      this.customers.set(res?.data ?? []);
      this.loading.set(false);
    });
  }

  open(customer: any): void {
    this.selected.set(customer);
    this.detail.set(null);
    this.adminService.getStorefrontCustomer(customer._id ?? customer.id).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Unable to load customer detail.');
        return of(null);
      })
    ).subscribe((res: any) => this.detail.set(res?.data ?? res));
  }

  convert(customer: any): void {
    const id = customer?._id ?? customer?.id;
    if (!id || customer.convertedToMainCustomer) return;
    this.converting.set(id);
    this.adminService.convertStorefrontCustomerToCrm(id).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Conversion failed.');
        return of(null);
      })
    ).subscribe(res => {
      this.converting.set(null);
      if (!res) return;
      this.load();
      this.open({ ...customer, convertedToMainCustomer: true });
    });
  }

  displayName(customer: any): string {
    return [customer.firstName, customer.lastName].filter(Boolean).join(' ')
      || customer.email
      || customer.phone
      || 'Guest shopper';
  }
}
