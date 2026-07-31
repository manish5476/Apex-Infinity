import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-split-layout',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-screen w-full' },
  template: `
    <div class="min-h-screen w-full flex flex-col lg:flex-row bg-[var(--bg-secondary)] overflow-hidden">
      
      <!-- 1. LEFT PANE: Immersive Visual Showcase (Matches reference right side) -->
      <div class="hidden lg:flex lg:w-[50%] relative overflow-hidden bg-gray-900 flex-col justify-between p-12 shrink-0">
        <!-- Background Ambient Glow & Gradients -->
        <div class="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-slate-900 to-black z-10 pointer-events-none"></div>
        
        <div class="relative z-20 flex justify-between items-center w-full">
          <ng-content select="[visual-top]"></ng-content>
        </div>

        <div class="relative z-20 my-auto py-12">
          <ng-content select="[visual-center]"></ng-content>
        </div>

        <div class="relative z-20 flex justify-between items-center w-full">
          <ng-content select="[visual-bottom]"></ng-content>
        </div>
      </div>

      <!-- 2. RIGHT PANE: Clean Form Wizard (Matches reference left side) -->
      <div class="flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-y-auto bg-[var(--bg-primary)]">
        <div>
          <ng-content select="[form-header]"></ng-content>
        </div>

        <div class="w-full max-w-[480px] mx-auto my-auto py-6">
          <ng-content select="[form-body]"></ng-content>
        </div>

        <div>
          <ng-content select="[form-footer]"></ng-content>
        </div>
      </div>

    </div>
  `
})
export class AuthSplitLayoutComponent {}

// import { Component, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-auth-split-layout',
//   standalone: true,
//   imports: [CommonModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   host: { class: 'block min-h-screen w-full' },
//   template: `
//     <div class="min-h-screen w-full flex flex-col lg:flex-row bg-[var(--bg-secondary)] overflow-hidden">
      
//       <!-- LEFT PANE: Immersive Visual / Product Showcase -->
//       <div class="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gray-900 items-center justify-center p-12 shrink-0">
//         <!-- Background Gradients & Effects -->
//         <div class="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/30 to-black z-10 pointer-events-none"></div>
        
//         <!-- Projected Visual Content -->
//         <div class="relative z-20 w-full h-full flex flex-col justify-between">
//           <ng-content select="[visual]"></ng-content>
//         </div>
//       </div>

//       <!-- RIGHT PANE: Form / Interactive Content -->
//       <div class="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 overflow-y-auto">
//         <!-- Top Header Slot -->
//         <div>
//           <ng-content select="[header]"></ng-content>
//         </div>

//         <!-- Main Form Slot -->
//         <div class="w-full max-w-[520px] mx-auto my-auto py-6">
//           <ng-content select="[form]"></ng-content>
//         </div>

//         <!-- Footer Slot -->
//         <div>
//           <ng-content select="[footer]"></ng-content>
//         </div>
//       </div>

//     </div>
//   `
// })
// export class AuthSplitLayoutComponent {}

// // import { Component, ChangeDetectionStrategy, input } from '@angular/core';
// // import { CommonModule } from '@angular/common';

// // @Component({
// //     selector: 'app-auth-split-layout',
// //     standalone: true,
// //     imports: [CommonModule],
// //     changeDetection: ChangeDetectionStrategy.OnPush,
// //     template: `
// //     <div class="min-h-screen w-full flex bg-[var(--bg-secondary)]">
      
// //       <!-- LEFT PANE: Form / Interactive Content -->
// //       <div class="w-full lg:w-[50%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-y-auto">
// //         <!-- Optional Top Brand / Header Slot -->
// //         <div>
// //           <ng-content select="[header]"></ng-content>
// //         </div>

// //         <!-- Main Form / Content Slot -->
// //         <div class="w-full max-w-[480px] mx-auto my-auto py-8">
// //           <ng-content select="[form]"></ng-content>
// //         </div>

// //         <!-- Optional Footer Slot -->
// //         <div>
// //           <ng-content select="[footer]"></ng-content>
// //         </div>
// //       </div>

// //       <!-- RIGHT PANE: Immersive Visual / Product Showcase (Hidden on Mobile) -->
// //       <div class="hidden lg:flex lg:w-[50%] relative overflow-hidden bg-gray-900 items-center justify-center p-12">
// //         <!-- Background Glows / Gradients -->
// //         <div class="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-black z-10 pointer-events-none"></div>
        
// //         <!-- Projected Visual Content (Image, 3D card, or Banner) -->
// //         <div class="relative z-20 w-full h-full flex flex-col justify-between">
// //           <ng-content select="[visual]"></ng-content>
// //         </div>
// //       </div>

// //     </div>
// //   `
// // })
// // export class AuthSplitLayoutComponent { }