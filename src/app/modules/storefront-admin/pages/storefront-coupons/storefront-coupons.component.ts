import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { catchError, of } from 'rxjs';
import { AppSharedGrid } from '../../../shared/AgGrid/grid/app-shared-grid/app-shared-grid';
import { GridColDef } from '../../../shared/AgGrid/grid/grid.types';

@Component({
  selector: 'app-storefront-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, AppSharedGrid, CurrencyPipe, DatePipe],
  templateUrl: './storefront-coupons.component.html',
  styleUrls: ['./storefront-coupons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorefrontCouponsComponent implements OnInit {
  private readonly adminService = inject(StorefrontAdminService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly coupons = signal<any[]>([]);
  readonly selectedCoupon = signal<any | null>(null);
  readonly isCreateMode = signal(false);

  readonly couponForm = {
    code: '',
    discountType: 'fixed',
    amount: 0,
    maxDiscount: null as number | null,
    minPurchaseAmount: 0,
    startDate: '' as string | null,
    endDate: '' as string | null,
    usageLimit: null as number | null,
    isActive: true
  };

  readonly columns: GridColDef[] = [
    {
      headerName: 'Code',
      field: 'code',
      flex: 1,
      minWidth: 150,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Type',
      field: 'discountType',
      flex: 1,
      minWidth: 120,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Amount',
      field: 'amountFormatted',
      flex: 1,
      minWidth: 100,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Min Spend',
      field: 'minPurchaseAmount',
      flex: 1,
      minWidth: 120,
      cellConfig: { type: 'currency', currencyCode: 'INR' }
    },
    {
      headerName: 'Usage',
      field: 'usageFormatted',
      flex: 1,
      minWidth: 100,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Status',
      field: 'statusFormatted',
      flex: 1,
      minWidth: 120,
      cellConfig: {
        type: 'badge',
        badgeMap: { 'Active': 'success', 'Inactive': 'danger' }
      }
    }
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getCoupons().pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Unable to load coupons.');
        return of({ data: [] });
      })
    ).subscribe((res: any) => {
      const mapped = (res?.data ?? []).map((c: any) => ({
        ...c,
        isActive: c.isActive,
        discountType: c.discountType === 'percentage' ? '%' : 'Fixed',
        amountFormatted: c.discountType === 'percentage' ? `${c.amount}%` : `${c.amount} INR`,
        usageFormatted: `${c.usedCount} / ${c.usageLimit !== null ? c.usageLimit : '∞'}`,
        statusFormatted: c.isActive ? 'Active' : 'Inactive'
      }));
      this.coupons.set(mapped);
      this.loading.set(false);
    });
  }

  onGridEvent(event: any): void {
    if (event.type === 'selectionChanged') {
      const selected = event.rows[0];
      if (selected) {
        this.openCoupon(selected);
      } else {
        this.selectedCoupon.set(null);
      }
    }
  }

  openCoupon(coupon: any): void {
    this.isCreateMode.set(false);
    this.selectedCoupon.set(coupon);
  }

  openCreateForm(): void {
    this.selectedCoupon.set(null);
    this.isCreateMode.set(true);
    this.couponForm.code = '';
    this.couponForm.discountType = 'fixed';
    this.couponForm.amount = 0;
    this.couponForm.maxDiscount = null;
    this.couponForm.minPurchaseAmount = 0;
    this.couponForm.startDate = '';
    this.couponForm.endDate = '';
    this.couponForm.usageLimit = null;
    this.couponForm.isActive = true;
  }

  saveCoupon(): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const payload = {
      ...this.couponForm,
      startDate: this.couponForm.startDate ? new Date(this.couponForm.startDate) : null,
      endDate: this.couponForm.endDate ? new Date(this.couponForm.endDate) : null
    };

    this.adminService.createCoupon(payload).subscribe({
      next: () => {
        this.success.set('Coupon created successfully.');
        this.isCreateMode.set(false);
        this.load();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to create coupon.');
        this.loading.set(false);
      }
    });
  }

  toggleStatus(coupon: any): void {
    this.loading.set(true);
    const updatedStatus = coupon.isActive === 'false' || coupon.isActive === false;
    this.adminService.updateCoupon(coupon._id, { isActive: updatedStatus }).subscribe({
      next: () => {
        this.success.set('Coupon status updated.');
        this.load();
        this.selectedCoupon.set(null);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to update status.');
        this.loading.set(false);
      }
    });
  }

  deleteCoupon(coupon: any): void {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    this.loading.set(true);
    this.adminService.deleteCoupon(coupon._id).subscribe({
      next: () => {
        this.success.set('Coupon deleted.');
        this.selectedCoupon.set(null);
        this.load();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to delete coupon.');
        this.loading.set(false);
      }
    });
  }

  closePanel(): void {
    this.selectedCoupon.set(null);
    this.isCreateMode.set(false);
  }
}
