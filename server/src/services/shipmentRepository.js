const { query } = require('../config/database');

const shipmentRepository = {
  async trackingIdExists(trackingId) {
    const { rows } = await query('SELECT id FROM shipments WHERE tracking_id = $1', [trackingId]);
    return rows.length > 0;
  },

  async create(data) {
    const { rows } = await query(
      `INSERT INTO shipments
       (tracking_id, customer_id, origin, destination, origin_lat, origin_lng,
        destination_lat, destination_lng, distance_km, weight_kg,
        length_cm, width_cm, height_cm, recipient_name, recipient_phone, recipient_address,
        service_type, cost, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'Order Placed')
       RETURNING id`,
      [
        data.tracking_id, data.customer_id, data.origin, data.destination,
        data.origin_lat ?? null, data.origin_lng ?? null,
        data.destination_lat ?? null, data.destination_lng ?? null,
        data.distance_km, data.weight_kg,
        data.length_cm ?? null, data.width_cm ?? null, data.height_cm ?? null,
        data.recipient_name, data.recipient_phone, data.recipient_address,
        data.service_type, data.cost,
      ]
    );
    const id = rows[0].id;
    await this.addEvent(id, 'Order Placed', 'Shipment booked');
    return this.findById(id);
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM shipments WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findByIdDetailed(id) {
    const { rows } = await query(
      `SELECT s.*, c.name as customer_name, c.email as customer_email, d.name as driver_name
       FROM shipments s
       JOIN users c ON c.id = s.customer_id
       LEFT JOIN users d ON d.id = s.driver_id
       WHERE s.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async findByTrackingId(trackingId) {
    const { rows } = await query(
      `SELECT s.*, u.name as customer_name
       FROM shipments s JOIN users u ON u.id = s.customer_id
       WHERE s.tracking_id = $1`,
      [trackingId]
    );
    return rows[0] || null;
  },

  async listForAdmin() {
    const { rows } = await query(`
      SELECT s.*, c.name as customer_name, c.email as customer_email, d.name as driver_name
      FROM shipments s
      JOIN users c ON c.id = s.customer_id
      LEFT JOIN users d ON d.id = s.driver_id
      ORDER BY s.created_at DESC
    `);
    return rows;
  },

  async listForDriver(driverId) {
    const { rows } = await query(
      `SELECT s.*, c.name as customer_name, c.email as customer_email
       FROM shipments s
       JOIN users c ON c.id = s.customer_id
       WHERE s.driver_id = $1
       ORDER BY s.created_at DESC`,
      [driverId]
    );
    return rows;
  },

  async listForCustomer(customerId) {
    const { rows } = await query(
      `SELECT s.*, d.name as driver_name
       FROM shipments s
       LEFT JOIN users d ON d.id = s.driver_id
       WHERE s.customer_id = $1
       ORDER BY s.created_at DESC`,
      [customerId]
    );
    return rows;
  },

  async updateStatus(id, status) {
    await query("UPDATE shipments SET status = $1, updated_at = NOW() WHERE id = $2", [status, id]);
  },

  async updateDriver(id, driverId) {
    await query("UPDATE shipments SET driver_id = $1, updated_at = NOW() WHERE id = $2", [driverId, id]);
  },

  async setProofOfDelivery(id, { type, data }) {
    await query(
      `UPDATE shipments SET status = 'Delivered', pod_type = $1, pod_data = $2, updated_at = NOW()
       WHERE id = $3`,
      [type, data, id]
    );
  },

  async addEvent(shipmentId, status, note) {
    await query('INSERT INTO shipment_events (shipment_id, status, note) VALUES ($1,$2,$3)', [shipmentId, status, note]);
  },

  async listEvents(shipmentId) {
    const { rows } = await query(
      'SELECT status, note, created_at FROM shipment_events WHERE shipment_id = $1 ORDER BY created_at ASC',
      [shipmentId]
    );
    return rows;
  },

  // ---- analytics ----
  async getTotalRevenue() {
    const { rows } = await query("SELECT COALESCE(SUM(cost),0)::float as total FROM shipments WHERE status != 'Cancelled'");
    return rows[0].total;
  },
  async getStatusCounts() {
    const { rows } = await query('SELECT status, COUNT(*)::int as count FROM shipments GROUP BY status');
    return rows;
  },
  async getTotalCount() {
    const { rows } = await query('SELECT COUNT(*)::int as count FROM shipments');
    return rows[0].count;
  },
  async getPendingCount() {
    const { rows } = await query("SELECT COUNT(*)::int as count FROM shipments WHERE status NOT IN ('Delivered','Cancelled')");
    return rows[0].count;
  },
  async getCompletedCount() {
    const { rows } = await query("SELECT COUNT(*)::int as count FROM shipments WHERE status = 'Delivered'");
    return rows[0].count;
  },
  async getTopRoutes(limit = 10) {
    const { rows } = await query(
      `SELECT origin, destination, COUNT(*)::int as count
       FROM shipments GROUP BY origin, destination ORDER BY count DESC LIMIT $1`,
      [limit]
    );
    return rows;
  },
  async getRevenueByService() {
    const { rows } = await query(`
      SELECT service_type, COALESCE(SUM(cost),0)::float as revenue, COUNT(*)::int as count
      FROM shipments WHERE status != 'Cancelled' GROUP BY service_type
    `);
    return rows;
  },
  async getRecent(limit = 8) {
    const { rows } = await query(
      `SELECT s.tracking_id, s.status, s.cost, s.created_at, c.name as customer_name
       FROM shipments s JOIN users c ON c.id = s.customer_id
       ORDER BY s.created_at DESC LIMIT $1`,
      [limit]
    );
    return rows;
  },
};

module.exports = shipmentRepository;
