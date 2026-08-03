import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NavGroup } from '../../navigation-model';
import { SidebarNavItemComponent } from '../sidebar-nav-item/sidebar-nav-item.component';

/**
 * SidebarNavSectionComponent
 *
 * Renders one navigation group. We removed the section labels to match
 * the cleaner, modern visual style.
 */
@Component({
  selector: 'app-sidebar-nav-section',
  standalone: true,
  imports: [SidebarNavItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-3 px-2">
      <!-- Spacer so groups still have visual breathing room -->
      <div class="h-1" aria-hidden="true"></div>

      <!-- Items -->
      <div class="space-y-[1px]">
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
