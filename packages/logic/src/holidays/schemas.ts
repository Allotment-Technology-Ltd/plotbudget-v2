import { z } from 'zod';

export const tripStatusSchema = z.enum([
  'draft',
  'planning',
  'booked',
  'in_progress',
  'completed',
  'cancelled',
]);
export type TripStatus = z.infer<typeof tripStatusSchema>;

export const createTripSchema = z.object({
  name: z
    .string()
    .min(1, 'Trip name is required')
    .max(200, 'Trip name must be under 200 characters'),
  destination: z
    .string()
    .min(1, 'Destination is required')
    .max(200, 'Destination must be under 200 characters'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  status: tripStatusSchema.optional(),
  linked_pot_id: z.string().uuid('Linked pot ID must be a valid UUID').optional().nullable(),
  linked_project_id: z
    .string()
    .uuid('Linked project ID must be a valid UUID')
    .optional()
    .nullable(),
  currency: z
    .string()
    .min(1, 'Currency is required')
    .max(10, 'Currency code must be under 10 characters')
    .optional(),
  notes: z.string().max(5000, 'Notes must be under 5000 characters').optional().nullable(),
  cover_image_url: z
    .string()
    .url('Cover image must be a valid URL')
    .max(2000, 'Cover image URL must be under 2000 characters')
    .optional()
    .nullable(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const updateTripSchema = z.object({
  id: z.string().uuid('Trip ID must be a valid UUID'),
  name: z
    .string()
    .min(1, 'Trip name is required')
    .max(200, 'Trip name must be under 200 characters')
    .optional(),
  destination: z
    .string()
    .min(1, 'Destination is required')
    .max(200, 'Destination must be under 200 characters')
    .optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  status: tripStatusSchema.optional(),
  linked_pot_id: z.string().uuid('Linked pot ID must be a valid UUID').optional().nullable(),
  linked_project_id: z
    .string()
    .uuid('Linked project ID must be a valid UUID')
    .optional()
    .nullable(),
  currency: z
    .string()
    .min(1, 'Currency is required')
    .max(10, 'Currency code must be under 10 characters')
    .optional(),
  notes: z.string().max(5000, 'Notes must be under 5000 characters').optional().nullable(),
  cover_image_url: z
    .string()
    .url('Cover image must be a valid URL')
    .max(2000, 'Cover image URL must be under 2000 characters')
    .optional()
    .nullable(),
});

export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export const itineraryEntryTypeSchema = z.enum([
  'travel',
  'accommodation',
  'activity',
  'dining',
  'other',
]);
export type ItineraryEntryType = z.infer<typeof itineraryEntryTypeSchema>;

export const createItineraryEntrySchema = z.object({
  trip_id: z.string().uuid('Trip ID must be a valid UUID'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be under 200 characters'),
  description: z
    .string()
    .max(2000, 'Description must be under 2000 characters')
    .optional()
    .nullable(),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format')
    .optional()
    .nullable(),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format')
    .optional()
    .nullable(),
  entry_type: itineraryEntryTypeSchema.optional(),
  booking_ref: z
    .string()
    .max(200, 'Booking reference must be under 200 characters')
    .optional()
    .nullable(),
  booking_url: z
    .string()
    .url('Booking URL must be a valid URL')
    .max(2000, 'Booking URL must be under 2000 characters')
    .optional()
    .nullable(),
  cost_amount: z
    .number()
    .min(0, 'Cost must be 0 or more')
    .optional()
    .nullable(),
  cost_currency: z
    .string()
    .max(10, 'Currency code must be under 10 characters')
    .optional()
    .nullable(),
  sort_order: z.number().int('Sort order must be an integer').optional(),
});

export type CreateItineraryEntryInput = z.infer<typeof createItineraryEntrySchema>;

export const updateItineraryEntrySchema = z.object({
  id: z.string().uuid('Entry ID must be a valid UUID'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be under 200 characters')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be under 2000 characters')
    .optional()
    .nullable(),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format')
    .optional()
    .nullable(),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format')
    .optional()
    .nullable(),
  entry_type: itineraryEntryTypeSchema.optional(),
  booking_ref: z
    .string()
    .max(200, 'Booking reference must be under 200 characters')
    .optional()
    .nullable(),
  booking_url: z
    .string()
    .url('Booking URL must be a valid URL')
    .max(2000, 'Booking URL must be under 2000 characters')
    .optional()
    .nullable(),
  cost_amount: z
    .number()
    .min(0, 'Cost must be 0 or more')
    .optional()
    .nullable(),
  cost_currency: z
    .string()
    .max(10, 'Currency code must be under 10 characters')
    .optional()
    .nullable(),
  sort_order: z.number().int('Sort order must be an integer').optional(),
});

export type UpdateItineraryEntryInput = z.infer<typeof updateItineraryEntrySchema>;

export const budgetCategorySchema = z.enum([
  'flights',
  'accommodation',
  'car_rental',
  'activities',
  'food',
  'transport',
  'other',
]);
export type BudgetCategory = z.infer<typeof budgetCategorySchema>;

export const createTripBudgetItemSchema = z.object({
  trip_id: z.string().uuid('Trip ID must be a valid UUID'),
  category: budgetCategorySchema.optional(),
  name: z
    .string()
    .min(1, 'Budget item name is required')
    .max(200, 'Budget item name must be under 200 characters'),
  planned_amount: z
    .number()
    .min(0, 'Planned amount must be 0 or more'),
  actual_amount: z
    .number()
    .min(0, 'Actual amount must be 0 or more')
    .optional()
    .nullable(),
  currency: z
    .string()
    .min(1, 'Currency is required')
    .max(10, 'Currency code must be under 10 characters')
    .optional(),
  booking_ref: z
    .string()
    .max(200, 'Booking reference must be under 200 characters')
    .optional()
    .nullable(),
  itinerary_entry_id: z
    .string()
    .uuid('Itinerary entry ID must be a valid UUID')
    .optional()
    .nullable(),
});

export type CreateTripBudgetItemInput = z.infer<typeof createTripBudgetItemSchema>;

export const updateTripBudgetItemSchema = z.object({
  id: z.string().uuid('Budget item ID must be a valid UUID'),
  category: budgetCategorySchema.optional(),
  name: z
    .string()
    .min(1, 'Budget item name is required')
    .max(200, 'Budget item name must be under 200 characters')
    .optional(),
  planned_amount: z
    .number()
    .min(0, 'Planned amount must be 0 or more')
    .optional(),
  actual_amount: z
    .number()
    .min(0, 'Actual amount must be 0 or more')
    .optional()
    .nullable(),
  currency: z
    .string()
    .min(1, 'Currency is required')
    .max(10, 'Currency code must be under 10 characters')
    .optional(),
  booking_ref: z
    .string()
    .max(200, 'Booking reference must be under 200 characters')
    .optional()
    .nullable(),
  itinerary_entry_id: z
    .string()
    .uuid('Itinerary entry ID must be a valid UUID')
    .optional()
    .nullable(),
});

export type UpdateTripBudgetItemInput = z.infer<typeof updateTripBudgetItemSchema>;

export const packingItemAssigneeSchema = z.enum(['me', 'partner', 'shared']);
export type PackingItemAssignee = z.infer<typeof packingItemAssigneeSchema>;

export const createPackingItemSchema = z.object({
  trip_id: z.string().uuid('Trip ID must be a valid UUID'),
  category: z
    .string()
    .max(100, 'Category must be under 100 characters')
    .optional()
    .nullable(),
  name: z
    .string()
    .min(1, 'Item name is required')
    .max(200, 'Item name must be under 200 characters'),
  is_packed: z.boolean().optional(),
  assignee: packingItemAssigneeSchema.optional(),
  sort_order: z.number().int('Sort order must be an integer').optional(),
});

export type CreatePackingItemInput = z.infer<typeof createPackingItemSchema>;

export const updatePackingItemSchema = z.object({
  id: z.string().uuid('Packing item ID must be a valid UUID'),
  category: z
    .string()
    .max(100, 'Category must be under 100 characters')
    .optional()
    .nullable(),
  name: z
    .string()
    .min(1, 'Item name is required')
    .max(200, 'Item name must be under 200 characters')
    .optional(),
  is_packed: z.boolean().optional(),
  assignee: packingItemAssigneeSchema.optional(),
  sort_order: z.number().int('Sort order must be an integer').optional(),
});

export type UpdatePackingItemInput = z.infer<typeof updatePackingItemSchema>;
