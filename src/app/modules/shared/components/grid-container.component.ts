import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-grid-container',
  standalone: true,
  imports: [],
  template: `
    <div class="grid-page-layout">
    
      <header class="grid-page-header">
        <div class="header-left">
          <h1 class="page-title">{{ title }}</h1>
          @if (subtitle) {
            <p class="page-subtitle">{{ subtitle }}</p>
          }
        </div>
    
        <div class="header-actions">
          <ng-content select="[header-actions]"></ng-content>
        </div>
      </header>
    
      <section class="grid-filter-bar">
        <ng-content select="[filters]"></ng-content>
      </section>
    
      <div class="grid-body-wrapper">
        <ng-content select="[grid-content]"></ng-content>
      </div>
    
    </div>
    `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      overflow: hidden; /* Essential for internal scrolling */
    }
  `]
})
export class GridContainerComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
}