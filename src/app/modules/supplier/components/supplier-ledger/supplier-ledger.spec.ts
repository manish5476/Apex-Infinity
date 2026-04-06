import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierLedger } from './supplier-ledger';

describe('SupplierLedger', () => {
  let component: SupplierLedger;
  let fixture: ComponentFixture<SupplierLedger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierLedger]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierLedger);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
