import { ApiService } from './../../../../core/services/api';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MasterListService } from '../../../../core/services/master-list.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    CheckboxModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  providers: [MessageService, AppMessageService] 
})
export class Login implements OnInit {
  // --- Injections ---
  private masterListService = inject(MasterListService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(AppMessageService);
  // private notificationService = inject(NotificationService); // Removed: Not needed here anymore
  private ApiService = inject(ApiService);

  // --- State Signals ---
  isLoading = signal(false);

  // --- Forms ---
  loginForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      remember: [false]
    });
  }

  get form() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.messageService.showWarn('Invalid Form', 'Please enter a valid email and password.');
      return;
    }

    // this.isLoading.set(true);
    
    // We subscribe here just to handle the loading state or specific errors
    // The actual navigation and socket connection happen inside 'handleLoginSuccess'
    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        
        // 1. This method now handles Token Storage + Socket Connection automatically
        // You do NOT need to call notificationService.connect() manually here.
        this.authService.handleLoginSuccess(response);
        
        // 2. Load Master Data
        this.masterListService.load(); 

        this.isLoading.set(false);

        // 3. Navigation is also handled by handleLoginSuccess, but if you want to force it here:
        // this.router.navigate(['/dashboard']); 
      },
      error: (err) => {
        this.isLoading.set(false);
        // this.messageService.showError('Login Failed', 'Invalid credentials');
      }
    });
  }
}

// import { ApiService } from './../../../../core/services/api';
// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { MessageService } from 'primeng/api';
// import { ToastModule } from 'primeng/toast';
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { PasswordModule } from 'primeng/password';
// import { CheckboxModule } from 'primeng/checkbox';
// import { AuthService } from '../../services/auth-service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { NotificationService } from '../../../../core/services/notification.service';
// import { MasterListService } from '../../../../core/services/master-list.service';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,
//     ToastModule,
//     InputTextModule,
//     ButtonModule,
//     PasswordModule,
//     CheckboxModule
//   ],
//   templateUrl: './login.html',
//   styleUrl: './login.scss',
//   providers: [MessageService, AppMessageService] // Local providers
// })
// export class Login implements OnInit {
//   // --- Injections ---
//   private masterListService = inject(MasterListService);
//   private fb = inject(FormBuilder);
//   private authService = inject(AuthService);
//   private router = inject(Router);
//   private messageService = inject(AppMessageService); // Use your custom service
//   private notificationService = inject(NotificationService); // Use your custom service
//   private ApiService = inject(ApiService); // Use your custom service

//   // --- State Signals ---
//   isLoading = signal(false);

//   // --- Forms ---
//   loginForm!: FormGroup;

//   ngOnInit(): void {
//     this.initForm();
//   }

//   private initForm(): void {
//     this.loginForm = this.fb.group({
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required]],
//       remember: [false]
//     });
//   }

//   get form() {
//     return this.loginForm.controls;
//   }

//   onSubmit(): void {
//     if (this.loginForm.invalid) {
//       this.loginForm.markAllAsTouched();
//       this.messageService.showWarn('Invalid Form', 'Please enter a valid email and password.');
//       return;
//     }

//     //  // this.isLoading.set(true);
//     this.authService.login(this.loginForm.value).subscribe({
//       next: (response: any) => {
//         // 1. Handle Token Storage & Navigation
//         this.authService.handleLoginSuccess(response);
//         this.masterListService.load(); 
//         // 3. Connect Notifications
//         const currentUser = this.authService.getCurrentUser();
//         if (currentUser) {
//           this.notificationService.connect(currentUser._id);
//         }

//           this.isLoading.set(false);

//     // ✅ REVERTED: Navigate to standard dashboard
//     this.router.navigate(['/dashboard']); 
 
//       },
//       error: (err) => {
//         this.isLoading.set(false);
//         // Optional: Show error message here if your interceptor doesn't handle it globally
//         // this.messageService.showError('Login Failed', 'Invalid credentials');
//       }
//     });

//   }
// }