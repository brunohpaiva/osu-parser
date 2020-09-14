/**
 * Time in milliseconds since 12:00:00 midnight, January 1, 0001.
 * @internal
 */
const NET_START_DATE = new Date('0001-01-01').getTime();
/**
 * {@link NET_START_DATE} in seconds.
 * @internal
 */
const SECONDS_TO_EPOCH = -NET_START_DATE / 1000;
/**
 * Number of ticks in a millisecond.
 * @internal
 */
const TICKS_PER_MS = 10000;
/**
 * Number of milliseconds in a second.
 * @internal
 */
const MS_PER_SEC = 1000;

/**
 * Converts .NET ticks to a {@link Date}.
 * @internal
 * @param value Number of .NET ticks to convert.
 * @returns The date representing the .NET ticks.
 */
export function ticksToDate(value: bigint) {
  return new Date(
    Number((value * 100n) / BigInt(TICKS_PER_MS)) / 100 + NET_START_DATE
  );
}

/**
 * Converts milliseconds to .NET ticks.
 * @internal
 * @param value Number of milliseconds to convert.
 * @returns Number of .NET ticks representing the specified milliseconds.
 */
export function ticksFromMilliseconds(value: number) {
  return BigInt((value + SECONDS_TO_EPOCH * MS_PER_SEC) * TICKS_PER_MS);
}

/**
 * Converts a {@link Date} to .NET ticks.
 * @internal
 * @param value The date to convert.
 * @returns Number of .NET ticks representing the specified {@link Date}.
 */
export function ticksFromDate(value: Date) {
  return ticksFromMilliseconds(value.getTime());
}
