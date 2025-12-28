import { Component, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { AccountService } from '../../accounts';
import { TreeModule } from 'primeng/tree';
@Component({
  selector: 'app-account-tree',
  imports: [TreeModule],
  templateUrl: './accounts-tree.html',
  styleUrl: './accounts-tree.scss',
})
export class AccountTreeComponent implements OnInit {

  treeNodes: TreeNode[] = [];
  loading = false;

  constructor(private accountService: AccountService) { }

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree(): void {
    this.loading = true;
    this.accountService.getAccountHierarchy().subscribe({
      next: res => {
        this.treeNodes = this.mapToTreeNodes(res.data);
        this.loading = false;
      },
      error: () => this.loading = false
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
}
