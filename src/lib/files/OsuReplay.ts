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
  date: Date;
  data: string;
  onlineScoreId: bigint;
  actions: OsuAction[];
}
