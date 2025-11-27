// import { Component } from '@angular/core';

// @Component({
// selector: 'app-logs',
// imports: [],
// templateUrl: './logs.html',
// styleUrl: './logs.scss',
// })
// export class Logs {

// }
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { TransactionService } from '../transaction.service';
import { Button } from "primeng/button";
import { DatePicker } from "primeng/datepicker";
import { Select } from "primeng/select";
import { FormsModule } from '@angular/forms';
import { Toast } from "primeng/toast";
import { SharedGridComponent } from '../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { CommonModule } from '@angular/common';
import { CommonMethodService } from '../../../core/utils/common-method.service';
@Component({
  selector: 'app-logs',
  imports: [Button, DatePicker, Select, FormsModule, SharedGridComponent, CommonModule, Toast],
  templateUrl: './logs.html',
  styleUrl: './logs.scss',
})
export class LogsComponent implements OnInit {

  private logsService = inject(TransactionService);
  private cdr = inject(ChangeDetectorRef);
  private common = inject(CommonMethodService);

  logs: any[] = [];
  column: any
  logFiles = [
    { label: "Combined", value: "combined" },
    { label: "Errors", value: "error" },
    { label: "Exceptions", value: "exceptions" },
    { label: "Rejections", value: "rejections" },
  ];

  filters: any = {
    file: 'combined',
    search: '',
    limit: 200,
  };

  dateRange: Date[] | null = null;

  ngOnInit(): void {
    this.getLogs();
  }

  applyFilters() {
    this.getLogs();
  }

  resetFilters() {
    this.filters = {
      file: 'combined',
      search: '',
      limit: 200,
    };
    this.dateRange = null;
    this.getLogs();
  }

  getLogs() {
    const params: any = { ...this.filters };

    if (this.dateRange && this.dateRange.length === 2) {
      if (this.dateRange[0])
        params.startDate = this.format(this.dateRange[0]);
      if (this.dateRange[1])
        params.endDate = this.format(this.dateRange[1]);
    }

    this.logsService.getLogs(params).subscribe(res => {
      this.logs = res.content
      this.cdr.detectChanges();
    });
  }

  private format(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  }


  returnCol() {
    this.column = [
      {
        field: 'timestamp',
        headerName: 'Timestamp',
        sortable: true,
        width: 200,
        valueFormatter: (params: any) =>
          this.common.formatDate(params.value, 'dd MMM yyyy, hh:mm:ss a'),
      },
      {
        field: 'level',
        headerName: 'Level',
        sortable: true,
        width: 120,
        cellStyle: (p: any) => ({
          'font-weight': '600',
          'text-transform': 'uppercase',
          color:
            p.value === 'error'
              ? '#b30000'
              : p.value === 'warn'
                ? '#cc7a00'
                : '#0047b3',
        }),
      },
      {
        field: 'message',
        headerName: 'Message',
        flex: 1,
        wrapText: true,
        autoHeight: true
      }
    ];

  }
}
