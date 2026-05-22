import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FeaturedProductConfig, PublicProduct } from '@core/models/storefront.model';
import { StorefrontStateService } from '@core/services/storefront-state.service';

@Component({
  selector: 'app-featured-product',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './featured-product.html',
  styles: [`
    :host { display: block; width: 100%; }
  `]
})
export class FeaturedProductComponent {
  @Input() config: FeaturedProductConfig = {};
  @Input() product: PublicProduct | null = null;
  
  constructor(private state: StorefrontStateService) {}
  
  orgSlug = computed(() => this.state.organization()?.slug || '');
}
