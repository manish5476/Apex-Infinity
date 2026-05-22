import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerConfig } from '@core/models/storefront.model';

@Component({
  selector: 'app-divider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './divider.html',
  styles: [`
    :host { display: block; width: 100%; }
  `]
})
export class DividerComponent {
  @Input() config: DividerConfig = {
    style: 'solid',
    width: 'container',
    color: 'var(--glass-border)'
  };
}
