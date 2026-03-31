import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationHeirachyComponent } from './organization-heirachy-component';

describe('OrganizationHeirachyComponent', () => {
  let component: OrganizationHeirachyComponent;
  let fixture: ComponentFixture<OrganizationHeirachyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationHeirachyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationHeirachyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
