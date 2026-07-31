# AI SHARED UI LIBRARY

------------------------------------------------------------
# Component Name

`app-status-badge` (StatusBadgeComponent)

------------------------------------------------------------
Purpose

Provides a reusable badge element.

------------------------------------------------------------
Location

src/app/shared/ui/badge/status-badge.component.ts

------------------------------------------------------------
Category

Badge

------------------------------------------------------------
Description

Standardized app-status-badge for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| status | `string` | `undefined` | true | Configure status |
| label | `string` | `''` | false | Configure label |
| variant | `BadgeVariant` | `'subtle'` | false | Configure variant |
| size | `BadgeSize` | `'md'` | false | Configure size |
| showDot | `boolean` | `true` | false | Configure showDot |
| pulse | `boolean` | `false` | false | Configure pulse |
| icon | `string` | `''` | false | Configure icon |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `status = input()`
- `label = input()`
- `variant = input()`
- `size = input()`
- `showDot = input()`
- `pulse = input()`
- `icon = input()`

------------------------------------------------------------
Content Projection

(None)


------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-status-badge></app-status-badge>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-card` (CardComponent)

------------------------------------------------------------
Purpose

Provides a reusable data element.

------------------------------------------------------------
Location

src/app/shared/ui/data/card/card.component.ts

------------------------------------------------------------
Category

Data

------------------------------------------------------------
Description

Standardized app-card for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| title | `string` | `undefined` | false | Configure title |
| subtitle | `string` | `undefined` | false | Configure subtitle |
| padded | `boolean` | `true` | false | Configure padded |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `title = input()`
- `subtitle = input()`
- `padded = input()`

------------------------------------------------------------
Content Projection

- `card-actions`
- `card-footer`
- `Default`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-card></app-card>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-glass-card` (GlassCardComponent)

------------------------------------------------------------
Purpose

Provides a reusable data element.

------------------------------------------------------------
Location

src/app/shared/ui/data/glass-card.component.ts

------------------------------------------------------------
Category

Data

------------------------------------------------------------
Description

Standardized app-glass-card for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| title | `string` | `undefined` | false | Configure title |
| padded | `boolean` | `true` | false | Configure padded |
| glow | `boolean` | `true` | false | Configure glow |
| interactive | `boolean` | `true` | false | Configure interactive |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `title = input()`
- `padded = input()`
- `glow = input()`
- `interactive = input()`

------------------------------------------------------------
Content Projection

- `card-actions`
- `Default`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-glass-card></app-glass-card>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-stat-card` (StatCardComponent)

------------------------------------------------------------
Purpose

Provides a reusable data element.

------------------------------------------------------------
Location

src/app/shared/ui/data/stat-card.component.ts

------------------------------------------------------------
Category

Data

------------------------------------------------------------
Description

Standardized app-stat-card for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| label | `string` | `undefined` | true | Configure label |
| value | `string | number` | `undefined` | true | Configure value |
| icon | `string` | `'pi pi-chart-line'` | false | Configure icon |
| change | `string` | `undefined` | false | Configure change |
| trend | `StatTrend` | `'up'` | false | Configure trend |
| variant | `StatVariant` | `'primary'` | false | Configure variant |
| description | `string` | `undefined` | false | Configure description |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `label = input()`
- `value = input()`
- `icon = input()`
- `change = input()`
- `trend = input()`
- `variant = input()`
- `description = input()`

------------------------------------------------------------
Content Projection

- `sparkline`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-stat-card></app-stat-card>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-dialog` (DialogComponent)

------------------------------------------------------------
Purpose

Provides a reusable dialog element.

------------------------------------------------------------
Location

src/app/shared/ui/dialog/dialog.component.ts

------------------------------------------------------------
Category

Dialog

------------------------------------------------------------
Description

Standardized app-dialog for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| title | `string` | `undefined` | true | Configure title |
| subtitle | `string` | `''` | false | Configure subtitle |
| size | `DialogSize` | `'md'` | false | Configure size |
| loading | `boolean` | `false` | false | Configure loading |
| submitLabel | `string` | `'Save'` | false | Configure submitLabel |
| cancelLabel | `string` | `'Cancel'` | false | Configure cancelLabel |
| submitSeverity | `'primary' | 'secondary' | 'success' | 'danger' | 'warn' | 'info'` | `'primary'` | false | Configure submitSeverity |
| showFooter | `boolean` | `true` | false | Configure showFooter |
| closable | `boolean` | `true` | false | Configure closable |
| dismissableMask | `boolean` | `false` | false | Configure dismissableMask |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| submit | `void` | Emitted when submit occurs |
| cancel | `void` | Emitted when cancel occurs |

------------------------------------------------------------
Signals

- `title = input()`
- `subtitle = input()`
- `size = input()`
- `loading = input()`
- `submitLabel = input()`
- `cancelLabel = input()`
- `submitSeverity = input()`
- `showFooter = input()`
- `closable = input()`
- `dismissableMask = input()`
- `submit = output()`
- `cancel = output()`
- `visible = model()`

------------------------------------------------------------
Content Projection

- `header-actions`
- `footer-actions`
- `Default`

------------------------------------------------------------
PrimeNG Dependencies

- `primeng/dialog`
- `primeng/button`

------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-dialog></app-dialog>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-drawer` (DrawerComponent)

------------------------------------------------------------
Purpose

Provides a reusable drawer element.

------------------------------------------------------------
Location

src/app/shared/ui/drawer/drawer.component.ts

------------------------------------------------------------
Category

Drawer

------------------------------------------------------------
Description

Standardized app-drawer for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| title | `string` | `undefined` | true | Configure title |
| subtitle | `string` | `''` | false | Configure subtitle |
| position | `DrawerPosition` | `'right'` | false | Configure position |
| size | `DrawerSize` | `'md'` | false | Configure size |
| loading | `boolean` | `false` | false | Configure loading |
| submitLabel | `string` | `'Save Changes'` | false | Configure submitLabel |
| cancelLabel | `string` | `'Cancel'` | false | Configure cancelLabel |
| submitSeverity | `'primary' | 'secondary' | 'success' | 'danger' | 'warn' | 'info'` | `'primary'` | false | Configure submitSeverity |
| showFooter | `boolean` | `true` | false | Configure showFooter |
| dismissableMask | `boolean` | `true` | false | Configure dismissableMask |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| submit | `void` | Emitted when submit occurs |
| cancel | `void` | Emitted when cancel occurs |

------------------------------------------------------------
Signals

- `title = input()`
- `subtitle = input()`
- `position = input()`
- `size = input()`
- `loading = input()`
- `submitLabel = input()`
- `cancelLabel = input()`
- `submitSeverity = input()`
- `showFooter = input()`
- `dismissableMask = input()`
- `submit = output()`
- `cancel = output()`
- `visible = model()`

------------------------------------------------------------
Content Projection

- `header-actions`
- `footer-actions`
- `Default`

------------------------------------------------------------
PrimeNG Dependencies

- `primeng/button`
- `primeng/drawer`

------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-drawer></app-drawer>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-empty-state` (EmptyStateComponent)

------------------------------------------------------------
Purpose

Provides a reusable feedback element.

------------------------------------------------------------
Location

src/app/shared/ui/feedback/empty-state/empty-state.component.ts

------------------------------------------------------------
Category

Feedback

------------------------------------------------------------
Description

Standardized app-empty-state for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| icon | `string` | `'pi pi-folder-open'` | false | Configure icon |
| title | `string` | `'No records found'` | false | Configure title |
| description | `string` | `'There is no data available to display at this time.'` | false | Configure description |
| actionLabel | `string` | `undefined` | false | Configure actionLabel |
| actionIcon | `string` | `''` | false | Configure actionIcon |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| action | `void` | Emitted when action occurs |

------------------------------------------------------------
Signals

- `icon = input()`
- `title = input()`
- `description = input()`
- `actionLabel = input()`
- `actionIcon = input()`
- `action = output()`

------------------------------------------------------------
Content Projection

- `Default`

------------------------------------------------------------
PrimeNG Dependencies

- `primeng/button`

------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-empty-state></app-empty-state>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-error-state` (ErrorStateComponent)

------------------------------------------------------------
Purpose

Provides a reusable feedback element.

------------------------------------------------------------
Location

src/app/shared/ui/feedback/error-state/error-state.component.ts

------------------------------------------------------------
Category

Feedback

------------------------------------------------------------
Description

Standardized app-error-state for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| title | `string` | `'Something went wrong'` | false | Configure title |
| description | `string` | `'An unexpected error occurred while loading this data. Please try again.'` | false | Configure description |
| retryLabel | `string` | `'Retry'` | false | Configure retryLabel |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| retry | `void` | Emitted when retry occurs |

------------------------------------------------------------
Signals

- `title = input()`
- `description = input()`
- `retryLabel = input()`
- `retry = output()`

------------------------------------------------------------
Content Projection

(None)


------------------------------------------------------------
PrimeNG Dependencies

- `primeng/button`

------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-error-state></app-error-state>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-loading` (LoadingComponent)

------------------------------------------------------------
Purpose

Provides a reusable feedback element.

------------------------------------------------------------
Location

src/app/shared/ui/feedback/loading/loading.component.ts

------------------------------------------------------------
Category

Feedback

------------------------------------------------------------
Description

Standardized app-loading for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| type | `LoadingType` | `'spinner'` | false | Configure type |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `type = input()`

------------------------------------------------------------
Content Projection

(None)


------------------------------------------------------------
PrimeNG Dependencies

- `primeng/skeleton`
- `primeng/progressspinner`

------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-loading></app-loading>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-status-badge` (StatusBadgeComponent)

------------------------------------------------------------
Purpose

Provides a reusable feedback element.

------------------------------------------------------------
Location

src/app/shared/ui/feedback/status-badge/status-badge.component.ts

------------------------------------------------------------
Category

Feedback

------------------------------------------------------------
Description

Standardized app-status-badge for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| status | `BadgeStatus` | `'neutral'` | false | Configure status |
| label | `string` | `undefined` | true | Configure label |
| icon | `string` | `undefined` | false | Configure icon |
| rounded | `boolean` | `false` | false | Configure rounded |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `status = input()`
- `label = input()`
- `icon = input()`
- `rounded = input()`

------------------------------------------------------------
Content Projection

(None)


------------------------------------------------------------
PrimeNG Dependencies

- `primeng/tag`

------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-status-badge></app-status-badge>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-file-upload` (FileUploadComponent)

------------------------------------------------------------
Purpose

Provides a reusable file-upload element.

------------------------------------------------------------
Location

src/app/shared/ui/file-upload/file-upload.component.ts

------------------------------------------------------------
Category

File-upload

------------------------------------------------------------
Description

Standardized app-file-upload for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| accept | `string` | `'*'` | false | Configure accept |
| maxFileSize | `number` | `10 * 1024 * 1024` | false | Configure maxFileSize |
| maxFiles | `number` | `5` | false | Configure maxFiles |
| multiple | `boolean` | `true` | false | Configure multiple |
| uploading | `boolean` | `false` | false | Configure uploading |
| progress | `number` | `0` | false | Configure progress |
| disabled | `boolean` | `false` | false | Configure disabled |
| hint | `string` | `''` | false | Configure hint |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| upload | `File[]` | Emitted when upload occurs |
| fileRejected | `{ file: File; reason: string }` | Emitted when fileRejected occurs |

------------------------------------------------------------
Signals

- `accept = input()`
- `maxFileSize = input()`
- `maxFiles = input()`
- `multiple = input()`
- `uploading = input()`
- `progress = input()`
- `disabled = input()`
- `hint = input()`
- `upload = output()`
- `fileRejected = output()`
- `files = model()`

------------------------------------------------------------
Content Projection

- `dropzone-icon`
- `extra-actions`

------------------------------------------------------------
PrimeNG Dependencies

- `primeng/button`
- `primeng/progressbar`
- `primeng/tooltip`

------------------------------------------------------------
Angular Dependencies

- `CommonModule`

------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-file-upload></app-file-upload>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`ui-button` (ButtonComponent)

------------------------------------------------------------
Purpose

Provides a reusable form element.

------------------------------------------------------------
Location

src/app/shared/ui/form/button.component.ts

------------------------------------------------------------
Category

Form

------------------------------------------------------------
Description

Standardized ui-button for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| label | `string` | `undefined` | true | Configure label |
| variant | `'primary' | 'secondary' | 'danger'` | `'primary'` | false | Configure variant |
| type | `'button' | 'submit'` | `'button'` | false | Configure type |
| icon | `string` | `undefined` | false | Configure icon |
| iconPosition | `'left' | 'right'` | `'left'` | false | Configure iconPosition |
| loading | `boolean` | `false` | false | Configure loading |
| disabled | `boolean` | `false` | false | Configure disabled |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| clicked | `Event` | Emitted when clicked occurs |

------------------------------------------------------------
Signals

- `label = input()`
- `variant = input()`
- `type = input()`
- `icon = input()`
- `iconPosition = input()`
- `loading = input()`
- `disabled = input()`
- `clicked = output()`

------------------------------------------------------------
Content Projection

(None)


------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

- `CommonModule`

------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<ui-button></ui-button>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-field` (FieldComponent)

------------------------------------------------------------
Purpose

Provides a reusable form element.

------------------------------------------------------------
Location

src/app/shared/ui/form/field.component.ts

------------------------------------------------------------
Category

Form

------------------------------------------------------------
Description

Standardized app-field for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| label | `string` | `undefined` | false | Configure label |
| forId | `string` | `undefined` | false | Configure forId |
| required | `boolean` | `false` | false | Configure required |
| error | `string | null` | `null` | false | Configure error |
| hint | `string` | `undefined` | false | Configure hint |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `label = input()`
- `forId = input()`
- `required = input()`
- `error = input()`
- `hint = input()`

------------------------------------------------------------
Content Projection

- `Default`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-field></app-field>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-bento-item` (BentoItemComponent)

------------------------------------------------------------
Purpose

Provides a reusable layout element.

------------------------------------------------------------
Location

src/app/shared/ui/layout/bento-grid.component.ts

------------------------------------------------------------
Category

Layout

------------------------------------------------------------
Description

Standardized app-bento-item for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| colSpan | `1 | 2 | 3 | 4` | `1` | false | Configure colSpan |
| rowSpan | `1 | 2` | `1` | false | Configure rowSpan |
| featured | `boolean` | `false` | false | Configure featured |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `colSpan = input()`
- `rowSpan = input()`
- `featured = input()`

------------------------------------------------------------
Content Projection

- `Default`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-bento-item></app-bento-item>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-page` (PageComponent)

------------------------------------------------------------
Purpose

Provides a reusable layout element.

------------------------------------------------------------
Location

src/app/shared/ui/layout/page/page.component.ts

------------------------------------------------------------
Category

Layout

------------------------------------------------------------
Description

Standardized app-page for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| (None) | | | | |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

(None)


------------------------------------------------------------
Content Projection

- `Default`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-page></app-page>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-page-actions` (PageActionsComponent)

------------------------------------------------------------
Purpose

Provides a reusable layout element.

------------------------------------------------------------
Location

src/app/shared/ui/layout/page-actions/page-actions.component.ts

------------------------------------------------------------
Category

Layout

------------------------------------------------------------
Description

Standardized app-page-actions for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| (None) | | | | |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

(None)


------------------------------------------------------------
Content Projection

- `Default`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-page-actions></app-page-actions>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-page-content` (PageContentComponent)

------------------------------------------------------------
Purpose

Provides a reusable layout element.

------------------------------------------------------------
Location

src/app/shared/ui/layout/page-content/page-content.component.ts

------------------------------------------------------------
Category

Layout

------------------------------------------------------------
Description

Standardized app-page-content for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| padded | `boolean` | `true` | false | Configure padded |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `padded = input()`

------------------------------------------------------------
Content Projection

- `Default`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-page-content></app-page-content>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-page-header` (PageHeaderComponent)

------------------------------------------------------------
Purpose

Provides a reusable layout element.

------------------------------------------------------------
Location

src/app/shared/ui/layout/page-header/page-header.component.ts

------------------------------------------------------------
Category

Layout

------------------------------------------------------------
Description

Standardized app-page-header for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| title | `string` | `undefined` | false | Configure title |
| subtitle | `string` | `undefined` | false | Configure subtitle |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `title = input()`
- `subtitle = input()`

------------------------------------------------------------
Content Projection

- `toolbar`
- `Default`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-page-header></app-page-header>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-page-toolbar` (PageToolbarComponent)

------------------------------------------------------------
Purpose

Provides a reusable layout element.

------------------------------------------------------------
Location

src/app/shared/ui/layout/page-toolbar/page-toolbar.component.ts

------------------------------------------------------------
Category

Layout

------------------------------------------------------------
Description

Standardized app-page-toolbar for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| padded | `boolean` | `true` | false | Configure padded |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `padded = input()`

------------------------------------------------------------
Content Projection

- `toolbar-left`
- `toolbar-right`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-page-toolbar></app-page-toolbar>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-auth-split-layout` (AuthSplitLayoutComponent)

------------------------------------------------------------
Purpose

Provides a reusable layout element.

------------------------------------------------------------
Location

src/app/shared/ui/layout/section/auth-split-layout.component.ts

------------------------------------------------------------
Category

Layout

------------------------------------------------------------
Description

Standardized app-auth-split-layout for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| (None) | | | | |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

(None)


------------------------------------------------------------
Content Projection

- `header`
- `form`
- `footer`
- `visual`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

- `CommonModule`

------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-auth-split-layout></app-auth-split-layout>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-section` (SectionComponent)

------------------------------------------------------------
Purpose

Provides a reusable layout element.

------------------------------------------------------------
Location

src/app/shared/ui/layout/section/section.component.ts

------------------------------------------------------------
Category

Layout

------------------------------------------------------------
Description

Standardized app-section for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| title | `string` | `''` | false | Configure title |
| description | `string` | `''` | false | Configure description |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `title = input()`
- `description = input()`

------------------------------------------------------------
Content Projection

- `Default`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-section></app-section>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-split-layout` (SplitLayoutComponent)

------------------------------------------------------------
Purpose

Provides a reusable layout element.

------------------------------------------------------------
Location

src/app/shared/ui/layout/split-layout.component.ts

------------------------------------------------------------
Category

Layout

------------------------------------------------------------
Description

Standardized app-split-layout for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| panelSizes | `number[]` | `[35, 65]` | false | Configure panelSizes |
| layout | `'horizontal' | 'vertical'` | `'horizontal'` | false | Configure layout |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `panelSizes = input()`
- `layout = input()`

------------------------------------------------------------
Content Projection

- `master`
- `detail`

------------------------------------------------------------
PrimeNG Dependencies

- `primeng/splitter`

------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-split-layout></app-split-layout>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`ui-text-input` (TextInputComponent)

------------------------------------------------------------
Purpose

Provides a reusable layout element.

------------------------------------------------------------
Location

src/app/shared/ui/layout/text-input.component.ts

------------------------------------------------------------
Category

Layout

------------------------------------------------------------
Description

Standardized ui-text-input for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| type | `'text' | 'password' | 'email' | 'tel'` | `'text'` | false | Configure type |
| placeholder | `string` | `''` | false | Configure placeholder |
| uppercase | `boolean` | `false` | false | Configure uppercase |
| showPasswordToggle | `boolean` | `false` | false | Configure showPasswordToggle |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `type = input()`
- `placeholder = input()`
- `uppercase = input()`
- `showPasswordToggle = input()`

------------------------------------------------------------
Content Projection

(None)


------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

- `CommonModule`
- `ReactiveFormsModule`
- `FormsModule`

------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<ui-text-input></ui-text-input>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-step` (StepComponent)

------------------------------------------------------------
Purpose

Provides a reusable stepper element.

------------------------------------------------------------
Location

src/app/shared/ui/stepper/step.component.ts

------------------------------------------------------------
Category

Stepper

------------------------------------------------------------
Description

Standardized app-step for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| title | `string` | `undefined` | true | Configure title |
| subtitle | `string` | `''` | false | Configure subtitle |
| icon | `string` | `''` | false | Configure icon |
| valid | `boolean` | `true` | false | Configure valid |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| (None) | | |

------------------------------------------------------------
Signals

- `title = input()`
- `subtitle = input()`
- `icon = input()`
- `valid = input()`

------------------------------------------------------------
Content Projection

- `Default`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-step></app-step>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-stepper` (StepperComponent)

------------------------------------------------------------
Purpose

Provides a reusable stepper element.

------------------------------------------------------------
Location

src/app/shared/ui/stepper/stepper.component.ts

------------------------------------------------------------
Category

Stepper

------------------------------------------------------------
Description

Standardized app-stepper for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| linear | `boolean` | `true` | false | Configure linear |
| orientation | `StepperOrientation` | `'horizontal'` | false | Configure orientation |
| loading | `boolean` | `false` | false | Configure loading |
| nextLabel | `string` | `'Continue'` | false | Configure nextLabel |
| prevLabel | `string` | `'Back'` | false | Configure prevLabel |
| completeLabel | `string` | `'Complete'` | false | Configure completeLabel |
| showFooter | `boolean` | `true` | false | Configure showFooter |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| stepChange | `{ current: number; next: number }` | Emitted when stepChange occurs |
| complete | `void` | Emitted when complete occurs |

------------------------------------------------------------
Signals

- `linear = input()`
- `orientation = input()`
- `loading = input()`
- `nextLabel = input()`
- `prevLabel = input()`
- `completeLabel = input()`
- `showFooter = input()`
- `stepChange = output()`
- `complete = output()`
- `activeIndex = model()`

------------------------------------------------------------
Content Projection

- `footer-extra`
- `Default`

------------------------------------------------------------
PrimeNG Dependencies

- `primeng/button`

------------------------------------------------------------
Angular Dependencies

- `CommonModule`

------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-stepper></app-stepper>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-filter-panel` (FilterPanelComponent)

------------------------------------------------------------
Purpose

Provides a reusable table element.

------------------------------------------------------------
Location

src/app/shared/ui/table/filter-panel.component.ts

------------------------------------------------------------
Category

Table

------------------------------------------------------------
Description

Standardized app-filter-panel for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| open | `boolean` | `false` | false | Configure open |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| apply | `void` | Emitted when apply occurs |
| reset | `void` | Emitted when reset occurs |

------------------------------------------------------------
Signals

- `open = input()`
- `apply = output()`
- `reset = output()`

------------------------------------------------------------
Content Projection

- `Default`

------------------------------------------------------------
PrimeNG Dependencies

- `primeng/button`

------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-filter-panel></app-filter-panel>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-table-toolbar` (TableToolbarComponent)

------------------------------------------------------------
Purpose

Provides a reusable table element.

------------------------------------------------------------
Location

src/app/shared/ui/table/table-toolbar.component.ts

------------------------------------------------------------
Category

Table

------------------------------------------------------------
Description

Standardized app-table-toolbar for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| searchPlaceholder | `string` | `'Search records...'` | false | Configure searchPlaceholder |
| selectedCount | `number` | `0` | false | Configure selectedCount |
| activeFilterCount | `number` | `0` | false | Configure activeFilterCount |
| showFilterToggle | `boolean` | `true` | false | Configure showFilterToggle |
| showExport | `boolean` | `true` | false | Configure showExport |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| clearSelection | `void` | Emitted when clearSelection occurs |
| export | `'csv' | 'excel' | 'pdf'` | Emitted when export occurs |

------------------------------------------------------------
Signals

- `searchPlaceholder = input()`
- `selectedCount = input()`
- `activeFilterCount = input()`
- `showFilterToggle = input()`
- `showExport = input()`
- `clearSelection = output()`
- `export = output()`
- `searchValue = model()`
- `filterOpen = model()`

------------------------------------------------------------
Content Projection

- `left-actions`
- `right-actions`

------------------------------------------------------------
PrimeNG Dependencies

- `primeng/button`
- `primeng/inputtext`
- `primeng/iconfield`
- `primeng/inputicon`
- `primeng/badge`
- `primeng/menu`
- `primeng/api`

------------------------------------------------------------
Angular Dependencies

- `ReactiveFormsModule`
- `FormsModule`

------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-table-toolbar></app-table-toolbar>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

------------------------------------------------------------
# Component Name

`app-tag` (TagComponent)

------------------------------------------------------------
Purpose

Provides a reusable tag element.

------------------------------------------------------------
Location

src/app/shared/ui/tag/tag.component.ts

------------------------------------------------------------
Category

Tag

------------------------------------------------------------
Description

Standardized app-tag for enterprise UI consistency.

------------------------------------------------------------
Inputs

| Name | Type | Default | Required | Description |
|---|---|---|---|---|
| value | `string` | `''` | false | Configure value |
| severity | `StatusSeverity` | `'neutral'` | false | Configure severity |
| variant | `BadgeVariant` | `'subtle'` | false | Configure variant |
| removable | `boolean` | `false` | false | Configure removable |
| icon | `string` | `''` | false | Configure icon |

------------------------------------------------------------
Outputs

| Name | Type | Description |
|---|---|---|
| remove | `void` | Emitted when remove occurs |

------------------------------------------------------------
Signals

- `value = input()`
- `severity = input()`
- `variant = input()`
- `removable = input()`
- `icon = input()`
- `remove = output()`

------------------------------------------------------------
Content Projection

- `Default`

------------------------------------------------------------
PrimeNG Dependencies

(None)


------------------------------------------------------------
Angular Dependencies

(None)


------------------------------------------------------------
Tailwind Classes

Uses flexbox/grid for internal alignment. Theme relies on Tailwind classes matching Figma.

------------------------------------------------------------
Theme Tokens

Uses global design system CSS variables like `--text-primary`, `--color-primary`, `--bg-primary`.

------------------------------------------------------------
Example Usage

```html
<app-tag></app-tag>
```

------------------------------------------------------------
Best Practices

- Use signals for reactive updates.
- Do not override internal styles using `::ng-deep` unless absolutely necessary.

------------------------------------------------------------
Responsive Behaviour

- Desktop: Full layout
- Tablet: Adapts to medium container
- Mobile: Stacks vertically (flex-col)

------------------------------------------------------------
Accessibility

- Ensure ARIA labels are passed via inputs where applicable.
- Fully keyboard navigable.

------------------------------------------------------------
Variants

Check inputs for variants like size, severity, or layout mode.

------------------------------------------------------------
Used By

(See Component Matrix)

------------------------------------------------------------
Related Components

Often used with layout wrappers.

------------------------------------------------------------
Migration Notes

Replaces legacy ng-bootstrap or older PrimeNG non-standalone usage.

------------------------------------------------------------
Improvement Opportunities

- Add stricter type constraints for slots.
- Introduce Storybook integration.

====================================================
# COMPONENT TREE

Shared UI
├── BADGE
│   ├── app-status-badge
├── DATA
│   ├── app-card
│   ├── app-glass-card
│   ├── app-stat-card
├── DIALOG
│   ├── app-dialog
├── DRAWER
│   ├── app-drawer
├── FEEDBACK
│   ├── app-empty-state
│   ├── app-error-state
│   ├── app-loading
│   ├── app-status-badge
├── FILE-UPLOAD
│   ├── app-file-upload
├── FORM
│   ├── ui-button
│   ├── app-field
├── LAYOUT
│   ├── app-bento-item
│   ├── app-page
│   ├── app-page-actions
│   ├── app-page-content
│   ├── app-page-header
│   ├── app-page-toolbar
│   ├── app-auth-split-layout
│   ├── app-section
│   ├── app-split-layout
│   ├── ui-text-input
├── STEPPER
│   ├── app-step
│   ├── app-stepper
├── TABLE
│   ├── app-filter-panel
│   ├── app-table-toolbar
├── TAG
│   ├── app-tag

====================================================
# COMPONENT MATRIX

| Component | Category | Inputs | Outputs | Status |
|---|---|---|---|---|
| `app-status-badge` | badge | 7 | 0 | Active |
| `app-card` | data | 3 | 0 | Active |
| `app-glass-card` | data | 4 | 0 | Active |
| `app-stat-card` | data | 7 | 0 | Active |
| `app-dialog` | dialog | 10 | 2 | Active |
| `app-drawer` | drawer | 10 | 2 | Active |
| `app-empty-state` | feedback | 5 | 1 | Active |
| `app-error-state` | feedback | 3 | 1 | Active |
| `app-loading` | feedback | 1 | 0 | Active |
| `app-status-badge` | feedback | 4 | 0 | Active |
| `app-file-upload` | file-upload | 8 | 2 | Active |
| `ui-button` | form | 7 | 1 | Active |
| `app-field` | form | 5 | 0 | Active |
| `app-bento-item` | layout | 3 | 0 | Active |
| `app-page` | layout | 0 | 0 | Active |
| `app-page-actions` | layout | 0 | 0 | Active |
| `app-page-content` | layout | 1 | 0 | Active |
| `app-page-header` | layout | 2 | 0 | Active |
| `app-page-toolbar` | layout | 1 | 0 | Active |
| `app-auth-split-layout` | layout | 0 | 0 | Active |
| `app-section` | layout | 2 | 0 | Active |
| `app-split-layout` | layout | 2 | 0 | Active |
| `ui-text-input` | layout | 4 | 0 | Active |
| `app-step` | stepper | 4 | 0 | Active |
| `app-stepper` | stepper | 7 | 2 | Active |
| `app-filter-panel` | table | 1 | 2 | Active |
| `app-table-toolbar` | table | 5 | 2 | Active |
| `app-tag` | tag | 5 | 1 | Active |

====================================================
# DUPLICATE REPORT

| Old HTML | Recommended Component | Priority | Estimated Duplicated Lines |
|---|---|---|---|
| `<div class="card">...` | `ui-card` | High | 150 |
| `<p-dialog>` (inline) | `ui-dialog` | Medium | 80 |
| `<button class="btn">` | `ui-button` | High | 300 |

====================================================
# MISSING COMPONENTS

- `app-avatar`
- `app-chip`
- `app-confirm-dialog`
- `app-page-filter`
- `app-page-title`
- `app-data-list`
- `app-metric-card`
- `app-upload-zone`

====================================================
# SHARED DESIGN SYSTEM

- **Typography**: Inter (Body), Outfit (Headings)
- **Spacing**: Tailwind default spacing (2, 4, 8, 16, 24, 32)
- **Colors**: CSS variables mapped to Tailwind (e.g. `--color-primary`)
- **Radius**: `--ui-border-radius`
- **Shadows**: `--shadow-sm`, `--elevation-1`
- **Animations**: Standard ease-in-out transitions
- **Theme Tokens**: Extensively used in all standalone components.

====================================================
# MIGRATION STATUS

| Feature | Shared Components Used | Needs Migration |
|---|---|---|
| Organization Setup | Yes | No |
| Auth Flow | Yes | No |
| Legacy Modules | No | Yes |

