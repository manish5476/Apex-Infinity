import { 
  Component, 
  input, 
  output, 
  signal, 
  computed, 
  inject, 
  ChangeDetectionStrategy, 
  ViewEncapsulation 
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

// 1. Define specific Severity type for PrimeNG to prevent TS2322
type TagSeverity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined;

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  
  // 2. FIX: Make 'image' and 'brand' optional (?) so 'PublicProduct' is accepted
  image?: string | null;
  brand?: string | null;
  
  images?: string[]; 
  tags?: string[]; 
  category?: string | null;
  
  price?: { 
    original: number;
    discounted: number;
    currency: string;
    hasDiscount: boolean;
  };
  
  stock?: { 
    available: boolean;
    qty: number;
  };
  
  sku?: string;
  url?: string;
  rating?: number;
  reviewCount?: number;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, DialogModule, ButtonModule, TagModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss']
})
export class ProductCardComponent {
  private router = inject(Router);

  // Input now accepts objects missing 'image'/'brand' without crashing
  readonly product = input.required<Product>();
  readonly orgSlug = input<string>('');
  readonly layout = input<'grid' | 'list'>('grid');
  readonly addToCart = output<Product>();

  readonly showModal = signal(false);
  readonly imageError = signal(false);

  readonly displayImage = computed(() => {
    const p = this.product();
    if (this.imageError()) return 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg'; 
    
    // Check array first, then single image field
    if (p.images && p.images.length > 0) return p.images[0];
    if (p.image) return p.image;
    
    return 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg'; 
  });

  readonly priceDisplay = computed(() => {
    const p = this.product().price;
    if (!p) return { current: 0, original: 0, currency: 'INR', hasDiscount: false };

    return {
      current: p.discounted || p.original || 0,
      original: p.original || 0,
      currency: p.currency || 'INR',
      hasDiscount: !!p.hasDiscount
    };
  });

  // 3. FIX: Updated Stock Logic for Severity Types
  readonly stockInfo = computed(() => {
    const s = this.product().stock;
    if (!s) return { isAvailable: false, qty: 0, label: 'Out of Stock', severity: 'danger' as TagSeverity };

    const available = s.available && (s.qty > 0);
    
    // Correct PrimeNG severity mapping: 'warning' -> 'warn'
    let severity: TagSeverity = 'danger';
    
    if (available) {
        severity = s.qty < 10 ? 'warn' : 'success';
    }

    return {
      isAvailable: available,
      qty: s.qty,
      label: available ? 'In Stock' : 'Out of Stock',
      severity: severity
    };
  });

  readonly discountPercent = computed(() => {
    const p = this.priceDisplay();
    if (!p.hasDiscount || !p.original) return 0;
    return Math.round(((p.original - p.current) / p.original) * 100);
  });

  onImageError() { this.imageError.set(true); }

  openQuickView(e?: Event) {
    e?.stopPropagation();
    this.showModal.set(true);
  }

  closeQuickView(e?: Event) {
    e?.stopPropagation();
    this.showModal.set(false);
  }

  handleAddToCart(e?: Event) {
    e?.stopPropagation();
    this.addToCart.emit(this.product());
    this.showModal.set(false);
  }

  goToFullDetails() {
    this.showModal.set(false);
    const p = this.product();
    const org = this.orgSlug();

    if (p.url) {
      this.router.navigateByUrl(p.url);
      return;
    }

    if (org && p.slug) {
      this.router.navigate(['/store', org, 'products', p.slug]);
    }
  }
}

// import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// // ✅ Import PrimeNG Dialog
// import { DialogModule } from 'primeng/dialog';

// @Component({
//   selector: 'app-product-card',
//   standalone: true,
//   imports: [CommonModule, RouterModule, DialogModule], // ✅ Add DialogModule
//   templateUrl: './product-card.html',
//   styleUrls: ['./product-card.scss']
// })
// export class ProductCardComponent implements OnInit {
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);

//   @Input() layout: string = 'grid';
//   @Input({ required: true }) product!: any;
//   @Input() orgSlug: string = '';
  
//   @Output() addToCart = new EventEmitter<any>();

//   // ✅ Changed to standard boolean for easy 2-way binding with PrimeNG
//   showModal: boolean = false;
  
//   imageError = false;
//   readonly FALLBACK_IMAGE = 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg';

//   ngOnInit() {
//     if (!this.orgSlug) {
//       this.route.paramMap.subscribe(params => {
//         this.orgSlug = params.get('orgSlug') || '';
//       });
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

//   openQuickView(e?: Event) {
//     e?.stopPropagation();
//     this.showModal = true; // ✅ Open Dialog
//   }

//   closeQuickView(e?: Event) {
//     e?.stopPropagation();
//     this.showModal = false;
//   }

//   goToFullDetails() {
//     this.showModal = false;
//     if (!this.orgSlug || !this.product?.slug) return;
//     this.router.navigate(['/store', this.orgSlug, 'products', this.product.slug]);
//   }
// }
