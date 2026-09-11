const { estimateCost, volumetricWeight } = require('../services/pricingService');

describe('pricingService.volumetricWeight', () => {
  it('calculates volumetric weight from dimensions', () => {
    // 30 x 20 x 15 = 9000 cm3 / 5000 = 1.8 kg
    expect(volumetricWeight(30, 20, 15)).toBeCloseTo(1.8);
  });

  it('returns 0 when any dimension is missing', () => {
    expect(volumetricWeight(0, 20, 15)).toBe(0);
    expect(volumetricWeight(30, 0, 15)).toBe(0);
    expect(volumetricWeight(30, 20, 0)).toBe(0);
    expect(volumetricWeight(null, null, null)).toBe(0);
  });
});

describe('pricingService.estimateCost', () => {
  it('uses actual weight when it exceeds volumetric weight', () => {
    // small dense box: actual weight dominates
    const result = estimateCost({
      distance_km: 100, weight_kg: 10, length_cm: 10, width_cm: 10, height_cm: 10, service_type: 'standard',
    });
    expect(result.chargeable_weight_kg).toBe(10);
    expect(result.volumetric_weight_kg).toBeCloseTo(0.2); // 1000/5000
  });

  it('uses volumetric weight when it exceeds actual weight', () => {
    // large light box (e.g. packed pillows): volumetric weight dominates
    const result = estimateCost({
      distance_km: 100, weight_kg: 1, length_cm: 50, width_cm: 50, height_cm: 50, service_type: 'standard',
    });
    expect(result.volumetric_weight_kg).toBeCloseTo(25); // 125000/5000
    expect(result.chargeable_weight_kg).toBe(25);
  });

  it('applies the standard multiplier (1.0) by default', () => {
    const result = estimateCost({ distance_km: 100, weight_kg: 5, service_type: 'standard' });
    expect(result.service_multiplier).toBe(1.0);
  });

  it('applies the express multiplier (1.6) correctly', () => {
    const standard = estimateCost({ distance_km: 100, weight_kg: 5, service_type: 'standard' });
    const express = estimateCost({ distance_km: 100, weight_kg: 5, service_type: 'express' });
    expect(express.total).toBeCloseTo(standard.total * 1.6, 1);
  });

  it('applies the economy multiplier (0.8) correctly', () => {
    const standard = estimateCost({ distance_km: 100, weight_kg: 5, service_type: 'standard' });
    const economy = estimateCost({ distance_km: 100, weight_kg: 5, service_type: 'economy' });
    expect(economy.total).toBeCloseTo(standard.total * 0.8, 1);
  });

  it('falls back to standard multiplier for an unrecognized service type', () => {
    const standard = estimateCost({ distance_km: 100, weight_kg: 5, service_type: 'standard' });
    const unknown = estimateCost({ distance_km: 100, weight_kg: 5, service_type: 'nonexistent' });
    expect(unknown.total).toBe(standard.total);
  });

  it('always includes a base fee even for zero distance', () => {
    const result = estimateCost({ distance_km: 0.01, weight_kg: 0.01, service_type: 'standard' });
    expect(result.total).toBeGreaterThan(0);
    expect(result.base_fee).toBe(5.0);
  });

  it('rounds monetary values to 2 decimal places', () => {
    const result = estimateCost({ distance_km: 123.456, weight_kg: 7.891, service_type: 'express' });
    const decimals = (result.total.toString().split('.')[1] || '').length;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it('produces a higher total for a longer distance, all else equal', () => {
    const near = estimateCost({ distance_km: 50, weight_kg: 5, service_type: 'standard' });
    const far = estimateCost({ distance_km: 500, weight_kg: 5, service_type: 'standard' });
    expect(far.total).toBeGreaterThan(near.total);
  });
});
