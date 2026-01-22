import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-section-data-source',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (sources.length > 1) {
      <div class="border p-4 rounded mb-6">
        <label>Data Source</label>

        <select [(ngModel)]="section.dataSource">
          @for (s of sources; track s) {
            <option [value]="s">{{ s }}</option>
          }
        </select>

        @if (section.dataSource === 'smart') {
          <div>
            <label>Smart Rule</label>
            <select [(ngModel)]="section.smartRuleId">
              @for (r of smartRules; track r) {
                <option [value]="r">{{ r }}</option>
              }
            </select>
          </div>
        }

        @if (section.dataSource === 'category') {
          <div>
            <label>Category Filter</label>
            <input [(ngModel)]="section.categoryFilter" />
          </div>
        }
      </div>
    }
  `
})
export class SectionDataSourceComponent {
  @Input({ required: true }) section!: any;
  @Input() sources: string[] = [];
  @Input() smartRules: string[] = [];
}
