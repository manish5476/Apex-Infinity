import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, finalize } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Shared UI
import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

// Core
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { PurchaseService } from '../purchase.service';
import { Button } from "primeng/button";

@Component({
  selector: 'app-purchase-return-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    Button
],
  template: `
    <app-page>
      <app-page-header
        title="Debit Notes"
        subtitle="History of items returned to suppliers">
        <div header-right class="flex items-center gap-3">
          <p-button
            icon="pi pi-refresh"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            [loading]="isLoading()"
            (onClick)="loadData()">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <app-data-grid
          [columns]="columns"
          [data]="data()"
          [loading]="isLoading()"
          [rowActions]="rowActions"
          (gridEvent)="onGridEvent($event)">
        </app-data-grid>
      </app-page-content>
    </app-page>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
      height: 100%;
    }
  `]
})
export class PurchaseReturnListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  private readonly purchaseService = inject(PurchaseService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);
  private readonly common = inject(CommonMethodService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isLoading = signal(false);
  readonly data = signal<any[]>([]);

  readonly columns: GridColumn[] = [
    {
      field: 'returnDate',
      header: 'Date',
      width: '120px',
      sortable: true,
      formatter: (val: any) => val ? this.common.formatDate(val) : '—',
    },
    {
      field: 'purchaseId.invoiceNumber',
      header: 'Ref Invoice',
      width: '150px',
      formatter: (_val: any, row: any) => row?.purchaseId?.invoiceNumber || '—',
    },
    {
      field: 'supplierId.companyName',
      header: 'Supplier',
      minWidth: '200px',
      formatter: (_val: any, row: any) => row?.supplierId?.companyName || '—',
    },
    {
      field: 'reason',
      header: 'Reason',
      minWidth: '160px',
      formatter: (val: any) => val || '—',
    },
    {
      field: 'totalAmount',
      header: 'Refund Amount',
      width: '150px',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'view',
      icon: 'pi pi-eye',
      tooltip: 'View Return',
      variant: 'primary',
      callback: (row) => this.router.navigate(['/purchase/returns', row._id]),
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.purchaseService.getAllReturns().pipe(
      finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (res: any) => this.data.set(res.data?.returns ?? []),
      error: (err: any) => this.messageService.handleHttpError(err),
    });
  }

  onGridEvent(event: any): void {
    if (event.type === 'cellClicked') {
      const id = event.row?.purchaseId?._id;
      if (id) this.router.navigate(['/purchase', id]);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}