import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectEncoding, detectEncodingFromBytes } from '../src/index.js';

function bytes(...values) {
  return new Uint8Array(values);
}

test('detects UTF-8 BOM', () => {
  assert.equal(detectEncodingFromBytes(bytes(0xef, 0xbb, 0xbf, 0x68, 0x69)), 'utf-8');
});

test('detects UTF-16LE BOM', () => {
  assert.equal(detectEncodingFromBytes(bytes(0xff, 0xfe, 0x68, 0x00)), 'utf-16le');
});

test('detects UTF-16BE BOM', () => {
  assert.equal(detectEncodingFromBytes(bytes(0xfe, 0xff, 0x00, 0x68)), 'utf-16be');
});

test('detects ASCII', () => {
  assert.equal(detectEncodingFromBytes(bytes(0x68, 0x65, 0x6c, 0x6c, 0x6f)), 'ascii');
});

test('detects UTF-8 without BOM', () => {
  assert.equal(detectEncodingFromBytes(bytes(0xc3, 0xa9)), 'utf-8');
});

test('detects Latin1 when bytes are not valid UTF-8', () => {
  assert.equal(detectEncodingFromBytes(bytes(0xe9)), 'latin1');
});

test('detects UTF-16LE without BOM via zero-byte pattern', () => {
  assert.equal(detectEncodingFromBytes(bytes(0x68, 0x00, 0x69, 0x00, 0x21, 0x00)), 'utf-16le');
});

test('detects UTF-16BE without BOM via zero-byte pattern', () => {
  assert.equal(detectEncodingFromBytes(bytes(0x00, 0x68, 0x00, 0x69, 0x00, 0x21)), 'utf-16be');
});

test('BOM takes precedence over ASCII', () => {
  assert.equal(detectEncodingFromBytes(bytes(0xef, 0xbb, 0xbf, 0x41)), 'utf-8');
});

test('empty input is ASCII', () => {
  assert.equal(detectEncodingFromBytes(bytes()), 'ascii');
});

test('detectEncoding accepts ArrayBuffer', () => {
  const buf = new Uint8Array([0x68, 0x69]).buffer;
  assert.equal(detectEncoding(buf), 'ascii');
});

test('detectEncoding accepts Uint8Array', () => {
  assert.equal(detectEncoding(bytes(0xc3, 0xa9)), 'utf-8');
});

test('rejects invalid input', () => {
  assert.throws(() => detectEncoding('hello'), TypeError);
  assert.throws(() => detectEncodingFromBytes([1, 2, 3]), TypeError);
});
