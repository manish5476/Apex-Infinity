import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AppMessageService } from '../../../../core/services/message.service';
import { OrganizationService } from '../../../organization/organization.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-find-shop',
  standalone: true,
  imports: [ReactiveFormsModule, ToastModule, InputTextModule, ButtonModule, RouterLink],
  providers: [AppMessageService],
  templateUrl: './find-shop.html',
  styleUrl: './find-shop.scss'
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

    this.orgService.lookupOrganizations({ email: this.findForm.value.email! }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        // Emulate sending real time id to verify
        this.messageService.showSuccess('A verification email with your Shop ID has been sent to ' + this.findForm.value.email!);
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
