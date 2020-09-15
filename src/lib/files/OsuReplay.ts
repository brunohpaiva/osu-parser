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

/**
 * Class representing a
 * [osu replay file](https://osu.ppy.sh/help/wiki/osu%21_File_Formats/Osr_%28file_format%29).
 */
export class OsuReplay {
  /**
   * Game mode of the replay.
   * ```
   * 0 = osu! Standard
   * 1 = Taiko
   * 2 = Catch the Beat
   * 3 = osu!mania.
   * ```
   */
  type: number;
  /** Version of the game when the replay was created (ex. 20131216). */
  gameVersion: number;
  /** Beatmap MD5 hash. */
  beatmapHash: string;
  /** Player name. */
  playerName: string;
  /** Replay MD5 hash (includes certain properties of the replay). */
  replayHash: string;
  /** Number of 300s. */
  count300s: number;
  /**
   * Number of 100s in standard, 150s in Taiko, 100s in CTB, 100s in mania.
   */
  count100s: number;
  /** Number of 50s in standard, small fruit in CTB, 50s in mania. */
  count50s: number;
  /** Number of Gekis in standard, Max 300s in mania. */
  countGekis: number;
  /** Number of Katus in standard, 200s in mania. */
  countKatus: number;
  /** Number of misses. */
  countMisses: number;
  /** Total score displayed on the score report. */
  totalScore: number;
  /** Greatest combo displayed on the score report. */
  greatestCombo: number;
  /**
   * If it was a perfect/full combo. Only true with no misses, no slider breaks
   * and no early finished sliders.
   */
  perfectCombo: boolean;
  /** Mods used in the gameplay. */
  modsUsed?: OsuMod[];
  /** Life bar graph. */
  lifeBarGraph: string;
  /**
   * Time stamp ([Windows ticks](http://msdn.microsoft.com/en-us/library/system.datetime.ticks%28v=vs.110%29.aspx))
   */
  windowsTicks: bigint;
  /** Unparsed actions data separated by commas. */
  data: string;
  /** Online Score ID. */
  onlineScoreId: bigint;
  /**
   * {@link data} parsed as a array of {@link OsuAction}.
   */
  actions: OsuAction[];

  /**
   * Converts the {@link windowsTicks} to a {@link Date}.
   * @returns A {@link Date} instance representing the value of {@link windowsTicks}.
   */
  get date() {
    return ticksToDate(this.windowsTicks);
  }

  /**
   * Sets a new {@link windowsTicks} value from a {@link Date}.
   * @param date The new {@link windowsTicks} value to set represented as a {@link Date}.
   */
  set date(date: Date) {
    this.windowsTicks = ticksFromDate(date);
  }

  /**
   * Parses data of a osu replay file from a source.
   * @param source Source that represents a osu replay file.
   * @returns The parsed {@link OsuReplay}.
   */
  static parse(source: OsuBuffer | Buffer | ArrayBuffer | number[]) {
    const buffer =
      source instanceof OsuBuffer
        ? /* istanbul ignore next */ source
        : new OsuBuffer(source);
    buffer.position = 0;

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

    let modsBitwise = buffer.readInt();
    const mods: OsuMod[] = [];
    while (modsBitwise >= 1) {
      const modBits = modsBitwise & (~modsBitwise + 1);
      mods.push(OsuModsEnum[modBits] as OsuMod);
      modsBitwise ^= modBits;
    }

    replay.modsUsed = mods;
    replay.lifeBarGraph = buffer.readVarChar();
    replay.windowsTicks = buffer.readLong();

    const compressedDataLength = buffer.readInt();
    const compressedData = buffer.slice(compressedDataLength);
    replay.data = decompress(compressedData);
    replay.onlineScoreId = buffer.readLong();

    replay.actions = replay.data
      .split(',')
      .filter((string) => !string.startsWith('-12345') && string.includes('|'))
      .map<OsuAction>((string) => {
        const actionData = string.split('|');
        const action = {
          timestamp: parseInt(actionData[0]),
          x: parseFloat(actionData[1]),
          y: parseFloat(actionData[2]),
        } as OsuAction;

        const bitwise = parseInt(actionData[3]);
        action.buttons = Object.keys(OsuButtonsEnum)
          .filter((k: string | OsuButton) => {
            if (typeof OsuButtonsEnum[k] === 'string') {
              const bit = parseInt(k);
              return bit === (bitwise & bit);
            }
            return false;
          })
          .map<OsuButton>((k: string) => OsuButtonsEnum[k]);

        return action;
      });
    return replay;
  }

  /**
   * Writes the replay data in this class instance to a {@link OsuBuffer}.
   * @returns The {@link OsuBuffer} holding the replay data.
   */
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
    buffer.writeByte(/* istanbul ignore next */ this.perfectCombo ? 1 : 0);
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
