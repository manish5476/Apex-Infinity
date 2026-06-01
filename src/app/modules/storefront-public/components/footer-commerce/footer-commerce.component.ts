
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StorefrontStateService } from '@core/services/storefront-state.service';

@Component({
  selector: 'app-footer-commerce',
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer class="footer-commerce">
      <div class="footer-commerce__inner">
        <section class="footer-commerce__brand">
          <span class="footer-commerce__kicker">Secure commerce</span>
          <h2>{{ organization?.name || 'Store' }}</h2>
          <p>{{ config?.description || 'Premium products, protected checkout, thoughtful support, and a storefront built for confidence.' }}</p>
          <form class="footer-commerce__newsletter">
            <input type="email" placeholder="Email address" aria-label="Email address for offers" />
            <button type="button">Join</button>
          </form>
        </section>

        <nav class="footer-commerce__columns" aria-label="Footer navigation">
          @for (column of columns(); track column.title) {
            <div>
              <h3>{{ column.title }}</h3>
              <ul>
                @for (link of column.links; track link.label) {
                  <li><a [routerLink]="link.routerLink">{{ link.label }}</a></li>
                }
              </ul>
            </div>
          }
        </nav>

        <section class="footer-commerce__trust" aria-label="Store assurances">
          @for (badge of trustBadges(); track badge.label) {
            <div class="trust-badge">
              <i [class]="badge.icon"></i>
              <span>{{ badge.label }}</span>
            </div>
          }
        </section>

        <div class="footer-commerce__bottom">
          <span>{{ copyright() }}</span>
          <div class="payment-icons" aria-label="Supported payment methods">
            <span>Visa</span><span>MC</span><span>UPI</span><span>COD</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer-commerce.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterCommerceComponent {
  @Input() config: any;
  @Input() organization: any;

  private readonly state = inject(StorefrontStateService);
  readonly slug = computed(() => this.organization?.slug ?? this.state.organization()?.slug ?? '');
  readonly year = new Date().getFullYear();

  readonly columns = computed(() => {
    const configured = this.config?.columns;
    if (Array.isArray(configured) && configured.length) {
      return configured.map((column: any) => ({
        title: column.title,
        links: (column.links ?? []).map((link: any) => this.normalizeLink(link.label, link.url))
      }));
    }

    return [
      {
        title: 'Shop',
        links: ['Products', 'New arrivals', 'Best sellers', 'Gift card'].map(label => this.normalizeLink(label, this.pathFor(label)))
      },
      {
        title: 'Support',
        links: ['Track order', 'Shipping policy', 'Refund policy', 'Contact'].map(label => this.normalizeLink(label, this.pathFor(label)))
      },
      {
        title: 'Company',
        links: ['About', 'Careers', 'Press', 'Privacy policy'].map(label => this.normalizeLink(label, this.pathFor(label)))
      }
    ];
  });

  readonly trustBadges = computed(() => this.config?.trustBadges ?? [
    { icon: 'pi pi-shield', label: 'Secure checkout' },
    { icon: 'pi pi-refresh', label: 'Easy returns' },
    { icon: 'pi pi-truck', label: 'Reliable delivery' }
  ]);

  readonly copyright = computed(() =>
    this.config?.copyright ?? `© ${this.year} ${this.organization?.name || 'Store'}. All rights reserved.`
  );

  private normalizeLink(label: string, url: string) {
    const clean = (url || '').replace(/^\/+/, '');
    return { label, routerLink: ['/store', this.slug(), clean].filter(Boolean) };
  }

  private pathFor(label: string): string {
    return label.toLowerCase().replace(/\s+/g, '-');
  }
}
