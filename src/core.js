const UTF8_BOM = [0xef, 0xbb, 0xbf];
const UTF16LE_BOM = [0xff, 0xfe];
const UTF16BE_BOM = [0xfe, 0xff];

function startsWith(bytes, prefix) {
  if (bytes.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (bytes[i] !== prefix[i]) return false;
  }
  return true;
}

function isValidUtf8(bytes) {
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b < 0x80) {
      i += 1;
    } else if ((b & 0xe0) === 0xc0) {
      if (i + 1 >= bytes.length) return false;
      const b1 = bytes[i + 1];
      if ((b1 & 0xc0) !== 0x80) return false;
      const code = ((b & 0x1f) << 6) | (b1 & 0x3f);
      if (code < 0x80) return false;
      i += 2;
    } else if ((b & 0xf0) === 0xe0) {
      if (i + 2 >= bytes.length) return false;
      const b1 = bytes[i + 1];
      const b2 = bytes[i + 2];
      if ((b1 & 0xc0) !== 0x80 || (b2 & 0xc0) !== 0x80) return false;
      const code = ((b & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f);
      if (code < 0x800) return false;
      if (code >= 0xd800 && code <= 0xdfff) return false;
      i += 3;
    } else if ((b & 0xf8) === 0xf0) {
      if (i + 3 >= bytes.length) return false;
      const b1 = bytes[i + 1];
      const b2 = bytes[i + 2];
      const b3 = bytes[i + 3];
      if ((b1 & 0xc0) !== 0x80 || (b2 & 0xc0) !== 0x80 || (b3 & 0xc0) !== 0x80) return false;
      const code = ((b & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
      if (code < 0x10000 || code > 0x10ffff) return false;
      i += 4;
    } else {
      return false;
    }
  }
  return true;
}

function isAscii(bytes) {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] > 0x7f) return false;
  }
  return true;
}

function isLatin1(bytes) {
  return true;
}

function hasUtf16Pattern(bytes, le) {
  if (bytes.length < 4) return false;
  let zeroCount = 0;
  let total = 0;
  if (le) {
    for (let i = 1; i < bytes.length; i += 2) {
      total++;
      if (bytes[i] === 0x00) zeroCount++;
    }
  } else {
    for (let i = 0; i < bytes.length; i += 2) {
      total++;
      if (bytes[i] === 0x00) zeroCount++;
    }
  }
  return total > 0 && zeroCount / total > 0.5;
}

/**
 * Detects the encoding of a byte sequence by inspecting BOM and byte patterns.
 *
 * The detector follows this precedence, which is the only interpretation this
 * library claims: an explicit BOM always wins over pattern analysis. When no BOM
 * is present, the bytes are checked for valid UTF-8; if they are valid UTF-8 and
 * contain a multi-byte sequence, the result is UTF-8. If all bytes are ASCII the
 * result is ASCII. Otherwise the result is Latin1. UTF-16 without a BOM is only
 * reported when a strong zero-byte pattern is present, because otherwise
 * arbitrary binary data can look like UTF-16.
 *
 * Returning a plain string rather than a confidence object is deliberate: the
 * caller almost always wants a single decision, and the ambiguous cases are
 * documented rather than hidden behind a score.
 *
 * @param {Uint8Array} bytes
 * @returns {'utf-8' | 'utf-16le' | 'utf-16be' | 'latin1' | 'ascii'}
 */
export function detectEncodingFromBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('detectEncodingFromBytes expects a Uint8Array');
  }

  if (startsWith(bytes, UTF8_BOM)) return 'utf-8';
  if (startsWith(bytes, UTF16LE_BOM)) return 'utf-16le';
  if (startsWith(bytes, UTF16BE_BOM)) return 'utf-16be';

  if (isAscii(bytes)) {
    if (hasUtf16Pattern(bytes, true)) return 'utf-16le';
    if (hasUtf16Pattern(bytes, false)) return 'utf-16be';
    return 'ascii';
  }

  if (isValidUtf8(bytes)) return 'utf-8';

  if (hasUtf16Pattern(bytes, true)) return 'utf-16le';
  if (hasUtf16Pattern(bytes, false)) return 'utf-16be';

  return 'latin1';
}

/**
 * Convenience wrapper that accepts an ArrayBuffer or a Uint8Array.
 *
 * @param {ArrayBuffer | Uint8Array} input
 * @returns {'utf-8' | 'utf-16le' | 'utf-16be' | 'latin1' | 'ascii'}
 */
export function detectEncoding(input) {
  if (input instanceof Uint8Array) return detectEncodingFromBytes(input);
  if (input instanceof ArrayBuffer) return detectEncodingFromBytes(new Uint8Array(input));
  throw new TypeError('detectEncoding expects an ArrayBuffer or Uint8Array');
}
