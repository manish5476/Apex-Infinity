import { Component, computed, signal, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { EntityCardComponent } from './entity-card/entity-card';
import { PermissionService } from '@core/auth/services/permission.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';

interface CreateEntity {
  title: string;
  icon: string;
  description: string;
  createRoute: string[];
  category: string;
  permissions?: string[];
}

@Component({
  selector: 'app-create-dashboard',
  standalone: true,
  imports: [FormsModule, EntityCardComponent],
  templateUrl: './create-dashboard.html',
  styleUrl: './create-dashboard.scss'
})
export class CreateDashboardComponent {
  private permService = inject(PermissionService);

  searchQuery = signal('');
  activeCategory = signal('All');

  categories = ['All', 'Sales & Billing', 'Inventory & Purchase', 'HRMS', 'Workspace', 'Administration'];

  private allEntities: CreateEntity[] = [
    {
      title: 'Scan Invoice (POS)',
      icon: 'pi pi-shopping-cart',
      description: 'Quickly scan items and generate a Point of Sale invoice.',
      createRoute: ['/invoices/PosInvoiceComponent'],
      category: 'Sales & Billing',
      permissions: [PERMISSIONS.INVOICE.CREATE]
    },
    {
      title: 'Standard Invoice',
      icon: 'pi pi-file-edit',
      description: 'Create a detailed standard invoice for a customer.',
      createRoute: ['/invoices/create'],
      category: 'Sales & Billing',
      permissions: [PERMISSIONS.INVOICE.CREATE]
    },
    {
      title: 'New Product',
      icon: 'pi pi-box',
      description: 'Add a new product to your inventory system.',
      createRoute: ['/product/create'],
      category: 'Inventory & Purchase',
      permissions: [PERMISSIONS.PRODUCT.CREATE]
    },
    {
      title: 'Purchase Order',
      icon: 'pi pi-truck',
      description: 'Create a new purchase order for your suppliers.',
      createRoute: ['/purchase/create'],
      category: 'Inventory & Purchase',
      permissions: [PERMISSIONS.PURCHASE.CREATE]
    },
    {
      title: 'New Department',
      icon: 'pi pi-building',
      description: 'Configure a new organizational department.',
      createRoute: ['/hrms/department/new'],
      category: 'HRMS',
      permissions: [PERMISSIONS.DEPARTMENT.MANAGE]
    },
    {
      title: 'New Designation',
      icon: 'pi pi-id-card',
      description: 'Create a new job role or designation.',
      createRoute: ['/hrms/designation/new'],
      category: 'HRMS',
      permissions: [PERMISSIONS.DESIGNATION.MANAGE]
    },
    {
      title: 'Onboard User',
      icon: 'pi pi-user-plus',
      description: 'Add a new employee or user to the system.',
      createRoute: ['/user/create'],
      category: 'Administration',
      permissions: [PERMISSIONS.USER.MANAGE]
    },
    {
      title: 'New Note',
      icon: 'pi pi-pen-to-square',
      description: 'Jot down a new note or memo.',
      createRoute: ['/notes/create'],
      category: 'Workspace',
      permissions: [PERMISSIONS.NOTE.WRITE]
    }
  ];

  filteredEntities = computed(() => {
    // 1. Filter by permissions
    let entities = this.allEntities.filter(entity => {
       if (!entity.permissions) return true;
       return this.permService.check(entity.permissions);
    });

    // 2. Filter by category
    const cat = this.activeCategory();
    if (cat !== 'All') {
      entities = entities.filter(e => e.category === cat);
    }

    // 3. Filter by search query
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      entities = entities.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q)
      );
    }

    return entities;
  });

  setCategory(cat: string) {
    this.activeCategory.set(cat);
  }
}
