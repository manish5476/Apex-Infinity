import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
// ✅ ADDED withHashLocation HERE
import { provideRouter, RouteReuseStrategy, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions, withIncrementalHydration } from '@angular/platform-browser';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { successInterceptor } from './core/interceptors/success.interceptor';
// import { LoadingInterceptor } from './core/interceptors/loading.interceptor';

// PrimeNG Imports
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';

// Import your custom preset
// import { MyPreset } from './core/config/my-preset';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { AuthService } from './modules/auth/services/auth-service';
import { DialogService } from 'primeng/dynamicdialog';
import { TabReuseStrategy } from './Tabbing';
// import { ConfirmationService } from '@core/services/confirmationService';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([jwtInterceptor, successInterceptor, errorInterceptor]),//LoadingInterceptor
      withFetch()
    ),
    
    // ✅ ADDED withHashLocation() HERE
    provideRouter(routes, withHashLocation()), 
    
    provideClientHydration(
      withEventReplay(),
      withIncrementalHydration(),
      withHttpTransferCacheOptions({
        includePostRequests: false,
        includeRequestsWithAuthHeaders: false
      })
    ),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    
    { provide: RouteReuseStrategy, useClass: TabReuseStrategy },

    providePrimeNG({
      ripple: true,
      theme: {
        options: {
          darkModeSelector: '.theme-dark',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    }),
    MessageService, ConfirmationService,
    DatePipe, DecimalPipe, PercentPipe, DialogService,

    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return auth.initializeFromStorage();
    })
  ]
};
// import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
// import { provideZonelessChangeDetection } from '@angular/core';
// import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
// import { provideRouter, RouteReuseStrategy } from '@angular/router';
// import { routes } from './app.routes';
// import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions, withIncrementalHydration } from '@angular/platform-browser';
// import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
// import { errorInterceptor } from './core/interceptors/error.interceptor';
// import { successInterceptor } from './core/interceptors/success.interceptor';
// // import { LoadingInterceptor } from './core/interceptors/loading.interceptor';

// // PrimeNG Imports
// import { providePrimeNG } from 'primeng/config';
// import { MessageService, ConfirmationService } from 'primeng/api';

// // Import your custom preset
// // import { MyPreset } from './core/config/my-preset';
// import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
// import { loggingInterceptor } from './core/interceptors/logging.interceptor';
// import { AuthService } from './modules/auth/services/auth-service';
// import { DialogService } from 'primeng/dynamicdialog';
// import { TabReuseStrategy } from './Tabbing';
// // import { ConfirmationService } from '@core/services/confirmationService';

// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideHttpClient(
//       withInterceptors([jwtInterceptor, successInterceptor, errorInterceptor]),//LoadingInterceptor
//       withFetch()
//     ),
//     provideRouter(routes),
//     provideClientHydration(
//       withEventReplay(),
//       withIncrementalHydration(),
//       withHttpTransferCacheOptions({
//         includePostRequests: false,
//         includeRequestsWithAuthHeaders: false
//       })
//     ),
//     provideZonelessChangeDetection(),
//     provideAnimationsAsync(),
//     // providePrimeNG({
//     //   ripple: true,
//     //   theme: {
//     //     preset: ApexPreset,
//     //     options: {
//     //       darkModeSelector: '.theme-dark, .theme-neon-eclipse, ...',
//     //       cssLayer: { name: 'primeng', order: 'theme, base, primeng' }
//     //     }
//     //   }
//     // })
//     { provide: RouteReuseStrategy, useClass: TabReuseStrategy },

//     providePrimeNG({
//       ripple: true,
//       theme: {
//         // preset: MyPreset, 
//         options: {
//           darkModeSelector: '.theme-dark',
//           cssLayer: {
//             name: 'primeng',
//             order: 'tailwind-base, primeng, tailwind-utilities'
//           }
//         }
//       }
//     }),
//     // ConfirmationService
//     MessageService, ConfirmationService,
//     DatePipe, DecimalPipe, PercentPipe, DialogService,

//     // ✅ THE MODERN FIX: Using provideAppInitializer
//     provideAppInitializer(() => {
//       const auth = inject(AuthService);
//       return auth.initializeFromStorage();
//     })
//   ]
// };



























// // import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
// // import { provideZonelessChangeDetection } from '@angular/core';
// // import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
// // import { provideRouter } from '@angular/router';
// // import { routes } from './app.routes';
// // import { provideClientHydration } from '@angular/platform-browser';
// // import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// // import { DatePipe } from '@angular/common';
// // import { errorInterceptor } from './core/interceptors/error.interceptor';
// // import { successInterceptor } from './core/interceptors/success.interceptor';
// // import { LoadingInterceptor } from './core/interceptors/loading.interceptor';

// // // PrimeNG Imports
// // import { providePrimeNG } from 'primeng/config';
// // import { MessageService, ConfirmationService } from 'primeng/api';

// // // Import your custom preset
// // // import { MyPreset } from './core/config/my-preset';

// // // Interceptors
// // import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
// // import { loggingInterceptor } from './core/interceptors/logging.interceptor';

// // // Services
// // import { AuthService } from './modules/auth/services/auth-service';
// // import { DialogService } from 'primeng/dynamicdialog';
// // import { appThemePreset } from '../styles/app-theme.preset';
// // // import { ConfirmationService } from '@core/services/confirmationService';

// // export const appConfig: ApplicationConfig = {
// //   providers: [
// //     provideHttpClient(
// //       withInterceptors([jwtInterceptor, loggingInterceptor, successInterceptor, errorInterceptor, LoadingInterceptor]),
// //       withFetch()
// //     ),
// //     provideRouter(routes),
// //     provideZonelessChangeDetection(),
// //     provideAnimationsAsync(),
// //     providePrimeNG({
// //       theme: {
// //         preset: appThemePreset,
// //         options: {
// //           // Must match options.darkModeSelector in the preset
// //           darkModeSelector: '.app-dark',
// //           cssLayer: false,
// //         },
// //       },
// //       ripple: true,
// //     }),
// //     // PRIME NG CONFIGURATION
// //     // providePrimeNG({
// //     //   ripple: true,
// //     //   theme: {
// //     //     // preset: MyPreset,
// //     //     options: {
// //     //       darkModeSelector: '.theme-dark',
// //     //       cssLayer: {
// //     //         name: 'primeng',
// //     //         order: 'tailwind-base, primeng, tailwind-utilities'
// //     //       }
// //     //     }
// //     //   }
// //     // }),
// //     // ConfirmationService
// //     MessageService, ConfirmationService,
// //     DatePipe, DialogService,

// //     // ✅ THE MODERN FIX: Using provideAppInitializer
// //     provideAppInitializer(() => {
// //       const auth = inject(AuthService);
// //       return auth.initializeFromStorage();
// //     })
// //   ]
// // };
