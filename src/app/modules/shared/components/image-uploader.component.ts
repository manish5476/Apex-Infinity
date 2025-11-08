// import { Component, EventEmitter, Output, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { finalize } from 'rxjs/operators';

// // --- PrimeNG Modules ---
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ToastModule } from 'primeng/toast';
// import { MessageService } from 'primeng/api';

// // --- Custom Services ---
// // import { ImageUploadService } from '../../core/services/image-upload.service';

// @Component({
//   selector: 'app-image-uploader',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ProgressSpinnerModule,
//     ToastModule
//   ],
//   providers: [MessageService],
//   template: `
//     <p-toast></p-toast>

//     <div class="uploader-container" (click)="fileInput.click()">
//       <input 
//         #fileInput 
//         type="file" 
//         accept="image/*" 
//         (change)="onFileSelected($event)" 
//         [disabled]="isUploading"
//         hidden>
      
//       <!-- Loading State -->
//       <div *ngIf="isUploading" class="loading-overlay">
//         <p-progressSpinner styleClass="w-8 h-8" strokeWidth="4"></p-progressSpinner>
//         <span>Uploading...</span>
//       </div>

//       <!-- Initial State -->
//       <div *ngIf="!previewUrl && !isUploading" class="initial-state">
//         <i class="pi pi-cloud-upload"></i>
//         <span>Click to Upload</span>
//         <small>Max 5MB</small>
//       </div>

//       <!-- Preview -->
//       <img *ngIf="previewUrl && !isUploading" [src]="previewUrl" alt="Image Preview" class="image-preview">
//     </div>
//   `,
//   styles: [`
//     :host { display: block; font-family: var(--font-body); }

//     .uploader-container {
//       position: relative;
//       width: 100%;
//       aspect-ratio: 4 / 3; /* Slimmer ratio */
//       max-width: 250px; /* Smaller width */
//       border: 1.5px dashed var(--theme-border-secondary);
//       border-radius: 0.5rem;
//       background-color: var(--theme-bg-secondary);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       cursor: pointer;
//       overflow: hidden;
//       transition: background-color 0.2s ease, border-color 0.2s ease;
//     }

//     .uploader-container:hover {
//       border-color: var(--theme-accent-primary);
//       background-color: var(--theme-bg-ternary);
//     }

//     .initial-state {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       color: var(--theme-text-secondary);
//       text-align: center;
//       gap: 0.25rem;
//     }

//     .initial-state .pi { font-size: 2rem; }
//     .initial-state span { font-weight: 500; font-size: 0.9rem; }
//     .initial-state small { font-size: 0.7rem; }

//     .image-preview { width: 100%; height: 100%; object-fit: cover; }

//     .loading-overlay {
//       position: absolute;
//       top: 0; left: 0; right: 0; bottom: 0;
//       background-color: rgba(0, 0, 0, 0.35);
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       z-index: 10;
//       color: white;
//       gap: 0.5rem;
//     }
//   `]
// })
// export class ImageUploaderComponent {
//   private imageUploadService = inject(ImageUploadService);
//   private messageService = inject(MessageService);

//   @Output() uploaded = new EventEmitter<string>();

//   isUploading = false;
//   previewUrl: string | ArrayBuffer | null = null;

//   onFileSelected(event: Event): void {
//     const input = event.target as HTMLInputElement;
//     if (!input.files || input.files.length === 0) return;
    
//     const file = input.files[0];

//     if (!file.type.startsWith('image/')) {
//       this.messageService.add({ severity: 'error', summary: 'Invalid File', detail: 'Select an image file.' });
//       return;
//     }
//     if (file.size > 5 * 1024 * 1024) {
//       this.messageService.add({ severity: 'error', summary: 'File Too Large', detail: 'Max 5MB allowed.' });
//       return;
//     }

//     const reader = new FileReader();
//     reader.onload = () => this.previewUrl = reader.result;
//     reader.readAsDataURL(file);

//     this.uploadFile(file);
//   }

//   private uploadFile(file: File): void {
//     this.isUploading = true;

//     this.imageUploadService.uploadImage(file).pipe(
//       finalize(() => this.isUploading = false)
//     ).subscribe({
//       next: (res) => {
//         const url = res?.data?.imageUrl;
//         if (url) {
//           this.previewUrl = url;
//           this.uploaded.emit(url);
//           this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Image uploaded!' });
//         } else {
//           this.previewUrl = null;
//           this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Invalid server response.' });
//         }
//       },
//       error: (err) => {
//         this.previewUrl = null;
//         this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.message || 'Upload error.' });
//       }
//     });
//   }
// }


// // import { Component, EventEmitter, Output, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { finalize } from 'rxjs/operators';

// // // --- PrimeNG Modules for UI ---
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { MessageService } from 'primeng/api';
// // import { ToastModule } from 'primeng/toast';

// // // --- Your Custom Services ---
// // import { ImageUploadService } from '../../core/services/image-upload.service';
// // @Component({
// //   selector: 'app-image-uploader',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     ProgressSpinnerModule,
// //     ToastModule
// //   ],
// //   providers: [MessageService],
// //   template: `
// //     <p-toast></p-toast>

// //     <div class="uploader-container" (click)="fileInput.click()">
      
// //       <input 
// //         #fileInput 
// //         type="file" 
// //         accept="image/*" 
// //         (change)="onFileSelected($event)" 
// //         [disabled]="isUploading"
// //         hidden>
      
// //       <div *ngIf="isUploading" class="loading-overlay">
// //         <p-progressSpinner styleClass="w-12 h-12" strokeWidth="6"></p-progressSpinner>
// //         <span>Uploading...</span>
// //       </div>
      
// //       <div *ngIf="!previewUrl && !isUploading" class="initial-state">
// //         <i class="pi pi-cloud-upload"></i>
// //         <span>Click to Upload Image</span>
// //         <small>Max file size: 5MB</small>
// //       </div>
      
// //       <img 
// //         *ngIf="previewUrl && !isUploading" 
// //         [src]="previewUrl" 
// //         alt="Image Preview" 
// //         class="image-preview">
// //     </div>
// //   `,
// //   styles: [`
// //     :host {
// //       display: block;
// //       font-family: var(--font-body);
// //     }

// //     .uploader-container {
// //       position: relative;
// //       width: 100%;
// //       aspect-ratio: 16 / 9;
// //       max-width: 400px;
// //       border: 2px dashed var(--theme-border-secondary);
// //       border-radius: 0.75rem;
// //       background-color: var(--theme-bg-secondary);
// //       display: flex;
// //       align-items: center;
// //       justify-content: center;
// //       cursor: pointer;
// //       overflow: hidden;
// //       transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
// //     }

// //     .uploader-container:hover {
// //       border-color: var(--theme-accent-primary);
// //       background-color: var(--theme-bg-ternary);
// //     }

// //     .initial-state {
// //       display: flex;
// //       flex-direction: column;
// //       align-items: center;
// //       justify-content: center;
// //       color: var(--theme-text-secondary);
// //       text-align: center;
// //     }

// //     .initial-state .pi {
// //       font-size: 3rem;
// //       margin-bottom: 0.75rem;
// //     }

// //     .initial-state span {
// //       font-weight: 600;
// //       font-size: 1rem;
// //     }

// //     .initial-state small {
// //       font-size: 0.8rem;
// //       margin-top: 0.25rem;
// //     }

// //     .image-preview {
// //       width: 100%;
// //       height: 100%;
// //       object-fit: cover;
// //     }

// //     .loading-overlay {
// //       position: absolute;
// //       top: 0;
// //       left: 0;
// //       right: 0;
// //       bottom: 0;
// //       background-color: rgba(0, 0, 0, 0.5);
// //       display: flex;
// //       flex-direction: column;
// //       align-items: center;
// //       justify-content: center;
// //       z-index: 10;
// //       color: white;
// //       gap: 1rem;
// //     }
// //   `]
// // })
// // export class ImageUploaderComponent {
// //   // --- Dependencies ---
// //   private imageUploadService = inject(ImageUploadService);
// //   private messageService = inject(MessageService);

// //   // --- Outputs ---
// //   @Output() uploaded = new EventEmitter<string>();

// //   // --- Component State ---
// //   isUploading = false;
// //   previewUrl: string | ArrayBuffer | null = null;

// //   onFileSelected(event: Event): void {
// //     const input = event.target as HTMLInputElement;
// //     if (!input.files || input.files.length === 0) return;
    
// //     const file = input.files[0];

// //     if (!file.type.startsWith('image/')) {
// //       this.messageService.add({ severity: 'error', summary: 'Invalid File', detail: 'Please select an image file.' });
// //       return;
// //     }
// //     if (file.size > 5 * 1024 * 1024) { // 5MB limit
// //       this.messageService.add({ severity: 'error', summary: 'File Too Large', detail: 'Image size cannot exceed 5MB.' });
// //       return;
// //     }

// //     const reader = new FileReader();
// //     reader.onload = () => {
// //       this.previewUrl = reader.result;
// //     };
// //     reader.readAsDataURL(file);

// //     this.uploadFile(file);
// //   }
  
// //   // ====================================================================
// //   // === THIS IS THE CORRECTED METHOD ===
// //   // ====================================================================
// //   private uploadFile(file: File): void {
// //     this.isUploading = true;

// //     this.imageUploadService.uploadImage(file).pipe(
// //       // The finalize operator ensures that isUploading is set to false
// //       // whether the upload succeeds or fails.
// //       finalize(() => {
// //         this.isUploading = false;
// //       })
// //     ).subscribe({
// //       next: (response) => {
// //         // --- Success Handler ---
// //         if (response && response.data && response.data.imageUrl) {
// //           const imageUrl = response.data.imageUrl;
// //           this.previewUrl = imageUrl; // Update preview to the final URL
// //           this.uploaded.emit(imageUrl); // Notify the parent component
// //           this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Image uploaded!' });
// //         } else {
// //           // Handle cases where the response format is unexpected
// //           this.previewUrl = null;
// //           this.messageService.add({ severity: 'error', summary: 'Upload Failed', detail: 'Invalid response from server.' });
// //         }
// //       },
// //       error: (err) => {
// //         // --- Error Handler ---
// //         this.previewUrl = null; // Clear preview on error
// //         this.messageService.add({ severity: 'error', summary: 'Upload Failed', detail: err.message || 'Could not upload image.' });
// //       }
// //     });
// //   }
// // }