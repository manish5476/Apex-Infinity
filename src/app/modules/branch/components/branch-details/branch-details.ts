import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';

// Services
import { BranchService } from '../../services/branch-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

@Component({
  selector: 'app-branch-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DividerModule,
    TagModule,
    AvatarModule
  ],
  templateUrl: './branch-details.html',
  styleUrl: './branch-details.scss',
})
export class BranchDetailsComponent implements OnInit {
  // Injected services
  private route = inject(ActivatedRoute);
  private branchService = inject(BranchService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);
  
  // Inject Common Service (Public so HTML can access helpers like formatDate)
  public common = inject(CommonMethodService);

  // Signals
  branch = signal<any | null>(null);
  managerName = signal('N/A');

  ngOnInit(): void {
    this.loadBranchData();
  }

  private loadBranchData(): void {
    this.route.paramMap.subscribe(params => {
      const branchId = params.get('id');

      if (!branchId) {
        this.messageService.showError('Navigation Error', 'No branch ID provided');
        return;
      }

      // 🚀 Optimized API Call using Common Service
      this.common.apiCall(
        this.branchService.getBranchById(branchId),
        (response: any) => {
          if (response?.data?.data) {
            const branchData = response.data.data;
            this.branch.set(branchData);
            
            // Resolve Manager Name from Master List
            if (branchData.managerId) {
              const manager = this.masterList.users().find(u => u._id === branchData.managerId);
              if (manager) {
                this.managerName.set(manager.name);
              }
            }
          } else {
            this.messageService.showError('Error', 'Failed to load branch data.');
          }
        },
        'Fetch Branch Details'
      );
    });
  }

  // Helper to format address (Specific to this component's data structure)
  formatAddress(address: any): string {
    if (!address) return 'No address on file.';
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ];
    return parts.filter(p => p && p.trim() !== '').join(', ');
  }
}


// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { finalize, switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { DividerModule } from 'primeng/divider';
// import { TagModule } from 'primeng/tag';
// import { AvatarModule } from 'primeng/avatar';
// import { LoadingService } from '../../../../core/services/loading.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { BranchService } from '../../services/branch-service';

// @Component({
//   selector: 'app-branch-details',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ButtonModule,
//     DividerModule,
//     TagModule,
//     AvatarModule
//   ],
//   templateUrl: './branch-details.html',
//   styleUrl: './branch-details.scss',
// })
// export class BranchDetailsComponent implements OnInit {
//   // Injected services
//   private route = inject(ActivatedRoute);
//   private branchService = inject(BranchService);
//   private loadingService = inject(LoadingService);
//   private messageService = inject(AppMessageService);
//   private masterList = inject(MasterListService);

//   branch = signal<any | null>(null);
//   managerName = signal('N/A');

//   ngOnInit(): void {
//     this.loadBranchData();
//   }

//   private loadBranchData(): void {
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         const branchId = params.get('id');
//         if (!branchId) {
//           this.messageService.showError('Error', 'No branch ID provided');
//           return of(null);
//         }
//         this.loadingService.show();
//         return this.branchService.getBranchById(branchId).pipe(
//           finalize(() => this.loadingService.hide())
//         );
//       })
//     ).subscribe({
//       next: (response: any) => {
//         if (response && response.data && response.data.data) {
//           const branchData = response.data.data;
//           this.branch.set(branchData);
          
//           // Find manager name
//           if (branchData.managerId) {
//             const manager = this.masterList.users().find(u => u._id === branchData.managerId);
//             if (manager) {
//               this.managerName.set(manager.name);
//             }
//           }
//         } else if (response !== null) {
//           this.messageService.showError('Error', 'Failed to load branch details');
//         }
//       },
//       error: (err) => {
//         console.error('Failed to fetch branch:', err);
//         this.messageService.showError('Error', err.error?.message || 'Could not fetch branch');
//       }
//     });
//   }

//   formatDate(dateString: string | undefined): string {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleString();
//   }

//   // Helper to format address
//   formatAddress(address: any): string {
//     if (!address) return 'No address on file.';
//     const parts = [
//       address.street,
//       address.city,
//       address.state,
//       address.zipCode,
//       address.country
//     ];
//     return parts.filter(p => p && p.trim() !== '').join(', ');
//   }
// }