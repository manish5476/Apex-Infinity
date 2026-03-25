
import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DatePipe } from '@angular/common';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { successInterceptor } from './core/interceptors/success.interceptor';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';

// PrimeNG Imports
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';

// Import your custom preset
// import { MyPreset } from './core/config/my-preset';

// Interceptors
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';

// Services
import { AuthService } from './modules/auth/services/auth-service';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService } from '@core/services/confirmationService';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([jwtInterceptor, loggingInterceptor, successInterceptor, errorInterceptor, LoadingInterceptor]),
      withFetch()
    ),
    provideRouter(routes),
    provideZonelessChangeDetection(),
    provideClientHydration(),
    provideAnimationsAsync(),

    // PRIME NG CONFIGURATION
    providePrimeNG({
      ripple: true,
      theme: {
        // preset: MyPreset, 
        options: {
          darkModeSelector: '.theme-dark',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    }),
    // ConfirmationService
    MessageService,
    DatePipe, DialogService,

    // ✅ THE MODERN FIX: Using provideAppInitializer
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return auth.initializeFromStorage();
    })
  ]
};