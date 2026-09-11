// Simple, transparent pricing model.
// Base fee + per-km rate + per-kg rate + volumetric weight adjustment + service multiplier.

const BASE_FEE = 5.0;
const RATE_PER_KM = 0.03;
const RATE_PER_KG = 1.75;
const VOLUMETRIC_DIVISOR = 5000; // standard air-freight divisor (cm3 / 5000 = kg)

const SERVICE_MULTIPLIERS = {
  standard: 1.0,
  express: 1.6,
  economy: 0.8,
};

function volumetricWeight(length_cm, width_cm, height_cm) {
  if (!length_cm || !width_cm || !height_cm) return 0;
  return (length_cm * width_cm * height_cm) / VOLUMETRIC_DIVISOR;
}

function estimateCost({ distance_km, weight_kg, length_cm, width_cm, height_cm, service_type }) {
  const volWeight = volumetricWeight(length_cm, width_cm, height_cm);
  const chargeableWeight = Math.max(weight_kg, volWeight);
  const multiplier = SERVICE_MULTIPLIERS[service_type] ?? 1.0;

  const distanceCost = distance_km * RATE_PER_KM;
  const weightCost = chargeableWeight * RATE_PER_KG;
  const subtotal = (BASE_FEE + distanceCost + weightCost) * multiplier;

  return {
    base_fee: round2(BASE_FEE),
    distance_cost: round2(distanceCost),
    weight_cost: round2(weightCost),
    chargeable_weight_kg: round2(chargeableWeight),
    volumetric_weight_kg: round2(volWeight),
    service_multiplier: multiplier,
    total: round2(subtotal),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { estimateCost, volumetricWeight, SERVICE_MULTIPLIERS, BASE_FEE, RATE_PER_KM, RATE_PER_KG, VOLUMETRIC_DIVISOR };
