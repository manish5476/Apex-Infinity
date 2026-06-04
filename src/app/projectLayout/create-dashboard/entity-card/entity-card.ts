import { Component, Input } from '@angular/core';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-entity-card',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './entity-card.html',
  styleUrl: './entity-card.scss'
})
export class EntityCardComponent {
  @Input() title!: string;
  @Input() icon!: string;
  @Input() description!: string;
  @Input() createRoute?: string[];
  @Input() category?: string;
}
