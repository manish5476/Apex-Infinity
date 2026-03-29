import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelExport } from './excel-export';

describe('ExcelExport', () => {
  let component: ExcelExport;
  let fixture: ComponentFixture<ExcelExport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcelExport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelExport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
