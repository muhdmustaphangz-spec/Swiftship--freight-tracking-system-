const bwipjs = require('bwip-js');
const { PNG } = require('pngjs');

/**
 * bwip-js always outputs RGBA PNGs, but several barcode scanners (verified:
 * zbar and pyzbar) fail to decode a barcode with a transparent/semi-transparent
 * alpha channel, even when the pixels are visually black-and-white. Flattening
 * against an opaque white background before embedding fixes this — verified
 * by round-tripping a generated barcode through zbarimg and confirming it
 * decodes back to the original text only after this flattening step.
 *
 * Implemented with pngjs (pure JavaScript, no native bindings) rather than a
 * native image library such as sharp, consistent with this project's general
 * preference for dependencies that need no compiler/build toolchain.
 */
function flattenToOpaqueWhite(rgbaBuffer) {
  return new Promise((resolve, reject) => {
    const png = new PNG();
    png.parse(rgbaBuffer, (err, data) => {
      if (err) return reject(err);
      const out = new PNG({ width: data.width, height: data.height });
      for (let i = 0; i < data.data.length; i += 4) {
        const alpha = data.data[i + 3] / 255;
        out.data[i] = Math.round(data.data[i] * alpha + 255 * (1 - alpha));
        out.data[i + 1] = Math.round(data.data[i + 1] * alpha + 255 * (1 - alpha));
        out.data[i + 2] = Math.round(data.data[i + 2] * alpha + 255 * (1 - alpha));
        out.data[i + 3] = 255;
      }
      resolve(PNG.sync.write(out));
    });
  });
}

/**
 * Generates a real, scannable Code128 barcode PNG buffer for the given text
 * (intended for a shipment tracking ID). Code128 was chosen because it
 * supports the full alphanumeric character set used by our tracking IDs
 * (e.g. "SW7F3K9QRT") without needing a numeric-only or restricted symbology.
 */
async function generateBarcodePng(text) {
  const raw = await bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
    paddingwidth: 6,
    paddingheight: 6,
  });
  return flattenToOpaqueWhite(raw);
}

module.exports = { generateBarcodePng };
