import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// ✅ Import PrimeNG Dialog
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, DialogModule], // ✅ Add DialogModule
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss']
})
export class ProductCardComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @Input() layout: string = 'grid';
  @Input({ required: true }) product!: any;
  @Input() orgSlug: string = '';
  
  @Output() addToCart = new EventEmitter<any>();

  // ✅ Changed to standard boolean for easy 2-way binding with PrimeNG
  showModal: boolean = false;
  
  imageError = false;
  readonly FALLBACK_IMAGE = 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg';

  ngOnInit() {
    if (!this.orgSlug) {
      this.route.paramMap.subscribe(params => {
        this.orgSlug = params.get('orgSlug') || '';
      });
      if (!this.orgSlug && this.route.parent) {
        this.route.parent.paramMap.subscribe(params => {
          this.orgSlug = params.get('orgSlug') || '';
        });
      }
    }
  }

  get displayImage(): string {
    return (this.imageError || !this.product?.images?.length)
      ? this.FALLBACK_IMAGE
      : this.product.images[0];
  }

  onImageError() {
    this.imageError = true;
  }

  openQuickView(e?: Event) {
    e?.stopPropagation();
    this.showModal = true; // ✅ Open Dialog
  }

  closeQuickView(e?: Event) {
    e?.stopPropagation();
    this.showModal = false;
  }

  goToFullDetails() {
    this.showModal = false;
    if (!this.orgSlug || !this.product?.slug) return;
    this.router.navigate(['/store', this.orgSlug, 'products', this.product.slug]);
  }
}

// import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { animate, style, transition, trigger } from '@angular/animations';

// @Component({
//   selector: 'app-product-card',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './product-card.html',
//   styleUrls: ['./product-card.scss'],
//   animations: [
//     trigger('modalFade', [
//       transition(':enter', [
//         style({ opacity: 0 }),
//         animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
//       ]),
//       transition(':leave', [
//         animate('200ms ease-in', style({ opacity: 0 }))
//       ])
//     ]),
//     trigger('modalScale', [
//       transition(':enter', [
//         style({ transform: 'scale(0.95) translateY(10px)', opacity: 0 }),
//         animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'scale(1) translateY(0)', opacity: 1 }))
//       ]),
//       transition(':leave', [
//         animate('200ms ease-in', style({ transform: 'scale(0.95) translateY(10px)', opacity: 0 }))
//       ])
//     ])
//   ]
// })
// export class ProductCardComponent implements OnInit {
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);

//   @Input() layout: string = 'grid';
//   @Input({ required: true }) product!: any;
//   @Input() orgSlug: string = ''; // Optional input, falls back to route
  
//   @Output() addToCart = new EventEmitter<any>();

//   // Signals for Reactive State
//   showModal = signal(false);
  
//   // Local state
//   imageError = false;
//   readonly FALLBACK_IMAGE = 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg';

//   ngOnInit() {
//     // robust fallback to get orgSlug if not passed by parent
//     if (!this.orgSlug) {
//       this.route.paramMap.subscribe(params => {
//         this.orgSlug = params.get('orgSlug') || '';
//       });
      
//       // Check parent route if current route is empty (common in child routes)
//       if (!this.orgSlug && this.route.parent) {
//         this.route.parent.paramMap.subscribe(params => {
//           this.orgSlug = params.get('orgSlug') || '';
//         });
//       }
//     }
//   }

//   get displayImage(): string {
//     return (this.imageError || !this.product?.images?.length)
//       ? this.FALLBACK_IMAGE
//       : this.product.images[0];
//   }

//   onImageError() {
//     this.imageError = true;
//   }

//   // --- Interaction Logic ---

//   openQuickView(e?: Event) {
//     e?.stopPropagation(); // Prevent navigation when clicking "Quick Look"
//     this.showModal.set(true);
//     // Lock body scroll
//     document.body.style.overflow = 'hidden';
//   }

//   closeQuickView(e?: Event) {
//     e?.stopPropagation();
//     this.showModal.set(false);
//     // Restore body scroll
//     document.body.style.overflow = 'auto';
//   }

//   goToFullDetails() {
//     this.closeQuickView(); // Close modal first

//     if (!this.orgSlug || !this.product?.slug) {
//       console.warn('Navigation blocked: Missing slug data', { org: this.orgSlug, product: this.product });
//       return;
//     }

//     this.router.navigate(['/store', this.orgSlug, 'products', this.product.slug]);
//   }
// }

// // import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// // import { animate, style, transition, trigger } from '@angular/animations';

// // @Component({
// //   selector: 'app-product-card',
// //   standalone: true,
// //   imports: [CommonModule, RouterModule],
// //   templateUrl: './product-card.html',
// //   styleUrls: ['./product-card.scss'],
// //   animations: [
// //     trigger('modalFade', [
// //       transition(':enter', [
// //         style({ opacity: 0 }),
// //         animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
// //       ]),
// //       transition(':leave', [
// //         animate('200ms ease-in', style({ opacity: 0 }))
// //       ])
// //     ]),
// //     trigger('modalScale', [
// //       transition(':enter', [
// //         style({ transform: 'scale(0.95) translateY(10px)', opacity: 0 }),
// //         animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'scale(1) translateY(0)', opacity: 1 }))
// //       ]),
// //       transition(':leave', [
// //         animate('200ms ease-in', style({ transform: 'scale(0.95) translateY(10px)', opacity: 0 }))
// //       ])
// //     ])
// //   ]
// // })
// // export class ProductCardComponent implements OnInit {
// //   private router = inject(Router);
// //   private route = inject(ActivatedRoute);

// //   @Input() layout: string = 'grid';
// //   @Input() product!: any;
// //   @Input() orgSlug!: string; // Might be undefined if parent doesn't pass it
// //   @Output() addToCart = new EventEmitter<any>();

// //   // State for the "Best UI" Modal
// //   showModal = signal(false);
// //   imageError = false;

// //   readonly FALLBACK_IMAGE = 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg';

// //   // ✅ RESTORED: This ensures we get the orgSlug from the URL 
// //   // if the parent component (like Home Page Slider) didn't pass it explicitly.
// //   ngOnInit() {
// //     if (!this.orgSlug) {
// //       // Try to get orgSlug from the current route or parent route
// //       this.route.paramMap.subscribe(params => {
// //         const slug = params.get('orgSlug');
// //         if (slug) this.orgSlug = slug;
// //       });

// //       // Fallback: Check parent route (common in lazy loaded modules)
// //       this.route.parent?.paramMap.subscribe(params => {
// //         const slug = params.get('orgSlug');
// //         if (slug && !this.orgSlug) this.orgSlug = slug;
// //       });
// //     }
// //   }

// //   get displayImage(): string {
// //     return (this.imageError || !this.product?.images?.length)
// //       ? this.FALLBACK_IMAGE
// //       : this.product.images[0];
// //   }

// //   // Open the "Masterpiece" Modal
// //   openQuickView(e?: Event) {
// //     e?.stopPropagation();
// //     this.showModal.set(true);
// //     document.body.style.overflow = 'hidden';
// //   }

// //   // Close Modal
// //   closeQuickView(e?: Event) {
// //     e?.stopPropagation();
// //     this.showModal.set(false);
// //     document.body.style.overflow = 'auto';
// //   }

// //   // Navigate to full page
// //   goToFullDetails() {
// //     this.closeQuickView();

// //     // Safety Check: Log error if slug is still missing
// //     if (!this.orgSlug || !this.product?.slug) {
// //       console.error('Cannot navigate: Missing orgSlug or product slug', { 
// //         org: this.orgSlug, 
// //         product: this.product 
// //       });
// //       return;
// //     }

// //     this.router.navigate(['/store', this.orgSlug, 'products', this.product.slug]);
// //   }

// //   onImageError() {
// //     this.imageError = true;
// //   }
// // }
