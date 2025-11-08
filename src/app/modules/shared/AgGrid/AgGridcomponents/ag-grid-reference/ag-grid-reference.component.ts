import { Component } from '@angular/core';
import { DynamicCellComponent } from '../dynamic-cell/dynamic-cell.component';
import { CellChangedEvent, ICellRendererParams } from 'ag-grid-community';

export interface GridContext {
    isRowEditing: (id: string) => boolean;
    startEditingRow: (rowData: any) => void;
    saveRow: (rowData: any) => void;
    cancelEditingRow: (rowData: any) => void;
    deleteRow: (rowData: any) => void;
  }
  
@Component({
  selector: 'app-ag-grid-reference',
  imports: [],
  template: `
    <p>
      ag-grid-reference works!
    </p>
  `,
  styles: ``
})
export class AgGridReferenceComponent {

}
//   handleCellUpdate(eventData: CellChangedEvent<any>) {
//     throw new Error('Method not implemented.');
//   }
  

//   data=[
//   {
//     // type:input number
//     headerName: 'Price',
//     field: 'price',
//     editable: true,
//     cellRenderer: DynamicCellComponent,
//     cellRendererParams: (params: ICellRendererParams) => ({
//         type: 'inputnumber',
//         inputConfig: {
//             placeholder: 'Enter price',
//             min: 0,
//             max: 1000,
//             useGrouping: false,
//             minFractionDigits: 2,
//             maxFractionDigits: 4,
//             mode: 'decimal'
//         },
//         valueChangedCallback: (eventData: CellChangedEvent) => this.handleCellUpdate(eventData)
//     })
// },
// {
//   headerName: 'Start Date',
//   field: 'startDate',
//   editable: true,
//   cellRenderer: DynamicCellComponent,
//   cellRendererParams: (params: ICellRendererParams) => ({
//       type: 'datepicker',
//       inputConfig: {
//           placeholder: 'Select Start Date',
//           showButtonBar: true,
//           showTime: false,
//           timeOnly: false,
//           view: 'date', // Can also be 'month' or 'year'
//           dateFormat: 'mm/dd/yy',
//           numberOfMonths: 1, // Multiple months if needed
//           dateTemplate: {
//               condition: (date: { day: number; }) => date.day === 15
//           }
//       },
//       valueChangedCallback: (eventData: CellChangedEvent) => this.handleCellUpdate(eventData)
//   })
// },
// {
//   headerName: 'Event Time',
//   field: 'eventTime',
//   editable: true,
//   cellRenderer: DynamicCellComponent,
//   cellRendererParams: (params: ICellRendererParams) => ({
//       type: 'datepicker',
//       inputConfig: {
//           placeholder: 'Select Event Time',
//           showButtonBar: false,
//           showTime: true,
//           hourFormat: 12,
//           timeOnly: true, // For time only selection
//           view: 'date',
//           dateFormat: 'mm/dd/yy',
//           numberOfMonths: 1
//       },
//       valueChangedCallback: (eventData: CellChangedEvent) => this.handleCellUpdate(eventData)
//   })
// },
// // date picker ends



// // date picker 




//   ]
//   columnDefs = [
//     {
//       headerName: 'Integer Column',
//       field: 'integerValue', // Data field for this column
//       cellRenderer: 'yourCustomCellRenderer', // Your component name
//       cellRendererParams: {
//         type: 'keyfilteredinput', // Use the keyfiltered input type
//         inputConfig: {
//           placeholder: 'Only numbers',
//           keyFilter: 'int' // Apply the integer filter preset to this column's cells
//         }
//       }
//     },
//     {
//       headerName: 'Alphanumeric Column',
//       field: 'alphaNumericValue',
//       cellRenderer: 'yourCustomCellRenderer',
//       cellRendererParams: {
//         type: 'keyfilteredinput',
//         inputConfig: {
//           placeholder: 'Letters and numbers',
//           keyFilter: 'alphanum' // Apply the alphanumeric filter preset
//         }
//       }
//     },
//     {
//       headerName: 'No Spaces Column',
//       field: 'noSpaceValue',
//       cellRenderer: 'yourCustomCellRenderer',
//       cellRendererParams: {
//         type: 'keyfilteredinput',
//         inputConfig: {
//           placeholder: 'Cannot contain spaces',
//           keyFilter: /[^ ]/ // Apply a custom regex to this column's cells
//         }
//       }
//     }
//     // ... other columns
//   ];
  

// // Assume this is part of your component where you define columnDefs

// // Define sample options data structures needed for some types
// public cityOptions = [
//     { name: 'New York', code: 'NY' },
//     { name: 'Rome', code: 'RM' },
//     { name: 'London', code: 'LDN' },
//     { name: 'Istanbul', code: 'IST' },
//     { name: 'Paris', code: 'PRS' }
// ];

// public countryOptions = [ // Example structure for cascade select
//     {
//         name: 'USA', code: 'US', states: [
//             {
//                 name: 'California', code: 'CA', cities: [
//                     { cname: 'Los Angeles', ccode: 'LA' },
//                     { cname: 'San Diego', ccode: 'SD' }
//                 ]
//             },
//             {
//                 name: 'Texas', code: 'TX', cities: [
//                     { cname: 'Houston', ccode: 'HU' },
//                     { cname: 'Dallas', ccode: 'DL' }
//                 ]
//             }
//         ]
//     },
//     {
//         name: 'Canada', code: 'CA', states: [
//             {
//                 name: 'Quebec', code: 'QC', cities: [
//                     { cname: 'Montreal', ccode: 'MTL' },
//                     { cname: 'Quebec City', ccode: 'QBC' }
//                 ]
//             },
//             {
//                 name: 'Alberta', code: 'AB', cities: [
//                     { cname: 'Calgary', ccode: 'CAL' },
//                     { cname: 'Edmonton', ccode: 'EDM' }
//                 ]
//             }
//         ]
//     }
// ];

// // Example for Multiselect options (can be same as Select or different)
// public tagOptions = [
//     { id: 1, name: 'Angular' },
//     { id: 2, name: 'React' },
//     { id: 3, name: 'Vue' },
//     { id: 4, name: 'PrimeNG' },
//     { id: 5, name: 'ag-Grid' }
// ];

// // Example function for Datepicker custom date template condition
// public isWeekend = (date: any) => {
//     const day = date.day; // Assuming date object has 'day' property
//     const month = date.month; // Assuming date object has 'month' property
//     const year = date.year; // Assuming date object has 'year' property
//     // Simple example: mark days 10-15 as special (replace with actual weekend logic)
//     return day >= 10 && day <= 15;
// };


// public columnDefsw = [
//     // 1. Text Input Column
//     {
//         headerName: 'Name',
//         field: 'name',
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'text', // Use the 'text' type
//             inputConfig: {
//                 placeholder: 'Enter name',
//                 tooltip: 'Employee full name',
//                 disabled: false // Explicitly enable/disable
//             }
//         }
//     },
//     // Text Input Column - Readonly
//     {
//         headerName: 'Employee ID (Readonly)',
//         field: 'employeeId',
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'text',
//             inputConfig: {
//                 placeholder: 'System ID',
//                 readonly: true // Make this column read-only
//             }
//         }
//     },

//     // 2. Number Input Column
//     {
//         headerName: 'Quantity',
//         field: 'quantity',
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'number', // Use the 'number' type
//             inputConfig: {
//                 placeholder: 'Enter quantity',
//                 mode: 'decimal', // Default, but explicit
//                 useGrouping: false, // No thousand separators
//                 min: 0,
//                 max: 1000,
//                 step: 1
//             }
//         }
//     },
//      // Number Input Column - Currency
//      {
//         headerName: 'Price (USD)',
//         field: 'price',
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'number',
//             inputConfig: {
//                 placeholder: 'Enter price',
//                 mode: 'currency', // Currency mode
//                 currency: 'USD', // Specify currency (optional, default is locale)
//                 minFractionDigits: 2,
//                 maxFractionDigits: 2,
//                 prefix: '$' // Add a prefix
//             }
//         }
//     },
//      // Number Input Column - Percentage
//      {
//         headerName: 'Discount (%)',
//         field: 'discount',
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'number',
//             inputConfig: {
//                 placeholder: 'Enter discount %',
//                 mode: 'decimal',
//                 minFractionDigits: 0,
//                 maxFractionDigits: 2,
//                 min: 0,
//                 max: 100,
//                 suffix: '%' // Add a suffix
//             }
//         }
//     },


//     // 3. Select (Dropdown) Column
//     {
//         headerName: 'Assigned City',
//         field: 'assignedCity', // Field should store the selected city object or its value
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'select', // Use the 'select' type
//             options: this.cityOptions, // Pass the array of options
//             inputConfig: {
//                 optionLabel: 'name', // Display the 'name' property from options
//                 // optionValue: 'code', // Uncomment if you want the model to store the 'code'
//                 placeholder: 'Select City',
//                 showClear: true, // Allow clearing the selection
//                 filter: true, // Enable filtering in the dropdown list
//                 disabled: false
//             }
//         }
//     },
//     // Select Column - Readonly
//     {
//         headerName: 'Country Code (Readonly)',
//         field: 'countryCode',
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'select',
//              options: [
//                 { name: 'United States', code: 'US' },
//                 { name: 'Canada', code: 'CA' },
//                 { name: 'Mexico', code: 'MX' }
//             ],
//             inputConfig: {
//                 optionLabel: 'name',
//                 optionValue: 'code',
//                 placeholder: 'Select Country Code',
//                 readonly: true // Make this column read-only
//             }
//         }
//     },


//     // 4. Color Picker Column
//     {
//         headerName: 'Highlight Color',
//         field: 'highlightColor', // Field should store the color string (e.g., '#FF0000')
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'colorpicker', // Use the 'colorpicker' type
//             inputConfig: {
//                 placeholder: 'Choose color',
//                 format: 'hex', // or 'rgb', 'hsb'
//                 inline: false, // Display as a popup (default)
//                 showValue: true, // Display hex value next to picker (requires the span in template)
//                 tooltip: 'Pick a color for the row highlight'
//             }
//         }
//     },
//     // Color Picker Column - Inline
//     {
//          headerName: 'Status Color',
//          field: 'statusColor',
//          cellRenderer: 'primeNgInputCellRenderer',
//          cellRendererParams: {
//              type: 'colorpicker',
//              inputConfig: {
//                  placeholder: 'Status color',
//                  format: 'hex',
//                  inline: true // Display inline picker
//              }
//          }
//      },


//     // 5. AutoComplete Column
//     {
//         headerName: 'Search Product',
//         field: 'selectedProduct', // Field stores the selected product object or value
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'autocomplete', // Use the 'autocomplete' type
//             // options: [], // Initial empty or predefined options (will be updated by completeMethod)
//             inputConfig: {
//                 field: 'name', // Field to display from suggestion objects
//                 placeholder: 'Type to search products',
//                 minLength: 2, // Start searching after 2 characters
//                 dropdown: true, // Show all options on focus (or use button)
//                 forceSelection: false, // Allow typing text that isn't in the suggestions
//                 // disabled: true // Example: make it disabled
//             }
//             // You would need a method in your component/service
//             // that primeNgInputCellRenderer calls via completeMethod
//             // to update the 'suggestions' property based on user input.
//             // This method would typically filter the `options` array or fetch from an API.
//         }
//     },

//     // 6. CascadeSelect Column
//     {
//         headerName: 'Location',
//         field: 'location', // Field stores the selected item from the deepest level (e.g., city object)
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'cascadeselect', // Use the 'cascadeselect' type
//             options: this.countryOptions, // Pass the hierarchical options
//             inputConfig: {
//                 optionLabel: 'cname', // Display field for the final level (cities)
//                 optionGroupLabel: 'name', // Display field for grouping levels (countries, states)
//                 optionGroupChildren: ['states', 'cities'], // Hierarchy of nested properties
//                 minWidth: '18rem', // Adjust width if needed
//                 placeholder: 'Select Location',
//                 // readonly: true // Example: make it readonly
//             }
//         }
//     },

//     // 7. Checkbox Column
//     {
//         headerName: 'Is Active',
//         field: 'isActive', // Field should store a boolean value (true/false)
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'checkbox', // Use the 'checkbox' type
//             inputConfig: {
//                 binary: true, // Explicitly binary (default in template, but good to be clear)
//                 tooltip: 'Check if record is active',
//                 // disabled: true // Example: make it disabled
//             }
//         },
//         cellClass: 'flex items-center justify-center' // Optional: Center checkbox in the cell
//     },

//     // 8. Input Mask Column
//     {
//         headerName: 'Phone Number',
//         field: 'phoneNumber', // Field stores the masked string
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'inputmask', // Use the 'inputmask' type
//             inputConfig: {
//                 mask: '(999) 999-9999', // Specify the mask
//                 placeholder: '(___) ___-____',
//                 autoClear: false, // Don't clear on blur if partial
//                 // readonly: true // Example: make it readonly
//             }
//         }
//     },
//      // Input Mask Column - Date
//      {
//          headerName: 'Expiration Date',
//          field: 'expiryDateMasked',
//          cellRenderer: 'primeNgInputCellRenderer',
//          cellRendererParams: {
//              type: 'inputmask',
//              inputConfig: {
//                  mask: '99/99', // MM/YY format
//                  placeholder: '__/__'
//              }
//          }
//      },


//     // 9. Datepicker (p-datepicker) Column
//     {
//         headerName: 'Start Date',
//         field: 'startDate', // Field stores the Date object
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'datepicker', // Use the 'datepicker' type (p-datepicker)
//             inputConfig: {
//                 placeholder: 'Select start date',
//                 dateFormat: 'mm/dd/yy', // Date format
//                 showTime: false, // No time picker
//                 // disabled: true // Example: make it disabled
//             }
//         }
//     },
//     // Datepicker Column - Date with Time
//     {
//         headerName: 'Meeting Time',
//         field: 'meetingTime', // Field stores the Date object with time
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'datepicker',
//             inputConfig: {
//                 placeholder: 'Select time',
//                 showTime: true, // Show time picker
//                 timeOnly: true, // Only show time view initially
//                 hourFormat: '12', // 12-hour format
//                 dateFormat: 'hh:mm tt' // Format for time display (adjust as needed)
//             }
//         }
//     },
//      // Datepicker Column - Custom Template Example
//      {
//         headerName: 'Delivery Date (Special)',
//         field: 'deliveryDate',
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'datepicker',
//             inputConfig: {
//                 placeholder: 'Select delivery date',
//                 dateFormat: 'yy-mm-dd',
//                 // Pass the condition function for the date template
//                 dateTemplateCondition:this.isWeekend // Reference to the function defined above
//             }
//         }
//     },

//     // 10. KeyFiltered InputText Column
//     {
//         headerName: 'Integer Code',
//         field: 'intCode', // Field stores the integer string
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'keyfilteredinput', // Use the 'keyfilteredinput' type
//             inputConfig: {
//                 placeholder: 'Enter integers only',
//                 keyFilter: 'int' // Use the 'int' preset
//             }
//         }
//     },
//      // KeyFiltered InputText Column - Alphanumeric
//      {
//          headerName: 'Product Code',
//          field: 'productCode',
//          cellRenderer: 'primeNgInputCellRenderer',
//          cellRendererParams: {
//              type: 'keyfilteredinput',
//              inputConfig: {
//                  placeholder: 'Alpha-numeric only',
//                  keyFilter: 'alphanum' // Use the 'alphanum' preset
//              }
//          }
//      },
//      // KeyFiltered InputText Column - Custom Regex
//      {
//          headerName: 'Hex Color (Input)',
//          field: 'hexInput', // Field stores the hex string (without #)
//          cellRenderer: 'primeNgInputCellRenderer',
//          cellRendererParams: {
//              type: 'keyfilteredinput',
//              inputConfig: {
//                  placeholder: 'Enter hex (A-F, 0-9)',
//                  // Use a RegExp object for a custom filter
//                  keyFilter: /^[0-9a-fA-F]+$/ // Regex for hex characters
//              }
//          }
//      },


//     // 11. Knob Column
//     {
//         headerName: 'Progress (%)',
//         field: 'progress', // Field stores the number value (e.g., 75)
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'knob', // Use the 'knob' type
//             inputConfig: {
//                 min: 0,
//                 max: 100,
//                 step: 1,
//                 size: 50, // Smaller size for a grid cell
//                 valueColor: 'var(--green-500)', // Use CSS variables if defined
//                 rangeColor: 'var(--surface-300)',
//                 readonly: true // Knob often used for display, maybe readonly
//             }
//         },
//         cellClass: 'flex items-center justify-center' // Center knob in the cell
//     },


//     // 12. MultiSelect Column
//     {
//         headerName: 'Skills',
//         field: 'skills', // Field should store an array of selected skill objects or values
//         cellRenderer: 'primeNgInputCellRenderer',
//         cellRendererParams: {
//             type: 'multiselect', // Use the 'multiselect' type
//             options: this.tagOptions, // Pass the array of options
//             inputConfig: {
//                 optionLabel: 'name', // Display the 'name' property
//                 optionValue: 'id', // Store the 'id' property in the model
//                 placeholder: 'Select Skills',
//                 maxSelectedLabels: 2, // Limit the number of labels shown before '+'
//                 display: 'chip', // Display selected items as chips
//                 filter: true, // Enable filtering
//                 appendTo: 'body' // Good practice for dropdowns
//             }
//         }
//     },
//     // MultiSelect Column - Checkbox display
//     {
//         headerName: 'Categories',
//         field: 'categories',
//         cellRenderer: 'primeNgInputCellRenderer',
//          cellRendererParams: {
//              type: 'multiselect',
//              options: [ {label: 'Electronics', value: 'electronics'}, {label: 'Clothing', value: 'clothing'}, {label: 'Books', value: 'books'} ],
//              inputConfig: {
//                  optionLabel: 'label',
//                  optionValue: 'value',
//                  placeholder: 'Select Categories',
//                  display: 'checkbox', // Display as checkboxes in dropdown
//              }
//          }
//     },

//     // Default Fallback Column (e.g., for simple text display if type is unknown)
//     {
//         headerName: 'Raw Data',
//         field: 'rawData',
//         // No cellRendererParams.type means it will hit the ngSwitchDefault case
//         // cellRenderer: 'primeNgInputCellRenderer', // Still needs the renderer
//         // cellRendererParams: {
//         //     // type will be undefined, falls to default
//         //     inputConfig: {
//         //         placeholder: 'Default text input'
//         //     }
//         // }
//         // Or simply let the grid render text if no rendererParams are provided
//     },

//     // Add more columns as needed...
// ];
// // /////////////////////
// }
