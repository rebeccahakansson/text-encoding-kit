# text-encoding-kit

Detects UTF-8, UTF-16, Latin1, and ASCII encoding of files by examining BOM and byte patterns.

```js
import { detectEncoding, detectEncodingFromBytes } from 'text-encoding-kit';

const bytes = new Uint8Array([0xc3, 0xa9]); // "é" in UTF-8
console.log(detectEncodingFromBytes(bytes)); // 'utf-8'

const buffer = new Uint8Array([0x68, 0x69]).buffer;
console.log(detectEncoding(buffer)); // 'ascii'
```

## Why

Most encoding detectors either require a large dependency or guess silently. This library makes a single, documented decision from the bytes it is given: BOM first, then UTF-8 validity, then ASCII, then a zero-byte pattern for UTF-16, and finally Latin1. The trade-off is that it will never report a confidence score or a list of candidates. If the bytes are genuinely ambiguous, it picks the most likely encoding and the caller can decide whether to trust it.

## The awkward edge

UTF-16 without a BOM is detected only when more than half of the expected zero bytes are present. Short strings such as a single ASCII character encoded as UTF-16LE (`0x68 0x00`) are reported as ASCII, because the pattern is too weak to distinguish from ordinary binary data. Add a BOM if you need a guaranteed result.

## API

### `detectEncodingFromBytes(bytes)`

Takes a `Uint8Array` and returns one of `'utf-8'`, `'utf-16le'`, `'utf-16be'`, `'latin1'`, or `'ascii'`. Throws a `TypeError` if the argument is not a `Uint8Array`.

### `detectEncoding(input)`

Accepts either an `ArrayBuffer` or a `Uint8Array` and returns the same strings as `detectEncodingFromBytes`. Throws a `TypeError` for any other input.
