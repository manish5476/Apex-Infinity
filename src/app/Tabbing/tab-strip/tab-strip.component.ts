import {
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
  effect,
  untracked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';

import { TabService } from '../Service/tab.service';
import { TabKeyboardService } from '../Service/tab-keyboard.service';
import { TabId, TabMeta } from '../tab.types';

@Component({
  selector: 'apex-tab-strip',
  standalone: true,
  imports: [CommonModule, TooltipModule, ContextMenuModule],
  templateUrl: './tab-strip.component.html',
  styleUrls: ['./tab-strip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabStripComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly tabService = inject(TabService);
  private readonly keyboardService = inject(TabKeyboardService);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('ctxMenu') ctxMenu!: ContextMenu;

  // ── Tab data ──────────────────────────────────────────────────────────────
  readonly tabs = this.tabService.tabs;

  // ── Context menu ──────────────────────────────────────────────────────────
  private readonly _ctxTab = signal<TabMeta | null>(null);

  readonly contextMenuItems = computed<MenuItem[]>(() => {
    const tab = this._ctxTab();
    if (!tab) return [];
    return [
      {
        label: tab.pinned ? 'Unpin tab' : 'Pin tab',
        icon: 'pi pi-thumbtack',
        command: () => this.tabService.togglePin(tab.id),
      },
      { separator: true },
      {
        label: 'Close tab',
        icon: 'pi pi-times',
        disabled: tab.pinned,
        command: () => this.tabService.closeTab(tab.id),
      },
      {
        label: 'Close other tabs',
        icon: 'pi pi-times-circle',
        command: () => this.tabService.closeOtherTabs(tab.id),
      },
      {
        label: 'Close tabs to the right',
        icon: 'pi pi-chevron-right',
        command: () => this.tabService.closeTabsToRight(tab.id),
      },
      { separator: true },
      {
        label: 'Close all tabs',
        icon: 'pi pi-ban',
        command: () => this.tabService.closeAllTabs(),
      },
      {
        label: 'Reopen closed tab',
        icon: 'pi pi-history',
        disabled: this.tabService.recentlyClosed().length === 0,
        command: () => this.tabService.reopenClosedTab(),
      },
    ];
  });

  // ── Drag state ────────────────────────────────────────────────────────────
  private _dragFromIndex: number | null = null;
  private wheelHandler?: (event: WheelEvent) => void;

  constructor() {
    effect(() => {
      const activeTabId = this.tabService.state().activeTabId;
      if (activeTabId) {
        untracked(() => this.scrollActiveTabIntoView());
      }
    });
  }

  ngOnInit(): void {
    this.keyboardService.init();
  }

  ngAfterViewInit(): void {
    if (this.scrollContainer) {
      this.wheelHandler = (event: WheelEvent) => this.onWheelScroll(event);
      this.scrollContainer.nativeElement.addEventListener('wheel', this.wheelHandler, { passive: false });
    }
  }

  ngOnDestroy(): void {
    if (this.scrollContainer?.nativeElement && this.wheelHandler) {
      this.scrollContainer.nativeElement.removeEventListener('wheel', this.wheelHandler);
    }
  }

  onWheelScroll(event: WheelEvent): void {
    event.preventDefault();
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollLeft += (event.deltaY * 1.8);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tab interactions
  // ─────────────────────────────────────────────────────────────────────────

  activateTab(id: TabId): void {
    this.tabService.activateTab(id);
  }

  closeTab(event: MouseEvent, id: TabId): void {
    event.stopPropagation();
    this.tabService.closeTab(id);
  }

  closeAll(): void {
    this.tabService.closeAllTabs();
  }

  openNewTab(): void {
    const searchEvent = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(searchEvent);
  }

  onMouseDown(event: MouseEvent, id: TabId): void {
    if (event.button === 1) { // Middle click
      event.preventDefault();
      this.tabService.closeTab(id);
    }
  }

  onContextMenu(event: MouseEvent, tab: TabMeta): void {
    this._ctxTab.set(tab);
    this.ctxMenu.show(event);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard navigation
  // ─────────────────────────────────────────────────────────────────────────

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const tabs = this.tabs();
    if (!tabs.length) return;
    const currentIdx = tabs.findIndex((t) => t.active);
    if (event.key === 'ArrowRight') {
      const next = tabs[(currentIdx + 1) % tabs.length];
      this.activateTab(next.id);
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      const prev = tabs[(currentIdx - 1 + tabs.length) % tabs.length];
      this.activateTab(prev.id);
      event.preventDefault();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Drag & drop reorder
  // ─────────────────────────────────────────────────────────────────────────

  onDragStart(event: DragEvent, index: number): void {
    this._dragFromIndex = index;
    event.dataTransfer?.setData('text/plain', String(index));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, toIndex: number): void {
    event.preventDefault();
    if (this._dragFromIndex !== null && this._dragFromIndex !== toIndex) {
      this.tabService.moveTab(this._dragFromIndex, toIndex);
    }
    this._dragFromIndex = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private scrollActiveTabIntoView(): void {
    setTimeout(() => {
      if (!this.scrollContainer?.nativeElement) return;
      const el = this.scrollContainer.nativeElement.querySelector<HTMLElement>('.apex-tab--active');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 50);
  }
}

