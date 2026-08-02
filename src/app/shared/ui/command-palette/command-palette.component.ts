import { 
  Component, 
  OnInit, 
  OnDestroy, 
  inject, 
  ElementRef, 
  signal,
  effect,
  ChangeDetectorRef,
  ViewEncapsulation,
  HostListener,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { HotkeyService } from '../../../core/services/hotkey.service';
import { GlobalSearchService } from '../../../core/services/global-search.service';
import { MenuBuilderService } from '../../../projectLayout/mainscreensidebar/menu-builder.service';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  icon?: string;
  route?: string;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DialogModule,
    InputTextModule
  ],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  encapsulation: ViewEncapsulation.None
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  public hotkeyService = inject(HotkeyService);
  private searchService = inject(GlobalSearchService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private menuBuilder = inject(MenuBuilderService);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('resultsList') resultsList!: ElementRef<HTMLDivElement>;

  searchQuery = signal<string>('');
  isSearching = signal<boolean>(false);
  results = signal<SearchResult[]>([]);
  selectedIndex = signal<number>(0);

  private querySubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Use an effect to focus input when dialog opens
  constructor() {
    effect(() => {
      const isOpen = this.hotkeyService.commandPaletteOpen();
      // Force change detection immediately when signal changes
      this.cdr.detectChanges(); 
      
      if (isOpen) {
        this.resetState();
        setTimeout(() => {
          if (this.searchInput?.nativeElement) {
            this.searchInput.nativeElement.focus();
          }
        }, 50); // slight delay for dialog to render
      }
    });
  }

  ngOnInit(): void {
    // Debounce search input
    this.querySubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  @HostListener('window:keydown.control.k', ['$event'])
  @HostListener('window:keydown.meta.k', ['$event'])
  onShortcut(event: Event) {
    event.preventDefault();
    this.hotkeyService.toggleCommandPalette();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDialogHide(): void {
    this.hotkeyService.closeCommandPalette();
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.selectedIndex.set(0);
    this.querySubject.next(query);
  }

  private resetState(): void {
    this.searchQuery.set('');
    this.results.set(this.getDefaultSuggestions());
    this.selectedIndex.set(0);
    this.isSearching.set(false);
  }

  private performSearch(query: string): void {
    if (!query || query.trim().length === 0) {
      this.results.set(this.getDefaultSuggestions());
      this.isSearching.set(false);
      return;
    }

    this.isSearching.set(true);
    
    // First, find local navigation matches
    const localMatches = this.getDefaultSuggestions().filter(
      r => r.title.toLowerCase().includes(query.toLowerCase()) || 
           (r.subtitle && r.subtitle.toLowerCase().includes(query.toLowerCase()))
    );

    // Call the actual global search service
    this.searchService.search(query).subscribe({
      next: (res: any) => {
        // Map the backend response to our unified SearchResult format
        const mappedResults: SearchResult[] = [];
        
        // Safety check for array response
        const data = res?.data || res || [];
        
        // This mapping might need adjustment based on the actual API structure
        if (Array.isArray(data)) {
           data.forEach(item => {
             mappedResults.push({
               id: item.id || Math.random().toString(),
               title: item.name || item.title || 'Unknown Result',
               subtitle: item.type || item.category || '',
               type: item.type || 'generic',
               icon: this.getIconForType(item.type),
               route: item.route || null
             });
           });
        }
        
        // Combine local navigation matches with backend results
        this.results.set([...localMatches, ...mappedResults]);
        this.isSearching.set(false);
        this.selectedIndex.set(0);
      },
      error: () => {
        this.isSearching.set(false);
        this.results.set(localMatches);
        this.selectedIndex.set(0);
      }
    });
  }

  private getIconForType(type: string): string {
    const map: Record<string, string> = {
      'customer': 'pi pi-users',
      'product': 'pi pi-box',
      'invoice': 'pi pi-file-invoice',
      'order': 'pi pi-shopping-cart'
    };
    return map[type?.toLowerCase()] || 'pi pi-search';
  }

  public getDefaultSuggestions(): SearchResult[] {
    const allLocal = this.menuBuilder.searchIndex();
    return allLocal.map((item, index) => ({
      id: `nav-${index}`,
      title: item.label,
      subtitle: item.breadcrumb || '',
      icon: item.icon || 'pi pi-file',
      route: typeof item.routerLink === 'string' ? item.routerLink : (item.routerLink as readonly string[])?.join('/') || '',
      type: 'navigation'
    }));
  }

  // --- Keyboard Navigation ---

  onKeyDown(event: KeyboardEvent): void {
    const r = this.results();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (r.length > 0) {
        this.selectedIndex.update(i => (i + 1) % r.length);
        this.scrollToSelected();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (r.length > 0) {
        this.selectedIndex.update(i => (i - 1 + r.length) % r.length);
        this.scrollToSelected();
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.selectResult(this.selectedIndex());
    }
    // Escape is naturally handled by p-dialog
  }

  onHoverRow(index: number): void {
    this.selectedIndex.set(index);
  }

  selectResult(index: number): void {
    const r = this.results();
    if (r[index]) {
      const selected = r[index];
      if (selected.route) {
        this.router.navigateByUrl(selected.route);
      } else {
        console.log('Selected item has no route:', selected);
      }
      this.hotkeyService.closeCommandPalette();
    }
  }

  private scrollToSelected(): void {
    // Ensure the selected item remains in the scroll view
    setTimeout(() => {
      if (!this.resultsList?.nativeElement) return;
      const listEl = this.resultsList.nativeElement;
      const selectedEl = listEl.children[this.selectedIndex()] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  }
}
