const request = require('supertest');
const { freshApp } = require('./testApp');

async function loginAs(app, email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

const SEEDED = {
  admin: ['admin@swiftship.com', 'Admin1234!'],
  driver1: ['driver1@swiftship.com', 'Driver1234!'],
  driver2: ['driver2@swiftship.com', 'Driver1234!'],
  customer: ['customer@swiftship.com', 'Customer1234!'],
};

describe('POST /api/shipments (booking)', () => {
  it('lets a logged-in customer book a shipment and returns a tracking ID + pricing', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);

    const res = await request(app).post('/api/shipments').set('Authorization', `Bearer ${token}`).send({
      origin: 'Lagos', destination: 'Abuja', distance_km: 760, weight_kg: 3.2,
      recipient_name: 'Bola Ade', recipient_phone: '08012345678', recipient_address: '12 Garki, Abuja',
      service_type: 'express',
    });

    expect(res.status).toBe(201);
    expect(res.body.shipment.tracking_id).toMatch(/^SW[A-Z0-9]{8}$/);
    expect(res.body.shipment.status).toBe('Order Placed');
    expect(res.body.pricing.total).toBeGreaterThan(0);
    expect(res.body.shipment.cost).toBe(res.body.pricing.total);
  });

  it('rejects booking with no auth token', async () => {
    const { app } = await freshApp();
    const res = await request(app).post('/api/shipments').send({
      origin: 'Lagos', destination: 'Abuja', distance_km: 760, weight_kg: 3.2,
      recipient_name: 'Test Recipient', recipient_phone: '08000000000', recipient_address: '1 Test Street, City',
    });
    expect(res.status).toBe(401);
  });

  it('rejects a driver trying to book a shipment (wrong role)', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.driver1);
    const res = await request(app).post('/api/shipments').set('Authorization', `Bearer ${token}`).send({
      origin: 'Lagos', destination: 'Abuja', distance_km: 760, weight_kg: 3.2,
      recipient_name: 'Test Recipient', recipient_phone: '08000000000', recipient_address: '1 Test Street, City',
    });
    expect(res.status).toBe(403);
  });

  it('rejects a negative weight', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);
    const res = await request(app).post('/api/shipments').set('Authorization', `Bearer ${token}`).send({
      origin: 'Lagos', destination: 'Abuja', distance_km: 760, weight_kg: -3,
      recipient_name: 'Test Recipient', recipient_phone: '08000000000', recipient_address: '1 Test Street, City',
    });
    expect(res.status).toBe(400);
  });

  it('generates unique tracking IDs across multiple bookings', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);
    const ids = new Set();
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/shipments').set('Authorization', `Bearer ${token}`).send({
        origin: 'Lagos', destination: 'Abuja', distance_km: 100, weight_kg: 1,
        recipient_name: 'Test Recipient', recipient_phone: '08000000000', recipient_address: '1 Test Street, City',
      });
      ids.add(res.body.shipment.tracking_id);
    }
    expect(ids.size).toBe(5);
  });

  it('accepts and stores origin/destination coordinates when provided', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);
    const res = await request(app).post('/api/shipments').set('Authorization', `Bearer ${token}`).send({
      origin: 'Lagos, Nigeria', destination: 'London, England', distance_km: 5040, weight_kg: 2,
      origin_lat: 6.5244, origin_lng: 3.3792, destination_lat: 51.5072, destination_lng: -0.1276,
      recipient_name: 'Test Recipient', recipient_phone: '08000000000', recipient_address: '1 Test Street, City',
    });
    expect(res.status).toBe(201);
    expect(res.body.shipment.origin_lat).toBeCloseTo(6.5244);
    expect(res.body.shipment.origin_lng).toBeCloseTo(3.3792);
    expect(res.body.shipment.destination_lat).toBeCloseTo(51.5072);
    expect(res.body.shipment.destination_lng).toBeCloseTo(-0.1276);
  });

  it('books successfully without coordinates (they are optional)', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);
    const res = await request(app).post('/api/shipments').set('Authorization', `Bearer ${token}`).send({
      origin: 'Lagos', destination: 'Abuja', distance_km: 760, weight_kg: 2,
      recipient_name: 'Test Recipient', recipient_phone: '08000000000', recipient_address: '1 Test Street, City',
    });
    expect(res.status).toBe(201);
    expect(res.body.shipment.origin_lat).toBeNull();
    expect(res.body.shipment.destination_lat).toBeNull();
  });

  it('rejects an out-of-range latitude', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);
    const res = await request(app).post('/api/shipments').set('Authorization', `Bearer ${token}`).send({
      origin: 'Lagos', destination: 'Abuja', distance_km: 760, weight_kg: 2,
      origin_lat: 999, origin_lng: 3.3792,
      recipient_name: 'Test Recipient', recipient_phone: '08000000000', recipient_address: '1 Test Street, City',
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/shipments (role-scoped listing)', () => {
  it('customer sees only their own shipments', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);
    const res = await request(app).get('/api/shipments').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.shipments.length).toBeGreaterThan(0);
    expect(res.body.shipments.every((s) => s.tracking_id.startsWith('SW'))).toBe(true);
  });

  it('admin sees all shipments across all customers', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.admin);
    const res = await request(app).get('/api/shipments').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.shipments.length).toBe(3); // seeded demo data
  });

  it('driver sees only shipments assigned to them', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.driver1);
    const res = await request(app).get('/api/shipments').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.shipments.length).toBe(1);
    expect(res.body.shipments[0].tracking_id).toBe('SW1001AB');
  });
});

describe('GET /api/shipments/:id (authorization boundaries)', () => {
  it("a customer cannot view another customer's shipment", async () => {
    const { app } = await freshApp();
    const other = await request(app).post('/api/auth/register').send({
      name: 'Other Customer', email: 'other@example.com', password: 'Secret123!',
    });
    const res = await request(app).get('/api/shipments/1').set('Authorization', `Bearer ${other.body.token}`);
    expect(res.status).toBe(403);
  });

  it('the owning customer can view their own shipment', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);
    const res = await request(app).get('/api/shipments/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.shipment.id).toBe(1);
    expect(res.body.events.length).toBeGreaterThan(0);
  });

  it('admin can view any shipment', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.admin);
    const res = await request(app).get('/api/shipments/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('an unassigned driver cannot view a shipment that is not theirs', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.driver2);
    const res = await request(app).get('/api/shipments/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent shipment id', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.admin);
    const res = await request(app).get('/api/shipments/99999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/shipments/:id/status (admin only)', () => {
  it('admin can update shipment status and it appends a timeline event', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.admin);
    const res = await request(app)
      .patch('/api/shipments/3/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Picked Up' });

    expect(res.status).toBe(200);
    expect(res.body.shipment.status).toBe('Picked Up');

    const detail = await request(app).get('/api/shipments/3').set('Authorization', `Bearer ${token}`);
    expect(detail.body.events.some((e) => e.status === 'Picked Up')).toBe(true);
  });

  it('rejects a status update from a customer (not admin)', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);
    const res = await request(app)
      .patch('/api/shipments/3/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Delivered' });
    expect(res.status).toBe(403);
  });

  it('rejects an invalid status value', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.admin);
    const res = await request(app)
      .patch('/api/shipments/3/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Teleported' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/shipments/:id/assign-driver (admin only)', () => {
  it('admin can assign a driver to an unassigned shipment', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.admin);
    const res = await request(app)
      .patch('/api/shipments/3/assign-driver')
      .set('Authorization', `Bearer ${token}`)
      .send({ driver_id: 2 }); // driver1 seeded as user id 2
    expect(res.status).toBe(200);
    expect(res.body.shipment.driver_id).toBe(2);
  });

  it('rejects assigning a non-driver user id as driver', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.admin);
    const res = await request(app)
      .patch('/api/shipments/3/assign-driver')
      .set('Authorization', `Bearer ${token}`)
      .send({ driver_id: 4 }); // seeded customer id, not a driver
    expect(res.status).toBe(400);
  });
});

describe('Driver delivery workflow', () => {
  it('driver can advance status through the allowed sequence', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.driver1); // owns shipment 1, currently "In Transit"

    const res1 = await request(app)
      .patch('/api/shipments/1/driver-status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Out for Delivery' });
    expect(res1.status).toBe(200);
    expect(res1.body.shipment.status).toBe('Out for Delivery');
  });

  it('driver cannot update a shipment not assigned to them', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.driver2); // shipment 1 belongs to driver1
    const res = await request(app)
      .patch('/api/shipments/1/driver-status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Out for Delivery' });
    expect(res.status).toBe(403);
  });

  it('driver cannot set a status outside their allowed set (e.g. Delivered directly)', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.driver1);
    const res = await request(app)
      .patch('/api/shipments/1/driver-status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Delivered' }); // must go through POD endpoints instead
    expect(res.status).toBe(400);
  });

  it('submitting a signature marks the shipment Delivered with pod_type=signature', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.driver1);
    const fakeSignature = 'data:image/png;base64,' + 'A'.repeat(60);

    const res = await request(app)
      .post('/api/shipments/1/pod/signature')
      .set('Authorization', `Bearer ${token}`)
      .send({ signature: fakeSignature });

    expect(res.status).toBe(200);
    expect(res.body.shipment.status).toBe('Delivered');
    expect(res.body.shipment.pod_type).toBe('signature');
  });

  it('rejects a malformed signature payload', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.driver1);
    const res = await request(app)
      .post('/api/shipments/1/pod/signature')
      .set('Authorization', `Bearer ${token}`)
      .send({ signature: 'not-a-data-url' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/track/:trackingId (public)', () => {
  it('returns tracking info without requiring authentication', async () => {
    const { app } = await freshApp();
    const res = await request(app).get('/api/track/SW1001AB');
    expect(res.status).toBe(200);
    expect(res.body.tracking_id).toBe('SW1001AB');
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it('is case-insensitive on the tracking ID', async () => {
    const { app } = await freshApp();
    const res = await request(app).get('/api/track/sw1001ab');
    expect(res.status).toBe(200);
  });

  it('returns 404 for an unknown tracking ID', async () => {
    const { app } = await freshApp();
    const res = await request(app).get('/api/track/SWZZZZZZZZ');
    expect(res.status).toBe(404);
  });

  it('does not leak internal fields like customer_id or driver_id', async () => {
    const { app } = await freshApp();
    const res = await request(app).get('/api/track/SW1001AB');
    expect(res.body.customer_id).toBeUndefined();
    expect(res.body.driver_id).toBeUndefined();
    expect(res.body.recipient_phone).toBeUndefined();
    expect(res.body.recipient_address).toBeUndefined();
  });
});

describe('GET /api/analytics (admin only)', () => {
  it('returns aggregate metrics for admin', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.admin);
    const res = await request(app).get('/api/analytics').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.totalShipments).toBe(3);
    expect(typeof res.body.totalRevenue).toBe('number');
    expect(Array.isArray(res.body.statusCounts)).toBe(true);
  });

  it('rejects a customer requesting analytics', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);
    const res = await request(app).get('/api/analytics').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/shipments/:id/invoice and /waybill (PDF generation)', () => {
  it('generates a downloadable invoice PDF for the owning customer', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);
    const res = await request(app).get('/api/shipments/1/invoice').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  it('generates a downloadable waybill PDF', async () => {
    const { app } = await freshApp();
    const token = await loginAs(app, ...SEEDED.customer);
    const res = await request(app).get('/api/shipments/1/waybill').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  it("forbids a different customer from downloading someone else's invoice", async () => {
    const { app } = await freshApp();
    const other = await request(app).post('/api/auth/register').send({
      name: 'Other', email: 'other2@example.com', password: 'Secret123!',
    });
    const res = await request(app).get('/api/shipments/1/invoice').set('Authorization', `Bearer ${other.body.token}`);
    expect(res.status).toBe(403);
  });
});
