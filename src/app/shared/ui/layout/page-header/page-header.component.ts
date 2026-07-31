// src/app/shared/ui/layout/page-header.component.ts
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Component: app-page-header
 * Purpose: Enterprise page header with theme-aware typography and borders.
 * Slots: Default (Actions/Buttons), [toolbar] (Secondary row)
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full z-[var(--z-sticky)] sticky top-0'
  },
  template: `
    <header class="flex flex-col bg-[var(--bg-primary)] border-b border-[var(--border-secondary)] shadow-[var(--shadow-xs)]">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 px-[var(--spacing-3xl)] py-[var(--spacing-2xl)]">
        <div class="flex flex-col gap-[var(--spacing-xs)]">
          @if (title()) {
            <h1 class="text-[length:var(--font-size-3xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] m-0 tracking-tight leading-[var(--line-height-tight)]">
              {{ title() }}
            </h1>
          }
          @if (subtitle()) {
            <p class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] m-0 leading-[var(--line-height-normal)]">
              {{ subtitle() }}
            </p>
          }
        </div>
        
        <!-- Primary Actions (Buttons, Search) -->
        <div class="flex items-center gap-[var(--spacing-md)]">
          <ng-content></ng-content>
        </div>
      </div>
      
      <!-- Optional Secondary Toolbar (Tabs, Filters) -->
      <ng-content select="[toolbar]"></ng-content>
    </header>
  `
})
export class PageHeaderComponent {
  title = input<string>();
  subtitle = input<string>();
}