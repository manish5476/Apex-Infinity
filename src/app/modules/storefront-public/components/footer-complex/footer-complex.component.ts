import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StorefrontStateService } from '@core/services/storefront-state.service';

@Component({
  selector: 'app-footer-complex',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer-complex.component.html',
  styleUrls: ['./footer-complex.component.scss']
})
export class FooterComplexComponent {
  @Input() config: any;
  @Input() organization: any;

  private readonly stateService = inject(StorefrontStateService);

  readonly slug = computed(() => this.organization?.slug ?? this.stateService.organization()?.slug ?? '');
  readonly currentYear = new Date().getFullYear();

  readonly columns = computed(() => {
    const configured = this.config?.columns;
    if (Array.isArray(configured) && configured.length) return configured;

    return [
      {
        title: 'Shop',
        links: [
          { label: 'Products', url: 'products' },
          { label: 'Wishlist', url: 'wishlist' },
          { label: 'Gift cards', url: 'gift-card' }
        ]
      },
      {
        title: 'Support',
        links: [
          { label: 'FAQ', url: 'faq' },
          { label: 'Track order', url: 'track-order' },
          { label: 'Contact', url: 'contact' }
        ]
      },
      {
        title: 'Policies',
        links: [
          { label: 'Privacy', url: 'privacy-policy' },
          { label: 'Terms', url: 'terms-and-conditions' },
          { label: 'Refunds', url: 'refund-policy' }
        ]
      }
    ];
  });

  readonly policies = computed(() => this.config?.policies ?? [
    { label: 'Privacy', url: 'privacy-policy' },
    { label: 'Terms', url: 'terms-and-conditions' },
    { label: 'Shipping', url: 'shipping-policy' },
    { label: 'Refunds', url: 'refund-policy' }
  ]);

  linkFor(url: string): unknown[] {
    const clean = String(url ?? '').replace(/^\/+/, '');
    return ['/store', this.slug(), clean].filter(Boolean);
  }
}
