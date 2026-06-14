import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { SmartRuleService, CreateRuleDto } from '../../../../core/services/smart-rule.service';
import { AppSharedGrid } from '../../../shared/AgGrid/grid/app-shared-grid/app-shared-grid';
import { GridColDef } from '../../../shared/AgGrid/grid/grid.types';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-smart-rules',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppSharedGrid,
    ButtonModule,
    SelectModule,
    InputTextModule,
    CheckboxModule
  ],
  templateUrl: './smart-rules.component.html',
  styleUrls: ['./smart-rules.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmartRulesComponent implements OnInit {
  private readonly smartRuleService = inject(SmartRuleService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly rules = signal<any[]>([]);
  readonly selectedRule = signal<any | null>(null);
  readonly isCreateMode = signal(false);

  readonly ruleForm = {
    name: '',
    description: '',
    ruleType: 'new_arrivals',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 10,
    cacheDuration: 3600,
    isActive: true
  };

  readonly ruleTypes = [
    { label: 'New Arrivals', value: 'new_arrivals' },
    { label: 'Best Sellers', value: 'best_sellers' },
    { label: 'Clearance Sale', value: 'clearance_sale' },
    { label: 'Trending', value: 'trending' },
    { label: 'Seasonal', value: 'seasonal' },
    { label: 'Price Range', value: 'price_range' },
    { label: 'Category Based', value: 'category_based' },
    { label: 'Low Stock', value: 'low_stock' },
    { label: 'Manual Selection', value: 'manual_selection' },
    { label: 'Custom Query', value: 'custom_query' },
  ];

  readonly sortFields = [
    { label: 'Date Created', value: 'createdAt' },
    { label: 'Price', value: 'sellingPrice' },
    { label: 'Name', value: 'name' },
    { label: 'Last Sold', value: 'lastSold' },
    { label: 'Views', value: 'views' },
    { label: 'Sales Count', value: 'salesCount' },
  ];

  readonly sortOrders = [
    { label: 'Ascending', value: 'asc' },
    { label: 'Descending', value: 'desc' }
  ];

  readonly columns: GridColDef[] = [
    {
      headerName: 'Rule Name',
      field: 'name',
      flex: 1,
      minWidth: 200,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Type',
      field: 'ruleTypeFormatted',
      flex: 1,
      minWidth: 150,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Sort',
      field: 'sortBy',
      flex: 1,
      minWidth: 120,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Limit',
      field: 'limit',
      width: 100,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Cache (s)',
      field: 'cacheDuration',
      width: 120,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Status',
      field: 'statusFormatted',
      width: 120,
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
    this.smartRuleService.getAllRules().pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Unable to load smart rules.');
        return of({ data: { rules: [] } });
      })
    ).subscribe((res: any) => {
      const mapped = (res?.data?.rules ?? []).map((r: any) => ({
        ...r,
        ruleTypeFormatted: this.ruleTypes.find(t => t.value === r.ruleType)?.label || r.ruleType,
        statusFormatted: r.isActive ? 'Active' : 'Inactive'
      }));
      this.rules.set(mapped);
      this.loading.set(false);
    });
  }

  onGridEvent(event: any): void {
    if (event.type === 'selectionChanged') {
      const selected = event.rows[0];
      if (selected) {
        this.openRule(selected);
      } else {
        this.selectedRule.set(null);
      }
    }
  }

  openRule(rule: any): void {
    this.isCreateMode.set(false);
    this.selectedRule.set(rule);

    this.ruleForm.name = rule.name || '';
    this.ruleForm.description = rule.description || '';
    this.ruleForm.ruleType = rule.ruleType || 'new_arrivals';
    this.ruleForm.sortBy = rule.sortBy || 'createdAt';
    this.ruleForm.sortOrder = rule.sortOrder || 'desc';
    this.ruleForm.limit = rule.limit || 10;
    this.ruleForm.cacheDuration = rule.cacheDuration || 3600;
    this.ruleForm.isActive = rule.isActive !== false;
  }

  openCreateForm(): void {
    this.selectedRule.set(null);
    this.isCreateMode.set(true);
    this.ruleForm.name = '';
    this.ruleForm.description = '';
    this.ruleForm.ruleType = 'new_arrivals';
    this.ruleForm.sortBy = 'createdAt';
    this.ruleForm.sortOrder = 'desc';
    this.ruleForm.limit = 10;
    this.ruleForm.cacheDuration = 3600;
    this.ruleForm.isActive = true;
  }

  saveRule(): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const payload = { ...this.ruleForm } as CreateRuleDto;

    const req$ = this.isCreateMode()
      ? this.smartRuleService.createRule(payload)
      : this.smartRuleService.updateRule(this.selectedRule()._id, payload);

    req$.subscribe({
      next: () => {
        this.success.set(this.isCreateMode() ? 'Smart rule created.' : 'Smart rule updated.');
        this.isCreateMode.set(false);
        this.load();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to save smart rule.');
        this.loading.set(false);
      }
    });
  }

  executeRule(rule: any): void {
    this.loading.set(true);
    this.smartRuleService.executeRule(rule._id).subscribe({
      next: (res) => {
        const count = res.results || 0;
        this.success.set(`Rule executed successfully. Found ${count} products.`);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Execution failed.');
        this.loading.set(false);
      }
    });
  }

  deleteRule(rule: any): void {
    if (!confirm('Are you sure you want to delete this smart rule?')) return;
    this.loading.set(true);
    this.smartRuleService.deleteRule(rule._id).subscribe({
      next: () => {
        this.success.set('Smart rule deleted.');
        this.selectedRule.set(null);
        this.load();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to delete smart rule.');
        this.loading.set(false);
      }
    });
  }

  closePanel(): void {
    this.selectedRule.set(null);
    this.isCreateMode.set(false);
  }
}
