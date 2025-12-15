import { Component, inject, computed, ElementRef, viewChild, signal, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { UserManagementService } from '../user-management.service';

// Define the structure for the user object for type safety (Ensure this matches your actual data structure)
interface User {_id: string;name: string;email: string;organizationId: string;isActive: boolean;createdAt: string;updatedAt: string;avatar?: string;preferences: { notifications: { email: boolean, sms: boolean, push: boolean }, theme: string, denseMode: boolean };branchId?: { _id: string; name: string; address: { street: string; city: string; state: string; zipCode: string; country: string } };role: { _id: string; name: string; permissions: string[] };
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent {
  private userService = inject(UserManagementService);
  fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  currentUser: WritableSignal<User | null> = signal(null);
  uploading = signal(false);
  uploadError = signal<string | null>(null);

  constructor() {
    toSignal(
      this.userService.getMe().pipe(
        map(response => response.data.user as User),
        catchError(err => {
          console.error('Failed to load profile', err);
          return of(null);
        })
      )
    );
    this.userService.getMe().pipe(
      map(response => response.data.user as User),
      catchError(err => of(null))
    ).subscribe(user => {
      if (user) {
        this.currentUser.set(user); // Initialize the writable signal
      }
    });
  }

  isActive = computed(() => this.currentUser()?.isActive ?? false);
  triggerFileInput(): void {
    this.fileInputRef()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      this.uploadError.set(file ? (file.type.startsWith('image/') ? 'File size exceeds 5MB limit.' : 'Only image files are allowed.') : null);
      return;
    }

    this.uploadError.set(null);
    this.uploading.set(true);

    const formData = new FormData();
    formData.append('photo', file);

    this.userService.uploadProfilePhoto(formData).pipe(
      map(response => response.data.user as User),
      catchError(err => {
        this.uploading.set(false);
        const errorMessage = err.error?.message || 'Upload failed due to a server error.';
        this.uploadError.set(errorMessage);
        return of(null);
      })
    ).subscribe({
      next: (updatedUser) => {
        this.uploading.set(false);
        if (updatedUser) {
          // 3. **The Fix:** Use .set() on the writable `currentUser` signal.
          this.currentUser.set(updatedUser);
        }
      },
      error: () => {
        this.uploading.set(false);
      }
    });
  }

  // --- Helper Methods (remains the same) ---
  getInitials(name: string): string {
    return name
      ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'U';
  }

  formatPermission(perm: string): string {
    return perm.replace(/_/g, ' ').toUpperCase();
  }
}