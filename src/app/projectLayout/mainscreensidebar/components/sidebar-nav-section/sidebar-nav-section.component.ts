import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NavGroup } from '../../navigation-model';
import { SidebarNavItemComponent } from '../sidebar-nav-item/sidebar-nav-item.component';

/**
 * SidebarNavSectionComponent
 *
 * Renders one navigation group: an optional section label (e.g. "ANALYTICS")
 * followed by its list of nav items.
 *
 * Purely presentational — emits toggle events upward to the orchestrator.
 */
@Component({
  selector: 'app-sidebar-nav-section',
  standalone: true,
  imports: [SidebarNavItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-3 px-2">
      <!-- Section label (uppercase, muted) — hidden in mini mode -->
      @if (!isMini()) {
        <div class="text-[11px] font-[var(--font-weight-semibold)] tracking-[0.12em] text-[var(--text-muted)] uppercase px-2 mb-1.5 mt-4 select-none" aria-hidden="true">
          {{ group().groupLabel }}
        </div>
      } @else {
        <!-- Spacer so groups still have visual breathing room in mini mode -->
        <div class="h-3" aria-hidden="true"></div>
      }

      <!-- Items -->
      <div class="space-y-[2px]">
        @for (item of group().items; track item.label) {
          <app-sidebar-nav-item
            [item]="item"
            [isMini]="isMini()"
            [expandedKeys]="expandedKeys()"
            [activeParentLabels]="activeParentLabels()"
            (toggle)="toggle.emit($event)"
          />
        }
      </div>
    </div>
  `,
})
export class SidebarNavSectionComponent {
  group = input.required<NavGroup>();
  isMini = input<boolean>(false);
  expandedKeys = input<Set<string>>(new Set<string>());
  activeParentLabels = input<Set<string>>(new Set<string>());

  toggle = output<string>();
}


