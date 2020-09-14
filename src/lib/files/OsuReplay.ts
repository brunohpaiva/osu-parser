import { compress, decompress } from 'lzma';

import { OsuBuffer } from '../OsuBuffer';
import { ticksFromDate, ticksToDate } from '../utils';

export enum OsuButtonsEnum {
  MouseOne = 1,
  MouseTwo = 2,
  KeyboardOne = 4,
  KeyboardTwo = 8,
  Smoke = 16,
}

export type OsuButton = keyof typeof OsuButtonsEnum;

export interface OsuAction {
  timestamp: number;
  x: number;
  y: number;
  buttons: OsuButton[];
}

export enum OsuModsEnum {
  'NoFail' = 1,
  'Easy' = 2,
  'TouchDevice' = 4,
  'Hidden' = 8,
  'HardRock' = 16,
  'SuddenDeath' = 32,
  'DoubleTime' = 64,
  'Relax' = 128,
  'HalfTime' = 256,
  'Nightcore' = 512,
  'Flashlight' = 1024,
  'Autoplay' = 2048,
  'SpunOut' = 4096,
  'Relax2' = 8192,
  'Perfect' = 16384,
  'Key4' = 32768,
  'Key5' = 65536,
  'Key6' = 131072,
  'Key7' = 262144,
  'Key8' = 524288,
  'FadeIn' = 1048576,
  'Random' = 2097152,
  'Cinema' = 4194304,
  'Target' = 8388608,
  'Key9' = 16777216,
  'KeyCoop' = 33554432,
  'Key1' = 67108864,
  'Key3' = 134217728,
  'Key2' = 268435456,
  'ScoreV2' = 536870912,
  'Mirror' = 1073741824,
  'KeyMod' = Key1 |
    Key2 |
    Key3 |
    Key4 |
    Key5 |
    Key6 |
    Key7 |
    Key8 |
    Key9 |
    KeyCoop,
  'FreeModAllowed' = NoFail |
    Easy |
    Hidden |
    HardRock |
    SuddenDeath |
    Flashlight |
    FadeIn |
    Relax |
    Relax2 |
    SpunOut |
    KeyMod,
  'ScoreIncreaseMods' = Hidden | HardRock | DoubleTime | Flashlight | FadeIn,
}

export type OsuMod = keyof typeof OsuModsEnum;

export class OsuReplay {
  type: number;
  gameVersion: number;
  beatmapHash: string;
  playerName: string;
  replayHash: string;
  count300s: number;
  count100s: number;
  count50s: number;
  countGekis: number;
  countKatus: number;
  countMisses: number;
  totalScore: number;
  greatestCombo: number;
  perfectCombo: boolean;
  modsUsed?: OsuMod[];
  lifeBarGraph: string;
  windowsTicks: bigint;
  data: string;
  onlineScoreId: bigint;
  actions: OsuAction[];

  get date() {
    return ticksToDate(this.windowsTicks);
  }

  set date(date: Date) {
    this.windowsTicks = ticksFromDate(date);
  }

  static parse(source: OsuBuffer | Buffer | ArrayBuffer | number[]) {
    const buffer = new OsuBuffer(source);
    const replay = new OsuReplay();
    replay.type = buffer.readByte();
    replay.gameVersion = buffer.readInt();
    replay.beatmapHash = buffer.readVarChar();
    replay.playerName = buffer.readVarChar();
    replay.replayHash = buffer.readVarChar();
    replay.count300s = buffer.readShort();
    replay.count100s = buffer.readShort();
    replay.count50s = buffer.readShort();
    replay.countGekis = buffer.readShort();
    replay.countKatus = buffer.readShort();
    replay.countMisses = buffer.readShort();
    replay.totalScore = buffer.readInt();
    replay.greatestCombo = buffer.readShort();
    replay.perfectCombo = Boolean(buffer.readByte());

    function parseMods(bits: number): OsuMod[] {
      const mods = [] as OsuMod[];
      while (bits >= 1) {
        const modBits = bits & (~bits + 1);
        mods.push(OsuModsEnum[modBits] as OsuMod);
        bits ^= modBits;
      }
      return mods;
    }

    replay.modsUsed = parseMods(buffer.readInt());
    replay.lifeBarGraph = buffer.readVarChar();
    replay.windowsTicks = buffer.readLong();
    const compressedDataLength = buffer.readInt();

    const compressedData = buffer.slice(compressedDataLength);
    replay.data = decompress(compressedData);
    replay.onlineScoreId = buffer.readLong();

    replay.actions = replay.data
      .split(',')
      .reduce<OsuAction[]>((actions, string) => {
        const splitted = string.split('|');
        if (splitted.length !== 4 || splitted[0] === '-12345') {
          return actions;
        }

        const action = {
          timestamp: parseInt(splitted[0]),
          x: parseFloat(splitted[1]),
          y: parseFloat(splitted[2]),
        } as OsuAction;

        const bitwise = Number(splitted[3]);
        action.buttons = Object.keys(OsuButtonsEnum)
          .filter((k: string | OsuButton) => {
            if (typeof OsuButtonsEnum[k] === 'string') {
              const bit = parseInt(k);
              return bit === (bitwise & bit);
            }
            return false;
          })
          .map((k: string) => OsuButtonsEnum[k]) as OsuButton[];

        actions.push(action);
        return actions;
      }, []);
    return replay;
  }

  writeToOsuBuffer() {
    const buffer = new OsuBuffer();
    buffer.writeByte(this.type);
    buffer.writeInt(this.gameVersion);
    buffer.writeVarChar(this.beatmapHash);
    buffer.writeVarChar(this.playerName);
    buffer.writeVarChar(this.replayHash);
    buffer.writeShort(this.count300s);
    buffer.writeShort(this.count100s);
    buffer.writeShort(this.count50s);
    buffer.writeShort(this.countGekis);
    buffer.writeShort(this.countKatus);
    buffer.writeShort(this.countMisses);
    buffer.writeInt(this.totalScore);
    buffer.writeShort(this.greatestCombo);
    buffer.writeByte(this.perfectCombo ? 1 : 0);
    buffer.writeInt(
      this.modsUsed.reduce<number>((int, mod) => int + OsuModsEnum[mod], 0)
    );
    buffer.writeVarChar(this.lifeBarGraph);
    buffer.writeLong(this.windowsTicks);

    const data = this.actions
      .map<string>((action) => {
        const bit = action.buttons.reduce<number>(
          (prev, button) => prev + OsuButtonsEnum[button],
          0
        );
        return `${action.timestamp}|${action.x}|${action.y}|${bit}`;
      })
      .join(',');

    const compressedData = compress(data);
    buffer.writeInt(compressedData.length);
    buffer.concat(Buffer.from(compressedData));

    buffer.writeLong(this.onlineScoreId);
    return buffer;
  }
}
