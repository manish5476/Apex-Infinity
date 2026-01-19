import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';

@Component({
  selector: 'app-page-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-8 font-sans">
      <header class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Storefront Pages</h1>
          <p class="text-gray-500 mt-1">
            Manage your landing pages and marketing campaigns
          </p>
        </div>

        <button
          type="button"
          (click)="openCreateModal()"
          class="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium">
          <i class="fas fa-plus"></i>
          Create New Page
        </button>
      </header>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        @if (isLoading()) {
          <div class="p-12 flex justify-center">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        } @else {

          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th class="p-5">Page Name</th>
                <th class="p-5">Public URL</th>
                <th class="p-5">Status</th>
                <th class="p-5">Last Updated</th>
                <th class="p-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-100">
              @for (page of pages(); track page._id) {
                <tr class="hover:bg-gray-50 transition-colors">

                  <td class="p-5">
                    <div class="flex items-center gap-3">
                      <div class="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                        <i class="fas" [class]="page.isHomepage ? 'fa-home' : 'fa-file-alt'"></i>
                      </div>
                      <div>
                        <div class="font-semibold text-gray-900">{{ page.name }}</div>
                        @if (page.isHomepage) {
                          <span class="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            Homepage
                          </span>
                        }
                      </div>
                    </div>
                  </td>

                  <td class="p-5">
                    <code class="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
                      /store/{{ page.slug }}
                    </code>
                  </td>

                  <td class="p-5">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [class.bg-green-100]="page.isPublished"
                      [class.text-green-800]="page.isPublished"
                      [class.bg-yellow-100]="!page.isPublished"
                      [class.text-yellow-800]="!page.isPublished">
                      <span
                        class="w-2 h-2 rounded-full mr-1.5"
                        [class.bg-green-400]="page.isPublished"
                        [class.bg-yellow-400]="!page.isPublished">
                      </span>
                      {{ page.isPublished ? 'Published' : 'Draft' }}
                    </span>
                  </td>

                  <td class="p-5 text-gray-500 text-sm">
                    {{ page.updatedAt | date:'mediumDate' }}
                  </td>

                  <td class="p-5 text-right">
                    <div class="flex justify-end gap-2">

                      <button 
                        type="button"
                        (click)="togglePublish(page)"
                        class="w-8 h-8 flex items-center justify-center rounded transition-colors text-sm"
                        [title]="page.isPublished ? 'Unpublish' : 'Publish'"
                        [class.text-green-600]="!page.isPublished"
                        [class.text-orange-500]="page.isPublished">
                        <i class="fas" [class]="page.isPublished ? 'fa-eye-slash' : 'fa-cloud-upload-alt'"></i>
                      </button>

                      <a
                        [routerLink]="[page._id, 'builder']" 
                        type="button"
                        class="w-8 h-8 flex items-center justify-center rounded transition-colors text-sm text-blue-500 hover:bg-blue-50"
                        title="Edit Page">
                        <i class="fas fa-pen"></i>
                      </a>

                      <button
                        type="button"
                        (click)="viewLive(page.slug)"
                        class="w-8 h-8 flex items-center justify-center rounded transition-colors text-sm text-gray-500 hover:bg-gray-100"
                        title="View Live">
                        <i class="fas fa-external-link-alt"></i>
                      </button>

                      <button
                        type="button"
                        (click)="deletePage(page._id)"
                        class="w-8 h-8 flex items-center justify-center rounded transition-colors text-sm text-red-500 hover:bg-red-50"
                        title="Delete Page">
                        <i class="fas fa-trash"></i>
                      </button>

                    </div>
                  </td>
                </tr>
              }

              @if (pages().length === 0) {
                <tr>
                  <td colspan="5" class="p-12 text-center text-gray-500">
                    <p class="text-lg font-semibold text-gray-900 mb-2">
                      No pages found
                    </p>
                    <button
                      type="button"
                      (click)="openCreateModal()"
                      class="text-primary-600 font-medium hover:underline">
                      Create your first page
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      @if (showCreateModal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-900">Create New Page</h2>
              <button type="button" (click)="closeCreateModal()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <form [formGroup]="createForm" (ngSubmit)="createPage()">
              <div class="space-y-4">
                <input formControlName="name" placeholder="Page name" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                <input formControlName="slug" placeholder="URL slug" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div class="flex justify-end gap-3 mt-6">
                <button type="button" (click)="closeCreateModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" [disabled]="createForm.invalid || isSubmitting()" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  @if (isSubmitting()) { <i class="fas fa-spinner fa-spin mr-2"></i> }
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
  // styles: []  <-- REMOVED THE STYLES BLOCK ENTIRELY TO FIX BUILD ERROR
})
export class PageListComponent implements OnInit {

  private adminService = inject(StorefrontAdminService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  pages = signal<any[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  showCreateModal = signal(false);

  currentOrgSlug = 'shivam';

  createForm = this.fb.group({
    name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]]
  });

  ngOnInit() {
    this.loadPages();

    // Auto-generate slug from name
    this.createForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.createForm.get('slug')?.dirty) {
        this.createForm.get('slug')?.setValue(
          name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        );
      }
    });
  }

  loadPages() {
    this.isLoading.set(true);
    this.adminService.getPages().subscribe({
      next: res => {
        this.pages.set(res.pages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateModal() {
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.createForm.reset();
  }

  createPage() {
    if (!this.createForm.valid) return;

    this.isSubmitting.set(true);
    this.adminService.createPage(this.createForm.value).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadPages();
        this.isSubmitting.set(false);
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  editPage(id: string) {
    this.router.navigate([id, 'builder']);
  }

  viewLive(slug: string) {
    window.open(`/store/${this.currentOrgSlug}/${slug}`, '_blank', 'noopener');
  }

  // Toggle Publish Logic
  togglePublish(page: any) {
    const action = page.isPublished ? 'unpublish' : 'publish';
    if (!confirm(`Are you sure you want to ${action} "${page.name}"?`)) return;

    const request$ = page.isPublished 
      ? this.adminService.unpublishPage(page._id)
      : this.adminService.publishPage(page._id);

    request$.subscribe({
      next: () => {
        this.pages.update(currentPages => 
          currentPages.map(p => 
            p._id === page._id ? { ...p, isPublished: !page.isPublished } : p
          )
        );
      },
      error: (err) => {
        console.error(err);
        alert(`Failed to ${action} page.`);
      }
    });
  }

  // Delete Logic
  deletePage(id: string) {
    if (!confirm('Are you sure you want to delete this page permanently? This action cannot be undone.')) return;

    this.adminService.deletePage(id).subscribe({
      next: () => {
        this.pages.update(currentPages => currentPages.filter(p => p._id !== id));
      },
      error: (err) => {
        console.error(err);
        alert('Failed to delete page. It might be in use.');
      }
    });
  }
}
