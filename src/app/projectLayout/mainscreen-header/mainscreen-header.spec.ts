import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainscreenHeader } from './mainscreen-header';

describe('MainscreenHeader', () => {
  let component: MainscreenHeader;
  let fixture: ComponentFixture<MainscreenHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainscreenHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainscreenHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
