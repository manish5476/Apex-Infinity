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
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 font-sans">
      
      <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Pages</h1>
          <p class="text-slate-500 mt-1 text-sm">
            Manage your storefront landing pages.
          </p>
        </div>

        <button
          type="button"
          (click)="openCreateModal()"
          class="group relative inline-flex items-center justify-center px-6 py-3 font-bold text-white transition-all duration-200 bg-slate-900 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5">
          <i class="fas fa-plus mr-2"></i> Create New Page
        </button>
      </header>

      @if (isLoading()) {
        <div class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      } @else {

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          <button (click)="openCreateModal()" class="group relative flex flex-col items-center justify-center h-full min-h-[240px] rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-white hover:border-slate-400 hover:shadow-xl transition-all duration-300">
            <div class="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <i class="fas fa-plus text-2xl text-slate-400 group-hover:text-slate-900"></i>
            </div>
            <span class="font-bold text-slate-500 group-hover:text-slate-900">Create New Page</span>
          </button>

          @for (page of pages(); track page._id) {
            <div class="group relative flex flex-col justify-between bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:bg-white/80">
              
              <div class="absolute top-6 right-6">
                <span class="relative flex h-3 w-3">
                  <span *ngIf="page.isPublished" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3" [class.bg-green-500]="page.isPublished" [class.bg-amber-400]="!page.isPublished"></span>
                </span>
              </div>

              <div>
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-sm transition-colors"
                     [ngClass]="page.isHomepage ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'">
                  <i class="fas text-lg" [class]="page.isHomepage ? 'fa-home' : 'fa-layer-group'"></i>
                </div>

                <h3 class="text-xl font-bold text-slate-900 mb-1 line-clamp-1" [title]="page.name">{{ page.name }}</h3>
                
                <div class="flex items-center gap-2 mb-4">
                  <code class="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md truncate max-w-[150px]">/{{ page.slug }}</code>
                  <a (click)="viewLive(page.slug)" class="text-slate-400 hover:text-blue-600 cursor-pointer text-xs"><i class="fas fa-external-link-alt"></i></a>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-slate-100/50">
                <div class="flex justify-between items-center mb-4">
                   <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                     {{ page.isPublished ? 'Published' : 'Draft' }}
                   </span>
                   <span class="text-[10px] text-slate-400">{{ page.updatedAt | date:'MMM d' }}</span>
                </div>

                <div class="grid grid-cols-3 gap-2">
                  <a [routerLink]="[page._id, 'builder']" 
                     class="col-span-2 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                    <i class="fas fa-pen"></i> Builder
                  </a>

                  <div class="flex gap-1 justify-end">
                    <button (click)="togglePublish(page)" 
                            [title]="page.isPublished ? 'Unpublish' : 'Publish'"
                            class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm"
                            [class.text-green-600]="!page.isPublished"
                            [class.text-amber-500]="page.isPublished">
                       <i class="fas" [class]="page.isPublished ? 'fa-eye-slash' : 'fa-cloud-upload-alt'"></i>
                    </button>
                    <button (click)="deletePage(page._id)" 
                            title="Delete"
                            class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          }

          @if (pages().length === 0) {
            <div class="col-span-full flex flex-col items-center justify-center p-12 text-slate-400">
              <i class="fas fa-ghost text-4xl mb-4 opacity-50"></i>
              <p>No pages yet.</p>
            </div>
          }

        </div>
      }

      @if (showCreateModal()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-100 animate-scale-up">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-slate-900">New Page</h2>
              <button type="button" (click)="closeCreateModal()" class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <form [formGroup]="createForm" (ngSubmit)="createPage()">
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Page Name</label>
                  <input formControlName="name" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900" placeholder="e.g. Summer Sale" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">URL Slug</label>
                  <div class="relative">
                    <span class="absolute left-3 top-3 text-slate-400 font-mono text-sm">/</span>
                    <input formControlName="slug" class="w-full p-3 pl-6 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all font-mono text-sm text-slate-600" placeholder="summer-sale" />
                  </div>
                </div>
              </div>
              <div class="flex justify-end gap-3 mt-8">
                <button type="button" (click)="closeCreateModal()" class="px-5 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                <button type="submit" [disabled]="createForm.invalid || isSubmitting()" class="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 hover:shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none">
                  @if (isSubmitting()) { <i class="fas fa-spinner fa-spin mr-2"></i> }
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `
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

  openCreateModal() { this.showCreateModal.set(true); }
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

  viewLive(slug: string) {
    window.open(`/store/${this.currentOrgSlug}/${slug}`, '_blank', 'noopener');
  }

  togglePublish(page: any) {
    // Stop propagation to prevent card click if any
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
      error: (err) => alert(`Failed to ${action} page.`)
    });
  }

  deletePage(id: string) {
    if (!confirm('Are you sure you want to delete this page permanently?')) return;
    this.adminService.deletePage(id).subscribe({
      next: () => this.pages.update(currentPages => currentPages.filter(p => p._id !== id)),
      error: () => alert('Failed to delete page.')
    });
  }
}
