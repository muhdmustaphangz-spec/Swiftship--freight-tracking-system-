const shipmentRepository = require('./shipmentRepository');
const userRepository = require('./userRepository');
const { estimateCost } = require('./pricingService');
const { generateTrackingId } = require('./trackingIdService');
const { sendEmail } = require('./emailService');
const { statusUpdateEmail } = require('./emailTemplates');
const AppError = require('../utils/AppError');

const MAX_TRACKING_ID_ATTEMPTS = 10;

async function generateUniqueTrackingId() {
  for (let i = 0; i < MAX_TRACKING_ID_ATTEMPTS; i++) {
    const candidate = generateTrackingId();
    if (!(await shipmentRepository.trackingIdExists(candidate))) return candidate;
  }
  throw new AppError('Could not generate a unique tracking ID, please try again', 500);
}

function canAccessShipment(user, shipment) {
  if (user.role === 'admin') return true;
  if (user.role === 'customer' && shipment.customer_id === user.id) return true;
  if (user.role === 'driver' && shipment.driver_id === user.id) return true;
  return false;
}

/**
 * Emails the owning customer that their shipment's status changed. Never
 * throws — a notification failure must never roll back or fail the status
 * change itself, since the status change is the thing that actually matters.
 */
async function notifyCustomerOfStatus(shipment) {
  try {
    const customer = await userRepository.findById(shipment.customer_id);
    if (!customer) return;
    const email = statusUpdateEmail({
      trackingId: shipment.tracking_id,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status,
      recipientName: shipment.recipient_name,
    });
    await sendEmail({ to: customer.email, ...email });
  } catch {
    // deliberately swallowed — see comment above
  }
}

const shipmentService = {
  async bookShipment(user, input) {
    const customerId = user.role === 'admin' && input.customer_id ? input.customer_id : user.id;

    if (user.role === 'admin' && input.customer_id) {
      const customer = await userRepository.findById(input.customer_id);
      if (!customer || customer.role !== 'customer') {
        throw AppError.badRequest('customer_id does not refer to a valid customer account');
      }
    }

    const pricing = estimateCost(input);
    const tracking_id = await generateUniqueTrackingId();

    const shipment = await shipmentRepository.create({
      ...input,
      tracking_id,
      customer_id: customerId,
      cost: pricing.total,
    });

    return { shipment, pricing };
  },

  async getShipmentsForUser(user) {
    if (user.role === 'admin') return shipmentRepository.listForAdmin();
    if (user.role === 'driver') return shipmentRepository.listForDriver(user.id);
    return shipmentRepository.listForCustomer(user.id);
  },

  async getShipmentDetail(user, id) {
    const shipment = await shipmentRepository.findByIdDetailed(id);
    if (!shipment) throw AppError.notFound('Shipment not found');
    if (!canAccessShipment(user, shipment)) throw AppError.forbidden();

    const events = await shipmentRepository.listEvents(id);
    return { shipment, events };
  },

  async adminUpdateStatus(id, status, note) {
    const shipment = await shipmentRepository.findById(id);
    if (!shipment) throw AppError.notFound('Shipment not found');

    await shipmentRepository.updateStatus(id, status);
    await shipmentRepository.addEvent(id, status, note || `Status updated to ${status}`);
    const updated = await shipmentRepository.findById(id);
    notifyCustomerOfStatus(updated).catch(() => {});
    return updated;
  },

  async assignDriver(id, driverId) {
    const shipment = await shipmentRepository.findById(id);
    if (!shipment) throw AppError.notFound('Shipment not found');

    if (driverId && !(await userRepository.existsAndHasRole(driverId, 'driver'))) {
      throw AppError.badRequest('driver_id does not refer to a valid driver account');
    }

    await shipmentRepository.updateDriver(id, driverId || null);
    await shipmentRepository.addEvent(id, shipment.status, driverId ? 'Driver assigned' : 'Driver unassigned');
    return shipmentRepository.findById(id);
  },

  async driverUpdateStatus(driverId, id, status) {
    const shipment = await shipmentRepository.findById(id);
    if (!shipment) throw AppError.notFound('Shipment not found');
    if (shipment.driver_id !== driverId) throw AppError.forbidden('This shipment is not assigned to you');

    await shipmentRepository.updateStatus(id, status);
    await shipmentRepository.addEvent(id, status, 'Updated by driver');
    const updated = await shipmentRepository.findById(id);
    notifyCustomerOfStatus(updated).catch(() => {});
    return updated;
  },

  async submitSignaturePod(driverId, id, signature) {
    const shipment = await shipmentRepository.findById(id);
    if (!shipment) throw AppError.notFound('Shipment not found');
    if (shipment.driver_id !== driverId) throw AppError.forbidden('This shipment is not assigned to you');

    await shipmentRepository.setProofOfDelivery(id, { type: 'signature', data: signature });
    await shipmentRepository.addEvent(id, 'Delivered', 'Delivered — proof of delivery signature captured');
    const updated = await shipmentRepository.findById(id);
    notifyCustomerOfStatus(updated).catch(() => {});
    return updated;
  },

  async submitPhotoPod(driverId, id, photoUrl) {
    const shipment = await shipmentRepository.findById(id);
    if (!shipment) throw AppError.notFound('Shipment not found');
    if (shipment.driver_id !== driverId) throw AppError.forbidden('This shipment is not assigned to you');

    await shipmentRepository.setProofOfDelivery(id, { type: 'photo', data: photoUrl });
    await shipmentRepository.addEvent(id, 'Delivered', 'Delivered — proof of delivery photo captured');
    const updated = await shipmentRepository.findById(id);
    notifyCustomerOfStatus(updated).catch(() => {});
    return updated;
  },

  async getShipmentForPdf(id) {
    const shipment = await shipmentRepository.findByIdDetailed(id);
    if (!shipment) throw AppError.notFound('Shipment not found');
    shipment.pricing = estimateCost({
      distance_km: shipment.distance_km,
      weight_kg: shipment.weight_kg,
      length_cm: shipment.length_cm || 0,
      width_cm: shipment.width_cm || 0,
      height_cm: shipment.height_cm || 0,
      service_type: shipment.service_type,
    });
    return shipment;
  },

  async getAnalytics() {
    const [totalRevenue, totalShipments, pending, completed, statusCounts, routeVolume, revenueByService, recentShipments] =
      await Promise.all([
        shipmentRepository.getTotalRevenue(),
        shipmentRepository.getTotalCount(),
        shipmentRepository.getPendingCount(),
        shipmentRepository.getCompletedCount(),
        shipmentRepository.getStatusCounts(),
        shipmentRepository.getTopRoutes(),
        shipmentRepository.getRevenueByService(),
        shipmentRepository.getRecent(),
      ]);

    return { totalRevenue, totalShipments, pending, completed, statusCounts, routeVolume, revenueByService, recentShipments };
  },

  canAccessShipment,
};

module.exports = shipmentService;
