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
// import { Component, Input, inject, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';

// @Component({
//   selector: 'app-footer-simple',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './footer-simple.component.html',
//   styleUrls: ['./footer-simple.component.scss']
// })
// export class FooterSimpleComponent implements OnInit {
//   @Input() config: any;
//   @Input() organization: any;

//   // We need the slug for the links to work
//   orgSlug: string = '';
//   private router = inject(Router);

//   ngOnInit() {
//     // Basic extraction of slug so links like "Shop" work
//     const match = this.router.url.match(/\/store\/([^\/]+)/);
//     if (match && match[1]) {
//       this.orgSlug = match[1];
//     }
//   }
// }
