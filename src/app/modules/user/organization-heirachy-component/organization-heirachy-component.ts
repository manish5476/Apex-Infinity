import { Component, inject, OnInit, signal, WritableSignal, OnDestroy } from '@angular/core';

import { UserManagementService } from '../user-management.service';
import { catchError, map, of, Subject } from 'rxjs';

// PrimeNG Modules
import { OrganizationChartModule } from 'primeng/organizationchart';
import { TreeNode } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { takeUntil } from "rxjs/operators";

interface OrgUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  employeeProfile: {
    departmentId?: { _id: string; name: string };
    designationId?: { _id: string; title: string; level: number };
    reportingManagerId?: string | null;
  };
  reportees: OrgUser[];
}

@Component({
  selector: 'app-org-hierarchy',
  standalone: true,
  imports: [OrganizationChartModule, SkeletonModule, TooltipModule, BadgeModule],
  templateUrl: './organization-heirachy-component.html',
  styleUrls: ['./organization-heirachy-component.scss']
})
export class OrgHierarchyComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private userService = inject(UserManagementService);

  treeNodes: WritableSignal<TreeNode[]> = signal([]);
  selectedNodes: TreeNode[] = []; // Handles multiple selection

  totalUsers = signal<number>(0);
  maxDepth = signal<number>(0);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.loadHierarchy();
  }

  loadHierarchy() {
    this.isLoading.set(true);
    this.userService.getOrgHierarchy().pipe(
      catchError((err) => {
        console.error('Failed to load hierarchy', err);
        return of(null);
      }), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      this.isLoading.set(false);
      if (res?.data) {
        this.totalUsers.set(res.data.totalUsers || 0);
        this.maxDepth.set(res.data.maxDepth || 0);
        this.treeNodes.set(this.buildTree(res.data.hierarchy || []));
      }
    });
  }

  private buildTree(users: OrgUser[]): TreeNode[] {
    return users.map(user => ({
      expanded: true, // Collapsible is true, but start expanded
      type: 'person',
      data: user,
      children: user.reportees && user.reportees.length > 0 ? this.buildTree(user.reportees) : []
    }));
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}