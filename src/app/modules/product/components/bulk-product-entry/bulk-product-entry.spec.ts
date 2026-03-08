import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkProductEntry } from './bulk-product-entry';

describe('BulkProductEntry', () => {
  let component: BulkProductEntry;
  let fixture: ComponentFixture<BulkProductEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkProductEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulkProductEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
