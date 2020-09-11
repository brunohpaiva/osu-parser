import { readBigUInt64LE, writeBigUInt64LE } from './utils';

export class OsuBuffer {
  /** Buffer holding all the binary data. */
  buffer: Buffer;
  /**
   * Zero-based indicating the current position used for reading from the Buffer.
   */
  position = 0;

  /**
   * Creates a OsuBuffer instance with optional initial data.
   * @param data Initial data.
   */
  constructor(data?: OsuBuffer | Buffer | ArrayBuffer | number[]) {
    if (data instanceof OsuBuffer) {
      this.buffer = data.buffer;
    } else if (data instanceof Buffer) {
      this.buffer = data;
    } else {
      this.buffer = Buffer.from(data);
    }
  }

  /**
   * Concatenates a buffer to the current one.
   * @internal
   * @param otherBuffer A buffer to append to the {@link buffer current buffer}.
   */
  private concat(otherBuffer: Buffer) {
    this.buffer = Buffer.concat([this.buffer, otherBuffer]);
  }

  /**
   * Slices the {@link buffer} returning a new one with the desired length.
   * @param length The length to slice.
   * @param start Zero-based start position to slice.
   * Default: {@link position current position} plus length parameter.
   * @returns A {@link Buffer} with size equals to the length parameter.
   */
  slice(length: number, start = this.positionIncrement(length)) {
    return this.buffer.slice(start, start + length);
  }

  /**
   * Reads a byte value from the {@link buffer}.
   * @param offset Zero-based position to start reading in.
   * Default: {@link position current position} plus one.
   * @returns The read byte.
   */
  readByte(offset = this.positionIncrement(1)) {
    return this.buffer.readUInt8(offset);
  }

  /**
   * Reads a short value from the {@link buffer}.
   * @param offset Zero-based position to start reading in.
   * Default: {@link position current position} plus two.
   * @returns The read short.
   */
  readShort(offset = this.positionIncrement(2)) {
    return this.buffer.readUInt16LE(offset);
  }

  /**
   * Reads a int value from the {@link buffer}.
   * @param offset Zero-based position to start reading in.
   * Default: {@link position current position} plus four.
   * @returns The read int.
   */
  readInt(offset = this.positionIncrement(4)) {
    return this.buffer.readUInt32LE(offset);
  }

  /**
   * Reads a long value from the {@link buffer}.
   * @param offset Zero-based position to start reading in.
   * Default: {@link position current position} plus eight.
   * @param useNodeImpl Boolean value representing when
   * to use the {@link Buffer#readBigUInt64LE NodeJS implementation}.
   * @returns The read long.
   */
  readLong(offset = this.positionIncrement(8), useNodeImpl?: boolean) {
    return readBigUInt64LE(this.buffer, offset, useNodeImpl);
  }

  /**
   * Reads a varInt value from the {@link buffer}.
   * @internal
   * @param startOffset start offset.
   * @returns A array containing first the varInt value,
   * and then a zero-based indicating where the varInt ends in the {@link buffer}.
   */
  readVarInt(startOffset?: number) {
    let offset =
      typeof startOffset !== 'undefined' ? startOffset : this.position;
    let result = 0;
    let shift = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const byte = this.readByte(offset++);
      result |= (byte & 0x7f) << shift;
      shift += 7;
      if ((0x80 & byte) === 0) {
        /* istanbul ignore if */
        if (shift < 32 && (byte & 0x40) !== 0) {
          result = result | (~0 << shift);
          break;
        }
        break;
      }
    }

    if (typeof startOffset === 'undefined') {
      this.position = offset;
    }
    return [result, offset];
  }

  /**
   * Reads a varChar value from the {@link buffer}.
   * @param startOffset A.
   * @param encoding The varChar encoding to use when reading from the {@link buffer}.
   * Default: 'utf8'.
   * @returns The read varChar.
   */
  readVarChar(startOffset?: number, encoding?: BufferEncoding) {
    const suppliedStartOffset = typeof startOffset !== 'undefined';
    let offset = suppliedStartOffset ? startOffset : this.position;
    if (this.readByte(offset++) === 0x0b) {
      if (!suppliedStartOffset) this.position += 1;
      const [stringLength, endOffset] = this.readVarInt(offset);
      if (!suppliedStartOffset) this.position = endOffset + stringLength;
      return this.slice(stringLength, endOffset).toString(encoding);
    }
    throw new Error("The first byte isn't equals to 0x0b. Not a varChar.");
  }

  /**
   * Writes a int with a specified byte length.
   * @param value The value to write.
   * @param byteLength The length in bytes of the value.
   * @internal
   */
  private writeUInt(value: number, byteLength: number) {
    const buffer = Buffer.alloc(byteLength);
    buffer.writeUIntLE(value, 0, byteLength);
    this.concat(buffer);
  }

  /**
   * Writes a byte value to the {@link buffer}.
   * @param value The value to write.
   */
  writeByte(value: number) {
    this.writeUInt(value, 1);
  }

  /**
   * Writes a short value to the {@link buffer}.
   * @param value The value to write.
   */
  writeShort(value: number) {
    this.writeUInt(value, 2);
  }

  /**
   * Writes a int value to the {@link buffer}.
   * @param value The value to write.
   */
  writeInt(value: number) {
    this.writeUInt(value, 4);
  }

  /**
   * Writes a long value to the {@link buffer}.
   * @param value The value to write.
   * @param useNodeImpl Boolean value representing when
   * to use the {@link Buffer#writeBigUInt64LE NodeJS implementation}.
   */
  writeLong(value: bigint, useNodeImpl?: boolean) {
    const buffer = Buffer.alloc(8);
    writeBigUInt64LE(buffer, value, 0, useNodeImpl);
    this.concat(buffer);
  }

  /**
   * Encodes a number to a varInt.
   * @param value The value to encode.
   * @returns The encoded value as a array of bytes.
   */
  static encodeVarInt(value: number) {
    if (value < 0) {
      throw new RangeError(
        `The value of "value" is out of range. It must be >= 0`
      );
    }

    value |= 0;
    const bytes = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const byte = value & 0x7f;
      value >>= 7;
      if (value === 0 && (byte & 0x40) === 0) {
        bytes.push(byte);
        break;
      }
      bytes.push(byte | 0x80);
    }
    return bytes;
  }

  /**
   * Writes a varInt value to the {@link buffer}.
   * @param value The value to write.
   */
  writeVarInt(value: number) {
    this.concat(Buffer.from(OsuBuffer.encodeVarInt(value)));
  }

  /**
   * Writes a varChar value to the {@link buffer}.
   * @param value The value to write.
   * @param nullable Boolean representing if the varChar is nullable.
   * @param encoding The varChar encoding to use when writing to the {@link buffer}.
   * Default: 'utf8'.
   */
  writeVarChar(value: string, nullable = false, encoding?: BufferEncoding) {
    const bytes = [];
    if (value.length === 0) {
      if (nullable) {
        bytes.push(0);
      } else {
        bytes.push(0x0b, 0);
      }
    } else {
      const length = Buffer.byteLength(value, encoding);
      bytes.push(0x0b, ...OsuBuffer.encodeVarInt(length));

      const stringBuffer = Buffer.from(value, encoding);
      bytes.push(...stringBuffer);
    }

    this.concat(Buffer.from(bytes));
  }

  /**
   * Adds the length to the {@link position current position} variable.
   * @internal
   * @param length The length to increment in {@link position}.
   * @returns The old position.
   */
  positionIncrement(length: number) {
    const position = this.position;
    this.position += length;
    return position;
  }
}
