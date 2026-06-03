import { Component, inject, computed, ElementRef, viewChild, signal, WritableSignal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, KeyValuePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of, Subject } from 'rxjs';
import { UserManagementService } from '../user-management.service';

// PrimeNG
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { takeUntil } from "rxjs/operators";

interface Device { _id: string; deviceId: string; deviceType: string; lastActive: string; userAgent: string; }

interface User {
  _id: string; name: string; email: string; phone: string; avatar?: string; isActive: boolean; status: string;
  createdAt: string; updatedAt: string; lastLoginAt: string;
  upiId?: string; language?: string; themeId?: string;
  employee?: { designationId?: { title: string }; departmentId?: { name: string }; reportingManagerId?: { name: string }; workLocation?: string; personal?: { secondaryPhone?: string }; guarantorDetails?: { name: string; relationship: string; phone: string }; attendanceConfig?: { isAttendanceEnabled: boolean; allowWebPunch: boolean; allowMobilePunch: boolean; shiftId?: { name: string; duration: string; startTime: string; endTime: string }; }; };
  preferences: { theme: string; notifications: { email: boolean; push: boolean; sms: boolean } };
  branchId?: { name: string; address: { street: string; city: string; state: string; zipCode: string; country: string } };
  role: string; permissions?: string[];
  devices: Device[];
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule, DatePipe, KeyValuePipe, ReactiveFormsModule,
    SkeletonModule, TagModule, ButtonModule, TooltipModule,
    DialogModule, InputTextModule, ToggleButtonModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private userService = inject(UserManagementService);
  private fb = inject(FormBuilder);
  fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  currentUser: WritableSignal<User | null> = signal(null);
  uploading = signal(false);
  isEditModalOpen = signal(false);
  isSaving = signal(false);
  revokingDeviceId = signal<string | null>(null);
  profileForm!: FormGroup;

  ngOnInit() {
    this.initForm();
    this.loadProfile();
  }

  // Single API call handles Identity, Devices, and Permissions
  loadProfile() {
    this.userService.getMe().pipe(
      map((res: any) => res.data.user as User),
      catchError(() => of(null)), takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user) this.currentUser.set(user);
    });
  }

  // --- Form Logic ---
  initForm() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      upiId: [''], language: ['en'], themeId: ['theme-light'],
      employee: this.fb.group({
        workLocation: [''],
        personal: this.fb.group({ secondaryPhone: [''] }),
        guarantorDetails: this.fb.group({ name: [''], relationship: [''], phone: [''] })
      }),
      preferences: this.fb.group({
        theme: ['light'], notifications: this.fb.group({ email: [true], push: [true], sms: [false] })
      })
    });
  }

  openEditModal() {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name || '', upiId: user.upiId || '', language: user.language || 'en', themeId: user.themeId || 'theme-light',
        employee: {
          workLocation: user.employee?.workLocation || '',
          personal: { secondaryPhone: user.employee?.personal?.secondaryPhone || '' },
          guarantorDetails: {
            name: user.employee?.guarantorDetails?.name || '',
            relationship: user.employee?.guarantorDetails?.relationship || '',
            phone: user.employee?.guarantorDetails?.phone || ''
          }
        },
        preferences: {
          theme: user.preferences?.theme || 'light',
          notifications: {
            email: user.preferences?.notifications?.email ?? true,
            push: user.preferences?.notifications?.push ?? true,
            sms: user.preferences?.notifications?.sms ?? false
          }
        }
      });
      this.isEditModalOpen.set(true);
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.isSaving.set(true);
    const val = this.profileForm.value;

    const payload = {
      name: val.name, upiId: val.upiId, language: val.language, themeId: val.themeId,
      preferences: val.preferences,
      employee: {
        personal: val.employee.personal,
        workLocation: val.employee.workLocation,
        guarantorDetails: val.employee.guarantorDetails
      }
    };

    this.userService.updateMyProfile(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.currentUser.set(res.data.user);
        this.isSaving.set(false);
        this.isEditModalOpen.set(false);
      },
      error: () => this.isSaving.set(false)
    });
  }

  // --- Device Management ---
  revokeDevice(sessionId: string) {
    this.revokingDeviceId.set(sessionId);
    this.userService.revokeDevice(sessionId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Optimistically remove the device from the UI array without reloading the user
        this.currentUser.update(user => {
          if (!user) return user;
          return { ...user, devices: user.devices.filter(d => d._id !== sessionId) };
        });
        this.revokingDeviceId.set(null);
      },
      error: (err) => {
        console.error('Failed to revoke session', err);
        // If the backend returns 400 because it's the current session, the spinner stops
        this.revokingDeviceId.set(null);
      }
    });
  }

  // --- Avatar Upload ---
  triggerFileInput(): void { this.fileInputRef()?.nativeElement.click(); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) return;
    this.uploading.set(true);
    const formData = new FormData();
    formData.append('photo', file);

    this.userService.uploadProfilePhoto(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.uploading.set(false);
        this.currentUser.set(res.data.user);
      },
      error: () => this.uploading.set(false)
    });
  }

  // --- Helpers ---
  groupedPermissions = computed(() => {
    const perms = this.currentUser()?.permissions || [];
    const groups: { [key: string]: string[] } = {};
    perms.forEach(p => {
      const [module, action] = p.split(':');
      if (!groups[module]) groups[module] = [];
      groups[module].push(action.replace(/_/g, ' '));
    });
    return groups;
  });

  getInitials(name: string): string { return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U'; }

  getDeviceIcon(agent: string): string {
    const lower = agent?.toLowerCase() || '';
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) return 'pi-mobile';
    return 'pi-desktop';
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
