const userRepository = require('../services/userRepository');
const asyncHandler = require('../utils/asyncHandler');

const listDrivers = asyncHandler(async (req, res) => {
  const drivers = await userRepository.listByRole('driver');
  res.json({ drivers });
});

module.exports = { listDrivers };
