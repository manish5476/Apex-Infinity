// src/app/modules/storefront-public/components/footer-simple/footer-simple.component.ts
import { Component, Input, inject, computed } from '@angular/core';

import { RouterModule } from '@angular/router';
import { StorefrontStateService } from '@core/services/storefront-state.service';

@Component({
  selector: 'app-footer-simple',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer-simple.component.html',
  styleUrls: ['./footer-simple.component.scss']
})
export class FooterSimpleComponent {
  @Input() config: any;
  @Input() organization: any;

  private stateService = inject(StorefrontStateService);

  /**
   * Resolved slug for router links.
   * Uses @Input organization first (set by the layout), falls back to state service.
   * ✅ FIX: No more fragile URL regex in ngOnInit.
   */
  slug = computed(() =>
    this.organization?.slug ?? this.stateService.organization()?.slug ?? ''
  );

  currentYear = new Date().getFullYear();
}
