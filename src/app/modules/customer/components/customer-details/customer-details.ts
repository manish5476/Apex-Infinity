import { MessageService } from 'primeng/api';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerService } from '../../services/customer-service';
import { finalize, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { MasterListService } from '../../../../core/services/master-list.service';
import { Message } from '../../../../core/services/message';
import { SkeletonModule } from 'primeng/skeleton'; // Corrected import

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    DividerModule,
    AvatarModule,
    TagModule,
    SkeletonModule // Corrected import
  ],
  providers: [CustomerService], // Already provided in list, but good for standalone
  templateUrl: './customer-details.html', // Corrected extension
  styleUrl: './customer-details.scss',
})
export class CustomerDetails implements OnInit {

  private route = inject(ActivatedRoute);
  private customerService = inject(CustomerService);
  private MessageService = inject(Message);
  public MasterList = inject(MasterListService);
  customerId: any
  // Signal to hold customer data
  customer = signal<any | null>(null);
  ngOnInit(): void {
    this.loadCustomerData();
  }

  loadCustomerData(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const customerId = params.get('id');
        this.customerId = customerId; // Store customerId
        if (!customerId) {
          return of(null);
        }
        return this.customerService.getCustomerDataWithId(customerId).pipe(
          // Removed unnecessary pipe
        );
      })
    ).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.customer.set(response.data.data);
        } else if (response === null) {
          // Handle case where customerId was null
          this.MessageService.handleError('Error', 'No customer ID provided.');
        } else {
          this.MessageService.handleResponse(response.Message);
        }
      },
      error: (err) => {
        console.error('Failed to fetch customer:', err);
        this.MessageService.handleError('Error', err.error?.message || 'Could not fetch customer');
      }
    });
  }

  /**
  * Helper to get initials from a name
  */
  getInitials(name: string): string {
    if (!name) return 'C';
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }

  getFilteredTags(): string[] {
    const tags = this.customer()?.tags;
    if (Array.isArray(tags)) {
      return tags.filter(tag => tag && tag.trim() !== '');
    }
    return [];
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

  isSameAddress(): any {
    
  }

  /**
  * Helper to format currency
  */
  formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null) {
      value = 0;
    }
    return `₹ ${value.toFixed(2)}`;
  }
}

// import { MessageService } from 'primeng/api';
// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { CustomerService } from '../../services/customer-service';
// import { finalize, switchMap } from 'rxjs/operators';
// import { Observable, of } from 'rxjs';
// import { ButtonModule } from 'primeng/button';
// import { DividerModule } from 'primeng/divider';
// import { AvatarModule } from 'primeng/avatar';
// import { TagModule } from 'primeng/tag';
// import { Select } from 'primeng/select';
// import { FormsModule } from '@angular/forms';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { Message } from '../../../../core/services/message';
// import { Skeleton } from 'primeng/skeleton';

// @Component({
//   selector: 'app-customer-details',
//   standalone: true,
//   imports: [CommonModule,Skeleton, FormsModule, RouterModule, ButtonModule, DividerModule, AvatarModule, TagModule],
//   providers: [CustomerService], // Already provided in list, but good for standalone
//   templateUrl: './customer-details.html',
//   styleUrl: './customer-details.scss',
// })
// export class CustomerDetails implements OnInit {
//   private route = inject(ActivatedRoute);
//   private customerService = inject(CustomerService);
//   private MessageService = inject(Message);
//   public MasterList = inject(MasterListService);
//   customerId: any
//   // Signal to hold customer data
//   customer = signal<any | null>(null);
//   ngOnInit(): void {
//     this.loadCustomerData();
//   }

//   loadCustomerData(): void {
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         const customerId = params.get('id');
//         if (!customerId) {
//           return of(null);
//         }
//         return this.customerService.getCustomerDataWithId(customerId ?? this.customerId).pipe(
//         );
//       })
//     ).subscribe({
//       next: (response: any) => {
//         if (response && response.data) {
//           this.customer.set(response.data.data);
//         } else if (response === null) {
//           this.MessageService.handleResponse(response.Message);
//         } else {
//           this.MessageService.handleResponse(response.Message);
//         }
//       },
//       error: (err) => {
//         console.error('Failed to fetch customer:', err);
//         this.MessageService.handleError('Error', err.error?.message || 'Could not fetch customer');
//       }
//     });
//   }

//   /**
//    * Helper to get initials from a name
//    */
//   getInitials(name: string): string {
//     if (!name) return 'C';
//     const names = name.split(' ');
//     if (names.length > 1) {
//       return (names[0][0] + names[names.length - 1][0]).toUpperCase();
//     }
//     return names[0].substring(0, 2).toUpperCase();
//   }

//   getFilteredTags(): string[] {
//     const tags = this.customer()?.tags;
//     if (Array.isArray(tags)) {
//       return tags.filter(tag => tag && tag.trim() !== '');
//     }
//     return [];
//   }

//   formatDate(dateString: string | undefined): string {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleString();
//   }

//   /**
//    * Helper to format currency
//    */
//   formatCurrency(value: number | undefined | null): string {
//     if (value === undefined || value === null) {
//       value = 0;
//     }
//     return `₹ ${value.toFixed(2)}`;
//   }
// }