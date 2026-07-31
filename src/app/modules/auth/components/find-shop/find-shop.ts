import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

// Services
import { AppMessageService } from '../../../../core/services/message.service';
import { OrganizationService } from '../../../organization/organization.service';

// UI Components (Shared)
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { FloatingSplitLayoutComponent } from '@shared/ui/layout/floating-split-layout.component';
import { FieldComponent } from '@shared/ui/form/field.component';
import { ButtonComponent } from '@shared/ui/form/button.component';
import { StatusBadgeComponent } from '@shared/ui/badge/status-badge.component';

@Component({
  selector: 'app-find-shop',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    // PrimeNG
    ToastModule,
    InputTextModule,
    // UI Components
    PageComponent,
    FloatingSplitLayoutComponent,
    FieldComponent,
    ButtonComponent,
    StatusBadgeComponent,
  ],
  providers: [AppMessageService, MessageService],
  templateUrl: './find-shop.html',
  styleUrls: ['./find-shop.scss']
})
export class FindShopComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private orgService = inject(OrganizationService);
  private messageService = inject(AppMessageService);

  isLoading = signal(false);

  findForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit() {
    if (this.findForm.invalid) {
      this.messageService.showWarn('Please enter a valid email address.');
      return;
    }

    this.isLoading.set(true);

    this.orgService.lookupOrganizations({ email: this.findForm.value.email! })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.messageService.showSuccess(
            'A verification email with your Shop ID has been sent to ' + this.findForm.value.email!
          );
          this.findForm.reset();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.messageService.handleHttpError(err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}