import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountsTree } from './accounts-tree';

describe('AccountsTree', () => {
  let component: AccountsTree;
  let fixture: ComponentFixture<AccountsTree>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountsTree]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountsTree);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
