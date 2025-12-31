import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';

// Services
import { AccountService } from '../../accounts';
import { MessageService } from 'primeng/api';

// Shared Components
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
import { ActionViewRenderer } from '../../../shared/AgGrid/AgGridcomponents/DynamicDetailCard/ActionViewRenderer';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule, AgShareGrid],
  providers: [MessageService, DecimalPipe],
  templateUrl: './account-list.html',
  styleUrls: ['./account-list.scss']
})
export class AccountListComponent implements OnInit {
  // Dependencies
  private accountService = inject(AccountService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private decimalPipe = inject(DecimalPipe);

  // Grid State
  data: any[] = [];
  column: any[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.setupColumns();
    this.loadAccounts();
  }

  setupColumns(): void {
    this.column = [
      // 1. ACTIONS (Edit/Delete)
      {
        headerName: 'Actions',
        field: '_id',
        width: 100,
        cellRenderer: ActionViewRenderer,
        pinned: 'left',
        suppressMenu: true
      },
      
      // 2. CODE
      {
        field: 'code',
        headerName: 'Code',
        width: 120,
        sortable: true,
        filter: true,
        pinned: 'left',
        cellStyle: { 'font-weight': '600', 'color': 'var(--text-primary)' }
      },

      // 3. NAME
      {
        field: 'name',
        headerName: 'Account Name',
        flex: 1, // Auto expand
        minWidth: 200,
        sortable: true,
        filter: true
      },

      // 4. TYPE
      {
        field: 'type',
        headerName: 'Type',
        width: 150,
        sortable: true,
        filter: true,
        valueFormatter: (p: any) => p.value ? p.value.toUpperCase() : '',
        cellStyle: { 'text-transform': 'capitalize' }
      },

      // 5. DEBIT (Numeric)
      {
        field: 'debitTotal',
        headerName: 'Debit',
        width: 140,
        type: 'numericColumn', // Right align
        valueFormatter: (p: any) => this.formatCurrency(p.value),
        cellStyle: { 'color': 'var(--text-secondary)' }
      },

      // 6. CREDIT (Numeric)
      {
        field: 'creditTotal',
        headerName: 'Credit',
        width: 140,
        type: 'numericColumn',
        valueFormatter: (p: any) => this.formatCurrency(p.value),
        cellStyle: { 'color': 'var(--text-secondary)' }
      },

      // 7. BALANCE (Bold & Colored)
      {
        field: 'balance',
        headerName: 'Balance',
        width: 150,
        type: 'numericColumn',
        valueFormatter: (p: any) => this.formatCurrency(p.value),
        cellStyle: (params: any) => {
          const bal = params.value || 0;
          // Green for positive, Red for negative (standard accounting)
          // Or just bold black if you prefer neutrality
          return { 
            'font-weight': '700', 
            'color': bal < 0 ? '#dc2626' : 'var(--text-primary)' 
          };
        }
      }
    ];
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.accountService.getAccounts().subscribe({
      next: (res: any) => {
        // Handle response format variations (res.data or res directly)
        this.data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load accounts', err);
        this.isLoading = false;
      }
    });
  }

  // Helper: Format Currency (₹ 1,234.00)
  private formatCurrency(value: number): string {
    if (value === undefined || value === null) return '-';
    // Using Angular DecimalPipe for consistent formatting
    return this.decimalPipe.transform(value, '1.2-2') || '0.00';
  }

  // Handle Grid Events (e.g., Click Edit)
  handleGridEvent(event: any) {
    if (event.type === 'cellClicked' && event.colDef.headerName === 'Actions') {
      const id = event.data._id;
      // Navigate to Edit or Delete logic
      // this.router.navigate(['/accounts/edit', id]); 
      console.log('Action clicked for:', id);
    }
  }
}
