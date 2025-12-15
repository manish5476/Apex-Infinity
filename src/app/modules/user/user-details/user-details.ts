import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

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

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    CardModule, ButtonModule, TimelineModule, DialogModule, 
    InputTextModule, TagModule, DividerModule, DatePipe,
    ConfirmDialogModule, ToastModule, SkeletonModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-details.html',
  styleUrl: './user-details.scss'
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserManagementService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  userId: string = '';
  user = signal<any>(null);
  activities = signal<any[]>([]);
  
  showPasswordDialog = false;
  isSubmitting = false;
  passwordForm: FormGroup;

  constructor() {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUserDetails();
      this.loadUserActivity();
    } else {
      this.router.navigate(['/user/list']);
    }
  }

  loadUserDetails() {
    this.userService.getUser(this.userId).subscribe({
      next: (res) => {
        // ✅ FIX: Check res.data.data (Factory default) OR res.data.user
        const userData = res.data?.data || res.data?.user;
        
        if (userData) {
          this.user.set(userData);
        } else {
          console.error('User data not found in response:', res);
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load user.' });
      }
    });
  }

  loadUserActivity() {
    this.userService.getUserActivity(this.userId).subscribe({
      next: (res) => {
        // Handle activity log response structure
        const logs = res.data?.activities || res.data || [];
        this.activities.set(logs);
      }
    });
  }

  toggleStatus() {
    const currentUser = this.user();
    if (!currentUser) return;

    const action = currentUser.isActive ? 'Deactivate' : 'Activate';

    this.confirmationService.confirm({
      message: `Are you sure you want to ${action} ${currentUser.name}?`,
      header: `${action} User`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: currentUser.isActive ? 'p-button-danger' : 'p-button-success',
      accept: () => {
        const req$ = currentUser.isActive 
          ? this.userService.deactivateUser(this.userId)
          : this.userService.activateUser(this.userId);

        req$.subscribe({
          next: (res) => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: `User ${action}d` });
            // Update local state to reflect change immediately
            this.user.update(u => ({ ...u, isActive: !u.isActive }));
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
        });
      }
    });
  }

  resetPassword() {
    if (this.passwordForm.invalid) return;
    const { password, passwordConfirm } = this.passwordForm.value;
    
    if (password !== passwordConfirm) {
      this.messageService.add({ severity: 'error', summary: 'Mismatch', detail: 'Passwords do not match' });
      return;
    }

    this.isSubmitting = true;
    this.userService.adminResetPassword(this.userId, password).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password reset.' });
        this.showPasswordDialog = false;
        this.passwordForm.reset();
        this.isSubmitting = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message });
        this.isSubmitting = false;
      }
    });
  }
}