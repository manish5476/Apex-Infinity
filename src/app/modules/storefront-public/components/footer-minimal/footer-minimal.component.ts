
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StorefrontStateService } from '@core/services/storefront-state.service';

@Component({
  selector: 'app-footer-minimal',
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer class="footer-minimal">
      <div class="footer-minimal__inner">
        <a class="brand" [routerLink]="['/store', slug()]">{{ organization?.name || 'Store' }}</a>
        <nav aria-label="Footer links">
          @for (link of links(); track link.label) {
            <a [routerLink]="link.routerLink">{{ link.label }}</a>
          }
        </nav>
        <span>© {{ year }} {{ organization?.name || 'Store' }}</span>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; }

    .footer-minimal {
      border-top: 1px solid var(--border-primary);
      background: var(--bg-primary);
      color: var(--text-secondary);
    }

    .footer-minimal__inner {
      width: min(100% - 2rem, var(--apx-container-wide, 1440px));
      min-height: 5rem;
      margin-inline: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.86rem;
      font-weight: 700;
    }

    .brand {
      color: var(--text-primary);
      font-family: var(--apx-font-display);
      font-weight: 900;
    }

    nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    a:hover {
      color: var(--accent-primary);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterMinimalComponent {
  @Input() config: any;
  @Input() organization: any;

  private readonly state = inject(StorefrontStateService);
  readonly slug = computed(() => this.organization?.slug ?? this.state.organization()?.slug ?? '');
  readonly year = new Date().getFullYear();

  readonly links = computed(() => {
    const configured = this.config?.links ?? this.config?.columns?.flatMap((col: any) => col.links ?? []);
    const raw = Array.isArray(configured) && configured.length
      ? configured
      : [
          { label: 'Shop', url: 'products' },
          { label: 'Privacy', url: 'privacy-policy' },
          { label: 'Terms', url: 'terms-and-conditions' },
          { label: 'Contact', url: 'contact' }
        ];

    return raw.map((link: any) => ({
      label: link.label,
      routerLink: ['/store', this.slug(), String(link.url ?? '').replace(/^\/+/, '')].filter(Boolean)
    }));
  });
}
