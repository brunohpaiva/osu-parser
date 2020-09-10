import test, { ExecutionContext } from 'ava';

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

function writeMacro(t: ExecutionContext, value: bigint, useNodeImpl: boolean) {
  const [buffer, expected] = createBuffers();
  writeBigUInt64LE(buffer, value, 0, useNodeImpl);
  t.deepEqual(buffer, expected);
  writeBigUInt64LE(buffer, value, undefined, useNodeImpl);
  t.deepEqual(buffer, expected);
}

test('can write BigInt to Buffer', writeMacro, 637321042198407465n, true);
test(
  'can write BigInt to Buffer with non-node implementation',
  writeMacro,
  637321042198407465n,
  false
);

test('throws out of bounds error with non-node implementation', (t) => {
  const [buffer] = createBuffers();
  t.throws(() => writeBigUInt64LE(buffer, 637321042198407465n, 10, false), {
    message: /"offset" is out of range/,
  });
  t.throws(() => writeBigUInt64LE(buffer, 2n ** 64n, 0, false), {
    message: /"value" is out of range/,
  });
});
