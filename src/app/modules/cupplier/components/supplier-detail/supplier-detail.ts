import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SupplierService } from '../../services/supplier-service';
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DividerModule,
    TagModule,
    AvatarModule
  ],
   templateUrl: './supplier-detail.html',
  styleUrl: './supplier-detail.scss',
})
export class SupplierDetailsComponent implements OnInit {
  // Injected services
  private route = inject(ActivatedRoute);
  private supplierService = inject(SupplierService);
  private loadingService = inject(LoadingService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);

  supplier = signal<any | null>(null);
  branchNames = signal('N/A');

  ngOnInit(): void {
    this.loadSupplierData();
  }

  private loadSupplierData(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const supplierId = params.get('id');
        if (!supplierId) {
          this.messageService.showError('Error', 'No supplier ID provided');
          return of(null);
        }
        this.loadingService.show();
        return this.supplierService.getSupplierById(supplierId).pipe(
          finalize(() => this.loadingService.hide())
        );
      })
    ).subscribe({
      next: (response: any) => {
        if (response && response.data && response.data.data) {
          const supplierData = response.data.data;
          this.supplier.set(supplierData);
          
          // Map branch IDs to names
          if (supplierData.branchesSupplied && supplierData.branchesSupplied.length > 0) {
            const allBranches = this.masterList.branches();
            const names = supplierData.branchesSupplied
              .map((id: string) => allBranches.find(b => b._id === id)?.name)
              .filter((name: string | undefined) => name)
              .join(', ');
            this.branchNames.set(names || 'N/A');
          }
          
        } else if (response !== null) {
          this.messageService.showError('Error', 'Failed to load supplier details');
        }
      },
      error: (err) => {
        console.error('Failed to fetch supplier:', err);
        this.messageService.showError('Error', err.error?.message || 'Could not fetch supplier');
      }
    });
  }

  formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null) value = 0;
    return `₹ ${value.toFixed(2)}`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    // Using a more readable format
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
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

// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-supplier-detail',
// //   imports: [],
// //   templateUrl: './supplier-detail.html',
// //   styleUrl: './supplier-detail.scss',
// // })
// // export class SupplierDetail {

// // }
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
// import { SupplierService } from '../../services/supplier-service';
// import { LoadingService } from '../../../../core/services/loading.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';

// @Component({
//   selector: 'app-supplier-details',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ButtonModule,
//     DividerModule,
//     TagModule,
//     AvatarModule
//   ],
  //  templateUrl: './supplier-detail.html',
  // styleUrl: './supplier-detail.scss',
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
//     return new Date(dateString).toLocaleString();
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