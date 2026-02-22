# Error-Friendly Form Design Guide

Based on [Bunnyfoot's 13 Best Practices for Error-Friendly Forms](https://www.bunnyfoot.com/2024/01/13-best-practices-to-design-error-friendly-forms/), this guide ensures all forms in the application provide clear, accessible, and user-friendly error reporting.

## Core Principles

### 1. **Prevent Errors When Possible**
- Use appropriate input types (email, number, date, etc.)
- Provide clear, helpful placeholder text
- Set reasonable constraints (min/max values, length limits)
- Use inline validation hints for complex fields
- Disable submit button when form has validation errors

### 2. **Display Errors Clearly**
- **Visibility**: Errors must be immediately visible without scrolling
- **Color**: Use `text-destructive` class (red) alongside icons
- **Icons**: Use `AlertCircle` icon to reinforce error state
- **Proximity**: Error messages appear directly below/beside the field
- **Language**: Use plain, non-technical language

### 3. **Use Visual Indicators**
- **Field Highlighting**: Add red border (`border-destructive`) to invalid fields
- **Focus States**: Include `focus:border-destructive focus:ring-destructive/50` for visual feedback
- **Required Fields**: Mark with `<span className="text-destructive" aria-label="required">*</span>`
- **Field Labels**: Show whether field is required or optional

### 4. **Provide Error Context**
- **Validation Summary**: Show count of errors at top of form
- **Field-Level Errors**: Specific messages for each field error
- **Array Errors**: Handle array field validation (e.g., ingredients) with per-item errors
- **Helper Text**: Explain validation rules before submission

### 5. **Write Helpful Error Messages**
- ✅ "Recipe name is required"
- ✅ "Servings must be at least 1"
- ✅ "All ingredients must have a name"
- ❌ "Validation failed"
- ❌ "Invalid input"

### 6. **Use Proper ARIA Attributes**
- `aria-invalid="true"` on invalid fields
- `aria-describedby="field-error-id"` linking field to error message
- `role="alert"` on error summaries with `aria-live="polite"`
- `aria-label` for screen readers on form labels
- `aria-hidden="true"` on decorative icons

## Implementation Pattern

### Form Structure
```tsx
<div>
  <label htmlFor="field-id" className="mb-1 flex items-center gap-1 text-sm font-medium text-foreground">
    Field Name
    {isRequired && <span className="text-destructive" aria-label="required">*</span>}
  </label>
  
  <input
    id="field-id"
    {...register('fieldName')}
    className={`${errors.fieldName ? 'border-destructive focus:border-destructive focus:ring-destructive/50' : ''}`}
    aria-invalid={!!errors.fieldName}
    aria-describedby={errors.fieldName ? 'fieldName-error' : undefined}
  />
  
  {errors.fieldName && (
    <div id="fieldName-error" className="flex gap-1 mt-1 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
      <span>{errors.fieldName.message}</span>
    </div>
  )}
</div>
```

### Validation Summary
```tsx
{hasErrors && (
  <div 
    className="flex gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive"
    role="alert"
    aria-live="polite"
  >
    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
    <div>
      <div className="font-medium">Please fix the {errorCount} error{errorCount !== 1 ? 's' : ''}:</div>
      <ul className="mt-1 ml-0 list-disc list-inside text-xs">
        {/* List each field with error */}
      </ul>
    </div>
  </div>
)}
```

### Submit Button State
```tsx
<Button 
  type="submit" 
  disabled={isSubmitting || hasErrors}
  title={hasErrors ? 'Please fix all errors before submitting' : ''}
>
  {isSubmitting ? 'Saving…' : 'Submit'}
</Button>
```

## Common Field Patterns

### Text Input
```tsx
<input
  {...register('name')}
  placeholder="e.g. John Doe"
  className={`${errors.name ? 'border-destructive' : 'border-border'}`}
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? 'name-error' : undefined}
/>
```

### Number Input
```tsx
<input
  type="number"
  min={1}
  max={999}
  {...register('quantity', { valueAsNumber: true })}
  className={`${errors.quantity ? 'border-destructive' : 'border-border'}`}
  aria-invalid={!!errors.quantity}
  aria-describedby={errors.quantity ? 'quantity-error' : undefined}
/>
```

### Array Fields (Multiple Items)
```tsx
{items.map((_, index) => (
  <div key={index} className="flex flex-col gap-1">
    <input
      {...register(`items.${index}.name`)}
      className={`${errors.items?.[index]?.name ? 'border-destructive' : 'border-border'}`}
      aria-invalid={!!errors.items?.[index]?.name}
      aria-describedby={errors.items?.[index]?.name ? `item-${index}-error` : undefined}
    />
    {errors.items?.[index]?.name && (
      <div id={`item-${index}-error`} className="flex gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden />
        <span>{errors.items[index].name.message}</span>
      </div>
    )}
  </div>
))}
```

### Textarea
```tsx
<textarea
  {...register('description')}
  rows={4}
  className={`${errors.description ? 'border-destructive' : 'border-border'}`}
  aria-invalid={!!errors.description}
  aria-describedby={errors.description ? 'description-error' : undefined}
/>
```

## Testing Error States

### Manual Testing Checklist
- [ ] Submit empty form—all required fields show errors
- [ ] Tab through fields—focus styles visible and clear
- [ ] Fix one error—submit button remains disabled until all fixed
- [ ] Screen reader enabled—errors read aloud correctly
- [ ] Mobile view—errors visible without horizontal scroll
- [ ] Server error—shown in prominent alert above form

### Accessibility Testing
- [ ] All errors have associated labels via `aria-describedby`
- [ ] Invalid inputs marked with `aria-invalid="true"`
- [ ] Error messages use `role="alert"` with `aria-live="polite"`
- [ ] Icon decorations marked with `aria-hidden="true"`
- [ ] Focus indicators clearly visible (not hidden by error styling)

## Server-Side Errors

Server errors differ from validation errors and should be displayed differently:

```tsx
// Server error (API returned 400/500)
{serverError && (
  <div 
    className="flex gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive"
    role="alert"
    aria-live="polite"
  >
    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
    <div>{serverError}</div>
  </div>
)}
```

Common server error scenarios:
- Duplicate name/email
- Database constraint violation
- External API failure (e.g., image URL unreachable)
- Permission denied (user not authorized)

## Zod Validation Schema Best Practices

All schemas should include descriptive error messages:

```typescript
export const createRecipeSchema = z.object({
  name: z
    .string()
    .min(1, 'Recipe name is required')
    .max(200, 'Recipe name must be under 200 characters'),
  servings: z
    .number()
    .int('Servings must be a whole number')
    .min(1, 'Servings must be at least 1'),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Ingredient name is required'),
        quantity: z.string().optional(),
      })
    )
    .default([]),
});
```

## References

- [Bunnyfoot: 13 Best Practices for Error-Friendly Forms](https://www.bunnyfoot.com/2024/01/13-best-practices-to-design-error-friendly-forms/)
- [WCAG 3.3.1: Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html)
- [ARIA: alert role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Schema Validation](https://zod.dev/)
