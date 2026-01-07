import { ApplicationConfig, APP_INITIALIZER, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DatePipe } from '@angular/common';

// PrimeNG v21 official theme imports
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

// Interceptors & Services
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';
import { AuthService } from './modules/auth/services/auth-service';

/**
 * ModernThemePreset: Mapping your custom CSS tokens to PrimeNG logic
 */
const ModernThemePreset = definePreset(Aura, {
    primitive: {
        borderRadius: {
            none: '0',
            xs: 'var(--ui-border-radius-sm)',
            sm: 'var(--ui-border-radius)',
            md: 'var(--ui-border-radius-lg)',
            lg: 'var(--ui-border-radius-xl)',
            xl: '20px'
        }
    },
    semantic: {
        transitionDuration: 'var(--transition-base)',
        disabledOpacity: 'var(--state-disabled-opacity)',
        
        // Typography & Grid
        fontFamily: 'var(--font-body)',
        spacing: {
            xs: 'var(--spacing-xs)',
            sm: 'var(--spacing-sm)',
            md: 'var(--spacing-md)',
            lg: 'var(--spacing-lg)',
            xl: 'var(--spacing-xl)'
        },

        // Focus Rings
        focusRing: {
            width: 'var(--focus-ring-width)',
            style: 'solid',
            color: 'var(--focus-ring-color)',
            offset: 'var(--focus-ring-offset)',
            shadow: 'none'
        },

        // Form Controls (Set to your 13px base)
        formField: {
            paddingX: 'var(--spacing-md)',
            paddingY: 'var(--spacing-sm)',
            fontSize: 'var(--font-size-base)',
            borderRadius: 'var(--ui-border-radius-sm)',
            focusRing: {
                width: 'var(--focus-ring-width)',
                color: 'var(--focus-ring-color)'
            }
        },

        // Shadows for Overlays
        overlay: {
            select: { shadow: 'var(--shadow-md)', borderRadius: 'var(--ui-border-radius)' },
            popover: { shadow: 'var(--shadow-lg)', borderRadius: 'var(--ui-border-radius-lg)' },
            modal: { shadow: 'var(--shadow-xl)', borderRadius: 'var(--ui-border-radius-xl)' }
        }
    },
    components: {
        button: {
            root: {
                paddingX: 'var(--spacing-lg)',
                paddingY: 'var(--spacing-sm)',
                fontWeight: 'var(--font-weight-medium)',
                transition: 'var(--transition-colors)'
            }
        },
        card: {
            root: {
                shadow: 'var(--shadow-sm)',
                borderRadius: 'var(--ui-border-radius-lg)',
                padding: 'var(--spacing-xl)'
            }
        }
    }
});

/**
 * Factory function to initialize Auth state before app starts
 */
export function initializeAuth(auth: AuthService) {
    return () => auth.initializeFromStorage();
}

export const appConfig: ApplicationConfig = {
    providers: [
        // HTTP Client with full interceptor chain
        provideHttpClient(
            withInterceptors([
                jwtInterceptor,
                loggingInterceptor,
                LoadingInterceptor,
                ErrorInterceptor
            ]),
            withFetch()
        ),

        // Core Angular Configuration
        provideRouter(routes),
        provideZonelessChangeDetection(),
        provideClientHydration(),
        provideAnimationsAsync(),

        // PrimeNG Configuration
        providePrimeNG({
            ripple: true,
            theme: {
                preset: ModernThemePreset,
                options: {
                    darkModeSelector: 'body.dark-mode', // Matches your :root strategy
                    cssLayer: {
                        name: 'primeng',
                        order: 'base, primeng, utilities' // Crucial for CSS priority
                    }
                }
            }
        }),

        // Global Services
        MessageService,
        DatePipe,
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAuth,
            deps: [AuthService],
            multi: true
        }
    ]
};
// // src/app/app.config.ts
// import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
// import { provideZonelessChangeDetection } from '@angular/core';
// import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
// import { provideRouter } from '@angular/router';
// import { routes } from './app.routes';
// import { provideClientHydration } from '@angular/platform-browser';
// import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// import { providePrimeNG } from 'primeng/config';
// import Aura from '@primeng/themes/aura';
// import { definePreset } from '@primeng/themes';
// import { MessageService } from 'primeng/api';
// import { DatePipe } from '@angular/common';

// import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
// import { loggingInterceptor } from './core/interceptors/logging.interceptor';
// import { ErrorInterceptor } from './core/interceptors/error.interceptor';
// import { LoadingInterceptor } from './core/interceptors/loading.interceptor';

// import { AuthService } from './modules/auth/services/auth-service';

// const ModernThemePreset = definePreset(Aura, { /* keep your preset as before */ semantic: { /* ... */ } });

// export function initializeAuth(auth: AuthService) {
//   return () => auth.initializeFromStorage();
// }

// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideHttpClient(
//       withInterceptors([ jwtInterceptor, loggingInterceptor,  LoadingInterceptor ]),
//       // ErrorInterceptor
//       withFetch()
//     ),
//     provideRouter(routes),
//     provideZonelessChangeDetection(),
//     provideClientHydration(),
//     provideAnimationsAsync(),
//     providePrimeNG({ ripple: true, theme: { preset: ModernThemePreset, options: { darkModeSelector: 'body.dark-mode' } } }),
//     MessageService,
//     DatePipe,
//     {
//       provide: APP_INITIALIZER,
//       useFactory: initializeAuth,
//       deps: [AuthService],
//       multi: true
//     }
//   ]
// };


// // import { 
// //   ApplicationConfig, 
// //   provideZonelessChangeDetection, 
// //   APP_INITIALIZER 
// // } from '@angular/core';

// // import { 
// //   provideHttpClient, 
// //   withFetch, 
// //   withInterceptors 
// // } from '@angular/common/http';

// // import { provideRouter } from '@angular/router';
// // import { routes } from './app.routes';

// // import { provideClientHydration } from '@angular/platform-browser';
// // import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// // import { providePrimeNG } from 'primeng/config';
// // import Aura from '@primeng/themes/aura';
// // import { definePreset } from '@primeng/themes';
// // import { MessageService } from 'primeng/api';

// // import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
// // import { loggingInterceptor } from './core/interceptors/logging.interceptor';
// // import { ErrorInterceptor } from './core/interceptors/error.interceptor';
// // import { LoadingInterceptor } from './core/interceptors/loading.interceptor';

// // import { AuthService } from './modules/auth/services/auth-service';
// // import { DatePipe } from '@angular/common';


// // // ---------------------------------------------------------
// // // THE CRITICAL FIX — APP_INITIALIZER
// // // ---------------------------------------------------------

// // function initializeAuth(authService: AuthService) {
// //   return () => authService.initializeFromStorage();
// // }


// // // ---------------------------------------------------------
// // // YOUR PRIME NG CUSTOM THEME PRESET (unchanged)
// // // ---------------------------------------------------------
// // const ModernThemePreset = definePreset(Aura, {
// //   semantic: {
// //     primary: {
// //       50: 'var(--theme-accent-primary-light)',
// //       100: 'var(--theme-accent-primary-light)',
// //       200: 'var(--theme-accent-primary-light)',
// //       300: 'var(--theme-accent-primary-light)',
// //       400: 'var(--theme-accent-primary)',
// //       500: 'var(--theme-accent-primary)',
// //       600: 'var(--theme-accent-primary-hover)',
// //       700: 'var(--theme-accent-primary-hover)',
// //       800: 'var(--theme-accent-primary-hover)',
// //       900: 'var(--theme-accent-primary-hover)',
// //       950: 'var(--theme-accent-primary-hover)'
// //     },
// //     colorScheme: {
// //       light: {
// //         primary: {
// //           color: 'var(--theme-accent-primary)',
// //           contrastColor: 'var(--theme-accent-text-color)',
// //           hoverColor: 'var(--theme-accent-primary-hover)',
// //           activeColor: 'var(--theme-accent-primary-hover)'
// //         },
// //         surface: {
// //           0: 'var(--theme-bg-primary)',
// //           50: 'var(--theme-bg-primary)',
// //           100: 'var(--theme-bg-secondary)',
// //           200: 'var(--theme-bg-tertiary)',
// //           300: 'var(--theme-border-primary)',
// //         }
// //       },
// //       dark: {
// //         primary: {
// //           color: 'var(--theme-accent-primary-light)',
// //           contrastColor: 'var(--theme-text-inverted)',
// //           hoverColor: 'var(--theme-accent-primary)',
// //           activeColor: 'var(--theme-accent-primary)'
// //         },
// //         surface: {
// //           0: 'var(--theme-bg-primary)',
// //           50: 'var(--theme-bg-primary)',
// //           100: 'var(--theme-bg-secondary)',
// //           200: 'var(--theme-bg-tertiary)',
// //           300: 'var(--theme-border-primary)',
// //         }
// //       }
// //     }
// //   }
// // });


// // // ---------------------------------------------------------
// // // FINAL, CORRECT app.config.ts CONFIG
// // // ---------------------------------------------------------

// // export const appConfig: ApplicationConfig = {
// //   providers: [
    
// //     provideHttpClient(
// //       withInterceptors([
// //         jwtInterceptor,
// //         loggingInterceptor,
// //         ErrorInterceptor,
// //         LoadingInterceptor
// //       ]),
// //       withFetch()
// //     ),

// //     provideRouter(routes),
// //     provideZonelessChangeDetection(),
// //     provideClientHydration(),
// //     provideAnimationsAsync(),

// //     providePrimeNG({
// //       ripple: true,
// //       theme: {
// //         preset: ModernThemePreset,
// //         options: { darkModeSelector: 'body.dark-mode' }
// //       }
// //     }),

// //     MessageService,
// //     DatePipe,

// //     // ---------------------------------------------------------
// //     // THE FIX THAT STOPS REDIRECT ON REFRESH
// //     // ---------------------------------------------------------
// //     {
// //       provide: APP_INITIALIZER,
// //       useFactory: initializeAuth,
// //       deps: [AuthService],
// //       multi: true
// //     }
// //   ],
// // };

// // // import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core'; // <-- CORRECTED IMPORT
// // // import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
// // // import { provideRouter } from '@angular/router';
// // // import { routes } from './app.routes';
// // // import { provideClientHydration } from '@angular/platform-browser';
// // // import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// // // import { providePrimeNG } from 'primeng/config';
// // // // import { AppMessageService } from './core/services/message.service'; // <-- UNCOMMENTED
// // // import Aura from "@primeng/themes/aura";
// // // import { definePreset } from "@primeng/themes";
// // // import { MessageService } from 'primeng/api';
// // // // import { AuthInterceptor } from './core/Interceptors/auth.interceptor'; // <-- UNCOMMENTED
// // // // import { ErrorInterceptor } from './core/Interceptors/error.interceptor'; // <-- UNCOMMENTED
// // // // import { LoadingInterceptor } from './core/Interceptors/loading.interceptor'; // <-- UNCOMMENTED
// // // // import { loggingInterceptor } from './core/Interceptors/logging.interceptor'; // <-- UNCOMMENTED
// // // import { DatePipe } from '@angular/common';
// // // import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
// // // import { loggingInterceptor } from './core/interceptors/logging.interceptor';
// // // import { ErrorInterceptor } from './core/interceptors/error.interceptor';
// // // import { LoadingInterceptor } from './core/interceptors/loading.interceptor';

// // // const ModernThemePreset = definePreset(Aura, {
// // //     semantic: {
// // //         primary: {
// // //             50: 'var(--theme-accent-primary-light)',
// // //             100: 'var(--theme-accent-primary-light)',
// // //             200: 'var(--theme-accent-primary-light)',
// // //             300: 'var(--theme-accent-primary-light)',
// // //             400: 'var(--theme-accent-primary)',
// // //             500: 'var(--theme-accent-primary)',
// // //             600: 'var(--theme-accent-primary-hover)',
// // //             700: 'var(--theme-accent-primary-hover)',
// // //             800: 'var(--theme-accent-primary-hover)',
// // //             900: 'var(--theme-accent-primary-hover)',
// // //             950: 'var(--theme-accent-primary-hover)'
// // //         },
// // //         colorScheme: {
// // //             light: {
// // //                 primary: {
// // //                     color: 'var(--theme-accent-primary)',
// // //                     contrastColor: 'var(--theme-accent-text-color)',
// // //                     hoverColor: 'var(--theme-accent-primary-hover)',
// // //                     activeColor: 'var(--theme-accent-primary-hover)'
// // //                 },
// // //                 surface: {
// // //                     0: 'var(--theme-bg-primary)',
// // //                     50: 'var(--theme-bg-primary)',
// // //                     100: 'var(--theme-bg-secondary)',
// // //                     200: 'var(--theme-bg-tertiary)',
// // //                     300: 'var(--theme-border-primary)',
// // //                 }
// // //             },
// // //             dark: {
// // //                 primary: {
// // //                     color: 'var(--theme-accent-primary-light)',
// // //                     contrastColor: 'var(--theme-text-inverted)',
// // //                     hoverColor: 'var(--theme-accent-primary)',
// // //                     activeColor: 'var(--theme-accent-primary)'
// // //                 },
// // //                 surface: {
// // //                     0: 'var(--theme-bg-primary)',
// // //                     50: 'var(--theme-bg-primary)',
// // //                     100: 'var(--theme-bg-secondary)',
// // //                     200: 'var(--theme-bg-tertiary)',
// // //                     300: 'var(--theme-border-primary)',
// // //                 }
// // //             }
// // //         }
// // //     }
// // // });

// // // export const appConfig: ApplicationConfig = {
// // //     providers: [
// // //         provideHttpClient(
// // //             // Re-enabled your interceptors
// // //             withInterceptors([jwtInterceptor, loggingInterceptor, ErrorInterceptor, LoadingInterceptor]),
// // //             // withInterceptors([AuthInterceptor, loggingInterceptor, ErrorInterceptor, LoadingInterceptor]),
// // //             withFetch()
// // //         ),
        
// // //         // This is the correct function for zoneless
// // //         provideZonelessChangeDetection(), // <-- CORRECTED

// // //         // AppMessageService, // <-- UNCOMMENTED
// // //         MessageService,
// // //         provideRouter(routes),
// // //         provideClientHydration(),
// // //         provideAnimationsAsync(),
// // //         providePrimeNG({
// // //             ripple: true,
// // //             theme: {
// // //                 preset: ModernThemePreset,
// // //                 options: {
// // //                     darkModeSelector: 'body.dark-mode'
// // //                 },
// // //             },
// // //         }),
// // //         DatePipe
// // //     ],
// // // };

// // // // import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
// // // // import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
// // // // import { provideRouter } from '@angular/router';
// // // // import { routes } from './app.routes';
// // // // import { provideClientHydration } from '@angular/platform-browser';
// // // // import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// // // // import { providePrimeNG } from 'primeng/config';
// // // // // import { AppMessageService } from './core/services/message.service';
// // // // import Aura from "@primeng/themes/aura";
// // // // import { definePreset } from "@primeng/themes";
// // // // import { MessageService } from 'primeng/api';
// // // // // import { AuthInterceptor } from './core/Interceptors/auth.interceptor';
// // // // // import { ErrorInterceptor } from './core/Interceptors/error.interceptor';
// // // // // import { LoadingInterceptor } from './core/Interceptors/loading.interceptor';
// // // // // import { loggingInterceptor } from './core/Interceptors/logging.interceptor';
// // // // import { DatePipe } from '@angular/common';

// // // // const ModernThemePreset = definePreset(Aura, {
// // // //     semantic: {
// // // //         primary: {
// // // //             50: 'var(--theme-accent-primary-light)',
// // // //             100: 'var(--theme-accent-primary-light)',
// // // //             200: 'var(--theme-accent-primary-light)',
// // // //             300: 'var(--theme-accent-primary-light)',
// // // //             400: 'var(--theme-accent-primary)',
// // // //             500: 'var(--theme-accent-primary)',
// // // //             600: 'var(--theme-accent-primary-hover)',
// // // //             700: 'var(--theme-accent-primary-hover)',
// // // //             800: 'var(--theme-accent-primary-hover)',
// // // //             900: 'var(--theme-accent-primary-hover)',
// // // //             950: 'var(--theme-accent-primary-hover)'
// // // //         },
// // // //         colorScheme: {
// // // //             light: {
// // // //                 primary: {
// // // //                     color: 'var(--theme-accent-primary)',
// // // //                     contrastColor: 'var(--theme-accent-text-color)',
// // // //                     hoverColor: 'var(--theme-accent-primary-hover)',
// // // //                     activeColor: 'var(--theme-accent-primary-hover)'
// // // //                 },
// // // //                 surface: {
// // // //                     0: 'var(--theme-bg-primary)',
// // // //                     50: 'var(--theme-bg-primary)',
// // // //                     100: 'var(--theme-bg-secondary)',
// // // //                     200: 'var(--theme-bg-tertiary)',
// // // //                     300: 'var(--theme-border-primary)',
// // // //                 }
// // // //             },
// // // //             dark: {
// // // //                 primary: {
// // // //                     color: 'var(--theme-accent-primary-light)',
// // // //                     contrastColor: 'var(--theme-text-inverted)',
// // // //                     hoverColor: 'var(--theme-accent-primary)',
// // // //                     activeColor: 'var(--theme-accent-primary)'
// // // //                 },
// // // //                 surface: {
// // // //                     0: 'var(--theme-bg-primary)',
// // // //                     50: 'var(--theme-bg-primary)',
// // // //                     100: 'var(--theme-bg-secondary)',
// // // //                     200: 'var(--theme-bg-tertiary)',
// // // //                     300: 'var(--theme-border-primary)',
// // // //                 }
// // // //             }
// // // //         }
// // // //     }
// // // // });

// // // // export const appConfig: ApplicationConfig = {
// // // //     providers: [
// // // //         provideHttpClient(
// // // //             withInterceptors([]),
// // // //             // withInterceptors([AuthInterceptor, loggingInterceptor, ErrorInterceptor, LoadingInterceptor]),
// // // //             withFetch()
// // // //         ),
// // // //         provideZoneChangeDetection({ eventCoalescing: true }),
// // // //         // AppMessageService,
// // // //         MessageService,
// // // //         provideRouter(routes),
// // // //         provideClientHydration(),
// // // //         provideAnimationsAsync(),
// // // //         providePrimeNG({
// // // //             ripple: true,
// // // //             theme: {
// // // //                 preset: ModernThemePreset,
// // // //                 options: {
// // // //                     darkModeSelector: 'body.dark-mode'
// // // //                 },
// // // //             },
// // // //         }),
// // // //         DatePipe
// // // //     ],
// // // // };

// // // // // import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
// // // // // import { provideRouter } from '@angular/router';

// // // // // import { routes } from './app.routes';
// // // // // import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

// // // // // export const appConfig: ApplicationConfig = {
// // // // //   providers: [
// // // // //     provideBrowserGlobalErrorListeners(),
// // // // //     provideZonelessChangeDetection(),
// // // // //     provideRouter(routes), provideClientHydration(withEventReplay())
// // // // //   ]
// // // // // };
