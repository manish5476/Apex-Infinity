import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierDataPrint } from './supplier-data-print';

describe('SupplierDataPrint', () => {
  let component: SupplierDataPrint;
  let fixture: ComponentFixture<SupplierDataPrint>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierDataPrint]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierDataPrint);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
