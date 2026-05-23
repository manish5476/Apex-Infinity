import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListingConfig, PublicProduct } from '@core/models/storefront.model';
import { StorefrontStateService } from '@core/services/storefront-state.service';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  selector: 'app-product-listing',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './product-listing.html',
  styles: [`
    :host { display: block; width: 100%; }
  `]
})
export class ProductListingComponent {
  @Input() config: ProductListingConfig = {};
  @Input() products: PublicProduct[] = [];

  constructor(private state: StorefrontStateService) { }

  orgSlug = computed(() => this.state.organization()?.slug || '');
}
