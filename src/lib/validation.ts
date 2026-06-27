import { z } from 'zod'

export const numberPlateSchema = z.string()
  .min(1, 'Number plate is required')
  .max(20, 'Number plate is too long')
  .regex(/^[A-Z0-9\s\-]+$/i, 'Invalid number plate format')

export const vehicleTypeSchema = z.enum(['Car', 'Bike', 'EV', 'Handicap'])

export const billingTypeSchema = z.enum(['Hourly', 'DayPass'])

export const entrySchema = z.object({
  numberPlate: numberPlateSchema,
  vehicleType: vehicleTypeSchema,
  billingType: billingTypeSchema,
  slotId: z.string().optional(),
  manualSlotSelection: z.boolean().optional()
})

export const exitSchema = z.object({
  numberPlate: numberPlateSchema
})

export const slotUpdateSchema = z.object({
  slotId: z.string().min(1, 'Slot ID is required'),
  status: z.enum(['Available', 'Occupied', 'Maintenance'])
})

export const timeUpdateSchema = z.object({
  slotId: z.string().min(1, 'Slot ID is required'),
  newEntryTime: z.string().min(1, 'Entry time is required'),
  newExitTime: z.string().optional()
})

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errorMessage = result.error.issues.map(e => e.message).join(', ')
  return { success: false, error: errorMessage }
}
