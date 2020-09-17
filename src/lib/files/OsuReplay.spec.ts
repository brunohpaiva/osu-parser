import fs from 'fs';

import test from 'ava';

import { OsuReplay } from './OsuReplay';

test('able to write OsuReplay to buffer', (t) => {
  const replay = new OsuReplay();
  replay.type = 0;
  replay.gameVersion = 20200724;
  replay.beatmapHash = 'beatmaphash';
  replay.playerName = 'brunohpaiva';
  replay.replayHash = 'replayhash';
  replay.count300s = 261;
  replay.count100s = 7;
  replay.count50s = 0;
  replay.countGekis = 57;
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
      timestamp: 0,
      x: 10,
      y: 23,
      buttons: ['KeyboardOne'],
    },
    {
      timestamp: 3,
      x: 53,
      y: 200,
      buttons: ['KeyboardTwo', 'MouseTwo'],
    },
    {
      timestamp: -12345,
      x: 0,
      y: 0,
      rngSeed: 654321,
    },
  ];
  replay.onlineScoreId = 98247527n;

  const { buffer } = replay.writeToOsuBuffer();
  const expectedBuffer = fs.readFileSync(
    './test/osu-replay-output-expected.osr'
  );

  t.deepEqual(buffer, expectedBuffer);
});

test('able to parse OsuReplay from buffer', (t) => {
  const buffer = fs.readFileSync('./test/osu-replay-input.osr');
  const replay = OsuReplay.parse(buffer);

  t.like(replay, <OsuReplay>{
    type: 0,
    gameVersion: 20151228,
    beatmapHash: 'a5101f2dfa293807c894922b2876ea8d',
    playerName: 'Weabole',
    replayHash: 'b4f0ae8f74f810952f7677c180408d12',
    count300s: 264,
    count100s: 5,
    count50s: 0,
    countGekis: 59,
    countKatus: 4,
    countMisses: 0,
    totalScore: 3549720,
    greatestCombo: 396,
    perfectCombo: true,
    modsUsed: ['Hidden', 'HardRock', 'DoubleTime'],
    windowsTicks: 636897556980000000n,
    onlineScoreId: 2772099850n,
  });
  t.regex(replay.lifeBarGraph, /^(\d+\|[0-9.?]+,?)*$/);
  t.regex(replay.data, /^(-?\d+\|-?[0-9.]+\|-?[0-9.]+\|\d+,?){4658}$/);
  t.true(replay.actions.length === 4658); // 4657 actions + RNG seed
});

test('able to convert .NET ticks to date and vice-versa', (t) => {
  const replay = new OsuReplay();
  const date = new Date(2020, 8, 15, 0, 0, 0, 0);
  replay.date = date;
  t.is(replay.windowsTicks, 637357356000000000n);
  t.deepEqual(replay.date, date);
});
