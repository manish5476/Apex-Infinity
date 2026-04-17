import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';

// Services
import { LoadingService } from '../../../../core/services/loading.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { BranchService } from '../../services/branch-service';

// ✅ Custom Components
import { LocationPickerComponent } from '../../components/location-picker/location-picker.component'; 
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    SelectModule,
    DividerModule,
    InputNumberModule,
    LocationPickerComponent,
    MasterDropdownComponent
],
  templateUrl: './branch-form.html',
  styleUrls: ['./branch-form.scss']
})
export class BranchFormComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  // --- Injections ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private branchService = inject(BranchService);
  private appMessage = inject(AppMessageService);
  private loadingService = inject(LoadingService);

  // --- Form & State ---
  branchForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  branchId: string | null = null;
  formTitle = signal('Create New Branch');

  // Holds the coordinates to pass TO the map (for editing)
  initialMapLocation = signal<{ lat: number, lng: number } | null>(null);

  constructor() {}

  ngOnInit(): void {
    this.buildForm();
    this.checkRouteForEditMode();

    if (!this.branchId) {
      this.setCurrentLocationIfEmpty();
    }
  }

  private buildForm(): void {
    this.branchForm = this.fb.group({
      name: ['', Validators.required],
      branchCode: [''],
      phoneNumber: ['', [Validators.pattern(/^[0-9+\-()\s]{6,20}$/)]],
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

    private patchForm(branch: any): void {
    this.branchForm.patchValue(branch);

    if (branch.location?.lat && branch.location?.lng) {
      this.initialMapLocation.set({ 
        lat: branch.location.lat, 
        lng: branch.location.lng 
      });
    }
  }

  onMapLocationChange(coords: { lat: number; lng: number }) {
    this.branchForm.get('location')?.patchValue({
      lat: Number(coords.lat.toFixed(6)),
      lng: Number(coords.lng.toFixed(6))
    });
    this.branchForm.markAsDirty();
  }

private checkRouteForEditMode(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.branchId = params.get('id');
        if (this.branchId) {
          this.editMode.set(true);
          this.formTitle.set('Edit Branch');
          return this.branchService.getBranchById(this.branchId);
        }
        return of(null);
      }),
      finalize(() => this.loadingService.hide()), takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response?.data?.data) {
          this.patchForm(response.data.data);
        }
      },
      error: (err) => this.appMessage.handleHttpError(err)
    });
  }

  onLocationFieldFocus(): void {
    if (!navigator.geolocation) {
      this.appMessage.showWarn('Not Supported: Geolocation is not available on this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        this.branchForm.get('location')?.patchValue({ lat, lng });
        this.initialMapLocation.set({ lat, lng });
        
        this.appMessage.showInfo('Location synchronized from GPS.');
      },
      () => this.appMessage.showWarn('Permission Denied: Please enable location permissions in your browser.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private setCurrentLocationIfEmpty(): void {
    const loc = this.branchForm.get('location')?.value;
    if (loc?.lat || loc?.lng || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        this.branchForm.get('location')?.patchValue({ lat, lng });
        this.initialMapLocation.set({ lat, lng });
      },
      (err) => console.warn('Auto-location failed', err)
    );
  }

  onSubmit(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      this.appMessage.showWarn('Invalid Form: Please check the required fields before saving.');
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.branchForm.getRawValue();

    const request$ = this.editMode()
      ? this.branchService.updateBranch(this.branchId!, payload)
      : this.branchService.createBranch(payload);

    request$.pipe(
      finalize(() => this.isSubmitting.set(false)), takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.appMessage.showSuccess(`Branch ${this.editMode() ? 'updated' : 'created'} successfully.`);
        this.router.navigate(['/branches']);
      },
      error: (err) => this.appMessage.handleHttpError(err)
    });
  }
  
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
