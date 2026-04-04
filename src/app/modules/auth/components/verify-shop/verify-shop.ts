import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AppMessageService } from '../../../../core/services/message.service';
import { OrganizationService } from '../../../organization/organization.service';

@Component({
  selector: 'app-verify-shop',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, InputTextModule, ButtonModule, RouterLink],
  providers: [AppMessageService],
  templateUrl: './verify-shop.html',
  styleUrl: './verify-shop.scss'
})
export class VerifyShopComponent {
  private fb = inject(FormBuilder);
  private orgService = inject(OrganizationService);
  private messageService = inject(AppMessageService);

  isLoading = signal(false);
  orgDetails = signal<any>(null);

  verifyForm = this.fb.group({
    uniqueShopId: ['', [Validators.required]]
  });

  onSubmit() {
    if (this.verifyForm.invalid) {
      this.messageService.showWarn('Please enter a valid Shop ID.');
      return;
    }

    this.isLoading.set(true);
    this.orgDetails.set(null);

    this.orgService.getOrganizationByShopId(this.verifyForm.value.uniqueShopId!).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.orgDetails.set(res.data || res); // Depending on response format, assign real nested data if needed
        this.messageService.showSuccess('Shop verified successfully.');
      },
      error: (err) => {
        this.isLoading.set(false);
        // Explicitly handle 404s or not found errors
        this.messageService.showError(err.error?.message || 'Shop ID not found or an error occurred.');
      }
    });
  }
}
