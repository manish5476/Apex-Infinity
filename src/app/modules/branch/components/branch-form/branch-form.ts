import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

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
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { BranchService } from '../../services/branch-service';

// ✅ Custom Components
import { LocationPickerComponent } from '../../components/location-picker/location-picker.component'; 

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
    InputNumberModule,
    LocationPickerComponent 
  ],
  templateUrl: './branch-form.html',
  styleUrls: ['./branch-form.scss']
})
export class BranchFormComponent implements OnInit {
  // --- Injections ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private branchService = inject(BranchService);
  private appMessage = inject(AppMessageService); // Renamed for consistency with MasterList pattern
  private loadingService = inject(LoadingService);
  private masterList = inject(MasterListService);

  // --- Form & State ---
  branchForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  branchId: string | null = null;
  formTitle = signal('Create New Branch');

  // --- Signals ---
  managerOptions = signal<any[]>([]);
  
  // Holds the coordinates to pass TO the map (for editing)
  initialMapLocation = signal<{ lat: number, lng: number } | null>(null);

  constructor() {
    // Load managers from master list
    this.managerOptions.set(this.masterList.users()); 
  }

  ngOnInit(): void {
    this.buildForm();
    this.checkRouteForEditMode();

    // If creating new, try to get current location automatically
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
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (response) => {
        if (response?.data?.data) {
          this.patchForm(response.data.data);
        }
      },
      error: (err) => this.appMessage.handleHttpError(err, 'Fetch Branch Details')
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

  // --- Location Logic ---

  onMapLocationChange(coords: { lat: number; lng: number }) {
    this.branchForm.get('location')?.patchValue({
      lat: Number(coords.lat.toFixed(6)),
      lng: Number(coords.lng.toFixed(6))
    });
    this.branchForm.markAsDirty();
  }

  onLocationFieldFocus(): void {
    if (!navigator.geolocation) {
      this.appMessage.showWarn('Geolocation is not available on this browser.', 'Not Supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        this.branchForm.get('location')?.patchValue({ lat, lng });
        this.initialMapLocation.set({ lat, lng });
        this.appMessage.showInfo('Location updated from GPS', 'Location Synchronized');
      },
      () => this.appMessage.showWarn('Please enable location permissions in your browser.', 'Permission Denied'),
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

  // --- Submission ---

  onSubmit(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      this.appMessage.showWarn('Please check the required fields before saving.', 'Invalid Form');
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.branchForm.getRawValue();

    const request$ = this.editMode()
      ? this.branchService.updateBranch(this.branchId!, payload)
      : this.branchService.createBranch(payload);

    request$.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.appMessage.showSuccess(`Branch ${this.editMode() ? 'updated' : 'created'} successfully.`);
        this.masterList.refresh();
        this.router.navigate(['/branches']);
      },
      error: (err) => this.appMessage.handleHttpError(err, this.editMode() ? 'Update Branch' : 'Create Branch')
    });
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { finalize, switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';

// // PrimeNG Modules
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { CheckboxModule } from 'primeng/checkbox';
// import { SelectModule } from 'primeng/select';
// import { DividerModule } from 'primeng/divider';
// import { ToastModule } from 'primeng/toast';
// import { InputNumberModule } from 'primeng/inputnumber';

// // Services
// import { LoadingService } from '../../../../core/services/loading.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { BranchService } from '../../services/branch-service';

// // ✅ Custom Components
// // Make sure this path points to where you saved the LocationPickerComponent
// import { LocationPickerComponent } from '../../components/location-picker/location-picker.component'; 

// @Component({
//   selector: 'app-branch-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ToastModule,
//     ButtonModule,
//     InputTextModule,
//     CheckboxModule,
//     SelectModule,
//     DividerModule,
//     InputNumberModule,
//     LocationPickerComponent // ✅ Import the map component
//   ],
//   templateUrl: './branch-form.html',
//   styleUrls: ['./branch-form.scss']
// })
// export class BranchFormComponent implements OnInit {
//   // --- Injections ---
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private branchService = inject(BranchService);
//   private messageService = inject(AppMessageService);
//   private loadingService = inject(LoadingService);
//   private masterList = inject(MasterListService);

//   // --- Form & State ---
//   branchForm!: FormGroup;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   branchId: string | null = null;
//   formTitle = signal('Create New Branch');

//   // --- Signals ---
//   managerOptions = signal<any[]>([]);
  
//   // ✅ Holds the coordinates to pass TO the map (for editing)
//   initialMapLocation = signal<{ lat: number, lng: number } | null>(null);

//   constructor() {
//     // Load managers from master list
//     this.managerOptions.set(this.masterList.users()); 
//   }

//   ngOnInit(): void {
//     this.buildForm();
//     this.checkRouteForEditMode();

//     // If creating new, try to get current location automatically
//     if (!this.branchId) {
//       this.setCurrentLocationIfEmpty();
//     }
//   }

//   private buildForm(): void {
//     this.branchForm = this.fb.group({
//       name: ['', Validators.required],
//       branchCode: [''],
//       phoneNumber: ['', [Validators.pattern(/^[0-9+\-()\s]{6,20}$/)]],
//       managerId: [null],

//       address: this.fb.group({
//         street: [''],
//         city: [''],
//         state: [''],
//         zipCode: [''],
//         country: ['India', Validators.required]
//       }),

//       location: this.fb.group({
//         lat: [null], // Using null for number inputs
//         lng: [null]
//       }),

//       isMainBranch: [false],
//       isActive: [true]
//     });
//   }

//   private checkRouteForEditMode(): void {
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         this.branchId = params.get('id');
//         if (this.branchId) {
//           this.editMode.set(true);
//           this.formTitle.set('Edit Branch');
//           // this.loadingService.show();
//           return this.branchService.getBranchById(this.branchId);
//         }
//         return of(null);
//       }),
//       finalize(() =>
//          this.loadingService.hide()
//     )
//     ).subscribe({
//       next: (response) => {
//         if (response?.data?.data) {
//           this.patchForm(response.data.data);
//         }
//       },
//       error: (err) => this.messageService.showError('Error', err.error?.message)
//     });
//   }

//   private patchForm(branch: any): void {
//     this.branchForm.patchValue(branch);

//     // ✅ Update the map pin position if data exists
//     if (branch.location?.lat && branch.location?.lng) {
//       this.initialMapLocation.set({ 
//         lat: branch.location.lat, 
//         lng: branch.location.lng 
//       });
//     }
//   }

//   // --- Location Logic ---

//   // Called when user clicks the map
//   onMapLocationChange(coords: { lat: number; lng: number }) {
//     this.branchForm.get('location')?.patchValue({
//       lat: Number(coords.lat.toFixed(6)),
//       lng: Number(coords.lng.toFixed(6))
//     });
//     this.branchForm.markAsDirty();
//   }

//   // Called when "Use My Current Location" button is clicked
//   onLocationFieldFocus(): void {
//     if (!navigator.geolocation) {
//       this.messageService.showWarn('Not Supported', 'Geolocation is not available.');
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         const lat = Number(position.coords.latitude.toFixed(6));
//         const lng = Number(position.coords.longitude.toFixed(6));

//         // Update Form
//         this.branchForm.get('location')?.patchValue({ lat, lng });
        
//         // Update Map Pin
//         this.initialMapLocation.set({ lat, lng });
//       },
//       () => this.messageService.showWarn('Permission Denied', 'Unable to fetch location.'),
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }

//   private setCurrentLocationIfEmpty(): void {
//     const loc = this.branchForm.get('location')?.value;
//     if (loc?.lat || loc?.lng || !navigator.geolocation) return;

//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         const lat = Number(pos.coords.latitude.toFixed(6));
//         const lng = Number(pos.coords.longitude.toFixed(6));
//         this.branchForm.get('location')?.patchValue({ lat, lng });
//         this.initialMapLocation.set({ lat, lng });
//       },
//       (err) => console.warn('Auto-location failed', err)
//     );
//   }

//   // --- Submission ---

//   onSubmit(): void {
//     if (this.branchForm.invalid) {
//       this.branchForm.markAllAsTouched();
//       this.messageService.showError('Invalid Form', 'Please check required fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     const payload = this.branchForm.getRawValue();

//     const request$ = this.editMode()
//       ? this.branchService.updateBranch(this.branchId!, payload)
//       : this.branchService.createBranch(payload);

//     request$.pipe(
//       finalize(() => this.isSubmitting.set(false))
//     ).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Success', `Branch ${this.editMode() ? 'updated' : 'created'} successfully.`);
//         this.masterList.refresh();
//         this.router.navigate(['/branches']);
//       },
//       error: (err) => {
//         this.messageService.showError('Error', err.error?.message || 'Failed to save branch.');
//       }
//     });
//   }
// }
