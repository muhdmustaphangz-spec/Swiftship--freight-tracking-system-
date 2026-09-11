const { generateTrackingId } = require('../services/trackingIdService');

describe('trackingIdService.generateTrackingId', () => {
  it('always starts with SW', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateTrackingId().startsWith('SW')).toBe(true);
    }
  });

  it('produces a 10-character ID (SW + 8 chars)', () => {
    expect(generateTrackingId()).toHaveLength(10);
  });

  it('never includes visually ambiguous characters (0, O, 1, I)', () => {
    for (let i = 0; i < 50; i++) {
      const id = generateTrackingId();
      expect(id).not.toMatch(/[01OI]/);
    }
  });

  it('generates different IDs across calls (collision resistance sanity check)', () => {
    const ids = new Set();
    for (let i = 0; i < 200; i++) ids.add(generateTrackingId());
    // With an 8-char ID from a 32-char alphabet, 200 draws should essentially never collide.
    expect(ids.size).toBe(200);
  });
});
