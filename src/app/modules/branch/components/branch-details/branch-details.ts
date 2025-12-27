import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators'; // Import finalize

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton'; // Import Skeleton

// Services
import { BranchService } from '../../services/branch-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

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
export class BranchDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private branchService = inject(BranchService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);

  // Signals
  branch = signal<any | null>(null);
  managerName = signal('N/A');
  loading = signal(true); // Added loading state
  isError = signal(false); // Added error state

  ngOnInit(): void {
    this.loadBranchData();
  }

  private loadBranchData(): void {
    this.route.paramMap.subscribe(params => {
      const branchId = params.get('id');

      if (!branchId) {
        this.messageService.showError('Navigation Error', 'No branch ID provided');
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
              const manager = this.masterList.users().find(u => u._id === branchData.managerId);
              if (manager) this.managerName.set(manager.name);
            }
          } else {
            this.isError.set(true);
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
}