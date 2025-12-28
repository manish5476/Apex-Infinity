import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
// Removed DialogModule

// Services
import { SupplierService } from '../../services/supplier-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { SupplierTransactions } from '../../../transactions/supplier-transactions/supplier-transactions';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ButtonModule, TagModule, 
    SkeletonModule, AvatarModule, SupplierTransactions // Imported directly
  ],
  templateUrl: './supplier-detail.html',
  styleUrls: ['./supplier-detail.scss'],
})
export class SupplierDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private supplierService = inject(SupplierService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);

  // Signals
  supplier = signal<any | null>(null);
  loading = signal(true);
  isError = signal(false);
  branchNames = signal('N/A');
  
  // showTransactionsDialog = false; // REMOVED

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) return of(null);
        this.loading.set(true);
        this.isError.set(false);
        return this.supplierService.getSupplierById(id).pipe(
          finalize(() => this.loading.set(false))
        );
      })
    ).subscribe({
      next: (res: any) => {
        if (res?.data?.data) {
          const s = res.data.data;
          this.supplier.set(s);
          this.resolveBranchNames(s.branchesSupplied);
        } else {
          this.isError.set(true);
        }
      },
      error: () => this.isError.set(true)
    });
  }

  // Helper Logic
  private resolveBranchNames(branchIds: string[]) {
    if (!branchIds?.length) return;
    const allBranches = this.masterList.branches();
    const names = branchIds
      .map(id => allBranches.find(b => b._id === id)?.name)
      .filter(n => n)
      .join(', ');
    this.branchNames.set(names || 'N/A');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatAddress(addr: any): string {
    if (!addr) return 'No address on file';
    return [addr.street, addr.city, addr.state, addr.zipCode, addr.country]
      .filter(p => p && p.trim()).join(',\n');
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
// import { DialogModule } from 'primeng/dialog'; // 👈 1. Import Dialog

// // Services & Components
// import { SupplierService } from '../../services/supplier-service';
// import { LoadingService } from '../../../../core/services/loading.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { SupplierTransactions } from '../../../transactions/supplier-transactions/supplier-transactions';

// // 👈 2. Import the Transaction Component (Adjust path if needed)

// @Component({
//   selector: 'app-supplier-details',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ButtonModule,
//     DividerModule,
//     TagModule,
//     AvatarModule,
//     DialogModule,        // 👈 3. Add to Imports
//     SupplierTransactions // 👈 4. Add to Imports
//   ],
//   templateUrl: './supplier-detail.html',
//   styleUrl: './supplier-detail.scss',
// })
// export class SupplierDetailsComponent implements OnInit {
//   // Injected services
//   private route = inject(ActivatedRoute);
//   private supplierService = inject(SupplierService);
//   private loadingService = inject(LoadingService);
//   private messageService = inject(AppMessageService);
//   private masterList = inject(MasterListService);

//   supplier = signal<any | null>(null);
//   branchNames = signal('N/A');

//   // 👈 5. State for the Dialog
//   showTransactionsDialog = false;

//   ngOnInit(): void {
//     this.loadSupplierData();
//   }

//   private loadSupplierData(): void {
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         const supplierId = params.get('id');
//         if (!supplierId) {
//           this.messageService.showError('Error', 'No supplier ID provided');
//           return of(null);
//         }
//         this.loadingService.show();
//         return this.supplierService.getSupplierById(supplierId).pipe(
//           finalize(() => this.loadingService.hide())
//         );
//       })
//     ).subscribe({
//       next: (response: any) => {
//         if (response && response.data && response.data.data) {
//           const supplierData = response.data.data;
//           this.supplier.set(supplierData);
          
//           // Map branch IDs to names
//           if (supplierData.branchesSupplied && supplierData.branchesSupplied.length > 0) {
//             const allBranches = this.masterList.branches();
//             const names = supplierData.branchesSupplied
//               .map((id: string) => allBranches.find(b => b._id === id)?.name)
//               .filter((name: string | undefined) => name)
//               .join(', ');
//             this.branchNames.set(names || 'N/A');
//           }
          
//         } else if (response !== null) {
//           this.messageService.showError('Error', 'Failed to load supplier details');
//         }
//       },
//       error: (err) => {
//         console.error('Failed to fetch supplier:', err);
//         this.messageService.showError('Error', err.error?.message || 'Could not fetch supplier');
//       }
//     });
//   }

//   formatCurrency(value: number | undefined | null): string {
//     if (value === undefined || value === null) value = 0;
//     return `₹ ${value.toFixed(2)}`;
//   }

//   formatDate(dateString: string | undefined): string {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//     });
//   }
  
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
