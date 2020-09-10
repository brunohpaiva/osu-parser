/**
 * Minimum BigInt value.
 * @internal
 * */
const MIN = 0n;
/**
 * Maximum BigInt value.
 * @internal
 * */
const MAX = 0xffffffffffffffffn;

/**
 * Writes a 32 bits number to a Buffer.
 * @internal
 * @param buffer The target buffer.
 * @param value The 32bit number to write in the buffer.
 * @param offset Zero-based index number indicating the start
 * position to start writing in.
 */
function writeValues(buffer: Buffer, value: number, offset: number) {
  buffer[offset++] = value;
  value = value >> 8;
  buffer[offset++] = value;
  value = value >> 8;
  buffer[offset++] = value;
  value = value >> 8;
  buffer[offset++] = value;
}

/**
 * Writes a BigInt number to a Buffer.
 * @internal
 * @param buffer The target buffer.
 * @param value The BigInt number to write in the buffer.
 * @param offset Zero-based index number indicating the start position
 * to start writing in. Default: 0
 * @param useNodeImpl Boolean value representing when to use
 * the {@link Buffer#writeBigUInt64LE NodeJS implementation}
 */
export function writeBigUInt64LE(
  buffer: Buffer,
  value: bigint,
  offset = 0,
  useNodeImpl = typeof buffer.writeBigUInt64LE !== 'undefined'
) {
  if (useNodeImpl) {
    buffer.writeBigUInt64LE(value, offset);
  } else {
    if (value < MIN || value > MAX) {
      throw new RangeError(
        `The value of "value" is out of range. It must be >= 0n and < 2n ** 64n. Received ${value}`
      );
    }

    if (buffer[offset] === undefined || buffer[offset + 7] === undefined) {
      throw new RangeError(
        `The value of "offset" is out of range. It must be >= 0 and <= ${
          buffer.length - 8
        }. Received ${offset}`
      );
    }

    writeValues(buffer, Number(value & 0xffffffffn), offset);
    writeValues(buffer, Number((value >> 32n) & 0xffffffffn), offset + 4);
  }
}
