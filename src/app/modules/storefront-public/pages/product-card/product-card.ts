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

// 1. Import the global model instead of defining a local one
import { PublicProduct } from '@core/models/storefront.model';

type TagSeverity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined;

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

  // 2. Use PublicProduct for your inputs and outputs
  readonly product = input.required<PublicProduct>();
  readonly orgSlug = input<string>('');
  readonly layout = input<'grid' | 'list'>('grid');
  readonly addToCart = output<PublicProduct>();

  readonly showModal = signal(false);
  readonly imageError = signal(false);

  readonly displayImage = computed(() => {
    const p = this.product();
    if (this.imageError()) return 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg';

    if (p.images && p.images.length > 0) return p.images[0];
    if (p.image) return p.image;

    return 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg';
  });

  // 3. Updated to use the correct 'current' price field
  readonly priceDisplay = computed(() => {
    const p = this.product().price;
    if (!p) return { current: 0, original: 0, currency: 'INR', hasDiscount: false };

    return {
      current: p.current || p.original || 0,
      original: p.original || 0,
      currency: p.currency || 'INR',
      hasDiscount: !!p.hasDiscount
    };
  });

  // 4. Updated to map to the stock shape defined in PublicProduct (uses 'quantity' not 'qty')
  readonly stockInfo = computed(() => {
    const s = this.product().stock;
    if (!s) return { isAvailable: false, qty: 0, label: 'Out of Stock', severity: 'danger' as TagSeverity };

    const qty = s.quantity || 0;
    const available = s.available || (qty > 0);

    let severity: TagSeverity = 'danger';

    if (available) {
      severity = qty < 10 ? 'warn' : 'success';
    }

    return {
      isAvailable: available,
      qty: qty,
      label: available ? 'In Stock' : 'Out of Stock',
      severity: severity
    };
  });

  // 5. Streamlined by using the backend-provided discountPercentage if available
  readonly discountPercent = computed(() => {
    const p = this.product();
    if (p.price?.discountPercentage) return p.price.discountPercentage;

    // Fallback calculation
    const pd = this.priceDisplay();
    if (!pd.hasDiscount || !pd.original) return 0;
    return Math.round(((pd.original - pd.current) / pd.original) * 100);
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