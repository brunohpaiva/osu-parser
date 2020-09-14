import test from 'ava';

import { ticksFromDate, ticksToDate } from './netTicks';

test('can convert Date to .NET ticks', (t) => {
  const date = new Date('2020-08-04T02:16:59.840Z');
  t.is(ticksFromDate(date), 637321042198400000n);
});

test('can convert .NET ticks to Date', (t) => {
  t.deepEqual(
    ticksToDate(637321042198400000n),
    new Date('2020-08-04T02:16:59.840Z')
  );
});
