// filter-config.interface.ts
export type FilterType = 'text' | 'select' | 'multiselect' | 'date' | 'date-range' | 'checkbox' | 'radio';

import { DropdownEndpoint } from '../../../../core/services/master-dropdown.service';

export interface FilterField {
  key: string;              // The key sent to the API
  label: string;            // Display label
  type: FilterType;

  // Data Sources
  dataSourceKey?: DropdownEndpoint;   // Dynamic: matches MasterDropdown endpoints (e.g. 'branches')
  staticOptions?: any[];    // Static: for Radio/Select (e.g. [{label: 'Yes', value: true}])

  // Configuration
  optionLabel?: string;     // Defaults to 'name'
  optionValue?: string;     // Defaults to '_id'
  placeholder?: string;
  defaultValue?: any;
  startKey?: string;        // Defaults to backend-normalized startDate for date-range fields
  endKey?: string;          // Defaults to backend-normalized endDate for date-range fields

  // Specific to Layout
  styleClass?: string;      // Custom class for the container
}
