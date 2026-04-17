import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';

// Services
import { BranchService } from '../../services/branch-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { MasterDropdownService } from '../../../../core/services/master-dropdown.service';
import { Subject } from "rxjs";

@Component({
  selector: 'app-branch-details',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ButtonModule, 
    DividerModule, TagModule, AvatarModule, SkeletonModule
  ],
  templateUrl: './branch-details.html',
  styleUrl: './branch-details.scss',
})
export class BranchDetailsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private branchService = inject(BranchService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);
  private dropdownService = inject(MasterDropdownService);

  // Signals
  branch = signal<any | null>(null);
  managerName = signal('N/A');
  loading = signal(true);
  isError = signal(false);

  ngOnInit(): void {
    this.loadBranchData();
  }

  private loadBranchData(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const branchId = params.get('id');

      if (!branchId) {
        this.messageService.showError('Navigation Error: No branch ID provided.');
        this.isError.set(true);
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      this.isError.set(false);

      this.common.apiCall(
        this.branchService.getBranchById(branchId),
        (response: any) => {
          if (response?.data?.data) {
            const branchData = response.data.data;
            this.branch.set(branchData);
            
            // Resolve Manager Name
            if (branchData.managerId) {
              if (typeof branchData.managerId === 'object' && branchData.managerId.name) {
                this.managerName.set(branchData.managerId.name);
              } else {
                // Fetch from dropdown service if not populated
                this.dropdownService.getDropdownData('users', '', 1, 1, [branchData.managerId])
                  .pipe(takeUntil(this.destroy$))
                  .subscribe(res => {
                    if (res.data && res.data.length > 0) {
                      this.managerName.set(res.data[0].label);
                    }
                  });
              }
            }
          } else {
            this.isError.set(true);
            this.messageService.showError('Failed to load branch details. Data is unavailable.');
          }
          this.loading.set(false);
        },
        'Fetch Branch Details'
      );
    });
  }

  formatAddress(address: any): string {
    if (!address) return 'No address on file.';
    return [address.street, address.city, address.state, address.zipCode, address.country]
      .filter(p => p && p.trim()).join(', ');
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}