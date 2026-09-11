const { customAlphabet } = require('nanoid');

// No confusing chars (0/O, 1/I) since these get printed on labels and read aloud.
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const nanoid = customAlphabet(alphabet, 8);

function generateTrackingId() {
  return 'SW' + nanoid();
}

module.exports = { generateTrackingId };
