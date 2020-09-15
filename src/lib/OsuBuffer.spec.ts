import test, { ExecutionContext, Macro } from 'ava';

import { OsuBuffer } from './OsuBuffer';

const createOsuBuffer = (...data: number[]) => new OsuBuffer(data);
const method = (prefix: string, type: string) =>
  `${prefix}${type.charAt(0).toUpperCase() + type.slice(1)}`;
type BufferType = number | bigint | string;

const readMacro: Macro<[string, BufferType, number[]]> = (
  t: ExecutionContext,
  type,
  expected,
  data
) => {
  t.is(createOsuBuffer(...data)[method('read', type)](), expected);
};

readMacro.title = (providedTitle, type) => `${providedTitle || type}: can read`;

const writeMacro: Macro<[string, BufferType]> = (
  t: ExecutionContext,
  type,
  expected
) => {
  const osuBuffer = createOsuBuffer();
  osuBuffer[method('write', type)](expected);
  t.is(osuBuffer[method('read', type)](), expected);
};

writeMacro.title = (providedTitle, type) =>
  `${providedTitle || type}: can write`;

test([readMacro, writeMacro], 'byte', 159, [0x9f]);
test([readMacro, writeMacro], 'short', 2827, [0x0b, 0x0b]);
test([readMacro, writeMacro], 'int', 671573433, [0xb9, 0x65, 0x07, 0x28]);
test([readMacro, writeMacro], 'long', 637321042198407465n, [
  0x29,
  0x29,
  0x1e,
  0x78,
  0x1c,
  0x38,
  0xd8,
  0x08,
]);

test('varInt: can read', (t) => {
  t.deepEqual(createOsuBuffer(0xe2, 0).readVarInt(), [98, 2]);
  t.deepEqual(createOsuBuffer(0, 0, 0xe2, 0).readVarInt(2), [98, 4]);
});

test('varInt: can write', (t) => {
  const buffer = createOsuBuffer();
  buffer.writeVarInt(98);
  t.deepEqual(buffer.readVarInt(), [98, 2]);
});

test('small varChar', [readMacro, writeMacro], 'varChar', 'Test', [
  0x0b,
  0x04,
  0x54,
  0x65,
  0x73,
  0x74,
]);

const LONG_VARCHAR =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' +
  'Nullam in nulla vel velit auctor pharetra.';

test('long varChar', [readMacro, writeMacro], 'varChar', LONG_VARCHAR, [
  0x0b,
  ...OsuBuffer.encodeVarInt(Buffer.byteLength(LONG_VARCHAR)),
  ...Buffer.from(LONG_VARCHAR),
]);

test('can write nullable empty varChar', (t) => {
  const osuBuffer = createOsuBuffer();
  osuBuffer.writeVarChar('', true);
  t.deepEqual(osuBuffer.buffer, Buffer.from([0]));
});

test('can write empty varChar', (t) => {
  const osuBuffer = createOsuBuffer();
  osuBuffer.writeVarChar('');
  t.deepEqual(osuBuffer.buffer, Buffer.from([0x0b, 0]));
});

test('can read empty varChar', (t) => {
  t.is(createOsuBuffer(0x0b, 0).readVarChar(), '');
});

test('can read varChar specifying the offset', (t) => {
  const osuBuffer = createOsuBuffer(0, 0, 0x0b, 0x04, 0x54, 0x65, 0x73, 0x74);
  t.is(osuBuffer.readVarChar(2), 'Test');
});

test('throws error when trying to encode varInt with value -1', (t) => {
  t.throws(() => OsuBuffer.encodeVarInt(-1), {
    message: /"value" is out of range/,
  });
});

test('throws error when reading a value that is not a varChar', (t) => {
  t.throws(
    () => createOsuBuffer(0x0a, 0x05, 0x54, 0x65, 0x73, 0x74).readVarChar(),
    {
      message: /Not a varChar/,
    }
  );
});

test('can create OsuBuffer from a Buffer', (t) => {
  const buffer = Buffer.from([
    0x0b,
    0x04,
    0x54,
    0x65,
    0x73,
    0x74,
    0x0b,
    0x0b,
    0x9f,
  ]);
  const osuBuffer = new OsuBuffer(buffer);
  t.is(osuBuffer.readVarChar(), 'Test');
  t.is(osuBuffer.readShort(), 2827);
  t.is(osuBuffer.readByte(), 159);
});

test('can create OsuBuffer from another OsuBuffer', (t) => {
  const inputOsuBuffer = createOsuBuffer(
    0x0b,
    0x04,
    0x54,
    0x65,
    0x73,
    0x74,
    0x0b,
    0x0b,
    0x9f
  );
  const osuBuffer = new OsuBuffer(inputOsuBuffer);
  t.is(osuBuffer.readVarChar(), inputOsuBuffer.readVarChar());
  t.is(osuBuffer.readShort(), inputOsuBuffer.readShort());
  t.is(osuBuffer.readByte(), inputOsuBuffer.readByte());
});
