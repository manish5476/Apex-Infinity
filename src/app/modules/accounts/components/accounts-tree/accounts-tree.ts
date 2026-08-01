import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { AccountService } from '../../accounts';
import { TreeModule } from 'primeng/tree';
import { AppMessageService } from '../../../../core/services/message.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageComponent } from '@shared/ui/layout/page/page.component';


@Component({
  selector: 'app-account-tree',
  imports: [TreeModule, PageComponent, PageHeaderComponent, PageContentComponent],
  templateUrl: './accounts-tree.html',
  styleUrl: './accounts-tree.scss',
})
export class AccountTreeComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
private messageService=inject(AppMessageService)
  treeNodes: TreeNode[] = [];
  loading = false;

  constructor(private accountService: AccountService) { }

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree(): void {
    this.loading = true;
    
    this.accountService.getAccountHierarchy().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.treeNodes = this.mapToTreeNodes(res.data);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        
        // Added your message service here to catch and display any API errors!
        this.messageService.handleHttpError(err);
      }
    });
  }
  private mapToTreeNodes(accounts: any[]): TreeNode[] {
    return accounts.map(acc => ({
      key: acc._id,
      label: `${acc.code} - ${acc.name}`,
      data: acc,
      children: acc.children?.length
        ? this.mapToTreeNodes(acc.children)
        : []
    }));
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
