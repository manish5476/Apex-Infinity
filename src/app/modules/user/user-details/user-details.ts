import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { catchError, finalize, map, of } from 'rxjs'; // 👈 Import RxJS operators

// Services
import { UserManagementService } from '../user-management.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TimelineModule } from 'primeng/timeline';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip'; // 👈 Added for hover hints
import { AppMessageService } from '../../../core/services/message.service';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/services/permission.service';


@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    CardModule, ButtonModule, TimelineModule, DialogModule,
    InputTextModule, TagModule, DividerModule, DatePipe,
    ConfirmDialogModule, ToastModule, SkeletonModule, TooltipModule,
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-details.html',
  styleUrl: './user-details.scss'
})

export class UserDetailsComponent implements OnInit {
  readonly PERMISSIONS = PERMISSIONS;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public userService = inject(UserManagementService);
  private permissionService = inject(PermissionService);
  private messageService = inject(AppMessageService); // Updated injection
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  readonly canManage = this.permissionService.can(this.PERMISSIONS.USER.MANAGE);
  userId: string = '';

  // Signals
  user = signal<any>(null);
  activities = signal<any[]>([]);
  uploading = signal(false);

  showPasswordDialog = false;
  isSubmitting = false;
  passwordForm!: FormGroup;

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';

    // Moved form initialization here for a cleaner lifecycle
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required]]
    });

    if (this.userId) {
      this.loadUserDetails();
      this.loadUserActivity();
    } else {
      this.messageService.showError('Invalid Route: User ID is missing.');
      this.router.navigate(['/user/list']);
    }
  }

  // --- Navigation ---
  onEditUser() {
    this.router.navigate(['/user/edit', this.userId]);
  }

  onBack() {
    this.router.navigate(['/user/list']);
  }

  // --- Data Loading ---
  loadUserDetails() {
    this.userService.getUser(this.userId).subscribe({
      next: (res: any) => {
        const userData = res.data?.data || res.data?.user;
        if (userData) {
          this.user.set(userData);
        }
      },
      error: (err) => {
        // Fallback error routing if the user is deleted or ID is invalid
        this.messageService.handleHttpError(err);
        this.router.navigate(['/user/list']);
      }
    });
  }

  loadUserActivity() {
    this.userService.getUserActivity(this.userId).subscribe({
      next: (res) => {
        const logs = res.data?.activities || res.data || [];
        this.activities.set(logs);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  // --- Image Upload Logic ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    // Reset input so same file can be selected again if needed
    input.value = '';

    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      this.messageService.showWarn('Invalid File: Only image formats are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      this.messageService.showWarn('File too large: Maximum allowed size is 5MB.');
      return;
    }

    this.uploading.set(true);
    const formData = new FormData();
    formData.append('photo', file);
    this.userService.uploadUserPhoto(this.userId, formData)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (response: any) => {
          const updatedUser = response.data?.user || response.data?.data;
          if (updatedUser) {
            this.user.set(updatedUser);
            this.messageService.showSuccess('Profile photo updated successfully.');
          }
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  // --- Actions ---
  toggleStatus() {
    const currentUser = this.user();
    if (!currentUser) return;

    const action = currentUser.isActive ? 'Deactivate' : 'Activate';

    this.confirmationService.confirm({
      message: `Are you sure you want to ${action.toLowerCase()} ${currentUser.name}?`,
      header: `Confirm ${action}`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: currentUser.isActive ? 'p-button-danger' : 'p-button-success',
      accept: () => {
        const req$ = currentUser.isActive
          ? this.userService.deactivateUser(this.userId)
          : this.userService.activateUser(this.userId);

        req$.subscribe({
          next: () => {
            this.messageService.showSuccess(`User ${action.toLowerCase()}d successfully.`);
            this.user.update(u => ({ ...u, isActive: !u.isActive }));
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }



  resetPassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.messageService.showWarn('Validation Error: Please ensure the password meets the minimum length.');
      return;
    }

    const { password, passwordConfirm } = this.passwordForm.getRawValue();

    if (password !== passwordConfirm) {
      this.messageService.showWarn('Validation Error: Passwords do not match.');
      return;
    }

    this.isSubmitting = true;
    this.userService.adminResetPassword(this.userId, password, passwordConfirm)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          this.messageService.showSuccess('User password reset successfully.');
          this.showPasswordDialog = false;
          this.passwordForm.reset();
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }
}