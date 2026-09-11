const { generateBarcodePng } = require('../services/barcodeService');
const { PNG } = require('pngjs');

describe('barcodeService.generateBarcodePng', () => {
  it('produces a valid PNG buffer', async () => {
    const png = await generateBarcodePng('SW1001AB');
    // A valid PNG starts with the 8-byte PNG signature.
    const signature = png.subarray(0, 8);
    expect(signature.toString('hex')).toBe('89504e470d0a1a0a');
  });

  it('produces an opaque image (no transparency), which some scanners require', async () => {
    const buffer = await generateBarcodePng('SW1001AB');
    const png = PNG.sync.read(buffer);
    let hasTransparency = false;
    for (let i = 3; i < png.data.length; i += 4) {
      if (png.data[i] !== 255) { hasTransparency = true; break; }
    }
    expect(hasTransparency).toBe(false);
  });

  it('produces different image data for different input text', async () => {
    const a = await generateBarcodePng('SW1001AB');
    const b = await generateBarcodePng('SW9999ZZ');
    expect(Buffer.compare(a, b)).not.toBe(0);
  });

  it('produces consistent output for the same input', async () => {
    const a = await generateBarcodePng('SW1001AB');
    const b = await generateBarcodePng('SW1001AB');
    expect(Buffer.compare(a, b)).toBe(0);
  });

  it('handles the full tracking ID alphabet (letters and digits) without throwing', async () => {
    await expect(generateBarcodePng('SWABCDEFGH')).resolves.toBeInstanceOf(Buffer);
    await expect(generateBarcodePng('SW23456789')).resolves.toBeInstanceOf(Buffer);
  });
});
