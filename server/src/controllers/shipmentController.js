const shipmentService = require('../services/shipmentService');
const shipmentRepository = require('../services/shipmentRepository');
const { estimateCost } = require('../services/pricingService');
const geocodeService = require('../services/geocodingService');
const { generateInvoicePDF, generateWaybillPDF } = require('../services/pdfService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const estimate = asyncHandler(async (req, res) => {
  const pricing = estimateCost(req.body);
  res.json(pricing);
});

const geocode = asyncHandler(async (req, res) => {
  const results = await geocodeService.geocode(req.query.q);
  res.json({ results });
});

const track = asyncHandler(async (req, res) => {
  const shipment = await shipmentRepository.findByTrackingId(req.params.trackingId.toUpperCase());
  if (!shipment) throw AppError.notFound('No shipment found with that tracking ID');

  const events = await shipmentRepository.listEvents(shipment.id);
  res.json({
    tracking_id: shipment.tracking_id,
    origin: shipment.origin,
    destination: shipment.destination,
    origin_lat: shipment.origin_lat,
    origin_lng: shipment.origin_lng,
    destination_lat: shipment.destination_lat,
    destination_lng: shipment.destination_lng,
    status: shipment.status,
    service_type: shipment.service_type,
    recipient_name: shipment.recipient_name,
    created_at: shipment.created_at,
    updated_at: shipment.updated_at,
    events,
  });
});

const createShipment = asyncHandler(async (req, res) => {
  const { shipment, pricing } = await shipmentService.bookShipment(req.user, req.body);
  res.status(201).json({ shipment, pricing });
});

const listShipments = asyncHandler(async (req, res) => {
  const shipments = await shipmentService.getShipmentsForUser(req.user);
  res.json({ shipments });
});

const getShipment = asyncHandler(async (req, res) => {
  const result = await shipmentService.getShipmentDetail(req.user, req.params.id);
  res.json(result);
});

const updateStatus = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.adminUpdateStatus(req.params.id, req.body.status, req.body.note);
  res.json({ shipment });
});

const assignDriver = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.assignDriver(req.params.id, req.body.driver_id);
  res.json({ shipment });
});

const driverUpdateStatus = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.driverUpdateStatus(req.user.id, req.params.id, req.body.status);
  res.json({ shipment });
});

const submitSignature = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.submitSignaturePod(req.user.id, req.params.id, req.body.signature);
  res.json({ shipment });
});

const submitPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw AppError.badRequest('Photo file is required');
  const photoUrl = `/uploads/${req.file.filename}`;
  const shipment = await shipmentService.submitPhotoPod(req.user.id, req.params.id, photoUrl);
  res.json({ shipment });
});

const analytics = asyncHandler(async (req, res) => {
  const data = await shipmentService.getAnalytics();
  res.json(data);
});

const invoice = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.getShipmentForPdf(req.params.id);
  if (!shipmentService.canAccessShipment(req.user, shipment)) throw AppError.forbidden();
  generateInvoicePDF(shipment, res);
});

const waybill = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.getShipmentForPdf(req.params.id);
  if (!shipmentService.canAccessShipment(req.user, shipment)) throw AppError.forbidden();
  await generateWaybillPDF(shipment, res);
});

module.exports = {
  estimate, geocode, track, createShipment, listShipments, getShipment,
  updateStatus, assignDriver, driverUpdateStatus, submitSignature, submitPhoto,
  analytics, invoice, waybill,
};
