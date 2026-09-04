function getDhakaYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month =
    Number(parts.find((part) => part.type === "month")?.value) - 1;

  return { year, month };
}

export function getCurrentRunningBatches(
  date = new Date()
): number[] {
  const { year, month } = getDhakaYearMonth(date);

  // July 2026 = Batch 29 as the first current batch
  const BASE_YEAR = 2026;
  const BASE_MONTH = 6; // July
  const BASE_BATCH = 29;

  const BATCH_COUNT = 8;

  const monthDifference =
    (year - BASE_YEAR) * 12 + (month - BASE_MONTH);

  const sixMonthPeriods = Math.floor(monthDifference / 6);

  const firstBatch =
    BASE_BATCH + Math.max(0, sixMonthPeriods);

  return Array.from(
    { length: BATCH_COUNT },
    (_, index) => firstBatch + index
  );
}

export function isCurrentRunningBatch(
  batch: number,
  date = new Date()
): boolean {
  return getCurrentRunningBatches(date).includes(batch);
}

export function getCurrentPeriodLabel(
  date = new Date()
): string {
  const { year, month } = getDhakaYearMonth(date);

  return month < 6
    ? `${year} January–June`
    : `${year} July–December`;
}
