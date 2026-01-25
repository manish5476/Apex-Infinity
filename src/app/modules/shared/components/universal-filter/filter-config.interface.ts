// filter-config.interface.ts
export type FilterType = 'text' | 'select' | 'multiselect' | 'date' | 'date-range' | 'checkbox' | 'radio';

export interface FilterField {
  key: string;              // The key sent to the API
  label: string;            // Display label
  type: FilterType;
  
  // Data Sources
  dataSourceKey?: string;   // Dynamic: matches MasterListService signal (e.g. 'branches')
  staticOptions?: any[];    // Static: for Radio/Select (e.g. [{label: 'Yes', value: true}])
  
  // Configuration
  optionLabel?: string;     // Defaults to 'name'
  optionValue?: string;     // Defaults to '_id'
  placeholder?: string;
  defaultValue?: any;
  
  // Specific to Layout
  styleClass?: string;      // Custom class for the container
}