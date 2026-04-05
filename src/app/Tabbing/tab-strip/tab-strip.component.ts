// ─────────────────────────────────────────────────────────────────────────────
// tab-strip.component.ts
// FIX #2: keyboard shortcuts wired via TabKeyboardService
// FIX #3: overflow dropdown for 15+ tabs (visibleTabs / overflowTabs computed)
// FIX #4: mousedown instead of auxclick for middle-click close
// ─────────────────────────────────────────────────────────────────────────────

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule }    from 'primeng/tooltip';
import { ContextMenuModule } from 'primeng/contextmenu';
import { MenuItem }          from 'primeng/api';

import { TabService }         from '../tab.service';
import { TabKeyboardService } from '../tab-keyboard.service';
import { TabId, TabMeta }     from '../tab.types';

// How many tabs to show before moving the rest to the overflow dropdown
const OVERFLOW_THRESHOLD = 12;

@Component({
  selector: 'apex-tab-strip',
  standalone: true,
  imports: [CommonModule, TooltipModule, ContextMenuModule],
  templateUrl: './tab-strip.component.html',
  styleUrls:  ['./tab-strip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabStripComponent implements OnInit {

  private readonly tabService      = inject(TabService);
  private readonly keyboardService = inject(TabKeyboardService);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('overflowRef')     overflowRef?: ElementRef<HTMLDivElement>;

  // ── Tab data ──────────────────────────────────────────────────────────────
  readonly tabs         = this.tabService.tabs;

  /** FIX #3: tabs shown in the strip */
  readonly visibleTabs  = computed(() => this.tabs().slice(0, OVERFLOW_THRESHOLD));

  /** FIX #3: tabs hidden in the overflow dropdown */
  readonly overflowTabs = computed(() => this.tabs().slice(OVERFLOW_THRESHOLD));

  // ── Overflow state ────────────────────────────────────────────────────────
  readonly overflowOpen = signal(false);

  // ── Context menu ──────────────────────────────────────────────────────────
  private _ctxTab = signal<TabMeta | null>(null);

  readonly contextMenuItems = computed<MenuItem[]>(() => {
    const tab = this._ctxTab();
    if (!tab) return [];
    return [
      {
        label:   tab.pinned ? 'Unpin tab' : 'Pin tab',
        icon:    'pi pi-thumbtack',
        command: () => this.tabService.togglePin(tab.id),
      },
      { separator: true },
      {
        label:    'Close tab',
        icon:     'pi pi-times',
        disabled: tab.pinned,
        command:  () => this.tabService.closeTab(tab.id),
      },
      {
        label:   'Close other tabs',
        icon:    'pi pi-times-circle',
        command: () => this.tabService.closeOtherTabs(tab.id),
      },
      {
        label:   'Close tabs to the right',
        icon:    'pi pi-chevron-right',
        command: () => this.tabService.closeTabsToRight(tab.id),
      },
      { separator: true },
      {
        label:   'Close all tabs',
        icon:    'pi pi-ban',
        command: () => this.tabService.closeAllTabs(),
      },
    ];
  });

  // ── Drag state ────────────────────────────────────────────────────────────
  private _dragFromIndex: number | null = null;

  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // FIX #2: activate keyboard shortcuts once the strip mounts
    this.keyboardService.init();
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

  /**
   * FIX #4: use mousedown (not auxclick) for middle-click.
   * auxclick fires AFTER mouseup and can be swallowed by the browser's
   * auto-scroll cursor that appears on middle-mousedown in some browsers.
   * mousedown fires immediately and is reliable across all browsers.
   */
  onMouseDown(event: MouseEvent, id: TabId): void {
    if (event.button === 1) {
      event.preventDefault(); // prevent browser auto-scroll cursor
      this.tabService.closeTab(id);
    }
  }

  onContextMenu(event: MouseEvent, tab: TabMeta): void {
    this._ctxTab.set(tab);
    // PrimeNG p-contextMenu opens via the directive binding
  }

  onWheelScroll(event: WheelEvent): void {
    event.preventDefault();
    this.scrollContainer.nativeElement.scrollLeft += event.deltaY * 0.6;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FIX #3: Overflow dropdown
  // ─────────────────────────────────────────────────────────────────────────

  toggleOverflow(event: MouseEvent): void {
    event.stopPropagation();
    this.overflowOpen.update(v => !v);
  }

  closeOverflow(): void {
    this.overflowOpen.set(false);
  }

  /** Close overflow dropdown when clicking outside it */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.overflowOpen()) return;
    const el = this.overflowRef?.nativeElement;
    if (el && !el.contains(event.target as Node)) {
      this.overflowOpen.set(false);
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
}
