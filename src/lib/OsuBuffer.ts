import { readBigUInt64LE, writeBigUInt64LE } from './utils';

export class OsuBuffer {
  buffer: Buffer;
  private position = 0;

  constructor(data?: OsuBuffer | Buffer | ArrayBuffer | number[]) {
    if (data instanceof OsuBuffer) {
      this.buffer = data.buffer;
    } else if (data instanceof Buffer) {
      this.buffer = data;
    } else {
      this.buffer = Buffer.from(data);
    }
  }

  private concat(otherBuffer: Buffer) {
    this.buffer = Buffer.concat([this.buffer, otherBuffer]);
  }

  slice(length: number, start = this.positionIncrement(length)) {
    return this.buffer.slice(start, start + length);
  }

  readByte(offset = this.positionIncrement(1)) {
    return this.buffer.readUInt8(offset);
  }

  readShort(offset = this.positionIncrement(2)) {
    return this.buffer.readUInt16LE(offset);
  }

  readInt(offset = this.positionIncrement(4)) {
    return this.buffer.readUInt32LE(offset);
  }

  readLong(offset = this.positionIncrement(8), useNodeImpl?: boolean) {
    return readBigUInt64LE(this.buffer, offset, useNodeImpl);
  }

  private readVarInt() {
    let result = 0;
    let shift = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const byte = this.readByte();
      result |= (byte & 0x7f) << shift;
      shift += 7;
      if ((0x80 & byte) === 0) {
        if (shift < 32 && (byte & 0x40) !== 0) {
          return result | (~0 << shift);
        }
        return result;
      }
    }
  }

  readVarChar(encoding?: BufferEncoding) {
    if (this.readByte() === 0x0b) {
      const length = this.readVarInt();
      return this.slice(length).toString(encoding);
    }
    throw new Error("The first byte isn't equals to 0x0b. Not a varChar.");
  }

  private writeUInt(value: number, length: number) {
    const buffer = Buffer.alloc(length);
    buffer.writeUIntLE(value, 0, length);
    this.concat(buffer);
  }

  writeByte(value: number) {
    this.writeUInt(value, 1);
  }

  writeShort(value: number) {
    this.writeUInt(value, 2);
  }

  writeInt(value: number) {
    this.writeUInt(value, 4);
  }

  writeLong(value: bigint, useNodeImpl?: boolean) {
    const buffer = Buffer.alloc(8);
    writeBigUInt64LE(buffer, value, 0, useNodeImpl);
    this.concat(buffer);
  }

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

  private positionIncrement(length: number) {
    const position = this.position;
    this.position += length;
    return position;
  }
}
