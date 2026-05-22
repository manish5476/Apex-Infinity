import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout-announcement-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="announcement" [class.promo]="tone() === 'promo'">
      <div class="announcement__inner">
        <span>{{ message() }}</span>
        @if (config?.ctaLabel && config?.ctaUrl) {
          <a [href]="config.ctaUrl">{{ config.ctaLabel }} <i class="pi pi-arrow-right"></i></a>
        }
      </div>
    </aside>
  `,
  styles: [`
    :host { display: block; position: relative; z-index: 45; }

    .announcement {
      color: #fff;
      background: #0f172a;
      font-family: var(--apx-font-sans);
    }

    .announcement.promo {
      background: var(--apx-gradient-commerce);
    }

    .announcement__inner {
      width: min(100% - 2rem, var(--apx-container-wide, 1440px));
      min-height: 2.4rem;
      margin-inline: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.9rem;
      text-align: center;
      font-size: 0.82rem;
      font-weight: 750;
    }

    a {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: inherit;
      text-decoration: none;
      opacity: 0.82;
    }

    a:hover { opacity: 1; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutAnnouncementBarComponent {
  @Input() config: any;

  readonly tone = computed(() => this.config?.tone ?? 'standard');
  readonly message = computed(() =>
    this.config?.message ?? this.config?.text ?? 'Free shipping, easy returns, and secure checkout.'
  );
}
