import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';

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
    SkeletonModule, AvatarModule, SupplierTransactions 
  ],
  templateUrl: './supplier-detail.html',
  styleUrls: ['./supplier-detail.scss'],
})
export class SupplierDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierService = inject(SupplierService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);

  // Signals
  supplier = signal<any | null>(null);
  loading = signal(true);
  isError = signal(false);
  branchNames = signal('N/A');
  
  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
            this.router.navigate(['/suppliers']);
            return of(null);
        }
        this.loading.set(true);
        this.isError.set(false);
        return this.supplierService.getSupplierById(id).pipe(
          finalize(() => this.loading.set(false))
        );
      })
    ).subscribe({
      next: (res: any) => {
        if (res?.data?.data || res?.data) {
          const s = res.data.data || res.data; // Handle potential API variations
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
    
    // Ensure master list is loaded or handle async if needed (assuming sync for simplicity here)
    const allBranches = this.masterList.branches(); 
    if(!allBranches || allBranches.length === 0) {
        // Fallback or retry logic if master list isn't ready
        this.branchNames.set('Loading branches...');
        return;
    }

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
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { AvatarModule } from 'primeng/avatar';
// // Removed DialogModule

// // Services
// import { SupplierService } from '../../services/supplier-service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { SupplierTransactions } from '../../../transactions/supplier-transactions/supplier-transactions';

// @Component({
//   selector: 'app-supplier-details',
//   standalone: true,
//   imports: [
//     CommonModule, RouterModule, ButtonModule, TagModule, 
//     SkeletonModule, AvatarModule, SupplierTransactions // Imported directly
//   ],
//   templateUrl: './supplier-detail.html',
//   styleUrls: ['./supplier-detail.scss'],
// })
// export class SupplierDetailsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private supplierService = inject(SupplierService);
//   private messageService = inject(AppMessageService);
//   private masterList = inject(MasterListService);

//   // Signals
//   supplier = signal<any | null>(null);
//   loading = signal(true);
//   isError = signal(false);
//   branchNames = signal('N/A');
  
//   // showTransactionsDialog = false; // REMOVED

//   ngOnInit(): void {
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         const id = params.get('id');
//         if (!id) return of(null);
//         this.loading.set(true);
//         this.isError.set(false);
//         return this.supplierService.getSupplierById(id).pipe(
//           finalize(() => this.loading.set(false))
//         );
//       })
//     ).subscribe({
//       next: (res: any) => {
//         if (res?.data?.data) {
//           const s = res.data.data;
//           this.supplier.set(s);
//           this.resolveBranchNames(s.branchesSupplied);
//         } else {
//           this.isError.set(true);
//         }
//       },
//       error: () => this.isError.set(true)
//     });
//   }

//   // Helper Logic
//   private resolveBranchNames(branchIds: string[]) {
//     if (!branchIds?.length) return;
//     const allBranches = this.masterList.branches();
//     const names = branchIds
//       .map(id => allBranches.find(b => b._id === id)?.name)
//       .filter(n => n)
//       .join(', ');
//     this.branchNames.set(names || 'N/A');
//   }

//   formatCurrency(value: number): string {
//     return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
//   }

//   formatDate(dateStr: string): string {
//     if (!dateStr) return 'N/A';
//     return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
//   }

//   formatAddress(addr: any): string {
//     if (!addr) return 'No address on file';
//     return [addr.street, addr.city, addr.state, addr.zipCode, addr.country]
//       .filter(p => p && p.trim()).join(',\n');
//   }
// }