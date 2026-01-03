import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber'; // Added for consistency
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { BranchService } from '../../services/branch-service';
import { Textarea } from 'primeng/textarea';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    SelectModule,
    DividerModule,
    InputNumberModule // Added
  ],
  templateUrl: './branch-form.html',
  styleUrls: ['./branch-form.scss']
})
export class BranchFormComponent implements OnInit {
  // --- Injected Services ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private branchService = inject(BranchService);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  private masterList = inject(MasterListService);

  // --- Form & State ---
  branchForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  branchId: string | null = null;
  formTitle = signal('Create New Branch');

  // --- Master Data Signals ---
  managerOptions = signal<any[]>([]);

  constructor() {
    this.managerOptions.set(this.masterList.users()); // Assuming users are loaded in master list
  }

  // ngOnInit(): void {
  //   this.buildForm();
  //   this.checkRouteForEditMode();
  // }
  ngOnInit(): void {
    this.buildForm();
    this.checkRouteForEditMode();

    // 📍 Default current location for CREATE only
    if (!this.branchId) {
      this.setCurrentLocationIfEmpty();
    }
  }


  private checkRouteForEditMode(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.branchId = params.get('id');
        if (this.branchId) {
          // this.editMode.set(true);
          this.formTitle.set('Edit Branch');
          this.loadingService.show();
          return this.branchService.getBranchById(this.branchId);
        }
        return of(null); // Create mode
      }),
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (response) => {
        if (response && response.data && response.data.data) {
          this.patchForm(response.data.data);
        } else if (response) {
          this.messageService.showError('Error', 'Failed to load branch data');
        }
      },
      error: (err) => this.messageService.showError('Error', err.error?.message)
    });
  }

  private setCurrentLocationIfEmpty(): void {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    const locationGroup = this.branchForm.get('location');

    // ✅ Do not override existing location (important for edit mode)
    if (locationGroup?.value?.lat && locationGroup?.value?.lng) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        locationGroup?.patchValue({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        });
      },
      (error) => {
        console.warn('Location permission denied or unavailable', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  // private buildForm(): void {
  //   this.branchForm = this.fb.group({
  //     name: ['', Validators.required],
  //     branchCode: [''],
  //     phoneNumber: [''],
  //     managerId: [null],
  //     address: this.fb.group({
  //       street: [''],
  //       city: [''],
  //       state: [''],
  //       zipCode: [''],
  //       country: ['India', Validators.required]
  //     }),
  //     isMainBranch: [false],
  //     isActive: [true]
  //   });
  // }
  private buildForm(): void {
    this.branchForm = this.fb.group({
      name: ['', Validators.required],
      branchCode: [''],
      phoneNumber: ['', [
        Validators.pattern(/^[0-9+\-()\s]{6,20}$/)
      ]],
      managerId: [null],

      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: ['India', Validators.required]
      }),

      location: this.fb.group({
        lat: [null],
        lng: [null]
      }),

      isMainBranch: [false],
      isActive: [true]
    });
  }

  onLocationFieldFocus(): void {
  const location = this.branchForm.get('location')?.value;

  // ✅ Only fetch if empty
  if (location?.lat != null && location?.lng != null) {
    return;
  }

  if (!navigator.geolocation) {
    this.messageService.showWarn(
      'Location not supported',
      'Geolocation is not available in this browser.'
    );
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      this.branchForm.get('location')?.patchValue({
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6))
      });
    },
    () => {
      this.messageService.showWarn(
        'Permission denied',
        'Unable to fetch current location.'
      );
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}


  private patchForm(branch: any): void {
    // patchValue is robust and will match the form structure,
    // including the nested 'address' group.
    this.branchForm.patchValue(branch);
  }

  onSubmit(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      this.messageService.showError('Invalid Form', 'Please check all required fields.');
      return;
    }

    // this.isSubmitting.set(true);
    const payload = this.branchForm.getRawValue();

    const saveObservable = this.editMode()
      ? this.branchService.updateBranch(this.branchId!, payload)
      : this.branchService.createBranch(payload);

    saveObservable.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Success', `Branch ${this.editMode() ? 'updated' : 'created'} successfully.`);
        // Notify master list that branches have changed
        this.masterList.refresh();
        // this.masterList.notifyDataChange('branches'); 
        this.router.navigate(['/branches']); // Navigate back to list
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to save branch.');
      }
    });
  }
}
