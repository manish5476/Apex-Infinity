import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpacerConfig } from '@core/models/storefront.model';

@Component({
  selector: 'app-spacer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spacer.html',
  styles: [`
    :host { display: block; width: 100%; }
  `]
})
export class SpacerComponent {
  @Input() config: SpacerConfig = {
    height: 64, // Default 64px
    hideOnMobile: false
  };
}
