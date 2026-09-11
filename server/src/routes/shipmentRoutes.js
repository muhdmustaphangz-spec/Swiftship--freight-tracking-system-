const express = require('express');
const shipmentController = require('../controllers/shipmentController');
const { authRequired, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const {
  estimateSchema,
  createShipmentSchema,
  updateStatusSchema,
  driverStatusSchema,
  assignDriverSchema,
  signatureSchema,
  idParamSchema,
  trackingIdParamSchema,
} = require('../validators/shipmentValidators');

const router = express.Router();

// ---- Public ----
router.post('/estimate', validate(estimateSchema), shipmentController.estimate);
router.get('/geocode', shipmentController.geocode);
router.get('/track/:trackingId', validate(trackingIdParamSchema, 'params'), shipmentController.track);

// ---- Authenticated: create & list ----
router.post(
  '/shipments',
  authRequired,
  requireRole('customer', 'admin'),
  validate(createShipmentSchema),
  shipmentController.createShipment
);
router.get('/shipments', authRequired, shipmentController.listShipments);

router.get(
  '/shipments/:id',
  authRequired,
  validate(idParamSchema, 'params'),
  shipmentController.getShipment
);

// ---- Admin ----
router.patch(
  '/shipments/:id/status',
  authRequired,
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema),
  shipmentController.updateStatus
);

router.patch(
  '/shipments/:id/assign-driver',
  authRequired,
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(assignDriverSchema),
  shipmentController.assignDriver
);

router.get('/analytics', authRequired, requireRole('admin'), shipmentController.analytics);

// ---- Driver ----
router.patch(
  '/shipments/:id/driver-status',
  authRequired,
  requireRole('driver'),
  validate(idParamSchema, 'params'),
  validate(driverStatusSchema),
  shipmentController.driverUpdateStatus
);

router.post(
  '/shipments/:id/pod/signature',
  authRequired,
  requireRole('driver'),
  validate(idParamSchema, 'params'),
  validate(signatureSchema),
  shipmentController.submitSignature
);

router.post(
  '/shipments/:id/pod/photo',
  authRequired,
  requireRole('driver'),
  validate(idParamSchema, 'params'),
  upload.single('photo'),
  shipmentController.submitPhoto
);

// ---- PDFs (access control enforced in controller since multiple roles apply) ----
router.get(
  '/shipments/:id/invoice',
  authRequired,
  validate(idParamSchema, 'params'),
  shipmentController.invoice
);
router.get(
  '/shipments/:id/waybill',
  authRequired,
  validate(idParamSchema, 'params'),
  shipmentController.waybill
);

module.exports = router;
