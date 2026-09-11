const express = require('express');
const authRoutes = require('./authRoutes');
const shipmentRoutes = require('./shipmentRoutes');
const driverRoutes = require('./driverRoutes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/drivers', driverRoutes);
router.use('/', shipmentRoutes); // includes /shipments, /estimate, /track, /analytics

module.exports = router;
