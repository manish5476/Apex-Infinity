import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DataGridComponent } from './data-grid.component';
import { GridColumn, SharedGridEvent, GridPageState } from '../grid-types';

interface TestRow {
  id: string;
  name: string;
  amount: number;
  status: string;
}

describe('DataGridComponent', () => {
  let fixture: ComponentFixture<DataGridComponent<TestRow>>;
  let component: DataGridComponent<TestRow>;

  const mockColumns: GridColumn<TestRow>[] = [
    { field: 'id', header: 'ID', width: 80, minWidth: 60 },
    { field: 'name', header: 'Name', width: '200px', minWidth: '150px' },
    { field: 'amount', header: 'Amount', width: 120, type: 'currency' },
    { field: 'status', header: 'Status', width: '100px', type: 'badge' },
  ];

  const mockData: TestRow[] = [
    { id: '1', name: 'Alpha', amount: 1500, status: 'active' },
    { id: '2', name: 'Beta', amount: 2500, status: 'pending' },
    { id: '3', name: 'Gamma', amount: 3500, status: 'completed' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataGridComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DataGridComponent<TestRow>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('dataKey', 'id');
    fixture.detectChanges();
  });

  it('should create the DataGridComponent', () => {
    expect(component).toBeTruthy();
  });

  describe('CSS Grid Track Sizing & Units', () => {
    it('should format number column widths with px units', () => {
      const template = component.gridTemplateColumns();
      expect(template).toBeDefined();
      expect(template).toContain('minmax(60px, 80px)');
      expect(template).toContain('minmax(150px, 200px)');
      expect(template).toContain('minmax(100px, 120px)');
    });
  });

  describe('GridEvent Output Bridge', () => {
    it('should emit init event on ngAfterViewInit', () => {
      let emittedEvent: SharedGridEvent<TestRow> | undefined;
      component.gridEvent.subscribe(evt => {
        if (evt.type === 'init') {
          emittedEvent = evt;
        }
      });

      component.ngAfterViewInit();
      expect(emittedEvent).toBeDefined();
      if (emittedEvent && emittedEvent.type === 'init') {
        expect(typeof emittedEvent.api?.applyTransaction).toBe('function');
        expect(typeof emittedEvent.api?.getSelectedRows).toBe('function');
        expect(typeof emittedEvent.api?.refresh).toBe('function');
      }
    });

    it('should emit cellClicked event when onCellClick is called', () => {
      let emittedEvent: SharedGridEvent<TestRow> | undefined;
      component.gridEvent.subscribe(evt => (emittedEvent = evt));

      const col = mockColumns[1];
      const row = mockData[0];
      const mouseEvent = new MouseEvent('click');

      component.onCellClick(row, col, mouseEvent);

      expect(emittedEvent).toBeDefined();
      if (emittedEvent && emittedEvent.type === 'cellClicked') {
        expect(emittedEvent.field).toBe('name');
        expect(emittedEvent.value).toBe('Alpha');
        expect(emittedEvent.row).toEqual(row);
      }
    });

    it('should emit rowClicked event on row click', () => {
      let emittedEvent: SharedGridEvent<TestRow> | undefined;
      component.gridEvent.subscribe(evt => (emittedEvent = evt));

      const row = mockData[1];
      const mouseEvent = new MouseEvent('click');

      component.onRowClick(row, mouseEvent);

      expect(emittedEvent).toBeDefined();
      if (emittedEvent && emittedEvent.type === 'rowClicked') {
        expect(emittedEvent.row).toEqual(row);
      }
    });

    it('should emit rowDoubleClicked event on row double click', () => {
      let emittedEvent: SharedGridEvent<TestRow> | undefined;
      component.gridEvent.subscribe(evt => (emittedEvent = evt));

      const row = mockData[0];
      component.onRowDoubleClick(row);

      expect(emittedEvent).toBeDefined();
      if (emittedEvent && emittedEvent.type === 'rowDoubleClicked') {
        expect(emittedEvent.row).toEqual(row);
      }
    });

    it('should emit delete event on onDeleteRow', () => {
      let emittedEvent: SharedGridEvent<TestRow> | undefined;
      component.gridEvent.subscribe(evt => (emittedEvent = evt));

      const row = mockData[2];
      component.onDeleteRow(row);

      expect(emittedEvent).toBeDefined();
      if (emittedEvent && emittedEvent.type === 'delete') {
        expect(emittedEvent.row).toEqual(row);
      }
    });
  });

  describe('Selection Modes', () => {
    it('should support single selection mode', () => {
      fixture.componentRef.setInput('selectionMode', 'single');
      fixture.detectChanges();

      const mouseEvent = new MouseEvent('click');
      component.onRowClick(mockData[0], mouseEvent);

      expect(component.selectedRowIds().size).toBe(1);
      expect(component.selectedRowIds().has('1')).toBeTrue();

      // Clicking another row in single selection replaces the selection
      component.onRowClick(mockData[1], mouseEvent);
      expect(component.selectedRowIds().size).toBe(1);
      expect(component.selectedRowIds().has('2')).toBeTrue();
      expect(component.selectedRowIds().has('1')).toBeFalse();
    });

    it('should support multiple selection mode with checkboxes and select all', () => {
      fixture.componentRef.setInput('rowSelection', true);
      fixture.componentRef.setInput('selectionMode', 'multiple');
      fixture.detectChanges();

      component.onSelectAll(true);
      expect(component.selectedRowIds().size).toBe(3);
      expect(component.allSelected()).toBeTrue();

      component.clearSelection();
      expect(component.selectedRowIds().size).toBe(0);
      expect(component.allSelected()).toBeFalse();
    });
  });

  describe('Pagination State & Numbering', () => {
    it('should emit pageChange with 0-indexed page and 1-indexed pageNumber', () => {
      let emittedState: GridPageState | undefined;
      component.pageChange.subscribe(state => (emittedState = state));

      component.onPageChange({ page: 2, pageSize: 25, total: 100 });

      expect(emittedState).toBeDefined();
      expect(emittedState?.page).toBe(2);
      expect(emittedState?.pageSize).toBe(25);
      expect(emittedState?.pageNumber).toBe(3);
    });
  });

  describe('Scroll Synchronization', () => {
    it('should sync body scroll to headerWrapper without recursion', () => {
      const headerEl = document.createElement('div');
      component.headerWrapper = { nativeElement: headerEl } as any;

      const bodyEl = document.createElement('div');
      bodyEl.scrollLeft = 120;

      component.onBodyScroll({ target: bodyEl } as any);

      expect(headerEl.scrollLeft).toBe(120);
    });
  });
});
