import test from 'ava';

import { readBigUInt64LE } from './readBigUInt64LE';

function createBuffer() {
  return Buffer.from([0x29, 0x29, 0x1e, 0x78, 0x1c, 0x38, 0xd8, 0x08]);
}

test('can read BigInt from Buffer', (t) => {
  t.is(readBigUInt64LE(createBuffer(), 0, true), 637321042198407465n);
});

test('can read BigInt from Buffer with non-node implementation', (t) => {
  t.is(readBigUInt64LE(createBuffer(), 0, false), 637321042198407465n);
});

test('throws out of bounds error with non-node implementation', (t) => {
  t.throws(() => readBigUInt64LE(createBuffer(), 10, false), {
    message: /"offset" is out of range/,
  });
});
