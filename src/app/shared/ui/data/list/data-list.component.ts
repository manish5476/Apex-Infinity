import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-data-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full flex flex-col' },
  template: `
    <!-- Premium Header Area -->
    @if (title() || icon()) {
      <div class="flex items-end justify-between mb-3 px-1">
        <div class="flex items-center gap-3">
          @if (icon()) {
            <div class="w-8 h-8 rounded-[var(--ui-border-radius)] bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] flex items-center justify-center border border-[var(--border-secondary)] shadow-sm">
              <i [class]="icon()" class="text-[var(--text-secondary)] text-sm"></i>
            </div>
          }
          @if (title()) {
            <h3 class="text-[length:var(--font-size-lg)] font-[var(--font-weight-bold)] text-[var(--text-primary)] m-0 tracking-tight leading-none">
              {{ title() }}
            </h3>
          }
        </div>
        
        <!-- Action Slot (e.g. for "View All" button or Badges) -->
        <div class="empty:hidden">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
    }

    <!-- Body / Scrollable Area -->
    <div [class]="bodyClasses()" [style.max-height]="maxHeight()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .data-list-body {
      overflow-y: auto;
      overflow-x: hidden;
    }
    
    .scrollbar-thin { scrollbar-width: thin; }
    .scrollbar-thin::-webkit-scrollbar { width: 4px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background-color: var(--border-secondary);
      border-radius: 10px;
    }
  `]
})
export class DataListComponent {
  title = input<string>();
  icon = input<string>();

  /** 'divided' for flat rows (Operations). 'spaced' for separate rich cards (Top Products). */
  variant = input<'divided' | 'spaced'>('divided');
  maxHeight = input<string>('none');
  cardStyle = input<boolean>(true);

  protected bodyClasses = computed(() => {
    const base = 'data-list-body w-full scrollbar-thin transition-all duration-300';

    if (this.variant() === 'spaced') {
      return `${base} flex flex-col gap-3 py-1 ${this.cardStyle() ? 'p-[var(--spacing-md)] bg-[var(--bg-secondary)] rounded-[var(--ui-border-radius-xl)] border border-[var(--border-secondary)]' : ''}`;
    }

    // The "Divided" look (Crisp white box with internal borders)
    return `${base} flex flex-col bg-[var(--component-bg)] rounded-[var(--ui-border-radius-xl)] border border-[var(--component-border)] shadow-[var(--shadow-sm)] divide-y divide-[var(--border-secondary)]`;
  });
}