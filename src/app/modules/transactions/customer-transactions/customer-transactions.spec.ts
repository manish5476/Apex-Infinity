import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerTransactions } from './customer-transactions';

describe('CustomerTransactions', () => {
  let component: CustomerTransactions;
  let fixture: ComponentFixture<CustomerTransactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerTransactions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerTransactions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
