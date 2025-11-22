import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierTransactions } from './supplier-transactions';

describe('SupplierTransactions', () => {
  let component: SupplierTransactions;
  let fixture: ComponentFixture<SupplierTransactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierTransactions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierTransactions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
