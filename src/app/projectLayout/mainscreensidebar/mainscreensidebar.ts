
import { Component, ElementRef, inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LayoutService } from '../layout.service';
import { SIDEBAR_MENU, MenuItem } from './menu-items.constants';

@Component({
  selector: 'app-mainscreen-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mainscreensidebar.html',
  styleUrl: './mainscreensidebar.scss'
})
export class Mainscreensidebar implements OnInit, AfterViewInit {
  layout = inject(LayoutService);
  private router = inject(Router);
  
  @ViewChild('menuList') menuList!: ElementRef<HTMLElement>;

  menuItems: MenuItem[] = SIDEBAR_MENU;
  expandedItems: Record<string, boolean> = {};
  focusedIndex = -1;

  ngOnInit() {
    this.autoExpandActiveRoute();
  }

  ngAfterViewInit() {
    // Initial scroll to active link
    setTimeout(() => {
      const active = this.menuList.nativeElement.querySelector('.active-link');
      if (active) active.scrollIntoView({ block: 'nearest' });
    }, 300);
  }

  /* --- ACTIONS --- */
  toggleMenuItem(label: string) {
    if (!this.layout.isExpanded()) {
      this.layout.isHovered.set(true); // Expand sidebar if user clicks while collapsed
    }
    this.expandedItems[label] = !this.expandedItems[label];
  }

  getSubmenuHeight(item: MenuItem): string {
    if (!item.items || !this.expandedItems[item.label] || !this.layout.isExpanded()) {
      return '0px';
    }
    // Height of each item (34px) * count
    return `${item.items.length * 34}px`;
  }

  isParentActive(item: MenuItem): boolean {
    return !!item.items?.some(sub => 
      sub.routerLink && this.router.url.includes(sub.routerLink[0])
    );
  }

  private autoExpandActiveRoute() {
    this.menuItems.forEach(item => {
      if (item.items && this.isParentActive(item)) {
        this.expandedItems[item.label] = true;
      }
    });
  }

  /* --- ACCESSIBILITY / KEYBOARD --- */
  onKeyNavigate(event: KeyboardEvent) {
    const items = Array.from(this.menuList.nativeElement.querySelectorAll('.menu-title')) as HTMLElement[];
    
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusedIndex = (this.focusedIndex + 1) % items.length;
      items[this.focusedIndex].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusedIndex = (this.focusedIndex - 1 + items.length) % items.length;
      items[this.focusedIndex].focus();
    } else if (event.key === 'Enter' && this.focusedIndex !== -1) {
      items[this.focusedIndex].click();
    }
  }

  logout() {
    console.log('Logging out...');
  }
}

