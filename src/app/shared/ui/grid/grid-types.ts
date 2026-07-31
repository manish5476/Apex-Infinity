export type GridColumnType =
    // Text & Numbers
    | 'text' | 'number' | 'currency' | 'percentage' | 'mask' | 'otp'
    // Dates & Booleans
    | 'date' | 'datetime' | 'timeago' | 'boolean' | 'toggleswitch' | 'togglebutton'
    // Selections & Tags
    | 'select' | 'selectbutton' | 'autocomplete' | 'tags'
    // Visuals & Media
    | 'badge' | 'status' | 'user' | 'avatar' | 'initials' | 'color'
    // Interactive
    | 'rating' | 'slider' | 'knob'
    // Links & Actions
    | 'email' | 'phone' | 'url' | 'action';

export interface SelectOption {
    label: string;
    value: any;
}

export interface GridColumn {
    field: string;
    header: string;
    type?: GridColumnType;
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
    editable?: boolean;
    readOnly?: boolean;

    // Standard Configs
    placeholder?: string;
    options?: SelectOption[];

    // Number/Currency Configs
    currencyCode?: string;
    min?: number;
    max?: number;
    minFractionDigits?: number;
    maxFractionDigits?: number;
    step?: number;              // For Slider/Knob

    // Date Configs
    dateFormat?: string;
    timeOnly?: boolean;
    showTime?: boolean;
    selectionMode?: 'single' | 'multiple' | 'range';

    // Input Configs
    maskPattern?: string;       // e.g. '999-99-9999'
    slotChar?: string;
    maxTags?: number;

    // Toggle Configs
    onLabel?: string;
    offLabel?: string;

    // Color Config
    colorFormat?: 'hex' | 'rgb' | 'hsb';
}
