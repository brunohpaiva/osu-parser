import test from 'ava';

import { writeBigUInt64LE } from './writeBigUInt64LE';

function createBuffers() {
  const expected = Buffer.from([
    0x29,
    0x29,
    0x1e,
    0x78,
    0x1c,
    0x38,
    0xd8,
    0x08,
  ]);
  return [Buffer.alloc(expected.length), expected];
}

test('can write BigInt to Buffer', (t) => {
  const [buffer, expected] = createBuffers();
  writeBigUInt64LE(buffer, 637321042198407465n, 0, true);
  t.deepEqual(buffer, expected);
});

test('can write BigInt to Buffer with non-node implementation', (t) => {
  const [buffer, expected] = createBuffers();
  writeBigUInt64LE(buffer, 637321042198407465n, 0, false);
  t.deepEqual(buffer, expected);
});

test('throws out of bounds error with non-node implementation', (t) => {
  const [buffer] = createBuffers();
  t.throws(() => writeBigUInt64LE(buffer, 637321042198407465n, 10, false), {
    message: /"offset" is out of range/,
  });
  t.throws(() => writeBigUInt64LE(buffer, 2n ** 64n, 0, false), {
    message: /"value" is out of range/,
  });
});
