import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

interface AdminSurface {
  title: string;
  eyebrow: string;
  description: string;
  icon: string;
  gradient: string;
  cards: Array<{ title: string; value: string; caption: string; icon: string }>;
  workflows: Array<{ title: string; body: string; state: string }>;
}

const ADMIN_SURFACES: Record<string, AdminSurface> = {
  overview: {
    title: 'Storefront Command Center',
    eyebrow: 'Admin OS',
    description: 'A Shopify-grade operating surface for analytics, publishing, merchandising, theme operations, and storefront health.',
    icon: 'pi pi-chart-line',
    gradient: 'var(--apx-gradient-admin)',
    cards: [
      { title: 'Revenue pulse', value: 'Live', caption: 'Sales, AOV, refunds, and conversion signals', icon: 'pi pi-wallet' },
      { title: 'Publishing', value: 'Healthy', caption: 'Drafts, live pages, snapshots, and rollback path', icon: 'pi pi-send' },
      { title: 'Store quality', value: '92', caption: 'SEO, performance, accessibility, and content freshness', icon: 'pi pi-gauge' }
    ],
    workflows: [
      { title: 'Global search and command palette', body: 'Find orders, pages, products, customers, settings, and actions from one keyboard-first entry point.', state: 'Foundation ready' },
      { title: 'Contextual work queues', body: 'Abandoned carts, unpublished changes, low inventory, SEO issues, and recent incidents are staged for action.', state: 'Designed' },
      { title: 'Publishing confidence', body: 'Autosave, snapshot status, publish history, and rollback language are grouped beside the builder path.', state: 'Connected' }
    ]
  }
};

function surfaceFor(key: string): AdminSurface {
  const title = key.split('-').map(part => part[0]?.toUpperCase() + part.slice(1)).join(' ');
  return {
    title,
    eyebrow: 'Storefront admin',
    description: `A premium ${title.toLowerCase()} workspace with modern tables, filters, split panels, bulk actions, and enterprise-ready empty/loading states.`,
    icon: iconFor(key),
    gradient: key.includes('builder') ? 'var(--apx-gradient-builder)' : 'var(--apx-gradient-admin)',
    cards: [
      { title: 'Data view', value: 'Table+', caption: 'Search, saved filters, bulk actions, and sticky controls', icon: 'pi pi-table' },
      { title: 'Workflow', value: 'Guided', caption: 'Drawers, status chips, validation, and contextual actions', icon: 'pi pi-sitemap' },
      { title: 'Feedback', value: 'Realtime', caption: 'Autosave, publishing, notifications, and audit-ready history', icon: 'pi pi-bell' }
    ],
    workflows: [
      { title: 'Advanced filters', body: 'Segmented filter chips, date ranges, saved views, and clear active states are standardized.', state: 'UI ready' },
      { title: 'Split panel inspection', body: 'Rows open into detail panels so operators can review and act without losing context.', state: 'Pattern ready' },
      { title: 'Keyboard-first actions', body: 'The surface is prepared for command palette routing and repeatable power-user shortcuts.', state: 'Planned' }
    ]
  };
}

function iconFor(key: string): string {
  if (key.includes('theme')) return 'pi pi-palette';
  if (key.includes('seo')) return 'pi pi-globe';
  if (key.includes('analytics') || key.includes('reports')) return 'pi pi-chart-bar';
  if (key.includes('customer')) return 'pi pi-users';
  if (key.includes('role')) return 'pi pi-lock';
  if (key.includes('billing')) return 'pi pi-credit-card';
  if (key.includes('domain')) return 'pi pi-link';
  if (key.includes('notification')) return 'pi pi-bell';
  if (key.includes('history') || key.includes('audit') || key.includes('logs')) return 'pi pi-history';
  if (key.includes('discount')) return 'pi pi-ticket';
  if (key.includes('integration')) return 'pi pi-th-large';
  return 'pi pi-sparkles';
}

@Component({
  selector: 'app-storefront-command-center',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="admin-console">
      <section class="admin-hero">
        <div class="hero-card" [style.background]="surface().gradient">
          <div class="hero-copy">
            <span class="console-kicker"><i [class]="surface().icon"></i>{{ surface().eyebrow }}</span>
            <h1>{{ surface().title }}</h1>
            <p>{{ surface().description }}</p>
            <div class="hero-actions">
              <a routerLink="../pages" class="console-btn primary"><i class="pi pi-file-edit"></i>Pages</a>
              <a routerLink="../templates" class="console-btn"><i class="pi pi-clone"></i>Templates</a>
              <a routerLink="../analytics" class="console-btn"><i class="pi pi-chart-line"></i>Analytics</a>
            </div>
          </div>
          <div class="hero-preview">
            <div class="command-pill"><i class="pi pi-search"></i>Search storefront admin...</div>
            <div class="preview-bars">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </section>

      <section class="admin-grid">
        @for (card of surface().cards; track card.title) {
          <article class="metric-tile">
            <div class="tile-icon"><i [class]="card.icon"></i></div>
            <span>{{ card.title }}</span>
            <strong>{{ card.value }}</strong>
            <p>{{ card.caption }}</p>
          </article>
        }
      </section>

      <section class="workflow-panel">
        <div class="panel-heading">
          <div>
            <span class="console-kicker muted">Operating model</span>
            <h2>Enterprise workflows without dashboard clutter</h2>
          </div>
          <button class="console-btn dark" type="button"><i class="pi pi-sliders-h"></i>Customize view</button>
        </div>
        <div class="workflow-list">
          @for (item of surface().workflows; track item.title) {
            <article class="workflow-row">
              <div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.body }}</p>
              </div>
              <span>{{ item.state }}</span>
            </article>
          }
        </div>
      </section>
    </main>
  `,
  styleUrls: ['./storefront-command-center.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorefrontCommandCenterComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly surfaceKey = signal('overview');
  readonly surface = computed(() => ADMIN_SURFACES[this.surfaceKey()] ?? surfaceFor(this.surfaceKey()));

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.surfaceKey.set(typeof data['surfaceKey'] === 'string' ? data['surfaceKey'] : 'overview');
    });
  }
}
