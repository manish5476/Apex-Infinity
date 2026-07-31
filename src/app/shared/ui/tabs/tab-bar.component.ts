import { Component, ChangeDetectionStrategy, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  emoji?: string;
  dotColor?: string;
}

/**
 * Component: app-tab-bar
 * Purpose: Reusable, scrollable horizontal tab bar styled as a pill.
 */
@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full overflow-hidden'
  },
  template: `
    <div class="inline-flex p-1 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-full max-w-full overflow-x-auto hide-scrollbar shadow-sm">
      <div class="flex items-center gap-1 min-w-max">
        @for (tab of tabs(); track tab.id) {
          <button
            type="button"
            (click)="selectTab(tab.id)"
            class="flex items-center gap-2 px-4 py-2 rounded-full text-[length:var(--font-size-sm)] font-[var(--font-weight-medium)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]"
            [class]="tab.id === activeTabId() 
              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'">
            
            <!-- Icon/Emoji Area -->
            @if (tab.emoji) {
              <span class="text-base leading-none">{{ tab.emoji }}</span>
            } @else if (tab.icon) {
              <i [class]="tab.icon"></i>
            } @else if (tab.dotColor) {
              <span class="w-2.5 h-2.5 rounded-full" [class]="tab.dotColor"></span>
            }

            <!-- Label Area -->
            <span class="truncate">{{ tab.label }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    /* Hide scrollbar for Chrome, Safari and Opera */
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    /* Hide scrollbar for IE, Edge and Firefox */
    .hide-scrollbar {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
  `]
})
export class TabBarComponent {
  tabs = input.required<TabItem[]>();
  activeTabId = model<string>();

  selectTab(id: string): void {
    this.activeTabId.set(id);
  }
}
