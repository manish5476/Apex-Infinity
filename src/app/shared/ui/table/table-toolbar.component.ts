// src/app/shared/ui/table/table-toolbar.component.ts
import { Component, ChangeDetectionStrategy, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

/**
 * Component: app-table-toolbar
 * Purpose: Enterprise grid control bar for global search, selection overlays, exports, and filter toggles.
 */
@Component({
    selector: 'app-table-toolbar',
    standalone: true,
    imports: [
        FormsModule,
        ButtonModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        BadgeModule,
        MenuModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'block w-full border-b border-[var(--border-secondary)] bg-[var(--bg-primary)] rounded-t-[var(--ui-border-radius-lg)]'
    },
    template: `
    <div class="flex flex-col gap-[var(--spacing-md)] p-[var(--spacing-xl)]">
      
      <!-- Selection Overlay View (Overrides normal toolbar when items are selected) -->
      @if (selectedCount() > 0) {
        <div class="flex flex-wrap items-center justify-between gap-[var(--spacing-md)] bg-[var(--accent-focus)] p-[var(--spacing-md)] rounded-[var(--ui-border-radius)] border border-[var(--accent-primary)] animate-fade-in">
          <div class="flex items-center gap-[var(--spacing-md)]">
            <span class="text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--accent-primary)]">
              {{ selectedCount() }} item(s) selected
            </span>
            <p-button 
              label="Clear selection" 
              [link]="true" 
              size="small"
              (onClick)="clearSelection.emit()"
              styleClass="p-0 text-[length:var(--font-size-xs)]">
            </p-button>
          </div>

          <div class="flex items-center gap-[var(--spacing-sm)]">
            <ng-content select="[left-actions]"></ng-content>
          </div>
        </div>
      } @else {
        <!-- Standard Grid Control Toolbar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-[var(--spacing-md)]">
          
          <!-- Left: Search Box & Filter Toggle -->
          <div class="flex items-center gap-[var(--spacing-sm)] flex-1 max-w-lg">
            <p-iconField iconPosition="left" class="w-full">
              <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
              <input 
                pInputText 
                type="text" 
                class="w-full p-inputtext-sm text-[length:var(--font-size-sm)]" 
                [placeholder]="searchPlaceholder()"
                [(ngModel)]="searchValue" />
            </p-iconField>

            @if (showFilterToggle()) {
              <p-button 
                [outlined]="!filterOpen()"
                [severity]="filterOpen() ? 'primary' : 'secondary'"
                size="small"
                icon="pi pi-filter"
                [label]="filterOpen() ? 'Hide Filters' : 'Filters'"
                (onClick)="toggleFilter()">
                @if (activeFilterCount() > 0) {
                  <p-badge [value]="activeFilterCount().toString()" severity="danger" class="ml-1"></p-badge>
                }
              </p-button>
            }
          </div>

          <!-- Right: Custom Action Buttons & Export Controls -->
          <div class="flex items-center gap-[var(--spacing-sm)]">
            <ng-content select="[right-actions]"></ng-content>

            @if (showExport()) {
              <p-button 
                icon="pi pi-download" 
                label="Export" 
                severity="secondary" 
                [outlined]="true" 
                size="small"
                (onClick)="exportMenu.toggle($event)">
              </p-button>
              <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class TableToolbarComponent {
    searchValue = model<string>('');
    filterOpen = model<boolean>(false);

    searchPlaceholder = input<string>('Search records...');
    selectedCount = input<number>(0);
    activeFilterCount = input<number>(0);
    showFilterToggle = input<boolean>(true);
    showExport = input<boolean>(true);

    clearSelection = output<void>();
    export = output<'csv' | 'excel' | 'pdf'>();

    protected exportMenuItems: MenuItem[] = [
        { label: 'Export CSV', icon: 'pi pi-file', command: () => this.export.emit('csv') },
        { label: 'Export Excel', icon: 'pi pi-file-excel', command: () => this.export.emit('excel') },
        { label: 'Export PDF', icon: 'pi pi-file-pdf', command: () => this.export.emit('pdf') }
    ];

    protected toggleFilter(): void {
        this.filterOpen.set(!this.filterOpen());
    }
}