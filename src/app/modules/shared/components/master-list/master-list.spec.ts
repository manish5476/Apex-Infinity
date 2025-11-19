import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterList } from './master-list';

describe('MasterList', () => {
  let component: MasterList;
  let fixture: ComponentFixture<MasterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
