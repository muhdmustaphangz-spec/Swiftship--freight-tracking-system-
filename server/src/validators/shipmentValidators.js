const { z } = require('zod');

const SERVICE_TYPES = ['economy', 'standard', 'express'];
const STATUSES = ['Order Placed', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'];
const DRIVER_ALLOWED_STATUSES = ['Picked Up', 'In Transit', 'Out for Delivery'];

// Accepts numbers or numeric strings (HTML form inputs send strings) and coerces to number.
const positiveNumber = (label) =>
  z.coerce.number({ invalid_type_error: `${label} must be a number` })
    .positive(`${label} must be greater than 0`);

const nonNegativeOptional = (label) =>
  z.coerce.number({ invalid_type_error: `${label} must be a number` })
    .nonnegative(`${label} cannot be negative`)
    .optional()
    .nullable();

const latitudeOptional = z.coerce.number()
  .min(-90, 'Latitude must be between -90 and 90')
  .max(90, 'Latitude must be between -90 and 90')
  .optional()
  .nullable();

const longitudeOptional = z.coerce.number()
  .min(-180, 'Longitude must be between -180 and 180')
  .max(180, 'Longitude must be between -180 and 180')
  .optional()
  .nullable();

const estimateSchema = z.object({
  distance_km: positiveNumber('distance_km'),
  weight_kg: positiveNumber('weight_kg'),
  length_cm: nonNegativeOptional('length_cm'),
  width_cm: nonNegativeOptional('width_cm'),
  height_cm: nonNegativeOptional('height_cm'),
  service_type: z.enum(SERVICE_TYPES).optional().default('standard'),
});

const createShipmentSchema = z.object({
  origin: z.string().trim().min(2, 'Origin is required').max(200),
  destination: z.string().trim().min(2, 'Destination is required').max(200),
  origin_lat: latitudeOptional,
  origin_lng: longitudeOptional,
  destination_lat: latitudeOptional,
  destination_lng: longitudeOptional,
  distance_km: positiveNumber('distance_km'),
  weight_kg: positiveNumber('weight_kg'),
  length_cm: nonNegativeOptional('length_cm'),
  width_cm: nonNegativeOptional('width_cm'),
  height_cm: nonNegativeOptional('height_cm'),
  recipient_name: z.string().trim().min(2, 'Recipient name is required').max(150),
  recipient_phone: z.string().trim().min(5, 'Recipient phone is required').max(30),
  recipient_address: z.string().trim().min(5, 'Recipient address is required').max(300),
  service_type: z.enum(SERVICE_TYPES).optional().default('standard'),
  customer_id: z.coerce.number().int().positive().optional(), // admin-only override, checked in controller
});

const updateStatusSchema = z.object({
  status: z.enum(STATUSES, { errorMap: () => ({ message: `Status must be one of: ${STATUSES.join(', ')}` }) }),
  note: z.string().trim().max(500).optional(),
});

const driverStatusSchema = z.object({
  status: z.enum(DRIVER_ALLOWED_STATUSES, {
    errorMap: () => ({ message: `Drivers may only set: ${DRIVER_ALLOWED_STATUSES.join(', ')}` }),
  }),
});

const assignDriverSchema = z.object({
  driver_id: z.coerce.number().int().positive().nullable(),
});

const signatureSchema = z.object({
  signature: z.string().min(50, 'Signature data looks invalid').startsWith('data:image/', 'Signature must be a base64 image data URL'),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive('Invalid id'),
});

const trackingIdParamSchema = z.object({
  trackingId: z.string().trim().min(4).max(30),
});

module.exports = {
  estimateSchema,
  createShipmentSchema,
  updateStatusSchema,
  driverStatusSchema,
  assignDriverSchema,
  signatureSchema,
  idParamSchema,
  trackingIdParamSchema,
  SERVICE_TYPES,
  STATUSES,
  DRIVER_ALLOWED_STATUSES,
};
