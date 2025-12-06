import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CustomerForm } from './customer-form';
import { CustomerService } from '../../services/customer-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CustomerForm', () => {
  let component: CustomerForm;
  let fixture: ComponentFixture<CustomerForm>;
  
  // Mocks
  let customerServiceSpy: jasmine.SpyObj<CustomerService>;
  let messageServiceSpy: jasmine.SpyObj<AppMessageService>;
  let commonMethodServiceSpy: jasmine.SpyObj<CommonMethodService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRouteMock: any;

  beforeEach(async () => {
    // 1. Create Spies
    customerServiceSpy = jasmine.createSpyObj('CustomerService', [
      'getCustomerDataWithId', 
      'createNewCustomer', 
      'updateCustomer', 
      'uploadCustomerPhoto'
    ]);
    
    messageServiceSpy = jasmine.createSpyObj('AppMessageService', ['showSuccess', 'showWarn', 'showError']);
    
    // Mock CommonMethodService.apiCall to execute the observable immediately
    commonMethodServiceSpy = jasmine.createSpyObj('CommonMethodService', ['apiCall']);
    commonMethodServiceSpy.apiCall.and.callFake((observable: any, successFn: any) => {
        observable.subscribe({
            next: (res: any) => successFn(res),
            error: (err: any) => {} // Error handling is usually strictly typed in app, simplifying for test
        });
    });

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Mock ActivatedRoute
    // Default to 'create' mode (no ID)
    activatedRouteMock = {
      snapshot: {
        paramMap: { get: () => null }, 
        queryParamMap: { get: () => null }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        CustomerForm, 
        NoopAnimationsModule // Disable PrimeNG animations for tests
      ],
      providers: [
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: AppMessageService, useValue: messageServiceSpy },
        { provide: CommonMethodService, useValue: commonMethodServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerForm);
    component = fixture.componentInstance;
  });

  // --- 1. COMPONENT CREATION ---
  it('should create the component', () => {
    fixture.detectChanges(); // triggers ngOnInit
    expect(component).toBeTruthy();
  });

  // --- 2. FORM INITIALIZATION ---
  describe('Form Initialization', () => {
    beforeEach(() => fixture.detectChanges());

    it('should initialize the form with default values', () => {
      expect(component.customerForm).toBeDefined();
      expect(component.customerForm.get('type')?.value).toBe('individual');
      expect(component.customerForm.get('billingAddress')?.value.country).toBe('India');
      expect(component.pageTitle()).toBe('Create New Customer');
    });

    it('should be invalid when empty', () => {
      expect(component.customerForm.valid).toBeFalse();
    });

    it('should validate required fields', () => {
      const nameControl = component.customerForm.get('name');
      const phoneControl = component.customerForm.get('phone');

      nameControl?.setValue('');
      phoneControl?.setValue('');

      expect(nameControl?.valid).toBeFalse();
      expect(phoneControl?.valid).toBeFalse();
      expect(nameControl?.hasError('required')).toBeTrue();
    });
  });

  // --- 3. EDIT MODE ---
  describe('Edit Mode', () => {
    it('should detect edit mode from route params and load data', () => {
      // Override the mock for this specific test
      activatedRouteMock.snapshot.paramMap.get = () => '123';
      
      const mockCustomerData = {
        _id: '123',
        name: 'John Doe',
        type: 'individual',
        phone: '1234567890',
        billingAddress: { city: 'New York' },
        avatar: 'http://img.url'
      };

      // Mock service response
      customerServiceSpy.getCustomerDataWithId.and.returnValue(of({ data: mockCustomerData }));

      // Trigger ngOnInit
      fixture.detectChanges();

      expect(component.editMode()).toBeTrue();
      expect(component.customerId()).toBe('123');
      expect(component.pageTitle()).toBe('Edit Customer');
      
      // Verify data loading
      expect(customerServiceSpy.getCustomerDataWithId).toHaveBeenCalledWith('123');
      expect(component.customerForm.get('name')?.value).toBe('John Doe');
      expect(component.currentAvatarUrl).toBe('http://img.url');
    });
  });

  // --- 4. BUSINESS LOGIC ---
  describe('Component Logic', () => {
    beforeEach(() => fixture.detectChanges());

    it('should copy billing address to shipping address', () => {
      // 1. Fill Billing
      component.customerForm.get('billingAddress')?.patchValue({
        street: '123 Main St',
        city: 'Metropolis',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      });

      // 2. Trigger Copy
      component.copyBillingAddress({ checked: true });

      // 3. Verify Shipping
      const shipping = component.customerForm.get('shippingAddress')?.value;
      expect(shipping.street).toBe('123 Main St');
      expect(shipping.city).toBe('Metropolis');
    });

    it('should reset shipping address when unchecking copy', () => {
       component.customerForm.get('shippingAddress')?.patchValue({ street: 'Old St' });
       
       component.copyBillingAddress({ checked: false });

       const shipping = component.customerForm.get('shippingAddress')?.value;
       expect(shipping.street).toBe('');
       expect(shipping.country).toBe('India'); // Default
    });

    it('should handle file upload selection', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      const event = { files: [file] };
      
      // Mock FileReader
      const mockReader = {
        readAsDataURL: jasmine.createSpy('readAsDataURL'),
        onload: null as any
      };
      spyOn(window, 'FileReader').and.returnValue(mockReader as any);

      component.onFileUpload(event);

      expect(component.customerForm.get('avatar')?.value).toBe(file);
      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(file);
    });
  });

  // --- 5. SUBMISSION (CREATE) ---
  describe('Form Submission (Create)', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show warning if form is invalid on submit', () => {
      component.onSubmit();
      expect(messageServiceSpy.showWarn).toHaveBeenCalled();
      expect(component.isSubmitting()).toBeFalse();
    });

    it('should create customer without avatar', fakeAsync(() => {
      // 1. Make form valid
      component.customerForm.patchValue({
        name: 'Jane Doe',
        phone: '9876543210',
        type: 'individual'
      });

      // 2. Mock Create API
      const mockResponse = { data: { customer: { _id: 'new-id-1' } } };
      customerServiceSpy.createNewCustomer.and.returnValue(of(mockResponse));

      // 3. Submit
      component.onSubmit();

      expect(component.isSubmitting()).toBeTrue();
      expect(customerServiceSpy.createNewCustomer).toHaveBeenCalled();
      
      // 4. Wait for router timeout
      tick(500); 
      
      expect(messageServiceSpy.showSuccess).toHaveBeenCalledWith('Created', jasmine.any(String));
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/customer']);
      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should create customer AND upload avatar if file present', fakeAsync(() => {
      const file = new File([''], 'avatar.png');
      
      component.customerForm.patchValue({
        name: 'Jane Doe',
        phone: '9876543210',
        type: 'individual',
        avatar: file
      });

      const mockCreateResponse = { data: { customer: { _id: 'new-id-1' } } };
      
      // Mock both calls
      customerServiceSpy.createNewCustomer.and.returnValue(of(mockCreateResponse));
      customerServiceSpy.uploadCustomerPhoto.and.returnValue(of({ success: true }));

      component.onSubmit();

      // Check chaining
      expect(customerServiceSpy.createNewCustomer).toHaveBeenCalled();
      expect(customerServiceSpy.uploadCustomerPhoto).toHaveBeenCalledWith('new-id-1', file);
      
      tick(500);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/customer']);
    }));
  });

  // --- 6. SUBMISSION (UPDATE) ---
  describe('Form Submission (Update)', () => {
    beforeEach(() => {
      // Force edit mode
      activatedRouteMock.snapshot.paramMap.get = () => 'existing-id';
      customerServiceSpy.getCustomerDataWithId.and.returnValue(of({ name: 'Old Name' }));
      fixture.detectChanges();
    });

    it('should call updateCustomer on submit', fakeAsync(() => {
      component.customerForm.patchValue({ name: 'New Name', phone: '111' }); // Ensure valid

      customerServiceSpy.updateCustomer.and.returnValue(of({ success: true }));

      component.onSubmit();

      expect(component.editMode()).toBeTrue();
      expect(customerServiceSpy.updateCustomer).toHaveBeenCalledWith('existing-id', jasmine.any(Object));
      
      tick(500);
      expect(messageServiceSpy.showSuccess).toHaveBeenCalledWith('Updated', jasmine.any(String));
    }));
  });
});

// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { CustomerForm } from './customer-form';

// describe('CustomerForm', () => {
//   let component: CustomerForm;
//   let fixture: ComponentFixture<CustomerForm>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [CustomerForm]
//     })
//     .compileComponents();

//     fixture = TestBed.createComponent(CustomerForm);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });
