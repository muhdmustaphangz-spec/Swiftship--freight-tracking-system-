const express = require('express');
const driverController = require('../controllers/driverController');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, requireRole('admin'), driverController.listDrivers);

module.exports = router;
