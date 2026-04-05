import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierKyc } from './supplier-kyc';

describe('SupplierKyc', () => {
  let component: SupplierKyc;
  let fixture: ComponentFixture<SupplierKyc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierKyc]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierKyc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
