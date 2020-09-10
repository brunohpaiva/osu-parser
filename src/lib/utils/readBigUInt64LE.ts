/**
 * Reads a BigInt number from a Buffer.
 * @internal
 * @param buffer The source buffer.
 * @param offset Zero-based index number indicating the start position to
 * start reading on. Default: 0
 * @param useNodeImpl Boolean value representing when
 * to use the {@link Buffer#readBigUInt64LE NodeJS implementation}.
 */
export function readBigUInt64LE(
  buffer: Buffer,
  offset = 0,
  useNodeImpl = typeof buffer.readBigUInt64LE !== 'undefined'
): bigint {
  if (useNodeImpl) {
    return buffer.readBigUInt64LE(offset);
  }

  if (buffer[offset] === undefined || buffer[offset + 7] === undefined)
    throw new RangeError(
      `The value of "offset" is out of range. It must be >= 0 and <= ${
        buffer.length - 8
      }. Received ${offset}`
    );

  const first = buffer[offset];
  const last = buffer[offset + 7];
  const lo =
    first +
    buffer[++offset] * 2 ** 8 +
    buffer[++offset] * 2 ** 16 +
    buffer[++offset] * 2 ** 24;

  const hi =
    buffer[++offset] +
    buffer[++offset] * 2 ** 8 +
    buffer[++offset] * 2 ** 16 +
    last * 2 ** 24;

  return BigInt(lo) + (BigInt(hi) << 32n);
}
