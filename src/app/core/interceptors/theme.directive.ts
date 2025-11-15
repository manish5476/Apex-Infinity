// // ============================
// // THEME DIRECTIVE
// // Structural directive for theme-specific styling
// // ============================

// import { Directive, Input, type OnInit, type OnDestroy, TemplateRef, ViewContainerRef } from "@angular/core"
// import { ThemeService, type ThemeType } from "../services/theme.service"
// import { Subject } from "rxjs"
// import { takeUntil } from "rxjs/operators"

// @Directive({
//   selector: "[appTheme]",
//   standalone: true,
// })
// export class ThemeDirective implements OnInit, OnDestroy {
//   @Input() appTheme!: ThemeType

//   private destroy$ = new Subject<void>()

//   constructor(
//     private templateRef: TemplateRef<any>,
//     private viewContainer: ViewContainerRef,
//     private themeService: ThemeService,
//   ) {}

//   ngOnInit(): void {
//     this.themeService
//       .getTheme$()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((theme) => {
//         if (theme === this.appTheme) {
//           this.viewContainer.createEmbeddedView(this.templateRef)
//         } else {
//           this.viewContainer.clear()
//         }
//       })
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next()
//     this.destroy$.complete()
//   }
// }
