import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';

@Component({
  selector: 'app-storefront-coming-soon',
  standalone: true,
  imports: [PageComponent, PageHeaderComponent, PageContentComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page>
      <app-page-header
        [title]="surfaceTitle()"
        subtitle="Storefront Administration"
        density="comfortable">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
            (click)="navigateBack()">
            <i class="pi pi-arrow-left"></i>
            <span>Back to Overview</span>
          </button>
        </div>
      </app-page-header>

      <app-page-content density="comfortable">
        <div class="max-w-xl mx-auto py-16">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm">
            <div class="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-5 text-2xl">
              <i class="pi pi-compass"></i>
            </div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 mb-4">
              <i class="pi pi-clock text-[10px]"></i> Under Development
            </div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {{ surfaceTitle() }}
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
              This storefront feature is currently planned on the platform roadmap. Full controls and configurations will be available in an upcoming release.
            </p>
            <div class="flex items-center justify-center gap-3">
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition"
                (click)="navigateBack()">
                Return to Overview
              </button>
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition"
                (click)="navigateToPages()">
                Manage Pages
              </button>
            </div>
          </div>
        </div>
      </app-page-content>
    </app-page>
  `
})
export class StorefrontComingSoonComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly surfaceTitle = computed(() => {
    return this.route.snapshot.data['title'] || 'Storefront Feature';
  });

  navigateBack(): void {
    this.router.navigate(['/storefront/overview']);
  }

  navigateToPages(): void {
    this.router.navigate(['/storefront/pages']);
  }
}
