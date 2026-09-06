// src/app/tab-workspace/tab-strip/tab-strip.component.ts

import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { TooltipModule } from 'primeng/tooltip';
import { TabWorkspaceService } from '../tab-workspace.service';
import { AppTab, AppTabId } from '../tab-workspace.types';

@Component({
  selector: 'apex-tab-strip',
  standalone: true,
  imports: [CommonModule, TooltipModule, ContextMenuModule],
  templateUrl: './tab-strip.component.html',
  styleUrls: ['./tab-strip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabStripComponent implements AfterViewInit, OnDestroy {
  protected readonly tabService = inject(TabWorkspaceService);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('ctxMenu') ctxMenu!: ContextMenu;

  readonly tabs = this.tabService.tabs;
  readonly activeTabId = this.tabService.activeTabId;
  readonly hasTabs = this.tabService.hasTabs;

  // ── Overflow & Scroll State ───────────────────────────────────────────────
  readonly canScrollLeft = signal(false);
  readonly canScrollRight = signal(false);
  readonly isOverflowing = signal(false);
  readonly showAllTabsDropdown = signal(false);
  readonly filterQuery = signal('');

  // ── Filtered tabs for overflow switcher ───────────────────────────────────
  readonly filteredTabs = computed(() => {
    const q = this.filterQuery().trim().toLowerCase();
    const all = this.tabs();
    if (!q) return all;
    return all.filter(t => t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q));
  });

  // ── Context Menu State ────────────────────────────────────────────────────
  private readonly _ctxTab = signal<AppTab | null>(null);

  readonly contextMenuItems = computed<MenuItem[]>(() => {
    const tab = this._ctxTab();
    if (!tab) return [];

    return [
      {
        label: tab.pinned ? 'Unpin tab' : 'Pin tab',
        icon: 'pi pi-thumbtack',
        command: () => this.tabService.togglePin(tab.id)
      },
      {
        label: 'Copy link',
        icon: 'pi pi-copy',
        command: () => this.copyTabLink(tab)
      },
      { separator: true },
      {
        label: 'Close tab',
        icon: 'pi pi-times',
        disabled: tab.pinned,
        command: () => void this.tabService.close(tab.id)
      },
      {
        label: 'Close other tabs',
        icon: 'pi pi-times-circle',
        disabled: this.tabs().length <= 1,
        command: () => void this.tabService.closeOthers(tab.id)
      },
      {
        label: 'Close tabs to the right',
        icon: 'pi pi-chevron-right',
        command: () => void this.tabService.closeToRight(tab.id)
      },
      { separator: true },
      {
        label: 'Close all tabs',
        icon: 'pi pi-ban',
        disabled: this.tabs().length === 0,
        command: () => void this.tabService.closeAll()
      },
      {
        label: 'Reopen closed tab',
        icon: 'pi pi-history',
        disabled: this.tabService.recentlyClosed().length === 0,
        command: () => void this.tabService.reopenClosed()
      }
    ];
  });

  private dragFromIndex: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      const activeId = this.activeTabId();
      if (activeId) {
        untracked(() => {
          this.scrollActiveTabIntoView();
          this.updateScrollState();
        });
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.scrollContainer?.nativeElement) return;

    this.updateScrollState();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateScrollState();
      });
      this.resizeObserver.observe(this.scrollContainer.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  // ── Tab Navigation ────────────────────────────────────────────────────────

  onTabClick(id: AppTabId): void {
    void this.tabService.activate(id);
  }

  onTabClose(event: Event, id: AppTabId): void {
    event.stopPropagation();
    event.preventDefault();
    void this.tabService.close(id);
  }

  onMouseDown(event: MouseEvent, id: AppTabId): void {
    if (event.button === 1) {
      // Middle click to close
      event.preventDefault();
      void this.tabService.close(id);
    }
  }

  onContextMenu(event: MouseEvent, tab: AppTab): void {
    event.preventDefault();
    this._ctxTab.set(tab);
    this.ctxMenu.show(event);
  }

  // ── Scrolling Interactions ────────────────────────────────────────────────

  scrollLeft(): void {
    if (!this.scrollContainer?.nativeElement) return;
    this.scrollContainer.nativeElement.scrollBy({ left: -220, behavior: 'smooth' });
    setTimeout(() => this.updateScrollState(), 250);
  }

  scrollRight(): void {
    if (!this.scrollContainer?.nativeElement) return;
    this.scrollContainer.nativeElement.scrollBy({ left: 220, behavior: 'smooth' });
    setTimeout(() => this.updateScrollState(), 250);
  }

  onContainerScroll(): void {
    this.updateScrollState();
  }

  onWheelScroll(event: WheelEvent): void {
    if (!this.scrollContainer?.nativeElement) return;
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      this.scrollContainer.nativeElement.scrollLeft += event.deltaY * 1.5;
      this.updateScrollState();
    }
  }

  updateScrollState(): void {
    if (!this.scrollContainer?.nativeElement) return;
    const el = this.scrollContainer.nativeElement;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;

    this.canScrollLeft.set(scrollLeft > 4);
    this.canScrollRight.set(scrollLeft < maxScroll - 4);
    this.isOverflowing.set(el.scrollWidth > el.clientWidth + 4);
  }

  scrollActiveTabIntoView(): void {
    if (!isPlatformBrowser(this.platformId) || !this.scrollContainer?.nativeElement) return;

    setTimeout(() => {
      const activeEl = this.scrollContainer.nativeElement.querySelector<HTMLElement>('.tab-item--active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        this.updateScrollState();
      }
    }, 60);
  }

  // ── Keyboard Roving Tabindex ──────────────────────────────────────────────

  @HostListener('keydown', ['$event'])
  onHostKeydown(event: KeyboardEvent): void {
    const tabs = this.tabs();
    if (tabs.length === 0) return;

    const currentIdx = tabs.findIndex(t => t.id === this.activeTabId());

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const next = tabs[(currentIdx + 1) % tabs.length];
      void this.tabService.activate(next.id);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const prev = tabs[(currentIdx - 1 + tabs.length) % tabs.length];
      void this.tabService.activate(prev.id);
    } else if (event.key === 'Home') {
      event.preventDefault();
      void this.tabService.activate(tabs[0].id);
    } else if (event.key === 'End') {
      event.preventDefault();
      void this.tabService.activate(tabs[tabs.length - 1].id);
    } else if (event.key === 'Delete') {
      const activeTab = tabs[currentIdx];
      if (activeTab && !activeTab.pinned) {
        event.preventDefault();
        void this.tabService.close(activeTab.id);
      }
    }
  }

  // ── Drag and Drop Reordering ──────────────────────────────────────────────

  onDragStart(event: DragEvent, index: number): void {
    this.dragFromIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', String(index));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, toIndex: number): void {
    event.preventDefault();
    if (this.dragFromIndex !== null && this.dragFromIndex !== toIndex) {
      this.tabService.move(this.dragFromIndex, toIndex);
    }
    this.dragFromIndex = null;
  }

  // ── Quick Tab Switcher ────────────────────────────────────────────────────

  toggleAllTabsDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showAllTabsDropdown.update(v => !v);
    if (this.showAllTabsDropdown()) {
      this.filterQuery.set('');
    }
  }

  selectFromDropdown(id: AppTabId): void {
    this.showAllTabsDropdown.set(false);
    void this.tabService.activate(id);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showAllTabsDropdown()) {
      this.showAllTabsDropdown.set(false);
    }
  }

  private copyTabLink(tab: AppTab): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const fullUrl = window.location.origin + tab.url;
    navigator.clipboard?.writeText(fullUrl);
  }
}
