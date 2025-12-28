// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-account-list',
//   imports: [],
//   templateUrl: './account-list.html',
//   styleUrl: './account-list.scss',
// })
// export class AccountList {

// }
import { Component, OnInit } from '@angular/core';
import { Account } from '../../models/account.model';
import { AccountService } from '../../accounts';
import { TableModule } from "primeng/table";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account-list',
  imports: [TableModule,CommonModule],
  templateUrl: './account-list.html',
  styleUrls: ['./account-list.scss']
})
export class AccountListComponent implements OnInit {

  accounts: Account[] = [];
  loading = false;

  constructor(private accountService: AccountService) { }

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.accountService.getAccounts().subscribe({
      next: res => {
        this.accounts = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
