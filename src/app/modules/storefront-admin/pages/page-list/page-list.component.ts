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
                        class="action-btn"
                        [title]="page.isPublished ? 'Unpublish' : 'Publish'"
                        [class.text-green-600]="!page.isPublished"
                        [class.text-orange-500]="page.isPublished">
                        <i class="fas" [class]="page.isPublished ? 'fa-eye-slash' : 'fa-cloud-upload-alt'"></i>
                      </button>

                      <a
                      [routerLink]="[page._id, 'builder']" 
                        type="button"
                        class="action-btn text-blue-500 hover:bg-blue-50"
                        title="Edit Page">
                        <i class="fas fa-pen"></i>
                      </a>

                      <button
                        type="button"
                        (click)="viewLive(page.slug)"
                        class="action-btn text-gray-500 hover:bg-gray-100"
                        title="View Live">
                        <i class="fas fa-external-link-alt"></i>
                      </button>

                      <button
                        type="button"
                        (click)="deletePage(page._id)"
                        class="action-btn text-red-500 hover:bg-red-50"
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
  `,
  styles: [`
    .action-btn {
      @apply w-8 h-8 flex items-center justify-center rounded transition-colors text-sm;
    }
  `]
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

  // ✅ ADDED: Publish / Unpublish Logic
  togglePublish(page: any) {
    const action = page.isPublished ? 'unpublish' : 'publish';
    if (!confirm(`Are you sure you want to ${action} "${page.name}"?`)) return;

    const request$ = page.isPublished 
      ? this.adminService.unpublishPage(page._id)
      : this.adminService.publishPage(page._id);

    request$.subscribe({
      next: () => {
        // Optimistic update for better UX (instant switch)
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

  // ✅ ADDED: Delete Logic
  deletePage(id: string) {
    if (!confirm('Are you sure you want to delete this page permanently? This action cannot be undone.')) return;

    this.adminService.deletePage(id).subscribe({
      next: () => {
        // Remove from list immediately
        this.pages.update(currentPages => currentPages.filter(p => p._id !== id));
      },
      error: (err) => {
        console.error(err);
        alert('Failed to delete page. It might be in use.');
      }
    });
  }
}
// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router, RouterModule } from '@angular/router';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';

// @Component({
//   selector: 'app-page-list',
//   standalone: true,
//   imports: [CommonModule, RouterModule, ReactiveFormsModule],
//   template: `
//     <div class="min-h-screen bg-gray-50 p-8 font-sans">
//       <header class="flex justify-between items-center mb-8">
//         <div>
//           <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Storefront Pages</h1>
//           <p class="text-gray-500 mt-1">
//             Manage your landing pages and marketing campaigns
//           </p>
//         </div>

//         <button
//           type="button"
//           (click)="openCreateModal()"
//           class="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium">
//           <i class="fas fa-plus"></i>
//           Create New Page
//         </button>
//       </header>

//       <!-- TABLE -->
//       <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

//         @if (isLoading()) {
//           <div class="p-12 flex justify-center">
//             <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
//           </div>
//         } @else {

//           <table class="w-full text-left border-collapse">
//             <thead>
//               <tr class="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
//                 <th class="p-5">Page Name</th>
//                 <th class="p-5">Public URL</th>
//                 <th class="p-5">Status</th>
//                 <th class="p-5">Last Updated</th>
//                 <th class="p-5 text-right">Actions</th>
//               </tr>
//             </thead>

//             <tbody class="divide-y divide-gray-100">
//               @for (page of pages(); track page._id) {
//                 <tr class="hover:bg-gray-50 transition-colors">

//                   <!-- NAME -->
//                   <td class="p-5">
//                     <div class="flex items-center gap-3">
//                       <div class="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
//                         <i class="fas" [class]="page.isHomepage ? 'fa-home' : 'fa-file-alt'"></i>
//                       </div>
//                       <div>
//                         <div class="font-semibold text-gray-900">{{ page.name }}</div>
//                         @if (page.isHomepage) {
//                           <span class="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
//                             Homepage
//                           </span>
//                         }
//                       </div>
//                     </div>
//                   </td>

//                   <!-- URL -->
//                   <td class="p-5">
//                     <code class="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
//                       /store/{{ page.slug }}
//                     </code>
//                   </td>

//                   <!-- STATUS -->
//                   <td class="p-5">
//                     <span
//                       class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
//                       [class.bg-green-100]="page.isPublished"
//                       [class.text-green-800]="page.isPublished"
//                       [class.bg-yellow-100]="!page.isPublished"
//                       [class.text-yellow-800]="!page.isPublished">
//                       <span
//                         class="w-2 h-2 rounded-full mr-1.5"
//                         [class.bg-green-400]="page.isPublished"
//                         [class.bg-yellow-400]="!page.isPublished">
//                       </span>
//                       {{ page.isPublished ? 'Published' : 'Draft' }}
//                     </span>
//                   </td>

//                   <!-- DATE -->
//                   <td class="p-5 text-gray-500 text-sm">
//                     {{ page.updatedAt | date:'mediumDate' }}
//                   </td>

//                   <!-- ACTIONS -->
//                   <td class="p-5 text-right">
//                     <div class="flex justify-end gap-2">

//                       <!-- (click)="editPage(page._id)" -->
//                       <a
//                       [routerLink]="[page._id, 'builder']" 
//                         type="button"
//                         class="action-btn action-edit"
//                         title="Edit Page">
//                         <i class="fas fa-pen"></i>
//                         <span>Edit</span>
//                       </a>

//                       <button
//                         type="button"
//                         (click)="viewLive(page.slug)"
//                         class="action-btn action-view"
//                         title="View Live">
//                         <i class="fas fa-external-link-alt"></i>
//                       </button>

//                       <button
//                         type="button"
//                         (click)="deletePage(page._id)"
//                         class="action-btn action-delete"
//                         title="Delete Page">
//                         <i class="fas fa-trash"></i>
//                       </button>

//                     </div>
//                   </td>
//                 </tr>
//               }

//               @if (pages().length === 0) {
//                 <tr>
//                   <td colspan="5" class="p-12 text-center text-gray-500">
//                     <p class="text-lg font-semibold text-gray-900 mb-2">
//                       No pages found
//                     </p>
//                     <button
//                       type="button"
//                       (click)="openCreateModal()"
//                       class="text-primary-600 font-medium hover:underline">
//                       Create your first page
//                     </button>
//                   </td>
//                 </tr>
//               }
//             </tbody>
//           </table>
//         }
//       </div>

//       <!-- CREATE MODAL -->
//       @if (showCreateModal()) {
//         <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div class="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">

//             <div class="flex justify-between items-center mb-6">
//               <h2 class="text-2xl font-bold text-gray-900">Create New Page</h2>
//               <button type="button" (click)="closeCreateModal()" class="text-gray-400 hover:text-gray-600">
//                 <i class="fas fa-times"></i>
//               </button>
//             </div>

//             <form [formGroup]="createForm" (ngSubmit)="createPage()">
//               <div class="space-y-4">
//                 <input formControlName="name" placeholder="Page name" class="input" />
//                 <input formControlName="slug" placeholder="URL slug" class="input" />
//               </div>

//               <div class="flex justify-end gap-3 mt-6">
//                 <button type="button" (click)="closeCreateModal()" class="btn-secondary">Cancel</button>
//                 <button type="submit" [disabled]="createForm.invalid || isSubmitting()" class="btn-primary">
//                   @if (isSubmitting()) { <i class="fas fa-spinner fa-spin mr-2"></i> }
//                   Create
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       }
//     </div>
//   `
// })
// export class PageListComponent implements OnInit {

//   private adminService = inject(StorefrontAdminService);
//   private fb = inject(FormBuilder);
//   private router = inject(Router);

//   pages = signal<any[]>([]);
//   isLoading = signal(true);
//   isSubmitting = signal(false);
//   showCreateModal = signal(false);

//   currentOrgSlug = 'shivam';

//   createForm = this.fb.group({
//     name: ['', Validators.required],
//     slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]]
//   });

//   ngOnInit() {
//     this.loadPages();

//     this.createForm.get('name')?.valueChanges.subscribe(name => {
//       if (name && !this.createForm.get('slug')?.dirty) {
//         this.createForm.get('slug')?.setValue(
//           name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
//         );
//       }
//     });
//   }

//   loadPages() {
//     this.isLoading.set(true);
//     this.adminService.getPages().subscribe({
//       next: res => {
//         this.pages.set(res.pages);
//         this.isLoading.set(false);
//       },
//       error: () => this.isLoading.set(false)
//     });
//   }

//   openCreateModal() {
//     this.showCreateModal.set(true);
//   }

//   closeCreateModal() {
//     this.showCreateModal.set(false);
//     this.createForm.reset();
//   }

//   createPage() {
//     if (!this.createForm.valid) return;

//     this.isSubmitting.set(true);
//     this.adminService.createPage(this.createForm.value).subscribe({
//       next: () => {
//         this.closeCreateModal();
//         this.loadPages();
//         this.isSubmitting.set(false);
//       },
//       error: () => this.isSubmitting.set(false)
//     });
//   }

//   editPage(id: string) {
//     this.router.navigate([id, 'builder']);
//   }

//   viewLive(slug: string) {
//     window.open(`/store/${this.currentOrgSlug}/${slug}`, '_blank', 'noopener');
//   }

//   deletePage(id: string) {
//     if (!confirm('Delete this page permanently?')) return;

//     this.adminService.deletePage(id).subscribe({
//       next: () => this.loadPages()
//     });
//   }
// }


// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';
// // Assuming you have an AuthService or similar to get the Org details. 
// // If not, we can fetch it from the admin service.

// @Component({
//   selector: 'app-page-list',
//   standalone: true,
//   imports: [CommonModule, RouterModule, ReactiveFormsModule],
//   template: `
//     <div class="min-h-screen bg-gray-50 p-8 font-sans">
      
//       <header class="flex justify-between items-center mb-8">
//         <div>
//           <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Storefront Pages</h1>
//           <p class="text-gray-500 mt-1">Manage your landing pages and marketing campaigns</p>
//         </div>
//         <button (click)="openCreateModal()" 
//                 class="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium cursor-pointer">
//           <i class="fas fa-plus"></i> Create New Page
//         </button>
//       </header>

//       <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
//         @if (isLoading()) {
//           <div class="p-12 flex justify-center">
//             <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
//           </div>
//         } @else {
//           <table class="w-full text-left border-collapse">
//             <thead>
//               <tr class="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
//                 <th class="p-5">Page Name</th>
//                 <th class="p-5">Public URL</th>
//                 <th class="p-5">Status</th>
//                 <th class="p-5">Last Updated</th>
//                 <th class="p-5 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody class="divide-y divide-gray-100">
//               @for (page of pages(); track page._id) {
//                 <tr class="group hover:bg-gray-50 transition-colors">
//                   <td class="p-5">
//                     <div class="flex items-center gap-3">
//                       <div class="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
//                         <i class="fas" [class]="page.isHomepage ? 'fa-home' : 'fa-file-alt'"></i>
//                       </div>
//                       <div>
//                         <div class="font-semibold text-gray-900">{{ page.name }}</div>
//                         @if (page.isHomepage) {
//                           <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
//                             Homepage
//                           </span>
//                         }
//                       </div>
//                     </div>
//                   </td>
                  
//                   <td class="p-5">
//                     <code class="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">/store/{{ page.slug }}</code>
//                   </td>
                  
//                   <td class="p-5">
//                     <span [class]="'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + 
//                       (page.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')">
//                       <span [class]="'w-2 h-2 rounded-full mr-1.5 ' + (page.isPublished ? 'bg-green-400' : 'bg-yellow-400')"></span>
//                       {{ page.isPublished ? 'Published' : 'Draft' }}
//                     </span>
//                   </td>

//                   <td class="p-5 text-gray-500 text-sm">
//                     {{ page.updatedAt | date:'mediumDate' }}
//                   </td>
                  
//                   <td class="p-5 text-right">
//                     <div class="flex justify-end gap-2">
                      
//                       <a [routerLink]="[page._id, 'builder']" 
//                          class="text-gray-600 hover:text-primary-600 p-2 hover:bg-primary-50 rounded-lg transition-colors border border-gray-200"
//                          title="Edit Design">
//                         <i class="fas fa-pen"></i> Edit
//                       </a>

//                       <a [href]="getLiveUrl(page.slug)" target="_blank"
//                          class="text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
//                          title="View Live">
//                         <i class="fas fa-external-link-alt"></i>
//                       </a>

//                       <button (click)="deletePage(page._id)"
//                               class="text-gray-600 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
//                               title="Delete">
//                         <i class="fas fa-trash"></i>
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               }
//               @if (pages().length === 0) {
//                 <tr>
//                   <td colspan="5" class="p-12 text-center text-gray-500">
//                     <div class="mb-4 text-gray-300"><i class="fas fa-layer-group text-6xl"></i></div>
//                     <p class="text-lg font-medium text-gray-900">No pages found</p>
//                     <p class="mb-6">Get started by creating your first landing page.</p>
//                     <button (click)="openCreateModal()" class="text-primary-600 font-medium hover:underline">
//                       Create Page
//                     </button>
//                   </td>
//                 </tr>
//               }
//             </tbody>
//           </table>
//         }
//       </div>

//       @if (showCreateModal()) {
//         <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div class="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100">
//             <div class="flex justify-between items-center mb-6">
//               <h2 class="text-2xl font-bold text-gray-900">Create New Page</h2>
//               <button (click)="showCreateModal.set(false)" class="text-gray-400 hover:text-gray-600">
//                 <i class="fas fa-times text-xl"></i>
//               </button>
//             </div>
            
//             <form [formGroup]="createForm" (ngSubmit)="createPage()">
//               <div class="space-y-5">
//                 <div>
//                   <label class="block text-sm font-semibold text-gray-700 mb-1">Page Name</label>
//                   <input formControlName="name" type="text" 
//                          class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" 
//                          placeholder="e.g. Summer Sale 2024">
//                 </div>
//                 <div>
//                   <label class="block text-sm font-semibold text-gray-700 mb-1">URL Slug</label>
//                   <div class="flex items-center">
//                     <span class="bg-gray-100 border border-r-0 border-gray-300 text-gray-500 rounded-l-lg px-3 py-3 text-sm">/store/</span>
//                     <input formControlName="slug" type="text" 
//                            class="w-full border border-gray-300 rounded-r-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" 
//                            placeholder="summer-sale">
//                   </div>
//                   <p class="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and hyphens.</p>
//                 </div>
//               </div>
              
//               <div class="flex justify-end gap-3 mt-8">
//                 <button type="button" (click)="showCreateModal.set(false)" 
//                         class="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
//                   Cancel
//                 </button>
//                 <button type="submit" [disabled]="createForm.invalid || isSubmitting()" 
//                         class="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center">
//                   @if (isSubmitting()) { <i class="fas fa-spinner fa-spin mr-2"></i> }
//                   Create Page
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       }
//     </div>
//   `
// })
// export class PageListComponent implements OnInit {
//   private adminService = inject(StorefrontAdminService);
//   private fb = inject(FormBuilder);

//   pages = signal<any[]>([]);
//   showCreateModal = signal(false);
//   isLoading = signal(true);
//   isSubmitting = signal(false);
  
//   // Placeholder for Org Slug. In a real app, get this from AuthService.
//   currentOrgSlug = 'shivam'; 

//   createForm = this.fb.group({
//     name: ['', Validators.required],
//     slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]]
//   });

//   ngOnInit() {
//     this.loadPages();
    
//     // Optional: Auto-generate slug from name
//     this.createForm.get('name')?.valueChanges.subscribe(name => {
//       if (name && !this.createForm.get('slug')?.dirty) {
//         const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
//         this.createForm.get('slug')?.setValue(slug);
//       }
//     });
//   }

//   loadPages() {
//     this.isLoading.set(true);
//     this.adminService.getPages().subscribe({
//       next: (res) => {
//         this.pages.set(res.pages);
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error('Error loading pages', err);
//         this.isLoading.set(false);
//       }
//     });
//   }

//   openCreateModal() {
//     this.showCreateModal.set(true);
//   }

//   createPage() {
//     if (this.createForm.valid) {
//       this.isSubmitting.set(true);
//       this.adminService.createPage(this.createForm.value).subscribe({
//         next: () => {
//           this.showCreateModal.set(false);
//           this.createForm.reset();
//           this.loadPages();
//           this.isSubmitting.set(false);
//         },
//         error: (err) => {
//           alert(err.error?.message || 'Failed to create page');
//           this.isSubmitting.set(false);
//         }
//       });
//     }
//   }

//   deletePage(id: string) {
//     if(confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
//       this.adminService.deletePage(id).subscribe({
//         next: () => this.loadPages(),
//         error: (err) => alert('Failed to delete page')
//       });
//     }
//   }

//   getLiveUrl(slug: string): string {
//     // Dynamically builds the URL based on the browser's current port or env
//     // Assuming /store/:orgSlug/:pageSlug
//     return `/store/${this.currentOrgSlug}/${slug}`;
//   }
// }

// // import { Component, OnInit, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { RouterModule } from '@angular/router';
// // import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// // import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';

// // @Component({
// //   selector: 'app-page-list',
// //   standalone: true,
// //   imports: [CommonModule, RouterModule, ReactiveFormsModule],
// //   template: `
// //   <div class="min-h-screen p-8 font-sans ui-bg-app">
    
// //     <!-- Header -->
// //     <header class="flex justify-between items-center mb-8">
// //       <div>
// //         <h1 class="text-3xl font-bold tracking-tight ui-text">
// //           Storefront Pages
// //         </h1>
// //         <p class="mt-1 ui-text-muted">
// //           Manage your landing pages and marketing campaigns
// //         </p>
// //       </div>

// //       <button
// //         (click)="showCreateModal.set(true)"
// //         class="ui-btn ui-btn-primary px-5 py-2.5 flex items-center gap-2">
// //         <i class="fas fa-plus"></i>
// //         Create New Page
// //       </button>
// //     </header>

// //     <!-- Table Card -->
// //     <div class="ui-card ui-shadow-sm ui-border overflow-hidden">

// //       @if (isLoading()) {
// //         <div class="p-12 flex justify-center">
// //           <div class="ui-spinner"></div>
// //         </div>
// //       } @else {

// //         <table class="w-full text-left border-collapse">
// //           <thead>
// //             <tr class="ui-bg-subtle ui-border-b text-xs uppercase tracking-wider font-semibold ui-text-muted">
// //               <th class="p-5">Page Name</th>
// //               <th class="p-5">Public URL</th>
// //               <th class="p-5">Status</th>
// //               <th class="p-5">Last Updated</th>
// //               <th class="p-5 text-right">Actions</th>
// //             </tr>
// //           </thead>

// //           <tbody class="divide-y ui-divide">
// //             @for (page of pages(); track page._id) {
// //               <tr class="group ui-hover-row transition-colors">

// //                 <!-- Page Name -->
// //                 <td class="p-5">
// //                   <div class="flex items-center gap-3">
// //                     <div class="h-10 w-10 rounded-lg ui-bg-muted ui-text-accent flex items-center justify-center">
// //                       <i class="fas" [class]="page.isHomepage ? 'fa-home' : 'fa-file-alt'"></i>
// //                     </div>

// //                     <div>
// //                       <div class="font-semibold ui-text">
// //                         {{ page.name }}
// //                       </div>

// //                       @if (page.isHomepage) {
// //                         <span class="ui-badge ui-badge-info mt-1">
// //                           Homepage
// //                         </span>
// //                       }
// //                     </div>
// //                   </div>
// //                 </td>

// //                 <!-- URL -->
// //                 <td class="p-5">
// //                   <code class="ui-code">
// //                     /store/{{ page.slug }}
// //                   </code>
// //                 </td>

// //                 <!-- Status -->
// //                 <td class="p-5">
// //                   <span
// //                     class="ui-badge"
// //                     [class.ui-badge-success]="page.isPublished"
// //                     [class.ui-badge-warning]="!page.isPublished">

// //                     <span
// //                       class="ui-badge-dot"
// //                       [class.ui-dot-success]="page.isPublished"
// //                       [class.ui-dot-warning]="!page.isPublished">
// //                     </span>

// //                     {{ page.isPublished ? 'Published' : 'Draft' }}
// //                   </span>
// //                 </td>

// //                 <!-- Date -->
// //                 <td class="p-5 text-sm ui-text-muted">
// //                   {{ page.updatedAt | date:'mediumDate' }}
// //                 </td>

// //                 <!-- Actions -->
// //                 <td class="p-5 text-right">
// //                   <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
// //                     <a
// //                       [routerLink]="[page._id, 'builder']"
// //                       class="ui-icon-btn"
// //                       title="Edit Design">
// //                       <i class="fas fa-pen"></i>
// //                     </a>

// //                     <a
// //                       [href]="'/store/YOUR_ORG_SLUG/' + page.slug"
// //                       target="_blank"
// //                       class="ui-icon-btn ui-icon-btn-info"
// //                       title="View Live">
// //                       <i class="fas fa-external-link-alt"></i>
// //                     </a>

// //                     <button
// //                       (click)="deletePage(page._id)"
// //                       class="ui-icon-btn ui-icon-btn-danger"
// //                       title="Delete">
// //                       <i class="fas fa-trash"></i>
// //                     </button>
// //                   </div>
// //                 </td>

// //               </tr>
// //             }

// //             @if (pages().length === 0) {
// //               <tr>
// //                 <td colspan="5" class="p-12 text-center ui-text-muted">
// //                   <div class="mb-4 ui-text-subtle">
// //                     <i class="fas fa-layer-group text-6xl"></i>
// //                   </div>
// //                   <p class="text-lg font-medium ui-text">
// //                     No pages found
// //                   </p>
// //                   <p class="mb-6">
// //                     Get started by creating your first landing page.
// //                   </p>
// //                   <button
// //                     (click)="showCreateModal.set(true)"
// //                     class="ui-link">
// //                     Create Page
// //                   </button>
// //                 </td>
// //               </tr>
// //             }
// //           </tbody>
// //         </table>
// //       }
// //     </div>

// //     <!-- Create Modal -->
// //     @if (showCreateModal()) {
// //       <div class="fixed inset-0 ui-overlay flex items-center justify-center z-50 p-4">
// //         <div class="ui-modal w-full max-w-md">

// //           <div class="flex justify-between items-center mb-6">
// //             <h2 class="text-2xl font-bold ui-text">
// //               Create New Page
// //             </h2>
// //             <button
// //               (click)="showCreateModal.set(false)"
// //               class="ui-icon-btn">
// //               <i class="fas fa-times text-xl"></i>
// //             </button>
// //           </div>

// //           <form [formGroup]="createForm" (ngSubmit)="createPage()">
// //             <div class="space-y-5">

// //               <div>
// //                 <label class="ui-label">Page Name</label>
// //                 <input
// //                   formControlName="name"
// //                   type="text"
// //                   class="ui-input"
// //                   placeholder="e.g. Summer Sale 2024">
// //               </div>

// //               <div>
// //                 <label class="ui-label">URL Slug</label>
// //                 <div class="flex items-center">
// //                   <span class="ui-input-addon">/store/</span>
// //                   <input
// //                     formControlName="slug"
// //                     type="text"
// //                     class="ui-input ui-input-attached"
// //                     placeholder="summer-sale">
// //                 </div>
// //                 <p class="ui-help-text">
// //                   Only lowercase letters, numbers, and hyphens.
// //                 </p>
// //               </div>

// //             </div>

// //             <div class="flex justify-end gap-3 mt-8">
// //               <button
// //                 type="button"
// //                 (click)="showCreateModal.set(false)"
// //                 class="ui-btn ui-btn-secondary">
// //                 Cancel
// //               </button>

// //               <button
// //                 type="submit"
// //                 [disabled]="createForm.invalid || isSubmitting()"
// //                 class="ui-btn ui-btn-primary flex items-center">
// //                 @if (isSubmitting()) {
// //                   <i class="fas fa-spinner fa-spin mr-2"></i>
// //                 }
// //                 Create Page
// //               </button>
// //             </div>
// //           </form>

// //         </div>
// //       </div>
// //     }
// //   </div>
// // `
// // })
// // export class PageListComponent implements OnInit {
// //   private adminService = inject(StorefrontAdminService);
// //   private fb = inject(FormBuilder);

// //   pages = signal<any[]>([]);
// //   showCreateModal = signal(false);
// //   isLoading = signal(true);
// //   isSubmitting = signal(false);

// //   createForm = this.fb.group({
// //     name: ['', Validators.required],
// //     slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]]
// //   });

// //   ngOnInit() {
// //     this.loadPages();
// //   }

// //   loadPages() {
// //     this.isLoading.set(true);
// //     this.adminService.getPages().subscribe({
// //       next: (res) => {
// //         this.pages.set(res.pages);
// //         this.isLoading.set(false);
// //       },
// //       error: () => this.isLoading.set(false)
// //     });
// //   }

// //   createPage() {
// //     if (this.createForm.valid) {
// //       this.isSubmitting.set(true);
// //       this.adminService.createPage(this.createForm.value).subscribe({
// //         next: () => {
// //           this.showCreateModal.set(false);
// //           this.createForm.reset();
// //           this.loadPages();
// //           this.isSubmitting.set(false);
// //         },
// //         error: (err) => {
// //           alert(err.error?.message || 'Failed to create page');
// //           this.isSubmitting.set(false);
// //         }
// //       });
// //     }
// //   }

// //   deletePage(id: string) {
// //     if(confirm('Are you sure? This cannot be undone.')) {
// //       this.adminService.deletePage(id).subscribe(() => this.loadPages());
// //     }
// //   }
// // }
