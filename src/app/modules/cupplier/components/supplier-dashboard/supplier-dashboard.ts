
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, of, finalize } from 'rxjs';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { TransactionService } from '../../../transactions/transaction.service';
import { SupplierService } from '../../services/supplier-service';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule],
  templateUrl: './supplier-dashboard.html',
  styleUrl: './supplier-dashboard.scss',
})
export class SupplierDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private supplierService = inject(SupplierService);
  private transactionService = inject(TransactionService); // Added
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  public common = inject(CommonMethodService);
  // Holds the Supplier JSON data
  data = signal<any>(null);
  isError = signal<any>(null);

  // Tab State
  activeTab = signal<'purchases' | 'payments'>('purchases');
  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          this.router.navigate(['/suppliers']);
          return of(null);
        }
        return this.supplierService.getSupplierDashboard(id).pipe(
        );
      })
    ).subscribe({
      next: (res: any) => {
        if (res?.data?.data || res?.data) {
          const s = res.data.data || res.data;
          this.data.set(s);
        } else {
          this.isError.set(true);
        }
      },
      error: () => this.isError.set(true)
    });
  }

  getSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'partial': return 'warn';
      case 'unpaid': return 'danger';
      default: return 'info';
    }
  }

  getInitials(name: string): string {
    if (!name) return 'SP';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}