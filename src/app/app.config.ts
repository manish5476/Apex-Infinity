import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core'; // <-- CORRECTED IMPORT
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
// import { AppMessageService } from './core/services/message.service'; // <-- UNCOMMENTED
import Aura from "@primeng/themes/aura";
import { definePreset } from "@primeng/themes";
import { MessageService } from 'primeng/api';
// import { AuthInterceptor } from './core/Interceptors/auth.interceptor'; // <-- UNCOMMENTED
// import { ErrorInterceptor } from './core/Interceptors/error.interceptor'; // <-- UNCOMMENTED
// import { LoadingInterceptor } from './core/Interceptors/loading.interceptor'; // <-- UNCOMMENTED
// import { loggingInterceptor } from './core/Interceptors/logging.interceptor'; // <-- UNCOMMENTED
import { DatePipe } from '@angular/common';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

const ModernThemePreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: 'var(--theme-accent-primary-light)',
            100: 'var(--theme-accent-primary-light)',
            200: 'var(--theme-accent-primary-light)',
            300: 'var(--theme-accent-primary-light)',
            400: 'var(--theme-accent-primary)',
            500: 'var(--theme-accent-primary)',
            600: 'var(--theme-accent-primary-hover)',
            700: 'var(--theme-accent-primary-hover)',
            800: 'var(--theme-accent-primary-hover)',
            900: 'var(--theme-accent-primary-hover)',
            950: 'var(--theme-accent-primary-hover)'
        },
        colorScheme: {
            light: {
                primary: {
                    color: 'var(--theme-accent-primary)',
                    contrastColor: 'var(--theme-accent-text-color)',
                    hoverColor: 'var(--theme-accent-primary-hover)',
                    activeColor: 'var(--theme-accent-primary-hover)'
                },
                surface: {
                    0: 'var(--theme-bg-primary)',
                    50: 'var(--theme-bg-primary)',
                    100: 'var(--theme-bg-secondary)',
                    200: 'var(--theme-bg-tertiary)',
                    300: 'var(--theme-border-primary)',
                }
            },
            dark: {
                primary: {
                    color: 'var(--theme-accent-primary-light)',
                    contrastColor: 'var(--theme-text-inverted)',
                    hoverColor: 'var(--theme-accent-primary)',
                    activeColor: 'var(--theme-accent-primary)'
                },
                surface: {
                    0: 'var(--theme-bg-primary)',
                    50: 'var(--theme-bg-primary)',
                    100: 'var(--theme-bg-secondary)',
                    200: 'var(--theme-bg-tertiary)',
                    300: 'var(--theme-border-primary)',
                }
            }
        }
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(
            // Re-enabled your interceptors
            withInterceptors([jwtInterceptor,]),
            // withInterceptors([AuthInterceptor, loggingInterceptor, ErrorInterceptor, LoadingInterceptor]),
            withFetch()
        ),
        
        // This is the correct function for zoneless
        provideZonelessChangeDetection(), // <-- CORRECTED

        // AppMessageService, // <-- UNCOMMENTED
        MessageService,
        provideRouter(routes),
        provideClientHydration(),
        provideAnimationsAsync(),
        providePrimeNG({
            ripple: true,
            theme: {
                preset: ModernThemePreset,
                options: {
                    darkModeSelector: 'body.dark-mode'
                },
            },
        }),
        DatePipe
    ],
};

// import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
// import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
// import { provideRouter } from '@angular/router';
// import { routes } from './app.routes';
// import { provideClientHydration } from '@angular/platform-browser';
// import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// import { providePrimeNG } from 'primeng/config';
// // import { AppMessageService } from './core/services/message.service';
// import Aura from "@primeng/themes/aura";
// import { definePreset } from "@primeng/themes";
// import { MessageService } from 'primeng/api';
// // import { AuthInterceptor } from './core/Interceptors/auth.interceptor';
// // import { ErrorInterceptor } from './core/Interceptors/error.interceptor';
// // import { LoadingInterceptor } from './core/Interceptors/loading.interceptor';
// // import { loggingInterceptor } from './core/Interceptors/logging.interceptor';
// import { DatePipe } from '@angular/common';

// const ModernThemePreset = definePreset(Aura, {
//     semantic: {
//         primary: {
//             50: 'var(--theme-accent-primary-light)',
//             100: 'var(--theme-accent-primary-light)',
//             200: 'var(--theme-accent-primary-light)',
//             300: 'var(--theme-accent-primary-light)',
//             400: 'var(--theme-accent-primary)',
//             500: 'var(--theme-accent-primary)',
//             600: 'var(--theme-accent-primary-hover)',
//             700: 'var(--theme-accent-primary-hover)',
//             800: 'var(--theme-accent-primary-hover)',
//             900: 'var(--theme-accent-primary-hover)',
//             950: 'var(--theme-accent-primary-hover)'
//         },
//         colorScheme: {
//             light: {
//                 primary: {
//                     color: 'var(--theme-accent-primary)',
//                     contrastColor: 'var(--theme-accent-text-color)',
//                     hoverColor: 'var(--theme-accent-primary-hover)',
//                     activeColor: 'var(--theme-accent-primary-hover)'
//                 },
//                 surface: {
//                     0: 'var(--theme-bg-primary)',
//                     50: 'var(--theme-bg-primary)',
//                     100: 'var(--theme-bg-secondary)',
//                     200: 'var(--theme-bg-tertiary)',
//                     300: 'var(--theme-border-primary)',
//                 }
//             },
//             dark: {
//                 primary: {
//                     color: 'var(--theme-accent-primary-light)',
//                     contrastColor: 'var(--theme-text-inverted)',
//                     hoverColor: 'var(--theme-accent-primary)',
//                     activeColor: 'var(--theme-accent-primary)'
//                 },
//                 surface: {
//                     0: 'var(--theme-bg-primary)',
//                     50: 'var(--theme-bg-primary)',
//                     100: 'var(--theme-bg-secondary)',
//                     200: 'var(--theme-bg-tertiary)',
//                     300: 'var(--theme-border-primary)',
//                 }
//             }
//         }
//     }
// });

// export const appConfig: ApplicationConfig = {
//     providers: [
//         provideHttpClient(
//             withInterceptors([]),
//             // withInterceptors([AuthInterceptor, loggingInterceptor, ErrorInterceptor, LoadingInterceptor]),
//             withFetch()
//         ),
//         provideZoneChangeDetection({ eventCoalescing: true }),
//         // AppMessageService,
//         MessageService,
//         provideRouter(routes),
//         provideClientHydration(),
//         provideAnimationsAsync(),
//         providePrimeNG({
//             ripple: true,
//             theme: {
//                 preset: ModernThemePreset,
//                 options: {
//                     darkModeSelector: 'body.dark-mode'
//                 },
//             },
//         }),
//         DatePipe
//     ],
// };

// // import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
// // import { provideRouter } from '@angular/router';

// // import { routes } from './app.routes';
// // import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

// // export const appConfig: ApplicationConfig = {
// //   providers: [
// //     provideBrowserGlobalErrorListeners(),
// //     provideZonelessChangeDetection(),
// //     provideRouter(routes), provideClientHydration(withEventReplay())
// //   ]
// // };
