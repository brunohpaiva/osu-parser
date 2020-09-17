# osu-parser

[![npm version](https://img.shields.io/npm/v/@brunohpaiva/osu-parser.svg?style=flat)](https://www.npmjs.org/package/@brunohpaiva/osu-parser)
[![npm downloads](https://img.shields.io/npm/dm/@brunohpaiva/osu-parser.svg?style=flat)](http://npm-stat.com/charts.html?package=@brunohpaiva/osu-parser)
[![npm bundle size](https://img.shields.io/bundlephobia/min/@brunohpaiva/osu-parser?style=flat)](https://www.npmjs.org/package/@brunohpaiva/osu-parser)

A library to read and write osu files for Node.js

## Installing

Using npm:

```bash
$ npm install @brunohpaiva/osu-parser
```

Using yarn:

```bash
$ yarn add @brunohpaiva/osu-parser
```

## Examples

#### Replay file (.osr)

Reading from a file
```ts
import { OsuReplay } from '@brunohpaiva/osu-parser';
import fs from 'fs';

// Path of local .osr file
const filePath = './osu-replay-input.osr';
// Read file contents synchronously and stores it in a buffer
const buffer = fs.readFileSync(filePath);
// Parses the buffer to a OsuReplay
const replay = OsuReplay.parse(buffer);

console.log(replay);
```

Writing to a file
```ts
import { OsuReplay } from '@brunohpaiva/osu-parser';
import fs from 'fs';

// Creates a new replay
const replay = new OsuReplay();

// Set some data to it
replay.type = 0; // osu! standard
replay.gameVersion = 20200724;
replay.beatmapHash = 'hash';
replay.playerName = 'player';
replay.replayHash = 'hash';
replay.count300s = 100;
replay.count100s = 50;
replay.count50s = 25;
replay.countGekis = 0;
replay.countKatus = 5;
replay.countMisses = 1;
replay.totalScore = 1953902;
replay.greatestCombo = 328;
replay.perfectCombo = false;
replay.modsUsed = ['DoubleTime'];
replay.lifeBarGraph = 'lifeBar';
replay.windowsTicks = 637321042198407465n;
replay.actions = [
  {
    timestamp: 10, // Time in milliseconds since previous action
    x: 10, // x coordinate from 0 to 512
    y: 23, // y coordinate from 0 to 384
    buttons: ['KeyboardOne'],
  },
  // More actions
];
replay.onlineScoreId = 98247527n;

const osuBuffer = replay.writeToOsuBuffer();
const buffer = osuBuffer.buffer;

// Path to store the generated .osr file
const filePath = './osu-replay-output.osr';
// Writes the buffer to a file synchronously
fs.writeFileSync(filePath, buffer);
```

#### OsuBuffer

Reading and writing with a `OsuBuffer`
```ts
import { OsuBuffer } from '@brunohpaiva/osu-parser';

// Initialize a empty buffer.
const osuBuffer = new OsuBuffer();
osuBuffer.writeInt(10);
osuBuffer.writeVarChar('A text');
osuBuffer.writeByte(5);

console.log(osuBuffer.buffer);
// Output: <Buffer 0a 00 00 00 0b 06 41 20 74 65 78 74 05>

console.log(osuBuffer.readInt());
// Output: 10

console.log(osuBuffer.readVarChar());
// Output: A text
```
