// ─────────────────────────────────────────────────────────────────────────────
// shell.component.ts  –  Top-level app shell
// ─────────────────────────────────────────────────────────────────────────────

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { TabService }       from '../tabs/tab.service';
import { TabStripComponent }  from '../tabs/tab-strip/tab-strip.component';
import { TabOutletComponent } from '../tabs/tab-outlet/tab-outlet.component';

// Example sidebar items — replace with your real nav model
interface NavItem {
  label: string;
  icon:  string;
  path:  string;
  queryParams?: Record<string, string>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home',  path: '/dashboard' },
  { label: 'Customers', icon: 'pi pi-users', path: '/customers' },
  { label: 'Invoices',  icon: 'pi pi-file',  path: '/invoices'  },
  { label: 'Settings',  icon: 'pi pi-cog',   path: '/settings'  },
];

@Component({
  selector: 'apex-shell',
  standalone: true,
  imports: [CommonModule, TabStripComponent, TabOutletComponent],
  template: `
    <div class="shell">

      <!-- Sidebar -->
      <aside class="shell__sidebar">
        <div class="sidebar-logo">
          <i class="pi pi-bolt"></i>
          <span>Apex CRM</span>
        </div>
        <nav class="sidebar-nav">
          @for (item of navItems; track item.path) {
            <button
              class="sidebar-nav__item"
              [class.sidebar-nav__item--active]="isNavActive(item.path)"
              (click)="openTab(item)"
            >
              <i [class]="item.icon"></i>
              <span>{{ item.label }}</span>
            </button>
          }
        </nav>
      </aside>

      <!-- Main content area -->
      <main class="shell__main">
        <!-- Tab strip -->
        <apex-tab-strip></apex-tab-strip>

        <!-- Routed content -->
        <apex-tab-outlet></apex-tab-outlet>
      </main>

    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--theme-surface-1, #11111b);
    }

    .shell__sidebar {
      width: 220px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      background: var(--theme-surface-2, #1e1e2e);
      border-right: 1px solid var(--theme-border, rgba(255 255 255 / .07));
      padding: 0 0 16px;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 20px;
      font-size: 15px;
      font-weight: 700;
      color: var(--theme-text-1, #cdd6f4);
      font-family: var(--theme-font-display, 'Inter', sans-serif);
      border-bottom: 1px solid var(--theme-border, rgba(255 255 255 / .07));
      margin-bottom: 8px;

      i {
        font-size: 18px;
        background: var(--theme-accent-gradient, linear-gradient(135deg, #89b4fa, #cba6f7));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .sidebar-nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; }

    .sidebar-nav__item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border: none;
      background: transparent;
      border-radius: var(--radius-md, 6px);
      color: var(--theme-text-3, #6c7086);
      cursor: pointer;
      font-size: 13.5px;
      font-family: var(--theme-font-ui, 'Inter', sans-serif);
      text-align: left;
      transition: background 120ms, color 120ms;

      i { font-size: 14px; width: 16px; flex-shrink: 0; }

      &:hover {
        background: var(--theme-hover, rgba(255 255 255 / .05));
        color: var(--theme-text-2, #a6adc8);
      }

      &--active {
        background: var(--theme-accent-subtle, rgba(137 180 250 / .12));
        color: var(--theme-accent, #89b4fa);
      }
    }

    .shell__main {
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      overflow: hidden;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements OnInit {

  private readonly router     = inject(Router);
  private readonly tabService = inject(TabService);

  readonly navItems = NAV_ITEMS;

  ngOnInit(): void {
    // Keep tab active state in sync when the router navigates externally
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const [path, qs] = e.urlAfterRedirects.split('?');
        const qp: Record<string, string> = {};
        if (qs) {
          qs.split('&').forEach(pair => {
            const [k, v] = pair.split('=');
            qp[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
          });
        }
        this.tabService.syncFromRouter(path, qp);
      });
  }

  openTab(item: NavItem): void {
    this.tabService.openTab(
      item.path,
      item.label,
      { icon: item.icon },
      { queryParams: item.queryParams ?? {} }
    );
  }

  isNavActive(path: string): boolean {
    return this.tabService.activeTab()?.path === path;
  }
}
